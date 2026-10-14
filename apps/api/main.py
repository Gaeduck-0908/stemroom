"""Stemroom's local inference adapter.

Uses the local CUDA-enabled HTDemucs six-stem model by default. Set
STEM_ENGINE_CMD to override it with a command that accepts {input}, {output},
and {job_id} placeholders. A custom engine must write vocals.wav, drums.wav,
bass.wav, guitar.wav, piano.wav, and other.wav into {output}.
"""
from __future__ import annotations

import os
import shutil
import subprocess
import sys
import uuid
from pathlib import Path
from typing import Literal

from fastapi import BackgroundTasks, FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
import imageio_ffmpeg
from pydantic import BaseModel

ROOT = Path(os.getenv("STEMROOM_DATA", "./data")).resolve()
ROOT.mkdir(parents=True, exist_ok=True)
STEMS = ("vocals", "drums", "bass", "guitar", "piano", "other")
ENGINE = os.getenv("STEM_ENGINE_CMD", "")
jobs: dict[str, dict] = {}

app = FastAPI(title="Stemroom API", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "*").split(","),
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


class Job(BaseModel):
    id: str
    status: Literal["queued", "processing", "ready", "failed"]
    progress: int
    label: str
    message: str
    downloads: dict[str, dict[str, str]] = {}
    zip_url: str | None = None


def update(job_id: str, **values: object) -> None:
    jobs[job_id].update(values)


def create_archive(output: Path) -> Path:
    archive_base = output.parent / "stems"
    return Path(shutil.make_archive(str(archive_base), "zip", output))


def ffmpeg() -> str:
    return imageio_ffmpeg.get_ffmpeg_exe()


def as_wav(source: Path, job_dir: Path) -> Path:
    """Normalize MP3/WAV input through the bundled FFmpeg binary."""
    normalized = job_dir / "input.wav"
    subprocess.run(
        [ffmpeg(), "-y", "-i", str(source), "-ar", "44100", "-ac", "2", str(normalized)],
        check=True,
        capture_output=True,
        text=True,
    )
    return normalized


def make_mp3(source: Path, destination: Path) -> None:
    subprocess.run(
        [ffmpeg(), "-y", "-i", str(source), "-codec:a", "libmp3lame", "-b:a", "320k", str(destination)],
        check=True,
        capture_output=True,
        text=True,
    )


def run_default_engine(job_id: str, source: Path, job_dir: Path, output: Path) -> None:
    """Run the tested HTDemucs six-stem model on the local CUDA GPU."""
    update(job_id, status="processing", progress=14, label="곡 구조 분석", message="GPU가 보컬과 악기 성분을 분석하고 있습니다.")
    normalized = as_wav(source, job_dir)
    model_root = job_dir / "demucs"
    update(job_id, progress=28, label="6스템 분리", message="보컬·드럼·베이스·기타·피아노·기타 악기를 추출하고 있습니다.")
    subprocess.run(
        [sys.executable, "-m", "demucs.separate", "-n", "htdemucs_6s", "-d", "cuda", "-o", str(model_root), str(normalized)],
        check=True,
        capture_output=True,
        text=True,
        timeout=60 * 45,
    )
    separated = model_root / "htdemucs_6s" / "input"
    output.mkdir(parents=True, exist_ok=True)
    for stem in STEMS:
        source_stem = separated / f"{stem}.wav"
        if not source_stem.exists():
            raise RuntimeError(f"Demucs 결과에서 {stem} 스템을 찾지 못했습니다.")
        wav = output / f"{stem}.wav"
        shutil.copy2(source_stem, wav)
        make_mp3(wav, output / f"{stem}.mp3")
    shutil.rmtree(model_root, ignore_errors=True)
    normalized.unlink(missing_ok=True)


def process(job_id: str, input_path: Path, output: Path) -> None:
    try:
        if ENGINE:
            update(job_id, status="processing", progress=14, label="외부 엔진 실행", message="구성한 분리 엔진을 실행하고 있습니다.")
            output.mkdir(parents=True, exist_ok=True)
            command = ENGINE.format(input=input_path, output=output, job_id=job_id)
            result = subprocess.run(command, shell=True, text=True, capture_output=True, timeout=60 * 45)
            if result.returncode:
                raise RuntimeError(result.stderr[-700:] or "분리 엔진이 오류를 반환했습니다.")
        else:
            run_default_engine(job_id, input_path, input_path.parent, output)
        update(job_id, progress=88, label="파일 정리", message="브라우저에서 열 수 있는 결과를 만들고 있습니다.")
        missing = [stem for stem in STEMS if not (output / f"{stem}.wav").exists()]
        if missing:
            raise RuntimeError(f"분리 엔진 결과에 필요한 스템이 없습니다: {', '.join(missing)}")
        downloads = {stem: {"wav": f"/jobs/{job_id}/download/{stem}/wav"} for stem in STEMS}
        for stem in STEMS:
            if (output / f"{stem}.mp3").exists():
                downloads[stem]["mp3"] = f"/jobs/{job_id}/download/{stem}/mp3"
        archive = create_archive(output)
        update(job_id, status="ready", progress=100, label="분리 완료", message="6개의 스템이 준비되었습니다.", downloads=downloads, zip_url=f"/jobs/{job_id}/download/zip")
    except Exception as error:  # surfaced to the user as actionable job state
        update(job_id, status="failed", progress=0, label="분리 작업 실패", message=str(error))
    finally:
        input_path.unlink(missing_ok=True)


@app.get("/health")
def health() -> dict[str, bool]:
    return {"ok": True, "engine_configured": True, "custom_engine": bool(ENGINE)}


@app.post("/jobs", response_model=Job)
async def create_job(background_tasks: BackgroundTasks, file: UploadFile = File(...)) -> Job:
    if file.content_type not in {"audio/mpeg", "audio/wav", "audio/x-wav"}:
        raise HTTPException(415, "MP3 또는 WAV 파일만 올릴 수 있습니다.")
    job_id = uuid.uuid4().hex
    directory = ROOT / job_id
    directory.mkdir()
    suffix = Path(file.filename or "audio.wav").suffix.lower() or ".wav"
    source = directory / f"source{suffix}"
    with source.open("wb") as destination:
        while chunk := await file.read(1024 * 1024):
            destination.write(chunk)
    jobs[job_id] = Job(id=job_id, status="queued", progress=5, label="대기열 등록", message="분리 작업을 준비하고 있습니다.").model_dump()
    background_tasks.add_task(process, job_id, source, directory / "out")
    return Job(**jobs[job_id])


@app.get("/jobs/{job_id}", response_model=Job)
def read_job(job_id: str) -> Job:
    if job_id not in jobs:
        raise HTTPException(404, "작업을 찾을 수 없습니다.")
    return Job(**jobs[job_id])


@app.get("/jobs/{job_id}/download/{stem}/{format}")
def download_stem(job_id: str, stem: str, format: Literal["wav", "mp3"]) -> FileResponse:
    if stem not in STEMS:
        raise HTTPException(404, "알 수 없는 스템입니다.")
    path = ROOT / job_id / "out" / f"{stem}.{format}"
    if not path.exists():
        raise HTTPException(404, "요청한 형식의 파일이 아직 없습니다.")
    return FileResponse(path, media_type=f"audio/{format}", filename=path.name)


@app.get("/jobs/{job_id}/download/zip")
def download_zip(job_id: str) -> FileResponse:
    path = ROOT / job_id / "stems.zip"
    if not path.exists():
        raise HTTPException(404, "ZIP 파일이 아직 없습니다.")
    return FileResponse(path, media_type="application/zip", filename="stemroom-stems.zip")


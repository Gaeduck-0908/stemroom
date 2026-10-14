<p align="center">
  <img src="./assets/brand/stemroom-banner-wordmark.png" alt="STEMROOM over an abstract six-channel audio visualization" width="100%" />
</p>

<h1 align="center">Stemroom</h1>

<p align="center">
  A private, local-first workspace for turning one track into a playable six-stem mix.
  <br />
  <a href="./docs/README.ko.md">한국어 README</a> · <a href="./docs/ARCHITECTURE.md">Architecture</a> · <a href="./CONTRIBUTING.md">Contributing</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/runtime-local--first-1e2933?style=flat-square" alt="Local first" />
  <img src="https://img.shields.io/badge/stems-6-4981b7?style=flat-square" alt="Six stems" />
  <img src="https://img.shields.io/badge/license-MIT-5f9f84?style=flat-square" alt="MIT license" />
</p>

Stemroom runs audio separation on your own machine. Drop in an MP3 or WAV, separate it into **vocals, drums, bass, guitar, piano, and other instruments**, then audition, mute, solo, level, and export each stem.

> This is a local tool, not a hosted upload service. With the default configuration, your audio is sent only to `localhost`.

## What it does

- Separates MP3 and WAV input into six stable stems with HTDemucs 6-source.
- Produces WAV, 320 kbps MP3, and a ZIP containing every output.
- Plays all separated stems in sync in the browser with per-stem volume, mute, and solo.
- Includes an English / Korean interface switcher.
- Uses a buildless web UI and a small FastAPI adapter—easy to inspect, run, and extend.

## Quick start

### 1. Clone and prepare the API

```powershell
git clone https://github.com/Gaeduck-0908/stemroom.git
cd stemroom

python -m venv apps/api/.venv
.\apps\api\.venv\Scripts\Activate.ps1
pip install torch==2.11.0 torchaudio==2.11.0 --index-url https://download.pytorch.org/whl/cu128
pip install -r apps/api/requirements.txt
```

The CUDA command above targets NVIDIA GPUs. For CPU-only or a different accelerator, install the matching PyTorch build first, then install `apps/api/requirements.txt`.

### 2. Start Stemroom

```powershell
.\scripts\start-stemroom.ps1
```

Open [http://localhost:4173](http://localhost:4173), choose an MP3 or WAV, and start separation. The default local API is `http://localhost:8000`.

## Project map

```text
apps/
  api/                 FastAPI inference adapter and Python requirements
  web/                 Buildless browser application and EN/KR strings
assets/brand/          README banner and project visual assets
docs/                  Architecture and localized documentation
scripts/               Local start helpers
```

## API contract

| Endpoint | Purpose |
| --- | --- |
| `POST /jobs` | Upload an MP3/WAV and create a separation job |
| `GET /jobs/{id}` | Read job status and output URLs |
| `GET /jobs/{id}/download/{stem}/{format}` | Download an individual WAV or MP3 stem |
| `GET /jobs/{id}/download/zip` | Download all stems as a ZIP |
| `GET /health` | Check the local engine |

Set `STEM_ENGINE_CMD` to use another engine. It receives `{input}`, `{output}`, and `{job_id}` placeholders and must write `vocals.wav`, `drums.wav`, `bass.wav`, `guitar.wav`, `piano.wav`, and `other.wav` into `{output}`.

## A note on quality

Stem separation is an estimation task. Results depend on the mix, arrangement, mastering, and source quality. The stable six-stem mode groups guitars together; it does not claim to distinguish rhythm and lead guitar.

## Contributing and license

Please read [CONTRIBUTING.md](./CONTRIBUTING.md) before opening a pull request. Stemroom is released under the [MIT License](./LICENSE).


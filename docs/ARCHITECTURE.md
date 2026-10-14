# Architecture

Stemroom intentionally keeps the application split into two small, inspectable parts.

```text
Browser (apps/web) ── multipart upload ──> FastAPI (apps/api) ──> HTDemucs / CUDA
       │                                           │
       └── synchronized Web Audio playback <── WAV / MP3 / ZIP downloads
```

## Web app

`apps/web` is a static, buildless interface. It handles language selection, upload state, job polling, synchronized Web Audio playback, stem-level volume/mute/solo, and downloads.

## API

`apps/api` exposes a compact local API. By default it runs HTDemucs 6-source separation on CUDA, then produces WAV, MP3, and ZIP outputs. Set `STEM_ENGINE_CMD` to delegate to a compatible custom engine.

## Privacy model

The browser sends the selected file only to the configured local API URL. With the default setup that is `http://localhost:8000`. Source files and temporary Demucs output are removed after processing; downloadable stems stay in the local API data directory until you remove them.


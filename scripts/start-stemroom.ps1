$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$api = Join-Path $root "apps\api"
$python = Join-Path $api ".venv\Scripts\python.exe"

if (-not (Test-Path $python)) { throw "The API virtual environment is missing. Follow the setup steps in README.md first." }
if (-not (Get-NetTCPConnection -LocalPort 8000 -State Listen -ErrorAction SilentlyContinue)) {
  Start-Process -FilePath $python -WorkingDirectory $api -WindowStyle Hidden -ArgumentList "-m", "uvicorn", "main:app", "--host", "127.0.0.1", "--port", "8000"
}
if (-not (Get-NetTCPConnection -LocalPort 4173 -State Listen -ErrorAction SilentlyContinue)) {
  Start-Process -FilePath "node.exe" -WorkingDirectory $root -WindowStyle Hidden -ArgumentList "server.js"
}
Start-Sleep -Milliseconds 700
Start-Process "http://localhost:4173"


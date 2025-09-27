<#
Quick script to run the backend on Windows PowerShell.
Usage: Open PowerShell in the 'back' folder and run: .\run-backend.ps1

It will:
- Activate .venv if present
- Install requirements into .venv if missing (prompt)
- Start uvicorn at 127.0.0.1:8000
#>
param(
    [string]$EnvDatabaseUrl = ''
)

Push-Location -Path $PSScriptRoot

if (Test-Path -Path '.venv') {
    Write-Host "Activating .venv..."
    . .\.venv\Scripts\Activate.ps1
} else {
    Write-Host "No .venv found. It's recommended to create one: python -m venv .venv"
}

if (Test-Path -Path 'requirements.txt') {
    $need = Read-Host "Install requirements? (y/N)"
    if ($need -eq 'y') { pip install -r requirements.txt }
}

if ($EnvDatabaseUrl) { $env:DATABASE_URL = $EnvDatabaseUrl }

Write-Host "Starting backend at http://127.0.0.1:8000"
uvicorn app:app --reload --host 127.0.0.1 --port 8000

Pop-Location

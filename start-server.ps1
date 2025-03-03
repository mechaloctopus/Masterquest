# PowerShell script to start the Python HTTP server
Write-Host "Starting HTTP server on port 8000..."
Set-Location -Path $PSScriptRoot
python -m http.server 8000 
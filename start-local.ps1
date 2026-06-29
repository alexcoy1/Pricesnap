# PriceSnap — start the full local sales application (no cloud required)
$ErrorActionPreference = "Stop"
$root = $PSScriptRoot

function Find-Node {
  $cmd = Get-Command node -ErrorAction SilentlyContinue
  $candidates = @(
    $(if ($cmd) { $cmd.Source }),
    "$env:ProgramFiles\nodejs\node.exe",
    "$env:ProgramFiles (x86)\nodejs\node.exe",
    "$env:LOCALAPPDATA\Programs\node\node.exe"
  ) | Where-Object { $_ -and (Test-Path $_) }
  return $candidates | Select-Object -First 1
}

$node = Find-Node

if ($node) {
  Write-Host ""
  Write-Host "PriceSnap — full stack (React + API)" -ForegroundColor Cyan
  Write-Host "  Frontend: http://localhost:5173"
  Write-Host "  API:      http://localhost:3001"
  Write-Host ""
  $npm = Join-Path (Split-Path $node) "npm.cmd"
  if (-not (Test-Path "$root\node_modules")) {
    Write-Host "Installing root dependencies..."
    & $npm install --prefix $root
  }
  if (-not (Test-Path "$root\frontend\node_modules")) {
    Write-Host "Installing frontend dependencies..."
    & $npm install --prefix "$root\frontend"
  }
  if (-not (Test-Path "$root\backend\node_modules")) {
    Write-Host "Installing backend dependencies..."
    & $npm install --prefix "$root\backend"
  }
  Write-Host "Starting backend and frontend..."
  & $npm run dev --prefix $root
} else {
  Write-Host ""
  Write-Host "PriceSnap — local sales application" -ForegroundColor Cyan
  Write-Host "  URL: http://127.0.0.1:8766"
  Write-Host "  Create an account from the landing page to start"
  Write-Host ""
  Write-Host "Node.js is not installed. Running the self-contained app (all features, data saved in your browser)."
  Write-Host "To use the React dev stack later, install Node LTS: https://nodejs.org"
  Write-Host ""
  & "$root\standalone\serve.ps1"
}

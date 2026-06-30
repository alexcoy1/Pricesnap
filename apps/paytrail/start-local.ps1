# PayTrail — start local dev server in your browser
param(
  [switch]$Ai
)

$ErrorActionPreference = "Stop"
$root = $PSScriptRoot

function Find-Node {
  $cmd = Get-Command node -ErrorAction SilentlyContinue
  $candidates = @(
    $(if ($cmd) { $cmd.Source }),
    "$root\.tools\node\node.exe",
    "$env:ProgramFiles\nodejs\node.exe",
    "$env:ProgramFiles (x86)\nodejs\node.exe",
    "$env:LOCALAPPDATA\Programs\node\node.exe",
    "$env:LOCALAPPDATA\Programs\cursor\resources\app\resources\helpers\node.exe"
  ) | Where-Object { $_ -and (Test-Path $_) }
  return $candidates | Select-Object -First 1
}

$node = Find-Node
if (-not $node) {
  Write-Host ""
  Write-Host "Node.js not found — starting standalone PayTrail (no install needed)." -ForegroundColor Yellow
  Write-Host "  URL: http://127.0.0.1:5174"
  Write-Host "  For the full React app, install Node LTS: https://nodejs.org"
  Write-Host ""
  & "$root\standalone\serve.ps1"
  exit
}

$npm = Join-Path (Split-Path $node) "npm.cmd"
Set-Location $root

if (-not (Test-Path "$root\node_modules")) {
  Write-Host "Installing PayTrail dependencies..."
  & $npm install
}

$hasEnv = Test-Path "$root\.env"
$useAi = $Ai -or ($hasEnv -and (Select-String -Path "$root\.env" -Pattern 'ANTHROPIC_API_KEY=\S+' -Quiet))

Write-Host ""
Write-Host "PayTrail — local dev" -ForegroundColor Green
if ($useAi) {
  if (-not $hasEnv) {
    Write-Host "  Copy .env.example to .env and set ANTHROPIC_API_KEY for AI matching." -ForegroundColor Yellow
  }
  Write-Host "  URL: http://localhost:8888  (Vite + Claude API)"
  Write-Host "  Mode: netlify dev"
  Write-Host ""
  & $npm run dev:api
} else {
  Write-Host "  URL: http://localhost:3000  (React app)"
  Write-Host "  For Claude API: copy .env.example -> .env, add key, run: start.bat -Ai"
  Write-Host ""
  & $npm run dev
}

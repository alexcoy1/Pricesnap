# PayTrail — deploy to Netlify from your PC (after GitHub push)
# Run: powershell -ExecutionPolicy Bypass -File scripts\netlify-deploy.ps1

$ErrorActionPreference = "Stop"
$paytrailRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
Set-Location $paytrailRoot

$node = Join-Path $paytrailRoot ".tools\node\node.exe"
if (-not (Test-Path $node)) {
  $node = (Get-Command node -ErrorAction SilentlyContinue)?.Source
}
if (-not $node) {
  Write-Host "Node.js required. Install from https://nodejs.org or run start-local.ps1 once." -ForegroundColor Red
  pause
  exit 1
}

$nodeDir = Split-Path $node
$env:PATH = "$nodeDir;$env:PATH"
$npm = Join-Path $nodeDir "npm.cmd"
if (-not (Test-Path $npm)) { $npm = "npm" }

function Invoke-Netlify {
  param([string[]]$Args)
  & $npm exec -- netlify @Args
  if ($LASTEXITCODE -ne 0) { throw "netlify $($Args -join ' ') failed" }
}

Write-Host ""
Write-Host "PayTrail — Netlify deploy" -ForegroundColor Cyan
Write-Host ""

$status = & $npm exec -- netlify status 2>&1 | Out-String
if ($status -match "Not logged in") {
  Write-Host "Opening Netlify login in your browser..."
  Invoke-Netlify @("login")
}

if (-not (Test-Path ".netlify\state.json")) {
  Write-Host "Creating new Netlify site (paytrail-app)..."
  $siteName = "paytrail-" + (Get-Random -Maximum 99999)
  Invoke-Netlify @("sites:create", "--name", $siteName)
  Invoke-Netlify @("link", "--name", $siteName)
}

Write-Host "Building and deploying to production..."
Invoke-Netlify @("deploy", "--build", "--prod")

$url = & $npm exec -- netlify status 2>&1 | Out-String
if ($url -match "https://[^\s]+") {
  Write-Host ""
  Write-Host "Live site:" -ForegroundColor Green
  Write-Host $Matches[0]
}
Write-Host ""
Write-Host "Optional: Netlify dashboard -> Environment variables -> ANTHROPIC_API_KEY" -ForegroundColor Yellow
Write-Host ""
pause

# PayTrail — one-shot: push to GitHub + connect Netlify
# Double-click setup-deploy.bat in apps/paytrail

$ErrorActionPreference = "Stop"
$paytrailRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$repoRoot = (Resolve-Path (Join-Path $paytrailRoot "..\..")).Path
Set-Location $repoRoot

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  PayTrail — GitHub + Netlify setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Repo:    $repoRoot"
Write-Host "App:     $paytrailRoot"
Write-Host ""

function Find-Git {
  $cmd = Get-Command git -ErrorAction SilentlyContinue
  if ($cmd) { return $cmd.Source }
  foreach ($p in @(
    "$env:ProgramFiles\Git\cmd\git.exe",
    "$env:ProgramFiles\Git\bin\git.exe",
    "$env:LOCALAPPDATA\Programs\Git\cmd\git.exe"
  )) { if (Test-Path $p) { return $p } }
  return $null
}

$git = Find-Git
if (-not $git) {
  Write-Host "Git is not installed. Install from https://git-scm.com/download/win" -ForegroundColor Red
  pause
  exit 1
}

function Invoke-Git {
  param([string[]]$Args)
  & $git -c user.name="PayTrail Deploy" -c user.email="deploy@paytrail.local" @Args
  if ($LASTEXITCODE -ne 0) { throw "git $($Args -join ' ') failed (exit $LASTEXITCODE)" }
}

Write-Host "[1/4] Staging PayTrail..."
Invoke-Git add .gitignore apps/paytrail

$status = & $git status --porcelain apps/paytrail .gitignore
if ($status) {
  Write-Host "[2/4] Committing..."
  Invoke-Git commit -m "Add PayTrail commission app for Netlify deploy."
  Write-Host "Committed." -ForegroundColor Green
} else {
  Write-Host "[2/4] Nothing new to commit."
}

$existing = & $git remote get-url origin 2>$null
if (-not $existing) {
  Write-Host ""
  Write-Host "No GitHub remote. Create repo at https://github.com/new (name: pricesnap)" -ForegroundColor Yellow
  Start-Process "https://github.com/new"
  $remoteUrl = Read-Host "Paste repo URL (e.g. https://github.com/YOURNAME/pricesnap.git)"
  Invoke-Git remote add origin $remoteUrl.Trim()
} else {
  Write-Host "[3/4] Remote: $existing"
}

Write-Host "[4/4] Pushing to GitHub..."
Write-Host "  (Sign in to GitHub in the browser if prompted)"
try {
  Invoke-Git push -u origin main
  Write-Host "Push successful!" -ForegroundColor Green
} catch {
  Write-Host "Push failed. Try: git push -u origin main" -ForegroundColor Red
  pause
  exit 1
}

Write-Host ""
Write-Host "Connect Netlify (new site — separate from PriceSnap):" -ForegroundColor Cyan
Write-Host "  Opening Netlify..."
Start-Process "https://app.netlify.com/start"
Write-Host ""
Write-Host "  1. Import GitHub repo: Pricesnap"
Write-Host "  2. Base directory:     apps/paytrail"
Write-Host "  3. Build command:      npm run build"
Write-Host "  4. Publish directory:  dist"
Write-Host "  5. Deploy site"
Write-Host "  6. Optional: Site settings -> Environment variables -> ANTHROPIC_API_KEY"
Write-Host ""
Write-Host "Done." -ForegroundColor Green
pause

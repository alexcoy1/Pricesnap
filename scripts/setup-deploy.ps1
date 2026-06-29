# PriceSnap — one-shot setup: GitHub + Netlify deploy
# Double-click or run: powershell -ExecutionPolicy Bypass -File scripts\setup-deploy.ps1

$ErrorActionPreference = "Stop"
$root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
Set-Location $root
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  PriceSnap — GitHub + Netlify setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Project: $root"
Write-Host ""

function Find-Git {
  $cmd = Get-Command git -ErrorAction SilentlyContinue
  if ($cmd) { return $cmd.Source }
  foreach ($p in @(
    "$env:ProgramFiles\Git\bin\git.exe",
    "$env:ProgramFiles (x86)\Git\bin\git.exe",
    "$env:LOCALAPPDATA\Programs\Git\bin\git.exe"
  )) { if (Test-Path $p) { return $p } }
  return $null
}

$git = Find-Git
if (-not $git) {
  Write-Host "Git is not installed." -ForegroundColor Yellow
  Write-Host "Installing Git for Windows (approve the installer if prompted)..."
  winget install --id Git.Git -e --accept-source-agreements --accept-package-agreements
  $git = Find-Git
  if (-not $git) {
    Write-Host "Could not install Git. Install manually: https://git-scm.com/download/win" -ForegroundColor Red
    Write-Host "Then run this script again."
    pause
    exit 1
  }
  Write-Host "Git installed. Close this window, open a NEW PowerShell, and run this script again." -ForegroundColor Green
  pause
  exit 0
}

function Invoke-Git {
  param([string[]]$Args)
  & $git @Args
  if ($LASTEXITCODE -ne 0) { throw "git $($Args -join ' ') failed (exit $LASTEXITCODE)" }
}

# --- Git repo ---
if (-not (Test-Path ".git")) {
  Write-Host "[1/5] Initializing git repository..."
  Invoke-Git init
  Invoke-Git branch -M main
} else {
  Write-Host "[1/5] Git repository already exists."
}

Write-Host "[2/5] Staging all files..."
Invoke-Git add .

$status = & $git status --porcelain
if ($status) {
  Invoke-Git commit -m "PriceSnap initial deploy"
  Write-Host "Committed." -ForegroundColor Green
} else {
  Write-Host "Nothing new to commit (already committed)."
}

# --- GitHub remote ---
$remoteUrl = ""
$existing = & $git remote get-url origin 2>$null
if ($existing) {
  Write-Host "[3/5] Remote already set: $existing"
  $remoteUrl = $existing
} else {
  Write-Host ""
  Write-Host "[3/5] Create a GitHub repository:" -ForegroundColor Yellow
  Write-Host "  1. Opening https://github.com/new in your browser"
  Write-Host "  2. Repository name: pricesnap"
  Write-Host "  3. Leave it EMPTY (no README, no .gitignore)"
  Write-Host "  4. Click Create repository"
  Write-Host ""
  Start-Process "https://github.com/new"
  $remoteUrl = Read-Host "Paste your repo URL (e.g. https://github.com/YOURNAME/pricesnap.git)"
  if (-not $remoteUrl.Trim()) { throw "No URL entered" }
  Invoke-Git remote add origin $remoteUrl.Trim()
}

Write-Host "[4/5] Pushing to GitHub..."
Write-Host "  (Sign in to GitHub in the browser if prompted)"
try {
  Invoke-Git push -u origin main
  Write-Host "Push successful!" -ForegroundColor Green
} catch {
  Write-Host ""
  Write-Host "Push failed. Common fixes:" -ForegroundColor Yellow
  Write-Host "  - Use a Personal Access Token as password: https://github.com/settings/tokens"
  Write-Host "  - Or install GitHub Desktop and publish from there"
  Write-Host ""
  Write-Host "After fixing, run: git push -u origin main"
  pause
  exit 1
}

# --- Netlify ---
Write-Host ""
Write-Host "[5/5] Connect Netlify" -ForegroundColor Yellow
Write-Host "  Opening Netlify new site page..."
Start-Process "https://app.netlify.com/start"
Write-Host ""
Write-Host "On Netlify:" -ForegroundColor Cyan
Write-Host '  1. Import from GitHub, choose pricesnap repo'
Write-Host '  2. Build settings auto-fill from netlify.toml'
Write-Host '  3. Add environment variable ANTHROPIC_API_KEY with your Claude key'
Write-Host '  4. Site configuration, Environment variables'
Write-Host '  5. Trigger deploy, Deploy site'
Write-Host ""
Write-Host "Done. Your code is on GitHub." -ForegroundColor Green
Write-Host "Finish Netlify in your browser." -ForegroundColor Green
Write-Host ""
pause

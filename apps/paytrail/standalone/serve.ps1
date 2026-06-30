$port = 5174
$root = $PSScriptRoot
$appRoot = Split-Path $root -Parent

$mime = @{
  '.html' = 'text/html; charset=utf-8'
  '.js'   = 'application/javascript; charset=utf-8'
  '.mjs'  = 'application/javascript; charset=utf-8'
  '.json' = 'application/json; charset=utf-8'
  '.css'  = 'text/css; charset=utf-8'
}

function Find-NodeExe {
  $cmd = Get-Command node -ErrorAction SilentlyContinue
  if ($cmd) { return $cmd.Source }
  $paths = @(
    "$env:ProgramFiles\nodejs\node.exe",
    "$env:ProgramFiles (x86)\nodejs\node.exe",
    "$env:LOCALAPPDATA\Programs\node\node.exe",
    "$env:LOCALAPPDATA\Programs\cursor\resources\app\resources\helpers\node.exe"
  )
  foreach ($p in $paths) { if (Test-Path $p) { return $p } }
  return $null
}

function Load-DotEnv {
  param([string]$Path)
  if (-not (Test-Path $Path)) { return }
  Get-Content $Path | ForEach-Object {
    if ($_ -match '^\s*([^#=]+)=(.*)$') {
      $name = $matches[1].Trim()
      $val = $matches[2].Trim().Trim('"')
      [Environment]::SetEnvironmentVariable($name, $val, 'Process')
    }
  }
}

function Invoke-ExtractInvoice {
  param([string]$RequestBody, [string]$ApiKey)

  $node = Find-NodeExe
  if (-not $node) {
    throw 'Claude invoice reading requires Node.js. Install from https://nodejs.org or run npm run dev:api from apps/paytrail.'
  }

  $env:ANTHROPIC_API_KEY = $ApiKey
  $psi = New-Object System.Diagnostics.ProcessStartInfo
  $psi.FileName = $node
  $psi.Arguments = "`"$root\claude-bridge.mjs`""
  $psi.RedirectStandardInput = $true
  $psi.RedirectStandardOutput = $true
  $psi.RedirectStandardError = $true
  $psi.UseShellExecute = $false
  $psi.CreateNoWindow = $true
  $proc = [System.Diagnostics.Process]::Start($psi)
  $proc.StandardInput.Write($RequestBody)
  $proc.StandardInput.Close()
  $stdout = $proc.StandardOutput.ReadToEnd()
  $stderr = $proc.StandardError.ReadToEnd()
  $proc.WaitForExit()
  if ($proc.ExitCode -ne 0) {
    $err = $stderr.Trim()
    if ($err.StartsWith('{')) {
      $parsed = $err | ConvertFrom-Json
      throw $parsed.error
    }
    throw $(if ($err) { $err } else { 'Claude bridge failed' })
  }
  return $stdout
}

function Write-JsonResponse {
  param($Context, [int]$StatusCode, [string]$Json)
  $bytes = [System.Text.Encoding]::UTF8.GetBytes($Json)
  $Context.Response.StatusCode = $StatusCode
  $Context.Response.ContentType = 'application/json; charset=utf-8'
  $Context.Response.Headers.Add('Access-Control-Allow-Origin', '*')
  $Context.Response.Headers.Add('Access-Control-Allow-Headers', 'Content-Type, X-Anthropic-Key')
  $Context.Response.ContentLength64 = $bytes.Length
  $Context.Response.OutputStream.Write($bytes, 0, $bytes.Length)
  $Context.Response.Close()
}

Load-DotEnv (Join-Path $appRoot '.env')

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://127.0.0.1:$port/")
$listener.Start()

Write-Host ""
Write-Host "PayTrail: http://127.0.0.1:$port/" -ForegroundColor Green
Write-Host "Invoice AI: add ANTHROPIC_API_KEY to apps/paytrail/.env or use Dev API key in the app"
Write-Host "Press Ctrl+C to stop"
Write-Host ""
Start-Process "http://127.0.0.1:$port/"

while ($listener.IsListening) {
  $context = $listener.GetContext()
  $path = $context.Request.Url.LocalPath
  $method = $context.Request.HttpMethod

  if ($method -eq 'OPTIONS' -and $path -eq '/api/ai/extract-invoice') {
    Write-JsonResponse -Context $context -StatusCode 204 -Json ''
    continue
  }

  if ($method -eq 'POST' -and $path -eq '/api/ai/extract-invoice') {
    try {
      $reader = New-Object System.IO.StreamReader($context.Request.InputStream, [System.Text.Encoding]::UTF8)
      $body = $reader.ReadToEnd()
      $apiKey = $context.Request.Headers['X-Anthropic-Key']
      if (-not $apiKey) { $apiKey = $env:ANTHROPIC_API_KEY }
      if (-not $apiKey) {
        throw 'Claude API key missing. Add ANTHROPIC_API_KEY to apps/paytrail/.env or paste a dev key in the app.'
      }
      $payload = $body | ConvertFrom-Json
      $bridgeBody = (@{
        apiKey = $apiKey
        invoice = $payload.invoice
        priceList = $payload.priceList
      } | ConvertTo-Json -Depth 20 -Compress)
      $result = Invoke-ExtractInvoice -RequestBody $bridgeBody -ApiKey $apiKey
      Write-JsonResponse -Context $context -StatusCode 200 -Json $result
    } catch {
      $err = @{ error = $_.Exception.Message; details = $_.Exception.Message } | ConvertTo-Json -Compress
      Write-JsonResponse -Context $context -StatusCode 500 -Json $err
    }
    continue
  }

  if ($path -eq '/') { $path = '/index.html' }
  $file = Join-Path $root ($path.TrimStart('/').Replace('/', '\'))
  try {
    if (Test-Path $file -PathType Leaf) {
      $ext = [System.IO.Path]::GetExtension($file).ToLower()
      $bytes = [System.IO.File]::ReadAllBytes($file)
      $context.Response.ContentType = if ($mime[$ext]) { $mime[$ext] } else { 'application/octet-stream' }
      $context.Response.ContentLength64 = $bytes.Length
      $context.Response.OutputStream.Write($bytes, 0, $bytes.Length)
      $context.Response.StatusCode = 200
    } else {
      $context.Response.StatusCode = 404
    }
  } catch {
    $context.Response.StatusCode = 500
  }
  $context.Response.Close()
}

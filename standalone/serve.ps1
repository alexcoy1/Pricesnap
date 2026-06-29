$port = 8766
$root = $PSScriptRoot

$mime = @{
  '.html' = 'text/html; charset=utf-8'
  '.js'   = 'application/javascript; charset=utf-8'
  '.json' = 'application/json; charset=utf-8'
  '.css'  = 'text/css; charset=utf-8'
  '.mjs'  = 'application/javascript; charset=utf-8'
}

function Find-NodeExe {
  $cmd = Get-Command node -ErrorAction SilentlyContinue
  if ($cmd) { return $cmd.Source }
  $paths = @(
    "$env:ProgramFiles\nodejs\node.exe",
    "$env:ProgramFiles (x86)\nodejs\node.exe",
    "$env:LOCALAPPDATA\Programs\node\node.exe"
  )
  foreach ($p in $paths) { if (Test-Path $p) { return $p } }
  return $null
}

function Invoke-ClaudeProxy {
  param([string]$RequestBody, [string]$ApiKey)

  $node = Find-NodeExe
  if (-not $node) {
    throw 'Claude matching requires Node.js for the local API proxy. Install Node LTS from https://nodejs.org or run the full stack with start.bat.'
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
    throw $(if ($stderr) { $stderr.Trim() } else { 'Claude proxy failed' })
  }
  return $stdout
}

function Write-JsonResponse {
  param($Context, [int]$StatusCode, [string]$Json)
  $bytes = [System.Text.Encoding]::UTF8.GetBytes($Json)
  $Context.Response.StatusCode = $StatusCode
  $Context.Response.ContentType = 'application/json; charset=utf-8'
  $Context.Response.ContentLength64 = $bytes.Length
  $Context.Response.OutputStream.Write($bytes, 0, $bytes.Length)
  $Context.Response.Close()
}

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://127.0.0.1:$port/")
$listener.Start()

Write-Host "PriceSnap: http://127.0.0.1:$port/"
Write-Host "Claude API: Settings -> Preferences -> paste your Anthropic key"
Start-Process "http://127.0.0.1:$port/"

while ($listener.IsListening) {
  $context = $listener.GetContext()
  $path = $context.Request.Url.LocalPath
  $method = $context.Request.HttpMethod

  if ($method -eq 'POST' -and $path -eq '/api/claude/match') {
    try {
      $reader = New-Object System.IO.StreamReader($context.Request.InputStream, [System.Text.Encoding]::UTF8)
      $body = $reader.ReadToEnd()
      $apiKey = $context.Request.Headers['X-Anthropic-Key']
      if (-not $apiKey) { throw 'Missing X-Anthropic-Key header. Add your Claude key in Settings.' }
      $result = Invoke-ClaudeProxy -RequestBody $body -ApiKey $apiKey
      Write-JsonResponse -Context $context -StatusCode 200 -Json $result
    } catch {
      $err = @{ error = $_.Exception.Message } | ConvertTo-Json -Compress
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

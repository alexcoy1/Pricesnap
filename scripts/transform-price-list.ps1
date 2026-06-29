# Parse 2026-Arctic-Spa-PriceSnap-Price-List.xlsx and flatten hot-tub names (model + tier, no series prefix).
param(
  [string]$InputXlsx = "$PSScriptRoot\..\frontend\public\2026-Arctic-Spa-PriceSnap-Price-List.xlsx",
  [string]$OutputJson = "$PSScriptRoot\..\frontend\public\sample-price-list.json"
)

function Get-SharedStrings([string]$xlsxPath) {
  $temp = Join-Path $env:TEMP "pricesnap-xlsx-$(Get-Random)"
  [System.IO.Compression.ZipFile]::ExtractToDirectory($xlsxPath, $temp)
  [xml]$sst = Get-Content (Join-Path $temp 'xl\sharedStrings.xml') -Raw
  $strings = @()
  foreach ($si in $sst.sst.si) {
    if ($si.t) { $strings += [string]$si.t }
    elseif ($si.r) {
      $text = ($si.r | ForEach-Object { $_.t }) -join ''
      $strings += $text
    }
  }
  Remove-Item $temp -Recurse -Force
  return $strings
}

function Get-SheetRows([string]$xlsxPath, [string[]]$strings) {
  $temp = Join-Path $env:TEMP "pricesnap-sheet-$(Get-Random)"
  [System.IO.Compression.ZipFile]::ExtractToDirectory($xlsxPath, $temp)
  [xml]$sheet = Get-Content (Join-Path $temp 'xl\worksheets\sheet1.xml') -Raw
  Remove-Item $temp -Recurse -Force
  $rows = @()
  foreach ($row in $sheet.worksheet.sheetData.row) {
    $cells = @{}
    foreach ($c in $row.c) {
      $col = [regex]::Match($c.r, '^([A-Z]+)').Groups[1].Value
      $cells[$col] = $c
    }
    if (-not $cells['A']) { continue }
    $a = $cells['A']
    $itemIdx = if ($a.t -eq 's') { [int]$a.v } else { $null }
    if ($null -eq $itemIdx) { continue }
    $item = $strings[$itemIdx]
    $price = if ($cells['B']) { [double]$cells['B'].v } else { 0 }
    $cost = if ($cells['C']) { [double]$cells['C'].v } else { 0 }
    if ($item -eq 'Item') { continue }
    $rows += [pscustomobject]@{ Item = $item; Price = $price; Cost = $cost }
  }
  return $rows
}

function Test-IsHotTub([string]$name) {
  if ($name -notmatch '^(AWP|Classic|Core|Custom) - (.+)$') { return $false }
  $rest = $Matches[2]
  $patterns = @(
    '^(?i)(prestige|signature|signtaure|select)\s+\d+''$',
    '^(?i)\d+\s*ft\s+classic\s*-\s*(prestige|signature)$',
    '^(?i)(athabascan|hudson|kingfisher|wolverine)$',
    '^(?i)(arctic fox|summit xl)\s+',
    '^(?i)(columbia|ocean|okanagan|polar bear|nova|timberwolf/whistler)\s+(prestige|signature|legend(\s*select)?)$',
    '^(?i)lunar/?\s*orion\s*-\s*(prestige|signature)$'
  )
  foreach ($p in $patterns) {
    if ($rest -match $p) { return $true }
  }
  return $false
}

function Convert-HotTubName([string]$name) {
  if ($name -notmatch '^(AWP|Classic|Core|Custom) - (.+)$') { return $name }
  $rest = $Matches[2]

  $map = @{
    "Prestige 7'"       = "Cub Prestige 7'"
    "Prestige 8'"       = "Cub Prestige 8'"
    "Signature 7'"      = "Cub Signature 7'"
    "Signature 8'"      = "Cub Signature 8'"
    "Select 8'"         = "Cub Legend Select 8'"
    '7 ft Classic - Prestige'   = "Classic Prestige 7'"
    '7 ft Classic - Signature'  = "Classic Signature 7'"
    '8 ft Classic - Prestige'   = "Classic Prestige 8'"
    '8 ft Classic - Signature'  = "Classic Signature 8'"
    'Lunar/ Orion - Prestige'   = 'Lunar Orion Prestige'
    'Lunar/Orion - Signature'   = 'Lunar Orion Signature'
    'Summit XL Signtaure'       = 'Summit XL Signature'
  }
  if ($map.ContainsKey($rest)) { return $map[$rest] }
  return $rest
}

Add-Type -AssemblyName System.IO.Compression.FileSystem
$strings = Get-SharedStrings $InputXlsx
$rows = Get-SheetRows $InputXlsx $strings

$out = foreach ($row in $rows) {
  $item = $row.Item
  if (Test-IsHotTub $item) { $item = Convert-HotTubName $item }
  [ordered]@{ Item = $item; Price = [math]::Round($row.Price, 2); Cost = [math]::Round($row.Cost, 2) }
}

$json = $out | ConvertTo-Json -Depth 3
$utf8NoBom = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText($OutputJson, $json, $utf8NoBom)
Write-Host "Wrote $($out.Count) items to $OutputJson"

$standalone = Join-Path (Split-Path $OutputJson -Parent) '..\standalone\sample-price-list.json' | Resolve-Path -ErrorAction SilentlyContinue
if (-not $standalone) {
  $standalone = Join-Path $PSScriptRoot '..\standalone\sample-price-list.json'
}
[System.IO.File]::WriteAllText($standalone, $json, $utf8NoBom)
Write-Host "Wrote $($out.Count) items to $standalone"

# PriceSnap local health check (no Node required)
$ErrorActionPreference = "Continue"
$base = "http://127.0.0.1:8766"
$ok = 0
$fail = 0

function Test-Item($name, $cond) {
  if ($cond) { Write-Host "[OK] $name" -ForegroundColor Green; $script:ok++ }
  else { Write-Host "[FAIL] $name" -ForegroundColor Red; $script:fail++ }
}

Write-Host ""
Write-Host "PriceSnap health check - $base"
Write-Host ""

try {
  $indexPage = Invoke-WebRequest "$base/" -UseBasicParsing -TimeoutSec 15
  Test-Item "App HTML served" ($indexPage.StatusCode -eq 200)
  Test-Item "Landing page present" ($indexPage.Content -match "landing-screen")
  Test-Item "Quote flow UI present" ($indexPage.Content -match "identify-items")
} catch { Test-Item "App HTML served" $false }

try {
  $matcher = Invoke-WebRequest "$base/categoryMatcher.js" -UseBasicParsing -TimeoutSec 5
  Test-Item "Matcher JS served" ($matcher.StatusCode -eq 200)
  Test-Item "Rule-based matcher export" ($matcher.Content -match "matchQuoteItemsRuleBased")
  Test-Item "SpaBoy matching rules" ($matcher.Content -match "spaboy")
  Test-Item "Cub matching rules" ($matcher.Content -match "cub")
} catch { Test-Item "Matcher JS served" $false }

try {
  $catalog = Invoke-WebRequest "$base/sample-price-list.json" -UseBasicParsing -TimeoutSec 5
  $items = $catalog.Content | ConvertFrom-Json
  Test-Item "Sample catalog served" ($catalog.StatusCode -eq 200)
  $names = @($items | ForEach-Object { $_.Item })
  Test-Item "Catalog has 28 SKUs" ($names.Count -eq 28)
  Test-Item "Cub Signature in catalog" (@($names | Where-Object { $_ -like "*Cub Signature*" }).Count -ge 1)
  Test-Item "SpaBoy in catalog" (@($names | Where-Object { $_ -match "SpaBoy" }).Count -ge 1)
} catch { Test-Item "Sample catalog served" $false }

Write-Host ""
Write-Host "$ok passed, $fail failed"
Write-Host ""
if ($fail -gt 0) {
  Write-Host "Start the app with start.bat then hard-refresh the browser"
  exit 1
}
exit 0

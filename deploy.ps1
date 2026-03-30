# Zet de huidige Romfix-site op Cloudflare Workers (wrangler.toml: yellow-recipe-5484).
#
# Eenmalig API-token: https://dash.cloudflare.com/profile/api-tokens
# Sjabloon "Edit Cloudflare Workers" of Custom met: Account / Workers Scripts → Edit
#
# In PowerShell, in deze map:
#   $env:CLOUDFLARE_API_TOKEN = "jouw-token"
#   .\deploy.ps1

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

if (-not $env:CLOUDFLARE_API_TOKEN) {
    Write-Host @"

Geen CLOUDFLARE_API_TOKEN. Voorbeeld:

  `$env:CLOUDFLARE_API_TOKEN = '...'   # van Cloudflare API Tokens
  .\deploy.ps1

"@ -ForegroundColor Yellow
    exit 1
}

if (-not (Test-Path "node_modules\wrangler")) {
    npm install
}
npx wrangler deploy
Write-Host ""
Write-Host "Controleer: https://yellow-recipe-5484.berntjanbosma.workers.dev/" -ForegroundColor Green

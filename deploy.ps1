# Build the ALEX.IO web app and optionally deploy it.
$ErrorActionPreference = "Stop"
Set-Location -Path (Split-Path -Parent $MyInvocation.MyCommand.Path)

Write-Host "Installing dependencies..." -ForegroundColor Cyan
npm --prefix web install --include=dev

Write-Host "Building web app..." -ForegroundColor Cyan
npm --prefix web run build

Write-Host ""
Write-Host "Build complete: web/dist" -ForegroundColor Green
Write-Host "Deploy options:"
Write-Host "  1. Vercel   -> vercel --prod"
Write-Host "  2. Netlify  -> netlify deploy --prod --dir=web/dist"
Write-Host "  3. Firebase -> firebase deploy --only hosting"
Write-Host "  4. Skip deploy"
$choice = Read-Host "Choose an option (1-4)"

switch ($choice) {
  "1" { npx vercel --prod }
  "2" { npx netlify-cli deploy --prod --dir=web/dist }
  "3" { npx firebase-tools deploy --only hosting }
  default { Write-Host "Skipping deploy." -ForegroundColor Yellow }
}

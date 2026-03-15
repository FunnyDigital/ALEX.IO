# Multi-Platform Deployment Script for ALEX.IO (PowerShell)
# =========================================================

Write-Host "🚀 Multi-Platform Deployment Script for ALEX.IO" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan

function Write-Info {
    param($Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

function Write-Success {
    param($Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Warning {
    param($Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param($Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Navigate to mobile directory
Set-Location mobile

Write-Info "Installing dependencies..."
npm install

Write-Info "Building for all platforms..."
npm run build:all

if ($LASTEXITCODE -eq 0) {
    Write-Success "Build completed successfully!"
} else {
    Write-Error "Build failed!"
    exit 1
}

# Go back to root directory
Set-Location ..

Write-Info "Available deployment options:"
Write-Host "1. Web (Vercel)" -ForegroundColor White
Write-Host "2. Web (Netlify)" -ForegroundColor White
Write-Host "3. Android (EAS Build)" -ForegroundColor White
Write-Host "4. iOS (EAS Build)" -ForegroundColor White
Write-Host "5. All platforms" -ForegroundColor White

$choice = Read-Host "Choose deployment option (1-5)"

switch ($choice) {
    1 {
        Write-Info "Deploying to Vercel..."
        vercel --prod
    }
    2 {
        Write-Info "Deploying to Netlify..."
        if (Get-Command netlify -ErrorAction SilentlyContinue) {
            netlify deploy --prod --dir=mobile/dist
        } else {
            Write-Warning "Netlify CLI not installed. Installing..."
            npm install -g netlify-cli
            netlify deploy --prod --dir=mobile/dist
        }
    }
    3 {
        Write-Info "Building Android app with EAS..."
        Set-Location mobile
        npx eas build --platform android --profile production
    }
    4 {
        Write-Info "Building iOS app with EAS..."
        Set-Location mobile
        npx eas build --platform ios --profile production
    }
    5 {
        Write-Info "Deploying to all platforms..."
        # Web deployment
        Write-Info "1/3 Deploying to Vercel..."
        vercel --prod
        
        # Mobile builds
        Set-Location mobile
        Write-Info "2/3 Building Android app..."
        Start-Job -ScriptBlock { npx eas build --platform android --profile production --non-interactive }
        
        Write-Info "3/3 Building iOS app..."
        Start-Job -ScriptBlock { npx eas build --platform ios --profile production --non-interactive }
        
        Get-Job | Wait-Job
        Write-Success "All deployments initiated!"
    }
    default {
        Write-Error "Invalid option selected!"
        exit 1
    }
}

Write-Success "Deployment process completed!"
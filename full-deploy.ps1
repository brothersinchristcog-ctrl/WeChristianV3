# full-deploy.ps1
# Uses Node.js for JWT signing (pure crypto) + PowerShell WinHTTP for token exchange
# Run from: C:\Users\yraje\WeChristian2\
# Usage: powershell -ExecutionPolicy Bypass -File .\full-deploy.ps1

Set-Location "C:\Users\yraje\WeChristian2"

Write-Host "Step 1: Signing JWT with Node.js..." -ForegroundColor Cyan
$jwtJson = node sign-jwt.js | ConvertFrom-Json
$jwt = $jwtJson.jwt
$clientEmail = $jwtJson.client_email
$exp = $jwtJson.exp

Write-Host "  Service Account: $clientEmail" -ForegroundColor Gray

Write-Host "Step 2: Exchanging JWT for access token (PowerShell WinHTTP)..." -ForegroundColor Cyan

$body = "grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=$jwt"

try {
    $response = Invoke-RestMethod `
        -Method POST `
        -Uri "https://oauth2.googleapis.com/token" `
        -Body $body `
        -ContentType "application/x-www-form-urlencoded" `
        -TimeoutSec 30

    $accessToken = $response.access_token
    Write-Host "  Access token obtained!" -ForegroundColor Green
} catch {
    Write-Host "  Failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "Step 3: Writing Firebase credentials..." -ForegroundColor Cyan

$configstoreDir = "$env:USERPROFILE\.config\configstore"
New-Item -ItemType Directory -Force -Path $configstoreDir | Out-Null

$nowMs = [long](Get-Date -UFormat %s) * 1000
$expiryMs = $nowMs + (58 * 60 * 1000)  # 58 minutes from now (token is valid 1 hour)

$firebaseConfig = @{
    tokens = @{
        access_token  = $accessToken
        refresh_token = "dummy-not-needed"
        token_type    = "Bearer"
        expiry_date   = $expiryMs
        id_token      = $null
        scopes        = @("https://www.googleapis.com/auth/cloud-platform", "https://www.googleapis.com/auth/firebase")
    }
    user = @{
        email          = $clientEmail
        uid            = $clientEmail
        displayName    = "Service Account"
        email_verified = $true
    }
    activeProjects = @{ "" = "wechristian-67f07" }
    analytics      = @{ clientId = "deploy-script" }
} | ConvertTo-Json -Depth 6

$firebaseConfig | Out-File -FilePath "$configstoreDir\firebase-tools.json" -Encoding utf8 -Force -NoNewline
Write-Host "  Credentials written! Expiry: 58 minutes from now" -ForegroundColor Green

Write-Host "Step 4: Deploying Firebase Functions (run immediately!)..." -ForegroundColor Cyan
# Do NOT set GOOGLE_APPLICATION_CREDENTIALS - let firebase use the configstore token
Remove-Item Env:GOOGLE_APPLICATION_CREDENTIALS -ErrorAction SilentlyContinue
firebase deploy --only functions --project wechristian-67f07

# deploy.ps1 - Deploy Firebase functions using service account key
# Run this script from: C:\Users\yraje\WeChristian2\
# Usage: .\deploy.ps1

$keyFile = "C:\Users\yraje\WeChristian2\key.json"

# Step 1: Read the service account key
$key = Get-Content $keyFile | ConvertFrom-Json
Write-Host "Using service account: $($key.client_email)" -ForegroundColor Cyan

# Step 2: Craft JWT for Google OAuth2
$now = [int][double]::Parse((Get-Date -UFormat %s))
$exp = $now + 3600

$header = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes('{"alg":"RS256","typ":"JWT"}')).TrimEnd('=').Replace('+', '-').Replace('/', '_')
$payload = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes("{`"iss`":`"$($key.client_email)`",`"scope`":`"https://www.googleapis.com/auth/cloud-platform https://www.googleapis.com/auth/firebase`",`"aud`":`"https://oauth2.googleapis.com/token`",`"exp`":$exp,`"iat`":$now}")).TrimEnd('=').Replace('+', '-').Replace('/', '_')

$toSign = "$header.$payload"

# Step 3: Sign with private key using .NET RSA
$rsaParams = [System.Security.Cryptography.RSA]::Create()
$pemKey = $key.private_key -replace "-----BEGIN PRIVATE KEY-----", "" -replace "-----END PRIVATE KEY-----", "" -replace "\n", "" -replace "\r", ""
$keyBytes = [Convert]::FromBase64String($pemKey)
$rsaParams.ImportPkcs8PrivateKey($keyBytes, [ref]$null)

$signatureBytes = $rsaParams.SignData([Text.Encoding]::UTF8.GetBytes($toSign), [Security.Cryptography.HashAlgorithmName]::SHA256, [Security.Cryptography.RSASignaturePadding]::Pkcs1)
$signature = [Convert]::ToBase64String($signatureBytes).TrimEnd('=').Replace('+', '-').Replace('/', '_')

$jwt = "$toSign.$signature"

# Step 4: Exchange JWT for access token
Write-Host "Authenticating with Google..." -ForegroundColor Yellow
$tokenResponse = Invoke-RestMethod -Method POST -Uri "https://oauth2.googleapis.com/token" -Body @{
    grant_type = "urn:ietf:params:oauth:grant-type:jwt-bearer"
    assertion  = $jwt
} -ContentType "application/x-www-form-urlencoded"

$accessToken = $tokenResponse.access_token
Write-Host "Successfully obtained access token!" -ForegroundColor Green

# Step 5: Write to Firebase configstore so firebase CLI picks it up
$configDir = "$env:APPDATA\npm\node_modules\firebase-tools"
$configstoreDir = "$env:USERPROFILE\.config\configstore"
if (-not (Test-Path $configstoreDir)) { New-Item -ItemType Directory -Path $configstoreDir | Out-Null }

$firebaseConfig = @{
    tokens = @{
        access_token  = $accessToken
        refresh_token = $accessToken  
        token_type    = "Bearer"
        expiry_date   = ($exp * 1000)
        id_token      = $null
    }
    user = @{
        email = $key.client_email
        uid   = $key.client_email
    }
    activeProjects = @{ "" = "wechristian-67f07" }
} | ConvertTo-Json -Depth 5

$firebaseConfig | Out-File -FilePath "$configstoreDir\firebase-tools.json" -Encoding utf8
Write-Host "Firebase credentials configured!" -ForegroundColor Green

# Step 6: Deploy
Write-Host "`nDeploying Firebase Functions..." -ForegroundColor Cyan
$env:GOOGLE_APPLICATION_CREDENTIALS = $keyFile
firebase deploy --only functions --project wechristian-67f07

// deploy-helper.js
// Run: node deploy-helper.js
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const os = require('os');

const keyFile = path.join(__dirname, 'key.json');
const key = JSON.parse(fs.readFileSync(keyFile, 'utf8'));

console.log(`Using service account: ${key.client_email}`);

// Create JWT
const now = Math.floor(Date.now() / 1000);
const exp = now + 3600;

const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
const payload = Buffer.from(JSON.stringify({
  iss: key.client_email,
  scope: 'https://www.googleapis.com/auth/cloud-platform https://www.googleapis.com/auth/firebase',
  aud: 'https://oauth2.googleapis.com/token',
  exp,
  iat: now
})).toString('base64url');

const toSign = `${header}.${payload}`;
const signer = crypto.createSign('RSA-SHA256');
signer.update(toSign);
const sig = signer.sign(key.private_key, 'base64url');
const jwt = `${toSign}.${sig}`;

// Exchange JWT for access token using https
const https = require('https');
const body = `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`;

const req = https.request({
  hostname: 'oauth2.googleapis.com',
  path: '/token',
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Content-Length': Buffer.byteLength(body)
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const tokenData = JSON.parse(data);
    if (!tokenData.access_token) {
      console.error('Failed to get token:', data);
      process.exit(1);
    }

    console.log('Got access token!');

    // Write to Firebase configstore
    const configstoreDir = path.join(os.homedir(), '.config', 'configstore');
    fs.mkdirSync(configstoreDir, { recursive: true });
    
    const firebaseConfig = {
      tokens: {
        access_token: tokenData.access_token,
        refresh_token: tokenData.access_token,
        token_type: 'Bearer',
        expiry_date: exp * 1000,
        id_token: null
      },
      user: {
        email: key.client_email,
        uid: key.client_email,
        displayName: 'Service Account'
      },
      activeProjects: { '': 'wechristian-67f07' },
      analytics: { clientId: 'deploy-script' }
    };

    const configPath = path.join(configstoreDir, 'firebase-tools.json');
    fs.writeFileSync(configPath, JSON.stringify(firebaseConfig, null, 2));
    console.log(`Credentials written to: ${configPath}`);

    // Now deploy
    console.log('\nDeploying Firebase Functions...');
    try {
      execSync('firebase deploy --only functions --project wechristian-67f07', {
        stdio: 'inherit',
        env: {
          ...process.env,
          GOOGLE_APPLICATION_CREDENTIALS: keyFile
        }
      });
    } catch (e) {
      process.exit(1);
    }
  });
});

req.on('error', (err) => {
  console.error('Network error:', err.message);
  process.exit(1);
});
req.write(body);
req.end();

// sign-jwt.js - Signs a JWT using the service account key (pure crypto, no network)
const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

const key = JSON.parse(fs.readFileSync(path.join(__dirname, 'key.json'), 'utf8'));

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

// Output the JWT and expiry for PowerShell to use
console.log(JSON.stringify({ jwt, exp, client_email: key.client_email }));

// write-credentials.js
// This script uses the firebase-tools internal libraries (which have network access)
// to authenticate using the service account key and write credentials to the configstore

const path = require('path');
const fs = require('fs');
const os = require('os');

const keyFile = path.join(__dirname, 'key.json');
const key = JSON.parse(fs.readFileSync(keyFile, 'utf8'));

// Use firebase-tools' own google-auth-library (which can connect)
const firebaseToolsPath = path.join(os.homedir(), 'AppData', 'Roaming', 'npm', 'node_modules', 'firebase-tools');
const { GoogleAuth } = require(path.join(firebaseToolsPath, 'node_modules', 'google-auth-library'));

async function main() {
  console.log(`Authenticating as: ${key.client_email}`);
  
  const auth = new GoogleAuth({
    credentials: key,
    scopes: [
      'https://www.googleapis.com/auth/cloud-platform',
      'https://www.googleapis.com/auth/firebase'
    ]
  });
  
  const client = await auth.getClient();
  const tokenResponse = await client.getAccessToken();
  const accessToken = tokenResponse.token;
  
  console.log('Access token obtained!');
  
  // Write to firebase configstore
  const configstoreDir = path.join(os.homedir(), '.config', 'configstore');
  fs.mkdirSync(configstoreDir, { recursive: true });
  
  const now = Math.floor(Date.now() / 1000);
  const expiry = (now + 3600) * 1000;
  
  const firebaseConfig = {
    tokens: {
      access_token: accessToken,
      refresh_token: accessToken,
      token_type: 'Bearer',
      expiry_date: expiry,
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
  console.log(`Credentials saved to: ${configPath}`);
  console.log('\nNow run: firebase deploy --only functions --project wechristian-67f07');
}

main().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});

// retry-auth.js - keeps retrying until network succeeds
const path = require('path');
const os = require('os');
const fs = require('fs');
const { execSync } = require('child_process');

const ftPath = path.join(os.homedir(), 'AppData', 'Roaming', 'npm', 'node_modules', 'firebase-tools');
const { GoogleAuth } = require(path.join(ftPath, 'node_modules', 'google-auth-library'));

async function tryGetToken(attempt) {
  console.log(`Attempt ${attempt}...`);
  const auth = new GoogleAuth({
    keyFile: path.join(__dirname, 'key.json'),
    scopes: ['https://www.googleapis.com/auth/cloud-platform', 'https://www.googleapis.com/auth/firebase']
  });
  const client = await auth.getClient();
  const response = await client.getAccessToken();
  return response.token;
}

async function main() {
  let token = null;
  for (let i = 1; i <= 20; i++) {
    try {
      token = await tryGetToken(i);
      if (token) {
        console.log('Token obtained on attempt ' + i);
        break;
      }
    } catch (e) {
      console.log(`  Error: ${e.message}`);
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  if (!token) {
    console.error('Failed after 20 attempts');
    process.exit(1);
  }

  // Write credentials
  const configstoreDir = path.join(os.homedir(), '.config', 'configstore');
  fs.mkdirSync(configstoreDir, { recursive: true });
  const expiry = (Math.floor(Date.now() / 1000) + 3600) * 1000;
  const key = JSON.parse(fs.readFileSync(path.join(__dirname, 'key.json'), 'utf8'));
  
  const config = {
    tokens: {
      access_token: token,
      refresh_token: token,
      token_type: 'Bearer',
      expiry_date: expiry,
      id_token: null
    },
    user: { email: key.client_email, uid: key.client_email, displayName: 'SA' },
    activeProjects: { '': 'wechristian-67f07' },
    analytics: { clientId: 'deploy-script' }
  };

  fs.writeFileSync(path.join(configstoreDir, 'firebase-tools.json'), JSON.stringify(config, null, 2));
  console.log('Credentials written. Deploying...');

  execSync('firebase deploy --only functions --project wechristian-67f07', {
    stdio: 'inherit',
    env: { ...process.env, GOOGLE_APPLICATION_CREDENTIALS: path.join(__dirname, 'key.json') }
  });
}

main().catch(e => { console.error(e.message); process.exit(1); });

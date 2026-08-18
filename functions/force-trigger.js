import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const serviceAccount = require('./key.json');
import { initializeApp, cert } from 'firebase-admin/app';
initializeApp({
  credential: cert(serviceAccount)
});

// Since src/index.js might export testBdays, let's try to import it.
// We must initialize admin first.
import { testBdays, testAnnivs, testBaptisms } from './src/index.js';

async function run() {
  const req = {};
  const res = {
    status: (code) => ({
      send: (msg) => console.log('HTTP', code, msg)
    }),
    send: (msg) => console.log('HTTP 200', msg)
  };
  
  console.log("Running birthdays...");
  await testBdays(req, res);
  
  console.log("Running anniversaries...");
  await testAnnivs(req, res);
  
  console.log("Running baptisms...");
  await testBaptisms(req, res);
  
  console.log("Done!");
}
run().catch(console.error);

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const serviceAccount = require('./key.json');
initializeApp({
  credential: cert(serviceAccount)
});
// import compiled functions
import { processBirthdays, processAnniversaries, processBaptisms } from './src/weCelebrations.js';

async function run() {
  console.log("Running birthdays...");
  await processBirthdays(getFirestore());
  console.log("Running anniversaries...");
  await processAnniversaries(getFirestore());
  console.log("Running baptisms...");
  await processBaptisms(getFirestore());
  console.log("Done!");
}
run().catch(console.error);

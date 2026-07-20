const admin = require('firebase-admin');
const serviceAccount = require('../key.json');

try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
} catch (e) {
  console.error(e);
}

const db = admin.firestore();

async function run() {
  const snapshot = await db.collection('churches').get();
  const batch = db.batch();
  snapshot.forEach(doc => {
    batch.set(doc.ref, { features: { hasWhatsAppAutomation: true } }, { merge: true });
  });
  await batch.commit();
  console.log('WhatsApp Automation Enabled for all churches!');
}
run();

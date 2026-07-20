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
const DEFAULT_CHURCH_ID = 'KhmBeNWxlrxwS1hGhuw';

async function migrateCollection(collectionName) {
  console.log('Migrating ' + collectionName);
  const snapshot = await db.collection(collectionName).get();
  if (snapshot.empty) return;
  const batch = db.batch();
  snapshot.forEach(doc => {
    const newRef = db.collection('churches').doc(DEFAULT_CHURCH_ID).collection(collectionName).doc(doc.id);
    batch.set(newRef, doc.data());
  });
  await batch.commit();
}

async function run() {
  await db.collection('churches').doc(DEFAULT_CHURCH_ID).set({
    name: 'Brothers in Christ Fellowship',
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });
  
  await migrateCollection('settings');
  await migrateCollection('broadcasts');
  await migrateCollection('member_profiles');
  await migrateCollection('worshipSongs');
  await migrateCollection('transactions');
  console.log('Done!');
}
run();

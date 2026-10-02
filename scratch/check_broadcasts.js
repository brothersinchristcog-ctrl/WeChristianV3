const admin = require('firebase-admin');
const serviceAccount = require('./key.json');
admin.initializeApp({credential: admin.credential.cert(serviceAccount)});
const db = admin.firestore();

async function check() {
  const broadcastsSnap = await db.collection('churches').doc('HDuJxnnWGxkhgy3LdMcv').collection('broadcasts').orderBy('createdAt', 'desc').limit(5).get();
  for (const doc of broadcastsSnap.docs) {
    console.log('Broadcast:', doc.id, doc.data());
  }
}
check();

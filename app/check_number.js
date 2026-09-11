const admin = require('firebase-admin');

// Initialize Firebase Admin (adjust path as needed for service account)
if (!admin.apps.length) {
  const serviceAccount = require('./serviceAccountKey.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function checkNumber() {
  console.log("Checking 9398501975...");
  const snap = await db.collectionGroup('members').where('phone', '==', '9398501975').get();
  
  if (snap.empty) {
    const snap2 = await db.collectionGroup('members').where('phone', '==', '+919398501975').get();
    if (snap2.empty) {
      console.log("Not found with +91 either.");
    } else {
      snap2.forEach(doc => {
        console.log(`Found: ID=${doc.id}, Path=${doc.ref.path}, userType=${doc.data().userType}`);
      });
    }
  } else {
    snap.forEach(doc => {
      console.log(`Found: ID=${doc.id}, Path=${doc.ref.path}, userType=${doc.data().userType}`);
    });
  }
}

checkNumber().then(() => process.exit(0)).catch(console.error);

const admin = require('firebase-admin');

// Initialize without credentials, assuming we are logged into gcloud or it works via GOOGLE_APPLICATION_CREDENTIALS
admin.initializeApp({ projectId: 'wechristian-67f07' });

const db = admin.firestore();

async function run() {
  try {
    const snap = await db.collection('churches').get();
    let phones = [];
    snap.forEach(doc => {
      phones.push({ id: doc.id, name: doc.data().name, contactPhone: doc.data().contactPhone });
    });
    console.log("CHURCHES:", JSON.stringify(phones, null, 2));
  } catch(e) {
    console.error("Error:", e);
  }
}
run();

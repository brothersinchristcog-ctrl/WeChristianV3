const admin = require('firebase-admin');
const serviceAccount = require('../key.json');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function migrate() {
  console.log('Starting migration to enable WhatsApp Integration for all existing churches...');
  try {
    const churchesSnapshot = await db.collection('churches').get();
    
    if (churchesSnapshot.empty) {
      console.log('No churches found.');
      return;
    }

    let updatedCount = 0;
    const batch = db.batch();

    churchesSnapshot.forEach(doc => {
      const data = doc.data();
      // Only update if it doesn't already have the field
      if (data.whatsappIntegrationEnabled === undefined) {
        batch.update(doc.ref, { whatsappIntegrationEnabled: true });
        updatedCount++;
      }
    });

    if (updatedCount > 0) {
      await batch.commit();
      console.log(`Successfully enabled WhatsApp Integration for ${updatedCount} churches.`);
    } else {
      console.log('All churches already have the whatsappIntegrationEnabled field set.');
    }
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

migrate();

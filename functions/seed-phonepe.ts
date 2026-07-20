import * as admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

import { getApps, initializeApp } from 'firebase-admin/app';

// Initialize Firebase Admin with credentials from the CLI or a service account
// Since we are running this locally, we can just initialize without credentials if we run it via firebase exec
// Actually, let's use the local application default credentials if available, or just run it via the app
async function seed() {
  if (!getApps().length) {
    initializeApp();
  }
  const db = getFirestore();
  
  // Get all churches
  const churchesSnapshot = await db.collection('churches').limit(5).get();
  
  if (churchesSnapshot.empty) {
    console.log('No churches found in the database.');
    return;
  }
  
  console.log(`Found ${churchesSnapshot.size} churches. Seeding PhonePe Sandbox credentials...`);
  
  const batch = db.batch();
  
  churchesSnapshot.forEach((doc) => {
    const secretsRef = db.collection('churches').doc(doc.id).collection('secrets').doc('payment');
    batch.set(secretsRef, {
      phonePeMerchantId: 'PGTESTPAYUAT',
      phonePeSaltKey: '099eb0cd-02cf-4e2a-8aca-3e6c6aff0399',
      phonePeSaltIndex: '1'
    });
    console.log(`Prepared PhonePe secrets for church: ${doc.id}`);
  });
  
  await batch.commit();
  console.log('Successfully seeded PhonePe Sandbox credentials for all churches!');
}

seed().catch(console.error);

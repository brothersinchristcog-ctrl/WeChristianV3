import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const serviceAccount = require('./key.json');
initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();
async function test() {
  const churchesSnap = await db.collection('churches')
    .where('whatsappIntegrationEnabled', '==', true)
    .where('automatedWhatsappWishesEnabled', '==', true)
    .get();
  console.log("Found churches:", churchesSnap.size);
  churchesSnap.forEach(doc => {
    console.log(doc.id, doc.data().name);
  });
}
test().catch(console.error);

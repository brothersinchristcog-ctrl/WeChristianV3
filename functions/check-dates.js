import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const serviceAccount = require('./key.json');
initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function check() {
  const churchesSnap = await db.collection('churches')
    .where('whatsappIntegrationEnabled', '==', true)
    .where('automatedWhatsappWishesEnabled', '==', true)
    .get();
  
  console.log("Enabled churches:", churchesSnap.size);
  let churchId = 'default';
  if (!churchesSnap.empty) {
     churchId = churchesSnap.docs[0].id;
  }
  
  const today = new Date();
  const m = today.getMonth() + 1;
  const d = today.getDate();
  console.log("Today is:", m, "/", d);

  const membersSnap = await db.collection('members').get();
  const membersSnap2 = await db.collectionGroup('members').get();
  
  console.log("Legacy Members count:", membersSnap.size);
  console.log("Group Members count:", membersSnap2.size);

  let bdays = 0;
  let annivs = 0;

  const processDoc = (doc) => {
    const data = doc.data();
    
    // Check birthdays
    const dobStr = data.dateOfBirth || data.dob || data.birthday;
    if (dobStr) {
      const parts = dobStr.split(/[-/]/);
      let month, day;
      if (parts[0] && parts[0].length === 4) { month = parseInt(parts[1], 10); day = parseInt(parts[2], 10); }
      else if (parts[2] && parts[2].length === 4) { day = parseInt(parts[0], 10); month = parseInt(parts[1], 10); }
      
      if (month === m && day === d) {
        console.log("🎉 Birthday today for:", data.name || data.firstName, "| Phone:", data.phone);
        bdays++;
      }
    }

    // Check anniversaries
    const annivStr = data.weddingAnniversary || data.anniversary;
    if (annivStr) {
      const parts = annivStr.split(/[-/]/);
      let month, day;
      if (parts[0] && parts[0].length === 4) { month = parseInt(parts[1], 10); day = parseInt(parts[2], 10); }
      else if (parts[2] && parts[2].length === 4) { day = parseInt(parts[0], 10); month = parseInt(parts[1], 10); }
      
      if (month === m && day === d) {
        console.log("🎊 Anniversary today for:", data.name || data.firstName, "| Phone:", data.phone);
        annivs++;
      }
    }
  };

  membersSnap.forEach(processDoc);
  membersSnap2.forEach(processDoc);
  
  console.log(`Found ${bdays} birthdays and ${annivs} anniversaries for today.`);
}

check().catch(console.error);

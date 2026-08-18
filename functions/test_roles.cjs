const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function run() {
  console.log("Fetching all churches...");
  const churches = await db.collection('churches').get();
  for (const doc of churches.docs) {
    console.log(`Church: ${doc.id}`);
    const members = await db.collection('churches').doc(doc.id).collection('members').get();
    for (const m of members.docs) {
      const data = m.data();
      if (data.userType === 'Admin' || data.userType === 'ADMIN' || data.userType === 'super_admin' || data.userType === 'SUPER_ADMIN' || data.userType === 'admin') {
        console.log(`  Admin: ${m.id} | ${data.name} | ${data.email} | ${data.userType}`);
      }
      if (data.name?.includes('Sakibanda') || data.email?.includes('sakibanda')) {
         console.log(`  Sakibanda: ${m.id} | ${data.name} | ${data.email} | ${data.userType}`);
      }
    }
  }

  console.log("\nFetching global users...");
  const users = await db.collection('users').get();
  for (const doc of users.docs) {
    const data = doc.data();
    if (data.userType === 'Admin' || data.userType === 'ADMIN' || data.userType === 'super_admin' || data.userType === 'SUPER_ADMIN' || data.userType === 'admin') {
      console.log(`  Global Admin: ${doc.id} | ${data.name} | ${data.email} | ${data.userType}`);
    }
    if (data.name?.includes('Sakibanda') || data.email?.includes('sakibanda')) {
       console.log(`  Sakibanda: ${doc.id} | ${data.name} | ${data.email} | ${data.userType}`);
    }
  }
}

run().then(() => process.exit(0)).catch(console.error);

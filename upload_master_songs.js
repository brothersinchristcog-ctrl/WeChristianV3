const admin = require('firebase-admin');
const fs = require('fs');

// Use the service account key
const serviceAccount = require('./key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function uploadMasterSongs() {
  const songs = JSON.parse(fs.readFileSync('./app/master_songs.json', 'utf-8'));
  console.log(`Total songs to upload: ${songs.length}`);

  // Check existing count to avoid duplicates
  const existingSnapshot = await db.collection('masterSongs').limit(1).get();
  if (!existingSnapshot.empty) {
    console.log('⚠️  masterSongs already has data. Clearing first...');
    // Delete all existing in batches
    let deletedCount = 0;
    let snapshot = await db.collection('masterSongs').limit(400).get();
    while (!snapshot.empty) {
      const batch = db.batch();
      snapshot.docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
      deletedCount += snapshot.docs.length;
      console.log(`  Deleted ${deletedCount} old songs...`);
      snapshot = await db.collection('masterSongs').limit(400).get();
    }
    console.log(`✅ Cleared ${deletedCount} old songs.`);
  }

  // Upload in batches of 400 (Firestore limit is 500)
  let batch = db.batch();
  let count = 0;
  let total = 0;

  for (const song of songs) {
    const docRef = db.collection('masterSongs').doc();
    const { createdAt, ...rest } = song; // remove old createdAt string
    batch.set(docRef, {
      ...rest,
      isDefault: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    count++;
    total++;

    if (count === 400) {
      await batch.commit();
      console.log(`  Uploaded ${total} songs...`);
      batch = db.batch();
      count = 0;
    }
  }

  if (count > 0) {
    await batch.commit();
    console.log(`  Uploaded ${total} songs...`);
  }

  console.log(`\n✅ Done! Successfully uploaded ${total} master songs to Firestore.`);
  process.exit(0);
}

uploadMasterSongs().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});

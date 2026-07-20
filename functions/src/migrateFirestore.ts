/**
 * ============================================================
 * ONE-TIME FIRESTORE MIGRATION SCRIPT
 * ============================================================
 * This script moves old root-level collections into the correct
 * church-scoped subcollection paths:
 *
 *   broadcasts       → churches/{churchId}/broadcasts
 *   worshipSongs     → churches/{churchId}/worshipSongs
 *   settings         → churches/{churchId}/settings
 *   member_profiles  → churches/{churchId}/members
 *
 * NOTE: The root-level `users` collection is intentionally
 *       left at the root (it stores global auth/FCM data).
 *
 * HOW TO RUN:
 *   cd c:\Users\sunil\we_christian\functions
 *   npx ts-node src/migrateFirestore.ts
 * ============================================================
 */

import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// ── Initialize Admin SDK (uses Application Default Credentials)
// Make sure you have run: gcloud auth application-default login
// OR set GOOGLE_APPLICATION_CREDENTIALS env var to your service account key JSON
initializeApp();

const db = getFirestore();

// ── CONFIGURE: Set the target Church ID here ──────────────────
// This is the document name under the 'churches' collection.
// Check Firebase Console → churches → your church document ID
const TARGET_CHURCH_ID = 'KhmBeNWxlrxwS1hGhuw'; // Faith Church document ID from screenshot

// ── CONFIGURE: Map root collection → church subcollection name
const MIGRATION_MAP: { rootCollection: string; churchSubcollection: string }[] = [
  { rootCollection: 'broadcasts',       churchSubcollection: 'broadcasts' },
  { rootCollection: 'worshipSongs',     churchSubcollection: 'worshipSongs' },
  { rootCollection: 'settings',         churchSubcollection: 'settings' },
  { rootCollection: 'member_profiles',  churchSubcollection: 'members' },
];

async function migrateCollection(rootCollection: string, churchSubcollection: string) {
  console.log(`\n📦 Migrating: ${rootCollection} → churches/${TARGET_CHURCH_ID}/${churchSubcollection}`);

  const sourceRef = db.collection(rootCollection);
  const destRef = db.collection('churches').doc(TARGET_CHURCH_ID).collection(churchSubcollection);

  const snapshot = await sourceRef.get();

  if (snapshot.empty) {
    console.log(`   ⚠️  No documents found in root '${rootCollection}'. Skipping.`);
    return;
  }

  console.log(`   Found ${snapshot.docs.length} documents.`);

  let successCount = 0;
  let skipCount = 0;

  for (const doc of snapshot.docs) {
    const destDoc = destRef.doc(doc.id);
    const destSnap = await destDoc.get();

    if (destSnap.exists) {
      console.log(`   ⏭️  Skipping ${doc.id} — already exists in destination.`);
      skipCount++;
      continue;
    }

    await destDoc.set(doc.data());
    console.log(`   ✅ Migrated: ${doc.id}`);
    successCount++;
  }

  console.log(`   Done. Migrated: ${successCount}, Skipped (already exists): ${skipCount}`);
}

async function runMigration() {
  console.log('🚀 Starting Firestore Migration...');
  console.log(`   Target Church: ${TARGET_CHURCH_ID}\n`);

  for (const mapping of MIGRATION_MAP) {
    try {
      await migrateCollection(mapping.rootCollection, mapping.churchSubcollection);
    } catch (error) {
      console.error(`❌ Error migrating '${mapping.rootCollection}':`, error);
    }
  }

  console.log('\n\n✅ Migration Complete!');
  console.log('');
  console.log('Next steps:');
  console.log('  1. Open Firebase Console and verify all data is in churches/' + TARGET_CHURCH_ID);
  console.log('  2. Once verified, you can MANUALLY delete the old root-level collections');
  console.log('     from Firebase Console (broadcasts, worshipSongs, settings, member_profiles).');
  console.log('  3. The app will continue working from the church-scoped paths.');
  console.log('');
  console.log('⚠️  The root `users` collection was intentionally NOT migrated (global auth data).');
}

runMigration().catch(console.error);

const admin = require('firebase-admin');

// Initialize app with default credentials (if running locally with firebase tools)
// Or use service account if needed, but since this is in the functions folder, let's try default
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

async function expireUser() {
  const userId = 'iOY8GFvoXlh6kk5DOOGtY287xEj1';
  const churchId = 'mxm4kApQJuDK31R0g5F3';

  try {
    console.log(`Expiring user ${userId}...`);
    
    // Update global users collection
    await db.collection('users').doc(userId).set({
      subscription: {
        status: 'expired',
        plan: 'monthly',
        validUntil: new Date(Date.now() - 86400000).toISOString() // yesterday
      }
    }, { merge: true });
    
    // Update church member document
    await db.collection('churches').doc(churchId).collection('members').doc(userId).set({
      subscription: {
        status: 'expired',
        plan: 'monthly',
        validUntil: new Date(Date.now() - 86400000).toISOString()
      }
    }, { merge: true });

    console.log('Successfully expired user in both collections!');
  } catch (error) {
    console.error('Error expiring user:', error);
  }
}

expireUser();

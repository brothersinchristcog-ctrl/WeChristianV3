const { getDb, weChristianBdaysRunV3 } = require('c:\\Users\\yraje\\WeChristian2\\functions\\lib\\index.js');
const DEFAULT_CHURCH_ID = 'KhmBeNWxlrxwS1hGhuw';

async function run() {
  try {
    const db = getDb();
    const membersRef = db.collection('churches').doc(DEFAULT_CHURCH_ID).collection('members');
    await membersRef.doc('TEST_MEMBER').set({
      name: 'Test Birthday User',
      phoneNumber: '+919999999999',
      dateOfBirth: new Date().toISOString().split('T')[0],
      pushToken: null
    }, { merge: true });
    console.log('Successfully created test member with today birthday.');
    
    // Now trigger the birthday logic!
    console.log('Triggering birthday logic...');
    weChristianBdaysRunV3({});
  } catch (e) {
    console.error(e);
  }
}
run();
setTimeout(() => console.log('Exiting in 15s...'), 15000);

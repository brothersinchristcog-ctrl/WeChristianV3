const { getDb, weChristianBdaysRunV3, weChristianAnnivsRunV3, weChristianBaptismsRunV3 } = require('c:/Users/yraje/WeChristian2/functions/lib/index.js');

async function run() {
  try {
    const db = getDb();
    
    // First, let's create a test user so we KNOW it sends something!
    const membersRef = db.collection('churches').doc('KhmBeNWxlrxwS1hGhuw').collection('members');
    await membersRef.doc('TEST_MEMBER').set({
      name: 'Test Birthday User',
      phoneNumber: '+919999999999',
      dateOfBirth: new Date().toISOString().split('T')[0], // Today
      pushToken: null
    }, { merge: true });
    console.log('Created test member');
    
    console.log('Triggering birthdays...');
    await weChristianBdaysRunV3({});
    
    console.log('Triggering anniversaries...');
    await weChristianAnnivsRunV3({});
    
    console.log('Triggering baptisms...');
    await weChristianBaptismsRunV3({});
    
    console.log('ALL DONE!');
  } catch (e) {
    console.error(e);
  }
}
run();
setTimeout(() => console.log('Exiting...'), 30000);

const fs = require('fs');
const path = require('path');

const homePath = path.join(__dirname, 'src', 'screens', 'HomeScreen.tsx');
let homeContent = fs.readFileSync(homePath, 'utf8');

homeContent = homeContent.replace(
  "setLiveCelebrations(todays);",
  "console.log('--- LIVE CELEBRATIONS DEBUG ---'); console.log('All celebs count:', allCelebs.length); console.log('Today count:', todays.length); if (todays.length === 0) { console.log('First celeb sample:', allCelebs[0]); }\n      setLiveCelebrations(todays);"
);

fs.writeFileSync(homePath, homeContent, 'utf8');

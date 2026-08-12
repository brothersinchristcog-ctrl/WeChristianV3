const fs = require('fs');
const path = require('path');

const homePath = path.join(__dirname, 'src', 'screens', 'HomeScreen.tsx');
let homeContent = fs.readFileSync(homePath, 'utf8');

homeContent = homeContent.replace(
  "console.log('--- LIVE CELEBRATIONS DEBUG ---'); console.log('All celebs count:', allCelebs.length); console.log('Today count:', todays.length); if (todays.length === 0) { console.log('First celeb sample:', allCelebs[0]); }",
  "const debugInfo = '--- LIVE CELEBRATIONS DEBUG ---\\nAll celebs count: ' + allCelebs.length + '\\nToday count: ' + todays.length + '\\nSample: ' + JSON.stringify(allCelebs.slice(0, 2)) + '\\nTodays Array: ' + JSON.stringify(todays) + '\\nMember Object: ' + JSON.stringify({ dob: (member as any).dob, birthdate: (member as any).birthdate });\n      require('react-native-fs').writeFile(require('react-native-fs').DocumentDirectoryPath + '/debug_log.txt', debugInfo, 'utf8').catch(() => {});"
);

fs.writeFileSync(homePath, homeContent, 'utf8');

const fs = require('fs');
const path = require('path');

const homePath = path.join(__dirname, 'src', 'screens', 'HomeScreen.tsx');
let homeContent = fs.readFileSync(homePath, 'utf8');

homeContent = homeContent.replace(
  "const debugInfo = 'All: ' + allCelebs.length + ', Today: ' + todays.length + '\\n' + 'Mem DOB: ' + (member as any).dob + '\\nMem Birth: ' + (member as any).birthdate;\n      Alert.alert('Debug Live Celeb', debugInfo);",
  ""
);

fs.writeFileSync(homePath, homeContent, 'utf8');
console.log('Removed debug alert');

const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src', 'navigation', 'RootNavigator.tsx');
let content = fs.readFileSync(file, 'utf8');

// 1. Add import
if (!content.includes('LiveCelebrationsChat')) {
  content = content.replace(
    "import UpdatesScreen from '../screens/UpdatesScreen';",
    "import UpdatesScreen from '../screens/UpdatesScreen';\nimport LiveCelebrationsChat from '../screens/LiveCelebrationsChat';"
  );
  
  // 2. Add to Stack
  content = content.replace(
    "<Stack.Screen name=\"AttendanceScreen\" component={AttendanceScreen} />",
    "<Stack.Screen name=\"AttendanceScreen\" component={AttendanceScreen} />\n        <Stack.Screen name=\"LiveCelebrationsChat\" component={LiveCelebrationsChat} />"
  );

  fs.writeFileSync(file, content, 'utf8');
  console.log('Added LiveCelebrationsChat to RootNavigator');
} else {
  console.log('LiveCelebrationsChat already exists in RootNavigator');
}

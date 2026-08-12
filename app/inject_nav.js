const fs = require('fs');
const path = require('path');

const navPath = path.join(__dirname, 'src', 'navigation', 'RootNavigator.tsx');
let content = fs.readFileSync(navPath, 'utf8');

// 1. Add import
if (!content.includes('LiveCelebrationsChat')) {
  content = content.replace(
    "import UpdatesScreen from '../screens/UpdatesScreen';",
    "import UpdatesScreen from '../screens/UpdatesScreen';\nimport LiveCelebrationsChat from '../screens/LiveCelebrationsChat';"
  );
  
  // 2. Add to Admin Stack
  content = content.replace(
    /<Stack\.Screen name="AttendanceScreen" component={AttendanceScreen} \/>\n\s*<\/(\s*)>/,
    `<Stack.Screen name="AttendanceScreen" component={AttendanceScreen} />\n            <Stack.Screen name="LiveCelebrationsChat" component={LiveCelebrationsChat} />\n          </$1>`
  );

  // 3. Add to Member Stack
  content = content.replace(
    /<Stack\.Screen name="AttendanceScreen" component={AttendanceScreen} \/>\n\s*<Stack\.Screen name="DailyVideo"/,
    `<Stack.Screen name="AttendanceScreen" component={AttendanceScreen} />\n            <Stack.Screen name="LiveCelebrationsChat" component={LiveCelebrationsChat} />\n            <Stack.Screen name="DailyVideo"`
  );

  fs.writeFileSync(navPath, content, 'utf8');
  console.log('Successfully added LiveCelebrationsChat to both Stacks in RootNavigator');
} else {
  console.log('LiveCelebrationsChat already exists');
}

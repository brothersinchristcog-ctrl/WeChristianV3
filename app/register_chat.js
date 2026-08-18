const fs = require('fs');
const path = require('path');

const rootPath = path.join(__dirname, 'src', 'navigation', 'RootNavigator.tsx');
let rootContent = fs.readFileSync(rootPath, 'utf8');

// Add to Admin block
rootContent = rootContent.replace(
  '<Stack.Screen name="Celebration" component={CelebrationScreen} />',
  '<Stack.Screen name="Celebration" component={CelebrationScreen} />\n            <Stack.Screen name="LiveCelebrationsChat" component={LiveCelebrationsChat} />'
);

// Add to Member block
rootContent = rootContent.replace(
  '<Stack.Screen name="AttendanceScreen" component={AttendanceScreen} />',
  '<Stack.Screen name="AttendanceScreen" component={AttendanceScreen} />\n            <Stack.Screen name="LiveCelebrationsChat" component={LiveCelebrationsChat} />'
);

fs.writeFileSync(rootPath, rootContent, 'utf8');
console.log('Registered LiveCelebrationsChat in both stacks');

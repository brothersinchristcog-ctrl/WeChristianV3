const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, 'src', 'screens', 'UpdatesScreen.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

const targetStr = `                  } else if (update.type === 'attendance') {
                    navigation.navigate('AttendanceScreen');
                  } else {
                    setSelectedUpdate(update);
                  }`;
const newStr = `                  } else if (update.type === 'attendance') {
                    navigation.navigate('AttendanceScreen');
                  } else if (update.type === 'online_meeting') {
                    navigation.navigate('OnlineMeetings');
                  } else {
                    setSelectedUpdate(update);
                  }`;

if (content.includes(targetStr)) {
  content = content.replace(targetStr, newStr);
  fs.writeFileSync(targetFile, content, 'utf8');
  console.log('Successfully added click logic');
} else {
  console.log('Could not find target string');
}

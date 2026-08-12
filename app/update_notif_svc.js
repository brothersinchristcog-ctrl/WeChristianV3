const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src', 'services', 'NotificationService.ts');
let content = fs.readFileSync(file, 'utf8');

const regex = /case 'event':\s+nav\.navigate\('Events'\);\s+break;/;
const newStr = `case 'event':
          nav.navigate('Events');
          break;
        case 'online_meeting':
          nav.navigate('OnlineMeetings');
          break;`;

if (content.match(regex)) {
  content = content.replace(regex, newStr);
  fs.writeFileSync(file, content, 'utf8');
  console.log('Successfully updated NotificationService.ts');
} else {
  console.log('Failed to find target regex in NotificationService.ts');
}

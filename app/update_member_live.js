const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src', 'screens', 'OnlineMeetingsScreen.tsx');
let content = fs.readFileSync(file, 'utf8');

const regexFilter = /const liveMeetings = meetings\.filter\([\s\S]*?\n  let displayList = upcomingMeetings;/;
const newFilter = `const liveMeetings: any[] = [];
  const upcomingMeetings: any[] = [];
  const pastMeetings: any[] = [];

  meetings.forEach(m => {
    if (m.status === 'cancelled') return;

    if (m.startTime && m.endTime && m.startTime.seconds && m.endTime.seconds) {
      const start = new Date(m.startTime.seconds * 1000);
      const end = new Date(m.endTime.seconds * 1000);
      
      if (end < now) {
        pastMeetings.push(m);
      } else if (start <= now && end >= now) {
        liveMeetings.push(m);
      } else {
        upcomingMeetings.push(m);
      }
    } else {
      if (m.status === 'live') liveMeetings.push(m);
      else if (m.status === 'past') pastMeetings.push(m);
      else upcomingMeetings.push(m);
    }
  });

  let displayList = upcomingMeetings;`;

if (content.match(regexFilter)) {
  content = content.replace(regexFilter, newFilter);
}

const isLiveRegex = /const isLive = activeTab === 'live' \|\| item\.status === 'live';/;
const newIsLive = `const isLive = activeTab === 'live' || item.status === 'live' || (
      item.startTime && item.endTime && 
      new Date(item.startTime.seconds * 1000) <= now && 
      new Date(item.endTime.seconds * 1000) >= now
    );`;

content = content.replace(isLiveRegex, newIsLive);

fs.writeFileSync(file, content, 'utf8');
console.log('Successfully updated OnlineMeetingsScreen dynamic live filtering');

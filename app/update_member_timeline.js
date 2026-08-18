const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, 'src', 'screens', 'UpdatesScreen.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// 1. Add Video to imports
content = content.replace(
  /import {([^}]+)} from 'lucide-react-native';/,
  (match, p1) => {
    if (!p1.includes('Video')) {
      return `import {${p1}, Video } from 'lucide-react-native';`;
    }
    return match;
  }
);

// 2. Add state variables and combine effect
const stateMatch = /const \[dynamicUpdates, setDynamicUpdates\] = useState<any\[\]>\(\[\]\);/;
const newState = `  const [dynamicUpdates, setDynamicUpdates] = useState<any[]>([]);
  const [broadcastsList, setBroadcastsList] = useState<any[]>([]);
  const [meetingsList, setMeetingsList] = useState<any[]>([]);

  useEffect(() => {
    const combined = [...broadcastsList, ...meetingsList].sort((a, b) => (b.rawDate || 0) - (a.rawDate || 0));
    setDynamicUpdates(combined);
  }, [broadcastsList, meetingsList]);`;
if (content.match(stateMatch)) {
  content = content.replace(stateMatch, newState);
}

// 3. Update the broadcasts rawDate assignment
content = content.replace(
  /url: data\.url \|\| '',\s*imageUrl: data\.imageUrl \|\| null\s*};\s*}\)\.filter/g,
  `url: data.url || '',
              imageUrl: data.imageUrl || null,
              rawDate: data.createdAt?.toMillis?.() || (typeof data.createdAt === 'number' ? data.createdAt : 0)
            };
          }).filter`
);

// 4. Update the onSnapshot setDynamicUpdates
content = content.replace(
  /setDynamicUpdates\(list\);\s*}/g,
  `setBroadcastsList(list);
        }`
);

// 5. Add online meetings query and return statement
const returnMatch = /return \(\) => unsubscribe\(\);/;
const meetingsLogic = `    const qMeetings = query(
      collection(db, 'churches', member.churchId, 'online_meetings'),
      orderBy('createdAt', 'desc'),
      limit(10)
    );

    const unsubscribeMeetings = onSnapshot(
      qMeetings,
      (snapshot) => {
        if (snapshot) {
          const list = snapshot.docs.map(doc => {
            const data = doc.data();
            let dateStr = new Date().toISOString().split('T')[0];
            if (data.startTime && typeof data.startTime.toDate === 'function') {
              const dt = data.startTime.toDate();
              dateStr = dt.toLocaleDateString() + ' • ' + dt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
            }
            
            return {
              id: doc.id,
              title: 'New Online Meeting',
              content: data.title + ' has been scheduled.',
              date: dateStr,
              type: 'online_meeting',
              icon: Video,
              color: '#3B82F6',
              url: data.meetingLink || '',
              rawDate: data.createdAt?.toMillis?.() || 0
            };
          });
          setMeetingsList(list);
        }
      },
      (error) => {
        console.error('Error fetching meetings:', error);
      }
    );

    return () => { unsubscribe(); unsubscribeMeetings(); };`;
if (content.match(returnMatch)) {
  content = content.replace(returnMatch, meetingsLogic);
}

fs.writeFileSync(targetFile, content, 'utf8');
console.log('Successfully updated UpdatesScreen.tsx');

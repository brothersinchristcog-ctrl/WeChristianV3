const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src', 'screens', 'admin', 'AdminOnlineMeetings.tsx');
let content = fs.readFileSync(file, 'utf8');

// 1. Add attendees state
if (!content.includes('const [attendees, setAttendees] = useState<any[]>([])')) {
  content = content.replace(
    "const [listFilter, setListFilter] = useState<'all' | 'upcoming' | 'live' | 'completed'>('all');",
    "const [listFilter, setListFilter] = useState<'all' | 'upcoming' | 'live' | 'completed'>('all');\n  const [attendees, setAttendees] = useState<any[]>([]);"
  );
}

// 2. Add useEffect for attendees
const attendeesEffect = `
  useEffect(() => {
    if (!activeChurch?.id || !selectedMeeting?.id) {
      setAttendees([]);
      return;
    }
    const unsubscribe = firestore()
      .collection('churches')
      .doc(activeChurch.id)
      .collection('online_meetings')
      .doc(selectedMeeting.id)
      .collection('attendees')
      .onSnapshot(snapshot => {
        if (!snapshot) return;
        const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAttendees(list);
      });
    return () => unsubscribe();
  }, [activeChurch?.id, selectedMeeting?.id]);
`;

if (!content.includes("collection('attendees')")) {
  content = content.replace(
    "const [stats, setStats] = useState({",
    attendeesEffect + "\n  const [stats, setStats] = useState({"
  );
}

// 3. Update Live Attendance Text
content = content.replace(
  "Live Attendance (0)",
  "Live Attendance ({attendees.length})"
);

// 4. Render Attendees List below the text
const newLiveAttendanceBlock = `<View style={{ marginTop: 20, alignItems: 'flex-start', paddingHorizontal: 4, paddingBottom: 20 }}>
                <Text style={{ color: colors.ink, fontSize: 18, fontWeight: '800', fontFamily: serifFont }}>Live Attendance ({attendees.length})</Text>
                {attendees.map(a => (
                  <View key={a.id} style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
                    <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: '#e2e8f0', justifyContent: 'center', alignItems: 'center' }}>
                      <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#64748b' }}>{a.name?.charAt(0) || '?'}</Text>
                    </View>
                    <Text style={{ marginLeft: 10, color: '#334155', fontWeight: '500' }}>{a.name}</Text>
                  </View>
                ))}
              </View>`;

content = content.replace(
  /<View style={{ marginTop: 20, alignItems: 'flex-start', paddingHorizontal: 4, paddingBottom: 20 }}>[\s\S]*?Live Attendance \({attendees\.length}\)<\/Text>\s*<\/View>/,
  newLiveAttendanceBlock
);


// 5. Update Start Class button to send push notification
const oldStartBtn = /onPress={\(\) => {\s*if \(selectedMeeting\.meetingLink\) {\s*Linking\.openURL\(selectedMeeting\.meetingLink\);\s*}\s*else\s*{\s*Alert\.alert\('No link', 'No meeting link provided for this class\.'\);\s*}\s*}}/g;

const newStartBtn = `onPress={async () => {
                    if (selectedMeeting.meetingLink) {
                      try {
                        await firestore().collection('churches').doc(activeChurch.id).collection('broadcasts').add({
                          title: \`🔴 Live Now: \${selectedMeeting.title}\`,
                          content: \`The online meeting has started. Tap to join!\`,
                          type: 'online_meeting',
                          targetChurchId: activeChurch.id,
                          createdAt: firestore.FieldValue.serverTimestamp(),
                          meetingId: selectedMeeting.id,
                          url: selectedMeeting.meetingLink || ''
                        });
                      } catch(e) { console.warn(e); }
                      Linking.openURL(selectedMeeting.meetingLink);
                    } else {
                      Alert.alert('No link', 'No meeting link provided for this class.');
                    }
                  }}`;

content = content.replace(oldStartBtn, newStartBtn);

fs.writeFileSync(file, content, 'utf8');
console.log('Successfully updated AdminOnlineMeetings.tsx');

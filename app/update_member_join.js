const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src', 'screens', 'OnlineMeetingsScreen.tsx');
let content = fs.readFileSync(file, 'utf8');

// 1. Add useAuth import
if (!content.includes("import { useAuth }")) {
  content = content.replace(
    "import { useChurch } from '../context/ChurchContext';",
    "import { useAuth } from '../context/AuthContext';\nimport { useChurch } from '../context/ChurchContext';"
  );
}

// 2. Add useAuth hook
if (!content.includes("const { user, member } = useAuth();")) {
  content = content.replace(
    "const { activeChurch } = useChurch();",
    "const { activeChurch } = useChurch();\n  const { user, member } = useAuth();"
  );
}

// 3. Update join button onPress
const joinBtnRegex = /onPress={\(\) => Linking\.openURL\(item\.meetingLink\)}/g;
const newJoinBtn = `onPress={async () => {
              if (activeChurch?.id && member) {
                try {
                  await firestore().collection('churches').doc(activeChurch.id).collection('online_meetings').doc(item.id).collection('attendees').doc(member.id).set({
                    name: member.name || user?.displayName || 'Unknown Member',
                    profilePhoto: member.profilePhoto || member.photoURL || user?.photoURL || null,
                    joinedAt: firestore.FieldValue.serverTimestamp()
                  }, { merge: true });
                } catch (e) {
                  console.log('Attendance log error:', e);
                }
              }
              Linking.openURL(item.meetingLink);
            }}`;

content = content.replace(joinBtnRegex, newJoinBtn);

fs.writeFileSync(file, content, 'utf8');
console.log('Successfully updated OnlineMeetingsScreen.tsx for attendance logging');

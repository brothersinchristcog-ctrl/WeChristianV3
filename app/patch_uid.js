const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'screens', 'ProfileScreen.tsx');
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(
  `<Text style={styles.userName} numberOfLines={1}>
            {member?.name || user?.displayName || 'Member'}
          </Text>`,
  `<Text style={styles.userName} numberOfLines={1}>
            {member?.name || user?.displayName || 'Member'}
          </Text>
          <Text selectable style={{ color: '#FCD34D', fontSize: 13, marginTop: 4 }}>
            UID: {user?.uid}
          </Text>`
);

fs.writeFileSync(filePath, content);
console.log('ProfileScreen UID patched successfully.');

const fs = require('fs');
const path = require('path');

const filesToRefactor = [
    'AdminMembers.tsx',
    'AdminPrayerModeration.tsx',
    'AdminEventList.tsx',
    'AdminPromiseList.tsx',
    'AdminSermonList.tsx',
    'AdminDashboard.tsx'
];

const dir = 'c:/Users/yraje/WeChristian2/app/src/screens/admin';

for (const filename of filesToRefactor) {
    const filePath = path.join(dir, filename);
    if (!fs.existsSync(filePath)) continue;

    let content = fs.readFileSync(filePath, 'utf8');

    // Make sure Platform is imported
    if (!content.includes("Platform,") && !content.includes(" Platform ")) {
        content = content.replace("import {", "import { Platform,");
    }

    // Replace the old header styles with the new fixed hero styles
    if (!content.includes('header: { \n    backgroundColor: \'#1a2d5a\',')) {
        content = content.replace(/header:\s*\{[\s\S]*?\},/, `header: { 
    backgroundColor: '#1a2d5a', 
    paddingTop: Platform.OS === 'ios' ? 60 : 30,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    position: 'relative',
    zIndex: 10,
    marginBottom: 20,
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingVertical: 4, paddingHorizontal: 2 },
  backBtnTxt: { fontSize: 13, fontWeight: '700', color: '#fff' },
  heroTitles: { flex: 1, borderLeftWidth: 1, borderLeftColor: 'rgba(255,255,255,0.2)', paddingLeft: 12 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 11, color: '#F3EAD9', marginTop: 2 },`);
    }

    // For AdminMembers, pull the header out of the ScrollView
    if (filename === 'AdminMembers.tsx') {
        if (content.includes('{/* Header Section */}')) {
            const headerBlock = `      {/* ── Fixed Header ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation?.goBack?.()}>
          <ChevronLeft size={22} color="#fff" />
          <Text style={styles.backBtnTxt}>Back</Text>
        </TouchableOpacity>
        <View style={styles.heroTitles}>
          <Text style={styles.headerTitle}>Church Members</Text>
          <Text style={styles.headerSub}>Directory & Status Tracking</Text>
        </View>
        <TouchableOpacity 
            style={[styles.headerIconCircle, { backgroundColor: '#F3EAD9', width: 'auto', paddingHorizontal: 16, flexDirection: 'row', gap: 6, borderRadius: 20 }]}
            onPress={() => setAddModalVisible(true)}
          >
            <Plus size={18} color="#1a2d5a" />
            <Text style={{ color: '#1a2d5a', fontWeight: 'bold' }}>Add Member</Text>
        </TouchableOpacity>
      </View>\n`;
            
            // Remove the old header from inside the ScrollView
            content = content.replace(/\s*\{\/\*\s*Header Section\s*\*\/\}\s*<View style=\{styles\.header\}>[\s\S]*?<\/View>/, '');
            
            // Insert the new header BEFORE the ScrollView
            content = content.replace('<ScrollView ', headerBlock + '\n      <ScrollView ');

            // Fix imports
            if (!content.includes('ChevronLeft')) {
                content = content.replace("import { Users,", "import { ChevronLeft, Users,");
            }
        }
    }

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Refactored ${filename}`);
}

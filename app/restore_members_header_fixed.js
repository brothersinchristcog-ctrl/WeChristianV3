const fs = require('fs');

const filePath = 'c:/Users/yraje/WeChristian2/app/src/screens/admin/AdminMembers.tsx';
let content = fs.readFileSync(filePath, 'utf8');

if (!content.includes('ChevronLeft')) {
    content = content.replace("import { Users,", "import { ChevronLeft, Users,");
}

if (!content.includes("Platform,")) {
    content = content.replace("import { \n  StyleSheet,", "import { \n  Platform,\n  StyleSheet,");
}

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

const stylesBlock = `header: { 
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
  headerSub: { fontSize: 11, color: '#F3EAD9', marginTop: 2 },`;

if (!content.includes('backgroundColor: \'#1a2d5a\'')) {
    content = content.replace(/header:\s*\{[\s\S]*?\},/, stylesBlock);
}

// Instead of string index, use regex safely
content = content.replace('<ScrollView ', headerBlock + '      <ScrollView ');

// Now remove the old inner header inside the ScrollView
content = content.replace(/\s*\{\/\*\s*Header Section\s*\*\/\}\s*<View style=\{styles\.header\}>[\s\S]*?<\/View>\s*<\/View>\s*<\/View>/, '');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed AdminMembers.tsx');

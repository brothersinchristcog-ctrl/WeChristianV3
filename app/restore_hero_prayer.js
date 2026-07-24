const fs = require('fs');
const path = require('path');

const filePath = 'c:/Users/yraje/WeChristian2/app/src/screens/admin/AdminPrayerModeration.tsx';
if (!fs.existsSync(filePath)) process.exit(0);

let content = fs.readFileSync(filePath, 'utf8');

// Replace the old header styles with the new fixed hero styles
if (!content.includes('header: { \n    backgroundColor: \'#1a2d5a\',')) {
    content = content.replace(/secHd:\s*\{[\s\S]*?\},/, `header: { 
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
headerSub: { fontSize: 11, color: '#F3EAD9', marginTop: 2 },\nsecHd: { marginBottom: 15 },`);
}

// Pull the header out of the ScrollView
if (content.includes('{/* ── Section Heading ── */}')) {
    const headerBlock = `      {/* ── Fixed Header ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation?.goBack?.()}>
          <ChevronLeft size={22} color="#fff" />
          <Text style={styles.backBtnTxt}>Back</Text>
        </TouchableOpacity>
        <View style={styles.heroTitles}>
          <Text style={styles.headerTitle}>Prayer Wall</Text>
          <Text style={styles.headerSub}>Manage incoming requests</Text>
        </View>
        <TouchableOpacity 
            style={[styles.headerCreateBtn, { backgroundColor: '#F3EAD9' }]}
            onPress={() => setShowCreateModal(true)}
          >
            <Plus size={14} color="#1a2d5a" />
            <Text style={[styles.headerCreateBtnTxt, { color: '#1a2d5a' }]}>Create</Text>
        </TouchableOpacity>
      </View>\n`;
    
    // Remove the old header from inside the ScrollView
    content = content.replace(/\s*\{\/\*\s*── Section Heading ──\s*\*\/\}\s*<View style=\{\[styles\.secHd, \{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' \}\]\}>[\s\S]*?<\/View>\s*<\/View>/, '');
    
    // Insert the new header BEFORE the ScrollView
    content = content.replace('<ScrollView\n        showsVerticalScrollIndicator={false}', headerBlock + '      <ScrollView\n        showsVerticalScrollIndicator={false}');

    // Fix imports
    if (!content.includes('ChevronLeft')) {
        content = content.replace("import { CheckCircle,", "import { ChevronLeft, CheckCircle,");
    }
}

fs.writeFileSync(filePath, content, 'utf8');
console.log(`Refactored AdminPrayerModeration.tsx`);

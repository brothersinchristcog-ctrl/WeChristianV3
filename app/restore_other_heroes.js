const fs = require('fs');

const files = [
  'c:/Users/yraje/WeChristian2/app/src/screens/admin/AdminDashboard.tsx',
  'c:/Users/yraje/WeChristian2/app/src/screens/admin/AdminEventList.tsx',
  'c:/Users/yraje/WeChristian2/app/src/screens/admin/AdminPromiseList.tsx',
  'c:/Users/yraje/WeChristian2/app/src/screens/admin/AdminSermonList.tsx'
];

for (const filePath of files) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Fix Platform import
  if (!content.includes('ChevronLeft')) {
    content = content.replace("import { View,", "import { ChevronLeft, View,");
  }
  if (!content.includes("Platform,")) {
    content = content.replace("import { \n  View,", "import { \n  Platform,\n  View,");
    if (!content.includes("Platform,")) {
      content = content.replace("import { View,", "import { Platform, View,");
    }
  }

  // Dashboard specific
  if (filePath.includes('AdminDashboard.tsx')) {
    if (!content.includes('<View style={styles.adminHeader}>')) {
      const headerBlock = `      {/* ── Admin Header ── */}
      <View style={styles.adminHeader}>
        <View style={styles.heroTitles}>
          <Text style={styles.headerTitle}>Pastor's Desk</Text>
          <Text style={styles.headerSub}>Church Management Overview</Text>
        </View>
      </View>\n`;
      content = content.replace('{/* ── Admin Header ── */}\n      <ScrollView', headerBlock + '      <ScrollView');
      
      const stylesBlock = `adminHeader: { 
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
  heroTitles: { flex: 1, paddingLeft: 4 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 13, color: '#F3EAD9', marginTop: 2 },`;

      if (!content.includes('headerTitle: {')) {
         content = content.replace(/adminHeader:\s*\{[\s\S]*?\},/, stylesBlock);
      }
    }
  } 
  else {
    // For EventList, PromiseList, SermonList
    let title = 'Events';
    let sub = 'Manage church calendar';
    if (filePath.includes('PromiseList')) {
        title = 'Daily Promises';
        sub = 'Manage daily verses';
    } else if (filePath.includes('SermonList')) {
        title = 'Sermons';
        sub = 'Manage church teachings';
    }

    if (!content.includes('backgroundColor: \'#1a2d5a\'') || !content.includes('styles.header')) {
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
  headerSub: { fontSize: 11, color: '#F3EAD9', marginTop: 2 },\nsecHd: { marginBottom: 15 },`;

        content = content.replace(/secHd:\s*\{[\s\S]*?\},/, stylesBlock);
        
        const headerBlock = `      {/* ── Fixed Header ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation?.goBack?.()}>
          <ChevronLeft size={22} color="#fff" />
          <Text style={styles.backBtnTxt}>Back</Text>
        </TouchableOpacity>
        <View style={styles.heroTitles}>
          <Text style={styles.headerTitle}>${title}</Text>
          <Text style={styles.headerSub}>${sub}</Text>
        </View>
        <TouchableOpacity 
            style={[styles.headerCreateBtn, { backgroundColor: '#F3EAD9' }]}
            onPress={() => navigation?.navigate(filePath.includes('Promise') ? 'AdminPromiseEditor' : filePath.includes('Sermon') ? 'AdminSermonEditor' : 'AdminEventEditor')}
          >
            <Plus size={14} color="#1a2d5a" />
            <Text style={[styles.headerCreateBtnTxt, { color: '#1a2d5a' }]}>Create</Text>
        </TouchableOpacity>
      </View>\n`;
        
        // Remove old secHd view
        content = content.replace(/\s*\{\/\*\s*── Section Heading ──\s*\*\/\}\s*<View style=\{\[styles\.secHd[\s\S]*?<\/View>\s*<\/View>/, '');
        
        // Insert new header before ScrollView
        content = content.replace('<ScrollView\n        showsVerticalScrollIndicator={false}', headerBlock + '      <ScrollView\n        showsVerticalScrollIndicator={false}');
    }
  }

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Fixed ' + filePath);
}

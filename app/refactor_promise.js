const fs = require('fs');

let content = fs.readFileSync('c:/Users/yraje/WeChristian2/app/src/screens/admin/AdminPromiseList.tsx', 'utf8');

// 1. Add Platform import if missing
if (!content.includes('Platform,')) {
    content = content.replace("import { View,", "import { Platform, View,");
}

// 2. Global Header Injection
const globalHeader = `
      {/* ── Global Church Header ── */}
      <View style={styles.globalHeader}>
        <TouchableOpacity style={styles.menuBtn} onPress={() => navigation.toggleDrawer?.()}>
          <View style={styles.hamburgerLine} />
          <View style={styles.hamburgerLine} />
          <View style={styles.hamburgerLine} />
        </TouchableOpacity>
        <Image source={require('../../../assets/logo.png')} style={styles.globalLogo} />
        <View>
          <Text style={styles.globalTitle}>Bethesda Penthecosth{'\n'}church</Text>
          <Text style={styles.globalSub}>Admin Dashboard</Text>
        </View>
        <View style={styles.roleBadge}><Text style={styles.roleBadgeTxt}>Pastor</Text></View>
      </View>
`;

if (!content.includes('Global Church Header')) {
    content = content.replace("return (\n    <View style={styles.container}>", "return (\n    <View style={styles.container}>\n" + globalHeader);
}

// 3. Hero Section Rewrite
const newHero = `
        {/* ── Admin Hero Section ── */}
        <View style={styles.adminHero}>
          <Text style={styles.heroEyebrow}>— CHURCH ADMIN • DAILY PROMISE MANAGER</Text>
          <View style={styles.heroRow}>
            <Text style={styles.heroTitle}>Daily Promises</Text>
            <TouchableOpacity style={styles.newBtnTop} onPress={() => navigation.navigate('AdminPromiseEditor')}>
              <Text style={styles.newBtnTxt}>+ New</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.heroSub}>English + తెలుగు • YouTube links</Text>
        </View>
`;

content = content.replace(/<View style=\{styles\.header\}>[\s\S]*?<\/View>/, newHero);

// 4. Background and Styles Rewrite
const newStyles = `container: { flex: 1, backgroundColor: '#f5ead8' },
  globalHeader: {
    backgroundColor: '#1a2d5a',
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  menuBtn: { marginRight: 15, gap: 5 },
  hamburgerLine: { width: 22, height: 2, backgroundColor: '#fff' },
  globalLogo: { width: 36, height: 36, borderRadius: 18, marginRight: 12 },
  globalTitle: { color: '#fff', fontSize: 16, fontWeight: '700', lineHeight: 20 },
  globalSub: { color: '#9CA3AF', fontSize: 11 },
  roleBadge: { marginLeft: 'auto', backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  roleBadgeTxt: { color: '#fff', fontSize: 10, fontWeight: '600' },
  adminHero: { 
    backgroundColor: '#1a2d5a', 
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    marginBottom: 20,
  },
  heroEyebrow: { color: '#d9a05b', fontSize: 10, fontWeight: '800', letterSpacing: 1, marginBottom: 8 },
  heroRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  heroTitle: { color: '#fff', fontSize: 32, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  heroSub: { color: '#9CA3AF', fontSize: 12 },
  newBtnTop: { backgroundColor: '#d9a05b', paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20 },
  newBtnTxt: { color: '#1a2d5a', fontSize: 12, fontWeight: '700' },
  scroll: { paddingHorizontal: 16, paddingBottom: 20 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 15 },
  statCard: { flex: 1, backgroundColor: '#fffcf6', borderRadius: 8, paddingVertical: 15, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  statVal: { fontSize: 24, fontWeight: '700' },
  statLbl: { fontSize: 10, color: '#9CA3AF', marginTop: 4, letterSpacing: 0.5 },
  globalAlert: { backgroundColor: '#f9dedb', borderRadius: 8, padding: 16, marginBottom: 25, flexDirection: 'row', alignItems: 'flex-start', gap: 12, borderWidth: 1, borderColor: '#f3c4c0' },
  globalAlertTxt: { flex: 1, fontSize: 12, color: '#991B1B', lineHeight: 18 },
  secHdRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, marginTop: 15 },
  secHd: { fontSize: 12, fontWeight: '700', color: '#6b7280', letterSpacing: 1 },
`;

// Replace everything from container down to secHd
content = content.replace(/container: \{ flex: 1, backgroundColor: '#fcfdff' \},[\s\S]*?secHd: \{ [^\}]+\},/, newStyles);

fs.writeFileSync('c:/Users/yraje/WeChristian2/app/src/screens/admin/AdminPromiseList.tsx', content);

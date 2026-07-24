const fs = require('fs');
let c = fs.readFileSync('c:/Users/yraje/WeChristian2/app/src/screens/admin/AdminDashboard.tsx', 'utf8');

if (!c.includes('Platform,')) {
    c = c.replace('import { \n  StyleSheet', 'import { \n  Platform,\n  StyleSheet');
}

const headerBlock = `      {/* ── Admin Header ── */}
      <View style={styles.adminHeader}>
        <View style={styles.heroTitles}>
          <Text style={styles.headerTitle}>Pastor's Desk</Text>
          <Text style={styles.headerSub}>Church Management Overview</Text>
        </View>
      </View>\n`;
      
if (!c.includes('<View style={styles.adminHeader}>')) {
    c = c.replace('{/* ── Admin Header ── */}\n      <ScrollView', headerBlock + '      <ScrollView');
}

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

if (!c.includes('headerTitle: {')) {
    c = c.replace(/adminHeader:\s*\{[\s\S]*?\},/, stylesBlock);
}

fs.writeFileSync('c:/Users/yraje/WeChristian2/app/src/screens/admin/AdminDashboard.tsx', c);

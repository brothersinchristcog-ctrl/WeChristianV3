const fs = require('fs');
const path = require('path');

const targetPath = path.resolve('c:/Users/yraje/WeChristian2/app/src/screens/admin/AdminEventList.tsx');
let content = fs.readFileSync(targetPath, 'utf8');

// 1. Add COLORS and FONTS definitions if missing
if (!content.includes('const COLORS = {')) {
  content = content.replace(
    /const \{ width \} = Dimensions\.get\('window'\);/,
    `const { width } = Dimensions.get('window');\n\nconst COLORS = {
  ink: '#151C33',
  ink2: '#22304F',
  inkSoft: '#6B7593',
  parchment: '#F3EAD9',
  paper: '#FFFCF5',
  gold: '#A67C3D',
  goldDeep: '#8C6428',
  goldBright: '#D8B369',
  clay: '#A24B34',
  clayBg: '#F3E1D6',
  clayLine: '#E3C3B2',
  moss: '#3E6B52',
  mossBg: '#E6EFE7',
  rule: '#DED0AC',
};\n\nconst FONTS = {
  serif: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  sans: Platform.OS === 'ios' ? 'System' : 'sans-serif',
};`
  );
}

// ensure Platform is imported
if (!content.includes('Platform,')) {
  content = content.replace(/StatusBar,/g, 'StatusBar,\n  Platform,');
}
// ensure ChevronLeft is imported
if (!content.includes('ChevronLeft')) {
  content = content.replace(/Trash2 \} from 'lucide-react-native';/, 'Trash2, ChevronLeft } from \'lucide-react-native\';');
}

// 2. Fix Header
const oldHeader = `<View style={styles.secHd}>
          <View>
            <Text style={styles.secTitle}>📅 Event Manager</Text>
            <Text style={styles.secSub}>Church Gatherings · కూటములు</Text>
          </View>
          <TouchableOpacity style={styles.newBtn} onPress={() => { setEditingData(null); setActiveTab(8); }}>
            <Text style={styles.newBtnTxt}>+ New</Text>
          </TouchableOpacity>
        </View>`;

const newHeader = `<View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
          <TouchableOpacity onPress={() => setActiveTab(0)} style={styles.backBtn}>
            <ChevronLeft size={22} color="#fff" />
            <Text style={styles.backBtnTxt}>Back</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.heroTitles}>
          <Text style={styles.headerTitle}>All Events</Text>
          <Text style={styles.headerSub}>Manage church events & calendars</Text>
        </View>
        <TouchableOpacity style={styles.newBtn} onPress={() => { setEditingData(null); setActiveTab(8); }}>
          <Text style={styles.newBtnTxt}>+ NEW EVENT</Text>
        </TouchableOpacity>
      </View>`;
content = content.replace(oldHeader, newHeader);

// 3. Fix ScrollView Background
content = content.replace(/backgroundColor: '#f0f2f7'/g, 'backgroundColor: COLORS.paper');

// 4. Update Styles
const styleStart = content.indexOf('const styles = StyleSheet.create({');
if (styleStart !== -1) {
  content = content.substring(0, styleStart);
  
  content += `const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.paper },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.paper },
  scroll: { paddingBottom: 80 },

  header: { 
    backgroundColor: COLORS.ink, 
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight! + 16 : 46,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 3,
    borderBottomColor: COLORS.goldDeep,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    marginBottom: 16,
    position: 'relative'
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingVertical: 4, paddingHorizontal: 2 },
  backBtnTxt: { fontSize: 13, fontWeight: '700', color: '#fff', fontFamily: FONTS.sans },
  heroTitles: { borderLeftWidth: 1, borderLeftColor: 'rgba(255,255,255,0.2)', paddingLeft: 12 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff', fontFamily: FONTS.serif },
  headerSub: { fontSize: 11, color: COLORS.parchment, fontFamily: FONTS.sans, marginTop: 2 },
  
  newBtn: { position: 'absolute', bottom: -16, right: 24, backgroundColor: COLORS.clay, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 100, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 },
  newBtnTxt: { color: '#fff', fontSize: 11, fontWeight: '800', fontFamily: FONTS.serif, letterSpacing: 0.5 },

  statsRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, marginBottom: 20 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 12, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: COLORS.rule, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  statNum: { fontSize: 22, fontWeight: '800', fontFamily: FONTS.serif },
  statLbl: { fontSize: 9, color: COLORS.inkSoft, marginTop: 2, textTransform: 'uppercase', fontWeight: '700', fontFamily: FONTS.sans },

  listLabel: { fontSize: 13, fontWeight: '800', color: COLORS.ink, marginBottom: 12, marginTop: 4, paddingHorizontal: 20, textTransform: 'uppercase', fontFamily: FONTS.serif },

  eventItem: { backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: COLORS.rule, padding: 14, marginHorizontal: 20, marginBottom: 12, flexDirection: 'row', gap: 14, alignItems: 'flex-start', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 3, elevation: 1 },
  featuredItem: { borderWidth: 2, borderColor: COLORS.ink, backgroundColor: '#FAFBFC' },
  eiThumb: { width: 90, height: 60, backgroundColor: COLORS.ink2, borderRadius: 8, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  eiThumbImg: { width: '100%', height: '100%' },
  eiThumbTxt: { color: COLORS.parchment, fontSize: 10, fontWeight: '800', fontFamily: FONTS.sans },
  
  eiBody: { flex: 1 },
  eiTitle: { fontSize: 14, fontWeight: '700', color: COLORS.ink, fontFamily: FONTS.serif, marginBottom: 2 },
  eiTe: { fontSize: 11, color: COLORS.inkSoft, fontStyle: 'italic', marginBottom: 4, fontFamily: FONTS.serif },
  eiMetaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  eiMetaTxt: { fontSize: 11, color: COLORS.inkSoft, marginLeft: 4, fontFamily: FONTS.sans, fontWeight: '500' },
  
  eiFoot: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  eiEdit: { backgroundColor: COLORS.paper, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100, borderWidth: 1, borderColor: COLORS.rule },
  
  badgePub: { backgroundColor: COLORS.mossBg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  badgePubTxt: { color: COLORS.moss, fontSize: 10, fontWeight: '800', fontFamily: FONTS.sans },
  badgeDraft: { backgroundColor: '#F1F5F9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  badgeDraftTxt: { color: COLORS.inkSoft, fontSize: 10, fontWeight: '800', fontFamily: FONTS.sans },
  
  actionsContainer: { borderLeftWidth: 1, borderLeftColor: COLORS.rule, paddingLeft: 8, justifyContent: 'center', gap: 0 },
  editAction: { alignItems: 'center', justifyContent: 'center', gap: 3, paddingHorizontal: 4, paddingVertical: 10 },
  editActionTxt: { fontSize: 9, fontWeight: '700', color: COLORS.ink, textTransform: 'uppercase' },
  deleteAction: { alignItems: 'center', justifyContent: 'center', gap: 3, paddingHorizontal: 4, paddingVertical: 10, borderTopWidth: 1, borderTopColor: COLORS.rule },
  deleteActionTxt: { fontSize: 9, fontWeight: '700', color: COLORS.clay, textTransform: 'uppercase' },
  
  eiLocRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  eiLocTxt: { fontSize: 11, color: COLORS.inkSoft, flexShrink: 1 },
  eiStatusRow: { marginTop: 7 },
});
`;
}

fs.writeFileSync(targetPath, content, 'utf8');
console.log('AdminEventList.tsx safe UI applied!');

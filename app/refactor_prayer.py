import fs
import os

target_file = r'c:\Users\yraje\WeChristian2\app\src\screens\admin\AdminPrayerModeration.tsx'

with open(target_file, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add COLORS and FONTS
color_fonts = """
const COLORS = {
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
};

const FONTS = {
  serif: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  sans: Platform.OS === 'ios' ? 'System' : 'sans-serif',
};
"""
if 'const COLORS' not in content:
    content = content.replace("const { width } = Dimensions.get('window');", "const { width } = Dimensions.get('window');\n" + color_fonts)

# 2. Add ChevronLeft and useNavigation imports
import_lucide = """  Megaphone
} from 'lucide-react-native';"""
new_import_lucide = """  Megaphone,
  ChevronLeft
} from 'lucide-react-native';"""
content = content.replace(import_lucide, new_import_lucide)

import_auth = "import { useAuth } from '../../context/AuthContext';"
new_import_auth = "import { useAuth } from '../../context/AuthContext';\nimport { useNavigation } from '@react-navigation/native';"
content = content.replace(import_auth, new_import_auth)

# 3. Add useNavigation to component
component_start = "export default function AdminPrayerModeration() {"
new_component_start = "export default function AdminPrayerModeration() {\n  const navigation = useNavigation<any>();"
content = content.replace(component_start, new_component_start)

# 4. Replace Hero Section
old_hero = """        {/* ── Section Heading ── */}
        <View style={[styles.secHd, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
          <View>
            <Text style={styles.secTitle}>🙏 Prayer Moderation</Text>
            <Text style={styles.secSub}>Real-time requests from Salesforce</Text>
          </View>
          <TouchableOpacity 
            style={styles.headerCreateBtn}
            onPress={() => setShowCreateModal(true)}
          >
            <Plus size={14} color="#fff" />
            <Text style={styles.headerCreateBtnTxt}>Create</Text>
          </TouchableOpacity>
        </View>"""

new_hero = """      {/* ── Page Header (Hero Style) ── */}
      <View style={styles.hero}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ChevronLeft size={22} color="#fff" />
          <Text style={styles.backBtnTxt}>Back</Text>
        </TouchableOpacity>
        <View style={styles.heroTitles}>
          <Text style={styles.heroTitle}>Prayer Moderation</Text>
          <Text style={styles.heroSub}>Manage real-time prayer requests</Text>
        </View>
        <TouchableOpacity style={styles.heroActionBtn} onPress={() => setShowCreateModal(true)}>
          <Plus size={20} color={COLORS.ink} strokeWidth={2.5} />
        </TouchableOpacity>
      </View>"""

content = content.replace(old_hero, "")

scroll_start = """      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >"""
new_scroll_start = new_hero + "\n\n" + scroll_start

content = content.replace(scroll_start, new_scroll_start)
content = content.replace('<StatusBar barStyle="dark-content" />', '<StatusBar barStyle="light-content" />')


# 5. Fix Text node errors
content = content.replace("pendingPrayers.length > 0 && (", "Boolean(pendingPrayers.length) && (")
content = content.replace("answeredPrayers.length > 0 && (", "Boolean(answeredPrayers.length) && (")
content = content.replace("item.replies && item.replies.length > 0 && (", "Boolean(item.replies?.length) && (")
content = content.replace("memberSearchResults.length > 0 && !selectedMember && (", "Boolean(memberSearchResults.length) && !selectedMember && (")
content = content.replace("item.textTe && item.textTe.trim() !== (item.text || '').trim() && (", "Boolean(item.textTe) && item.textTe.trim() !== (item.text || '').trim() && (")

# 6. Replace styles block completely
import re
new_styles = """const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.parchment },
  scroll: { padding: 16, paddingBottom: 100 },

  hero: { backgroundColor: '#1a2d5a', padding: 20, paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingBottom: 30, borderBottomLeftRadius: 30, borderBottomRightRadius: 30, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 8, marginBottom: 15 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingVertical: 4, paddingHorizontal: 2 },
  backBtnTxt: { fontSize: 13, fontWeight: '700', color: '#fff', fontFamily: FONTS.sans },
  heroTitles: { flex: 1, borderLeftWidth: 1, borderLeftColor: 'rgba(255,255,255,0.2)', paddingLeft: 12, marginLeft: 12 },
  heroTitle: { fontSize: 24, fontWeight: '900', color: '#fff', fontFamily: FONTS.serif, marginBottom: 4 },
  heroSub: { fontSize: 13, color: COLORS.parchment, fontWeight: '600', fontFamily: FONTS.sans },
  heroActionBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.4)', justifyContent: 'center', alignItems: 'center' },

  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 18 },
  statCard: { flex: 1, backgroundColor: COLORS.paper, borderRadius: 16, paddingVertical: 18, alignItems: 'center', elevation: 3, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, borderWidth: 1, borderColor: COLORS.rule },
  statVal: { fontSize: 24, fontWeight: '900', fontFamily: FONTS.serif },
  statLbl: { fontSize: 11, color: COLORS.inkSoft, marginTop: 4, fontWeight: '600' },

  listHd: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  listHdTitle: { fontSize: 14, fontWeight: '800', color: COLORS.ink, textTransform: 'uppercase', letterSpacing: 0.5 },

  pCard: { backgroundColor: COLORS.paper, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: COLORS.rule },
  pCardAnswered: { backgroundColor: COLORS.mossBg, borderColor: '#C8E6C9' },
  pCardHd: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  pAvatar: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  pAvatarTxt: { color: '#fff', fontSize: 14, fontWeight: '800', fontFamily: FONTS.serif },
  pUserName: { fontSize: 14, fontWeight: '800', color: COLORS.ink, fontFamily: FONTS.serif },
  pTime: { fontSize: 11, color: COLORS.inkSoft, marginTop: 2, fontWeight: '500' },

  ansBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#DCFCE7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  ansBadgeTxt: { fontSize: 9, fontWeight: '800', color: '#15803D' },

  pTextContainer: { backgroundColor: 'rgba(0,0,0,0.02)', borderRadius: 12, padding: 18, marginBottom: 15, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  pText: { fontSize: 14, color: COLORS.ink, lineHeight: 22, fontFamily: FONTS.serif },

  pFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  catBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  catDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.goldDeep },
  catTxt: { fontSize: 11, fontWeight: '700', color: COLORS.inkSoft },

  pActions: { flexDirection: 'row', gap: 8 },
  pActionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#DCFCE7', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  pActionBtnTxt: { fontSize: 11, fontWeight: '800', color: '#15803D' },

  pastorSection: { backgroundColor: COLORS.paper, borderRadius: 16, padding: 20, marginTop: 20, borderWidth: 1, borderColor: COLORS.rule },
  pastorSecTitle: { fontSize: 14, fontWeight: '800', color: COLORS.ink, marginBottom: 20 },
  inputGroup: { marginBottom: 15 },
  inputLabel: { fontSize: 12, fontWeight: '800', color: COLORS.ink, marginBottom: 8 },
  textArea: { backgroundColor: '#fff', borderWidth: 1, borderColor: COLORS.rule, borderRadius: 12, minHeight: 80, paddingHorizontal: 12, marginBottom: 10 },
  textInput: { fontSize: 13, color: COLORS.ink, paddingVertical: 12, textAlignVertical: 'top', fontFamily: FONTS.serif },
  pickerBtn: { height: 50, backgroundColor: '#fff', borderWidth: 1, borderColor: COLORS.rule, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15 },
  pickerTxt: { fontSize: 14, color: COLORS.ink, fontWeight: '600' },
  categoryList: { backgroundColor: '#fff', borderWidth: 1, borderColor: COLORS.rule, borderRadius: 12, padding: 4, marginTop: 4, elevation: 5, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
  catOption: { paddingVertical: 14, paddingHorizontal: 15, borderBottomWidth: 0.5, borderBottomColor: COLORS.rule },
  catOptionActive: { backgroundColor: COLORS.goldBright },
  catOptionTxt: { fontSize: 14, color: COLORS.ink, fontWeight: '500' },
  publishBtn: { height: 56, backgroundColor: COLORS.ink, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 10, elevation: 4, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10 },
  publishBtnTxt: { color: '#fff', fontSize: 15, fontWeight: '800', fontFamily: FONTS.serif },

  // Search Styles
  searchBox: { height: 50, backgroundColor: '#fff', borderWidth: 1, borderColor: COLORS.rule, borderRadius: 12, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, gap: 10 },
  searchInput: { flex: 1, fontSize: 14, color: COLORS.ink, fontFamily: FONTS.serif },
  searchResults: { backgroundColor: '#fff', borderWidth: 1, borderColor: COLORS.rule, borderRadius: 12, marginTop: 4, maxHeight: 200, overflow: 'hidden', elevation: 5, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
  searchItem: { padding: 14, borderBottomWidth: 0.5, borderBottomColor: COLORS.rule, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  searchItemName: { fontSize: 14, fontWeight: '800', color: COLORS.ink, fontFamily: FONTS.serif },
  searchItemPhone: { fontSize: 12, color: COLORS.inkSoft, marginTop: 2 },
  selectedBadge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.ink, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 10, marginTop: 8 },
  selectedBadgeTxt: { color: '#fff', fontSize: 13, fontWeight: '800' },

  createModalOverlay: { flex: 1, backgroundColor: 'rgba(21, 28, 51, 0.75)', justifyContent: 'flex-end' },
  createModalContent: { backgroundColor: COLORS.parchment, borderTopLeftRadius: 30, borderTopRightRadius: 30, height: '85%' },
  createModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, backgroundColor: COLORS.paper, borderTopLeftRadius: 30, borderTopRightRadius: 30, borderBottomWidth: 1, borderBottomColor: COLORS.rule },
  createModalTitle: { fontSize: 18, fontWeight: '900', color: COLORS.ink, fontFamily: FONTS.serif },
  closeBtn: { padding: 4, backgroundColor: COLORS.clayBg, borderRadius: 20 },

  // Success Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(21, 28, 51, 0.75)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  successCard: { backgroundColor: COLORS.paper, borderRadius: 24, padding: 32, width: '100%', maxWidth: 400, alignItems: 'center', elevation: 10, borderWidth: 1, borderColor: COLORS.rule },
  successIconBox: { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.mossBg, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  successIconInner: { width: 60, height: 60, borderRadius: 30, backgroundColor: COLORS.moss, justifyContent: 'center', alignItems: 'center' },
  successTitle: { fontSize: 24, fontWeight: '900', color: COLORS.ink, marginBottom: 12, textAlign: 'center', fontFamily: FONTS.serif },
  successSub: { fontSize: 14, color: COLORS.inkSoft, textAlign: 'center', lineHeight: 22, marginBottom: 30, fontFamily: FONTS.serif },
  successBtn: { backgroundColor: COLORS.goldBright, height: 48, borderRadius: 12, width: '100%', justifyContent: 'center', alignItems: 'center', marginBottom: 10, elevation: 2, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 3 },
  successBtnTxt: { color: COLORS.ink, fontSize: 14, fontWeight: '800', fontFamily: FONTS.serif },

  // Replies Styles
  repliesContainer: { marginTop: 15, paddingTop: 15, borderTopWidth: 1, borderTopColor: COLORS.rule },
  repliesHeader: { fontSize: 12, fontWeight: '800', color: COLORS.ink, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  replyCard: { backgroundColor: '#fff', borderRadius: 10, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: COLORS.rule },
  replyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  replyAuthor: { fontSize: 12, fontWeight: '800', color: COLORS.ink, fontFamily: FONTS.serif },
  replyDate: { fontSize: 11, color: COLORS.inkSoft, fontWeight: '600' },
  replyBody: { fontSize: 14, color: COLORS.ink2, lineHeight: 22, fontFamily: FONTS.serif }
});"""

content = re.sub(r'const styles = StyleSheet\.create\({[\s\S]*?}\);', new_styles, content)

# 7. Update colors inside TSX
content = content.replace("Theme.Colors.primary", "COLORS.ink")
content = content.replace("Theme.Colors.accent", "COLORS.goldDeep")
content = content.replace("Theme.Colors.error", "COLORS.clay")
content = content.replace("Theme.Colors.success", "COLORS.moss")

# 8. Success Card HTML updates inside Animated.View
old_success_body = """<View style={styles.successIconBox}>
              <CheckCircle2 size={40} color="#fff" />
            </View>"""
new_success_body = """<View style={styles.successIconBox}>
              <View style={styles.successIconInner}>
                <CheckCircle2 size={40} color="#fff" />
              </View>
            </View>"""
content = content.replace(old_success_body, new_success_body)

with open(target_file, 'w', encoding='utf-8') as f:
    f.write(content)

const fs = require('fs');
let c = fs.readFileSync('c:/Users/yraje/WeChristian2/app/src/screens/admin/AdminChurchSettings.tsx', 'utf-8');

const oldHeader = /<View style=\{\[styles\.header, \{ backgroundColor: primaryColor \}\]\}>[\s\S]*?<\/View>/;
const newHeader = `        {/* ── Fixed Hero Header ── */}
        <View style={styles.header}>
          {/* Left: Back Button */}
          <View style={{ flex: 1, alignItems: 'flex-start' }}>
            <TouchableOpacity onPress={goBack} style={styles.backBtn}>
              <ChevronLeft size={22} color="#fff" />
              <Text style={styles.backBtnTxt}>Back</Text>
            </TouchableOpacity>
          </View>
          
          {/* Center: Title */}
          <View style={[styles.heroTitles, { flex: 2, alignItems: 'center', justifyContent: 'center' }]}>
            <View style={{ borderLeftWidth: 1, borderLeftColor: 'rgba(255,255,255,0.2)', paddingLeft: 16, paddingVertical: 2 }}>
              <Text style={[styles.headerTitle, { fontSize: 20, textAlign: 'center' }]} numberOfLines={1}>Settings</Text>
              <Text style={[styles.headerSub, { textAlign: 'center' }]}>CHURCH COMPANION</Text>
            </View>
          </View>

          {/* Right: Save/Edit */}
          <View style={{ flex: 1, alignItems: 'flex-end' }}>
            {isEditing ? (
              <TouchableOpacity onPress={handleSave} disabled={saving} style={styles.saveBtn}>
                {saving ? <ActivityIndicator color="#1a2d5a" size="small" /> : <Text style={styles.saveBtnTxt}>Save</Text>}
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={() => setIsEditing(true)} style={styles.editBtn}>
                <Text style={styles.editBtnTxt}>Edit</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>`;
c = c.replace(oldHeader, newHeader);

const oldTabs = /<View style=\{styles\.tabs\}>[\s\S]*?<\/View>/;
const newTabs = `        {/* ── Horizontal Chip Tabs ── */}
        <View style={styles.chipScrollContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
            <TouchableOpacity
              style={[styles.chipTab, activeTab === 'info' && styles.chipTabActive]}
              onPress={() => setActiveTab('info')}
            >
              <Building2 size={16} color={activeTab === 'info' ? '#fff' : '#64748B'} />
              <Text style={[styles.chipTabTxt, activeTab === 'info' && styles.chipTabTxtActive]}>Info</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.chipTab, activeTab === 'branding' && styles.chipTabActive]}
              onPress={() => setActiveTab('branding')}
            >
              <Palette size={16} color={activeTab === 'branding' ? '#fff' : '#64748B'} />
              <Text style={[styles.chipTabTxt, activeTab === 'branding' && styles.chipTabTxtActive]}>Brand</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.chipTab, activeTab === 'giving' && styles.chipTabActive]}
              onPress={() => setAlertConfig({ visible: true, title: 'Giving Details', message: 'Option Available Soon\\n\\nWe are currently working on integrating this feature. Please check back later!', type: 'info' })}
            >
              <DollarSign size={16} color={activeTab === 'giving' ? '#fff' : '#64748B'} />
              <Text style={[styles.chipTabTxt, activeTab === 'giving' && styles.chipTabTxtActive]}>Giving</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.chipTab, activeTab === 'whatsapp' && styles.chipTabActive]}
              onPress={() => setActiveTab('whatsapp')}
            >
              <MessageCircle size={16} color={activeTab === 'whatsapp' ? '#fff' : '#64748B'} />
              <Text style={[styles.chipTabTxt, activeTab === 'whatsapp' && styles.chipTabTxtActive]}>WhatsApp</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>`;
c = c.replace(oldTabs, newTabs);

c = c.replace(/container: \{[\s\S]*?\},/, "container: { flex: 1, backgroundColor: '#FAF8F0' },");

const oldHeaderStyles = /header: \{[\s\S]*?headerTitle: \{[\s\S]*?\},/;
const newHeaderStyles = `  header: {
    backgroundColor: '#1a2d5a',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    zIndex: 10,
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingVertical: 4, paddingHorizontal: 2 },
  backBtnTxt: { fontSize: 13, fontWeight: '700', color: '#fff' },
  heroTitles: { flex: 1 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 11, color: '#F3EAD9', marginTop: 2, letterSpacing: 1.5, fontWeight: '800' },`;
c = c.replace(oldHeaderStyles, newHeaderStyles);

const oldTabStyles = /tabs: \{[\s\S]*?tabTxt: \{[\s\S]*?\},/;
const newTabStyles = `  chipScrollContainer: { marginTop: 20, marginBottom: 10 },
  chipScroll: { paddingHorizontal: 20, gap: 12 },
  chipTab: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  chipTabActive: {
    backgroundColor: '#BE9A3A',
    borderColor: '#BE9A3A',
  },
  chipTabTxt: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  chipTabTxtActive: {
    color: '#fff',
  },`;
c = c.replace(oldTabStyles, newTabStyles);

c = c.replace(/editBtn: \{[\s\S]*?\},/, "editBtn: { backgroundColor: 'rgba(255,255,255,0.15)', paddingVertical: 8, paddingHorizontal: 20, borderRadius: 20 },");
c = c.replace(/editBtnTxt: \{[\s\S]*?\},/, "editBtnTxt: { color: '#fff', fontSize: 13, fontWeight: '700' },");
c = c.replace(/saveBtn: \{[\s\S]*?\},/, "saveBtn: { backgroundColor: '#fff', paddingVertical: 8, paddingHorizontal: 20, borderRadius: 20 },");
c = c.replace(/saveBtnTxt: \{[\s\S]*?\},/, "saveBtnTxt: { color: '#1a2d5a', fontSize: 13, fontWeight: '700' },");

fs.writeFileSync('c:/Users/yraje/WeChristian2/app/src/screens/admin/AdminChurchSettings.tsx', c);

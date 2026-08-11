import React, { useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Platform } from 'react-native';
import { ChevronLeft, Video, Calendar, Clock, Activity, CheckCircle } from 'lucide-react-native';
import { AdminTabContext } from '../../context/AdminTabContext';

const colors = {
  ink: '#1a2d5a',
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
  blue: '#2D8CFF'
};

const serifFont = Platform.OS === 'ios' ? 'Georgia' : 'serif';

export default function AdminOnlineMeetings() {
  const { setActiveTab, setTabByName, setEditingData } = useContext(AdminTabContext);

  const stats = {
    upcoming: 0,
    live: 0,
    completed: 0,
    total: 0
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* ── Hero Section ── */}
      <View style={styles.hero}>
        <View style={styles.heroTitleRow}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', flexShrink: 1 }}>
            <TouchableOpacity onPress={() => setActiveTab(0)} style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, flexShrink: 0 }}>
              <ChevronLeft size={20} color="#fff" style={{ marginLeft: -6, marginRight: 4 }} />
              <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>Back</Text>
            </TouchableOpacity>
            <Text style={[styles.heroTitle, { marginHorizontal: 12, opacity: 0.4, flexShrink: 0 }]}>|</Text>
            <View style={{ flexShrink: 1 }}>
              <Text style={[styles.heroTitle, { flexShrink: 1 }]} numberOfLines={1}>Online Meetings</Text>
            </View>
          </View>
          <View style={{ width: 10 }} />
          <TouchableOpacity style={[styles.newBtn, { flexShrink: 0 }]} onPress={() => { setEditingData(null); if (setTabByName) setTabByName('New Online Meeting'); }}>
            <Text style={styles.newBtnTxt}>+ New</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.content}>
          
          {/* 4 Stat Cards */}
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <View style={[styles.statNotch, { backgroundColor: colors.gold }]} />
              <Calendar size={16} color={colors.goldDeep} style={styles.statIcon} />
              <Text style={[styles.num, { color: colors.goldDeep }]}>{stats.upcoming}</Text>
              <Text style={styles.statLabel}>Upcoming</Text>
            </View>
            <View style={styles.statBox}>
              <View style={[styles.statNotch, { backgroundColor: colors.clay }]} />
              <Activity size={16} color={colors.clay} style={styles.statIcon} />
              <Text style={[styles.num, { color: colors.clay }]}>{stats.live}</Text>
              <Text style={styles.statLabel}>Live Now</Text>
            </View>
          </View>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <View style={[styles.statNotch, { backgroundColor: colors.moss }]} />
              <CheckCircle size={16} color={colors.moss} style={styles.statIcon} />
              <Text style={[styles.num, { color: colors.moss }]}>{stats.completed}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
            <View style={styles.statBox}>
              <View style={[styles.statNotch, { backgroundColor: colors.blue }]} />
              <Video size={16} color={colors.blue} style={styles.statIcon} />
              <Text style={[styles.num, { color: colors.blue }]}>{stats.total}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
          </View>

          {/* Section Divider */}
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>Online Meetings</Text>
            <View style={styles.sectionTitleLine} />
          </View>

          {/* Empty State */}
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>You haven't added any meeting links yet.</Text>
            <TouchableOpacity style={styles.ghostBtn} onPress={() => { setEditingData(null); if (setTabByName) setTabByName('New Online Meeting'); }}>
              <Text style={styles.ghostBtnTxt}>+ Add your first meeting link</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.footerBranding}>Church Admin · Online Meetings</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.parchment },
  scroll: { paddingBottom: 20 },
  
  // Hero
  hero: { 
    backgroundColor: colors.ink, 
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
    paddingHorizontal: 22,
    paddingTop: 40, // Increased top padding to match other screens if not inside a navigation header
    paddingBottom: 24,
    overflow: 'visible',
    position: 'relative'
  },
  heroTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  heroTitle: { color: '#fff', fontSize: 24, fontFamily: serifFont, fontWeight: '600', letterSpacing: -0.5, marginBottom: 0 },
  newBtn: { backgroundColor: '#FCD34D', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3 },
  newBtnTxt: { color: colors.ink, fontSize: 12, fontWeight: '700' },

  content: { paddingHorizontal: 16 },

  // Stats Grid
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 10, marginTop: 10 },
  statBox: { flex: 1, backgroundColor: colors.paper, borderRadius: 10, paddingVertical: 14, alignItems: 'center', elevation: 2, shadowColor: colors.ink, shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, borderWidth: 1, borderColor: 'rgba(21,28,51,0.05)', position: 'relative' },
  statNotch: { position: 'absolute', top: -1, width: 20, height: 3, borderBottomLeftRadius: 3, borderBottomRightRadius: 3 },
  statIcon: { marginBottom: 6, opacity: 0.8 },
  num: { fontFamily: serifFont, fontSize: 24, fontWeight: '600', marginBottom: 4 },
  statLabel: { fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, color: colors.inkSoft, fontWeight: '600' },

  // Sections
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, marginTop: 20 },
  sectionTitle: { fontFamily: serifFont, fontSize: 14, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase', color: colors.inkSoft, marginRight: 8 },
  sectionTitleLine: { flex: 1, height: 1, backgroundColor: colors.rule },

  // Empty Cards
  emptyCard: { borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.gold, borderRadius: 16, backgroundColor: colors.paper, padding: 24, alignItems: 'center', marginBottom: 24 },
  emptyText: { fontSize: 14, color: colors.inkSoft, lineHeight: 21, textAlign: 'center', marginBottom: 14 },
  ghostBtn: { backgroundColor: colors.ink, paddingHorizontal: 20, paddingVertical: 11, borderRadius: 100, borderWidth: 1, borderColor: colors.gold },
  ghostBtnTxt: { color: '#fff', fontSize: 13, fontWeight: '600' },

  footerBranding: { textAlign: 'center', paddingTop: 30, paddingBottom: 20, fontSize: 11, letterSpacing: 0.8, color: '#B3A67E', textTransform: 'uppercase', fontWeight: '600' },
});

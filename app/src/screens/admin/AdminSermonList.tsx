import React, { useState, useEffect, useContext } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  ActivityIndicator, 
  Platform, 
  StatusBar,
  Dimensions,
  Alert,
  Modal
} from 'react-native';
import { 
  Search, 
  Play, 
  Plus, 
  ChevronRight, 
  RefreshCw,
  Clock,
  Edit2,
  Trash2,
  ChevronLeft
} from 'lucide-react-native';
import { AdminTabContext } from '../../context/AdminTabContext';

import FirestoreService, { Sermon } from '../../services/FirestoreService';
import { Linking } from 'react-native';

const { width } = Dimensions.get('window');

export default function AdminSermonList() {
  const { setActiveTab, setEditingData } = useContext(AdminTabContext);
  const [sermons, setSermons] = useState<Sermon[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [showDeleteSuccess, setShowDeleteSuccess] = useState(false);
  const [sermonToDelete, setSermonToDelete] = useState<Sermon | null>(null);

  useEffect(() => {
    fetchSermons();
  }, []);

  const fetchSermons = async () => {
    setLoading(true);
    try {
      const data = await FirestoreService.getSermons(50);
      setSermons(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (sermon: Sermon) => {
    setEditingData(sermon);
    setActiveTab(5); // Switch to New Sermon editor tab (index 5)
  };

  const handlePlay = (sermon: Sermon) => {
    const id = sermon.youtubeId;
    if (!id) {
      if (sermon.audioUrl) Linking.openURL(sermon.audioUrl);
      return;
    }
    
    let url = id;
    if (!id.includes('http') && id.length === 11) {
      url = `https://www.youtube.com/watch?v=${id}`;
    }
    Linking.openURL(url).catch(err => console.error(err));
  };

  const confirmDeleteSermon = async () => {
    if (!sermonToDelete?.id) return;
    try {
      setLoading(true);
      await FirestoreService.deleteSermon(sermonToDelete.id);
      fetchSermons(); // Refresh list after delete
      setSermonToDelete(null);
      setShowDeleteSuccess(true);
      setTimeout(() => setShowDeleteSuccess(false), 2500);
    } catch (err: any) {
      Alert.alert("Delete Failed", err.message || "Could not delete sermon.");
      setSermonToDelete(null);
      setLoading(false);
    }
  };

  const stats = {
    published: sermons.filter(s => s.status === 'Published').length,
    drafts: sermons.filter(s => s.status === 'Draft').length,
    series: [...new Set(sermons.map(s => s.series).filter((s): s is string => Boolean(s)))].length
  };

  const seriesList = ['All', ...new Set(sermons.map(s => s.series).filter((s): s is string => Boolean(s)))];
  const filteredSermons = filter === 'All' ? sermons : sermons.filter(s => s.series === filter);

  if (loading && sermons.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1a2d5a" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* ── Hero Section ── */}
      <View style={styles.hero}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
            <TouchableOpacity onPress={() => setActiveTab(0)} style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
              <ChevronLeft size={20} color="#fff" style={{ marginLeft: -6, marginRight: 4 }} />
              <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>Back</Text>
            </TouchableOpacity>
            <Text style={[styles.heroTitle, { marginHorizontal: 12, opacity: 0.4 }]}>|</Text>
            <View>
              <Text style={styles.heroTitle}>Sermons</Text>
              <Text style={[styles.heroSub, { marginTop: 2 }]}>{sermons.length} total · {stats.series} series</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.newBtn} onPress={() => { setEditingData(null); setActiveTab(5); }}>
            <Plus size={16} color="#1a2d5a" />
            <Text style={styles.newBtnTxt}>New</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        
        {/* ── Stats Bar ── */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={[styles.statNum, { color: '#2E6B4F' }]}>{stats.published}</Text>
            <Text style={styles.statLbl}>Published</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNum, { color: '#C9A84C' }]}>{stats.drafts}</Text>
            <Text style={styles.statLbl}>Drafts</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNum, { color: '#1a2d5a' }]}>{stats.series}</Text>
            <Text style={styles.statLbl}>Series</Text>
          </View>
        </View>

        {/* ── Filter Chips ── */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={{ paddingRight: 14 }}>
          {seriesList.map(f => (
            <TouchableOpacity 
              key={f} 
              style={[styles.filterChip, filter === f && styles.filterChipActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterChipTxt, filter === f && styles.filterChipTxtActive]}>
                {f} ({f === 'All' ? sermons.length : sermons.filter(s => s.series === f).length})
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.listLabel}>Latest Sermons</Text>

        {filteredSermons.map((sermon, idx) => (
          <View key={sermon.id} style={[styles.sermonItem, idx === 0 && filter === 'All' && styles.featuredItem]}>
            <TouchableOpacity 
              style={[styles.siThumb, idx === 0 && filter === 'All' && styles.featuredThumb]}
              onPress={() => handlePlay(sermon)}
            >
              <Play size={idx === 0 ? 24 : 18} color="#fff" fill="#fff" />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.siBody} onPress={() => handleEdit(sermon)}>
              <Text style={[styles.siTitle, idx === 0 && filter === 'All' && {fontSize: 14}]} numberOfLines={1}>{sermon.title}</Text>
              {sermon.titleTelugu ? (
                <Text style={styles.siTe} numberOfLines={1}>{sermon.titleTelugu}</Text>
              ) : null}
              <Text style={styles.siMeta}>{sermon.pastor} · {sermon.date} {sermon.duration ? `· ${sermon.duration}` : ''}</Text>
              
              <View style={styles.siFoot}>
                {sermon.series ? (
                  <View style={styles.badgeSeries}><Text style={styles.badgeSeriesTxt}>{sermon.series}</Text></View>
                ) : null}
                {sermon.youtubeId ? <View style={styles.badgeIcon}><Text style={styles.badgeIconTxt}>📺 YouTube</Text></View> : null}
                {sermon.audioUrl ? <View style={styles.badgeIcon}><Text style={styles.badgeIconTxt}>🎙️ Audio</Text></View> : null}
                <View style={[styles.badgeStatus, sermon.status === 'Draft' ? styles.statusDraftBg : styles.statusPubBg]}>
                  <Text style={[styles.badgeStatusTxt, sermon.status === 'Draft' ? styles.statusDraftTxt : styles.statusPubTxt]}>
                    {sermon.status || 'Published'}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>

            <View style={styles.actionsContainer}>
              <TouchableOpacity style={styles.editAction} onPress={() => handleEdit(sermon)}>
                <Edit2 size={16} color="#1a2d5a" />
                <Text style={styles.editActionTxt}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteAction} onPress={() => setSermonToDelete(sermon)}>
                <Trash2 size={16} color="#ef4444" />
                <Text style={styles.deleteActionTxt}>Del</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ── Delete Confirmation Modal ── */}
      {sermonToDelete && (
        <Modal transparent animationType="fade" visible>
          <View style={styles.successBg}>
            <View style={styles.successCard}>
              <View style={[styles.successIconOuter, { backgroundColor: '#FEF2F2' }]}>
                <View style={[styles.successIconInner, { backgroundColor: '#DC2626' }]}>
                  <Trash2 size={28} color="#fff" />
                </View>
              </View>
              <Text style={styles.successTitle}>Delete Sermon?</Text>
              <Text style={styles.successDesc}>
                Are you sure you want to delete "{sermonToDelete.title}"? This action cannot be undone.
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, width: '100%' }}>
                <TouchableOpacity style={[styles.successSecBtn, { flex: 1 }]} onPress={() => setSermonToDelete(null)}>
                  <Text style={styles.successSecTxt}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.successActionBtn, { flex: 1, backgroundColor: '#DC2626', marginBottom: 0 }]} onPress={confirmDeleteSermon}>
                  <Text style={styles.successActionTxt}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Delete Success Modal */}
      {showDeleteSuccess && (
        <View style={styles.toastOverlay}>
          <View style={styles.toastCard}>
            <View style={styles.toastIconBox}>
              <Trash2 size={24} color="#DC2626" />
            </View>
            <View>
              <Text style={styles.toastTitle}>Sermon Deleted</Text>
              <Text style={styles.toastSub}>The sermon has been permanently removed.</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  // ─── Layout ──────────────────────────────────────────────────────────────
  container: { flex: 1, backgroundColor: '#EDE8DC' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#EDE8DC' },
  scroll: { padding: 14, paddingBottom: 100 },

  // ─── Hero ────────────────────────────────────────────────────────────────
  hero: {
    backgroundColor: '#1a2d5a',
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
    paddingHorizontal: 22,
    paddingTop: 10,
    paddingBottom: 24,
    overflow: 'visible',
    position: 'relative',
    marginBottom: 6,
  },
  heroTitle: { color: '#fff', fontSize: 24, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', fontWeight: '600', letterSpacing: -0.5 },
  heroSub: { color: '#AEB8D4', fontSize: 13 },
  newBtn: { 
    backgroundColor: '#C9A84C', 
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 16, 
    paddingVertical: 10, 
    borderRadius: 12,
    shadowColor: '#C9A84C',
    shadowOpacity: 0.4,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4
  },
  newBtnTxt: { color: '#1a2d5a', fontSize: 13, fontWeight: '800', letterSpacing: 0.3 },

  // ─── Stats Row ───────────────────────────────────────────────────────────
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14 },
  statCard: { 
    flex: 1, 
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(26,45,90,0.08)',
    borderTopWidth: 3,
    borderTopColor: '#1a2d5a',
    shadowColor: '#1a2d5a',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  statNum: { fontSize: 22, fontWeight: '800' },
  statLbl: { fontSize: 10, color: '#6B7280', marginTop: 2, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },

  // ─── Filter Chips ────────────────────────────────────────────────────────
  filterRow: { flexDirection: 'row', marginBottom: 14 },
  filterChip: { 
    paddingHorizontal: 16, 
    paddingVertical: 8, 
    borderRadius: 20, 
    backgroundColor: '#FFFFFF', 
    borderWidth: 1.5, 
    borderColor: 'rgba(26,45,90,0.1)', 
    marginRight: 8,
    shadowColor: '#1a2d5a',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1
  },
  filterChipActive: { backgroundColor: '#1a2d5a', borderColor: '#1a2d5a' },
  filterChipTxt: { fontSize: 11, fontWeight: '700', color: '#1a2d5a' },
  filterChipTxtActive: { color: '#fff' },

  // ─── List ────────────────────────────────────────────────────────────────
  listLabel: { fontSize: 12, fontWeight: '700', color: '#374151', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10, marginTop: 4, paddingLeft: 4 },

  sermonItem: { 
    backgroundColor: '#FFFFFF', 
    borderRadius: 14, 
    borderWidth: 1, 
    borderColor: 'rgba(26,45,90,0.08)', 
    padding: 14, 
    marginBottom: 12, 
    flexDirection: 'row', 
    gap: 12, 
    alignItems: 'flex-start',
    shadowColor: '#1a2d5a',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2 
  },
  featuredItem: { borderWidth: 1.5, borderColor: '#C9A84C', padding: 18, shadowOpacity: 0.1, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  featuredThumb: { width: 70, height: 50, borderRadius: 10 },
  siThumb: { width: 50, height: 38, backgroundColor: '#1a2d5a', borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  siBody: { flex: 1 },
  siTitle: { fontSize: 13, fontWeight: '800', color: '#1a2d5a' },
  siTe: { fontSize: 12, color: '#1a2d5a', fontStyle: 'italic', marginTop: 2, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  siMeta: { fontSize: 10, color: '#6B7280', marginTop: 6, fontWeight: '600' },
  siFoot: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10, alignItems: 'center' },
  
  badgeSeries: { backgroundColor: '#F9F6F0', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: '#E2DDD5' },
  badgeSeriesTxt: { color: '#1a2d5a', fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.3 },
  
  badgeIcon: { backgroundColor: '#F0EBE0', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeIconTxt: { color: '#1a2d5a', fontSize: 9, fontWeight: '700' },

  badgeStatus: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1 },
  statusPubBg: { backgroundColor: '#EDF7F1', borderColor: '#A3D9B8' },
  statusPubTxt: { color: '#2E7D52' },
  statusDraftBg: { backgroundColor: '#FEFBF0', borderColor: '#F5DFA0' },
  statusDraftTxt: { color: '#B76E00' },
  badgeStatusTxt: { fontSize: 9, fontWeight: '800' },
  
  actionsContainer: { borderLeftWidth: 1, borderLeftColor: 'rgba(26,45,90,0.08)' },
  editAction: { paddingLeft: 12, paddingRight: 6, paddingVertical: 8, alignItems: 'center', justifyContent: 'center', gap: 4, flex: 1 },
  editActionTxt: { fontSize: 9, fontWeight: '800', color: '#1a2d5a', textTransform: 'uppercase', letterSpacing: 0.5 },
  deleteAction: { paddingLeft: 12, paddingRight: 6, paddingVertical: 8, alignItems: 'center', justifyContent: 'center', gap: 4, flex: 1, borderTopWidth: 1, borderTopColor: 'rgba(26,45,90,0.08)' },
  deleteActionTxt: { fontSize: 9, fontWeight: '800', color: '#DC2626', textTransform: 'uppercase', letterSpacing: 0.5 },

  // Toast
  toastOverlay: { position: 'absolute', bottom: 40, left: 0, right: 0, alignItems: 'center' },
  toastCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, paddingRight: 24, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 14, shadowColor: '#1a2d5a', shadowOpacity: 0.15, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 6, borderWidth: 1, borderColor: 'rgba(26,45,90,0.05)' },
  toastIconBox: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FEF2F2', justifyContent: 'center', alignItems: 'center' },
  toastTitle: { fontSize: 14, fontWeight: '800', color: '#1a2d5a' },
  toastSub: { fontSize: 11, color: '#6B7280', marginTop: 2, fontWeight: '500' },

  // Confirmation Modal
  successBg: { flex: 1, backgroundColor: 'rgba(26,45,90, 0.75)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  successCard: { backgroundColor: '#fff', borderRadius: 24, padding: 24, width: '92%', maxWidth: 400, alignItems: 'center', elevation: 10 },
  successIconOuter: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#F0FDF4', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  successIconInner: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#2E6B4F', justifyContent: 'center', alignItems: 'center' },
  successTitle: { fontSize: 20, fontWeight: '900', color: '#1a2d5a', marginBottom: 8, textAlign: 'center' },
  successDesc: { fontSize: 13, color: '#475569', textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  successActionBtn: { backgroundColor: '#1a2d5a', height: 48, borderRadius: 12, width: '100%', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  successActionTxt: { color: '#fff', fontSize: 13, fontWeight: '800' },
  successSecBtn: { height: 48, borderRadius: 12, width: '100%', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#F8FAFC' },
  successSecTxt: { color: '#1a2d5a', fontSize: 13, fontWeight: '800' }
});

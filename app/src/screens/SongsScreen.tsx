import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TouchableWithoutFeedback,
  TextInput,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Platform,
  Alert,
  Modal,
  ScrollView
} from 'react-native';
// Removed SafeAreaView as padding is handled by the header
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  ChevronLeft,
  Search,
  Music,
  ChevronRight,
  AlertCircle,
  BookMarked,
  Bookmark,
  X
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import FirestoreService, { WorshipSong } from '../services/FirestoreService';
import { useTheme } from '../context/ThemeContext';
import { CustomAlert } from '../components/CustomAlert';
import SongDetailModal from '../components/SongDetailModal';


const { width, height } = Dimensions.get('window');

const SONGBOOK_KEY = 'cog_my_songbook_ids';

const CATEGORIES = [
  'All',
  'Stuthi Songs',
  'Aradhana Songs',
  'Offering Songs',
  'Special Songs',
  'Gospel Songs',
  'Youth Songs',
  'Christmas Songs',
  'Easter Songs',
  'Marriage Songs',
  'Thanksgiving Songs',
  'Other'
];

export default function SongsScreen({ navigation, route }: any) {
  const { isDark, toggleTheme } = useTheme();

  // ── Tabs ──────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<'browse' | 'songbook' | 'theme'>('browse');

  // ── All Songs ─────────────────────────────────────
  const [songs, setSongs] = useState<WorshipSong[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // ── Category filter ───────────────────────────────
  const [selectedCategory, setSelectedCategory] = useState('All');

  // ── Search ────────────────────────────────────────
  const [search, setSearch] = useState('');

  // ── My Songbook ───────────────────────────────────
  const [savedIds, setSavedIds] = useState<string[]>([]);

  // ── Lyrics Modal ──────────────────────────────────
  const [selectedSong, setSelectedSong] = useState<WorshipSong | null>(null);

  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: 'success' | 'info' | 'error' | 'warning';
  }>({
    visible: false,
    title: '',
    message: '',
    type: 'success'
  });

  // ── Load songs ────────────────────────────────────
  const fetchSongs = async (forceRefresh = false) => {
    try {
      // Try cache first for instant display
      if (!forceRefresh) {
        try {
          const cached = await AsyncStorage.getItem('@songs_cache');
          if (cached) {
            const parsed = JSON.parse(cached);
            if (parsed.length > 0) {
              setSongs(parsed);
              setLoading(false);
            }
          }
        } catch (cacheError) {
          console.warn('Failed to read from cache:', cacheError);
        }
      }
      
      // Always fetch fresh data
      const data = await FirestoreService.getWorshipSongs({ forceRefresh });
      setSongs(data);
      
      // Update cache
      try {
        await AsyncStorage.setItem('@songs_cache', JSON.stringify(data));
      } catch (cacheWriteError) {
        console.warn('Failed to write to cache:', cacheWriteError);
      }
    } catch (error) {
      console.error('Error fetching songs from Firestore:', error);
      Alert.alert('Error', 'Failed to load songs. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // ── Load saved songbook from storage ─────────────
  const loadSavedIds = async () => {
    try {
      const raw = await AsyncStorage.getItem(SONGBOOK_KEY);
      if (raw) setSavedIds(JSON.parse(raw));
    } catch { /* ignore */ }
  };

  useEffect(() => {
    fetchSongs();
    loadSavedIds();
  }, []);

  // ── Open specific song from notification ──────────
  const { songId } = route?.params || {};
  useEffect(() => {
    if (songId && songs.length > 0) {
      const songToOpen = songs.find(s => s.id === songId);
      if (songToOpen) {
        setSelectedSong(songToOpen);
        // Clear param so it doesn't reopen if the user closes it and navigates back
        navigation.setParams({ songId: undefined });
      }
    }
  }, [songId, songs, navigation]);

  const onRefresh = () => { setRefreshing(true); fetchSongs(true); };

  // ── Toggle save/unsave song ───────────────────────
  const toggleSave = async (song: WorshipSong) => {
    const isAlreadySaved = savedIds.includes(song.id);
    let newIds: string[];
    if (isAlreadySaved) {
      newIds = savedIds.filter(id => id !== song.id);
      setAlertConfig({ visible: true, title: 'Song Removed', message: `"${song.title}" has been removed from your Songbook.`, type: 'info' });
    } else {
      newIds = [...savedIds, song.id];
      setAlertConfig({ visible: true, title: 'Song Saved Successfully', message: `"${song.title}" has been added to your Songbook.`, type: 'success' });
    }
    setSavedIds(newIds);
    await AsyncStorage.setItem(SONGBOOK_KEY, JSON.stringify(newIds));
  };

  // Helper: split multi-category string into array
  const getSongCategories = (song: WorshipSong): string[] =>
    (song.category || 'Other').split(';').map(c => c.trim()).filter(Boolean);

  // ── Filtered songs ────────────────────────────────
  const browseBaseList = songs.filter(s => {
    const cats = getSongCategories(s);
    // Songs that are ONLY a Theme Song stay in Theme tab; others show in Browse too
    if (cats.length === 1 && cats[0] === 'Theme Songs') return false;
    return selectedCategory === 'All' || cats.includes(selectedCategory);
  });

  const filteredBrowse = browseBaseList.map((s, idx) => ({ ...s, displayNumber: idx + 1 })).filter(s => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return s.displayNumber.toString() === q ||
      s.title.toLowerCase().includes(q) ||
      (s.titleTe && s.titleTe.toLowerCase().includes(q)) ||
      (s.artist && s.artist.toLowerCase().includes(q));
  });

  const savedSongsBase = songs.filter(s => savedIds.includes(s.id));
  const filteredSongbook = savedSongsBase.map((s, idx) => ({ ...s, displayNumber: idx + 1 })).filter(s => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return s.displayNumber.toString() === q ||
      s.title.toLowerCase().includes(q) ||
      (s.titleTe && s.titleTe.toLowerCase().includes(q));
  });

  const themeBaseList = songs.filter(s => {
    const cats = getSongCategories(s);
    return cats.includes('Theme Songs');
  });
  const filteredTheme = themeBaseList.map((s, idx) => ({ ...s, displayNumber: idx + 1 })).filter(s => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return s.displayNumber.toString() === q ||
      s.title.toLowerCase().includes(q) ||
      (s.titleTe && s.titleTe.toLowerCase().includes(q));
  });

  // ── Song Card ─────────────────────────────────────
  const renderSongCard = ({ item, index }: { item: WorshipSong & { displayNumber?: number }; index: number }) => {
    const isSaved = savedIds.includes(item.id);
    const displayIndex = item.displayNumber !== undefined ? item.displayNumber : index + 1;
    return (
      <TouchableOpacity
        style={[styles.songCard, { backgroundColor: isDark ? '#1e293b' : '#fff', borderColor: isDark ? '#334155' : '#e5e7eb' }]}
        onPress={() => setSelectedSong(item)}
        onLongPress={() => toggleSave(item)}
        delayLongPress={400}
      >
        <View style={[styles.indexBox, { backgroundColor: isDark ? '#0f172a' : '#f3f4f6' }]}>
          <Text style={[styles.indexTxt, { color: isDark ? '#94a3b8' : '#1a2d5a' }]}>{displayIndex}</Text>
        </View>
        <View style={styles.info}>
          <Text style={[styles.title, { color: isDark ? '#fff' : '#111827' }]} numberOfLines={1}>{item.title}</Text>
          <Text style={[styles.artist, { color: isDark ? '#94a3b8' : '#6B7280' }]} numberOfLines={1}>
            {item.titleTe ? `${item.titleTe} · ` : ''}{item.artist}
          </Text>
        </View>
        {isSaved && <Bookmark size={14} color="#c0392b" style={{ marginRight: 4 }} />}
        <ChevronRight size={16} color={isDark ? '#475569' : '#D1D5DB'} />
      </TouchableOpacity>
    );
  };

  const activeList = activeTab === 'browse' ? filteredBrowse : activeTab === 'songbook' ? filteredSongbook : filteredTheme;
  const currentSongIndex = selectedSong ? activeList.findIndex(s => s.id === selectedSong.id) : -1;
  const totalSongs = activeList.length;

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#0f172a' : '#f8fafc' }]}>
      <StatusBar barStyle="light-content" backgroundColor="#1a2d5a" />
      
      <CustomAlert 
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onClose={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
      />

      {/* ── Header ── */}
      <LinearGradient 
        colors={['#2b52a1', '#1a3673']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.pageHeader}
      >
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} hitSlop={{top:10, bottom:10, left:10, right:10}}>
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        
        <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
          <View style={{ flex: 1, justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 24 }}>
            <Text style={styles.pageTitle}>Worship & Praise</Text>
          </View>
        </View>

        <View style={{ width: 24 }} />
      </LinearGradient>

      {/* ── Main Tabs ── */}
      <View style={styles.tabBar}>
        <TouchableOpacity style={[styles.tab, activeTab === 'browse' && styles.tabActive]}
          onPress={() => { setActiveTab('browse'); setSearch(''); }}>
          <Music size={13} color={activeTab === 'browse' ? '#fff' : '#64748b'} />
          <Text style={[styles.tabTxt, activeTab === 'browse' && styles.tabTxtActive]} numberOfLines={1}>Browse</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'songbook' && styles.tabActive]}
          onPress={() => { setActiveTab('songbook'); setSearch(''); }}>
          <BookMarked size={13} color={activeTab === 'songbook' ? '#fff' : '#64748b'} />
          <Text style={[styles.tabTxt, activeTab === 'songbook' && styles.tabTxtActive]} numberOfLines={1}>
            My Songs{savedIds.length > 0 ? ` (${savedIds.length})` : ''}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'theme' && styles.tabActive]}
          onPress={() => { setActiveTab('theme'); setSearch(''); }}>
          <Music size={13} color={activeTab === 'theme' ? '#fff' : '#64748b'} />
          <Text style={[styles.tabTxt, activeTab === 'theme' && styles.tabTxtActive]} numberOfLines={1}>Theme</Text>
        </TouchableOpacity>
      </View>

      {/* ── Category Chips (Browse only) ── */}
      {activeTab === 'browse' && (
        <ScrollView
          horizontal showsHorizontalScrollIndicator={false}
          style={styles.chipScroll} contentContainerStyle={{ paddingHorizontal: 16, gap: 8, alignItems: 'center' }}>
          {CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat}
              style={[styles.chip, selectedCategory === cat && styles.chipActive]}
              onPress={() => setSelectedCategory(cat)}>
              <Text style={[styles.chipTxt, selectedCategory === cat && styles.chipTxtActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* ── Search Bar ── */}
      <View style={[styles.searchBar, { backgroundColor: isDark ? '#1e293b' : '#fff' }]}>
        <Search size={18} color={isDark ? '#94a3b8' : '#64748b'} />
        <TextInput
          placeholder={activeTab === 'browse' ? 'Search songs...' : activeTab === 'theme' ? 'Search theme songs...' : 'Search your songbook...'}
          placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
          style={[styles.searchInput, { color: isDark ? '#fff' : '#0f172a' }]}
          value={search} onChangeText={setSearch}
          autoCorrect={false} autoCapitalize="none"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <X size={16} color="#94a3b8" />
          </TouchableOpacity>
        )}
      </View>

      {/* ── Long Press hint ── */}
      {activeTab === 'browse' && (
        <Text style={styles.hint}>💡 Long press a song to add it to My Songbook</Text>
      )}
      {activeTab === 'songbook' && (
        <Text style={styles.hint}>💡 Long press a song to remove it from your Songbook</Text>
      )}

      {/* ── Browse List ── */}
      {activeTab === 'browse' && (
        loading && !refreshing ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#fbbf24" />
          </View>
        ) : (
          <FlatList
            style={{ flex: 1 }}
            data={filteredBrowse}
            keyExtractor={item => item.id}
            renderItem={renderSongCard}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            initialNumToRender={15}
            maxToRenderPerBatch={10}
            windowSize={5}
            removeClippedSubviews={true}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1a2d5a" />}
            ListHeaderComponent={
              <Text style={styles.secLbl}>
                {selectedCategory === 'All' ? 'ALL SONGS' : selectedCategory.toUpperCase()} • {filteredBrowse.length} Songs
              </Text>
            }
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <AlertCircle size={44} color="#cbd5e1" />
                <Text style={[styles.emptyTitle, { color: isDark ? '#94a3b8' : '#1a2d5a' }]}>No songs found</Text>
                <Text style={styles.emptySub}>Try a different category or search term</Text>
              </View>
            }
          />
        )
      )}

      {/* ── My Songbook ── */}
      {activeTab === 'songbook' && (
        <FlatList
          style={{ flex: 1 }}
          data={filteredSongbook}
          keyExtractor={item => item.id}
          renderItem={renderSongCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          initialNumToRender={15}
          maxToRenderPerBatch={10}
          windowSize={5}
          removeClippedSubviews={true}
          ListHeaderComponent={
            <Text style={styles.secLbl}>MY SAVED SONGS • {filteredSongbook.length} Songs</Text>
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <BookMarked size={44} color="#cbd5e1" />
              <Text style={[styles.emptyTitle, { color: isDark ? '#94a3b8' : '#1a2d5a' }]}>Your Songbook is Empty</Text>
              <Text style={styles.emptySub}>Long press any song in the Browse tab to save it here for offline viewing.</Text>
            </View>
          }
        />
      )}

      {/* ── Theme Songs List ── */}
      {activeTab === 'theme' && (
        loading && !refreshing ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#fbbf24" />
          </View>
        ) : (
          <FlatList
            style={{ flex: 1 }}
            data={filteredTheme}
            keyExtractor={item => item.id}
            renderItem={renderSongCard}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            initialNumToRender={15}
            maxToRenderPerBatch={10}
            windowSize={5}
            removeClippedSubviews={true}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1a2d5a" />}
            ListHeaderComponent={
              <Text style={styles.secLbl}>
                THEME SONGS • {filteredTheme.length} Songs
              </Text>
            }
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={[styles.emptyTitle, { color: isDark ? '#94a3b8' : '#1a2d5a' }]}>No Theme Songs</Text>
                <Text style={styles.emptySub}>There are currently no Theme Songs available.</Text>
              </View>
            }
          />
        )
      )}

      {/* ── Lyrics Modal ── */}
      <SongDetailModal
        visible={!!selectedSong}
        song={selectedSong}
        onClose={() => setSelectedSong(null)}
        isDark={isDark}
        isSaved={selectedSong ? savedIds.includes(selectedSong.id) : false}
        onToggleSave={toggleSave}
        currentSongIndex={currentSongIndex}
        totalSongs={totalSongs}
        onNext={() => currentSongIndex < totalSongs - 1 && setSelectedSong(activeList[currentSongIndex + 1])}
        onPrev={() => currentSongIndex > 0 && setSelectedSong(activeList[currentSongIndex - 1])}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  pageHeader: {
    paddingTop: Platform.OS === 'ios' ? 56 : (StatusBar.currentHeight ?? 24) + 12,
    paddingHorizontal: 20,
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    minHeight: Platform.OS === 'ios' ? 140 : 120,
  },
  backBtn: { zIndex: 10, padding: 5, marginLeft: -10 },
  headerCenter: { alignItems: 'center' },
  pageTitle: { color: '#fff', fontSize: 24, fontWeight: '800', marginHorizontal: 56 },
  pageSub: { color: '#aac4e8', fontSize: 12, marginTop: 2, fontWeight: '600', marginHorizontal: 56 },

  // Tabs
  tabBar: { flexDirection: 'row', backgroundColor: '#e2e8f0', marginHorizontal: 16, marginTop: 15, marginBottom: 0, borderRadius: 25, padding: 4 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 21, gap: 4, minWidth: 0 },
  tabActive: { backgroundColor: '#1a2d5a' },
  tabTxt: { fontSize: 11, fontWeight: '700', color: '#64748b', flexShrink: 1 },
  tabTxtActive: { color: '#fff' },

  // Category chips
  chipScroll: { marginTop: 12, maxHeight: 52 },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: '#e2e8f0', borderWidth: 1, borderColor: '#e2e8f0' },
  chipActive: { backgroundColor: '#1a2d5a', borderColor: '#1a2d5a' },
  chipTxt: { fontSize: 12, fontWeight: '700', color: '#475569' },
  chipTxtActive: { color: '#fff' },

  // Search
  searchBar: {
    flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginTop: 12, marginBottom: 4,
    borderRadius: 14, paddingHorizontal: 14, height: 46, elevation: 2,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, borderWidth: 1, borderColor: '#e2e8f0'
  },
  searchInput: { flex: 1, fontSize: 13, fontWeight: '600', paddingVertical: 8, marginLeft: 8 },

  hint: { fontSize: 10, color: '#94a3b8', textAlign: 'center', marginTop: 4, marginBottom: 8, fontStyle: 'italic' },

  listContent: { paddingBottom: 40 },
  secLbl: { fontSize: 10, fontWeight: '800', color: '#9CA3AF', letterSpacing: 0.8, marginHorizontal: 16, marginBottom: 10, marginTop: 6 },

  // Song Card
  songCard: {
    borderRadius: 14, borderWidth: 0.5, marginHorizontal: 16, marginBottom: 9,
    flexDirection: 'row', alignItems: 'center', padding: 12,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 3
  },
  indexBox: { width: 34, height: 34, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  indexTxt: { fontSize: 13, fontWeight: '800', color: '#1a2d5a' },
  info: { flex: 1 },
  title: { fontSize: 13, fontWeight: '700' },
  artist: { fontSize: 11, marginTop: 2, fontWeight: '500' },
  keyBadge: { backgroundColor: '#F0FDF4', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 7, marginRight: 6 },
  keyTxt: { fontSize: 9, color: '#166534', fontWeight: '800' },

  emptyState: { padding: 40, alignItems: 'center', marginTop: 30 },
  emptyTitle: { fontSize: 15, fontWeight: '800', marginTop: 12 },
  emptySub: { fontSize: 12, color: '#94a3b8', textAlign: 'center', marginTop: 4 },
});

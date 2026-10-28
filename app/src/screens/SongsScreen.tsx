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
  ScrollView,
  Share
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
  X,
  Sliders,
  Share2,
  CalendarDays,
  Clock,
  Mic
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import FirestoreService, { WorshipSong } from '../services/FirestoreService';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useChurch } from '../context/ChurchContext';
import { SongLanguageHelper, CANONICAL_SONG_CATEGORIES } from '../services/SongLanguageHelper';
import { CustomAlert } from '../components/CustomAlert';
import SongDetailModal from '../components/SongDetailModal';


const { width, height } = Dimensions.get('window');

const SONGBOOK_KEY = 'cog_my_songbook_ids';

const CATEGORIES = CANONICAL_SONG_CATEGORIES;

export default function SongsScreen({ navigation, route }: any) {
  const { isDark, toggleTheme } = useTheme();
  const { language, t } = useLanguage();
  const { activeChurch } = useChurch();

  // ── Tabs ──────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<'browse' | 'setlist' | 'churchOwn' | 'theme' | 'songbook'>('browse');

  // ── Setlist State ─────────────────────────────────
  const [worshipServices, setWorshipServices] = useState<any[]>([]);
  const [activeServiceId, setActiveServiceId] = useState<string>('1S');

  // ── All Songs ─────────────────────────────────────
  const [songs, setSongs] = useState<WorshipSong[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // ── Category filter ───────────────────────────────
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedChurchCategory, setSelectedChurchCategory] = useState('All');

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

  // ── Load Setlists / Worship Services ─────────────
  const loadSetlists = async () => {
    try {
      const remote = await FirestoreService.getWorshipServices();
      const validRemote = Array.isArray(remote) ? remote.filter(Boolean) : [];
      const cleanedRemote = validRemote.filter((s: any) => {
        if (!s) return false;
        const isOldDummy = ['srv_sun1', 'srv_sun2', 'srv_bible', 'srv_women', 'srv_youth', '1S', '2S'].includes(s.id) && (!s.songs || s.songs.length === 0);
        return !isOldDummy;
      });
      if (cleanedRemote.length > 0) {
        setWorshipServices(cleanedRemote);
        if (!cleanedRemote.some((s: any) => s && s.id === activeServiceId)) {
          setActiveServiceId(cleanedRemote[0].id);
        }
        await AsyncStorage.setItem('@cog_worship_services', JSON.stringify(cleanedRemote));
        return;
      }
      const local = await AsyncStorage.getItem('@cog_worship_services');
      if (local) {
        const parsed = JSON.parse(local);
        const validLocal = Array.isArray(parsed) ? parsed.filter(Boolean) : [];
        const cleanedLocal = validLocal.filter((s: any) => {
          if (!s) return false;
          const isOldDummy = ['srv_sun1', 'srv_sun2', 'srv_bible', 'srv_women', 'srv_youth', '1S', '2S'].includes(s.id) && (!s.songs || s.songs.length === 0);
          return !isOldDummy;
        });
        if (cleanedLocal.length > 0) {
          setWorshipServices(cleanedLocal);
          if (!cleanedLocal.some((s: any) => s && s.id === activeServiceId)) {
            setActiveServiceId(cleanedLocal[0].id);
          }
          return;
        }
      }

      // Check legacy setlists only if they contain actual scheduled songs
      const remote1 = await FirestoreService.getChurchSetlist('1S');
      const remote2 = await FirestoreService.getChurchSetlist('2S');
      const s1 = remote1 || [];
      const s2 = remote2 || [];
      if (s1.length > 0 || s2.length > 0) {
        const initial = [
          ...(s1.length > 0 ? [{ id: '1S', name: 'Sunday Service – 1st Service', date: '', songs: s1 }] : []),
          ...(s2.length > 0 ? [{ id: '2S', name: 'Sunday Service – 2nd Service', date: '', songs: s2 }] : []),
        ];
        if (initial.length > 0) {
          setWorshipServices(initial);
          setActiveServiceId(initial[0].id);
          return;
        }
      }

      // DO NOT inject default dummy services
      setWorshipServices([]);
      setActiveServiceId('');
      await AsyncStorage.setItem('@cog_worship_services', JSON.stringify([]));
    } catch (e) {
      console.warn('Failed to load setlists:', e);
    }
  };

  const handleShareSetlist = async () => {
    const activeService: any = worshipServices.find(s => s.id === activeServiceId) || worshipServices[0];
    const serviceName = activeService?.name || 'Sunday Service';
    const activeList = activeService?.songs || [];
    const churchTitle = activeChurch?.name || 'Sunday Worship Service';
    const dateStr = (activeService?.startDate && activeService?.endDate && activeService.startDate !== activeService.endDate)
      ? `${activeService.startDate} – ${activeService.endDate}`
      : (activeService?.date || '');
    let msg = `🎵 *${serviceName.toUpperCase()} FLOW*\n`;
    msg += `⛪ *${churchTitle}* ${dateStr ? `| 📅 *${dateStr}*` : ''}\n\n`;
    if (activeList.length === 0) {
      msg += `(No songs scheduled for this service yet)\n`;
    } else {
      activeList.forEach((s: any, idx: number) => {
        msg += `*${idx + 1}. ${s.title}* ${s.isOffertory ? '(OFFERTORY)' : ''}\n`;
        msg += `  • Key: ${s.key || 'N/A'} | Time: ${s.timeSignature || '4/4'} | Tempo: ${s.tempo || '100'} BPM\n`;
        if (s.ledBy) msg += `  • Leading: ${s.ledBy}\n`;
        if (s.prelude) msg += `  • Prelude: ${s.prelude}\n`;
        if (s.interlude) msg += `  • Interlude: ${s.interlude}\n`;
        if (s.notes) msg += `  • Notes: ${s.notes}\n`;
        msg += `\n`;
      });
    }
    msg += `📲 View full song lyrics & charts in WeChristian App!`;
    try {
      await Share.share({ message: msg });
    } catch (e) {
      console.log(e);
    }
  };

  // ── Helper to enrich any song with setlist arrangement & designated leader ──
  const enrichSongWithSetlist = useCallback((baseSong: WorshipSong): WorshipSong => {
    if (!baseSong) return baseSong;
    const clean = (t: string) => (t || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const baseClean = clean(baseSong.title);
    const baseTeClean = clean(baseSong.titleTe || '');
    const baseEnClean = clean((baseSong as any).titleEn || '');

    let match: any = null;
    const servicesList = Array.isArray(worshipServices) ? worshipServices.filter(Boolean) : [];
    for (const service of servicesList) {
      if (service && service.songs && Array.isArray(service.songs)) {
        match = service.songs.find((s: any) => {
          if (!s) return false;
          const sc = clean(s.title);
          return sc === baseClean || (baseTeClean && sc === baseTeClean) || (baseEnClean && sc === baseEnClean);
        });
        if (match) break;
      }
    }

    if (match) {
      return {
        ...baseSong,
        ledBy: baseSong.ledBy || match.ledBy,
        key: baseSong.key || match.key,
        timeSignature: baseSong.timeSignature || match.timeSignature,
        tempo: baseSong.tempo || match.tempo,
        verses: baseSong.verses || match.verses,
        prelude: baseSong.prelude || match.prelude,
        interlude: baseSong.interlude || match.interlude,
        notes: baseSong.notes || match.notes,
      };
    }
    return baseSong;
  }, [worshipServices]);

  useEffect(() => {
    fetchSongs();
    loadSavedIds();
    loadSetlists();
  }, []);

  // ── Open specific song from notification ──────────
  const { songId } = route?.params || {};
  useEffect(() => {
    if (songId && songs.length > 0) {
      const songToOpen = songs.find(s => s.id === songId);
      if (songToOpen) {
        setSelectedSong(enrichSongWithSetlist(songToOpen));
        // Clear param so it doesn't reopen if the user closes it and navigates back
        navigation.setParams({ songId: undefined });
      }
    }
  }, [songId, songs, navigation, enrichSongWithSetlist]);

  const onRefresh = () => { setRefreshing(true); fetchSongs(true); loadSetlists(); };

  // ── Toggle save/unsave song ───────────────────────
  const toggleSave = async (song: WorshipSong) => {
    const isAlreadySaved = savedIds.includes(song.id);
    const songTitle = SongLanguageHelper.getSongTitle(song, language).primary || song.title;
    let newIds: string[];
    if (isAlreadySaved) {
      newIds = savedIds.filter(id => id !== song.id);
      setAlertConfig({ visible: true, title: t('songs.songRemoved'), message: t('songs.songRemovedMsg', { title: songTitle }), type: 'info' });
    } else {
      newIds = [...savedIds, song.id];
      setAlertConfig({ visible: true, title: t('songs.songSaved'), message: t('songs.songSavedMsg', { title: songTitle }), type: 'success' });
    }
    setSavedIds(newIds);
    await AsyncStorage.setItem(SONGBOOK_KEY, JSON.stringify(newIds));
  };

  // Helper: split multi-category string into array
  const getSongCategories = (song: WorshipSong): string[] =>
    (song.category || 'Other').split(';').map(c => c.trim()).filter(Boolean);

  // Search filter helper
  const matchesSearch = (s: WorshipSong & { displayNumber?: number }, q: string): boolean => {
    if (!q) return true;
    const { primary, secondary } = SongLanguageHelper.getSongTitle(s, language);
    return (
      (s.displayNumber !== undefined && s.displayNumber.toString() === q) ||
      primary.toLowerCase().includes(q) ||
      (secondary ? secondary.toLowerCase().includes(q) : false) ||
      (s.title && s.title.toLowerCase().includes(q)) ||
      (s.titleTe ? s.titleTe.toLowerCase().includes(q) : false) ||
      (s.titleEn ? s.titleEn.toLowerCase().includes(q) : false) ||
      (s.titleHi ? s.titleHi.toLowerCase().includes(q) : false) ||
      (s.titleTa ? s.titleTa.toLowerCase().includes(q) : false) ||
      (s.titleMr ? s.titleMr.toLowerCase().includes(q) : false) ||
      (s.titleMl ? s.titleMl.toLowerCase().includes(q) : false) ||
      (s.titleKn ? s.titleKn.toLowerCase().includes(q) : false) ||
      (s.artist ? s.artist.toLowerCase().includes(q) : false)
    );
  };

  // Category matching helper (handling "Stuthi" / "Sthuthi" and "All" / "All Songs")
  const categoryMatches = (songCats: string[], targetCat: string): boolean => {
    if (targetCat === 'All' || targetCat === 'All Songs') return true;
    const targetLower = targetCat.toLowerCase().trim();
    return songCats.some(c => {
      const cLower = c.toLowerCase().trim();
      if (cLower === targetLower) return true;
      if (targetLower.includes('stuthi') && cLower.includes('sthuthi')) return true;
      if (targetLower.includes('sthuthi') && cLower.includes('stuthi')) return true;
      return false;
    });
  };

  // Church songs categories: Canonical categories + any custom categories defined in church songs
  const churchCategories = React.useMemo(() => {
    const extraCats = new Set<string>();
    songs.filter(s => s.isChurchOwn).forEach(s => {
      getSongCategories(s).forEach(c => {
        const cLower = c.toLowerCase().trim();
        const exists = CATEGORIES.some(cat => {
          const catLower = cat.toLowerCase().trim();
          return catLower === cLower || 
            (catLower.includes('stuthi') && cLower.includes('sthuthi')) || 
            (catLower.includes('sthuthi') && cLower.includes('stuthi'));
        });
        if (!exists) {
          extraCats.add(c);
        }
      });
    });
    return [...CATEGORIES, ...Array.from(extraCats)];
  }, [songs]);

  // ── Filtered songs ────────────────────────────────
  const browseBaseList = songs.filter(s => {
    const cats = getSongCategories(s);
    // Songs that are ONLY a Theme Song stay in Theme tab; others show in Browse too
    if (cats.length === 1 && cats[0] === 'Theme Songs') return false;
    return categoryMatches(cats, selectedCategory);
  });

  const filteredBrowse = browseBaseList.map((s, idx) => ({ ...s, displayNumber: idx + 1 })).filter(s => {
    const q = search.toLowerCase().trim();
    return matchesSearch(s, q);
  });

  const savedSongsBase = songs.filter(s => savedIds.includes(s.id));
  const filteredSongbook = savedSongsBase.map((s, idx) => ({ ...s, displayNumber: idx + 1 })).filter(s => {
    const q = search.toLowerCase().trim();
    return matchesSearch(s, q);
  });

  const themeBaseList = songs.filter(s => {
    const cats = getSongCategories(s);
    return cats.includes('Theme Songs');
  });
  const filteredTheme = themeBaseList.map((s, idx) => ({ ...s, displayNumber: idx + 1 })).filter(s => {
    const q = search.toLowerCase().trim();
    return matchesSearch(s, q);
  });

  const churchOwnBaseList = songs.filter(s => {
    if (!s.isChurchOwn) return false;
    const cats = getSongCategories(s);
    return categoryMatches(cats, selectedChurchCategory);
  });
  const filteredChurchOwn = churchOwnBaseList.map((s, idx) => ({ ...s, displayNumber: idx + 1 })).filter(s => {
    const q = search.toLowerCase().trim();
    return matchesSearch(s, q);
  });

  // ── Song Card ─────────────────────────────────────
  const renderSongCard = ({ item, index }: { item: WorshipSong & { displayNumber?: number }; index: number }) => {
    const enrichedItem = enrichSongWithSetlist(item);
    const isSaved = savedIds.includes(item.id);
    const displayIndex = item.displayNumber !== undefined ? item.displayNumber : index + 1;
    // Default to Telugu for songs unless user explicitly chose another non-English language
    const displayLang = (language && language !== 'en') ? language : 'te';
    const { primary, secondary } = SongLanguageHelper.getSongTitle(enrichedItem, displayLang);
    const subtitle = secondary ? `${secondary}${enrichedItem.artist ? ` · ${enrichedItem.artist}` : ''}` : (enrichedItem.artist || '');

    return (
      <TouchableOpacity
        style={[styles.songCard, { backgroundColor: isDark ? '#1e293b' : '#fff', borderColor: isDark ? '#334155' : '#e5e7eb' }]}
        onPress={() => setSelectedSong(enrichedItem)}
        onLongPress={() => toggleSave(item)}
        delayLongPress={400}
      >
        <View style={[styles.indexBox, { backgroundColor: isDark ? '#0f172a' : '#f3f4f6' }]}>
          <Text style={[styles.indexTxt, { color: isDark ? '#94a3b8' : '#1a2d5a' }]}>{displayIndex}</Text>
        </View>
        <View style={styles.info}>
          <Text style={[styles.title, { color: isDark ? '#fff' : '#111827' }]} numberOfLines={1}>{primary}</Text>
          {subtitle ? (
            <Text style={[styles.artist, { color: isDark ? '#94a3b8' : '#6B7280' }]} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {isSaved && <Bookmark size={14} color="#c0392b" style={{ marginRight: 4 }} />}
        <ChevronRight size={16} color={isDark ? '#475569' : '#D1D5DB'} />
      </TouchableOpacity>
    );
  };

  const getServiceCategoryMeta = (categoryName?: string, serviceName?: string) => {
    const categories = [
      { type: 'Sunday Service', icon: '⛪', color: '#1a2d5a', bg: '#EFF6FF', border: '#BFDBFE' },
      { type: 'Bible Study', icon: '📖', color: '#B45309', bg: '#FEF3C7', border: '#FDE68A' },
      { type: "Women's Fasting Prayer", icon: '🙏', color: '#BE185D', bg: '#FDF2F8', border: '#FBCFE8' },
      { type: 'Youth Meeting', icon: '🔥', color: '#C2410C', bg: '#FFF7ED', border: '#FED7AA' },
      { type: 'Cottage / House Prayer', icon: '🏠', color: '#047857', bg: '#ECFDF5', border: '#A7F3D0' },
      { type: 'All-Night Prayer', icon: '🌙', color: '#4338CA', bg: '#EEF2FF', border: '#C7D2FE' },
      { type: 'Midweek Prayer', icon: '🕊️', color: '#0369A1', bg: '#F0F9FF', border: '#BAE6FD' },
      { type: 'Sunday School / Kids', icon: '🎨', color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE' },
      { type: 'Special Church Program', icon: '✨', color: '#9D174D', bg: '#FFF1F2', border: '#FECDD3' }
    ];
    if (categoryName) {
      const found = categories.find(c => c.type.toLowerCase() === categoryName.toLowerCase());
      if (found) return found;
      return { type: categoryName, icon: '⛪', color: '#1a2d5a', bg: '#EFF6FF', border: '#BFDBFE' };
    }
    if (serviceName) {
      const lower = serviceName.toLowerCase();
      if (lower.includes('bible study')) return categories[1];
      if (lower.includes('women') || lower.includes('fasting')) return categories[2];
      if (lower.includes('youth')) return categories[3];
      if (lower.includes('cottage') || lower.includes('house') || lower.includes('cell')) return categories[4];
      if (lower.includes('all-night') || lower.includes('night prayer') || lower.includes('vigil')) return categories[5];
      if (lower.includes('midweek') || lower.includes('intercessory')) return categories[6];
      if (lower.includes('kids') || lower.includes('children') || lower.includes('school')) return categories[7];
      if (lower.includes('special') || lower.includes('revival') || lower.includes('anniversary') || lower.includes('thanksgiving')) return categories[8];
    }
    return categories[0];
  };

  const validServices = Array.isArray(worshipServices) ? worshipServices.filter(Boolean) : [];
  const activeService: any = validServices.find((s: any) => s && s.id === activeServiceId) || (validServices.length > 0 ? validServices[0] : null);
  const activeSetlist: any[] = activeService?.songs || [];
  const activeList = activeTab === 'browse' ? filteredBrowse : activeTab === 'songbook' ? filteredSongbook : activeTab === 'theme' ? filteredTheme : activeTab === 'churchOwn' ? filteredChurchOwn : activeSetlist;
  const currentSongIndex = selectedSong ? activeList.findIndex(s => s.id === selectedSong.id) : -1;
  const totalSongs = activeList.length;

  // ── Setlist Flow UI (Member View) ───────────────────
  const renderSetlistFlow = () => {
    if (!activeService || validServices.length === 0) {
      return (
        <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 60, alignItems: 'center' }}>
          <View style={{
            width: 72,
            height: 72,
            borderRadius: 36,
            backgroundColor: isDark ? '#1e293b' : '#EFF6FF',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16,
            borderWidth: 1,
            borderColor: isDark ? '#334155' : '#BFDBFE'
          }}>
            <CalendarDays size={34} color="#2563EB" />
          </View>
          <Text style={{ fontSize: 18, fontWeight: '800', color: isDark ? '#FFFFFF' : '#1a2d5a', textAlign: 'center' }}>
            No Services Scheduled Yet
          </Text>
          <Text style={{ fontSize: 13, color: isDark ? '#94A3B8' : '#64748B', textAlign: 'center', marginTop: 8, lineHeight: 20, maxWidth: 300 }}>
            Your worship team has not published any church services or song sets yet. Please check back soon!
          </Text>
        </View>
      );
    }

    const activeCat = getServiceCategoryMeta(activeService?.category, activeService?.name);

    // Format display date: handles start & end date range if present
    const displayServiceDate = (() => {
      if (activeService?.startDate && activeService?.endDate && activeService.startDate !== activeService.endDate) {
        return `${activeService.startDate} – ${activeService.endDate}`;
      }
      return activeService?.date || '';
    })();

    return (
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Service Switcher & Header Card */}
        <View style={{
          backgroundColor: isDark ? '#1e293b' : '#FFFFFF',
          borderRadius: 16,
          padding: 16,
          marginBottom: 16,
          borderWidth: 1,
          borderColor: isDark ? '#334155' : '#E2E8F0',
          borderLeftWidth: 4,
          borderLeftColor: activeCat.color || '#2563EB',
          elevation: 2,
          shadowColor: '#000',
          shadowOpacity: 0.05,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: 2 }
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: worshipServices.length > 0 ? 14 : 4 }}>
            <View style={{ flex: 1, marginRight: 10 }}>
              {/* Category & Time Pills */}
              <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>
                <View style={{
                  backgroundColor: isDark ? '#334155' : activeCat.bg,
                  borderColor: isDark ? '#475569' : activeCat.border,
                  borderWidth: 1,
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 6,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4
                }}>
                  <Text style={{ fontSize: 11 }}>{activeCat.icon}</Text>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: isDark ? '#93C5FD' : activeCat.color }}>
                    {activeService?.category || activeCat.type}
                  </Text>
                </View>

                {activeService?.time ? (
                  <View style={{
                    backgroundColor: isDark ? '#0f172a' : '#F1F5F9',
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    borderRadius: 6,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4
                  }}>
                    <Clock size={11} color={isDark ? '#94A3B8' : '#64748B'} />
                    <Text style={{ fontSize: 11, fontWeight: '700', color: isDark ? '#CBD5E1' : '#475569' }}>
                      {activeService.time}
                    </Text>
                  </View>
                ) : null}
              </View>

              {/* Service Title */}
              <Text style={{ fontSize: 18, fontWeight: '900', color: isDark ? '#FFFFFF' : '#1a2d5a', letterSpacing: -0.2 }}>
                {activeService?.name || 'Church Service Flow'}
              </Text>

              {/* Service Date & Song Count */}
              <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                {displayServiceDate ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <CalendarDays size={13} color="#2563EB" />
                    <Text style={{ fontSize: 12, color: isDark ? '#93C5FD' : '#2563EB', fontWeight: '700' }}>
                      {displayServiceDate}
                    </Text>
                  </View>
                ) : (
                  <Text style={{ fontSize: 11, color: isDark ? '#94A3B8' : '#64748B', fontWeight: '600' }}>
                    Order of Service & Band Charts
                  </Text>
                )}

                {activeSetlist.length > 0 && (
                  <View style={{ backgroundColor: isDark ? '#334155' : '#E0E7FF', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 }}>
                    <Text style={{ fontSize: 10, fontWeight: '800', color: isDark ? '#C7D2FE' : '#4338CA' }}>
                      {activeSetlist.length} {activeSetlist.length === 1 ? 'song' : 'songs'}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Share Setlist Button */}
            <TouchableOpacity
              onPress={handleShareSetlist}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
                backgroundColor: isDark ? '#334155' : '#EFF6FF',
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: isDark ? '#475569' : '#BFDBFE'
              }}
            >
              <Share2 size={13} color={isDark ? '#93C5FD' : '#1D4ED8'} />
              <Text style={{ fontSize: 11, fontWeight: '800', color: isDark ? '#93C5FD' : '#1D4ED8' }}>Share</Text>
            </TouchableOpacity>
          </View>

          {/* Dynamic Services Switcher Ribbon */}
          {validServices.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, paddingTop: 6, alignItems: 'center' }}
            >
              {validServices.map((srv: any) => {
                if (!srv) return null;
                const isSelected = (srv?.id || srv?.name) === (activeService?.id || activeService?.name);
                const srvCat = getServiceCategoryMeta(srv?.category, srv?.name);
                const srvDateStr = (srv.startDate && srv.endDate && srv.startDate !== srv.endDate)
                  ? `${srv.startDate} – ${srv.endDate}`
                  : (srv.date || '');

                return (
                  <TouchableOpacity
                    key={srv?.id || srv?.name || Math.random().toString()}
                    style={[{
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 12,
                      backgroundColor: isDark ? '#0f172a' : '#F8FAFC',
                      borderWidth: 1.5,
                      borderColor: isDark ? '#334155' : '#E2E8F0',
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 8
                    }, isSelected && {
                      backgroundColor: '#1a2d5a',
                      borderColor: '#1a2d5a',
                      shadowColor: '#1a2d5a',
                      shadowOpacity: 0.25,
                      shadowRadius: 4,
                      shadowOffset: { width: 0, height: 2 },
                      elevation: 3
                    }]}
                    onPress={() => setActiveServiceId(srv?.id)}
                  >
                    <Text style={{ fontSize: 14 }}>{srvCat.icon}</Text>
                    <View>
                      <Text style={[{ fontSize: 12, fontWeight: '800', color: isDark ? '#CBD5E1' : '#334155' }, isSelected && { color: '#FFFFFF' }]}>
                        {srv?.name || 'Service'}
                      </Text>
                      {srvDateStr ? (
                        <Text style={[{ fontSize: 10, fontWeight: '600', color: isDark ? '#64748B' : '#94A3B8' }, isSelected && { color: '#93C5FD' }]}>
                          {srvDateStr}
                        </Text>
                      ) : null}
                    </View>
                    <View style={{
                      backgroundColor: isSelected ? 'rgba(255,255,255,0.22)' : (isDark ? '#1e293b' : '#E2E8F0'),
                      paddingHorizontal: 6,
                      paddingVertical: 1,
                      borderRadius: 6,
                      marginLeft: 2
                    }}>
                      <Text style={{ fontSize: 10, fontWeight: '800', color: isSelected ? '#FFFFFF' : (isDark ? '#94A3B8' : '#64748B') }}>
                        {srv.songs?.length || 0}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>

        {/* Setlist Song Items */}
        {activeSetlist.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 50, paddingHorizontal: 20 }}>
            <Music size={42} color={isDark ? '#475569' : '#cbd5e1'} />
            <Text style={{ fontSize: 16, fontWeight: '800', color: isDark ? '#94A3B8' : '#1a2d5a', marginTop: 12 }}>
              No Songs in {activeService?.name || 'this service'}
            </Text>
            <Text style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center', marginTop: 6, lineHeight: 18, maxWidth: 280 }}>
              The song arrangement for {activeService?.name || 'this service'} will appear here once published by your worship team.
            </Text>
          </View>
        ) : (
          activeSetlist.map((s, idx) => (
            <TouchableOpacity
              key={s.id || idx}
              activeOpacity={0.85}
              onPress={() => {
                const match = songs.find(libSong =>
                  libSong.title.toLowerCase().trim() === s.title.toLowerCase().trim()
                );
                if (match) {
                  setSelectedSong({
                    ...match,
                    key: s.key || match.key,
                    timeSignature: s.timeSignature || match.timeSignature,
                    tempo: s.tempo || match.tempo,
                    verses: s.verses || match.verses,
                    prelude: s.prelude || match.prelude,
                    interlude: s.interlude || match.interlude,
                    notes: s.notes || match.notes,
                    ledBy: s.ledBy || match.ledBy
                  });
                } else {
                  setSelectedSong({
                    id: s.id || `setlist-${idx}`,
                    title: s.title,
                    key: s.key,
                    timeSignature: s.timeSignature,
                    tempo: s.tempo,
                    verses: s.verses,
                    prelude: s.prelude,
                    interlude: s.interlude,
                    notes: s.notes,
                    ledBy: s.ledBy,
                    lyrics: `Lyrics for "${s.title}" are being prepared for Sunday Service.`
                  } as WorshipSong);
                }
              }}
              style={{
                backgroundColor: isDark ? '#1e293b' : '#FFFFFF',
                borderRadius: 14,
                padding: 14,
                marginBottom: 10,
                borderWidth: 1,
                borderColor: isDark ? '#334155' : '#E2E8F0',
                elevation: 1.5,
                shadowColor: '#000',
                shadowOpacity: 0.04,
                shadowRadius: 4,
                shadowOffset: { width: 0, height: 1 }
              }}
            >
              {/* Header: Number, Title (English & Telugu), Offertory, Chevron */}
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, flex: 1, marginRight: 8 }}>
                  <View style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    backgroundColor: isDark ? '#2563EB' : '#1a2d5a',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginTop: 1
                  }}>
                    <Text style={{ color: '#fff', fontSize: 12, fontWeight: '900' }}>{idx + 1}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontWeight: '800', color: isDark ? '#FFFFFF' : '#1a2d5a', lineHeight: 20 }} numberOfLines={2}>
                      {s.title}
                    </Text>
                    {s.titleTe ? (
                      <Text style={{ fontSize: 13, color: isDark ? '#94A3B8' : '#64748B', marginTop: 2, fontWeight: '600' }} numberOfLines={1}>
                        {s.titleTe}
                      </Text>
                    ) : null}
                  </View>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  {s.isOffertory ? (
                    <View style={{ backgroundColor: '#FEF3C7', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6, borderWidth: 1, borderColor: '#FDE68A' }}>
                      <Text style={{ fontSize: 9, fontWeight: '900', color: '#B45309' }}>🪙 OFFERTORY</Text>
                    </View>
                  ) : null}
                  <ChevronRight size={16} color={isDark ? '#64748B' : '#94A3B8'} />
                </View>
              </View>

              {/* Song Leader */}
              {s.ledBy ? (
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 5,
                  marginBottom: 8,
                  backgroundColor: isDark ? '#1e3a5f' : '#EFF6FF',
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 6,
                  alignSelf: 'flex-start',
                  borderWidth: 0.5,
                  borderColor: isDark ? '#2563EB' : '#BFDBFE'
                }}>
                  <Mic size={11} color={isDark ? '#93C5FD' : '#1D4ED8'} />
                  <Text style={{ fontSize: 11, fontWeight: '800', color: isDark ? '#93C5FD' : '#1D4ED8' }}>
                    Lead: {s.ledBy}
                  </Text>
                </View>
              ) : null}

              {/* Musical Arrangement Row */}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: (s.prelude || s.interlude || s.notes) ? 8 : 0 }}>
                {s.key ? (
                  <View style={{
                    backgroundColor: isDark ? '#1e293b' : '#EFF6FF',
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    borderRadius: 6,
                    borderWidth: 1,
                    borderColor: isDark ? '#3b82f6' : '#BFDBFE'
                  }}>
                    <Text style={{ fontSize: 10, fontWeight: '800', color: isDark ? '#93C5FD' : '#1D4ED8' }}>
                      Key: {s.key}
                    </Text>
                  </View>
                ) : null}

                {s.timeSignature ? (
                  <View style={{
                    backgroundColor: isDark ? '#0f172a' : '#F8FAFC',
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    borderRadius: 6,
                    borderWidth: 1,
                    borderColor: isDark ? '#334155' : '#E2E8F0'
                  }}>
                    <Text style={{ fontSize: 10, fontWeight: '800', color: isDark ? '#CBD5E1' : '#475569' }}>
                      Time: {s.timeSignature}
                    </Text>
                  </View>
                ) : null}

                {s.tempo ? (
                  <View style={{
                    backgroundColor: isDark ? '#291e0a' : '#FFFBEB',
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    borderRadius: 6,
                    borderWidth: 1,
                    borderColor: isDark ? '#78350f' : '#FDE68A'
                  }}>
                    <Text style={{ fontSize: 10, fontWeight: '800', color: isDark ? '#FCD34D' : '#B45309' }}>
                      ⏱️ {s.tempo} BPM
                    </Text>
                  </View>
                ) : null}

                {s.verses ? (
                  <View style={{
                    backgroundColor: isDark ? '#062817' : '#F0FDF4',
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    borderRadius: 6,
                    borderWidth: 1,
                    borderColor: isDark ? '#166534' : '#BBF7D0'
                  }}>
                    <Text style={{ fontSize: 10, fontWeight: '800', color: isDark ? '#86EFAC' : '#15803D' }}>
                      {s.verses}
                    </Text>
                  </View>
                ) : null}
              </View>

              {/* Prelude & Interlude */}
              {(s.prelude || s.interlude) ? (
                <View style={{
                  flexDirection: 'row',
                  gap: 8,
                  paddingTop: 8,
                  borderTopWidth: 0.5,
                  borderTopColor: isDark ? '#334155' : '#F1F5F9'
                }}>
                  {s.prelude ? (
                    <View style={{ flex: 1, backgroundColor: isDark ? '#042f2e' : '#F0FDFA', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 0.5, borderColor: isDark ? '#115e59' : '#99F6E4' }}>
                      <Text style={{ fontSize: 10, color: isDark ? '#5EEAD4' : '#0F766E', fontWeight: '700' }} numberOfLines={1}>
                        🎵 Prelude: {s.prelude}
                      </Text>
                    </View>
                  ) : null}
                  {s.interlude ? (
                    <View style={{ flex: 1, backgroundColor: isDark ? '#172554' : '#EFF6FF', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 0.5, borderColor: isDark ? '#1e40af' : '#BFDBFE' }}>
                      <Text style={{ fontSize: 10, color: isDark ? '#93C5FD' : '#1D4ED8', fontWeight: '700' }} numberOfLines={1}>
                        🎸 Interlude: {s.interlude}
                      </Text>
                    </View>
                  ) : null}
                </View>
              ) : null}

              {/* Notes */}
              {s.notes ? (
                <View style={{
                  marginTop: 8,
                  backgroundColor: isDark ? '#2e2008' : '#FEFCE8',
                  paddingHorizontal: 9,
                  paddingVertical: 5,
                  borderRadius: 6,
                  borderWidth: 0.5,
                  borderColor: isDark ? '#713f12' : '#FEF08A'
                }}>
                  <Text style={{ fontSize: 11, color: isDark ? '#FDE68A' : '#92400E', fontWeight: '600' }}>
                    💡 Note: {s.notes}
                  </Text>
                </View>
              ) : null}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    );
  };

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
            <Text style={styles.pageTitle}>{t('songs.worshipAndPraise')}</Text>
          </View>
        </View>

        <View style={{ width: 24 }} />
      </LinearGradient>

      {/* ── Main Tabs Ribbon ── */}
      <View style={{ marginTop: 14, marginBottom: 4 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 6 }}>
          <TouchableOpacity
            style={[styles.tabPill, { backgroundColor: isDark ? '#1e293b' : '#E2E8F0' }, activeTab === 'browse' && styles.tabPillActive]}
            onPress={() => { setActiveTab('browse'); setSearch(''); }}
          >
            <Music size={13} color={activeTab === 'browse' ? '#fff' : (isDark ? '#94a3b8' : '#64748b')} />
            <Text style={[styles.tabPillTxt, activeTab === 'browse' && styles.tabPillTxtActive]}>
              {t('songs.allSongs')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabPill, { backgroundColor: isDark ? '#1e293b' : '#E2E8F0' }, activeTab === 'setlist' && styles.tabPillActive]}
            onPress={() => { setActiveTab('setlist'); setSearch(''); }}
          >
            <Sliders size={13} color={activeTab === 'setlist' ? '#fff' : (isDark ? '#94a3b8' : '#64748b')} />
            <Text style={[styles.tabPillTxt, activeTab === 'setlist' && styles.tabPillTxtActive]}>
              Setlist Flow
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabPill, { backgroundColor: isDark ? '#1e293b' : '#E2E8F0' }, activeTab === 'churchOwn' && styles.tabPillActive]}
            onPress={() => { setActiveTab('churchOwn'); setSearch(''); }}
          >
            <Music size={13} color={activeTab === 'churchOwn' ? '#fff' : (isDark ? '#94a3b8' : '#64748b')} />
            <Text style={[styles.tabPillTxt, activeTab === 'churchOwn' && styles.tabPillTxtActive]}>
              {t('songs.churchSongs')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabPill, { backgroundColor: isDark ? '#1e293b' : '#E2E8F0' }, activeTab === 'theme' && styles.tabPillActive]}
            onPress={() => { setActiveTab('theme'); setSearch(''); }}
          >
            <Music size={13} color={activeTab === 'theme' ? '#fff' : (isDark ? '#94a3b8' : '#64748b')} />
            <Text style={[styles.tabPillTxt, activeTab === 'theme' && styles.tabPillTxtActive]}>
              {t('songs.theme')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabPill, { backgroundColor: isDark ? '#1e293b' : '#E2E8F0' }, activeTab === 'songbook' && styles.tabPillActive]}
            onPress={() => { setActiveTab('songbook'); setSearch(''); }}
          >
            <BookMarked size={13} color={activeTab === 'songbook' ? '#fff' : (isDark ? '#94a3b8' : '#64748b')} />
            <Text style={[styles.tabPillTxt, activeTab === 'songbook' && styles.tabPillTxtActive]}>
              {t('songs.mySongs')}{savedIds.length > 0 ? ` (${savedIds.length})` : ''}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* ── Category Chips & Search Bar (Non-Setlist Tabs) ── */}
      {activeTab !== 'setlist' && (
        <>
          {/* Category Chips (Browse only) */}
          {activeTab === 'browse' && (
            <ScrollView
              horizontal showsHorizontalScrollIndicator={false}
              style={styles.chipScroll} contentContainerStyle={{ paddingHorizontal: 16, gap: 8, alignItems: 'center' }}>
              {CATEGORIES.map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.chip, selectedCategory === cat && styles.chipActive]}
                  onPress={() => setSelectedCategory(cat)}>
                  <Text style={[styles.chipTxt, selectedCategory === cat && styles.chipTxtActive]}>
                    {SongLanguageHelper.getLocalizedCategory(cat, language)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {/* Category Chips (Church Songs only) */}
          {activeTab === 'churchOwn' && (
            <ScrollView
              horizontal showsHorizontalScrollIndicator={false}
              style={styles.chipScroll} contentContainerStyle={{ paddingHorizontal: 16, gap: 8, alignItems: 'center' }}>
              {churchCategories.map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.chip, selectedChurchCategory === cat && styles.chipActive]}
                  onPress={() => setSelectedChurchCategory(cat)}>
                  <Text style={[styles.chipTxt, selectedChurchCategory === cat && styles.chipTxtActive]}>
                    {SongLanguageHelper.getLocalizedCategory(cat, language)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {/* Search Bar */}
          <View style={[styles.searchBar, { backgroundColor: isDark ? '#1e293b' : '#fff' }]}>
            <Search size={18} color={isDark ? '#94a3b8' : '#64748b'} />
            <TextInput
              placeholder={
                activeTab === 'browse' ? t('songs.searchSongs') :
                activeTab === 'churchOwn' ? t('songs.searchChurchSongs') :
                activeTab === 'theme' ? t('songs.searchThemeSongs') :
                t('songs.searchSongbook')
              }
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

          {/* Long Press hint */}
          {(activeTab === 'browse' || activeTab === 'churchOwn') && (
            <Text style={styles.hint}>{t('songs.longPressSaveHint')}</Text>
          )}
          {activeTab === 'songbook' && (
            <Text style={styles.hint}>{t('songs.longPressRemoveHint')}</Text>
          )}
        </>
      )}

      {/* ── Setlist Flow Tab ── */}
      {activeTab === 'setlist' && renderSetlistFlow()}

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
                {selectedCategory === 'All' ? t('songs.allSongs').toUpperCase() : SongLanguageHelper.getLocalizedCategory(selectedCategory, language).toUpperCase()} • {t('songs.songsCount', { count: filteredBrowse.length })}
              </Text>
            }
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <AlertCircle size={44} color="#cbd5e1" />
                <Text style={[styles.emptyTitle, { color: isDark ? '#94a3b8' : '#1a2d5a' }]}>{t('songs.noSongsFound')}</Text>
                <Text style={styles.emptySub}>{t('songs.tryDifferentCategory')}</Text>
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
            <Text style={styles.secLbl}>{t('songs.mySavedSongs')} • {t('songs.songsCount', { count: filteredSongbook.length })}</Text>
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <BookMarked size={44} color="#cbd5e1" />
              <Text style={[styles.emptyTitle, { color: isDark ? '#94a3b8' : '#1a2d5a' }]}>{t('songs.songbookEmpty')}</Text>
              <Text style={styles.emptySub}>{t('songs.songbookEmptySub')}</Text>
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
                {t('songs.themeSongs')} • {t('songs.songsCount', { count: filteredTheme.length })}
              </Text>
            }
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={[styles.emptyTitle, { color: isDark ? '#94a3b8' : '#1a2d5a' }]}>{t('songs.noThemeSongs')}</Text>
                <Text style={styles.emptySub}>{t('songs.noThemeSongsSub')}</Text>
              </View>
            }
          />
        )
      )}

      {/* ── Church Own Songs List ── */}
      {activeTab === 'churchOwn' && (
        loading && !refreshing ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#1a2d5a" />
          </View>
        ) : (
          <FlatList
            style={{ flex: 1 }}
            data={filteredChurchOwn}
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
                {(selectedChurchCategory === 'All' || selectedChurchCategory === 'All Songs'
                  ? t('songs.allSongs')
                  : SongLanguageHelper.getLocalizedCategory(selectedChurchCategory, language)
                ).toUpperCase()} • {t('songs.songsCount', { count: filteredChurchOwn.length })}
              </Text>
            }
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <AlertCircle size={44} color="#cbd5e1" />
                <Text style={[styles.emptyTitle, { color: isDark ? '#94a3b8' : '#1a2d5a' }]}>
                  {songs.some(s => s.isChurchOwn) ? t('songs.noSongsFound') : t('songs.noChurchSongs')}
                </Text>
                <Text style={styles.emptySub}>
                  {songs.some(s => s.isChurchOwn) ? t('songs.tryDifferentCategory') : t('songs.noChurchSongsSub')}
                </Text>
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
        onNext={() => currentSongIndex < totalSongs - 1 && setSelectedSong(enrichSongWithSetlist(activeList[currentSongIndex + 1]))}
        onPrev={() => currentSongIndex > 0 && setSelectedSong(enrichSongWithSetlist(activeList[currentSongIndex - 1]))}
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
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, paddingHorizontal: 2, borderRadius: 21, gap: 2, minWidth: 0 },
  tabActive: { backgroundColor: '#1a2d5a' },
  tabTxt: { fontSize: 10, fontWeight: '700', color: '#64748b', flexShrink: 1, textAlign: 'center' },
  tabTxtActive: { color: '#fff' },

  tabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 13,
    borderRadius: 20,
    gap: 6,
  },
  tabPillActive: {
    backgroundColor: '#1a2d5a',
  },
  tabPillTxt: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
  },
  tabPillTxtActive: {
    color: '#fff',
  },

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

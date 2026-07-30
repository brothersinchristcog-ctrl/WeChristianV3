import React, { useState, useEffect, useContext } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ScrollView,
  ActivityIndicator,
  Alert,
  StatusBar,
  Dimensions,
  Platform,
  Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Music, Save, ChevronDown, CheckCircle, Pencil, X, List, Eye, Square, Trash2, Star, ChevronLeft, Plus } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AdminTabContext } from '../../context/AdminTabContext';
import FirestoreService, { WorshipSong } from '../../services/FirestoreService';
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp
} from '@react-native-firebase/firestore';

const { width, height } = Dimensions.get('window');

const CATEGORIES = [
  'Stuthi Songs',
  'Aradhana Songs',
  'Offering Songs',
  'Christmas Songs',
  'Easter Songs',
  'Youth Songs',
  'Gospel Songs',
  'Marriage Songs',
  'Thanksgiving Songs',
  'Special Songs',
  'Other',
  'Theme Songs'
];

const SONGBOOK_KEY = 'cog_my_songbook_ids';

const KEYS = [
  'C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B',
  'Cm', 'C#m', 'Dm', 'Ebm', 'Em', 'Fm', 'F#m', 'Gm', 'Abm', 'Am', 'Bbm', 'Bm'
];

export default function AdminSongEditor() {
  const { setActiveTab } = useContext(AdminTabContext);

  // Screen-level tab
  const [screenTab, setScreenTab] = useState<'list' | 'theme'>('list');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [showPostModal, setShowPostModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // ── POST SONG FORM ──────────────────────────────
  const [titleEn, setTitleEn] = useState('');
  const [titleTe, setTitleTe] = useState('');
  const [artist, setArtist] = useState('');
  const [lyrics, setLyrics] = useState('');
  const [status, setStatus] = useState('Published');
  const [categories, setCategories] = useState<string[]>(['Stuthi Songs']);
  const [youtubeId, setYoutubeId] = useState('');

  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showDeleteSuccess, setShowDeleteSuccess] = useState(false);
  const [songToDelete, setSongToDelete] = useState<{ id: string, title: string } | null>(null);
  const [syncReceipt, setSyncReceipt] = useState({ savedTo: '', id: '' });

  // ── MEMBER VIEW STATE ────────────────────────────
  const [memberSongs, setMemberSongs] = useState<WorshipSong[]>([]);
  const [memberSearch, setMemberSearch] = useState('');
  const [memberTab, setMemberTab] = useState<'browse' | 'theme'>('browse');
  const [savedIds, setSavedIds] = useState<string[]>([]);

  // ── POSTED SONGS LIST ───────────────────────────
  const [postedSongs, setPostedSongs] = useState<WorshipSong[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [listSearchQuery, setListSearchQuery] = useState('');

  // ── EDIT MODAL ──────────────────────────────────
  const [editingSong, setEditingSong] = useState<WorshipSong | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editTitleTe, setEditTitleTe] = useState('');
  const [editArtist, setEditArtist] = useState('');
  const [editKey, setEditKey] = useState('C');
  const [editLyrics, setEditLyrics] = useState('');
  const [editCategories, setEditCategories] = useState<string[]>(['Stuthi Songs']);
  const [editYoutubeId, setEditYoutubeId] = useState('');
  const [editStatus, setEditStatus] = useState('Published');
  const [savingEdit, setSavingEdit] = useState(false);
  const [showEditCategoryPicker, setShowEditCategoryPicker] = useState(false);
  const [showEditKeyPicker, setShowEditKeyPicker] = useState(false);

  const fetchPostedSongs = async () => {
    setLoadingList(true);
    try {
      const data = await FirestoreService.getWorshipSongs();
      setPostedSongs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    if (screenTab === 'list' || screenTab === 'theme') {
      fetchPostedSongs();
    }
  }, [screenTab]);

  const fetchMemberSongs = async () => {
    try {
      const data = await FirestoreService.getWorshipSongs();
      setMemberSongs(data);
      const stored = await AsyncStorage.getItem(SONGBOOK_KEY);
      if (stored) setSavedIds(JSON.parse(stored));
    } catch (err) {
      console.error(err);
    }
  };

  // ── PUBLISH NEW SONG ─────────────────────────────
  const handlePublishSong = async () => {
    if (!titleEn.trim()) {
      Alert.alert('Required', 'Please enter a Song Title (English).');
      return;
    }
    if (!lyrics.trim()) {
      Alert.alert('Required', 'Please enter the Song Lyrics.');
      return;
    }
    setSubmitting(true);
    try {
      const primaryCategory = categories.join(';') || 'Other';
      const receipt = await FirestoreService.createWorshipSong({
        title: titleEn.trim(),
        titleTe: titleTe.trim(),
        artist: artist.trim(),
        lyrics: lyrics.trim(),
        status,
        category: primaryCategory,
        youtubeId: youtubeId.trim()
      });
      setSyncReceipt({ savedTo: 'Firebase DB', id: typeof receipt === 'string' ? receipt : (receipt as any)?.id || 'Unknown' });

      try {
        const churchId = await FirestoreService.getChurchId();
        await FirestoreService.createNotificationBroadcast({
          title: `🎵 New Song: ${titleEn.trim()}`,
          content: `A new worship song "${titleEn.trim()}" has been posted under ${primaryCategory}!`,
          date: new Date().toISOString().split('T')[0],
          type: 'announcement',
          targetChurchId: churchId,
        });
      } catch { /* rules may block — OK */ }

      setShowSuccess(true);
      setShowPostModal(false); // Close modal on success
    } catch (error: any) {
      Alert.alert('Salesforce Sync Error', error.message || 'Failed to sync with Salesforce.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setTitleEn(''); setTitleTe(''); setLyrics(''); setYoutubeId('');
    setArtist(''); setCategories(['Stuthi Songs']); setStatus('Published');
  };

  // ── OPEN EDIT MODAL ──────────────────────────────
  const openEdit = (song: WorshipSong) => {
    setEditingSong(song);
    setEditTitle(song.title);
    setEditTitleTe(song.titleTe || '');
    setEditArtist(song.artist || '');
    setEditLyrics(song.lyrics || '');
    // Split semicolon-separated categories back into array
    const cats = (song.category || 'Stuthi Songs')
      .split(';').map(c => c.trim()).filter(Boolean);
    setEditCategories(cats);
    setEditYoutubeId(song.youtubeId || '');
    setEditStatus('Published');
  };

  const handleSaveEdit = async () => {
    if (!editingSong) return;
    if (!editTitle.trim()) { Alert.alert('Required', 'Song title is required.'); return; }
    setSavingEdit(true);
    try {
      const primaryEditCategory = editCategories.join(';') || 'Other';
      await FirestoreService.updateWorshipSong(editingSong.id, {
        title: editTitle.trim(),
        titleTe: editTitleTe.trim(),
        artist: editArtist.trim(),
        lyrics: editLyrics.trim(),
        category: primaryEditCategory,
        status: editStatus,
        youtubeId: editYoutubeId.trim()
      });
      Alert.alert('✅ Updated', 'Song updated successfully in Salesforce!');
      setEditingSong(null);
      fetchPostedSongs();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update song.');
    } finally {
      setSavingEdit(false);
    }
  };

  // ── RENDER POSTED SONG ITEM ──────────────────────
  const [adminSelectedSong, setAdminSelectedSong] = useState<WorshipSong | null>(null);

  const confirmDeleteSong = async () => {
    if (!songToDelete) return;
    try {
      await FirestoreService.deleteWorshipSong(songToDelete.id);
      fetchPostedSongs();
      setSongToDelete(null);
      setShowDeleteSuccess(true);
      setTimeout(() => setShowDeleteSuccess(false), 2500);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to delete song.');
      setSongToDelete(null);
    }
  };

  const handleToggleTheme = async (song: WorshipSong) => {
    try {
      const currentCats = (song.category || 'Stuthi Songs')
        .split(';').map(c => c.trim()).filter(Boolean);
      let newCats: string[];
      if (currentCats.includes('Theme Songs')) {
        // Remove Theme Songs; keep remaining categories (fallback to Stuthi Songs)
        newCats = currentCats.filter(c => c !== 'Theme Songs');
        if (newCats.length === 0) newCats = ['Stuthi Songs'];
      } else {
        // Add Theme Songs to existing categories
        newCats = [...currentCats, 'Theme Songs'];
      }
      const newCategory = newCats.join(';');
      setPostedSongs(prev => prev.map(s => s.id === song.id ? { ...s, category: newCategory } : s));

      await FirestoreService.updateWorshipSong(song.id, { category: newCategory });
    } catch (e: any) {
      fetchPostedSongs();
      Alert.alert('Error', 'Failed to toggle theme status.');
    }
  };

  const renderSongItem = ({ item, index }: { item: WorshipSong; index: number }) => {
    const isTheme = (item.category || '').split(';').map(c => c.trim()).includes('Theme Songs');
    return (
      <View style={styles.songItem}>
        <View style={styles.songIconBox}>
          <Music size={16} color="#1a2d5a" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.songItemTitle} numberOfLines={1}>{index + 1}. {item.title}</Text>
          <Text style={styles.songItemSub} numberOfLines={1}>
            {item.category || 'Other'}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
          <TouchableOpacity 
            onPress={() => handleToggleTheme(item)} 
            style={{ 
              paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, borderWidth: 1, 
              borderColor: isTheme ? '#f59e0b' : '#e2e8f0', 
              backgroundColor: isTheme ? '#fef3c7' : '#f8fafc',
              flexDirection: 'row', alignItems: 'center', gap: 4 
            }}>
            <Star size={12} color={isTheme ? "#d97706" : "#94a3b8"} fill={isTheme ? "#f59e0b" : "none"} />
            <Text style={{ fontSize: 10, fontWeight: '700', color: isTheme ? '#d97706' : '#64748b' }}>
              {isTheme ? 'THEME SONG' : 'MAKE THEME'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => openEdit(item)} style={{ padding: 4 }}>
            <Pencil size={15} color="#1a2d5a" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setSongToDelete({ id: item.id, title: item.title })} style={{ padding: 4 }}>
            <Trash2 size={16} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // ── MEMBER VIEW UI ────────────────────────────────
  const renderMemberView = () => {
    const browseSongs = memberSongs.filter(s => {
      const cats = (s.category || 'Other').split(';').map(c => c.trim()).filter(Boolean);
      if (cats.length === 1 && cats[0] === 'Theme Songs') return false;
      const q = memberSearch.toLowerCase().trim();
      return !q || s.title.toLowerCase().includes(q) || (s.titleTe && s.titleTe.toLowerCase().includes(q));
    });
    const themeSongs = memberSongs.filter(s => {
      const cats = (s.category || 'Other').split(';').map(c => c.trim()).filter(Boolean);
      if (!cats.includes('Theme Songs')) return false;
      const q = memberSearch.toLowerCase().trim();
      return !q || s.title.toLowerCase().includes(q) || (s.titleTe && s.titleTe.toLowerCase().includes(q));
    });
    const displaySongs = memberTab === 'browse' ? browseSongs : themeSongs;

    return (
      <View style={{ flex: 1, backgroundColor: '#EDE8DC' }}>
        {/* Member View Header */}
        <View style={{ backgroundColor: '#1a2d5a', paddingVertical: 10, paddingHorizontal: 16 }}>
          <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700', textAlign: 'center', opacity: 0.8 }}>
            👁 ADMIN PREVIEW: Member Songs View
          </Text>
        </View>

        {/* Tabs */}
        <View style={{ flexDirection: 'row', backgroundColor: '#FFFFFF', margin: 16, borderRadius: 14, padding: 4, gap: 4, elevation: 2, shadowColor: '#1a2d5a', shadowOpacity: 0.05, shadowRadius: 5, borderWidth: 1, borderColor: 'rgba(26,45,90,0.05)' }}>
          <TouchableOpacity
            style={[{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 10, gap: 6 },
              memberTab === 'browse' && { backgroundColor: '#1a2d5a' }]}
            onPress={() => setMemberTab('browse')}>
            <Music size={13} color={memberTab === 'browse' ? '#fff' : '#64748b'} />
            <Text style={{ fontSize: 12, fontWeight: '700', color: memberTab === 'browse' ? '#fff' : '#64748b' }}>Browse Songs</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 10, gap: 6 },
              memberTab === 'theme' && { backgroundColor: '#1a2d5a' }]}
            onPress={() => setMemberTab('theme')}>
            <Music size={13} color={memberTab === 'theme' ? '#fff' : '#64748b'} />
            <Text style={{ fontSize: 12, fontWeight: '700', color: memberTab === 'theme' ? '#fff' : '#64748b' }}>Theme Songs</Text>
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 8,
          borderRadius: 12, paddingHorizontal: 14, height: 48, backgroundColor: '#FFFFFF',
          elevation: 2, shadowColor: '#1a2d5a', shadowOpacity: 0.05, shadowRadius: 5, borderWidth: 1, borderColor: 'rgba(26,45,90,0.05)' }}>
          <Music size={16} color="#1a2d5a" />
          <TextInput
            placeholder={memberTab === 'browse' ? 'Search songs...' : 'Search theme songs...'}
            placeholderTextColor="#9CA3AF"
            style={{ flex: 1, fontSize: 13, fontWeight: '600', marginLeft: 8, color: '#1a2d5a' }}
            value={memberSearch}
            onChangeText={setMemberSearch}
          />
        </View>

        {/* Song List */}
        <FlatList
          data={displaySongs}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
          refreshing={false}
          onRefresh={fetchMemberSongs}
          contentContainerStyle={{ paddingBottom: 40 }}
          ListHeaderComponent={() => (
            <Text style={{ fontSize: 10, fontWeight: '800', color: '#9CA3AF', letterSpacing: 0.8,
              marginHorizontal: 16, marginBottom: 10, marginTop: 4 }}>
              {memberTab === 'browse' ? 'ALL SONGS' : 'THEME SONGS'} · {displaySongs.length} Songs
            </Text>
          )}
          renderItem={({ item, index }) => (
            <TouchableOpacity
              style={{ borderRadius: 14, borderWidth: 1, borderColor: 'rgba(26,45,90,0.08)', marginHorizontal: 16,
                marginBottom: 10, flexDirection: 'row', alignItems: 'center', padding: 14, backgroundColor: '#FFFFFF',
                elevation: 2, shadowColor: '#1a2d5a', shadowOpacity: 0.05, shadowRadius: 4 }}
              onPress={() => setAdminSelectedSong(item)}>
              <View style={{ width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center',
                marginRight: 12, backgroundColor: '#F8FAFC' }}>
                <Text style={{ fontSize: 13, fontWeight: '800', color: '#1a2d5a' }}>{index + 1}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: '800', color: '#1a2d5a' }} numberOfLines={1}>{item.title}</Text>
                <Text style={{ fontSize: 11, marginTop: 2, fontWeight: '600', color: '#64748B' }} numberOfLines={1}>
                  {item.titleTe ? `${item.titleTe} · ` : ''}{item.artist}
                </Text>
              </View>
              <Music size={14} color="#1a2d5a" />
            </TouchableOpacity>
          )}
          ListEmptyComponent={() => (
            <View style={{ padding: 40, alignItems: 'center' }}>
              <Music size={44} color="#cbd5e1" />
              <Text style={{ fontSize: 15, fontWeight: '800', color: '#1a2d5a', marginTop: 12 }}>No Songs</Text>
              <Text style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
                {memberTab === 'theme' ? 'Mark songs as "Is Theme Song" to show them here.' : 'No songs found.'}
              </Text>
            </View>
          )}
        />

        {/* Song Lyrics Preview Modal */}
        {adminSelectedSong && (
          <Modal visible animationType="slide" transparent onRequestClose={() => setAdminSelectedSong(null)}>
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
              <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 25, borderTopRightRadius: 25, height: '85%', padding: 20 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
                  borderBottomWidth: 0.5, borderColor: '#cbd5e1', paddingBottom: 14, marginBottom: 14 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 17, fontWeight: '900', color: '#0f172a' }} numberOfLines={2}>{adminSelectedSong.title}</Text>
                    <Text style={{ fontSize: 11, color: '#94a3b8', marginTop: 3, fontWeight: '700' }}>{adminSelectedSong.titleTe || ''}</Text>
                    <Text style={{ fontSize: 10, color: '#c0392b', fontWeight: '800', marginTop: 4 }}>{adminSelectedSong.category || 'Other'}</Text>
                  </View>
                  <TouchableOpacity
                    style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' }}
                    onPress={() => setAdminSelectedSong(null)}>
                    <X size={20} color="#475569" />
                  </TouchableOpacity>
                </View>
                <ScrollView showsVerticalScrollIndicator={false}>
                  <Text style={{ fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10, color: '#1a2d5a' }}>LYRICS & SCRIPTS · సాహిత్యం</Text>
                  <View style={{ borderRadius: 14, padding: 16, borderWidth: 0.5, borderColor: '#e2e8f0', backgroundColor: '#f8fafc' }}>
                    <Text style={{ fontSize: 13, lineHeight: 23, fontWeight: '500', fontStyle: 'italic', color: '#334155' }}>
                      {adminSelectedSong.lyrics || 'Lyrics are being updated by the administrator.'}
                    </Text>
                  </View>
                  <View style={{ height: 60 }} />
                </ScrollView>
              </View>
            </View>
          </Modal>
        )}
      </View>
    );
  };

  // ── POST SONG FORM UI ────────────────────────────
  const renderPostForm = () => (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>SONG DETAILS</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>SONG TITLE (ENGLISH) · ఆంగ్ల శీర్షిక *</Text>
          <TextInput style={styles.textInput} placeholder="E.g. Amazing Grace..."
            placeholderTextColor="#94a3b8" value={titleEn} onChangeText={setTitleEn} />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>SONG TITLE (TELUGU) · తెలుగు శీర్షిక</Text>
          <TextInput style={styles.textInput} placeholder="ఉదాహరణ: అద్భుతమైన కృప..."
            placeholderTextColor="#94a3b8" value={titleTe} onChangeText={setTitleTe} />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>YOUTUBE VIDEO LINK · యూట్యూబ్ లింక్</Text>
          <TextInput style={styles.textInput} placeholder="E.g. dQw4w9WgXcQ or https://youtu.be/..."
            placeholderTextColor="#94a3b8" value={youtubeId} onChangeText={setYoutubeId} />
        </View>

        {/* Artist */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>ARTIST / BAND (Optional)</Text>
          <TextInput style={styles.textInput} placeholder=""
            placeholderTextColor="#94a3b8" value={artist} onChangeText={setArtist} />
        </View>

        {/* Categories Multi-select */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>CATEGORIES (tap to select multiple)</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
            {CATEGORIES.map(cat => {
              const isThemeCat = cat === 'Theme Songs';
              const isSelected = categories.includes(cat);
              return (
                <TouchableOpacity
                  key={cat}
                  style={[{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1.5,
                    borderColor: isSelected ? (isThemeCat ? '#f59e0b' : '#1a2d5a') : '#e2e8f0',
                    backgroundColor: isSelected ? (isThemeCat ? '#fef3c7' : '#1a2d5a') : '#f8fafc' }]}
                  onPress={() => {
                    setCategories(prev =>
                      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
                    );
                  }}
                >
                  <Text style={{ fontSize: 11, fontWeight: '700',
                    color: isSelected ? (isThemeCat ? '#d97706' : '#fff') : '#64748b' }}>{cat}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <Text style={{ fontSize: 10, color: '#94a3b8', marginTop: 6, fontStyle: 'italic' }}>
            ⭐ Select "Theme Songs" to make this song appear in the Member Theme Songs tab.
          </Text>
        </View>



        <View style={styles.inputGroup}>
          <Text style={styles.label}>SONG LYRICS & SCRIPTS · సాహిత్యం *</Text>
          <TextInput
            style={[styles.textInput, { height: 200, textAlignVertical: 'top', paddingTop: 12 }]}
            placeholder={`Verse 1:\nAmazing grace! How sweet the sound...\n\nChorus:\nMy chains are gone, I've been set free...`}
            placeholderTextColor="#94a3b8" multiline value={lyrics} onChangeText={setLyrics}
          />
        </View>

        <View style={styles.statusSelectRow}>
          <Text style={styles.statusLabel}>Publish Status</Text>
          <View style={styles.statusBtnGroup}>
            <TouchableOpacity style={[styles.statusBtn, status === 'Published' && styles.statusBtnActive]}
              onPress={() => setStatus('Published')}>
              <Text style={[styles.statusBtnTxt, status === 'Published' && styles.statusBtnTxtActive]}>Published</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.statusBtn, status === 'Draft' && styles.statusBtnActiveDraft]}
              onPress={() => setStatus('Draft')}>
              <Text style={[styles.statusBtnTxt, status === 'Draft' && styles.statusBtnTxtActive]}>Draft</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>


      <TouchableOpacity style={[styles.saveBtn, submitting && { backgroundColor: '#94a3b8' }]}
        onPress={handlePublishSong} disabled={submitting}>
        {submitting
          ? <ActivityIndicator size="small" color="#fff" />
          : <><Save size={18} color="#fff" /><Text style={styles.saveBtnTxt}>Publish Song Lyrics</Text></>
        }
      </TouchableOpacity>
      <View style={{ height: 60 }} />
    </ScrollView>
  );

  const renderPostModal = () => (
    <Modal transparent animationType="slide" visible={showPostModal} onRequestClose={() => setShowPostModal(false)}>
      <View style={styles.editModalBg}>
        <View style={styles.editModalCard}>
          <View style={styles.editModalHeader}>
            <Text style={styles.editModalTitle}>Publish New Song</Text>
            <TouchableOpacity style={styles.editCloseBtn} onPress={() => setShowPostModal(false)}>
              <X size={20} color="#64748B" />
            </TouchableOpacity>
          </View>
          {renderPostForm()}
        </View>
      </View>
    </Modal>
  );

  // ── POSTED SONGS LIST UI ─────────────────────────
  const renderPostedList = () => (
    <View style={{ flex: 1 }}>
      {loadingList ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#c0392b" />
        </View>
      ) : (
        <FlatList
          data={postedSongs.filter(s => {
            // Text Search filter
            const q = listSearchQuery.toLowerCase();
            const matchesSearch = !q || s.title.toLowerCase().includes(q) || (s.titleTe && s.titleTe.toLowerCase().includes(q));
            if (!matchesSearch) return false;

            const cats = (s.category || 'Other').split(';').map(c => c.trim()).filter(Boolean);
            
            // Theme Songs Tab filter
            if (screenTab === 'theme' && !cats.includes('Theme Songs')) return false;

            // Category Ribbon filter
            if (selectedCategory !== 'All' && !cats.includes(selectedCategory)) return false;

            return true;
          })}
          keyExtractor={(item) => item.id}
          renderItem={renderSongItem}
          contentContainerStyle={{ padding: 16, paddingBottom: 60 }}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={() => (
            <>
              <View style={styles.listHeaderRow}>
                <Text style={styles.listHeaderTitle}>{screenTab === 'theme' ? 'Theme Songs' : 'All Worship Songs'}</Text>
                <View style={styles.countBadge}>
                  <Text style={styles.countTxt}>{postedSongs.filter(s => screenTab !== 'theme' || (s.category || '').includes('Theme Songs')).length} Total</Text>
                </View>
              </View>
              <View style={{ marginBottom: 16 }}>
                <TextInput
                  style={styles.textInput}
                  placeholder="Search songs by title..."
                  placeholderTextColor="#94a3b8"
                  value={listSearchQuery}
                  onChangeText={setListSearchQuery}
                />
              </View>
            </>
          )}
          ListEmptyComponent={() => (
            <View style={{ padding: 40, alignItems: 'center' }}>
              <Music size={44} color="#cbd5e1" />
              <Text style={{ fontSize: 15, fontWeight: '800', color: '#1a2d5a', marginTop: 12 }}>No songs yet</Text>
              <Text style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>Post your first song using the "Post Song" tab.</Text>
            </View>
          )}
          refreshing={loadingList}
          onRefresh={fetchPostedSongs}
        />
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* ── Hero Section ── */}
      <View style={styles.hero}>
        <View style={[styles.heroTitleRow, { alignItems: 'center', width: '100%', gap: 16 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flexShrink: 1 }}>
            <TouchableOpacity onPress={() => setActiveTab(0)} style={{ flexDirection: 'row', alignItems: 'center' }}>
              <ChevronLeft size={20} color="#fff" style={{ marginLeft: -6, marginRight: 4 }} />
              <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>Back</Text>
            </TouchableOpacity>
            <Text style={[styles.heroTitle, { marginHorizontal: 12, opacity: 0.4 }]}>|</Text>
            <Text style={[styles.heroTitle, { flexShrink: 1 }]} numberOfLines={1}>Song Manager</Text>
          </View>
          <TouchableOpacity 
            style={styles.newBtn}
            onPress={() => setShowPostModal(true)}
          >
            <Plus size={16} color="#1a2d5a" />
            <Text style={styles.newBtnTxt}>New</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Screen Tabs */}
      <View style={styles.screenTabBar}>
        <TouchableOpacity
          style={[styles.screenTab, screenTab === 'list' && styles.screenTabActive]}
          onPress={() => { setScreenTab('list'); setSelectedCategory('All'); }}>
          <Text style={[styles.screenTabTxt, screenTab === 'list' && styles.screenTabTxtActive]}>All Songs</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.screenTab, screenTab === 'theme' && styles.screenTabActive]}
          onPress={() => { setScreenTab('theme'); setSelectedCategory('All'); }}>
          <Text style={[styles.screenTabTxt, screenTab === 'theme' && styles.screenTabTxtActive]}>Theme Songs</Text>
        </TouchableOpacity>
      </View>

      {/* Category Filter Ribbon */}
      <View style={{ marginBottom: 12 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}>
            {['All', ...CATEGORIES.filter(c => c !== 'Theme Songs')].map((cat) => (
              <TouchableOpacity
                key={cat}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 20,
                  backgroundColor: selectedCategory === cat ? '#1a2d5a' : '#fff',
                  borderWidth: 1,
                  borderColor: selectedCategory === cat ? '#1a2d5a' : '#cbd5e1',
                }}
                onPress={() => setSelectedCategory(cat)}
              >
                <Text style={{ fontSize: 13, fontWeight: '700', color: selectedCategory === cat ? '#fff' : '#64748b' }}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

      {/* Content */}
      {renderPostedList()}
      {renderPostModal()}

      {/* ── Category Picker Modal (kept but unused now – categories use inline chips) ── */}

      {/* ── Edit Song Modal ── */}
      {editingSong && (
        <Modal transparent animationType="slide" visible onRequestClose={() => setEditingSong(null)}>
          <View style={styles.editModalBg}>
            <View style={styles.editModalCard}>
              <View style={styles.editModalHeader}>
                <Text style={styles.editModalTitle}>Edit Song</Text>
                <TouchableOpacity onPress={() => setEditingSong(null)} style={styles.editCloseBtn}>
                  <X size={20} color="#475569" />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
                <View style={{ padding: 20 }}>
                  <Text style={styles.label}>TITLE (ENGLISH) *</Text>
                  <TextInput style={[styles.textInput, { marginBottom: 14 }]} value={editTitle}
                    onChangeText={setEditTitle} placeholder="Song title..." placeholderTextColor="#94a3b8" />

                  <Text style={styles.label}>TITLE (TELUGU)</Text>
                  <TextInput style={[styles.textInput, { marginBottom: 14 }]} value={editTitleTe}
                    onChangeText={setEditTitleTe} placeholder="తెలుగు శీర్షిక..." placeholderTextColor="#94a3b8" />

                  <Text style={styles.label}>ARTIST / BAND (Optional)</Text>
                  <TextInput style={[styles.textInput, { marginBottom: 14 }]} value={editArtist}
                    onChangeText={setEditArtist} placeholder="" placeholderTextColor="#94a3b8" />

                  {/* Edit Categories multi-select */}
                  <Text style={[styles.label, { marginBottom: 6 }]}>CATEGORIES (tap to toggle)</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
                    {CATEGORIES.map(cat => {
                      const isThemeCat = cat === 'Theme Songs';
                      const isSelected = editCategories.includes(cat);
                      return (
                        <TouchableOpacity
                          key={cat}
                          style={[{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1.5,
                            borderColor: isSelected ? (isThemeCat ? '#f59e0b' : '#1a2d5a') : '#e2e8f0',
                            backgroundColor: isSelected ? (isThemeCat ? '#fef3c7' : '#1a2d5a') : '#f8fafc' }]}
                          onPress={() => {
                            setEditCategories(prev =>
                              prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
                            );
                          }}
                        >
                          <Text style={{ fontSize: 11, fontWeight: '700',
                            color: isSelected ? (isThemeCat ? '#d97706' : '#fff') : '#64748b' }}>{cat}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                  <Text style={{ fontSize: 10, color: '#94a3b8', marginBottom: 14, fontStyle: 'italic' }}>
                    ⭐ Select "Theme Songs" to show this song in the Member Theme Songs tab.
                  </Text>



                  <Text style={styles.label}>YOUTUBE ID / LINK</Text>
                  <TextInput style={[styles.textInput, { marginBottom: 14 }]} value={editYoutubeId}
                    onChangeText={setEditYoutubeId} placeholder="YouTube ID..." placeholderTextColor="#94a3b8" />

                  <Text style={styles.label}>LYRICS *</Text>
                  <TextInput
                    style={[styles.textInput, { height: 180, textAlignVertical: 'top', paddingTop: 12, marginBottom: 20 }]}
                    value={editLyrics} onChangeText={setEditLyrics}
                    placeholder="Song lyrics..." placeholderTextColor="#94a3b8" multiline
                  />

                  <TouchableOpacity style={[styles.saveBtn, savingEdit && { backgroundColor: '#94a3b8' }]}
                    onPress={handleSaveEdit} disabled={savingEdit}>
                    {savingEdit
                      ? <ActivityIndicator size="small" color="#fff" />
                      : <><Save size={18} color="#fff" /><Text style={styles.saveBtnTxt}>Save Changes</Text></>
                    }
                  </TouchableOpacity>
                  <View style={{ height: 30 }} />
                </View>
              </ScrollView>
            </View>
          </View>

          {/* Edit Category Picker removed – using inline chips above */}
          {/* Edit Key Picker */}
          {showEditKeyPicker && (
            <Modal transparent animationType="fade" visible onRequestClose={() => setShowEditKeyPicker(false)}>
              <TouchableOpacity style={styles.modalOverlay} activeOpacity={1}
                onPress={() => setShowEditKeyPicker(false)}>
                <View style={styles.pickerModalBox}>
                  <Text style={styles.pickerModalTitle}>Select Key</Text>
                  <ScrollView>
                    {KEYS.map(k => (
                      <TouchableOpacity key={k} style={styles.pickerModalItem}
                        onPress={() => { setEditKey(k); setShowEditKeyPicker(false); }}>
                        <Text style={[styles.pickerModalTxt, editKey === k && { color: '#c0392b', fontWeight: '800' }]}>{k}</Text>
                        {editKey === k && <CheckCircle size={16} color="#c0392b" />}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </TouchableOpacity>
            </Modal>
          )}
        </Modal>
      )}

      {/* ── Success Modal ── */}
      {showSuccess && (
        <Modal transparent visible animationType="fade">
          <View style={styles.successBg}>
            <View style={styles.successCard}>
              <View style={styles.successIconOuter}>
                <View style={styles.successIconInner}>
                  <CheckCircle size={36} color="#fff" />
                </View>
              </View>
              <Text style={styles.successTitle}>Publication Successful!</Text>
              <Text style={styles.successDesc}>
                "{titleEn}" has been published under <Text style={{ fontWeight: '800', color: '#1a2d5a' }}>{categories[0] || 'Other'}</Text> and saved to the database!
              </Text>

              <TouchableOpacity style={styles.successActionBtn} onPress={() => { setShowSuccess(false); resetForm(); setActiveTab(0); }}>
                <Text style={styles.successActionTxt}>Back to Dashboard</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.successSecBtn} onPress={() => { setShowSuccess(false); resetForm(); }}>
                <Text style={styles.successSecTxt}>Post Another Song</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* ── Delete Confirmation Modal ── */}
      {songToDelete && (
        <Modal transparent animationType="fade" visible>
          <View style={styles.successBg}>
            <View style={styles.successCard}>
              <View style={[styles.successIconOuter, { backgroundColor: '#FEF2F2' }]}>
                <View style={[styles.successIconInner, { backgroundColor: '#DC2626' }]}>
                  <Trash2 size={28} color="#fff" />
                </View>
              </View>
              <Text style={styles.successTitle}>Delete Song?</Text>
              <Text style={styles.successDesc}>
                Are you sure you want to delete "{songToDelete.title}"? This action cannot be undone.
              </Text>
              <View style={{ flexDirection: 'row', gap: 10, width: '100%' }}>
                <TouchableOpacity style={[styles.successSecBtn, { flex: 1 }]} onPress={() => setSongToDelete(null)}>
                  <Text style={styles.successSecTxt}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.successActionBtn, { flex: 1, backgroundColor: '#DC2626', marginBottom: 0 }]} onPress={confirmDeleteSong}>
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
              <Text style={styles.toastTitle}>Song Deleted</Text>
              <Text style={styles.toastSub}>The song has been permanently removed.</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EDE8DC' },
  
  // Hero Section
  hero: {
    backgroundColor: '#1a2d5a',
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
    paddingHorizontal: 22,
    paddingTop: 10,
    paddingBottom: 24,
    marginBottom: 14,
  },
  heroTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  heroTitle: { color: '#fff', fontSize: 24, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', fontWeight: '600', letterSpacing: -0.5 },
  
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

  // Screen Tab Bar
  screenTabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 14,
    padding: 4,
    gap: 4,
    elevation: 2, shadowColor: '#1a2d5a', shadowOpacity: 0.05, shadowRadius: 5, borderWidth: 1, borderColor: 'rgba(26,45,90,0.05)'
  },
  screenTab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 10, gap: 6 },
  screenTabActive: { backgroundColor: '#1a2d5a' },
  screenTabTxt: { fontSize: 13, fontWeight: '700', color: '#64748B' },
  screenTabTxtActive: { color: '#fff' },

  scroll: { padding: 14 },
  
  // Cards
  card: { 
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 20,
    marginBottom: 16,
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
  sectionTitle: { fontSize: 12, fontWeight: '800', color: '#1a2d5a', letterSpacing: 1, marginBottom: 20 },

  inputGroup: { marginBottom: 16 },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  label: { fontSize: 11, fontWeight: '800', color: '#1a2d5a', marginBottom: 8, letterSpacing: 0.5 },
  textInput: {
    backgroundColor: '#FDFDFD', borderWidth: 1, borderColor: '#E5E7EB',
    borderRadius: 10, paddingHorizontal: 14, height: 48, fontSize: 13, color: '#1a2d5a', fontWeight: '600'
  },
  pickerBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FDFDFD', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, paddingHorizontal: 12, height: 48 },
  pickerTxt: { fontSize: 13, color: '#1a2d5a', fontWeight: '700', flex: 1 },

  statusSelectRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  statusLabel: { fontSize: 13, color: '#1a2d5a', fontWeight: '700' },
  statusBtnGroup: { flexDirection: 'row', gap: 8 },
  statusBtn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10, backgroundColor: '#F9F6F0', borderWidth: 1, borderColor: '#E2DDD5' },
  statusBtnActive: { backgroundColor: '#2E6B4F', borderColor: '#2E6B4F' },
  statusBtnActiveDraft: { backgroundColor: '#1a2d5a', borderColor: '#1a2d5a' },
  statusBtnTxt: { fontSize: 12, color: '#1a2d5a', fontWeight: '700' },
  statusBtnTxtActive: { color: '#fff' },

  infoBox: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#F0FDF4', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#A7F3D0', marginBottom: 20 },
  infoText: { flex: 1, fontSize: 11, color: '#065F46', lineHeight: 18, fontWeight: '600' },

  saveBtn: { backgroundColor: '#2E6B4F', height: 48, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, elevation: 4, shadowColor: '#1a2d5a', shadowOpacity: 0.2, shadowRadius: 5 },
  saveBtnTxt: { color: '#fff', fontSize: 14, fontWeight: '800', letterSpacing: 0.5 },

  // List
  listHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  listHeaderTitle: { fontSize: 16, fontWeight: '800', color: '#1a2d5a' },
  countBadge: { backgroundColor: '#E0E7FF', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  countTxt: { fontSize: 11, fontWeight: '800', color: '#3730A3' },
  songItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, elevation: 2, shadowColor: '#1a2d5a', shadowOpacity: 0.05, shadowRadius: 4, borderWidth: 1, borderColor: 'rgba(26,45,90,0.05)' },
  songIconBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  songItemTitle: { fontSize: 13, fontWeight: '800', color: '#1a2d5a' },
  songItemSub: { fontSize: 11, color: '#64748B', marginTop: 2, fontWeight: '600' },
  editBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center' },

  // Picker Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(26,45,90, 0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  pickerModalBox: { backgroundColor: '#fff', borderRadius: 16, width: '100%', maxWidth: 320, maxHeight: '65%', paddingVertical: 15, elevation: 10 },
  pickerModalTitle: { fontSize: 13, fontWeight: '800', color: '#1a2d5a', paddingHorizontal: 20, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', marginBottom: 5, letterSpacing: 0.5 },
  pickerModalItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
  pickerModalTxt: { fontSize: 15, color: '#1a2d5a', fontWeight: '600' },

  // Edit Modal
  editModalBg: { flex: 1, backgroundColor: 'rgba(26,45,90,0.5)', justifyContent: 'flex-end' },
  editModalCard: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 26, borderTopRightRadius: 26, height: height * 0.88 },
  editModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(26,45,90,0.08)' },
  editModalTitle: { fontSize: 18, fontWeight: '900', color: '#1a2d5a' },
  editCloseBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center' },

  // Success Modal
  successBg: { flex: 1, backgroundColor: 'rgba(26,45,90, 0.75)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  successCard: { backgroundColor: '#fff', borderRadius: 24, padding: 24, width: '100%', maxWidth: 400, alignItems: 'center', elevation: 10 },
  successIconOuter: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#F0FDF4', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  successIconInner: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#2E6B4F', justifyContent: 'center', alignItems: 'center' },
  successTitle: { fontSize: 20, fontWeight: '900', color: '#1a2d5a', marginBottom: 8, textAlign: 'center' },
  successDesc: { fontSize: 13, color: '#475569', textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  summaryBox: { backgroundColor: '#F8FAFC', borderRadius: 12, padding: 14, width: '100%', borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 20 },
  summaryLbl: { fontSize: 9, fontWeight: '800', color: '#64748B', letterSpacing: 0.5, marginBottom: 6 },
  receiptText: { fontSize: 11, color: '#1a2d5a', marginTop: 2, fontWeight: '600' },
  successActionBtn: { backgroundColor: '#1a2d5a', height: 48, borderRadius: 12, width: '100%', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  successActionTxt: { color: '#fff', fontSize: 13, fontWeight: '800' },
  successSecBtn: { height: 48, borderRadius: 12, width: '100%', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#F8FAFC' },
  successSecTxt: { color: '#1a2d5a', fontSize: 13, fontWeight: '800' },

  // Toast
  toastOverlay: { position: 'absolute', bottom: 40, left: 0, right: 0, alignItems: 'center' },
  toastCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, paddingRight: 24, flexDirection: 'row', alignItems: 'center', gap: 14, shadowColor: '#1a2d5a', shadowOpacity: 0.15, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 6, borderWidth: 1, borderColor: 'rgba(26,45,90,0.05)' },
  toastIconBox: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FEF2F2', justifyContent: 'center', alignItems: 'center' },
  toastTitle: { fontSize: 14, fontWeight: '800', color: '#1a2d5a' },
  toastSub: { fontSize: 11, color: '#6B7280', marginTop: 2, fontWeight: '500' }
});

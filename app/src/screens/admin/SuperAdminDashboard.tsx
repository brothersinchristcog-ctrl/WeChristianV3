import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator, Modal, TextInput, Platform, Image, ScrollView, Linking } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import ChurchService, { ChurchDetails } from '../../services/ChurchService';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Plus, Shield, X, Image as ImageIcon, Search, Mail, Phone, Settings, Check, UploadCloud, ChevronLeft, Save, FileText, Music, Pencil } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import SuperAdminChurchManager from './SuperAdminChurchManager';
import { AdminTabContext } from '../../context/AdminTabContext';

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

const ALPHABET = ['All', ...Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i))];

export default function SuperAdminDashboard({ navigation }: any) {
  const { setTabByName } = React.useContext(AdminTabContext);
  const insets = useSafeAreaInsets();
  const { member, isPlatformSuperAdmin } = useAuth();
  const [churches, setChurches] = useState<ChurchDetails[]>([]);
  const [masterSongs, setMasterSongs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState<'churches' | 'songs'>('churches');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [selectedSongs, setSelectedSongs] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedLetter, setSelectedLetter] = useState<string>('All');
  
  // Bulk Upload Modal
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkFile, setBulkFile] = useState<any>(null);

  // Add Single Song Modal
  const [showAddSongModal, setShowAddSongModal] = useState(false);
  const [newSong, setNewSong] = useState<{ title: string, titleTe: string, lyrics: string, category: string[] }>({ title: '', titleTe: '', lyrics: '', category: ['Stuthi Songs'] });
  const [addingSong, setAddingSong] = useState(false);
  
  // Edit Single Song Modal
  const [editingSong, setEditingSong] = useState<any>(null);
  const [updatingSong, setUpdatingSong] = useState(false);
  
  // Success Modal
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Manager Modal
  const [managerVisible, setManagerVisible] = useState(false);
  const [selectedChurchId, setSelectedChurchId] = useState<string | null>(null);

  // Create Modal states
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', tagline: '', subdomain: '', logoUrl: '' });
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!isPlatformSuperAdmin) {
      Alert.alert('Access Denied', 'You do not have permission to view this screen.');
      navigation.navigate('Dashboard');
    }
  }, [isPlatformSuperAdmin]);

  const fetchChurches = async () => {
    setLoading(true);
    const data = await ChurchService.getAllChurches();
    setChurches(data);
    setLoading(false);
  };

  const fetchMasterSongs = async (forceRefresh = false) => {
    setLoading(true);
    try {
      const ref = firestore().collection('masterSongs').orderBy('title');

      const loadFromSource = async (source: 'cache' | 'server') => {
        const snap = await ref.get({ source });
        const songs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        if (source === 'cache' && songs.length > 0) {
          setMasterSongs(songs);
          setLoading(false);
        } else if (source === 'server') {
          setMasterSongs(songs);
        }
        return songs;
      };

      if (!forceRefresh) {
        try {
          const cached = await loadFromSource('cache');
          if (cached.length === 0) throw new Error('Empty cache');
          
          // Keep cache warm
          loadFromSource('server').catch(() => {});
        } catch (e) {
          await loadFromSource('server');
        }
      } else {
        await loadFromSource('server');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'churches') {
      fetchChurches();
    } else {
      fetchMasterSongs();
    }
  }, [activeTab]);

  // --- Church Logic ---
  const handleManage = (churchId: string) => {
    setSelectedChurchId(churchId);
    setManagerVisible(true);
  };

  // --- Song Logic ---
  const handleAddSingleSong = async () => {
    if (!newSong.title.trim() || !newSong.lyrics.trim()) {
      Alert.alert('Error', 'Title and Lyrics are required');
      return;
    }
    setAddingSong(true);
    try {
      const ref = firestore().collection('masterSongs').doc();
      await ref.set({
        ...newSong,
        category: newSong.category.join(';') || 'Other',
        isDefault: true,
        createdAt: new Date().toISOString()
      });
      setSuccessMessage('Song added successfully!');
      setShowAddSongModal(false);
      setNewSong({ title: '', titleTe: '', lyrics: '', category: ['Stuthi Songs'] });
      fetchMasterSongs();
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to add song');
    } finally {
      setAddingSong(false);
    }
  };

  const handleUpdateSingleSong = async () => {
    if (!editingSong.title.trim() || !editingSong.lyrics.trim()) {
      Alert.alert('Error', 'Title and Lyrics are required');
      return;
    }
    setUpdatingSong(true);
    try {
      const ref = firestore().collection('masterSongs').doc(editingSong.id);
      await ref.update({
        ...editingSong,
        category: editingSong.category.join(';') || 'Other',
        updatedAt: new Date().toISOString()
      });
      setSuccessMessage('Song updated successfully!');
      setEditingSong(null);
      fetchMasterSongs();
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to update song');
    } finally {
      setUpdatingSong(false);
    }
  };

  const pickBulkFile = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({ type: ['application/json', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv', '*/*'] });
      if (!res.canceled && res.assets && res.assets.length > 0) {
        setBulkFile(res.assets[0]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const processBulkUpload = async () => {
    if (!bulkFile) return;
    setLoading(true);
    try {
      const fileUri = bulkFile.uri;
      let fileStr = '';
      if (Platform.OS === 'web') {
        const response = await fetch(fileUri);
        fileStr = await response.text();
      } else {
        fileStr = await FileSystem.readAsStringAsync(fileUri);
      }
      
      const data = JSON.parse(fileStr);
      if (!Array.isArray(data)) {
        Alert.alert('Error', 'JSON must be an array of songs');
        setLoading(false);
        return;
      }

      const batch = firestore().batch();
      let count = 0;
      data.forEach((song: any) => {
        if (song.title) {
          const ref = firestore().collection('masterSongs').doc();
          batch.set(ref, {
            ...song,
            isDefault: true,
            createdAt: new Date().toISOString()
          });
          count++;
        }
      });
      
      await batch.commit();
      setSuccessMessage(`Uploaded ${count} songs successfully!`);
      setShowBulkModal(false);
      setBulkFile(null);
      fetchMasterSongs();
    } catch (e) {
      Alert.alert('Error', 'Failed to upload songs. Ensure it is a valid JSON file.');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = async (type: 'json' | 'csv') => {
    try {
      let content = '';
      let filename = `wechristian_songs_template.${type}`;
      let mimeType = '';
      
      if (type === 'json') {
        content = JSON.stringify([{
          title: "Sample Song Title",
          titleTe: "నమూనా పాట (Optional)",
          category: "Stuthi Songs",
          lyrics: "Line 1 of lyrics\nLine 2 of lyrics"
        }], null, 2);
        mimeType = 'application/json';
      } else if (type === 'csv') {
        content = `title,titleTe,category,lyrics\nSample Song Title,నమూనా పాట (Optional),Stuthi Songs,"Line 1 of lyrics\nLine 2 of lyrics"`;
        mimeType = 'text/csv';
      }

      const fileUri = `${FileSystem.cacheDirectory}${filename}`;
      await FileSystem.writeAsStringAsync(fileUri, content, { encoding: FileSystem.EncodingType.UTF8 });
      
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(fileUri, { mimeType, dialogTitle: `Download ${type.toUpperCase()} Template` });
      } else {
        Alert.alert('Notice', 'Sharing is not available on this device.');
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Could not create template file');
    }
  };

  const toggleSongSelect = (id: string) => {
    const next = new Set(selectedSongs);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedSongs(next);
    if (next.size === 0) setIsSelectionMode(false);
  };

  const handleBulkDelete = async () => {
    if (selectedSongs.size === 0) return;
    Alert.alert('Confirm', `Delete ${selectedSongs.size} songs?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
          setLoading(true);
          const batch = firestore().batch();
          selectedSongs.forEach(id => {
            const ref = firestore().collection('masterSongs').doc(id);
            batch.delete(ref);
          });
          await batch.commit();
          setSelectedSongs(new Set());
          fetchMasterSongs();
      }}
    ]);
  };

  // --- Renderers ---
  const query = (searchQuery || '').toLowerCase().trim();

  const filteredChurches = churches.filter(c => 
    (c.name || '').toLowerCase().includes(query) || 
    (c.subdomain || '').toLowerCase().includes(query)
  );

  const masterSongsWithIndex = masterSongs.map((s, index) => ({ ...s, absoluteIndex: index }));
  const filteredSongs = masterSongsWithIndex.filter((s) => {
    const songNumberStr = (s.absoluteIndex + 1).toString();
    
    if (selectedLetter !== 'All') {
      const titleChar = (s.title || '').trim().charAt(0).toUpperCase();
      if (titleChar !== selectedLetter) return false;
    }

    if (!query) return true;

    return (s.title || '').toLowerCase().includes(query) ||
           (s.titleTe || '').includes(query) ||
           songNumberStr.includes(query);
  });
  const renderListHeader = () => (
    <View style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
           <TouchableOpacity onPress={() => {
             if (navigation.canGoBack()) {
               navigation.goBack();
             } else if (setTabByName) {
               setTabByName('Dashboard');
             }
           }} style={{ marginRight: 8 }}>
            <ChevronLeft size={28} color="#f4f6fb" />
          </TouchableOpacity>
          <LinearGradient colors={['#f0b429', '#b8860b']} style={styles.headerEmblem}>
            <Shield size={17} color="#1a1200" />
          </LinearGradient>
          <Text style={styles.headerTitle}>Platform Admin</Text>
        </View>
      </View>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity style={[styles.tab, activeTab === 'churches' && styles.tabActive]} onPress={() => setActiveTab('churches')}>
          <Text style={[styles.tabText, activeTab === 'churches' && styles.tabTextActive]}>All Churches</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'songs' && styles.tabActive]} onPress={() => setActiveTab('songs')}>
          <Text style={[styles.tabText, activeTab === 'songs' && styles.tabTextActive]}>Master Songs</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchBar}>
        <Search size={18} color="#64748b" />
        <TextInput 
          style={[styles.searchInput, { flex: 1 }]}
          placeholder={activeTab === 'churches' ? "Search churches..." : "Search master songs..."}
          placeholderTextColor="#64748b"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} style={{ padding: 4 }}>
            <X size={16} color="#94a3b8" />
          </TouchableOpacity>
        )}
      </View>

      {activeTab === 'churches' && (
        <Text style={styles.listCountText}>{filteredChurches.length} churches</Text>
      )}
      {activeTab === 'songs' && (
        <View style={styles.actionRow}>
          <TouchableOpacity style={[styles.btnAction, styles.btnPrimary]} onPress={() => setShowAddSongModal(true)}>
            <Text style={styles.btnPrimaryText}>Add Single Song</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnAction} onPress={() => setShowBulkModal(true)}>
            <UploadCloud size={16} color="#f8fafc" style={{ marginRight: 6 }} />
            <Text style={styles.btnActionText}>Bulk Upload</Text>
          </TouchableOpacity>
        </View>
      )}

      {activeTab === 'songs' && (
        <View style={{ marginHorizontal: 20, marginBottom: 12 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 20, gap: 8 }}>
            {ALPHABET.map(letter => {
              const isSelected = selectedLetter === letter;
              return (
                <TouchableOpacity
                  key={letter}
                  onPress={() => setSelectedLetter(letter)}
                  style={{
                    paddingHorizontal: letter === 'All' ? 16 : 12,
                    paddingVertical: 8,
                    borderRadius: 20,
                    backgroundColor: isSelected ? '#f0b429' : '#1e293b',
                    borderWidth: 1,
                    borderColor: isSelected ? '#f0b429' : '#334155',
                  }}
                >
                  <Text style={{
                    color: isSelected ? '#1a1200' : '#94a3b8',
                    fontWeight: isSelected ? '700' : '500',
                    fontSize: 13
                  }}>{letter}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {activeTab === 'songs' && isSelectionMode && (
        <View style={{ flexDirection: 'row', paddingHorizontal: 20, marginBottom: 12, gap: 12 }}>
          <TouchableOpacity 
            style={{ flex: 1, backgroundColor: '#334155', paddingVertical: 12, borderRadius: 12, alignItems: 'center' }} 
            onPress={() => {
              setSelectedSongs(new Set());
              setIsSelectionMode(false);
            }}
          >
            <Text style={{ color: '#f8fafc', fontWeight: '600' }}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={{ flex: 1, backgroundColor: selectedSongs.size > 0 ? '#ef4444' : '#ef444450', paddingVertical: 12, borderRadius: 12, alignItems: 'center' }} 
            onPress={handleBulkDelete}
            disabled={selectedSongs.size === 0}
          >
            <Text style={{ color: '#ffffff', fontWeight: '700' }}>Delete ({selectedSongs.size})</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="light" backgroundColor="transparent" translucent={true} />
      <View style={styles.content}>
        {renderListHeader()}
        {loading ? (
          <ScrollView showsVerticalScrollIndicator={false}>
            <ActivityIndicator size="large" color="#FCD34D" style={{ marginTop: 40 }} />
          </ScrollView>
        ) : activeTab === 'churches' ? (
          <FlatList
            data={filteredChurches}
            keyExtractor={c => c.id}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const initials = item.name ? item.name.split(' ').map(w => w[0]).slice(0,2).join('').toUpperCase() : 'CH';
              return (
                <TouchableOpacity style={styles.churchCard} onPress={() => handleManage(item.id)} activeOpacity={0.7}>
                  <View style={styles.cardTop}>
                    <View style={styles.logoContainer}>
                      {item.theme?.logoUrl ? (
                        <Image source={{ uri: item.theme.logoUrl }} style={styles.churchLogoImg} />
                      ) : (
                        <LinearGradient colors={['#6366f1', '#4f46e5']} style={styles.avatarFallback}>
                          <Text style={styles.avatarText}>{initials}</Text>
                        </LinearGradient>
                      )}
                    </View>
                    <View style={styles.churchInfo}>
                      <Text style={styles.churchName}>{item.name}</Text>
                      <Text style={styles.churchDomain}>Code: {item.subdomain || 'N/A'}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.cardBottom}>
                    <View style={styles.membersCountRow}>
                      <View style={[styles.statusDot, { backgroundColor: item.subscription?.status === 'active' ? '#2fd480' : '#f4556b' }]} />
                      <Text style={styles.membersCount}>{item.memberCount || 0} Active Member{(item.memberCount || 0) !== 1 ? 's' : ''}</Text>
                    </View>
                    {item.subscription?.validUntil && (
                      <View style={styles.expiryRow}>
                        <Text style={styles.expiryText}>Expires: {new Date(item.subscription.validUntil).toLocaleDateString()}</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        ) : (
          <View style={styles.songsView}>
            <FlatList
              data={filteredSongs}
              keyExtractor={s => s.id}
              contentContainerStyle={styles.list}
              showsVerticalScrollIndicator={false}
              initialNumToRender={15}
              maxToRenderPerBatch={10}
              windowSize={5}
              removeClippedSubviews={true}
              renderItem={({ item }) => {
                const absoluteIndex = item.absoluteIndex;
                const isSelected = selectedSongs.has(item.id);
                return (
                  <TouchableOpacity
                    style={[styles.songItem, isSelected && styles.songItemActive]}
                    activeOpacity={0.8}
                    onLongPress={() => {
                      setIsSelectionMode(true);
                      toggleSongSelect(item.id);
                    }}
                    onPress={() => {
                      if (isSelectionMode) {
                        toggleSongSelect(item.id);
                      }
                    }}
                  >
                    {isSelectionMode && (
                      <View style={[styles.checkbox, isSelected && styles.checkboxActive]}>
                        {isSelected && <Check size={14} color="#0f172a" />}
                      </View>
                    )}
                    {!isSelectionMode && (
                      <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: '#1b2340', justifyContent: 'center', alignItems: 'center', marginRight: 12, borderWidth: 1, borderColor: '#242e50' }}>
                        <Text style={{ color: '#f4f6fb', fontSize: 13, fontWeight: '700' }}>{absoluteIndex + 1}</Text>
                      </View>
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={styles.songTitle}>{item.title}</Text>
                      <Text style={styles.songSubtitle}>{item.category || 'Stuthi Songs'} • {item.titleTe}</Text>
                    </View>
                    {!isSelectionMode && (
                      <TouchableOpacity onPress={() => {
                         const catArr = (item.category || 'Stuthi Songs').split(';').map((c: string) => c.trim());
                         setEditingSong({ ...item, category: catArr });
                      }} style={{ padding: 8, marginLeft: 8, backgroundColor: '#1b2340', borderRadius: 8, borderWidth: 1, borderColor: '#242e50' }}>
                        <Pencil size={14} color="#94a1c4" />
                      </TouchableOpacity>
                    )}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        )}
      </View>

      <Modal transparent visible={showBulkModal} animationType="fade" onRequestClose={() => setShowBulkModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.bulkModalCard}>
            <View style={styles.bulkModalHeader}>
              <Text style={styles.bulkModalTitle}>Bulk upload songs</Text>
              <TouchableOpacity style={styles.bulkCloseBtn} onPress={() => setShowBulkModal(false)}>
                <X size={16} color="#94a3b8" />
              </TouchableOpacity>
            </View>
            <View style={styles.bulkUploadArea}>
              <TouchableOpacity style={styles.uploadBox} onPress={pickBulkFile}>
                <UploadCloud size={24} color="#94a3b8" style={{ marginBottom: 12 }} />
                <Text style={styles.uploadBoxText}>
                  <Text style={{ color: '#f0b429', fontWeight: '700' }}>Choose a file</Text> or drag it here
                </Text>
                <Text style={styles.uploadBoxSubtext}>Supports .json, .xlsx, .csv</Text>
                {bulkFile && (
                  <View style={styles.selectedFileBox}>
                    <Text style={styles.selectedFileName} numberOfLines={1}>{bulkFile.name}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 16, marginBottom: 20 }}>
              <TouchableOpacity onPress={() => downloadTemplate('json')} style={{ flexDirection: 'row', alignItems: 'center', padding: 8, backgroundColor: '#3b82f620', borderRadius: 8, borderWidth: 1, borderColor: '#3b82f640' }}>
                <FileText size={14} color="#60a5fa" />
                <Text style={{ color: '#60a5fa', fontSize: 13, marginLeft: 6, fontWeight: '600' }}>JSON Template</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => downloadTemplate('csv')} style={{ flexDirection: 'row', alignItems: 'center', padding: 8, backgroundColor: '#10b98120', borderRadius: 8, borderWidth: 1, borderColor: '#10b98140' }}>
                <FileText size={14} color="#34d399" />
                <Text style={{ color: '#34d399', fontSize: 13, marginLeft: 6, fontWeight: '600' }}>CSV Template</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.bulkModalFooter}>
              <TouchableOpacity style={styles.bulkBtnCancel} onPress={() => setShowBulkModal(false)}>
                <Text style={styles.bulkBtnCancelTxt}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.bulkBtnUpload, !bulkFile && { opacity: 0.5 }]} disabled={!bulkFile} onPress={processBulkUpload}>
                <Text style={styles.bulkBtnUploadTxt}>Upload & process</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal transparent visible={showAddSongModal} animationType="slide" onRequestClose={() => setShowAddSongModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.addSongModalCard}>
            <View style={styles.bulkModalHeader}>
              <Text style={styles.bulkModalTitle}>Add Single Song</Text>
              <TouchableOpacity style={styles.bulkCloseBtn} onPress={() => setShowAddSongModal(false)}>
                <X size={16} color="#94a3b8" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ padding: 20 }}>
              <Text style={styles.inputLabel}>Song Title (English) *</Text>
              <TextInput style={styles.textInput} placeholder="Title in English" placeholderTextColor="#94a3b8" value={newSong.title} onChangeText={t => setNewSong({...newSong, title: t})} />
              
              <Text style={styles.inputLabel}>Song Title (Telugu)</Text>
              <TextInput style={styles.textInput} placeholder="తెలుగు శీర్షిక" placeholderTextColor="#94a3b8" value={newSong.titleTe} onChangeText={t => setNewSong({...newSong, titleTe: t})} />
              
              <Text style={styles.inputLabel}>CATEGORIES (tap to select multiple)</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
                {CATEGORIES.map(cat => {
                  const isThemeCat = cat === 'Theme Songs';
                  const isSelected = newSong.category.includes(cat);
                  return (
                    <TouchableOpacity
                      key={cat}
                      style={[{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1.5,
                        borderColor: isSelected ? (isThemeCat ? '#f59e0b' : '#3b82f6') : '#242e50',
                        backgroundColor: isSelected ? (isThemeCat ? '#fef3c7' : '#1e293b') : '#0f172a' }]}
                      onPress={() => {
                        setNewSong(prev => ({
                          ...prev,
                          category: prev.category.includes(cat)
                            ? prev.category.filter(c => c !== cat)
                            : [...prev.category, cat]
                        }));
                      }}
                    >
                      <Text style={{ fontSize: 11, fontWeight: '700',
                        color: isSelected ? (isThemeCat ? '#d97706' : '#60a5fa') : '#94a1c4' }}>{cat}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              
              <Text style={styles.inputLabel}>Lyrics *</Text>
              <TextInput style={[styles.textInput, { height: 300, textAlignVertical: 'top' }]} multiline placeholder="Song Lyrics" placeholderTextColor="#94a3b8" value={newSong.lyrics} onChangeText={t => setNewSong({...newSong, lyrics: t})} />
            
              <TouchableOpacity style={styles.saveSongBtn} onPress={handleAddSingleSong} disabled={addingSong}>
                {addingSong ? <ActivityIndicator size="small" color="#1a1200" /> : <Text style={styles.saveSongBtnTxt}>Save Song</Text>}
              </TouchableOpacity>
              <View style={{ height: 40 }}/>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal transparent visible={!!editingSong} animationType="slide" onRequestClose={() => setEditingSong(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.addSongModalCard}>
            <View style={styles.bulkModalHeader}>
              <Text style={styles.bulkModalTitle}>Edit Single Song</Text>
              <TouchableOpacity style={styles.bulkCloseBtn} onPress={() => setEditingSong(null)}>
                <X size={16} color="#94a3b8" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ padding: 20 }}>
              <Text style={styles.inputLabel}>Song Title (English) *</Text>
              <TextInput style={styles.textInput} placeholder="Title in English" placeholderTextColor="#94a3b8" value={editingSong?.title} onChangeText={t => setEditingSong({...editingSong, title: t})} />
              
              <Text style={styles.inputLabel}>Song Title (Telugu)</Text>
              <TextInput style={styles.textInput} placeholder="తెలుగు శీర్షిక" placeholderTextColor="#94a3b8" value={editingSong?.titleTe} onChangeText={t => setEditingSong({...editingSong, titleTe: t})} />
              
              <Text style={styles.inputLabel}>CATEGORIES (tap to select multiple)</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
                {CATEGORIES.map(cat => {
                  const isThemeCat = cat === 'Theme Songs';
                  const isSelected = editingSong?.category?.includes(cat);
                  return (
                    <TouchableOpacity
                      key={cat}
                      style={[{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1.5,
                        borderColor: isSelected ? (isThemeCat ? '#f59e0b' : '#3b82f6') : '#242e50',
                        backgroundColor: isSelected ? (isThemeCat ? '#fef3c7' : '#1e293b') : '#0f172a' }]}
                      onPress={() => {
                        setEditingSong((prev: any) => ({
                          ...prev,
                          category: prev.category.includes(cat)
                            ? prev.category.filter((c: string) => c !== cat)
                            : [...prev.category, cat]
                        }));
                      }}
                    >
                      <Text style={{ fontSize: 11, fontWeight: '700',
                        color: isSelected ? (isThemeCat ? '#d97706' : '#60a5fa') : '#94a1c4' }}>{cat}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              
              <Text style={styles.inputLabel}>Lyrics *</Text>
              <TextInput style={[styles.textInput, { height: 300, textAlignVertical: 'top' }]} multiline placeholder="Song Lyrics" placeholderTextColor="#94a3b8" value={editingSong?.lyrics} onChangeText={t => setEditingSong({...editingSong, lyrics: t})} />
            
              <TouchableOpacity style={styles.saveSongBtn} onPress={handleUpdateSingleSong} disabled={updatingSong}>
                {updatingSong ? <ActivityIndicator size="small" color="#1a1200" /> : <Text style={styles.saveSongBtnTxt}>Update Song</Text>}
              </TouchableOpacity>
              <View style={{ height: 40 }}/>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <SuperAdminChurchManager 
        visible={managerVisible} 
        onClose={() => setManagerVisible(false)} 
        churchId={selectedChurchId}
        onUpdated={fetchChurches}
      />

      <Modal transparent visible={!!successMessage} animationType="fade" onRequestClose={() => setSuccessMessage(null)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ width: '100%', maxWidth: 340, backgroundColor: '#1e293b', borderRadius: 24, padding: 32, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10, borderWidth: 1, borderColor: '#334155' }}>
            <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: '#10b98120', justifyContent: 'center', alignItems: 'center', marginBottom: 24, borderWidth: 2, borderColor: '#10b981' }}>
              <Check size={36} color="#10b981" />
            </View>
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#f8fafc', marginBottom: 12, textAlign: 'center' }}>Awesome!</Text>
            <Text style={{ fontSize: 15, color: '#94a3b8', textAlign: 'center', marginBottom: 32, lineHeight: 22 }}>{successMessage}</Text>
            <TouchableOpacity onPress={() => setSuccessMessage(null)} style={{ backgroundColor: '#3b82f6', width: '100%', paddingVertical: 16, borderRadius: 16, alignItems: 'center' }}>
              <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '700' }}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0f1e' },
  header: {
    paddingVertical: 16, 
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerEmblem: { 
    width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#f0b429', shadowOpacity: 0.5, shadowRadius: 10, shadowOffset: { width: 0, height: 0 }, elevation: 8 
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  
  tabBar: { flexDirection: 'row', backgroundColor: '#0a0f1e', marginHorizontal: -16, paddingHorizontal: 16, marginBottom: 16, borderBottomWidth: 1, borderBottomColor: '#242e50' },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: '#f0b429' },
  tabText: { color: '#5c6890', fontSize: 14, fontWeight: '700' },
  tabTextActive: { color: '#f0b429' },

  content: { flex: 1, padding: 16, backgroundColor: '#0a0f1e' },
  
  searchBar: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#1e293b'
  },
  searchInput: { flex: 1, fontSize: 15, color: '#f4f6fb' },
  
  list: { paddingBottom: 40 },
  
  churchCard: {
    backgroundColor: '#141b30',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: '#3b4b72'
  },
  cardTop: { flexDirection: 'row', gap: 14, alignItems: 'center', marginBottom: 12 },
  logoContainer: { 
    width: 44, height: 44, borderRadius: 12, backgroundColor: '#1b2340',
    justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#242e50',
    overflow: 'hidden'
  },
  churchLogoImg: { width: '100%', height: '100%' },
  avatarFallback: { flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 16, fontWeight: '800', color: '#050813', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  churchInfo: { flex: 1 },
  churchName: { fontSize: 16, fontWeight: '800', color: '#f4f6fb', marginBottom: 4 },
  churchDomain: { fontSize: 12, color: '#94a1c4' },
  
  listCountText: { fontSize: 13, fontWeight: '700', color: '#5c6890', marginBottom: 12, marginLeft: 4 },
  
  cardMiddle: { backgroundColor: '#1b2340', borderRadius: 10, padding: 12, marginBottom: 16, gap: 8 },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  contactLink: { color: '#8fb4ff', fontSize: 13, fontWeight: '500' },
  
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTopWidth: 1, borderTopColor: '#242e50' },
  membersCountRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot: { width: 7, height: 7, borderRadius: 3.5 },
  membersCount: { fontSize: 13, color: '#94a1c4', fontWeight: '600' },
  expiryRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#242e50', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  expiryText: { fontSize: 11, color: '#f0b429', fontWeight: '700' },
  btnManage: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 9, gap: 6 },
  btnManageText: { color: '#1a1200', fontSize: 13, fontWeight: '700' },
  
  songsView: { flex: 1 },
  actionRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  btnAction: { flex: 1, flexDirection: 'row', justifyContent: 'center', backgroundColor: '#141b30', borderWidth: 1, borderColor: '#242e50', padding: 11, borderRadius: 10, alignItems: 'center' },
  btnPrimary: { backgroundColor: '#f0b429', borderWidth: 0 },
  btnActionText: { fontSize: 13, fontWeight: '700', color: '#f4f6fb' },
  btnPrimaryText: { fontSize: 13, fontWeight: '800', color: '#1a1200' },
  
  btnBulkDelete: { backgroundColor: 'rgba(244,85,107,.12)', borderWidth: 1, borderColor: 'rgba(244,85,107,.3)', padding: 12, borderRadius: 10, alignItems: 'center', marginBottom: 20 },
  btnBulkDeleteTxt: { color: '#f4556b', fontWeight: '700', fontSize: 14 },
  
  songItem: { 
    backgroundColor: '#141b30', borderRadius: 14, padding: 14, marginBottom: 10, 
    flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1, borderColor: '#242e50' 
  },
  checkbox: { width: 21, height: 21, borderWidth: 2, borderColor: '#232c4d', borderRadius: 7, backgroundColor: '#141b30', justifyContent: 'center', alignItems: 'center' },
  checkboxActive: { backgroundColor: '#f0b429', borderColor: '#f0b429' },
  songTitle: { fontSize: 15, fontWeight: '700', color: '#f4f6fb', marginBottom: 4 },
  songSubtitle: { fontSize: 12, color: '#94a1c4' },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(5, 8, 19, 0.85)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  bulkModalCard: { backgroundColor: '#141b30', width: '100%', maxWidth: 400, borderRadius: 16, borderWidth: 1, borderColor: '#242e50', overflow: 'hidden' },
  addSongModalCard: { backgroundColor: '#141b30', width: '100%', maxHeight: '80%', borderRadius: 16, borderWidth: 1, borderColor: '#242e50', overflow: 'hidden' },
  bulkModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#242e50' },
  bulkModalTitle: { color: '#fff', fontSize: 18, fontWeight: '700', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  bulkCloseBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#1b2340', justifyContent: 'center', alignItems: 'center' },
  bulkUploadArea: { padding: 20 },
  uploadBox: { borderWidth: 1, borderColor: '#242e50', borderStyle: 'dashed', borderRadius: 12, padding: 30, alignItems: 'center', backgroundColor: '#0f172a' },
  uploadBoxText: { color: '#94a3b8', fontSize: 15, marginBottom: 8 },
  uploadBoxSubtext: { color: '#64748b', fontSize: 13 },
  selectedFileBox: { marginTop: 16, backgroundColor: '#1b2340', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#242e50', width: '100%' },
  selectedFileName: { color: '#f4f6fb', fontSize: 13, fontWeight: '600', textAlign: 'center' },
  bulkModalFooter: { flexDirection: 'row', gap: 12, padding: 20, borderTopWidth: 1, borderTopColor: '#242e50', backgroundColor: '#0f172a' },
  bulkBtnCancel: { flex: 1, paddingVertical: 14, borderRadius: 10, backgroundColor: '#1b2340', alignItems: 'center', justifyContent: 'center' },
  bulkBtnCancelTxt: { color: '#f4f6fb', fontSize: 15, fontWeight: '700' },
  bulkBtnUpload: { flex: 1.5, paddingVertical: 14, borderRadius: 10, backgroundColor: '#f0b429', alignItems: 'center', justifyContent: 'center' },
  bulkBtnUploadTxt: { color: '#1a1200', fontSize: 15, fontWeight: '700' },
  
  inputLabel: { color: '#94a1c4', fontSize: 13, fontWeight: '700', marginBottom: 8, marginTop: 16 },
  textInput: { backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#242e50', borderRadius: 10, padding: 14, color: '#f4f6fb', fontSize: 15 },
  saveSongBtn: { backgroundColor: '#f0b429', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 30 },
  saveSongBtnTxt: { color: '#1a1200', fontSize: 16, fontWeight: '800' },
  
  songItemActive: { borderColor: '#f0b429', backgroundColor: 'rgba(240, 180, 41, 0.05)' }
});

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator, Modal, TextInput, Platform, Image, ScrollView, Linking } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import ChurchService, { ChurchDetails } from '../../services/ChurchService';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Plus, Shield, X, Image as ImageIcon, Search, Mail, Phone, Settings, Check, UploadCloud, ChevronLeft } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as DocumentPicker from 'expo-document-picker';
import SuperAdminChurchManager from './SuperAdminChurchManager';
import { AdminTabContext } from '../../context/AdminTabContext';

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

  const fetchMasterSongs = async () => {
    setLoading(true);
    try {
      const snap = await firestore().collection('masterSongs').orderBy('title').get();
      setMasterSongs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
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
  const handleBulkUpload = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({ type: 'application/json' });
      if (!res.canceled && res.assets && res.assets.length > 0) {
        setLoading(true);
        const fileUri = res.assets[0].uri;
        
        let fileStr = '';
        if (Platform.OS === 'web') {
          // fetch for web (if applicable)
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
        Alert.alert('Success', `Uploaded ${count} songs successfully!`);
        fetchMasterSongs();
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to upload songs. Ensure it is a valid JSON file.');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const toggleSongSelect = (id: string) => {
    const next = new Set(selectedSongs);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedSongs(next);
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

  const filteredSongs = masterSongs.filter(s => 
    (s.title || '').toLowerCase().includes(query) ||
    (s.titleTe || '').includes(query)
  );
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
          <TouchableOpacity style={[styles.btnAction, styles.btnPrimary]}>
            <Text style={styles.btnPrimaryText}>Add Single Song</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnAction} onPress={handleBulkUpload}>
            <UploadCloud size={16} color="#f8fafc" style={{ marginRight: 6 }} />
            <Text style={styles.btnActionText}>Bulk Upload</Text>
          </TouchableOpacity>
        </View>
      )}
      {activeTab === 'songs' && selectedSongs.size > 0 && (
        <TouchableOpacity style={styles.btnBulkDelete} onPress={handleBulkDelete}>
          <Text style={styles.btnBulkDeleteTxt}>Delete Selected ({selectedSongs.size})</Text>
        </TouchableOpacity>
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
                    </View>
                  </View>
                  
                  <View style={styles.cardBottom}>
                    <View style={styles.membersCountRow}>
                      <View style={[styles.statusDot, { backgroundColor: item.subscription?.status === 'active' ? '#2fd480' : '#f4556b' }]} />
                      <Text style={styles.membersCount}>{item.memberCount || 0} Active Member{(item.memberCount || 0) !== 1 ? 's' : ''}</Text>
                    </View>
                    <TouchableOpacity onPress={() => handleManage(item.id)}>
                      <LinearGradient colors={['#f0b429', '#d9971f']} style={styles.btnManage}>
                        <Settings size={12} color="#1a1200" />
                        <Text style={styles.btnManageText}>Manage</Text>
                      </LinearGradient>
                    </TouchableOpacity>
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
              renderItem={({ item }) => {
                const isSelected = selectedSongs.has(item.id);
                return (
                  <View style={styles.songItem}>
                    <TouchableOpacity style={[styles.checkbox, isSelected && styles.checkboxActive]} onPress={() => toggleSongSelect(item.id)}>
                      {isSelected && <Check size={14} color="#0f172a" />}
                    </TouchableOpacity>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.songTitle}>{item.title}</Text>
                      <Text style={styles.songSubtitle}>{item.category || 'Stuthi Songs'} • {item.titleTe}</Text>
                    </View>
                  </View>
                );
              }}
            />
          </View>
        )}
      </View>

      <SuperAdminChurchManager 
        visible={managerVisible} 
        onClose={() => setManagerVisible(false)} 
        churchId={selectedChurchId}
        onUpdated={fetchChurches}
      />
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
  songSubtitle: { fontSize: 12, color: '#94a1c4' }
});

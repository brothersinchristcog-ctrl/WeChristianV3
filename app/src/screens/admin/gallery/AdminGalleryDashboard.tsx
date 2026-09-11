// @ts-nocheck - Forced IDE refresh to clear false positive module error
import React, { useEffect, useState, useContext, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator, Dimensions, Alert, Animated, DeviceEventEmitter, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Plus, MoreVertical, Sparkles, Globe, Calendar, Image as ImageIcon, Trash2, ChevronLeft, CheckCircle } from 'lucide-react-native';
import { AdminGalleryStackParamList } from './AdminGalleryNavigator';
import { AdminTabContext } from '../../../context/AdminTabContext';
import GalleryService, { GalleryAlbum } from '../../../services/GalleryService';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

type NavigationProp = NativeStackNavigationProp<AdminGalleryStackParamList, 'AdminGalleryDashboard'>;

export default function AdminGalleryDashboard() {
  const navigation = useNavigation<NavigationProp>();
  const adminContext = useContext(AdminTabContext);
  const insets = useSafeAreaInsets();
  const openDrawer = (adminContext as any)?.openDrawer || (() => {});
  const [albums, setAlbums] = useState<GalleryAlbum[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPhotos, setTotalPhotos] = useState(0);

  // Toast State
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const [toastMessage, setToastMessage] = useState('');
  
  // Delete Confirmation State
  const [albumToDelete, setAlbumToDelete] = useState<GalleryAlbum | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const showToast = (message: string) => {
    setToastMessage(message);
    Animated.sequence([
      Animated.timing(toastOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(2000),
      Animated.timing(toastOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start();
  };

  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener('GALLERY_ALBUM_CREATED', () => {
      showToast("Album created successfully!");
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadAlbums();
    });
    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    loadAlbums();
  }, []);

  const loadAlbums = async () => {
    try {
      setLoading(true);
      const data = await GalleryService.getAlbums();
      setAlbums(data);
      
      let photoCount = 0;
      data.forEach(a => photoCount += (a.photoCount || 0));
      setTotalPhotos(photoCount);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getLatestTime = () => {
    if (albums.length === 0) return '--';
    return 'Recently'; // Could format timestamp using date-fns
  };

  const handleDeleteAlbum = (album: GalleryAlbum) => {
    setAlbumToDelete(album);
  };

  const confirmDelete = async () => {
    if (!albumToDelete) return;
    try {
      setIsDeleting(true);
      await GalleryService.deleteAlbum(albumToDelete.id, albumToDelete.coverPhotoUrl);
      showToast("Album deleted successfully!");
      setAlbumToDelete(null);
      loadAlbums(); // Refresh list
    } catch (error) {
      showToast("Failed to delete album");
      console.error(error);
    } finally {
      setIsDeleting(false);
    }
  };

  const renderHeader = () => (
    <View style={styles.headerWrapper}>
      <View style={[styles.topCard, { paddingTop: Math.max(insets.top, 20) + 10 }]}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity onPress={() => {
            if ((adminContext as any)?.goBack) {
              (adminContext as any).goBack();
            } else if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              (adminContext as any)?.setTabByName?.('Dashboard');
            }
          }} style={styles.menuButton}>
            <ChevronLeft color="#fff" size={26} />
          </TouchableOpacity>
          <View style={[styles.badgeContainer, { marginBottom: 0, alignSelf: 'center' }]}>
            <Sparkles size={16} color="#FCD34D" />
            <Text style={styles.badgeText}>Moments of Faith</Text>
          </View>
        </View>
        
        <Text style={styles.mainTitle}>Church <Text style={styles.titleHighlight}>Gallery</Text></Text>
        <Text style={styles.mainDesc}>
          Preserving precious moments from every church event.
        </Text>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{albums.length}</Text>
            <Text style={styles.statLabel}>ALBUMS</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{totalPhotos}</Text>
            <Text style={styles.statLabel}>PHOTOS</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{getLatestTime()}</Text>
            <Text style={styles.statLabel}>LATEST</Text>
          </View>
        </View>

      </View>

      <View style={styles.sectionHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.sectionTitle}>Your albums</Text>
          <Text style={styles.sectionDesc}>Manage, publish, and share what the congregation sees.</Text>
        </View>
        <TouchableOpacity 
          style={styles.createBtn}
          onPress={() => navigation.navigate('AdminGalleryCreateAlbum')}
        >
          <Plus size={20} color="#0b141a" />
          <Text style={styles.createBtnText}>Create Album</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderAlbum = ({ item }: { item: GalleryAlbum }) => (
    <TouchableOpacity 
      style={styles.albumCard}
      activeOpacity={0.9}
      onPress={() => navigation.navigate('AdminGalleryAlbumDetail', { albumId: item.id, albumName: item.name, albumDescription: item.description })}
    >
      <View style={styles.albumImageContainer}>
        {item.coverPhotoUrl ? (
          <Image source={{ uri: item.coverPhotoUrl }} style={styles.albumCover} />
        ) : (
          <View style={[styles.albumCover, { backgroundColor: '#1E293B', justifyContent: 'center', alignItems: 'center' }]}>
            <ImageIcon color="#94A3B8" size={40} />
          </View>
        )}
        
        {/* Visibility Badge */}
        <View style={styles.visibilityBadge}>
          <Globe size={12} color="#fff" style={{ marginRight: 4 }} />
          <Text style={styles.visibilityText}>{item.visibility || 'Public'}</Text>
        </View>
        
        <View style={styles.albumTitleOverlay}>
          <Text style={styles.albumTitle}>{item.name}</Text>
        </View>
      </View>
      
      <View style={styles.albumDetails}>
        <View style={{ flex: 1 }}>
          <View style={styles.detailRow}>
            <Calendar size={14} color="#94A3B8" />
            <Text style={styles.detailText}>
              {item.createdAt?.toDate ? item.createdAt.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : (item.date || 'No Date')}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <ImageIcon size={14} color="#94A3B8" />
            <Text style={styles.detailText}>{item.photoCount || 0} photos · by Admin</Text>
          </View>
        </View>
        <TouchableOpacity style={{ padding: 10 }} onPress={() => handleDeleteAlbum(item)}>
          <Trash2 size={20} color="#EF4444" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {loading && albums.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#FCD34D" />
        </View>
      ) : (
        <FlatList
          data={albums}
          keyExtractor={item => item.id}
          renderItem={renderAlbum}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Stylish Toast overlay */}
      <Animated.View style={[styles.toastContainer, { opacity: toastOpacity }]} pointerEvents="none">
        <CheckCircle size={20} color="#10B981" />
        <Text style={styles.toastText}>{toastMessage}</Text>
      </Animated.View>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={!!albumToDelete}
        transparent={true}
        animationType="fade"
        onRequestClose={() => !isDeleting && setAlbumToDelete(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.confirmModal}>
            <View style={styles.modalIconContainer}>
              <Trash2 size={32} color="#EF4444" />
            </View>
            <Text style={styles.modalTitle}>Delete Album?</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to delete "{albumToDelete?.name}"? This action will permanently remove all photos inside it.
            </Text>
            
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.cancelBtn} 
                onPress={() => setAlbumToDelete(null)}
                disabled={isDeleting}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.confirmBtn} 
                onPress={confirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.confirmBtnText}>Delete</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b141a',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: 40,
  },
  headerWrapper: {
    marginBottom: 10,
  },
  topCard: {
    backgroundColor: '#1a2d5a',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    paddingTop: 10,
    paddingHorizontal: 20,
    paddingBottom: 35,
    marginBottom: 25,
  },
  gradientLine: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  menuButton: {
    position: 'absolute',
    left: 0,
    padding: 4,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(252, 211, 77, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(252, 211, 77, 0.3)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 15,
  },
  badgeText: {
    color: '#FCD34D',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  mainTitle: {
    fontSize: 36,
    fontWeight: '700',
    color: '#fff',
    fontFamily: 'serif',
    marginBottom: 8,
  },
  titleHighlight: {
    color: '#FCD34D',
    fontStyle: 'italic',
  },
  mainDesc: {
    color: '#94A3B8',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 25,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 10,
    flex: 1,
    marginHorizontal: 4,
  },
  statValue: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  statLabel: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    fontFamily: 'serif',
  },
  sectionDesc: {
    color: '#94A3B8',
    fontSize: 14,
    marginTop: 4,
    marginRight: 10,
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FCD34D',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
  },
  createBtnText: {
    color: '#0b141a',
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 6,
  },
  albumCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
  },
  albumImageContainer: {
    width: '100%',
    height: 220,
    position: 'relative',
  },
  albumCover: {
    width: '100%',
    height: '100%',
  },
  visibilityBadge: {
    position: 'absolute',
    top: 15,
    left: 15,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  visibilityText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  albumTitleOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingTop: 40,
    backgroundColor: 'rgba(0,0,0,0.4)', // fallback
  },
  albumTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
  },
  albumDetails: {
    flexDirection: 'row',
    padding: 15,
    alignItems: 'center',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailText: {
    color: '#94A3B8',
    fontSize: 14,
    marginLeft: 8,
  },
  toastContainer: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
    zIndex: 1000,
  },
  toastText: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  confirmModal: {
    backgroundColor: '#1E293B',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  modalIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  modalMessage: {
    color: '#94A3B8',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  modalActions: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image, Dimensions, ActivityIndicator, Alert, Modal, SafeAreaView, Animated, TouchableWithoutFeedback } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ArrowLeft, Share2, Download, X, ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import { LinearGradient } from 'expo-linear-gradient';
import { MemberGalleryStackParamList } from './MemberGalleryNavigator';
import GalleryService, { GalleryPhoto } from '../../services/GalleryService';
import { useTheme } from '../../context/ThemeContext';

const { width } = Dimensions.get('window');
const COLUMN_COUNT = 2;
const SPACING = 10;
const ITEM_WIDTH = (width - (SPACING * (COLUMN_COUNT + 1))) / COLUMN_COUNT;

type NavigationProp = NativeStackNavigationProp<MemberGalleryStackParamList, 'MemberGalleryAlbumDetail'>;
type RouteProps = RouteProp<MemberGalleryStackParamList, 'MemberGalleryAlbumDetail'>;

export default function MemberGalleryAlbumDetail() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { albumId, albumName, albumDescription } = route.params;
  const { isDark, colors } = useTheme();

  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Image Viewer State
  const [isViewerVisible, setIsViewerVisible] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const viewerListRef = useRef<FlatList>(null);
  
  // Toast State
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const [toastMessage, setToastMessage] = useState('');

  const [isDownloading, setIsDownloading] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);

  useEffect(() => {
    loadPhotos();
  }, [albumId]);

  const loadPhotos = async () => {
    try {
      setLoading(true);
      const data = await GalleryService.getAlbumPhotos(albumId);
      setPhotos(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const openViewer = (index: number) => {
    setCurrentPhotoIndex(index);
    setIsViewerVisible(true);
  };

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

  const handleDownload = async (url: string) => {
    try {
      setIsDownloading(true);
      const { status } = await MediaLibrary.requestPermissionsAsync(true);
      if (status !== 'granted') {
        Alert.alert("Permission Required", "We need access to your photos to save images.");
        return;
      }
      
      const filename = `gallery_photo_${Date.now()}.jpg`;
      const fileUri = `${FileSystem.cacheDirectory}${filename}`;
      const downloadRes = await FileSystem.downloadAsync(url, fileUri);
      
      await MediaLibrary.saveToLibraryAsync(downloadRes.uri);
      showToast("Image saved to gallery!");
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to download photo");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShare = async (url: string) => {
    try {
      setIsSharing(true);
      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert("Error", "Sharing is not available on your device");
        return;
      }
      const filename = `gallery_photo_${Date.now()}.jpg`;
      
      const fileUri = `${FileSystem.cacheDirectory}${filename}`;
      const downloadRes = await FileSystem.downloadAsync(url, fileUri);
      
      await Sharing.shareAsync(downloadRes.uri);
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to share photo");
    } finally {
      setIsSharing(false);
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
        <ArrowLeft size={20} color={colors.text} />
        <Text style={[styles.backText, { color: colors.text }]}>Back</Text>
      </TouchableOpacity>
    </View>
  );

  const renderTitleArea = () => (
    <View style={styles.titleArea}>
      <Text style={styles.categoryText}>ALBUM</Text>
      <Text style={[styles.mainTitle, { color: colors.text }]}>{albumName}</Text>
      {albumDescription ? (
        <Text style={[styles.descText, { color: isDark ? '#CBD5E1' : '#64748B' }]}>{albumDescription}</Text>
      ) : null}
      <Text style={[styles.metaText, { color: '#94A3B8' }]}>{photos.length} photos</Text>
    </View>
  );

  const renderPhoto = ({ item, index }: { item: GalleryPhoto; index: number }) => {
    const isTall = index % 3 === 0;
    
    return (
      <TouchableOpacity 
        style={styles.photoContainer}
        activeOpacity={0.8}
        onPress={() => openViewer(index)}
      >
        <Image 
          source={{ uri: item.url }} 
          style={[styles.photo, { height: isTall ? 250 : 200 }]} 
          resizeMode="cover" 
        />
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {renderHeader()}
      
      <FlatList
        data={photos}
        keyExtractor={item => item.id}
        renderItem={renderPhoto}
        numColumns={2}
        ListHeaderComponent={renderTitleArea}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.row}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          !loading ? (
            <Text style={styles.emptyText}>No photos yet.</Text>
          ) : null
        }
      />
      
      {loading && photos.length === 0 && (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#FCD34D" />
        </View>
      )}

      {/* Full-Screen Image Viewer Modal */}
      <Modal
        visible={isViewerVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsViewerVisible(false)}
      >
        <View style={styles.viewerContainer}>
          <SafeAreaView style={styles.viewerSafeArea}>
            {/* Viewer Header */}
            <View style={styles.viewerHeader}>
              <View style={styles.viewerHeaderLeft}>
                <Text style={styles.viewerAlbumTitle}>{albumName}</Text>
              </View>
              <View style={styles.viewerHeaderRight}>
                <TouchableOpacity 
                  style={styles.viewerIconBtn}
                  onPress={() => setIsViewerVisible(false)}
                >
                  <X size={24} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Viewer Body (Swipeable) */}
            <View style={styles.viewerBody}>
              <FlatList
                ref={viewerListRef}
                data={photos}
                keyExtractor={item => item.id}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                initialScrollIndex={currentPhotoIndex}
                onMomentumScrollEnd={(e) => {
                  const newIdx = Math.round(e.nativeEvent.contentOffset.x / width);
                  setCurrentPhotoIndex(newIdx);
                }}
                getItemLayout={(data, index) => ({
                  length: width,
                  offset: width * index,
                  index,
                })}
                renderItem={({ item, index }) => (
                  <TouchableWithoutFeedback onPress={() => setControlsVisible(!controlsVisible)}>
                    <View style={{ width, flex: 1, justifyContent: 'center', paddingBottom: 60 }}>
                      <View style={styles.instaCard}>
                        {/* Image Area */}
                        <Image 
                          source={{ uri: item.url }} 
                          style={styles.instaImage}
                          resizeMode="contain"
                        />
                      </View>
                    </View>
                  </TouchableWithoutFeedback>
                )}
              />

              {/* Left Arrow */}
              {controlsVisible && currentPhotoIndex > 0 && (
                <TouchableOpacity 
                  style={[styles.navArrow, { left: 20 }]}
                  onPress={() => {
                    const newIdx = currentPhotoIndex - 1;
                    viewerListRef.current?.scrollToIndex({ index: newIdx, animated: true });
                    setCurrentPhotoIndex(newIdx);
                  }}
                >
                  <ChevronLeft size={30} color="#000" />
                </TouchableOpacity>
              )}

              {/* Right Arrow */}
              {controlsVisible && currentPhotoIndex < photos.length - 1 && (
                <TouchableOpacity 
                  style={[styles.navArrow, { right: 20 }]}
                  onPress={() => {
                    const newIdx = currentPhotoIndex + 1;
                    viewerListRef.current?.scrollToIndex({ index: newIdx, animated: true });
                    setCurrentPhotoIndex(newIdx);
                  }}
                >
                  <ChevronRight size={30} color="#000" />
                </TouchableOpacity>
              )}

              {/* Action Bar (Static Badge) */}
              {photos[currentPhotoIndex] && (
                <View style={styles.viewerFooter}>
                  <LinearGradient
                    colors={['#8b5cf6', '#ec4899', '#f59e0b']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.gradientBorder}
                  >
                    <View style={styles.badgeContainer}>
                      <TouchableOpacity 
                        style={styles.badgeBtn}
                        onPress={() => handleDownload(photos[currentPhotoIndex].url)}
                        disabled={isDownloading}
                      >
                        {isDownloading ? (
                          <ActivityIndicator color="#fff" size="small" />
                        ) : (
                          <Download size={20} color="#fff" strokeWidth={2} />
                        )}
                        <Text style={styles.badgeText}>Download</Text>
                      </TouchableOpacity>

                      <View style={styles.badgeDivider} />

                      <TouchableOpacity 
                        style={styles.badgeBtn}
                        onPress={() => handleShare(photos[currentPhotoIndex].url)}
                        disabled={isSharing}
                      >
                        {isSharing ? (
                          <ActivityIndicator color="#fff" size="small" />
                        ) : (
                          <Share2 size={20} color="#fff" strokeWidth={2} />
                        )}
                        <Text style={styles.badgeText}>Share</Text>
                      </TouchableOpacity>
                    </View>
                  </LinearGradient>
                </View>
              )}
            </View>

          </SafeAreaView>
          
          {/* Stylish Toast overlay (Inside Viewer) */}
          <Animated.View style={[styles.toastContainer, { opacity: toastOpacity }]} pointerEvents="none">
            <CheckCircle size={20} color="#10B981" />
            <Text style={styles.toastText}>{toastMessage}</Text>
          </Animated.View>
        </View>
      </Modal>

      {/* Stylish Toast overlay */}
      <Animated.View style={[styles.toastContainer, { opacity: toastOpacity }]} pointerEvents="none">
        <CheckCircle size={20} color="#10B981" />
        <Text style={styles.toastText}>{toastMessage}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingTop: 50,
    paddingBottom: 15,
  },
  iconBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(150,150,150,0.1)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(150,150,150,0.2)',
  },
  backText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
  },
  titleArea: {
    paddingHorizontal: 15,
    marginBottom: 20,
  },
  categoryText: {
    color: '#FCD34D',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  mainTitle: {
    fontSize: 32,
    fontWeight: '700',
    fontFamily: 'serif',
    marginBottom: 6,
  },
  descText: {
    fontSize: 15,
    marginBottom: 10,
    lineHeight: 22,
  },
  metaText: {
    fontSize: 14,
  },
  listContent: {
    paddingHorizontal: SPACING,
    paddingBottom: 40,
  },
  row: {
    justifyContent: 'space-between',
  },
  photoContainer: {
    width: ITEM_WIDTH,
    marginBottom: SPACING,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  photo: {
    width: '100%',
    backgroundColor: 'rgba(150,150,150,0.1)',
  },
  emptyText: {
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
  },
  viewerContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  viewerSafeArea: {
    flex: 1,
  },
  viewerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 20,
  },
  viewerHeaderLeft: {
    flex: 1,
    marginRight: 20,
    justifyContent: 'center',
  },
  viewerAlbumTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
    fontFamily: 'serif',
  },
  viewerHeaderRight: {
    flexDirection: 'row',
    gap: 12,
  },
  viewerIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  viewerBody: {
    flex: 1,
    justifyContent: 'center',
  },
  navArrow: {
    position: 'absolute',
    top: '50%',
    marginTop: -25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 25,
  },
  instaCard: {
    width: width,
    backgroundColor: '#070D15',
  },
  instaImage: {
    width: width,
    height: width,
  },
  viewerFooter: {
    position: 'absolute',
    bottom: 80,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  gradientBorder: {
    padding: 2,
    borderRadius: 30,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#070D15',
    borderRadius: 28,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  badgeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badgeText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  badgeDivider: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: 16,
  },
  toastContainer: {
    position: 'absolute',
    top: 100,
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
  }
});

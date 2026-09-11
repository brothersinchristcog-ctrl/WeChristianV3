import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator, Dimensions, Animated } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Sparkles, Globe, Calendar, Image as ImageIcon, ChevronLeft, CheckCircle } from 'lucide-react-native';
import { MemberGalleryStackParamList } from './MemberGalleryNavigator';
import GalleryService, { GalleryAlbum } from '../../services/GalleryService';
import { useTheme } from '../../context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

type NavigationProp = NativeStackNavigationProp<MemberGalleryStackParamList, 'MemberGalleryDashboard'>;

export default function MemberGalleryDashboard() {
  const navigation = useNavigation<NavigationProp>();
  const { isDark, colors } = useTheme();
  const insets = useSafeAreaInsets();
  
  const [albums, setAlbums] = useState<GalleryAlbum[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPhotos, setTotalPhotos] = useState(0);

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
    return 'Recently';
  };

  const renderHeader = () => (
    <View style={styles.headerWrapper}>
      <View style={[styles.topCard, { backgroundColor: isDark ? '#1a2d5a' : '#0F4C5C', paddingTop: Math.max(insets.top, 20) + 10 }]}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ChevronLeft color="#fff" size={26} />
          </TouchableOpacity>
          <View style={[styles.badgeContainer, { marginBottom: 0, alignSelf: 'center' }]}>
            <Sparkles size={16} color="#FCD34D" />
            <Text style={styles.badgeText}>Moments of Faith</Text>
          </View>
        </View>
        
        <Text style={styles.mainTitle}>Church <Text style={styles.titleHighlight}>Gallery</Text></Text>
        <Text style={styles.mainDesc}>
          Relive precious moments from our church events.
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
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Church Albums</Text>
          <Text style={styles.sectionDesc}>Browse photos from past events.</Text>
        </View>
      </View>
    </View>
  );

  const renderAlbum = ({ item }: { item: GalleryAlbum }) => (
    <TouchableOpacity 
      style={[styles.albumCard, { borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]}
      activeOpacity={0.9}
      onPress={() => navigation.navigate('MemberGalleryAlbumDetail', { albumId: item.id, albumName: item.name, albumDescription: item.description })}
    >
      <View style={styles.albumImageContainer}>
        {item.coverPhotoUrl ? (
          <Image source={{ uri: item.coverPhotoUrl }} style={styles.albumCover} />
        ) : (
          <View style={[styles.albumCover, { backgroundColor: isDark ? '#1E293B' : '#E2E8F0', justifyContent: 'center', alignItems: 'center' }]}>
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
            <Text style={[styles.detailText, { color: isDark ? '#94A3B8' : '#64748B' }]}>
              {item.createdAt?.toDate ? item.createdAt.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : (item.date || 'No Date')}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <ImageIcon size={14} color="#94A3B8" />
            <Text style={[styles.detailText, { color: isDark ? '#94A3B8' : '#64748B' }]}>{item.photoCount || 0} photos</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
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
          ListEmptyComponent={
            !loading ? (
              <View style={{ alignItems: 'center', marginTop: 40 }}>
                <ImageIcon size={48} color="#94A3B8" style={{ marginBottom: 12 }} />
                <Text style={{ color: colors.text, fontSize: 16, fontWeight: '600' }}>No Albums Yet</Text>
                <Text style={{ color: '#94A3B8', fontSize: 14, textAlign: 'center', marginTop: 8, paddingHorizontal: 40 }}>
                  Photos and memories will appear here once the admins upload them.
                </Text>
              </View>
            ) : null
          }
        />
      )}
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
  listContent: {
    paddingBottom: 40,
  },
  headerWrapper: {
    marginBottom: 10,
  },
  topCard: {
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    paddingTop: 10,
    paddingHorizontal: 20,
    paddingBottom: 35,
    marginBottom: 25,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  backButton: {
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
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 25,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
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
    color: 'rgba(255,255,255,0.8)',
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
    fontFamily: 'serif',
  },
  sectionDesc: {
    color: '#94A3B8',
    fontSize: 14,
    marginTop: 4,
    marginRight: 10,
  },
  albumCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
    marginHorizontal: 15,
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
    backgroundColor: 'rgba(0,0,0,0.6)',
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
    backgroundColor: 'rgba(0,0,0,0.4)',
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
    fontSize: 14,
    marginLeft: 8,
  },
});

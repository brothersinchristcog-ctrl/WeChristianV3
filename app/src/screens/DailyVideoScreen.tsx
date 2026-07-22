import React, { useEffect, useState, useCallback } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator, 
  Dimensions, 
  Image, 
  Linking, 
  Share, 
  StatusBar, 
  Platform 
} from 'react-native';
import YoutubePlayer from 'react-native-youtube-iframe';
import { 
  ChevronLeft, 
  Share2, 
  Play, 
  Clock, 
  Video, 
  ExternalLink,
  ChevronRight,
  Heart
} from 'lucide-react-native';
import FirestoreService, { FirestoreVideo } from '../services/FirestoreService';
import { useChurch } from '../context/ChurchContext';

const { width } = Dimensions.get('window');

const extractYoutubeId = (url: string) => {
  if (!url || typeof url !== 'string') return '';
  const cleanUrl = url.trim();
  const match = cleanUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/|live\/))([\w-]+)/);
  const id = match ? match[1] : cleanUrl;
  console.log('Extracted YT ID:', id, 'from', url);
  return id;
};

interface DevotionalVideo extends FirestoreVideo {
  date?: string;
  pastor?: string;
}

import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function DailyVideoScreen({ navigation, route }: any) {
  const [videos, setVideos] = useState<DevotionalVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [activeVideo, setActiveVideo] = useState<DevotionalVideo | null>(null);
  const { activeChurch } = useChurch();
  const insets = useSafeAreaInsets();

  // Initial load from params or fetch
  useEffect(() => {
    const init = async () => {
      const promiseData = await FirestoreService.getDailyPromisesArchive();
      const data: DevotionalVideo[] = promiseData
        .filter(p => p.youtubeId)
        .map(p => ({
          id: p.id || '',
          title: p.videoTitle || "Today's Devotional",
          youtubeId: p.youtubeId || '',
          publishedAt: p.date,
          date: p.date,
          duration: p.duration || '',
          pastor: p.pastor || 'Brother Y. Rajesh'
        }));
      setVideos(data);
      
      const paramId = route?.params?.youtubeId;
      const paramTitle = route?.params?.videoTitle;
      const paramPastor = route?.params?.pastor;

      if (paramId) {
        const found = data.find(v => v.youtubeId === paramId);
        if (found) {
          setActiveVideo(found);
        } else {
          // If not in archive, create a direct video object using passed params
          setActiveVideo({
            id: 'direct-' + paramId,
            title: paramTitle || 'Today\'s Devotional',
            youtubeId: paramId,
            publishedAt: 'Today',
            date: 'Today',
            duration: '',
            pastor: paramPastor || 'Brother Y. Rajesh'
          });
        }
      } else {
        // Fallback to church's youtube live/channel
        const fallbackId = activeChurch?.socialLinks?.youtube ? extractYoutubeId(activeChurch.socialLinks.youtube) : '';
        setActiveVideo({
          id: 'church-live',
          title: activeChurch?.name ? `${activeChurch.name} Live / Channel` : 'Today\'s Devotional',
          youtubeId: fallbackId || 'live', 
          publishedAt: 'Today',
          date: 'Today',
          duration: '',
          pastor: 'Main Speaker'
        });
      }
      setLoading(false);
    };
    init();
  }, [route?.params?.youtubeId]);

  const onStateChange = useCallback((state: string) => {
    if (state === 'ended') setPlaying(false);
  }, []);

  const handleShare = async () => {
    if (!activeVideo) return;
    try {
      await Share.share({
        message: `Watch this powerful teaching: "${activeVideo.title}" - https://youtu.be/${activeVideo.youtubeId}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleSubscribe = () => {
    const yUrl = activeChurch?.socialLinks?.youtube || 'https://www.youtube.com';
    Linking.openURL(yUrl);
  };

  if (loading && !activeVideo) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#fbbf24" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a2d5a" />
      
      {/* ── Page Header ── */}
      <View style={[styles.pageHeader, { paddingTop: Platform.OS === 'ios' ? insets.top || 50 : insets.top || 20 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ChevronLeft size={20} color="#aac4e8" />
          <Text style={styles.backBtnTxt}>Back</Text>
        </TouchableOpacity>
        <View style={styles.titleCol}>
          <Text style={styles.pageTitle}>Video Devotional</Text>
          <Text style={styles.pageSub}>ప్రార్థన సందేశం</Text>
        </View>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        
        {/* ── Video Player ── */}
        <View style={styles.playerSection}>
          <YoutubePlayer
            height={width * 0.56}
            play={playing}
            videoId={extractYoutubeId(activeVideo?.youtubeId || '')}
            onChangeState={onStateChange}
          />
        </View>

        {/* ── Video Details ── */}
        <View style={styles.videoDetails}>
          <Text style={styles.videoTitle}>{activeVideo?.title || (activeChurch?.name ? `${activeChurch.name} Live` : 'Today\'s Devotional')}</Text>
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Play size={12} color="#c0392b" fill="#c0392b" />
              <Text style={styles.metaTxt}>Featured Teaching</Text>
            </View>
            <View style={styles.metaItem}>
              <Clock size={12} color="#6B7280" />
              <Text style={styles.metaTxt}>{activeVideo?.date ? (activeVideo.date === 'Today' ? 'Today' : new Date(activeVideo.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })) : 'Today'}</Text>
            </View>
          </View>

          <View style={styles.pastorCard}>
            <View style={styles.pastorAv}><Text style={styles.pastorAvTxt}>P</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.pastorName}>{activeVideo?.pastor || 'Brother Y. Rajesh'}</Text>
              <Text style={styles.pastorRole}>Main Speaker</Text>
            </View>
            <TouchableOpacity style={styles.subBtn} onPress={handleSubscribe}>
              <Text style={styles.subBtnTxt}>Subscribe</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
            <Share2 size={16} color="#fff" />
            <Text style={styles.shareBtnTxt}>Share this message</Text>
          </TouchableOpacity>
        </View>

        {/* ── Archive ── */}
        <Text style={styles.secLbl}>PAST PROMISES</Text>
        <View style={styles.archiveList}>
          {videos.filter(v => v.id !== activeVideo?.id).length === 0 ? (
            <View style={{ padding: 20, alignItems: 'center' }}>
              <Text style={{ color: '#9CA3AF', fontSize: 12, fontStyle: 'italic' }}>No other past video promises available.</Text>
            </View>
          ) : (
            videos.filter(v => v.id !== activeVideo?.id).map((video) => {
              const vidId = extractYoutubeId(video.youtubeId);
              return (
              <TouchableOpacity 
                key={video.id} 
                style={styles.archiveItem}
                onPress={() => setActiveVideo(video)}
              >
                <View style={styles.thumbBox}>
                  <Image 
                    source={{ uri: `https://img.youtube.com/vi/${vidId}/mqdefault.jpg` }} 
                    style={styles.thumb} 
                  />
                  <View style={styles.playIcon}><Play size={10} color="#fff" fill="#fff" /></View>
                </View>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemTitle} numberOfLines={1}>{video.title}</Text>
                  <Text style={styles.itemMeta}>{video.date ? new Date(video.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''} · {video.duration}</Text>
                </View>
                <ChevronRight size={16} color="#D1D5DB" />
              </TouchableOpacity>
              );
            })
          )}
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f2f7' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a2d5a' },
  
  // Header
  pageHeader: {
    backgroundColor: '#1a2d5a',
    paddingTop: Platform.OS === 'ios' ? 60 : (StatusBar.currentHeight ? StatusBar.currentHeight + 10 : 45),
    paddingHorizontal: 16,
    paddingBottom: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, minWidth: 60 },
  backBtnTxt: { color: '#aac4e8', fontSize: 13, fontWeight: '500' },
  titleCol: { flex: 1, alignItems: 'center' },
  pageTitle: { color: '#fff', fontSize: 14, fontWeight: '600' },
  pageSub: { color: '#aac4e8', fontSize: 9.5, marginTop: 1 },

  scroll: { paddingBottom: 40 },

  playerSection: { backgroundColor: '#000', width: '100%' },

  videoDetails: { padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  videoTitle: { fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 8 },
  metaRow: { flexDirection: 'row', gap: 15, marginBottom: 20 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaTxt: { fontSize: 11, color: '#6B7280', fontWeight: '500' },

  pastorCard: { 
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, 
    backgroundColor: '#f9fafb', borderRadius: 14, marginBottom: 15,
    borderWidth: 0.5, borderColor: '#e5e7eb'
  },
  pastorAv: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#c0392b', justifyContent: 'center', alignItems: 'center' },
  pastorAvTxt: { color: '#fff', fontWeight: '700' },
  pastorName: { fontSize: 13, fontWeight: '700', color: '#111827' },
  pastorRole: { fontSize: 10, color: '#6B7280', marginTop: 1 },
  subBtn: { backgroundColor: '#1a2d5a', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 8 },
  subBtnTxt: { color: '#fff', fontSize: 10, fontWeight: '700' },

  shareBtn: { backgroundColor: '#c0392b', paddingVertical: 14, borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  shareBtnTxt: { color: '#fff', fontSize: 13, fontWeight: '700' },

  secLbl: { fontSize: 10, fontWeight: '700', color: '#9CA3AF', letterSpacing: 0.6, marginHorizontal: 16, marginBottom: 12, marginTop: 20 },
  
  archiveList: { backgroundColor: '#fff', marginHorizontal: 12, borderRadius: 16, overflow: 'hidden', borderWidth: 0.5, borderColor: '#e5e7eb' },
  archiveItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 0.5, borderBottomColor: '#f3f4f6', gap: 12 },
  thumbBox: { width: 80, height: 60, borderRadius: 8, overflow: 'hidden', position: 'relative' },
  thumb: { width: '100%', height: '100%' },
  playIcon: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
  itemInfo: { flex: 1 },
  itemTitle: { fontSize: 12, fontWeight: '600', color: '#111827' },
  itemMeta: { fontSize: 9.5, color: '#9CA3AF', marginTop: 2 },
});

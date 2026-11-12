import React, { useEffect, useState, useCallback, useRef } from 'react';
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
  Platform,
  Modal
} from 'react-native';
import YoutubePlayer from 'react-native-youtube-iframe';
import { WebView } from 'react-native-webview';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  ChevronLeft, 
  ArrowLeft,
  Share2, 
  Play, 
  Clock, 
  Video, 
  ExternalLink,
  ChevronRight,
  Heart,
  BookOpen,
  Maximize2,
  ChevronUp,
  ChevronDown,
  X
} from 'lucide-react-native';
import FirestoreService from '../services/FirestoreService';
import { useChurch } from '../context/ChurchContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

const formatNotesTitle = (fileName?: string) => {
  if (!fileName) return 'Sermon Study Notes';
  let name = fileName.replace(/\.(pdf|docx?|txt)$/i, '');
  name = name.replace(/[_-]+/g, ' ').trim();
  name = name.replace(/sermonpdf$/i, 'Sermon Notes');
  name = name.replace(/pdf$/i, '');
  name = name.split(' ')
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
  if (!name.toLowerCase().includes('note') && !name.toLowerCase().includes('sermon')) {
    name += ' Notes';
  }
  return name.trim() || 'Sermon Study Notes';
};

const injectedGviewCSS = `
  (function() {
    try {
      var style = document.createElement('style');
      style.innerHTML = "body, html, #drive-viewer-root, .drive-viewer-paginated-scrollable { background: #FFFFFF !important; background-color: #FFFFFF !important; margin: 0 !important; padding: 0 !important; } .drive-viewer-toolstrip { display: none !important; } .drive-viewer-page-container { margin: 6px auto !important; box-shadow: 0 1px 3px rgba(0,0,0,0.12) !important; border: 1px solid #E5E7EB !important; } img { max-width: 100% !important; }";
      document.head.appendChild(style);
    } catch(e) {}
  })();
  true;
`;

const extractYoutubeId = (url: string) => {
  if (!url || typeof url !== 'string') return '';
  const cleanUrl = url.trim();
  const match = cleanUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/|live\/))([\w-]+)/);
  const id = match ? match[1] : cleanUrl;
  return id;
};

import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SermonVideoScreen({ navigation, route }: any) {
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [activeVideo, setActiveVideo] = useState<any | null>(null);
  const { activeChurch } = useChurch();
  const { t } = useLanguage();
  const { isDark, colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [inlineNotesText, setInlineNotesText] = useState<string>('');
  const [loadingTextNotes, setLoadingTextNotes] = useState(false);
  const [isNotesExpanded, setIsNotesExpanded] = useState(false);
  const [showFullscreenNotes, setShowFullscreenNotes] = useState(false);
  const [readerKey, setReaderKey] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  // Initial load from params or fetch
  useEffect(() => {
    const init = async () => {
      const promiseData = await FirestoreService.getSermons(50);
      const data: any[] = promiseData
        .filter(p => p.youtubeId && p.youtubeId.trim() !== '' && p.youtubeId !== 'mock')
        .map(p => ({
          id: p.id,
          title: p.title || 'Sermon',
          youtubeId: p.youtubeId,
          date: p.date,
          duration: p.duration || '',
          pastor: p.pastor || 'Pastor',
          thumbnailUrl: p.thumbnailUrl || p.imageUrl || '',
          notesUrl: p.notesUrl || '',
          notesFileName: p.notesFileName || '',
          notesFileType: p.notesFileType || '',
          notesText: p.notesText || '',
        }));
      setVideos(data);
      
      const sermonData = route?.params?.sermonData;

      if (sermonData) {
        setActiveVideo({
          id: sermonData.id || 'direct',
          title: sermonData.title || 'Sermon',
          youtubeId: sermonData.youtubeId || '',
          date: sermonData.date || 'Today',
          duration: sermonData.duration || '',
          pastor: sermonData.pastor || 'Pastor',
          notesUrl: sermonData.notesUrl || '',
          notesFileName: sermonData.notesFileName || '',
          notesFileType: sermonData.notesFileType || '',
          notesText: sermonData.notesText || '',
        });
      } else if (data.length > 0) {
        setActiveVideo(data[0]);
      }
      setLoading(false);
    };
    init();
  }, [route?.params?.youtubeId]);

  // Load text notes if needed
  useEffect(() => {
    if (activeVideo?.notesText) {
      setInlineNotesText(activeVideo.notesText);
    } else if (activeVideo?.notesUrl && (activeVideo?.notesFileType === 'txt' || activeVideo?.notesFileName?.toLowerCase()?.endsWith('.txt'))) {
      setLoadingTextNotes(true);
      fetch(activeVideo.notesUrl)
        .then(res => res.text())
        .then(txt => setInlineNotesText(txt))
        .catch(err => console.warn('Could not load text notes:', err))
        .finally(() => setLoadingTextNotes(false));
    } else {
      setInlineNotesText('');
    }
  }, [activeVideo]);

  const onStateChange = useCallback((state: string) => {
    if (state === 'ended') setPlaying(false);
  }, []);

  const handleShare = async () => {
    if (!activeVideo) return;
    try {
      await Share.share({
        message: `Watch this powerful teaching: "${activeVideo.title}" - https://youtu.be/${extractYoutubeId(activeVideo.youtubeId)}`,
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

  const finalVideoId = extractYoutubeId(activeVideo?.youtubeId || '');
  const hasValidVideo = finalVideoId.length > 0;

  const hasNotes = !!(activeVideo?.notesUrl || activeVideo?.notesText || activeVideo?.notesFileName);
  const detectedFileType = (
    activeVideo?.notesFileType ||
    (activeVideo?.notesFileName?.toLowerCase()?.endsWith('.pdf') ? 'pdf' :
     activeVideo?.notesFileName?.toLowerCase()?.endsWith('.docx') ? 'docx' :
     activeVideo?.notesFileName?.toLowerCase()?.endsWith('.doc') ? 'doc' :
     activeVideo?.notesFileName?.toLowerCase()?.endsWith('.txt') ? 'txt' : 'pdf')
  ).toLowerCase();
  const isTextDoc = detectedFileType === 'txt' || (inlineNotesText && !activeVideo?.notesUrl);
  const cleanDocTitle = formatNotesTitle(activeVideo?.notesFileName);
  const safeNotesUrl = (activeVideo?.notesUrl || '').trim();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a2d5a" />
      
      {/* ── Page Header ── */}
      <View style={{ backgroundColor: '#000' }}>
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
            <View style={styles.headerCenter}>
              <Text style={styles.pageTitle}>{t('sermons.videoTitle')}</Text>
              <Text style={styles.pageSub}>{t('sermons.title')}</Text>
            </View>
          </View>
        </LinearGradient>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        
        {/* ── Video Player ── */}
        <View style={styles.playerSection}>
          {hasValidVideo ? (
            <YoutubePlayer
              height={width * 0.56}
              play={playing}
              videoId={finalVideoId}
              onChangeState={onStateChange}
            />
          ) : (
            <View style={{ height: width * 0.56, justifyContent: 'center', alignItems: 'center', backgroundColor: '#111827' }}>
              <Video size={40} color="#374151" />
              <Text style={{ color: '#9CA3AF', marginTop: 10, fontSize: 12, fontWeight: '600' }}>{t('sermons.noVideoLink')}</Text>
            </View>
          )}
        </View>

        {/* ── Video Details ── */}
        <View style={styles.videoDetails}>
          <Text style={styles.videoTitle}>{activeVideo?.title || t('home.exploreSermons')}</Text>
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Play size={12} color="#c0392b" fill="#c0392b" />
              <Text style={styles.metaTxt}>{t('sermons.featuredTeaching')}</Text>
            </View>
            <View style={styles.metaItem}>
              <Clock size={12} color="#9CA3AF" />
              <Text style={styles.metaTxt}>{activeVideo?.date || t('common.today')}</Text>
            </View>
          </View>

          <View style={styles.pastorCard}>
            <View style={styles.pastorAv}><Text style={styles.pastorAvTxt}>P</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.pastorName}>{activeVideo?.pastor || t('sermons.pastor')}</Text>
              <Text style={styles.pastorRole}>{t('sermons.mainSpeaker')}</Text>
            </View>
            <TouchableOpacity style={styles.subBtn} onPress={handleSubscribe}>
              <Text style={styles.subBtnTxt}>{t('sermons.subscribe')}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
            <Share2 size={16} color="#fff" />
            <Text style={styles.shareBtnTxt}>{t('sermons.shareThisMessage')}</Text>
          </TouchableOpacity>
        </View>

        {/* ── Sermon Notes (in-app viewer) ── */}
        {hasNotes && (
          <View style={styles.notesSection}>
            <View style={[styles.notesCard, { backgroundColor: isDark ? '#1e293b' : '#fff', borderColor: isDark ? '#334155' : '#e2e8f0' }]}>
              <View style={styles.notesHeaderBar}>
                <BookOpen size={20} color={isDark ? '#fff' : '#1a2d5a'} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.notesHeaderTitle, { color: isDark ? '#fff' : '#1a2d5a' }]}>Sermon Notes · {detectedFileType.toUpperCase()}</Text>
                  <Text style={[styles.notesFileName, { color: isDark ? '#94a3b8' : '#64748b' }]} numberOfLines={1}>{cleanDocTitle}</Text>
                </View>
              </View>
              <View style={styles.notesActionBox}>
                <TouchableOpacity style={styles.notesBadgeBtn} onPress={() => { setReaderKey(k => k + 1); setShowFullscreenNotes(true); }} activeOpacity={0.75}>
                  <Text style={styles.notesBadgeBtnTxt}>Read In-App</Text>
                  <Maximize2 size={12} color="#94A3B8" style={{ marginLeft: 6 }} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.notesBadgeBtn}
                  onPress={() => {
                    const next = !isNotesExpanded;
                    setIsNotesExpanded(next);
                    if (next) setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
                  }}
                  activeOpacity={0.75}
                >
                  <Text style={styles.notesBadgeBtnTxt}>{isNotesExpanded ? 'Hide Preview' : 'Inline Preview'}</Text>
                  {isNotesExpanded ? <ChevronUp size={13} color="#94A3B8" style={{ marginLeft: 5 }} /> : <ChevronDown size={13} color="#94A3B8" style={{ marginLeft: 5 }} />}
                </TouchableOpacity>
              </View>

              {isTextDoc && isNotesExpanded && (
                <View style={[styles.notesContentWrap, { backgroundColor: isDark ? '#0f172a' : '#FAFAF9' }]}>
                  {loadingTextNotes ? (
                    <ActivityIndicator style={{ padding: 20 }} color="#1a2d5a" />
                  ) : (
                    <ScrollView style={styles.notesTextScroll} nestedScrollEnabled>
                      <Text style={[styles.notesTextContent, { color: isDark ? '#f1f5f9' : '#1F2937' }]} selectable>
                        {inlineNotesText || 'No text content available.'}
                      </Text>
                    </ScrollView>
                  )}
                </View>
              )}

              {!isTextDoc && !!safeNotesUrl && isNotesExpanded && (
                <View style={styles.notesWebViewBox}>
                  <WebView
                    source={{ uri: (detectedFileType === 'pdf' && Platform.OS === 'ios') ? safeNotesUrl : `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(safeNotesUrl)}` }}
                    style={{ flex: 1, backgroundColor: '#fff' }}
                    originWhitelist={['*']}
                    injectedJavaScript={injectedGviewCSS}
                    nestedScrollEnabled
                    javaScriptEnabled
                    domStorageEnabled
                    startInLoadingState
                  />
                </View>
              )}
            </View>
          </View>
        )}

        {/* ── Archive ── */}
        <Text style={styles.secLbl}>{t('sermons.pastSermons')}</Text>
        <View style={styles.archiveList}>
          {videos.filter(v => v.id !== activeVideo?.id).length === 0 ? (
            <View style={{ padding: 20, alignItems: 'center' }}>
              <Text style={{ color: '#9CA3AF', fontSize: 12, fontStyle: 'italic' }}>{t('sermons.noPastSermons')}</Text>
            </View>
          ) : (
            videos.filter(v => v.id !== activeVideo?.id).map((video) => (
              <TouchableOpacity 
                key={video.id} 
                style={styles.archiveItem}
                onPress={() => setActiveVideo(video)}
              >
                <View style={styles.thumbBox}>
                  <Image 
                    source={{ uri: video.thumbnailUrl || `https://img.youtube.com/vi/${extractYoutubeId(video.youtubeId)}/mqdefault.jpg` }} 
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
            ))
          )}
        </View>

      </ScrollView>

      <Modal visible={showFullscreenNotes} animationType="slide" onRequestClose={() => setShowFullscreenNotes(false)}>
        <View style={{ flex: 1, backgroundColor: '#000' }}>
          <StatusBar barStyle="light-content" backgroundColor="#000" />
          <View style={styles.fullscreenModalHeader}>
            <TouchableOpacity style={styles.fullscreenCloseBtn} onPress={() => setShowFullscreenNotes(false)} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <ArrowLeft size={22} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.fullscreenCenterTitle} numberOfLines={1}>{cleanDocTitle}</Text>
            <View style={{ width: 44, height: 44 }} />
          </View>
          <View style={{ flex: 1, backgroundColor: '#000' }}>
            {isTextDoc ? (
              <ScrollView style={{ flex: 1, padding: 18 }}>
                <Text style={[styles.notesTextContent, { color: '#F8FAFC', fontSize: 16, lineHeight: 26 }]} selectable>
                  {inlineNotesText || 'No text content available.'}
                </Text>
              </ScrollView>
            ) : safeNotesUrl ? (
              <WebView
                key={`fs-${readerKey}`}
                source={{ uri: (detectedFileType === 'pdf' && Platform.OS === 'ios') ? safeNotesUrl : `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(safeNotesUrl)}` }}
                style={{ flex: 1, backgroundColor: '#000' }}
                originWhitelist={['*']}
                injectedJavaScript={injectedGviewCSS}
                javaScriptEnabled
                domStorageEnabled
                startInLoadingState
                mixedContentMode="always"
                renderLoading={() => (
                  <View style={styles.notesLoadingBox}>
                    <ActivityIndicator size="large" color="#fff" />
                  </View>
                )}
              />
            ) : null}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  notesSection: { marginTop: 14, marginHorizontal: 16 },
  notesCard: { borderRadius: 16, overflow: 'hidden', borderWidth: 1, elevation: 3 },
  notesHeaderBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8, gap: 12 },
  notesHeaderTitle: { fontSize: 14, fontWeight: '800' },
  notesFileName: { fontSize: 11.5, fontWeight: '600', marginTop: 2 },
  notesActionBox: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 4, paddingBottom: 16, gap: 10 },
  notesBadgeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1a2d5a', borderWidth: 1, borderColor: '#64748B', borderRadius: 22, paddingVertical: 9, paddingHorizontal: 12 },
  notesBadgeBtnTxt: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  notesContentWrap: { borderTopWidth: 1, borderTopColor: '#E2E8F0' },
  notesTextScroll: { maxHeight: 320, padding: 16 },
  notesTextContent: { fontSize: 14, lineHeight: 23, color: '#1F2937' },
  notesWebViewBox: { width: '100%', height: 380, backgroundColor: '#FFFFFF' },
  notesLoadingBox: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
  fullscreenModalHeader: { paddingTop: Platform.OS === 'ios' ? 52 : (StatusBar.currentHeight ?? 24) + 8, paddingHorizontal: 16, paddingBottom: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#000', borderBottomWidth: 1, borderBottomColor: '#27272A' },
  fullscreenCloseBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'flex-start' },
  fullscreenCenterTitle: { flex: 1, color: '#FFFFFF', fontSize: 15, fontWeight: '700', textAlign: 'center', paddingHorizontal: 8 },
  container: { flex: 1, backgroundColor: '#f0f2f7' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a2d5a' },
  
  // Header
  pageHeader: {
    paddingTop: Platform.OS === 'ios' ? 56 : (StatusBar.currentHeight ?? 24) + 12,
    paddingHorizontal: 20,
    paddingBottom: 30,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    minHeight: Platform.OS === 'ios' ? 140 : 120,
  },
  headerCenter: { flex: 1, justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 24 },
  backBtn: { zIndex: 10, padding: 5, marginLeft: -8, marginBottom: 8 },
  pageTitle: { color: '#fff', fontSize: 20, fontWeight: '800', marginBottom: 2 },
  pageSub: { color: 'rgba(255,255,255,0.65)', fontSize: 11, fontWeight: '500' },

  scroll: { paddingBottom: 40 },

  playerSection: { backgroundColor: '#000', width: '100%' },

  videoDetails: { padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  videoTitle: { fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 8 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 15, marginBottom: 20 },
  metaItem: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 },
  metaTxt: { fontSize: 11, color: '#6B7280', fontWeight: '500' },

  pastorCard: { 
    flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 12, padding: 12, 
    backgroundColor: '#f9fafb', borderRadius: 14, marginBottom: 15,
    borderWidth: 0.5, borderColor: '#e5e7eb'
  },
  pastorAv: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#c0392b', justifyContent: 'center', alignItems: 'center' },
  pastorAvTxt: { color: '#fff', fontWeight: '700' },
  pastorName: { fontSize: 13, fontWeight: '700', color: '#111827' },
  pastorRole: { fontSize: 10, color: '#6B7280', marginTop: 1 },
  subBtn: { backgroundColor: '#1a2d5a', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 8 },
  subBtnTxt: { color: '#fff', fontSize: 10, fontWeight: '700' },

  shareBtn: { backgroundColor: '#c0392b', paddingVertical: 14, borderRadius: 12, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: 8 },
  shareBtnTxt: { color: '#fff', fontSize: 13, fontWeight: '700' },

  secLbl: { fontSize: 10, fontWeight: '700', color: '#9CA3AF', letterSpacing: 0.6, marginHorizontal: 16, marginBottom: 12, marginTop: 20 },
  
  archiveList: { backgroundColor: '#fff', marginHorizontal: 12, borderRadius: 16, overflow: 'hidden', borderWidth: 0.5, borderColor: '#e5e7eb' },
  archiveItem: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', padding: 12, borderBottomWidth: 0.5, borderBottomColor: '#f3f4f6', gap: 12 },
  thumbBox: { width: 80, height: 60, borderRadius: 8, overflow: 'hidden', position: 'relative' },
  thumb: { width: '100%', height: '100%' },
  playIcon: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
  itemInfo: { flex: 1 },
  itemTitle: { fontSize: 12, fontWeight: '600', color: '#111827' },
  itemMeta: { fontSize: 9.5, color: '#9CA3AF', marginTop: 2 },
});

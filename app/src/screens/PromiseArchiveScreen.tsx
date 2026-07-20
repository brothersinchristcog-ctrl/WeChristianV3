import React, { useEffect, useState, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Share,
  Dimensions,
  Image,
  StatusBar,
  Platform,
  RefreshControl
} from 'react-native';
import {
  ChevronLeft,
  Share2,
  Play,
  BookOpen,
  Calendar,
  ChevronRight
} from 'lucide-react-native';
import FirestoreService, { DailyPromise } from '../services/FirestoreService';
import { useChurch } from '../context/ChurchContext';

const { width } = Dimensions.get('window');

// Utility to strip HTML tags
const stripHtml = (html: string | undefined): string => {
  if (!html) return '';
  return html.replace(/<[^>]+>/g, '').trim();
};

export default function PromiseArchiveScreen({ navigation }: any) {
  const [promises, setPromises] = useState<DailyPromise[]>([]);
  const [selectedPromise, setSelectedPromise] = useState<DailyPromise | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { activeChurch } = useChurch();
  const scrollViewRef = useRef<ScrollView>(null);

  const fetchPromises = async () => {
    try {
      const data = await FirestoreService.getDailyPromisesArchive();
      // Ensure sorted by date descending in case Firestore returns them out of order
      const sortedData = data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setPromises(sortedData);

      const today = new Date().toISOString().split('T')[0];
      const todayPromise = sortedData.find(p => p.date === today);

      if (todayPromise) {
        setSelectedPromise(todayPromise);
      } else {
        setSelectedPromise(null);
      }
    } catch (error) {
      console.error('Error fetching promises:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPromises();
  }, []);

  // Reset to Today's promise when focusing the tab
  useFocusEffect(
    React.useCallback(() => {
      const today = new Date().toISOString().split('T')[0];
      const todayPromise = promises.find(p => p.date === today);
      if (todayPromise) {
        setSelectedPromise(todayPromise);
      } else {
        setSelectedPromise(null);
      }
    }, [promises])
  );

  const handleBack = () => {
    if (selectedPromise && promises.length > 0 && selectedPromise.id !== promises[0].id) {
      setSelectedPromise(promises[0]);
    } else {
      navigation.goBack();
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchPromises();
  };

  const handleShare = async (promise: DailyPromise) => {
    try {
      const verse = stripHtml(promise.verse);
      const telugu = stripHtml(promise.verseTelugu);
      const refEn = promise.verseReferenceEn || promise.verseReference || 'Bible';

      await Share.share({
        message: `Daily Promise from ${activeChurch?.name || 'Your Church'}:\n\n"${verse}"\n\n${telugu}\n\n- ${refEn}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const formatDisplayDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).toUpperCase();
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a2d5a" />

      {/* ── Page Header ── */}
      <View style={styles.pageHeader}>
        <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
          <ChevronLeft size={24} color="#fff" />
          <Text style={styles.backBtnTxt}>Back</Text>
        </TouchableOpacity>
        <View style={styles.titleCol}>
          <Text style={styles.pageTitle}>Daily Promise</Text>
          <Text style={styles.pageSub}>ఈ రోజు వాగ్దానం</Text>
        </View>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView 
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1a2d5a" />
        }
      >
        {selectedPromise ? (
          <View style={styles.mainContent}>
            <Text style={styles.topDate}>{formatDisplayDate(selectedPromise.date)}</Text>

            {/* --- Hero Card --- */}
            <View style={styles.heroCard}>
              <View style={styles.heroHeader}>
                <Text style={styles.heroRefEn}>
                  {selectedPromise.verseReferenceEn || ''}
                  {selectedPromise.verseReferenceEn && selectedPromise.verseReferenceTe ? ' - ' : ''}
                  {selectedPromise.verseReferenceTe || (!selectedPromise.verseReferenceEn ? stripHtml(selectedPromise.verse).substring(0, 30) + '...' : '')}
                </Text>
              </View>

              <Text style={styles.verseEn}>"{stripHtml(selectedPromise.verse)}"</Text>
              <Text style={styles.verseTe}>"{stripHtml(selectedPromise.verseTelugu) || 'వాగ్దానము'}"</Text>

              <View style={styles.heroActions}>
                <TouchableOpacity style={styles.actionBtn}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Calendar size={18} color="#fff" />
                    <Text style={styles.actionBtnTxt}>Save card</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#c0392b' }]} onPress={() => handleShare(selectedPromise)}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Share2 size={18} color="#fff" />
                    <Text style={styles.actionBtnTxt}>Share</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            {/* --- Devotional Note --- */}
            <View style={styles.reflectionBox}>
              <Text style={styles.reflectionTitle}>Devotional Note</Text>
              <Text style={styles.reflectionText}>
                {stripHtml(selectedPromise.devotionalNote) || "In all seasons of life — in trials, in weakness, in uncertainty — we are not alone."}
              </Text>
              <Text style={styles.reflectionAuthor}>— Pastor {selectedPromise.pastor || 'Daniel Raju'}</Text>
            </View>

            {/* --- 1-min Devotional Bar --- */}
            {selectedPromise.youtubeId && (
              <TouchableOpacity
                style={styles.devotionalBar}
                onPress={() => navigation.navigate('DailyVideo', { youtubeId: selectedPromise.youtubeId, videoTitle: selectedPromise.videoTitle, pastor: selectedPromise.pastor })}
              >
                <View style={styles.playCircle}>
                  <Play size={20} color="#c0392b" fill="#c0392b" />
                </View>
                <View style={styles.devotionalInfo}>
                  <Text style={styles.devotionalTitle}>Today's 1-min devotional</Text>
                  <Text style={styles.devotionalSubTe}>నేటి 1 నిమిషాల సందేశం</Text>
                  <Text style={styles.devotionalSub}>
                    {selectedPromise.verseReferenceEn || selectedPromise.verseReferenceTe || 'Bible Reference'} · {selectedPromise.duration || '58 seconds'}
                  </Text>
                </View>
                <ChevronRight size={24} color="#c0392b" />
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.noTodayCard}>
            <View style={styles.noTodayIcon}>
              <BookOpen size={40} color="#1a2d5a" />
            </View>
            <Text style={styles.noTodayTxt}>No specific promise for today.</Text>
            <Text style={styles.noTodaySubTe}>ఈ రోజు వాగ్దానం ఇంకా నవీకరించబడలేదు.</Text>
            <Text style={styles.noTodayHint}>Please browse our past promises below for daily inspiration.</Text>
          </View>
        )}

        <View style={styles.historySection}>
          <Text style={styles.historyLabel}>Past promises</Text>
          <View style={styles.historyCard}>
            {promises.filter(p => p.date !== new Date().toISOString().split('T')[0]).slice(0, 10).map((item, index) => {
              const refString = `${item.verseReferenceEn || ''}${item.verseReferenceEn && item.verseReferenceTe ? ' - ' : ''}${item.verseReferenceTe || ''}` || stripHtml(item.verse).substring(0, 25) + '...';

              return (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => {
                    setSelectedPromise(item);
                    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
                  }}
                  style={[
                    styles.historyItem,
                    selectedPromise?.id === item.id && { backgroundColor: '#f1f5f9' },
                    index === Math.min(promises.length - 1, 9) && { borderBottomWidth: 0 }
                  ]}
                >
                  <View style={styles.historyItemContent}>
                    <Text style={styles.historyItemRef}>{refString}</Text>
                    <Text style={styles.historyItemVakyam} numberOfLines={1}>{stripHtml(item.verseTelugu) || 'వాగ్దానము'}</Text>
                    <Text style={styles.historyItemDate}>
                      {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · {new Date(item.date).toLocaleDateString('en-US', { weekday: 'short' })}
                    </Text>
                  </View>
                  <ChevronRight size={16} color="#D1D5DB" />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f2f7' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Header
  pageHeader: {
    backgroundColor: '#1a2d5a',
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingHorizontal: 16,
    paddingBottom: 14,
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
  mainContent: { padding: 16 },
  topDate: { fontSize: 11, fontWeight: '700', color: '#94a3b8', textAlign: 'center', marginBottom: 15, letterSpacing: 0.5 },

  heroCard: { backgroundColor: '#1a2d5a', borderRadius: 24, padding: 24, elevation: 12, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 15 },
  heroHeader: { marginBottom: 20 },
  heroRefEn: { fontSize: 13, fontWeight: '800', color: '#FCD34D' },
  heroRefTe: { color: 'rgba(255,255,255,0.7)', fontWeight: '600' },

  verseEn: { fontSize: 19, fontWeight: '700', fontStyle: 'italic', color: '#fff', textAlign: 'center', lineHeight: 28, marginBottom: 15 },
  verseTe: { fontSize: 16, fontStyle: 'italic', color: '#aac4e8', textAlign: 'center', lineHeight: 26, marginBottom: 25 },

  heroActions: { flexDirection: 'row', gap: 12, marginTop: 10 },
  actionBtn: { flex: 1, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  actionBtnTxt: { color: '#fff', fontSize: 13, fontWeight: '700' },

  reflectionBox: { backgroundColor: '#fff', borderRadius: 20, padding: 22, marginTop: 15, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, borderWidth: 1, borderColor: '#f1f5f9' },
  reflectionTitle: { fontSize: 13, fontWeight: '800', color: '#1a2d5a', marginBottom: 12 },
  reflectionText: { fontSize: 14, color: '#475569', lineHeight: 24, marginBottom: 15 },
  reflectionAuthor: { fontSize: 12, color: '#94a3b8', fontWeight: '600' },

  devotionalBar: { backgroundColor: '#111827', borderRadius: 20, padding: 16, marginTop: 15, flexDirection: 'row', alignItems: 'center', gap: 12 },
  playCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  devotionalInfo: { flex: 1 },
  devotionalTitle: { fontSize: 14, fontWeight: '700', color: '#fff', marginBottom: 2 },
  devotionalSubTe: { fontSize: 12, color: '#FCD34D', marginBottom: 4, fontWeight: '600' },
  devotionalSub: { fontSize: 11, color: '#94a3b8' },

  noTodayCard: { backgroundColor: '#fff', borderRadius: 24, padding: 30, margin: 16, alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, borderWidth: 1, borderColor: '#f1f5f9' },
  noTodayIcon: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  noTodayTxt: { fontSize: 17, fontWeight: '800', color: '#1a2d5a', marginBottom: 8, textAlign: 'center' },
  noTodaySubTe: { fontSize: 14, color: '#c0392b', marginBottom: 15, fontWeight: '600', textAlign: 'center' },
  noTodayHint: { fontSize: 12, color: '#64748b', textAlign: 'center', lineHeight: 18 },

  historySection: { paddingHorizontal: 16, paddingBottom: 20 },
  historyLabel: { fontSize: 14, fontWeight: '700', color: '#1a2d5a', marginTop: 10, marginBottom: 15, marginLeft: 4 },
  historyCard: { backgroundColor: '#fff', borderRadius: 24, overflow: 'hidden', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, borderWidth: 1, borderColor: '#f1f5f9' },
  historyItem: { flexDirection: 'row', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#f8fafc' },
  historyItemContent: { flex: 1 },
  historyItemRef: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 2 },
  historyItemVakyam: { fontSize: 14, color: '#475569', marginBottom: 6, fontStyle: 'italic' },
  historyItemDate: { fontSize: 13, color: '#b45309', fontWeight: '500' },
});

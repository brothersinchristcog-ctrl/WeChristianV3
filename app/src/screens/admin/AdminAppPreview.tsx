import React, { useState, useEffect, useContext } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  Dimensions,
  Platform,
  StatusBar,
  Share,
  Linking
} from 'react-native';
import { 
  Play, 
  Share2, 
  Bookmark, 
  ChevronRight, 
  Mic2,
  Smartphone,
  ArrowLeft,
  Settings,
  Edit2
} from 'lucide-react-native';
import { AdminTabContext } from '../../context/AdminTabContext';

import FirestoreService, { DailyPromise } from '../../services/FirestoreService';

const { width } = Dimensions.get('window');

export default function AdminAppPreview() {
  const { setActiveTab } = useContext(AdminTabContext);
  const [promise, setPromise] = useState<DailyPromise | null>(null);
  const [sermons, setSermons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      console.log('🔄 [AdminAppPreview] Fetching live data from Salesforce...');
      
      // 1. Fetch Latest Promise (not just today)
      const promiseSoql = `SELECT Id, Promises__c, Promise_text_telugu__c, Date__c, Devotional_Note__c, Pastor_Name__c, YouTube_ID__c, Name, Verse_Reference_En__c, Verse_Reference_Te__c FROM Daily_Promises__c WHERE Status__c = 'Published' ORDER BY Date__c DESC LIMIT 1`;
      const promiseResult = await FirestoreService.query(promiseSoql).catch(() => null);
      
      if (promiseResult && promiseResult.totalSize > 0) {
        const rec = promiseResult.records[0];
        setPromise({
          id: rec.Id,
          verse: rec.Promises__c,
          verseTelugu: rec.Promise_text_telugu__c,
          date: rec.Date__c,
          devotionalNote: rec.Devotional_Note__c,
          pastor: rec.Pastor_Name__c,
          youtubeId: FirestoreService.extractYoutubeId(rec.YouTube_ID__c),
          verseReference: rec.Name,
          verseReferenceEn: rec.Verse_Reference_En__c,
          verseReferenceTe: rec.Verse_Reference_Te__c
        });
      }

      // 2. Fetch Latest Sermons
      const s = await FirestoreService.getSermons(5);
      setSermons(s);
      
      console.log(`✅ [AdminAppPreview] Loaded ${s.length} sermons and latest promise.`);
    } catch (err) {
      console.error('❌ [AdminAppPreview] Data Load Failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const stripHtml = (html: string) => {
    if (!html) return '';
    return html.replace(/<[^>]*>?/gm, '');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FCD34D" />
      </View>
    );
  }

  const handleShare = async () => {
    if (!promise) return;
    try {
      const message = `${stripHtml(promise.verse)}\n\n— ${promise.verseReferenceEn}\n\n${promise.verseTelugu ? stripHtml(promise.verseTelugu) + '\n\n' : ''}Your Church`;
      await Share.share({ message });
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenLink = (urlOrId?: string) => {
    if (!urlOrId) return;
    
    let finalUrl = urlOrId;
    // Synthesize YouTube URL if it's just an ID
    if (!urlOrId.includes('http') && urlOrId.length === 11) {
      finalUrl = `https://www.youtube.com/watch?v=${urlOrId}`;
    }

    Linking.openURL(finalUrl).catch(err => console.error("Couldn't load page", err));
  };

  const latestSermon = sermons[0];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* ── Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>App Preview</Text>
          <Text style={styles.headerSub}>How members see content in app</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        
        {/* ── Info Banner ── */}
        <View style={styles.infoBanner}>
          <Smartphone size={14} color="#1a2d5a" />
          <Text style={styles.infoBannerTxt}>Exact member view — Daily Promise card and Sermon library screen.</Text>
        </View>

        {/* ── SECTION 1: DAILY PROMISE ── */}
        <Text style={styles.sectionHd}>Daily Promise — member view</Text>
        
        <View style={styles.promiseContainer}>
          <Text style={styles.todayPromiseHd}>TODAY'S PROMISE - ఈ రోజు వాక్యం</Text>
          
          <View style={styles.navyCard}>
            <Text style={styles.refTxt}>{promise?.verseReferenceEn || promise?.verseReference || 'Reference'} · {promise?.verseReferenceTe || ''}</Text>
            <Text style={styles.verseEn} numberOfLines={3}>"{stripHtml(promise?.verse || 'No promise content available for today.')}"</Text>
            <Text style={styles.verseTe} numberOfLines={3}>{promise?.verseTelugu ? `"${stripHtml(promise.verseTelugu)}"` : ''}</Text>
            <Text style={styles.refBottom}>— {promise?.verseReferenceEn || promise?.verseReference || ''} / {promise?.verseReferenceTe || ''}</Text>
            
            <View style={styles.pActionRow}>
              <TouchableOpacity style={styles.pBtnNavy}>
                <Bookmark size={14} color="#aac4e8" />
                <Text style={styles.pBtnNavyTxt}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.pBtnRed} onPress={handleShare}>
                <Share2 size={14} color="#fff" />
                <Text style={styles.pBtnRedTxt}>Share</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.reflectionBox}>
            <Text style={styles.reflectionHd}>Pastor's reflection</Text>
            <Text style={styles.reflectionTxt} numberOfLines={4}>
              {stripHtml(promise?.devotionalNote || "No reflection available for this promise.")}
            </Text>
            <Text style={styles.reflectionPastor}>— {promise?.pastor || 'Pastor'}</Text>
          </View>

          <TouchableOpacity style={styles.devotionalBar} onPress={() => handleOpenLink(promise?.youtubeId)}>
            <View style={styles.playIconBox}>
              <Play size={12} color="#fff" fill="#fff" />
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.devotTitle}>Today's 1-min devotional</Text>
              <Text style={styles.devotSub}>{promise?.verseReferenceEn || promise?.verseReference || ''} · {promise?.duration || '58 seconds'}</Text>
            </View>
            <ChevronRight size={16} color="#c0392b" />
          </TouchableOpacity>
        </View>

        {/* ── SECTION 2: SERMON LIBRARY ── */}
        <Text style={[styles.sectionHd, { marginTop: 30 }]}>Sermon library — member view</Text>
        
        <View style={styles.libraryContainer}>
          {/* Latest Sermon Card */}
          <View style={styles.latestSermonCard}>
            <Text style={styles.latestBadge}>LATEST SERMON - తాజా ప్రసంగం</Text>
            <Text style={styles.latestTitleEn}>{latestSermon?.title || 'Loading Latest Sermon...'}</Text>
            <Text style={styles.latestTitleTe}>{latestSermon?.titleTelugu || ''}</Text>
            <Text style={styles.latestMeta}>
              {latestSermon?.pastor || 'Pastor'} · {latestSermon?.date ? new Date(latestSermon.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''} · {latestSermon?.scripture || ''} · {latestSermon?.duration || ''}
            </Text>
            
            <View style={styles.sermonActionRow}>
              <TouchableOpacity 
                style={styles.sBtnRed} 
                onPress={() => handleOpenLink(latestSermon?.youtubeId)}
              >
                <Play size={14} color="#fff" fill="#fff" />
                <Text style={styles.sBtnRedTxt}>Watch</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.sBtnNavy} 
                onPress={() => handleOpenLink(latestSermon?.audioUrl)}
              >
                <Mic2 size={14} color="#aac4e8" />
                <Text style={styles.sBtnNavyTxt}>Listen</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Sermon Feed */}
          <View style={styles.sermonFeed}>
            {sermons.slice(1).map((item, idx) => (
              <TouchableOpacity key={idx} style={styles.sermonItem} onPress={() => handleOpenLink(item.youtubeId || item.audioUrl)}>
                <View style={styles.itemIconBox}>
                  {item.youtubeId ? <Play size={16} color="#1a2d5a" /> : <Mic2 size={16} color="#1a2d5a" />}
                </View>
                <View style={{ flex: 1, marginLeft: 15 }}>
                  <Text style={item.title === 'No Recent Sermon' ? {color: '#94a3b8'} : styles.itemTitleEn}>{item.title}</Text>
                  <Text style={styles.itemTitleTe}>{item.titleTelugu}</Text>
                  <Text style={styles.itemMeta}>{item.pastor} · {item.date} · {item.duration}</Text>
                  <View style={styles.tagRow}>
                    <View style={styles.tag}><Text style={styles.tagTxt}>Sermon</Text></View>
                    <View style={styles.tag}><Text style={[styles.tagTxt, { color: '#15803D' }]}>▶️ {item.youtubeId ? 'YouTube' : 'Audio'}</Text></View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.navSection}>
          <TouchableOpacity 
            style={styles.navBtn}
            onPress={() => setActiveTab(0)}
          >
            <Edit2 size={16} color="#1a2d5a" />
            <Text style={styles.navBtnTxt}>Edit Promise content</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.navBtn}
            onPress={() => setActiveTab(3)}
          >
            <Settings size={16} color="#1a2d5a" />
            <Text style={styles.navBtnTxt}>Edit Sermon content</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footerBranding}>
          <Text style={styles.footerBrandingTxt}>App Preview · Your Church</Text>
        </View>
        <View style={{ height: 60 }} />
      </ScrollView>

      {/* FAB to go back to Admin */}
      <TouchableOpacity style={styles.fab} onPress={() => setActiveTab(3)}>
        <ArrowLeft size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' },
  
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#1a2d5a' },
  headerSub: { fontSize: 12, color: '#64748b', marginTop: 2 },

  scroll: { paddingBottom: 40 },

  infoBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0f7ff', padding: 12, marginHorizontal: 20, marginTop: 15, borderRadius: 10, borderWidth: 0.5, borderColor: '#aac4e8' },
  infoBannerTxt: { fontSize: 11, color: '#1a2d5a', marginLeft: 10, fontWeight: '500' },

  sectionHd: { fontSize: 13, fontWeight: '700', color: '#64748b', marginHorizontal: 20, marginTop: 20, marginBottom: 15 },

  promiseContainer: { paddingHorizontal: 20 },
  todayPromiseHd: { fontSize: 9, fontWeight: '800', color: '#94a3b8', textAlign: 'center', marginBottom: 10, letterSpacing: 0.5 },
  
  navyCard: { backgroundColor: '#1a2d5a', borderRadius: 16, padding: 20, elevation: 5, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10 },
  refTxt: { fontSize: 10, color: '#FCD34D', fontWeight: '700', marginBottom: 15 },
  verseEn: { fontSize: 14, fontWeight: '700', color: '#fff', lineHeight: 22, marginBottom: 10 },
  verseTe: { fontSize: 14, fontWeight: '500', color: '#aac4e8', lineHeight: 24, fontStyle: 'italic', marginBottom: 15 },
  refBottom: { fontSize: 11, color: '#FCD34D', fontWeight: '600', marginBottom: 20 },
  
  pActionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  pBtnNavy: { flex: 1, height: 40, backgroundColor: '#253b70', borderRadius: 8, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 8 },
  pBtnNavyTxt: { color: '#fff', fontSize: 12, fontWeight: '600' },
  pBtnRed: { flex: 1, height: 40, backgroundColor: '#c0392b', borderRadius: 8, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 8 },
  pBtnRedTxt: { color: '#fff', fontSize: 12, fontWeight: '600' },

  reflectionBox: { marginTop: 20, paddingHorizontal: 5 },
  reflectionHd: { fontSize: 11, fontWeight: '800', color: '#1a2d5a', marginBottom: 8 },
  reflectionTxt: { fontSize: 12, color: '#475569', lineHeight: 20 },
  reflectionPastor: { fontSize: 11, color: '#64748b', marginTop: 8, fontWeight: '600' },

  devotionalBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a2d5a', borderRadius: 12, padding: 15, marginTop: 20 },
  playIconBox: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#253b70', justifyContent: 'center', alignItems: 'center' },
  devotTitle: { color: '#fff', fontSize: 12, fontWeight: '700' },
  devotSub: { color: '#94a3b8', fontSize: 10, marginTop: 2 },

  libraryContainer: { paddingHorizontal: 20 },
  latestSermonCard: { backgroundColor: '#1a2d5a', borderRadius: 16, padding: 20, marginBottom: 20 },
  latestBadge: { fontSize: 10, fontWeight: '800', color: '#FCD34D', marginBottom: 12 },
  latestTitleEn: { fontSize: 18, fontWeight: '800', color: '#fff', marginBottom: 5 },
  latestTitleTe: { fontSize: 16, fontWeight: '600', color: '#aac4e8', fontStyle: 'italic', marginBottom: 12 },
  latestMeta: { fontSize: 11, color: '#94a3b8', marginBottom: 20 },

  sermonActionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  sBtnRed: { flex: 1, height: 44, backgroundColor: '#c0392b', borderRadius: 8, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 8 },
  sBtnRedTxt: { color: '#fff', fontSize: 13, fontWeight: '700' },
  sBtnNavy: { flex: 1, height: 44, backgroundColor: '#253b70', borderRadius: 8, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 8 },
  sBtnNavyTxt: { color: '#fff', fontSize: 13, fontWeight: '700' },

  sermonFeed: { gap: 15 },
  sermonItem: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 16, padding: 15, borderWidth: 0.5, borderColor: '#e2e8f0' },
  itemIconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' },
  itemTitleEn: { fontSize: 14, fontWeight: '700', color: '#1a2d5a' },
  itemTitleTe: { fontSize: 13, fontWeight: '500', color: '#475569', marginTop: 2 },
  itemMeta: { fontSize: 10, color: '#94a3b8', marginTop: 5 },
  
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  tag: { backgroundColor: '#f1f5f9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  tagTxt: { fontSize: 9, fontWeight: '700', color: '#1a2d5a' },

  footerBranding: { marginTop: 40, alignItems: 'center' },
  footerBrandingTxt: { fontSize: 10, color: '#94a3b8', fontWeight: '500' },

  fab: { position: 'absolute', right: 20, bottom: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: '#c0392b', justifyContent: 'center', alignItems: 'center', elevation: 8, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 10 },

  navSection: { paddingHorizontal: 20, marginTop: 20, gap: 12 },
  navBtn: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#fff', borderWidth: 1, borderColor: '#1a2d5a', borderRadius: 12, paddingVertical: 14, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5 },
  navBtnTxt: { color: '#1a2d5a', fontSize: 13, fontWeight: '700' }
});

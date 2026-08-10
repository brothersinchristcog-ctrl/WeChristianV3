import React, { useState, useEffect, useContext } from 'react';
import { 
  Platform,
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  RefreshControl,
  StatusBar
} from 'react-native';
import { AlertCircle, Plus, Check, ChevronLeft } from 'lucide-react-native';
import { AdminTabContext } from '../../context/AdminTabContext';

import FirestoreService, { DailyPromise } from '../../services/FirestoreService';

const colors = {
  ink: '#1a2d5a',
  ink2: '#22304F',
  inkSoft: '#6B7593',
  parchment: '#F3EAD9',
  paper: '#FFFCF5',
  gold: '#A67C3D',
  goldDeep: '#8C6428',
  goldBright: '#D8B369',
  clay: '#A24B34',
  clayBg: '#F3E1D6',
  clayLine: '#E3C3B2',
  moss: '#3E6B52',
  mossBg: '#E6EFE7',
  rule: '#DED0AC',
};

const serifFont = Platform.OS === 'ios' ? 'Georgia' : 'serif';

export default function AdminPromiseList() {
  const { setActiveTab, setEditingData } = useContext(AdminTabContext);
  const [promises, setPromises] = useState<DailyPromise[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [missingDates, setMissingDates] = useState<number[]>([]);
  
  const todayStr = (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; })();

  const handleEdit = (item: DailyPromise) => {
    setEditingData(item);
    setActiveTab(1);
  };

  const handleView = (item: DailyPromise) => {
    setEditingData(item);
    setActiveTab(1);
  };

  useEffect(() => {
    loadPromises();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPromises();
    setRefreshing(false);
  };

  const loadPromises = async () => {
    setLoading(true);
    try {
      const data = await FirestoreService.getDailyPromisesArchive();
      setPromises(data);
      
      const now = new Date();
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const existingDates = new Set(data.map(p => p.date));
      const missing: number[] = [];
      for (let d = 1; d <= daysInMonth; d++) {
        const dStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        if (!existingDates.has(dStr)) missing.push(d);
      }
      setMissingDates(missing);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const todayPromise = promises.find(p => p.date === todayStr);
  const upcoming = promises.filter(p => p.date && p.date > todayStr).sort((a,b) => (a.date || '').localeCompare(b.date || ''));
  const past = promises.filter(p => p.date && p.date < todayStr).sort((a,b) => (b.date || '').localeCompare(a.date || ''));

  const stats = {
    published: promises.filter(p => p.status === 'Published').length,
    draft: promises.filter(p => p.status === 'Draft').length,
    missing: missingDates.length
  };

  if (loading && promises.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.goldBright} />
      </View>
    );
  }

  const stripHtml = (html: string) => {
    if (!html) return '';
    return html.replace(/<[^>]*>?/gm, '').replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
  };

  const renderCard = (item: DailyPromise, type: 'today' | 'upcoming' | 'past') => {
    const isMissingTe = !item.verseTelugu;
    const isMissingLink = !item.youtubeId;

    let displayDate = item.date;
    if (item.date) {
      const parts = item.date.split('-');
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        displayDate = `${d.getDate()} ${monthNames[d.getMonth()]} ${d.getFullYear()}`;
      }
    }

    const verseTextEn = stripHtml(item.verse);
    const firstChar = verseTextEn.charAt(0);
    const restChar = verseTextEn.slice(1);

    return (
      <View key={item.id} style={styles.verseCard}>
        <View style={styles.vcBand}>
          <Text style={styles.vcDate}>{displayDate}</Text>
          <View style={styles.seal}>
            {type === 'upcoming' ? <Plus size={14} color={colors.ink} /> : <Check size={14} color={colors.ink} strokeWidth={3} />}
          </View>
        </View>

        <View style={styles.vcBody}>
          <View style={styles.vcRef}>
            {(item.verseReferenceEn || item.verseReference) && (
              <View style={styles.tag}><Text style={styles.tagText}>{item.verseReferenceEn || item.verseReference}</Text></View>
            )}
            {item.verseReferenceTe && (
              <View style={styles.tag}><Text style={[styles.tagText, { fontStyle: 'italic' }]}>{item.verseReferenceTe}</Text></View>
            )}
            {(item as any).author && (
              <>
                <Text style={styles.dot}>•</Text>
                <Text style={styles.author}>{(item as any).author}</Text>
              </>
            )}
          </View>

          <Text style={styles.vcQuote}>
            <Text style={styles.dropCap}>{firstChar}</Text>
            {restChar}
          </Text>
          
          {item.verseTelugu ? (
            <Text style={styles.vcQuoteTel}>
              {stripHtml(item.verseTelugu)}
            </Text>
          ) : null}

          <View style={styles.vcBottom}>
            <View style={styles.vcFlags}>
              <Text style={styles.flagOn}>✓ English</Text>
              <Text style={isMissingTe ? styles.flagOff : styles.flagOn}>{isMissingTe ? '✗ Telugu' : '✓ Telugu'}</Text>
              <Text style={isMissingLink ? styles.flagOff : styles.flagOn}>{isMissingLink ? '▶ No link' : '▶ YouTube'}</Text>
            </View>
            <TouchableOpacity onPress={() => type === 'past' ? handleView(item) : handleEdit(item)}>
              <Text style={styles.viewLink}>View →</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  // Get current date for Ribbon
  const d = new Date();
  const monthNamesShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const todayRibbonStr = `${d.getDate()} ${monthNamesShort[d.getMonth()]}`;
  const displayDateFullStr = `${d.getDate()} ${['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][d.getMonth()]} ${d.getFullYear()}`;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <View style={styles.hero}>
        <View style={styles.heroTitleRow}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
            <TouchableOpacity onPress={() => setActiveTab(0)} style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
              <ChevronLeft size={20} color="#fff" style={{ marginLeft: -6, marginRight: 4 }} />
              <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>Back</Text>
            </TouchableOpacity>
            <Text style={[styles.heroTitle, { marginHorizontal: 12, opacity: 0.4 }]}>|</Text>
            <View>
              <Text style={styles.heroTitle}>Daily Promises</Text>
            </View>
          </View>
          
          <View style={{ flex: 1 }} />
          <TouchableOpacity style={styles.newBtn} onPress={() => { setEditingData(null); setActiveTab(2); }}>
            <Text style={styles.newBtnTxt}>+ New</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>

        <View style={styles.content}>
          <View style={styles.stats}>
            <View style={styles.statBox}>
              <View style={[styles.statNotch, { backgroundColor: colors.moss }]} />
              <Text style={[styles.num, { color: colors.moss }]}>{stats.published}</Text>
              <Text style={styles.statLabel}>Published</Text>
            </View>
            <View style={styles.statBox}>
              <View style={[styles.statNotch, { backgroundColor: colors.gold }]} />
              <Text style={[styles.num, { color: colors.goldDeep }]}>{stats.draft}</Text>
              <Text style={styles.statLabel}>Drafts</Text>
            </View>
            <View style={styles.statBox}>
              <View style={[styles.statNotch, { backgroundColor: colors.clay }]} />
              <Text style={[styles.num, { color: colors.clay }]}>{stats.missing}</Text>
              <Text style={styles.statLabel}>Missing</Text>
            </View>
          </View>

          <View style={styles.alert}>
            <AlertCircle size={20} color={colors.clay} style={{ marginTop: 2 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.alertTitle}>{missingDates.length} days are still empty.</Text>
              <Text style={styles.alertText}>Nothing is scheduled for the dates below. Fill them in before the queue catches up.</Text>
            </View>
          </View>

          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>Today</Text>
            <View style={styles.sectionTitleLine} />
          </View>
          {todayPromise ? renderCard(todayPromise, 'today') : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>Nothing is scheduled for <Text style={styles.dateTag}>{displayDateFullStr}</Text> yet.</Text>
              <TouchableOpacity style={styles.ghostBtn} onPress={() => { setEditingData({ date: todayStr }); setActiveTab(2); }}>
                <Text style={styles.ghostBtnTxt}>+ Schedule today's promise</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>Upcoming</Text>
            <View style={styles.sectionTitleLine} />
          </View>
          {upcoming.length > 0 ? (
            upcoming.slice(0, 10).map(item => renderCard(item, 'upcoming'))
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No promises scheduled ahead. Add a few days now to stay ahead of the queue.</Text>
            </View>
          )}

          <View style={styles.missingHead}>
            <Text style={styles.missingTitle}>Missing dates ({missingDates.length})</Text>
            <TouchableOpacity style={styles.fillAll} onPress={() => {
              if (missingDates.length > 0) {
                const now = new Date();
                const dStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(missingDates[0]).padStart(2, '0')}`;
                setEditingData({ date: dStr });
                setActiveTab(2);
              }
            }}>
              <Text style={styles.fillAllTxt}>Fill all</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.missingGrid}>
            {missingDates.slice(0, 6).map(d => {
              const monthStr = monthNamesShort[(new Date()).getMonth()];
              return (
                <TouchableOpacity key={d} style={styles.missingCell} onPress={() => { 
                  const now = new Date();
                  const dStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                  setEditingData({ date: dStr }); 
                  setActiveTab(2); 
                }}>
                  <View style={styles.missingMonth}><Text style={styles.missingMonthTxt}>{monthStr}</Text></View>
                  <Text style={styles.missingDay}>{d}</Text>
                  <View style={styles.missingDash} />
                  <Text style={styles.missingAdd}>+ Add</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>Past Promises</Text>
            <View style={styles.sectionTitleLine} />
          </View>
          {past.slice(0, 2).map(item => renderCard(item, 'past'))}



          <Text style={styles.footerBranding}>Church Admin · Daily Promise Manager</Text>
          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => { setEditingData(null); setActiveTab(1); }}>
        <Plus size={32} color={colors.ink} strokeWidth={3} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.parchment },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.parchment },

  scroll: { paddingBottom: 20 },
  
  // Hero
  hero: { 
    backgroundColor: colors.ink, 
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
    paddingHorizontal: 22,
    paddingTop: 10,
    paddingBottom: 24,
    overflow: 'visible',
    position: 'relative'
  },
  heroTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', marginBottom: 6 },
  heroTitle: { color: '#fff', fontSize: 24, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', fontWeight: '600', letterSpacing: -0.5, marginBottom: 0 },
  newBtn: { marginLeft: 24, minWidth: 90, alignItems: 'center', backgroundColor: colors.goldBright, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 100, elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, shadowOffset: {width: 0, height: 2} },
  newBtnTxt: { color: colors.ink, fontSize: 12, fontWeight: '700' },

  content: { paddingHorizontal: 16 },

  // Stats
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16, marginTop: 16 },
  statBox: { flex: 1, backgroundColor: colors.paper, borderRadius: 10, paddingVertical: 10, alignItems: 'center', elevation: 2, shadowColor: colors.ink, shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, borderWidth: 1, borderColor: 'rgba(21,28,51,0.05)', position: 'relative' },
  statNotch: { position: 'absolute', top: -1, width: 20, height: 3, borderBottomLeftRadius: 3, borderBottomRightRadius: 3 },
  num: { fontFamily: serifFont, fontSize: 22, fontWeight: '600', marginBottom: 4 },
  statLabel: { fontSize: 9.5, textTransform: 'uppercase', letterSpacing: 1, color: colors.inkSoft, fontWeight: '600' },

  // Alert
  alert: { backgroundColor: colors.clayBg, borderColor: colors.clayLine, borderWidth: 1, borderLeftWidth: 3, borderLeftColor: colors.clay, borderRadius: 12, padding: 14, flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 26, alignItems: 'flex-start' },
  alertTitle: { fontFamily: serifFont, color: colors.clay, fontWeight: '600', fontSize: 14.5, marginBottom: 3 },
  alertText: { fontSize: 13, color: '#7C4028', lineHeight: 18 },

  // Sections
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, marginTop: 10 },
  sectionTitle: { fontFamily: serifFont, fontSize: 14, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase', color: colors.inkSoft, marginRight: 8 },
  sectionTitleLine: { flex: 1, height: 1, backgroundColor: colors.rule },

  // Empty Cards
  emptyCard: { borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.gold, borderRadius: 16, backgroundColor: colors.paper, padding: 24, alignItems: 'center', marginBottom: 24 },
  emptyText: { fontSize: 14, color: colors.inkSoft, lineHeight: 21, textAlign: 'center', marginBottom: 14 },
  dateTag: { fontFamily: serifFont, fontWeight: '600', color: colors.ink },
  ghostBtn: { backgroundColor: colors.ink, paddingHorizontal: 20, paddingVertical: 11, borderRadius: 100, borderWidth: 1, borderColor: colors.gold },
  ghostBtnTxt: { color: '#fff', fontSize: 13, fontWeight: '600' },

  // Missing Dates
  missingHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  missingTitle: { fontFamily: serifFont, fontSize: 16, fontWeight: '600', color: colors.clay },
  fillAll: { backgroundColor: colors.clay, paddingHorizontal: 16, paddingVertical: 9, borderRadius: 100 },
  fillAllTxt: { color: '#fff', fontSize: 12.5, fontWeight: '700' },
  missingGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 30 },
  missingCell: { width: '31%', backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.clayLine, borderRadius: 8, alignItems: 'center', overflow: 'hidden', paddingBottom: 6 },
  missingMonth: { backgroundColor: colors.clay, width: '100%', alignItems: 'center', paddingVertical: 4 },
  missingMonthTxt: { color: '#fff', fontSize: 8, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  missingDay: { fontFamily: serifFont, fontSize: 14, fontWeight: '600', color: colors.ink, marginVertical: 4 },
  missingDash: { width: '60%', height: 1, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.clayLine, marginBottom: 4 },
  missingAdd: { fontSize: 9, color: colors.clay, fontWeight: '700', letterSpacing: 0.5 },

  // Verse Card
  verseCard: { backgroundColor: colors.paper, borderRadius: 10, elevation: 2, shadowColor: colors.ink, shadowOpacity: 0.1, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, marginBottom: 14, borderWidth: 1, borderColor: 'rgba(21,28,51,0.05)', overflow: 'hidden' },
  vcBand: { backgroundColor: colors.ink, paddingHorizontal: 14, paddingVertical: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  vcDate: { fontFamily: serifFont, fontSize: 13, fontWeight: '600', color: '#fff' },
  seal: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.goldBright, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.25)', elevation: 3 },
  vcBody: { paddingHorizontal: 14, paddingTop: 14, paddingBottom: 10 },
  vcRef: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 10 },
  tag: { backgroundColor: colors.parchment, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 100, borderWidth: 1, borderColor: colors.rule },
  tagText: { fontSize: 10, color: colors.inkSoft, fontWeight: '600' },
  dot: { color: colors.gold, fontSize: 9 },
  author: { fontSize: 11, color: colors.goldDeep, fontWeight: '700' },
  vcQuote: { fontFamily: serifFont, fontStyle: 'italic', fontSize: 14, lineHeight: 20, color: colors.ink, marginBottom: 8 },
  dropCap: { fontFamily: serifFont, fontSize: 28, fontWeight: '600', color: colors.gold },
  vcQuoteTel: { fontStyle: 'italic', fontSize: 12.5, lineHeight: 18, color: colors.inkSoft, marginBottom: 10 },
  vcBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.rule, borderStyle: 'dashed' },
  vcFlags: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  flagOn: { fontSize: 10, color: colors.moss, fontWeight: '600' },
  flagOff: { fontSize: 10, color: '#C4B896', fontWeight: '600' },
  viewLink: { fontSize: 11, fontWeight: '700', color: colors.ink },

  footerBranding: { textAlign: 'center', paddingTop: 20, paddingBottom: 8, fontSize: 11, letterSpacing: 0.8, color: '#B3A67E', textTransform: 'uppercase', fontWeight: '600' },

  fab: { position: 'absolute', bottom: 26, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: colors.goldBright, justifyContent: 'center', alignItems: 'center', elevation: 6, shadowColor: '#8C6428', shadowOpacity: 0.6, shadowRadius: 10, shadowOffset: { width: 0, height: 6 }, borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)' }
});

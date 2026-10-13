import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput, Alert, ActivityIndicator, Platform } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import { UploadCloud, Trash2, Eye, Pencil, X, RefreshCw } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const PERIOD_NAMES = ['Morning', 'Afternoon', 'Evening', 'Night'];
const PERIOD_TIMES = ['6:00 AM', '12:00 PM', '6:00 PM', '9:00 PM'];
const MS_PER_DAY = 1000 * 60 * 60 * 24;

// Module-level cache for instant 0ms tab switching
let cachedUpcomingVerses: any[] | null = null;
let cachedTotalVerses: number = 0;
let cachedAllVerses: any[] = [];
let allVersesLastDoc: any = null;
let allVersesHasMore: boolean = true;

export default function SuperAdminVersesManager({ searchQuery = '' }: { searchQuery?: string }) {
  const navigation = useNavigation<any>();

  const [upcomingVerses, setUpcomingVerses] = useState<any[]>(cachedUpcomingVerses || []);
  const [allVerses, setAllVerses] = useState<any[]>(cachedAllVerses);
  const [totalVerses, setTotalVerses] = useState<number>(cachedTotalVerses || 0);

  const [loading, setLoading] = useState(!cachedUpcomingVerses);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [showInput, setShowInput] = useState(false);
  const [timelineTab, setTimelineTab] = useState<'upcoming' | 'all'>('upcoming');
  const [selectedPeriod, setSelectedPeriod] = useState('All');
  const [editingVerse, setEditingVerse] = useState<any | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const PERIODS = ['All', 'Morning', 'Afternoon', 'Evening', 'Night'];

  // Current day calculation
  const { todayDaysSinceEpoch, todayMidnight } = useMemo(() => {
    const now = new Date();
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const epochMidnight = new Date(2024, 0, 1).getTime();
    const days = Math.floor((midnight - epochMidnight) / MS_PER_DAY);
    return { todayDaysSinceEpoch: days, todayMidnight: midnight };
  }, []);

  const todayBaseIndex = useMemo(() => {
    const total = totalVerses || 5863;
    return (todayDaysSinceEpoch * 4) % total;
  }, [todayDaysSinceEpoch, totalVerses]);

  // Fast schedule computation (No slow ICU toLocaleDateString calls)
  const getFastSchedule = useCallback((index: number) => {
    const periodIndex = (typeof index === 'number' && index >= 0) ? (index % 4) : 0;
    const period = PERIOD_NAMES[periodIndex] || 'Morning';
    const periodTime = PERIOD_TIMES[periodIndex] || '6:00 AM';

    const total = totalVerses || 5863;
    const delta = ((index - todayBaseIndex) % total + total) % total;
    const daysOffset = Math.floor(delta / 4);

    const isToday = daysOffset === 0;
    const isTomorrow = daysOffset === 1;

    let label = '';
    if (isToday) {
      label = `Today · ${period} (${periodTime})`;
    } else if (isTomorrow) {
      label = `Tomorrow · ${period} (${periodTime})`;
    } else {
      const targetTime = todayMidnight + daysOffset * MS_PER_DAY;
      const d = new Date(targetTime);
      label = `${MONTH_NAMES[d.getMonth()]} ${d.getDate()} · ${period} (${periodTime})`;
    }

    return { label, period, periodTime, periodIndex, isToday, isTomorrow, daysOffset };
  }, [totalVerses, todayBaseIndex, todayMidnight]);

  // Fetch upcoming verses fast using indexed range query (30 days = 120 verses)
  const fetchUpcomingVerses = async (forceRefresh = false) => {
    if (!forceRefresh && cachedUpcomingVerses && cachedUpcomingVerses.length > 0) {
      setUpcomingVerses(cachedUpcomingVerses);
      setTotalVerses(cachedTotalVerses);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // 1. Fetch metadata total
      const metaDoc = await firestore().collection('daily_verses_meta').doc('metadata').get();
      const metaExists = typeof metaDoc.exists === 'function' ? metaDoc.exists() : metaDoc.exists;
      const total = metaExists ? (metaDoc.data()?.totalVerses || 5863) : 5863;
      setTotalVerses(total);
      cachedTotalVerses = total;

      const baseIdx = (todayDaysSinceEpoch * 4) % total;
      const COUNT = 120; // 30 upcoming days (4 per day)

      let fetched: any[] = [];
      if (baseIdx + COUNT <= total) {
        const snap = await firestore().collection('daily_verses')
          .where('index', '>=', baseIdx)
          .where('index', '<', baseIdx + COUNT)
          .get();
        fetched = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      } else {
        // Wrapped around cycle
        const [snap1, snap2] = await Promise.all([
          firestore().collection('daily_verses').where('index', '>=', baseIdx).get(),
          firestore().collection('daily_verses').where('index', '<', (baseIdx + COUNT) % total).get(),
        ]);
        fetched = [...snap1.docs, ...snap2.docs].map(doc => ({ id: doc.id, ...doc.data() }));
      }

      // Sort starting chronologically from Today
      fetched.sort((a, b) => {
        const deltaA = ((a.index - baseIdx) % total + total) % total;
        const deltaB = ((b.index - baseIdx) % total + total) % total;
        return deltaA - deltaB;
      });

      cachedUpcomingVerses = fetched;
      setUpcomingVerses(fetched);
    } catch (error) {
      console.error('Error fetching upcoming verses:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch first page of All Verses (paginated 50 items)
  const fetchAllVersesInitial = async () => {
    if (cachedAllVerses.length > 0) {
      setAllVerses(cachedAllVerses);
      return;
    }
    try {
      setLoading(true);
      const snap = await firestore().collection('daily_verses')
        .orderBy('index')
        .limit(50)
        .get();

      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      cachedAllVerses = docs;
      allVersesLastDoc = snap.docs[snap.docs.length - 1];
      allVersesHasMore = snap.docs.length === 50;
      setAllVerses(docs);
    } catch (e) {
      console.error('Error fetching all verses:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMoreAll = async () => {
    if (loadingMore || !allVersesHasMore || !allVersesLastDoc || timelineTab !== 'all') return;
    try {
      setLoadingMore(true);
      const snap = await firestore().collection('daily_verses')
        .orderBy('index')
        .startAfter(allVersesLastDoc)
        .limit(50)
        .get();

      if (snap.docs.length > 0) {
        const newDocs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        const updated = [...allVerses, ...newDocs];
        cachedAllVerses = updated;
        allVersesLastDoc = snap.docs[snap.docs.length - 1];
        allVersesHasMore = snap.docs.length === 50;
        setAllVerses(updated);
      } else {
        allVersesHasMore = false;
      }
    } catch (e) {
      console.error('Error loading more verses:', e);
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchUpcomingVerses();
  }, []);

  const handleTabSwitch = (tab: 'upcoming' | 'all') => {
    setTimelineTab(tab);
    if (tab === 'all' && allVerses.length === 0) {
      fetchAllVersesInitial();
    }
  };

  // Instant filter memoization
  const activeList = timelineTab === 'upcoming' ? upcomingVerses : allVerses;
  const filteredVerses = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return activeList.filter(v => {
      const periodIdx = (typeof v.index === 'number' && v.index >= 0) ? (v.index % 4) : 0;
      const period = PERIOD_NAMES[periodIdx] || 'Morning';

      // 1. Period filter
      if (selectedPeriod !== 'All' && period !== selectedPeriod) {
        return false;
      }

      // 2. Search filter
      if (query.length > 0) {
        const vEn = (v.verseEn || '').toLowerCase();
        const vTe = (v.verseTe || '').toLowerCase();
        const rEn = (v.referenceEn || '').toLowerCase();
        const rTe = (v.referenceTe || '').toLowerCase();
        if (!vEn.includes(query) && !vTe.includes(query) && !rEn.includes(query) && !rTe.includes(query)) {
          return false;
        }
      }

      return true;
    });
  }, [activeList, selectedPeriod, searchQuery]);

  const handleUpdateVerse = async () => {
    if (!editingVerse || !editingVerse.id) return;
    setIsUpdating(true);
    try {
      await firestore().collection('daily_verses').doc(editingVerse.id).update({
        verseEn: editingVerse.verseEn,
        verseTe: editingVerse.verseTe,
        referenceEn: editingVerse.referenceEn,
        referenceTe: editingVerse.referenceTe,
      });

      const updateList = (list: any[]) => list.map(v => v.id === editingVerse.id ? editingVerse : v);
      setUpcomingVerses(prev => updateList(prev));
      setAllVerses(prev => updateList(prev));
      if (cachedUpcomingVerses) cachedUpcomingVerses = updateList(cachedUpcomingVerses);
      if (cachedAllVerses) cachedAllVerses = updateList(cachedAllVerses);

      setEditingVerse(null);
      Alert.alert('Success', 'Verse updated successfully!');
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to update verse.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteVerse = async (id: string, refText: string) => {
    Alert.alert(
      'Delete Verse',
      `Are you sure you want to delete this verse (${refText || 'Selected'})?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await firestore().collection('daily_verses').doc(id).delete();
              const filterList = (list: any[]) => list.filter(v => v.id !== id);
              setUpcomingVerses(prev => filterList(prev));
              setAllVerses(prev => filterList(prev));
              if (cachedUpcomingVerses) cachedUpcomingVerses = filterList(cachedUpcomingVerses);
              if (cachedAllVerses) cachedAllVerses = filterList(cachedAllVerses);
              Alert.alert('Deleted', 'Verse deleted successfully.');
            } catch (e: any) {
              Alert.alert('Error', e?.message || 'Failed to delete verse.');
            }
          },
        },
      ]
    );
  };

  const handleClearAll = async () => {
    Alert.alert('Confirm Delete', 'Are you sure you want to delete ALL daily verses?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setIsUploading(true);
          try {
            const snapshot = await firestore().collection('daily_verses').get();
            const batch = firestore().batch();
            snapshot.docs.forEach(doc => {
              batch.delete(doc.ref);
            });
            await batch.commit();
            cachedUpcomingVerses = null;
            cachedAllVerses = [];
            fetchUpcomingVerses(true);
          } catch (e) {
            console.error(e);
          } finally {
            setIsUploading(false);
          }
        },
      },
    ]);
  };

  const handleBulkUpload = async (directData?: any) => {
    try {
      const parsedData = directData || JSON.parse(jsonInput);
      if (!Array.isArray(parsedData)) {
        Alert.alert('Error', 'Input must be a JSON array of verses.');
        return;
      }

      setIsUploading(true);
      const versesRef = firestore().collection('daily_verses');

      let count = 0;
      let index = 0;
      const batches = [];
      let currentBatch = firestore().batch();

      for (const verse of parsedData) {
        if (verse.verseEn && verse.verseTe) {
          const docRef = versesRef.doc();
          currentBatch.set(docRef, {
            ...verse,
            index: index,
            createdAt: firestore.FieldValue.serverTimestamp(),
          });
          count++;
          index++;

          if (count % 450 === 0) {
            batches.push(currentBatch.commit());
            currentBatch = firestore().batch();
          }
        }
      }

      if (count % 450 !== 0) {
        batches.push(currentBatch.commit());
      }

      await Promise.all(batches);

      await firestore().collection('daily_verses_meta').doc('metadata').set({
        totalVerses: count,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      }, { merge: true });

      Alert.alert('Success', `Successfully uploaded ${count} verses.`);
      setJsonInput('');
      setShowInput(false);
      cachedUpcomingVerses = null;
      cachedAllVerses = [];
      fetchUpcomingVerses(true);
    } catch (error) {
      console.error(error);
      Alert.alert('Invalid JSON', 'Please check your JSON format.');
    } finally {
      setIsUploading(false);
    }
  };

  const renderVerseItem = useCallback(({ item }: { item: any }) => {
    const schedule = getFastSchedule(item.index);
    return (
      <View style={styles.verseCard}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ flex: 1 }}>
            <Text style={styles.verseEn}>"{item.verseEn}"</Text>
            <Text style={styles.refEn}>- {item.referenceEn}</Text>
            <View style={styles.divider} />
            <Text style={styles.verseTe}>"{item.verseTe}"</Text>
            <Text style={styles.refTe}>- {item.referenceTe}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 8 }}>
            <TouchableOpacity
              onPress={() => setEditingVerse({ ...item })}
              style={{ padding: 8, backgroundColor: '#334155', borderRadius: 8 }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Pencil size={16} color="#94a3b8" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleDeleteVerse(item.id, item.referenceEn || item.referenceTe)}
              style={{ padding: 8, backgroundColor: 'rgba(239, 68, 68, 0.2)', borderRadius: 8, marginLeft: 8 }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Trash2 size={16} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Schedule Badge */}
        <View style={[
          styles.scheduleBadge,
          schedule.isToday && styles.scheduleBadgeToday,
          schedule.isTomorrow && styles.scheduleBadgeTomorrow,
        ]}>
          <Text style={[
            styles.scheduleText,
            schedule.isToday && styles.scheduleTextToday,
            schedule.isTomorrow && styles.scheduleTextTomorrow,
          ]}>
            {schedule.isToday ? '🌟 ' : '📅 '}{schedule.label}
          </Text>
          <Text style={[styles.slotSubText, schedule.isToday && { color: '#fef3c7' }]}>
            (Slot {schedule.periodIndex + 1} · Idx {item.index})
          </Text>
        </View>
      </View>
    );
  }, [getFastSchedule]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {timelineTab === 'upcoming'
            ? `Today & Upcoming (${filteredVerses.length})`
            : `All Verses (${totalVerses || allVerses.length})`}
        </Text>
      </View>

      {/* Timeline Filter Toggle */}
      <View style={styles.tabToggleRow}>
        <TouchableOpacity
          style={[styles.tabToggleBtn, timelineTab === 'upcoming' && styles.tabToggleBtnActive]}
          onPress={() => handleTabSwitch('upcoming')}
        >
          <Text style={[styles.tabToggleTxt, timelineTab === 'upcoming' && styles.tabToggleTxtActive]}>
            🌟 Today & Upcoming
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabToggleBtn, timelineTab === 'all' && styles.tabToggleBtnActive]}
          onPress={() => handleTabSwitch('all')}
        >
          <Text style={[styles.tabToggleTxt, timelineTab === 'all' && styles.tabToggleTxtActive]}>
            📚 All Verses ({totalVerses || allVerses.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Period Filter Chips */}
      <View style={{ marginBottom: 14 }}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={PERIODS}
          keyExtractor={item => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.monthChip,
                selectedPeriod === item && styles.monthChipActive,
              ]}
              onPress={() => setSelectedPeriod(item)}
            >
              <Text style={[
                styles.monthChipText,
                selectedPeriod === item && styles.monthChipTextActive,
              ]}>{item}</Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: '#10b981', width: '100%', justifyContent: 'center', marginBottom: 10 }]}
          onPress={() => {
            const firstVerse = upcomingVerses[0] || allVerses[0];
            if (firstVerse) {
              navigation.navigate('VerseOfTheDay', { verseId: firstVerse.id, period: 'Morning' });
            } else {
              Alert.alert('No verses', 'Upload verses first to test the UI');
            }
          }}
        >
          <Eye size={16} color="#fff" />
          <Text style={styles.btnText}>Test Verse UI Screen</Text>
        </TouchableOpacity>

        <View style={{ flexDirection: 'row', gap: 10, width: '100%' }}>
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: '#ef4444', flex: 1, justifyContent: 'center' }]}
            onPress={handleClearAll}
          >
            <Trash2 size={16} color="#fff" />
            <Text style={styles.btnText}>Clear All</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btn, { backgroundColor: '#3b82f6', flex: 1, justifyContent: 'center' }]}
            onPress={() => setShowInput(!showInput)}
          >
            <UploadCloud size={16} color="#fff" />
            <Text style={styles.btnText}>{showInput ? 'Cancel' : 'Upload JSON'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btn, { backgroundColor: '#475569', paddingHorizontal: 12, justifyContent: 'center' }]}
            onPress={() => {
              cachedUpcomingVerses = null;
              cachedAllVerses = [];
              fetchUpcomingVerses(true);
            }}
          >
            <RefreshCw size={16} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {showInput && (
        <View style={styles.uploadSection}>
          <Text style={styles.label}>Paste JSON Array of verses:</Text>
          <Text style={styles.helper}>Format: [{`{ "verseEn": "Jesus wept.", "referenceEn": "John 11:35", "verseTe": "యేసు కన్నీళ్లు విడిచెను.", "referenceTe": "యోహాను 11:35" }`}]</Text>
          <TextInput
            style={styles.input}
            multiline
            value={jsonInput}
            onChangeText={setJsonInput}
            placeholder="[ { ... } ]"
            placeholderTextColor="#64748b"
          />
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: '#10b981', alignSelf: 'flex-end', marginTop: 10 }]}
            onPress={handleBulkUpload}
            disabled={isUploading}
          >
            {isUploading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.btnText}>Upload Verses</Text>}
          </TouchableOpacity>
        </View>
      )}

      {loading ? (
        <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 50 }} />
      ) : filteredVerses.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyTitle}>No Verses Found</Text>
          <Text style={styles.emptySub}>
            {timelineTab === 'upcoming' ? 'No verses scheduled for upcoming days matching this filter.' : 'No verses found.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredVerses}
          keyExtractor={item => item.id}
          renderItem={renderVerseItem}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
          removeClippedSubviews={Platform.OS === 'android'}
          onEndReached={timelineTab === 'all' ? handleLoadMoreAll : undefined}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator size="small" color="#3b82f6" style={{ marginVertical: 16 }} />
            ) : null
          }
        />
      )}

      {/* Edit Modal */}
      {editingVerse && (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 20, zIndex: 10 }]}>
          <View style={{ backgroundColor: '#1e293b', padding: 20, borderRadius: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
              <Text style={{ color: '#f8fafc', fontSize: 18, fontWeight: 'bold' }}>Edit Verse</Text>
              <TouchableOpacity onPress={() => setEditingVerse(null)}>
                <X size={20} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Verse (English)</Text>
            <TextInput style={[styles.input, { height: 80, marginBottom: 12 }]} multiline value={editingVerse.verseEn} onChangeText={t => setEditingVerse({...editingVerse, verseEn: t})} />

            <Text style={styles.label}>Reference (English)</Text>
            <TextInput style={[styles.input, { height: 45, marginBottom: 16 }]} value={editingVerse.referenceEn} onChangeText={t => setEditingVerse({...editingVerse, referenceEn: t})} />

            <Text style={styles.label}>Verse (Telugu)</Text>
            <TextInput style={[styles.input, { height: 80, marginBottom: 12 }]} multiline value={editingVerse.verseTe} onChangeText={t => setEditingVerse({...editingVerse, verseTe: t})} />

            <Text style={styles.label}>Reference (Telugu)</Text>
            <TextInput style={[styles.input, { height: 45, marginBottom: 20 }]} value={editingVerse.referenceTe} onChangeText={t => setEditingVerse({...editingVerse, referenceTe: t})} />

            <TouchableOpacity
              style={[styles.btn, { backgroundColor: '#3b82f6', justifyContent: 'center' }]}
              onPress={handleUpdateVerse}
              disabled={isUpdating}
            >
              {isUpdating ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.btnText}>Save Changes</Text>}
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  header: { alignItems: 'center', marginBottom: 12 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#f8fafc' },

  tabToggleRow: {
    flexDirection: 'row',
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 4,
    marginBottom: 14,
    gap: 6,
  },
  tabToggleBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 9,
  },
  tabToggleBtnActive: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#38bdf8',
  },
  tabToggleTxt: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600',
  },
  tabToggleTxtActive: {
    color: '#38bdf8',
    fontWeight: '700',
  },

  actions: { flexDirection: 'column', gap: 12, marginBottom: 20 },
  btn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8, gap: 8 },
  btnText: { color: '#fff', fontWeight: 'bold' },
  uploadSection: { backgroundColor: '#1e293b', padding: 16, borderRadius: 12, marginBottom: 20 },
  label: { color: '#f8fafc', fontWeight: 'bold', marginBottom: 4 },
  helper: { color: '#94a3b8', fontSize: 12, marginBottom: 12 },
  input: { backgroundColor: '#0f172a', color: '#f8fafc', height: 150, borderRadius: 8, padding: 12, textAlignVertical: 'top' },
  verseCard: { backgroundColor: '#1e293b', padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#334155' },
  verseEn: { color: '#f8fafc', fontSize: 15, fontStyle: 'italic', marginBottom: 4, lineHeight: 22 },
  refEn: { color: '#94a3b8', fontSize: 13, marginBottom: 10, textAlign: 'right' },
  divider: { height: 1, backgroundColor: '#334155', marginVertical: 8 },
  verseTe: { color: '#f8fafc', fontSize: 15, marginBottom: 4, lineHeight: 22 },
  refTe: { color: '#94a3b8', fontSize: 13, textAlign: 'right' },
  monthChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: '#1e293b', marginRight: 8, borderWidth: 1, borderColor: '#334155' },
  monthChipActive: { backgroundColor: '#38bdf8', borderColor: '#38bdf8' },
  monthChipText: { color: '#94a3b8', fontWeight: '600', fontSize: 13 },
  monthChipTextActive: { color: '#0f172a', fontWeight: '700' },

  scheduleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0f172a',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  scheduleBadgeToday: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: '#f59e0b',
  },
  scheduleBadgeTomorrow: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderColor: '#38bdf8',
  },
  scheduleText: {
    fontSize: 12,
    color: '#cbd5e1',
    fontWeight: '700',
  },
  scheduleTextToday: {
    color: '#fbbf24',
    fontWeight: '800',
  },
  scheduleTextTomorrow: {
    color: '#38bdf8',
    fontWeight: '800',
  },
  slotSubText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptySub: {
    color: '#94a3b8',
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});

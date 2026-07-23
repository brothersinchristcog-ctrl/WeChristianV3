import React, { useState, useEffect, useContext } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity,
  Dimensions,
  Platform,
  StatusBar,
  TextInput,
  ActivityIndicator
} from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { AdminTabContext } from '../../context/AdminTabContext';

import FirestoreService from '../../services/FirestoreService';

const { width } = Dimensions.get('window');

export default function AdminPromiseCalendar() {
  const { setActiveTab, setEditingData } = useContext(AdminTabContext);
  const [loading, setLoading] = useState(true);
  const [promises, setPromises] = useState<any[]>([]);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchCalendarData();
  }, []);

  const fetchCalendarData = async () => {
    setLoading(true);
    try {
      const now = new Date();
      const data = await FirestoreService.getCalendarData(now.getFullYear(), now.getMonth() + 1);
      setPromises(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    setImporting(true);
    setImportProgress(0);
    setShowSuccess(false);
    setShowError(false);

    try {
      let DocumentPicker;
      try {
        DocumentPicker = require('expo-document-picker');
      } catch (e) {
        throw new Error('File upload requires a Development Build with expo-document-picker linked.');
      }

      if (!DocumentPicker || !DocumentPicker.getDocumentAsync) {
        throw new Error('Native Document Picker is unavailable in this environment.');
      }

      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/comma-separated-values', 'text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
        copyToCacheDirectory: true
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        setImporting(false);
        return;
      }

      const response = await fetch(result.assets[0].uri);
      const finalCsvText = await response.text();

      // Basic CSV Parser
      const rows = finalCsvText.split(/\r?\n/);
      if (rows.length < 2) throw new Error('Data is empty or invalid format.');

      const headers = rows[0].split(',').map(h => h.trim().toLowerCase());
      const dataRows = rows.slice(1).filter(r => r.trim().length > 0);

      let count = 0;
      for (const rowStr of dataRows) {
        const cols = rowStr.split(',').map(c => c.trim().replace(/^"|"$/g, ''));
        const rowData: any = {};
        headers.forEach((h, i) => { rowData[h] = cols[i]; });

        const promiseData = {
          date: rowData.date,
          verseReferenceEn: rowData.en_ref || rowData['english reference'],
          verse: rowData.en_verse || rowData['english verse'],
          verseReferenceTe: rowData.te_ref || rowData['telugu reference'],
          verseTelugu: rowData.te_verse || rowData['telugu verse'],
          youtubeId: rowData.youtube_url || rowData['youtube url'],
          status: 'Published'
        };

        // Check if date already exists in current calendar
        const existingRecord = promises.find(p => p.date === promiseData.date);
        
        if (promiseData.date && promiseData.verse) {
          const finalData = {
            ...promiseData,
            id: existingRecord?.id
          };
          
          await FirestoreService.createDailyPromise(finalData);
          count++;
          setImportProgress(count);
        }
      }

      setShowSuccess(true);
      fetchCalendarData();
      setTimeout(() => setShowSuccess(false), 5000);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Import failed. Check format.');
      setShowError(true);
    } finally {
      setImporting(false);
    }
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  // Calculate days in current month
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const todayDate = now.getDate();

  const getMonthName = (m: number) => {
    return new Date(2000, m).toLocaleString('en-US', { month: 'long' });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <View style={styles.hero}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
          <TouchableOpacity onPress={() => setActiveTab(0)} style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
            <ChevronLeft size={20} color="#fff" style={{ marginLeft: -6, marginRight: 4 }} />
            <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>Back</Text>
          </TouchableOpacity>
          <Text style={[styles.heroTitle, { marginHorizontal: 12, opacity: 0.4 }]}>|</Text>
          <View>
            <Text style={styles.heroTitle}>Promise Calendar</Text>
            <Text style={[styles.heroSub, { marginTop: 2 }]}>{getMonthName(month)} {year}</Text>
          </View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* ── Calendar Card ── */}
        <View style={styles.calCard}>
          {/* Month label inside card */}
          <View style={styles.calMonthRow}>
            <Text style={styles.calMonthLabel}>{getMonthName(month)} {year}</Text>
            <Text style={styles.calMonthSub}>Tap any date to edit</Text>
          </View>

          {/* ── Calendar Grid ── */}
          <View style={styles.calGrid}>
            {weekDays.map(d => (
              <View key={d} style={styles.calHeader}><Text style={styles.calHeaderTxt}>{d}</Text></View>
            ))}
            
            {/* Empty days for start of month */}
            {Array.from({ length: firstDay }).map((_, i) => (
              <View key={`empty-${i}`} style={styles.calDay} />
            ))}

            {days.map(day => {
              const isToday = day === todayDate;
              const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const promise = promises.find(p => p.date === dStr);
              
              const isMissing = !promise;
              const isDraft = promise?.status === 'Draft';
              const isPublished = promise?.status === 'Published';
              const isScheduled = promise?.status === 'Scheduled';

              return (
                <TouchableOpacity 
                  key={day} 
                  style={[
                    styles.calDay,
                    isToday && styles.cToday,
                    isMissing && styles.cMiss,
                    isDraft && styles.cDft,
                    (isPublished || isScheduled) && styles.cPub
                  ]}
                  onPress={() => { 
                    setEditingData(promise || { date: dStr }); 
                    setActiveTab(1); 
                  }}
                >
                  <Text style={[
                    styles.calNum,
                    isToday && styles.cTodayNum,
                    isMissing && styles.cMissNum,
                    isDraft && styles.cDftNum,
                    (isPublished || isScheduled) && styles.cPubNum,
                  ]}>{day}</Text>
                  <Text style={[
                    styles.calStatus,
                    isToday && styles.cTodayStatus,
                    isMissing && styles.cMissStatus,
                    isDraft && styles.cDftStatus,
                    (isPublished || isScheduled) && styles.cPubStatus,
                  ]}>
                    {isToday ? 'Today' : isMissing ? 'Missing' : isDraft ? 'Draft' : 'OK'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── Legend ── */}
        <View style={styles.legendRow}>
          <LegendItem color="#EDF7F1" border="#A3D9B8" label="Published" />
          <LegendItem color="#FEFBF0" border="#F5DFA0" label="Draft" />
          <LegendItem color="#FEF3F3" border="#F5B8B8" label="Missing" />
          <LegendItem color="#FFFBEB" border="#F59E0B" label="Today" />
        </View>

        {/* ── Import ── */}
        <View style={styles.importWrap}>
          <View style={styles.importHd}>
            <Text style={styles.importHdTXT}>📁 Import from CSV / Excel</Text>
            {importing && <ActivityIndicator size="small" color="#fff" />}
          </View>
          
          <View style={styles.importBody}>
            {importing ? (
              <View style={styles.progressBox}>
                <Text style={styles.progressTxt}>Importing: {importProgress} records processed...</Text>
                <ActivityIndicator color="#1a2d5a" style={{ marginTop: 10 }} />
              </View>
            ) : (
              <>
                <Text style={styles.importHint}>Upload a spreadsheet with columns: Date, English Reference, English Verse, Telugu Reference, Telugu Verse, YouTube URL</Text>
                <TouchableOpacity style={styles.uploadBox} onPress={handleImport}>
                  <Text style={styles.uploadIcon}>📊</Text>
                  <Text style={styles.uploadTxt}>Tap to upload CSV or Excel file</Text>
                  <Text style={styles.uploadSubHint}>Columns: date · en_ref · en_verse · te_ref · te_verse · youtube_url</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        {/* Status Modals */}
        {showSuccess && (
          <View style={styles.statusMsg}>
            <Text style={styles.statusMsgTxt}>✅ Import Successful!</Text>
          </View>
        )}
        {showError && (
          <View style={[styles.statusMsg, { backgroundColor: '#FEE2E2' }]}>
            <Text style={[styles.statusMsgTxt, { color: '#991B1B' }]}>❌ {errorMsg}</Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

function LegendItem({ color, border, label }: any) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendBox, { backgroundColor: color, borderColor: border }]} />
      <Text style={styles.legendTxt}>{label}</Text>
    </View>
  );
}

// Calculate cell size correctly: 
// Screen width - (scroll padding * 2) - (card padding * 2) - (gap * 6)
// width - 28 - 28 - 30 = width - 86
const CELL_SIZE = Math.floor((width - 86) / 7);

const styles = StyleSheet.create({
  // ─── Layout ──────────────────────────────────────────────────────────────
  container: { flex: 1, backgroundColor: '#EDE8DC' },
  scroll: { padding: 14, paddingBottom: 100 },

  // ─── Hero (DO NOT MODIFY) ─────────────────────────────────────────────────
  hero: {
    backgroundColor: '#1a2d5a',
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
    paddingHorizontal: 22,
    paddingTop: 10,
    paddingBottom: 24,
    overflow: 'visible',
    position: 'relative',
    marginBottom: 6,
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, marginLeft: -6 },
  backBtnTxt: { fontSize: 13, fontWeight: '700', color: '#fff', marginLeft: 4 },
  heroTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', marginBottom: 6 },
  heroTitle: { color: '#fff', fontSize: 24, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', fontWeight: '600', letterSpacing: -0.5 },
  heroSub: { color: '#AEB8D4', fontSize: 13 },

  alertAmber: { backgroundColor: '#FFFBEB', borderRadius: 10, padding: 12, marginBottom: 12, flexDirection: 'row', gap: 8, borderWidth: 0.5, borderColor: '#FDE68A' },
  alertIcon: { fontSize: 16 },
  alertTxt: { fontSize: 11, color: '#78350F', lineHeight: 16 },

  // ─── Calendar Card ────────────────────────────────────────────────────────
  calCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(26,45,90,0.08)',
    shadowColor: '#1a2d5a',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  calMonthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(26,45,90,0.07)',
  },
  calMonthLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1a2d5a',
    letterSpacing: 0.5,
  },
  calMonthSub: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '500',
  },

  // ─── Calendar Grid ────────────────────────────────────────────────────────
  calGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginBottom: 14 },
  calHeader: { width: CELL_SIZE, alignItems: 'center', paddingVertical: 5 },
  calHeaderTxt: {
    fontSize: 9,
    fontWeight: '700',
    color: '#1a2d5a',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    opacity: 0.55,
  },

  // ─── Calendar Cells ───────────────────────────────────────────────────────
  calDay: {
    width: CELL_SIZE,
    height: 52,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAF9',
    borderWidth: 1,
    borderColor: '#E8E3DB',
  },
  calNum: { fontSize: 13, fontWeight: '700', color: '#1a2d5a' },
  calStatus: { fontSize: 7, fontWeight: '700', marginTop: 2, letterSpacing: 0.3 },

  // Published — green
  cPub: { backgroundColor: '#EDF7F1', borderColor: '#A3D9B8' },
  cPubNum: { color: '#1a5c38' },
  cPubStatus: { color: '#2E7D52' },

  // Draft — amber
  cDft: { backgroundColor: '#FEFBF0', borderColor: '#F5DFA0' },
  cDftNum: { color: '#7C4A00' },
  cDftStatus: { color: '#B76E00' },

  // Missing — rose
  cMiss: { backgroundColor: '#FEF3F3', borderColor: '#F5B8B8' },
  cMissNum: { color: '#991B1B' },
  cMissStatus: { color: '#DC2626' },

  // Today — gold highlight
  cToday: {
    backgroundColor: '#FFFBEB',
    borderColor: '#F59E0B',
    borderWidth: 2,
    elevation: 4,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  cTodayNum: { color: '#B45309', fontWeight: '900', fontSize: 14 },
  cTodayStatus: { color: '#B45309', fontWeight: '800' },

  // ─── Legend ───────────────────────────────────────────────────────────────
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(26,45,90,0.08)',
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendBox: { width: 14, height: 14, borderRadius: 4, borderWidth: 1 },
  legendTxt: { fontSize: 11, fontWeight: '600', color: '#374151' },

  // ─── Import Card ──────────────────────────────────────────────────────────
  importWrap: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(26,45,90,0.08)',
    shadowColor: '#1a2d5a',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  importHd: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#1a2d5a', // Navy blue highlight for header
  },
  importHdTXT: { color: '#fff', fontSize: 12, fontWeight: '800', letterSpacing: 0.5, textTransform: 'uppercase' },
  importBody: { padding: 14 },
  importHint: { fontSize: 12, color: '#6B7280', marginBottom: 12, lineHeight: 18 },
  uploadBox: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#C9B99A',
    borderRadius: 12,
    paddingVertical: 22,
    paddingHorizontal: 16,
    alignItems: 'center',
    backgroundColor: '#F9F6F0',
  },
  uploadIcon: { fontSize: 28, marginBottom: 8 },
  uploadTxt: { fontSize: 12, color: '#374151', fontWeight: '600', marginBottom: 4 },
  uploadSubHint: { fontSize: 10, color: '#9CA3AF', textAlign: 'center', lineHeight: 15 },

  progressBox: { alignItems: 'center', padding: 20 },
  progressTxt: { fontSize: 12, fontWeight: '700', color: '#1a2d5a' },

  statusMsg: { backgroundColor: '#DCFCE7', padding: 14, borderRadius: 10, marginTop: 12, alignItems: 'center' },
  statusMsgTxt: { fontSize: 12, fontWeight: '700', color: '#166534' },

  importTabs: { flexDirection: 'row', backgroundColor: '#f3f4f6', padding: 4, gap: 4 },
  importTab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 6 },
  importTabActive: { backgroundColor: '#fff', elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 3 },
  importTabTxt: { fontSize: 11, fontWeight: '600', color: '#6B7280' },
  importTabTxtActive: { color: '#1a2d5a' },

  manualEntry: { gap: 10 },
  manualInput: { backgroundColor: '#F9F6F0', borderWidth: 1, borderColor: '#E2DDD5', borderRadius: 10, padding: 12, fontSize: 12, color: '#1a2d5a', height: 120, textAlignVertical: 'top', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  processBtn: { backgroundColor: '#1a2d5a', borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginTop: 5 },
  processBtnTxt: { color: '#fff', fontSize: 12, fontWeight: '700' },
});

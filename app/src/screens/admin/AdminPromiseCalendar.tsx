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
      
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* ── Section Heading ── */}
        <View style={styles.secHd}>
          <View>
            <Text style={styles.secTitle}>📅 Promise Calendar</Text>
            <Text style={styles.secSub}>{getMonthName(month)} {year} — tap any date</Text>
          </View>
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
                <Text style={[styles.calNum, isToday && styles.cTodayNum, isMissing && styles.cMissNum, isDraft && styles.cDftNum]}>{day}</Text>
                <Text style={[styles.calStatus, isToday && styles.cTodayStatus, isMissing && styles.cMissStatus, isDraft && styles.cDftStatus]}>
                  {isToday ? 'Today' : isMissing ? 'MISSING' : isDraft ? 'DRAFT' : 'OK'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Legend ── */}
        <View style={styles.legendRow}>
          <LegendItem color="#F0FDF4" border="#BBF7D0" label="Published" />
          <LegendItem color="#FFFBEB" border="#FDE68A" label="Draft" />
          <LegendItem color="#FEF2F2" border="#FECACA" label="Missing" />
          <LegendItem color="#1a2d5a" border="#1a2d5a" label="Today" />
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f2f7' },
  scroll: { padding: 14, paddingBottom: 80 },

  secHd: { marginBottom: 14, paddingBottom: 8, borderBottomWidth: 2, borderBottomColor: '#c0392b' },
  secTitle: { fontSize: 15, fontWeight: '600', color: '#1a2d5a' },
  secSub: { fontSize: 10, color: '#6B7280', marginTop: 2 },

  alertAmber: { backgroundColor: '#FFFBEB', borderRadius: 10, padding: 12, marginBottom: 12, flexDirection: 'row', gap: 8, borderWidth: 0.5, borderColor: '#FDE68A' },
  alertIcon: { fontSize: 16 },
  alertTxt: { fontSize: 11, color: '#78350F', lineHeight: 16 },

  calGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: 12 },
  calHeader: { width: (width - 28 - 24) / 7, textAlign: 'center', paddingVertical: 4 },
  calHeaderTxt: { fontSize: 9, color: '#9CA3AF', fontWeight: '500', textAlign: 'center' },
  calDay: { width: (width - 28 - 24) / 7, height: 48, borderRadius: 8, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff', borderWidth: 0.5, borderColor: '#e5e7eb' },
  calNum: { fontSize: 12, fontWeight: '600', color: '#111827' },
  calStatus: { fontSize: 7, fontWeight: '500', marginTop: 2 },

  cPub: { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' },
  cDft: { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' },
  cDftNum: { color: '#92400E' },
  cDftStatus: { color: '#D97706' },
  cMiss: { backgroundColor: '#FEF2F2', borderColor: '#FECACA' },
  cMissNum: { color: '#991B1B' },
  cMissStatus: { color: '#DC2626' },
  cToday: { backgroundColor: '#1a2d5a', borderColor: '#fbbf24', borderWidth: 2, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84 },
  cTodayNum: { color: '#fbbf24', fontWeight: '900', fontSize: 14 },
  cTodayStatus: { color: '#fbbf24', fontWeight: '800' },

  legendRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendBox: { width: 12, height: 12, borderRadius: 3, borderWidth: 0.5 },
  legendTxt: { fontSize: 10, color: '#6B7280' },

  importWrap: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 0.5, borderColor: '#e5e7eb', overflow: 'hidden' },
  importHd: { backgroundColor: '#1a2d5a', padding: 10, paddingHorizontal: 14 },
  importHdTXT: { color: '#fff', fontSize: 11, fontWeight: '500' },
  importBody: { padding: 12, paddingHorizontal: 14 },
  importHint: { fontSize: 11, color: '#6B7280', marginBottom: 10, lineHeight: 16 },
  uploadBox: { borderWidth: 2, borderStyle: 'dashed', borderColor: '#d1d5db', borderRadius: 12, padding: 20, alignItems: 'center', backgroundColor: '#f9fafb' },
  uploadIcon: { fontSize: 26, marginBottom: 6 },
  uploadTxt: { fontSize: 11, color: '#6B7280', fontWeight: '500' },
  uploadSubHint: { fontSize: 10, color: '#9CA3AF', marginTop: 3, textAlign: 'center' },
  
  progressBox: { alignItems: 'center', padding: 20 },
  progressTxt: { fontSize: 12, fontWeight: '700', color: '#1a2d5a' },
  
  statusMsg: { backgroundColor: '#DCFCE7', padding: 15, borderRadius: 10, marginTop: 15, alignItems: 'center' },
  statusMsgTxt: { fontSize: 12, fontWeight: '700', color: '#166534' },

  importTabs: { flexDirection: 'row', backgroundColor: '#f3f4f6', padding: 4, gap: 4 },
  importTab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 6 },
  importTabActive: { backgroundColor: '#fff', elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 3 },
  importTabTxt: { fontSize: 11, fontWeight: '600', color: '#6B7280' },
  importTabTxtActive: { color: '#1a2d5a' },

  manualEntry: { gap: 10 },
  manualInput: { backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, padding: 12, fontSize: 12, color: '#111827', height: 120, textAlignVertical: 'top', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  processBtn: { backgroundColor: '#1a2d5a', borderRadius: 8, paddingVertical: 12, alignItems: 'center', marginTop: 5 },
  processBtnTxt: { color: '#fff', fontSize: 12, fontWeight: '700' }
});

import React, { useState, useEffect, useContext, useRef } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator,
  Platform,
  Dimensions,
  Alert,
  Modal,
  Share,
  Image
} from 'react-native';
import { 
  Calendar as CalendarIcon, 
  BookOpen, 
  Languages, 
  Play, 
  User, 
  Eye, 
  Save, 
  ChevronLeft,
  ChevronDown,
  X,
  ChevronRight,
  CheckCircle2
} from 'lucide-react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppAlert } from '../../components/CustomAlert';
import { AdminTabContext } from '../../context/AdminTabContext';
import * as MediaLibrary from 'expo-media-library';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { captureRef } from 'react-native-view-shot';
import firestore from '@react-native-firebase/firestore';

import FirestoreService from '../../services/FirestoreService';

const { width } = Dimensions.get('window');

const THEME_COLORS = [
  '#1a2d5a', // Navy
  '#c0392b', // Red
  '#15803D', // Green
  '#7C3AED', // Purple
  '#D97706', // Amber
  '#0891B2', // Teal
  '#BE185D', // Pink
  '#4338CA', // Indigo
  '#374151', // Gray
  '#0F172A'  // Dark
];

const STATUS_OPTIONS = [
  { label: 'Draft — save only, not visible', value: 'Draft' },
  { label: 'Scheduled — auto-publish at midnight', value: 'Scheduled' },
  { label: 'Publish now — live immediately', value: 'Published' }
];

export default function AdminPromiseEditor() {
  const { setActiveTab, editingData, setEditingData } = useContext(AdminTabContext);
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStatusPicker, setShowStatusPicker] = useState(false);
  
  const [form, setForm] = useState({
    date: (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; })(),
    enRef: '',
    enVerse: '',
    enNote: '',
    teVerse: '',
    teRef: '',
    teNote: '',
    ytUrl: '',
    videoTitle: '',
    duration: '',
    pastor: '',
    status: 'Scheduled',
    theme: '#1a2d5a',
    imageUrl: ''
  });

  const stripHtml = (html?: string) => {
    if (!html) return '';
    return html.replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ').replace(/&#39;/g, "'").trim();
  };

  useEffect(() => {
    if (editingData) {
      const cleanEnRef = editingData.verseReferenceEn?.startsWith('DP-') ? '' : editingData.verseReferenceEn;
      const cleanTeRef = editingData.verseReferenceTe || '';
      
      setForm({
        ...form,
        date: editingData.date || (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; })(),
        enVerse: stripHtml(editingData.verse) || '',
        enRef: cleanEnRef || '',
        teVerse: stripHtml(editingData.verseTelugu) || '',
        teRef: cleanTeRef || '',
        enNote: stripHtml(editingData.devotionalNote) || '',
        ytUrl: editingData.youtubeId || '',
        videoTitle: editingData.videoTitle || '',
        duration: editingData.duration || '',
        pastor: editingData.pastor || '',
        status: editingData.status || 'Scheduled',
        theme: editingData.theme || '#1a2d5a',
        imageUrl: editingData.imageUrl || ''
      });
    } else {
      // Reset for NEW promise
      setForm({
        date: (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; })(),
        enRef: '',
        enVerse: '',
        enNote: '',
        teVerse: '',
        teRef: '',
        teNote: '',
        ytUrl: '',
        videoTitle: '',
        duration: '',
        pastor: '',
        status: 'Scheduled',
        theme: '#1a2d5a',
        imageUrl: ''
      });
    }
  }, [editingData]);

  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const viewShotRef = useRef(null);

  const handleSaveToGallery = async () => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'We need access to your gallery to save the promise card.');
        return;
      }

      const uri = await captureRef(viewShotRef, {
        format: 'png',
        quality: 1.0,
      });

      await MediaLibrary.saveToLibraryAsync(uri);
      Alert.alert('Saved!', 'The promise card has been saved to your gallery.');
    } catch (err) {
      console.error('Save failed:', err);
      Alert.alert('Error', 'Failed to save image.');
    }
  };

  const handleShare = async () => {
    try {
      const uri = await captureRef(viewShotRef, {
        format: 'png',
        quality: 1.0,
      });

      await Share.share({
        url: uri,
        message: `Today's Promise: ${form.enVerse} - ${form.enRef}`,
      });
    } catch (err) {
      console.error('Share failed:', err);
    }
  };

  const uploadImageToCloud = async (localUri: string): Promise<string> => {
    try {
      const storage = require('@react-native-firebase/storage').default;
      const ext = localUri.substring(localUri.lastIndexOf('.') + 1) || 'jpg';
      const storagePath = `promises/thumbnails/promise_${Date.now()}.${ext}`;
      
      const reference = storage().ref(storagePath);
      await reference.putFile(localUri);
      const downloadURL = await reference.getDownloadURL();
      return downloadURL;
    } catch (error) {
      console.error('Storage upload failed:', error);
      throw new Error('Cloud upload failed');
    }
  };

  const pickThumbnail = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled) {
        setLoading(true);
        const cloudUrl = await uploadImageToCloud(result.assets[0].uri);
        setForm(prev => ({ ...prev, imageUrl: cloudUrl }));
        AppAlert.alert('Success', 'Thumbnail uploaded to cloud successfully! Remember to Save Changes.', undefined, 'success');
      }
    } catch (err) {
      console.error('Upload Error:', err);
      AppAlert.alert('Upload Failed', 'There was an issue uploading your image.', undefined, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (statusOverride?: string) => {
    const finalStatus = statusOverride || form.status;
    
    // Validation
    if (!form.date) return AppAlert.alert('Error', 'Please select a promise date.', undefined, 'error');
    if (!form.enVerse?.trim()) return AppAlert.alert('Error', 'Please enter the English verse.', undefined, 'error');
    if (!form.teVerse?.trim()) return AppAlert.alert('Error', 'Please enter the Telugu verse.', undefined, 'error');

    setLoading(true);
    try {
      const details = {
        id: editingData?.id,
        date: form.date,
        verse: form.enVerse,
        verseReferenceEn: form.enRef,
        verseTelugu: form.teVerse,
        verseReferenceTe: form.teRef,
        devotionalNote: form.enNote,
        youtubeId: form.ytUrl,
        videoTitle: form.videoTitle,
        duration: form.duration,
        pastor: form.pastor,
        status: finalStatus,
        theme: form.theme,
        imageUrl: form.imageUrl
      };
      
      await FirestoreService.createDailyPromise(details);

      // 🔔 Push notification to all members when publishing
      if (finalStatus === 'Published') {
        try {
          const churchId = await FirestoreService.getChurchId();
          await FirestoreService.createNotificationBroadcast({
            title: `📖 Daily Promise: ${form.enRef || 'Today\'s Verse'}`,
            content: `"${form.enVerse}" ${form.enRef ? `— ${form.enRef}` : ''}`,
            date: form.date,
            type: 'promise',
            targetChurchId: churchId,
          });
          console.log('🔔 Daily Promise push notification queued.');
        } catch (notifErr) {
          console.warn('⚠️ Daily Promise push notification failed:', notifErr);
        }
      }

      setShowSuccess(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save to Salesforce. Please check your connection.');
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };

  const closeSuccess = () => {
    setShowSuccess(false);
    setActiveTab(0);
  };

  const currentStatusLabel = STATUS_OPTIONS.find(o => o.value === form.status)?.label || form.status;

  // Simple JS-based date selection (Mocking a calendar grid for simplicity & stability)
  const renderDatePicker = () => {
    const days = Array.from({ length: 30 }, (_, i) => i + 1);
    return (
      <Modal visible={showDatePicker} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.pickerCard}>
            <View style={styles.pickerHd}>
              <Text style={styles.pickerTitle}>Select Date ({new Date().toLocaleString('en-US', { month: 'long' })} {new Date().getFullYear()})</Text>
              <TouchableOpacity onPress={() => setShowDatePicker(false)}><X size={20} color="#1a2d5a" /></TouchableOpacity>
            </View>
            <View style={styles.calGrid}>
              {days.map(d => {
                const year = new Date().getFullYear();
                const monthStr = String(new Date().getMonth() + 1).padStart(2, '0');
                const dStr = `${year}-${monthStr}-${String(d).padStart(2,'0')}`;
                return (
                  <TouchableOpacity 
                    key={d} 
                    style={[styles.calCell, form.date === dStr && styles.calCellActive]}
                    onPress={() => {
                      setForm({...form, date: dStr});
                      setShowDatePicker(false);
                    }}
                  >
                    <Text style={[styles.calCellTxt, form.date === dStr && styles.calCellTxtActive]}>{d}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <View style={styles.heroTitleRow}>
          <TouchableOpacity onPress={() => setActiveTab(0)} style={{ flexDirection: 'row', alignItems: 'center' }}>
            <ChevronLeft size={20} color="#fff" style={{ marginLeft: -6, marginRight: 4 }} />
            <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>Back</Text>
          </TouchableOpacity>
          <Text style={[styles.heroTitle, { marginHorizontal: 12, opacity: 0.4 }]}>|</Text>
          <Text style={styles.heroTitle}>{editingData ? 'Edit Promise' : 'New Promise'}</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* 1. Schedule */}
        <View style={[styles.section, styles.secNavy]}>
          <View style={styles.secHd}>
            <View style={styles.secHdPill}>
              <CalendarIcon size={13} color="#fff" />
            </View>
            <Text style={styles.secHdTXT}>Schedule</Text>
          </View>
          <View style={styles.fGroup}>
            <Text style={styles.fLabel}>Promise date <Text style={{color:'#c0392b'}}>*</Text></Text>
            <TouchableOpacity style={styles.inputWrap} onPress={() => setShowDatePicker(true)}>
              <Text style={styles.inputText}>{form.date.split('-').reverse().join(' - ')}</Text>
              <CalendarIcon size={14} color="#374151" style={styles.inputIcon} />
            </TouchableOpacity>
          </View>
          {renderDatePicker()}
          
          <View style={styles.fGroup}>
            <Text style={styles.fLabel}>Background theme</Text>
            <View style={styles.themeRow}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {THEME_COLORS.map(c => (
                  <TouchableOpacity key={c} style={[styles.themeChip, { backgroundColor: c }, form.theme === c && styles.themeActive]} onPress={() => setForm({...form, theme: c})} />
                ))}
              </ScrollView>
            </View>
          </View>
        </View>

        {/* 2. English Promise */}
        <View style={[styles.section, styles.secNavy]}>
          <View style={styles.secHd}>
            <View style={styles.secHdPill}>
              <BookOpen size={13} color="#fff" />
            </View>
            <Text style={styles.secHdTXT}>English Promise</Text>
          </View>
          <View style={styles.fGroup}>
            <Text style={styles.fLabel}>Verse reference <Text style={{color:'#c0392b'}}>*</Text> <Text style={styles.fHint}>e.g. John 3:16</Text></Text>
            <TextInput style={styles.input} value={form.enRef} onChangeText={(v) => setForm({...form, enRef: v})} placeholder="Book Chapter:Verse" />
          </View>
          <View style={styles.fGroup}>
            <Text style={styles.fLabel}>Verse text — English <Text style={{color:'#c0392b'}}>*</Text></Text>
            <TextInput style={[styles.input, styles.textarea]} multiline value={form.enVerse} onChangeText={(v) => setForm({...form, enVerse: v})} placeholder="Type or paste the Bible verse in English…" />
          </View>
          <View style={styles.fGroup}>
            <Text style={styles.fLabel}>Devotional note — English <Text style={styles.fHint}>Optional</Text></Text>
            <TextInput style={[styles.input, styles.textarea]} multiline value={form.enNote} onChangeText={(v) => setForm({...form, enNote: v})} placeholder="Pastor's reflection in English…" />
          </View>
        </View>

        {/* 3. Telugu Promise */}
        <View style={[styles.section, styles.secBlue]}>
          <View style={styles.secHd}>
            <View style={styles.secHdPill}>
              <Languages size={13} color="#fff" />
            </View>
            <Text style={styles.secHdTXT}>Telugu Promise - తెలుగు వాగ్దానం</Text>
          </View>
          <View style={styles.fGroup}>
            <Text style={styles.fLabel}>Verse reference — Telugu <Text style={styles.fHint}>e.g. యోహాను 3:16</Text></Text>
            <TextInput style={[styles.input, styles.teIn]} value={form.teRef} onChangeText={(v) => setForm({...form, teRef: v})} placeholder="పుస్తకం అధ్యాయం:వచనం" />
          </View>
          <View style={styles.fGroup}>
            <Text style={styles.fLabel}>Verse text — Telugu <Text style={{color:'#c0392b'}}>*</Text></Text>
            <TextInput style={[styles.input, styles.textarea, styles.teIn]} multiline value={form.teVerse} onChangeText={(v) => setForm({...form, teVerse: v})} placeholder="తెలుగులో బైబిల్ వచనం ఇక్కడ టైప్ చేయండి…" />
          </View>
          <View style={styles.fGroup}>
            <Text style={styles.fLabel}>Devotional note — Telugu <Text style={styles.fHint}>ఐచ్ఛికం</Text></Text>
            <TextInput style={[styles.input, styles.textarea, styles.teIn]} multiline value={form.teNote} onChangeText={(v) => setForm({...form, teNote: v})} placeholder="పాస్టర్ గారి వ్యాఖ్యానం తెలుగులో…" />
          </View>
        </View>

        {/* 3.5 Thumbnail Upload */}
        <View style={[styles.section, styles.secNavy]}>
          <View style={styles.secHd}>
            <View style={styles.secHdPill}>
              <Eye size={13} color="#fff" />
            </View>
            <Text style={styles.secHdTXT}>Daily Promise Thumbnail</Text>
          </View>
          <View style={styles.fGroup}>
            <Text style={styles.fLabel}>Upload Thumbnail Image <Text style={styles.fHint}>(Visible on member home screen)</Text></Text>
            {form.imageUrl ? (
              <View style={styles.thumbnailPreviewContainer}>
                <Image source={{ uri: form.imageUrl }} style={styles.thumbnailImg} resizeMode="cover" />
                <TouchableOpacity style={styles.removeThumbnailBtn} onPress={() => setForm(prev => ({ ...prev, imageUrl: '' }))}>
                  <Text style={styles.btnChangeThumbTxt}>Remove Image</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.btnUploadThumb} onPress={pickThumbnail}>
                <Text style={styles.btnUploadThumbTxt}>Pick Image from Gallery</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* 4. YouTube Link */}
        <View style={[styles.section, styles.secRed]}>
          <View style={styles.secHd}>
            <View style={styles.secHdPill}>
              <Play size={13} color="#fff" />
            </View>
            <Text style={styles.secHdTXT}>YouTube Link</Text>
          </View>
          <View style={styles.fGroup}>
            <Text style={styles.fLabel}>Video Title</Text>
            <TextInput style={styles.input} value={form.videoTitle} onChangeText={(v) => setForm({...form, videoTitle: v})} placeholder="Devotional Video Title" />
          </View>
          <View style={styles.fGroup}>
            <Text style={styles.fLabel}>Duration <Text style={styles.fHint}>e.g. 1:20</Text></Text>
            <TextInput style={styles.input} value={form.duration} onChangeText={(v) => setForm({...form, duration: v})} placeholder="Video duration" />
          </View>
          <View style={styles.fGroup}>
            <Text style={styles.fLabel}>YouTube video URL <Text style={styles.fHint}>today's 1-min devotional</Text></Text>
            <TextInput style={styles.input} value={form.ytUrl} onChangeText={(v) => setForm({...form, ytUrl: v})} placeholder="https://youtube.com/watch?v=…" />
            <Text style={styles.fSub}>Paste full URL or the 11-character video ID</Text>
          </View>
        </View>

        {/* 5. Pastor & Status */}
        <View style={[styles.section, styles.secNavy]}>
          <View style={styles.secHd}>
            <View style={styles.secHdPill}>
              <User size={13} color="#fff" />
            </View>
            <Text style={styles.secHdTXT}>Pastor & Status</Text>
          </View>
          <View style={styles.fGroup}>
            <Text style={styles.fLabel}>Pastor Name</Text>
            <TextInput style={styles.input} value={form.pastor} onChangeText={(v) => setForm({...form, pastor: v})} placeholder="Pastor Name" />
          </View>
          <View style={styles.fGroup}>
            <Text style={styles.fLabel}>Publish status</Text>
            <TouchableOpacity style={styles.input} onPress={() => setShowStatusPicker(true)}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={styles.statusDropdownTxt}>{currentStatusLabel}</Text>
                <ChevronDown size={14} color="#374151" />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Status Picker Modal */}
        <Modal visible={showStatusPicker} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.statusMenu}>
              <View style={styles.statusMenuHd}><Text style={styles.statusMenuTitle}>Select Publish Status</Text></View>
              {STATUS_OPTIONS.map(opt => (
                <TouchableOpacity 
                  key={opt.value} 
                  style={[styles.statusItem, form.status === opt.value && styles.statusItemActive]} 
                  onPress={() => { setForm({...form, status: opt.value}); setShowStatusPicker(false); }}
                >
                  <Text style={[styles.statusItemTxt, form.status === opt.value && styles.statusItemTxtActive]}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity style={styles.statusCancel} onPress={() => setShowStatusPicker(false)}>
                <Text style={styles.statusCancelTxt}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Success Modal */}
        <Modal visible={showSuccess} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.successCard}>
              <View style={styles.successIconBox}>
                <CheckCircle2 size={50} color="#15803D" strokeWidth={3} />
              </View>
              <Text style={styles.successTitle}>Success!</Text>
              <Text style={styles.successSub}>Your daily promise has been published successfully.</Text>
              <TouchableOpacity style={styles.successBtn} onPress={closeSuccess}>
                <Text style={styles.successBtnTxt}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Error Modal */}
        <Modal visible={showError} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.errorCard}>
              <View style={styles.errorIconBox}>
                <X size={40} color="#c0392b" strokeWidth={3} />
              </View>
              <Text style={styles.errorTitle}>Save Failed</Text>
              <Text style={styles.errorSub}>{errorMsg}</Text>
              <TouchableOpacity style={[styles.successBtn, { backgroundColor: '#c0392b' }]} onPress={() => setShowError(false)}>
                <Text style={styles.successBtnTxt}>Try Again</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Footer Actions */}
        {/* Side-by-side action buttons: Draft (left) | Save & Publish (right) */}
        <View style={styles.footerBtnRow}>
          <TouchableOpacity style={styles.btnDraft} onPress={() => handleSave('Draft')}>
            <Save size={15} color="#1a2d5a" />
            <Text style={styles.btnDraftTxt}>Save as Draft</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnSave} onPress={() => handleSave()}>
            <Save size={15} color="#fff" />
            <Text style={styles.btnSaveTxt}>Save & Publish</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.btnBack} onPress={() => setActiveTab(0)}>
          <Text style={styles.btnBackTxt}>← Back to list</Text>
        </TouchableOpacity>

        <View style={{ height: 60 }} />
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => handleSave()}>
        <Save size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  // ─── Layout ──────────────────────────────────────────────────────────────
  container: { flex: 1, backgroundColor: '#EDE8DC' },
  scroll: { padding: 16, paddingBottom: 110 },

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
    marginBottom: 6
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, marginLeft: -6 },
  backBtnTxt: { fontSize: 13, fontWeight: '700', color: '#fff', marginLeft: 4 },
  heroTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start' },
  heroTitle: { color: '#fff', fontSize: 24, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', fontWeight: '600', letterSpacing: -0.5 },

  // ─── Cards ───────────────────────────────────────────────────────────────
  // Unified card style matching reference: white bg, rounded corners,
  // dark navy top accent border, subtle shadow – no colored left borders
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: 'rgba(26,45,90,0.10)',
    borderTopWidth: 3,
    borderTopColor: '#1a2d5a',
    shadowColor: '#1a2d5a',
    shadowOpacity: 0.07,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  // Keep variant names for backward compat but all use same card style:
  secNavy: {},
  secBlue: {},
  secRed: {},
  secGreen: {},

  // ─── Section Header ───────────────────────────────────────────────────────
  secHd: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(26,45,90,0.08)',
    paddingBottom: 14,
  },
  // Navy pill badge wrapping the icon
  secHdPill: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#1a2d5a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  secHdTXT: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1a2d5a',
    textTransform: 'uppercase',
    letterSpacing: 1.4,
    flex: 1,
  },

  // ─── Form Fields ──────────────────────────────────────────────────────────
  fGroup: { marginBottom: 18 },
  fLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#374151',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  fHint: { fontWeight: '500', color: '#9CA3AF', fontSize: 11, textTransform: 'none', letterSpacing: 0 },
  fSub: { fontSize: 11, color: '#6B7280', marginTop: 6, fontStyle: 'italic' },

  // Status dropdown selected value
  statusDropdownTxt: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1a2d5a',
    flex: 1,
  },

  // ─── Inputs ───────────────────────────────────────────────────────────────
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFAF9',
    borderWidth: 1.5,
    borderColor: '#D9D3C7',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  inputText: { flex: 1, fontSize: 14, color: '#1a2d5a', fontWeight: '500' },
  input: {
    backgroundColor: '#FAFAF9',
    borderWidth: 1.5,
    borderColor: '#D9D3C7',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 14,
    color: '#1a2d5a',
    fontWeight: '500',
  },
  inputIcon: { marginLeft: 10 },
  textarea: { minHeight: 96, textAlignVertical: 'top', paddingTop: 14 },
  teIn: { fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', color: '#1a2d5a', fontSize: 15, lineHeight: 24 },

  // ─── Theme Chips ─────────────────────────────────────────────────────────
  themeRow: { flexDirection: 'row', marginTop: 8, gap: 12, paddingVertical: 6 },
  themeChip: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 3,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  // Gold/amber ring for selected theme (matches reference)
  themeActive: { borderColor: '#C9A84C', transform: [{ scale: 1.12 }] },

  // ─── Modal / Pickers ─────────────────────────────────────────────────────
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center' },
  pickerCard: { backgroundColor: '#fff', width: '85%', borderRadius: 20, padding: 20, elevation: 10 },
  pickerHd: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  pickerTitle: { fontSize: 14, fontWeight: '700', color: '#1a2d5a' },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  calCell: { width: (width * 0.85 - 70) / 7, height: 35, justifyContent: 'center', alignItems: 'center', borderRadius: 8, backgroundColor: '#F5F0E8' },
  calCellActive: { backgroundColor: '#1a2d5a' },
  calCellTxt: { fontSize: 11, color: '#374151', fontWeight: '600' },
  calCellTxtActive: { color: '#fff' },

  statusMenu: { backgroundColor: '#fff', width: '100%', position: 'absolute', bottom: 0, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 30 },
  statusMenuHd: { padding: 20, borderBottomWidth: 0.5, borderBottomColor: '#e5e7eb' },
  statusMenuTitle: { fontSize: 14, fontWeight: '700', color: '#1a2d5a', textAlign: 'center' },
  statusItem: { padding: 20, borderBottomWidth: 0.5, borderBottomColor: '#f3f4f6' },
  statusItemActive: { backgroundColor: '#1a2d5a' },
  statusItemTxt: { fontSize: 13, color: '#374151', textAlign: 'center' },
  statusItemTxtActive: { color: '#fff', fontWeight: '700' },
  statusCancel: { padding: 15, alignItems: 'center' },
  statusCancelTxt: { color: '#c0392b', fontWeight: '700' },

  // ─── Success / Error Modals ───────────────────────────────────────────────
  successCard: { backgroundColor: '#fff', width: '80%', borderRadius: 24, padding: 30, alignItems: 'center', elevation: 20, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 15 },
  successIconBox: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#F0FDF4', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  successTitle: { fontSize: 22, fontWeight: '800', color: '#1a2d5a', marginBottom: 10 },
  successSub: { fontSize: 13, color: '#6B7280', textAlign: 'center', lineHeight: 20, marginBottom: 25 },
  successBtn: { backgroundColor: '#1a2d5a', width: '100%', paddingVertical: 15, borderRadius: 12, alignItems: 'center' },
  successBtnTxt: { color: '#fff', fontSize: 14, fontWeight: '700' },

  errorCard: { backgroundColor: '#fff', width: '80%', borderRadius: 24, padding: 30, alignItems: 'center', elevation: 20, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 15 },
  errorIconBox: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#FEF2F2', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  errorTitle: { fontSize: 20, fontWeight: '800', color: '#c0392b', marginBottom: 10 },
  errorSub: { fontSize: 13, color: '#6B7280', textAlign: 'center', lineHeight: 20, marginBottom: 25 },

  // ─── Preview Card (Live Preview section) ─────────────────────────────────
  cardPreview: { borderRadius: 14, padding: 20 },
  cardLabel: { fontSize: 10, color: '#FCD34D', fontWeight: '700', marginBottom: 10, letterSpacing: 1 },
  cardVerseEn: { color: '#fff', fontSize: 13, fontStyle: 'italic', lineHeight: 22, marginBottom: 8 },
  cardVerseTe: { color: '#aac4e8', fontSize: 14, fontStyle: 'italic', lineHeight: 22, marginBottom: 12, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  cardRef: { color: '#FCD34D', fontSize: 11, fontWeight: '700', marginBottom: 15 },
  cardBtnRow: { flexDirection: 'row', gap: 10 },
  cardBtn: { flex: 1, backgroundColor: 'rgba(26,45,90,0.08)', paddingVertical: 10, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(26,45,90,0.12)' },
  cardBtnRed: { backgroundColor: '#c0392b', borderColor: '#c0392b' },
  cardBtnTxt: { color: '#1a2d5a', fontSize: 11, fontWeight: '700' },

  // ─── Footer Action Buttons ────────────────────────────────────────────────
  // Horizontal container: Draft | Save & Publish side-by-side
  footerBtnRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  // Primary: deep navy — Save & Publish
  btnSave: {
    flex: 1,
    backgroundColor: '#1a2d5a',
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    elevation: 6,
    shadowColor: '#1a2d5a',
    shadowOpacity: 0.30,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
  },
  btnSaveTxt: { color: '#fff', fontSize: 13, fontWeight: '800', letterSpacing: 0.3 },
  // Secondary: cream with navy border — Save as Draft
  btnDraft: {
    flex: 1,
    backgroundColor: '#F5F0E8',
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderWidth: 1.5,
    borderColor: 'rgba(26,45,90,0.30)',
  },
  btnDraftTxt: { color: '#1a2d5a', fontSize: 13, fontWeight: '700', letterSpacing: 0.2 },
  btnBack: { alignItems: 'center', paddingVertical: 10 },
  btnBackTxt: { fontSize: 14, color: '#6B7280', fontWeight: '600' },

  // ─── Thumbnail Upload ─────────────────────────────────────────────────────
  btnUploadThumb: {
    backgroundColor: '#FAFAF9',
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#D9D3C7',
    borderStyle: 'dashed',
  },
  btnUploadThumbTxt: { color: '#4B5563', fontSize: 14, fontWeight: '700', marginTop: 8 },
  thumbContainer: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  thumbnailPreviewContainer: { flexDirection: 'row', alignItems: 'center', gap: 15, marginTop: 10 },
  thumbnailImg: { width: 100, height: 100, borderRadius: 12, backgroundColor: '#E5E7EB', borderWidth: 1, borderColor: '#D9D3C7' },
  btnChangeThumb: { backgroundColor: '#1a2d5a', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8 },
  removeThumbnailBtn: { backgroundColor: '#FEE2E2', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: '#FECACA' },
  btnChangeThumbTxt: { color: '#991B1B', fontSize: 13, fontWeight: '700' },

  // ─── FAB ─────────────────────────────────────────────────────────────────
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 30,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#C9A84C',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 8,
  }
});

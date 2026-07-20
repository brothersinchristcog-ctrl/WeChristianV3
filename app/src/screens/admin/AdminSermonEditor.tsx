import React, { useState, useContext, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  TextInput, 
  TouchableOpacity, 
  Alert,
  Modal,
  ActivityIndicator,
  Platform,
  Dimensions,
  StatusBar,
  Share
} from 'react-native';
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { 
  Plus, 
  Search, 
  Calendar as LucideCalendar, 
  ChevronDown, 
  ChevronLeft,
  FileText,
  Calendar as CalendarIcon,
  Film,
  Mic2,
  Image as ImageIcon,
  Folder,
  Radio,
  Clock,
  Type,
  CheckCircle2,
  AlertCircle,
  Play,
  Monitor,
  ChevronRight,
  ArrowLeft,
  X,
  Bell,
  Save
} from 'lucide-react-native';
import { AdminTabContext } from '../../context/AdminTabContext';

import FirestoreService from '../../services/FirestoreService';

const { width } = Dimensions.get('window');

const SERMON_CATEGORIES = [
  'Bible Study',
  "Women's Fasting Prayer",
  'Second Saturday Prayer',
  'Sunday Service',
  'All-Night Prayer',
  'Youth Meeting',
  'Revival Meeting',
  'Special Messages',
  'Shorts',
  'Testimonies',
];

export default function AdminSermonEditor() {
  const { setActiveTab, editingData, setEditingData } = useContext(AdminTabContext);
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showStatusPicker, setShowStatusPicker] = useState(false);
  const statusOptions = [
    { label: 'Draft — not visible to members yet', value: 'Draft' },
    { label: 'Publish now — visible to all members', value: 'Published' },
    { label: 'Schedule for a specific date & time', value: 'Scheduled' }
  ];

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [audioFile, setAudioFile] = useState<any>(null);
  const [thumbnailFile, setThumbnailFile] = useState<any>(null);

  const getStatusLabel = (val: string) => {
    return statusOptions.find(o => o.value === val)?.label || 'Select Status';
  };
  
  const [form, setForm] = useState({
    titleEn: '',
    titleTe: '',
    pastor: '',
    date: (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; })(),
    ref: '',
    duration: '',
    youtubeId: '',
    description: '',
    status: 'Published',
    notifyMembers: true,
    autoSend: false
  });
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const toggleCategory = (cat: string) => {
    setSelectedCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  useEffect(() => {
    if (editingData) {
      setForm(prev => ({
        ...prev,
        titleEn: editingData.title || '',
        titleTe: editingData.titleTelugu || '',
        pastor: editingData.pastor || '',
        date: editingData.date || (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; })(),
        ref: editingData.scripture || '',
        duration: editingData.duration || '45 mins',
        youtubeId: editingData.youtubeId || '',
        description: editingData.description || '',
        status: editingData.status || 'Published'
      }));
      // Load existing categories
      if (editingData.categories) {
        setSelectedCategories(
          typeof editingData.categories === 'string'
            ? editingData.categories.split(';').filter(Boolean)
            : editingData.categories
        );
      }
    }
  }, [editingData]);

  const handleAudioPick = async () => {
    try {
      const DocumentPicker = require('expo-document-picker');
      const res = await DocumentPicker.getDocumentAsync({ type: 'audio/*' });
      if (!res.canceled) setAudioFile(res.assets[0]);
    } catch (err) { 
      console.error('Audio Pick Error:', err);
      Alert.alert("Feature Unavailable", "Audio picking requires a new development build. Please contact your developer.");
    }
  };

  const handleImagePick = async () => {
    try {
      const ImagePicker = require('expo-image-picker');
      const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: 'images', allowsEditing: true, aspect: [16, 9], quality: 0.8 });
      if (!res.canceled) setThumbnailFile(res.assets[0]);
    } catch (err) { 
      console.error('Image Pick Error:', err);
      Alert.alert("Feature Unavailable", "Image picking requires a new development build. Please contact your developer.");
    }
  };

  const handleConfirm = (date: Date) => {
    // Avoid toISOString() as it shifts the date to UTC, causing it to display the previous day in some timezones.
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;
    
    setForm({ ...form, date: formattedDate });
    setShowDatePicker(false);
  };

  const handleSave = async (status: string) => {
    setLoading(true);
    try {
      const payload = {
        id: editingData?.id,
        ...form,
        title: form.titleEn,
        titleTelugu: form.titleTe,
        status: status || form.status,
        scripture: form.ref,
        categories: selectedCategories.join(';')
      };
      await FirestoreService.createSermon(payload);

      // 🔔 Push notification to all members when publishing
      if (payload.status === 'Published') {
        try {
          const churchId = await FirestoreService.getChurchId();
          await FirestoreService.createNotificationBroadcast({
            title: `🎧 New Sermon: ${form.titleEn}`,
            content: `New sermon "${form.titleEn}" by ${form.pastor || 'Pastor'} is now available. Watch/listen now!`,
            date: form.date,
            type: 'sermon',
            targetChurchId: churchId,
          });
          console.log('🔔 Sermon push notification queued.');
        } catch (notifErr) {
          console.warn('⚠️ Sermon push notification failed:', notifErr);
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
    setActiveTab(3);
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setActiveTab(3)} style={styles.backBtn}>
            <ChevronLeft size={20} color="#1a2d5a" />
            <Text style={styles.backBtnTxt}>Sermons</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>{editingData ? 'Edit Sermon' : 'Add Sermon'}</Text>
            <Text style={styles.headerSub}>YouTube · Audio · Bilingual</Text>
          </View>
        </View>

        {/* 1. Sermon Info */}
        <View style={styles.modBox}>
          <View style={[styles.modHd, styles.hdBlue]}>
            <FileText size={14} color="#1a2d5a" />
            <Text style={styles.modHdTxt}>Sermon Info</Text>
          </View>
          
          <View style={styles.fGroup}>
            <Text style={styles.fLabel}>Title — English <Text style={{color:'#c0392b'}}>*</Text></Text>
            <TextInput style={styles.input} value={form.titleEn} onChangeText={(v) => setForm({...form, titleEn: v})} placeholder="e.g. Walking in Faith Through Trials" />
          </View>

          <View style={styles.fGroup}>
            <Text style={styles.fLabel}>Title — Telugu</Text>
            <TextInput style={[styles.input, styles.teIn]} value={form.titleTe} onChangeText={(v) => setForm({...form, titleTe: v})} placeholder="తెలుగులో శీర్షిక..." />
          </View>

          <View style={styles.fGroup}>
            <Text style={styles.fLabel}>Pastor Name <Text style={{color:'#c0392b'}}>*</Text></Text>
            <TextInput style={styles.input} value={form.pastor} onChangeText={(v) => setForm({...form, pastor: v})} placeholder="e.g. Pastor Daniel Raju" />
          </View>

          <View style={styles.row}>
            <View style={[styles.fGroup, {flex: 2}]}>
              <Text style={styles.fLabel}>Sermon Date</Text>
              <TouchableOpacity style={styles.inputWithIcon} onPress={() => setShowDatePicker(true)}>
                <Text style={[styles.inputTxt, { flex: 1 }]}>
                  {form.date}
                </Text>
                <CalendarIcon size={16} color="#1a2d5a" style={{ marginLeft: 8 }} />
              </TouchableOpacity>
            </View>
            <View style={[styles.fGroup, {flex: 1.2}]}>
              <Text style={styles.fLabel}>Duration</Text>
              <TextInput style={styles.input} value={form.duration} onChangeText={(v) => setForm({...form, duration: v})} placeholder="e.g. 42 min" />
            </View>
          </View>

          <DateTimePickerModal
            isVisible={showDatePicker}
            mode="date"
            onConfirm={handleConfirm}
            onCancel={() => setShowDatePicker(false)}
            date={new Date(form.date)}
          />

          <View style={styles.fGroup}>
            <Text style={styles.fLabel}>Scripture reference</Text>
            <TextInput style={styles.input} value={form.ref} onChangeText={(v) => setForm({...form, ref: v})} placeholder="e.g. James 1:2-4" />
          </View>
        </View>

        {/* Categories */}
        <View style={styles.modBox}>
          <View style={[styles.modHd, styles.hdBlue]}>
            <Folder size={14} color="#1a2d5a" />
            <Text style={styles.modHdTxt}>Sermon Category</Text>
          </View>
          <Text style={[styles.fHint, { marginBottom: 14, fontSize: 11 }]}>Select all that apply. Members will see sermons grouped under these categories.</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {SERMON_CATEGORIES.map(cat => {
              const isSelected = selectedCategories.includes(cat);
              return (
                <TouchableOpacity
                  key={cat}
                  onPress={() => toggleCategory(cat)}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderRadius: 20,
                    borderWidth: 1.5,
                    borderColor: isSelected ? '#1a2d5a' : '#d1d5db',
                    backgroundColor: isSelected ? '#1a2d5a' : '#fff',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  {isSelected && <CheckCircle2 size={13} color="#FCD34D" />}
                  <Text style={{ fontSize: 12, fontWeight: '600', color: isSelected ? '#fff' : '#374151' }}>{cat}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {selectedCategories.length > 0 && (
            <View style={{ marginTop: 14, backgroundColor: '#f0f7ff', borderRadius: 8, padding: 10 }}>
              <Text style={{ fontSize: 11, color: '#1a2d5a', fontWeight: '600' }}>Selected: {selectedCategories.join(' · ')}</Text>
            </View>
          )}
        </View>

        {/* 2. Media & Details */}
        <View style={styles.modBox}>
          <View style={styles.mediaBanner}>
            <Film size={14} color="#c0392b" />
            <Text style={styles.mediaBannerTxt}>Media & Details</Text>
          </View>

          <View style={styles.fGroup}>
            <Text style={styles.fLabel}>YouTube video URL</Text>
            <TextInput style={styles.input} value={form.youtubeId} onChangeText={(v) => setForm({...form, youtubeId: v})} placeholder="https://youtube.com/watch?v=..." />
            <Text style={styles.fHint}>Paste full URL or 11-character video ID</Text>
          </View>

          <View style={styles.fGroup}>
            <Text style={styles.fLabel}>Audio file <Text style={styles.fHint}>MP3 - Max 100MB</Text></Text>
            <TouchableOpacity style={[styles.dashBox, audioFile && styles.dashBoxActive]} onPress={handleAudioPick}>
              {audioFile ? (
                <>
                  <CheckCircle2 size={24} color="#059669" />
                  <Text style={[styles.dashTxt, {color: '#059669'}]}>{audioFile.name}</Text>
                  <Text style={styles.dashHint}>File ready to upload</Text>
                </>
              ) : (
                <>
                  <Mic2 size={24} color="#9CA3AF" />
                  <Text style={styles.dashTxt}>Tap to upload sermon audio</Text>
                  <Text style={styles.dashHint}>MP3 or WAV - Maximum 100 MB</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.fGroup}>
            <Text style={styles.fLabel}>Thumbnail <Text style={styles.fHint}>Auto-fetched from YouTube if linked</Text></Text>
            <TouchableOpacity style={[styles.dashBox, thumbnailFile && styles.dashBoxActive]} onPress={handleImagePick}>
              {thumbnailFile ? (
                <>
                  <CheckCircle2 size={24} color="#059669" />
                  <Text style={[styles.dashTxt, {color: '#059669'}]}>Image Selected</Text>
                  <Text style={styles.dashHint}>Custom thumbnail will be used</Text>
                </>
              ) : (
                <>
                  <ImageIcon size={24} color="#9CA3AF" />
                  <Text style={styles.dashTxt}>Upload custom thumbnail</Text>
                  <Text style={styles.dashHint}>JPG or PNG - 16:9 recommended</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.fGroup}>
            <Text style={styles.fLabel}>Description <Text style={styles.fHint}>Shown below title in app</Text></Text>
            <TextInput style={[styles.input, { fontFamily: 'monospace', fontSize: 12 }]} multiline numberOfLines={3} value={form.description} onChangeText={(v) => setForm({...form, description: v})} placeholder="Brief summary of this sermon..." />
          </View>
        </View>

        {/* 4. Notifications */}
        <View style={styles.modBox}>
          <View style={[styles.modHd, styles.hdYellow]}>
            <Bell size={14} color="#D97706" />
            <Text style={[styles.modHdTxt, {color: '#D97706'}]}>Push Notification</Text>
          </View>
          <View style={styles.toggleRow}>
            <Text style={styles.toggleTxt}>Notify members when published</Text>
            <TouchableOpacity style={[styles.switch, styles.switchOn]} onPress={() => {}}>
              <View style={[styles.switchDot, styles.switchDotOn]} />
            </TouchableOpacity>
          </View>
          <View style={styles.toggleRow}>
            <Text style={styles.toggleTxt}>Auto-send immediately on publish</Text>
            <TouchableOpacity style={styles.switch} onPress={() => {}}>
              <View style={styles.switchDot} />
            </TouchableOpacity>
          </View>

          {/* Notification Preview */}
          <View style={styles.notifPreview}>
            <View style={styles.notifHeader}>
              <View style={styles.notifLogo}><Text style={{fontSize: 6, color: '#fff', fontWeight: '800'}}>CG</Text></View>
              <Text style={styles.notifHeaderTxt}>Your Church · Now</Text>
            </View>
            <Text style={styles.notifTitle}>New Sermon 🎙️</Text>
            <Text style={styles.notifBody}>Sermon title · Pastor name · Watch now</Text>
          </View>
        </View>

        {/* 5. Publish Status */}
        <View style={styles.modBox}>
          <View style={[styles.modHd, styles.hdBlue]}>
            <Radio size={14} color="#1a2d5a" />
            <Text style={styles.modHdTxt}>Publish Status</Text>
          </View>
          <TouchableOpacity style={styles.selectBox} onPress={() => setShowStatusPicker(true)}>
            <Text style={styles.selectTxt}>{getStatusLabel(form.status)}</Text>
            <ChevronDown size={18} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* Action Buttons */}
        <View style={{ marginBottom: 40 }}>
          <TouchableOpacity style={styles.btnPublishFull} onPress={() => handleSave('Published')}>
            <Radio size={18} color="#fff" />
            <Text style={styles.btnPublishFullTxt}>Publish Sermon</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.btnSaveFull} onPress={() => handleSave('Draft')}>
            <FileText size={18} color="#fff" />
            <Text style={styles.btnSaveFullTxt}>Save as Draft</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.btnPreviewOutline}>
            <Monitor size={18} color="#1a2d5a" />
            <Text style={styles.btnPreviewOutlineTxt}>App Preview</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.btnBackLink} onPress={() => setActiveTab(3)}>
            <Text style={styles.btnBackLinkTxt}>← Back to sermons</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Status Picker Modal */}
      <Modal visible={showStatusPicker} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowStatusPicker(false)}>
          <View style={styles.pickerCard}>
            {statusOptions.map((opt) => (
              <TouchableOpacity 
                key={opt.value} 
                style={[styles.pickerItem, form.status === opt.value && styles.pickerItemActive]}
                onPress={() => {
                  setForm({ ...form, status: opt.value });
                  setShowStatusPicker(false);
                }}
              >
                <Text style={[styles.pickerItemTxt, form.status === opt.value && styles.pickerItemTxtActive]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Success Modal */}
      <Modal visible={showSuccess} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.successCard}>
            <View style={styles.successIconBox}>
              <CheckCircle2 size={50} color="#15803D" strokeWidth={3} />
            </View>
            <Text style={styles.successTitle}>Success!</Text>
            <Text style={styles.successSub}>Your sermon metadata has been saved successfully.</Text>
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
      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab} onPress={() => handleSave('Published')}>
        <Save size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f2f7' },
  scroll: { padding: 14, paddingBottom: 100 },

  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#c0392b', gap: 10 },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#1a2d5a' },
  headerSub: { fontSize: 10, color: '#9CA3AF', marginTop: 2 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingVertical: 4, paddingHorizontal: 2 },
  backBtnTxt: { fontSize: 13, fontWeight: '700', color: '#1a2d5a' },

  modBox: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 15, borderWidth: 0.5, borderColor: '#e5e7eb', elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3 },
  modHd: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14, padding: 10, marginHorizontal: -16, marginTop: -16, borderTopLeftRadius: 12, borderTopRightRadius: 12, borderBottomWidth: 0.5, borderBottomColor: '#e5e7eb' },
  hdBlue: { backgroundColor: '#f0f7ff', borderLeftWidth: 3, borderLeftColor: '#1a2d5a' },
  hdYellow: { backgroundColor: '#fffbeb', borderLeftWidth: 3, borderLeftColor: '#d97706' },
  modHdTxt: { fontSize: 11, fontWeight: '700', color: '#1a2d5a', textTransform: 'uppercase', letterSpacing: 0.5 },

  fGroup: { marginBottom: 16 },
  fLabel: { fontSize: 12, fontWeight: '600', color: '#374151', marginBottom: 6 },
  fHint: { fontSize: 9, color: '#9CA3AF', fontWeight: '400', marginTop: 2 },
  row: { flexDirection: 'row', gap: 10 },

  input: { backgroundColor: '#fdfdfd', borderWidth: 0.5, borderColor: '#d1d5db', borderRadius: 8, padding: 12, fontSize: 13, color: '#111827' },
  inputWithIcon: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fdfdfd', borderWidth: 0.5, borderColor: '#d1d5db', borderRadius: 8, paddingHorizontal: 12, height: 45 },
  inputTxt: { fontSize: 13, color: '#111827' },
  teIn: { fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', color: '#1a2d5a', fontStyle: 'italic', backgroundColor: '#F8FAFF' },
  textarea: { minHeight: 80, textAlignVertical: 'top' },

  selectBox: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', borderWidth: 0.5, borderColor: '#d1d5db', borderRadius: 8, padding: 12 },
  selectTxt: { fontSize: 13, color: '#374151', fontWeight: '500' },

  mediaBanner: { backgroundColor: '#fee2e2', borderLeftWidth: 3, borderLeftColor: '#c0392b', padding: 8, flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 15, marginTop: 5 },
  mediaBannerTxt: { color: '#c0392b', fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },

  dashBox: { borderStyle: 'dashed', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, padding: 25, alignItems: 'center', backgroundColor: '#fafafa' },
  dashBoxActive: { borderColor: '#059669', backgroundColor: '#F0FDF4', borderStyle: 'solid' },
  dashTxt: { fontSize: 11, fontWeight: '600', color: '#4b5563', marginTop: 10 },
  dashHint: { fontSize: 9, color: '#9CA3AF', marginTop: 4 },

  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  toggleTxt: { fontSize: 12, color: '#374151', fontWeight: '500' },
  switch: { width: 44, height: 24, borderRadius: 12, backgroundColor: '#d1d5db', padding: 2 },
  switchOn: { backgroundColor: '#1a2d5a' },
  switchDot: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff' },
  switchDotOn: { alignSelf: 'flex-end' },

  notifPreview: { backgroundColor: '#f8fafc', borderRadius: 12, padding: 12, marginTop: 10, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5 },
  notifHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  notifLogo: { width: 14, height: 14, backgroundColor: '#1a2d5a', borderRadius: 4, justifyContent: 'center', alignItems: 'center' },
  notifHeaderTxt: { fontSize: 9, color: '#64748b' },
  notifTitle: { fontSize: 11, fontWeight: '700', color: '#1e293b' },
  notifBody: { fontSize: 10, color: '#64748b' },

  btnPublishFull: { backgroundColor: '#c0392b', borderRadius: 10, padding: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 10 },
  btnPublishFullTxt: { color: '#fff', fontSize: 14, fontWeight: '700' },
  btnSaveFull: { backgroundColor: '#1a2d5a', borderRadius: 10, padding: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 10 },
  btnSaveFullTxt: { color: '#fff', fontSize: 14, fontWeight: '700' },
  btnPreviewOutline: { backgroundColor: '#fff', borderRadius: 10, padding: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 15, borderWidth: 1.5, borderColor: '#d1d5db' },
  btnPreviewOutlineTxt: { color: '#1a2d5a', fontSize: 14, fontWeight: '700' },
  btnBackLink: { alignItems: 'center', marginTop: 10 },
  btnBackLinkTxt: { fontSize: 12, color: '#374151', fontWeight: '600' },

  pickerCard: { backgroundColor: '#fff', width: '90%', borderRadius: 12, padding: 8, elevation: 20, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 15 },
  pickerItem: { padding: 15, borderRadius: 8 },
  pickerItemActive: { backgroundColor: '#1a2d5a' },
  pickerItemTxt: { fontSize: 13, color: '#374151', fontWeight: '500' },
  pickerItemTxtActive: { color: '#fff', fontWeight: '700' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  successCard: { backgroundColor: '#fff', width: '80%', borderRadius: 24, padding: 30, alignItems: 'center' },
  successIconBox: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#F0FDF4', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  successTitle: { fontSize: 22, fontWeight: '800', color: '#1a2d5a', marginBottom: 10 },
  successSub: { fontSize: 13, color: '#6B7280', textAlign: 'center', marginBottom: 25 },
  successBtn: { backgroundColor: '#1a2d5a', width: '100%', paddingVertical: 15, borderRadius: 12, alignItems: 'center' },
  successBtnTxt: { color: '#fff', fontSize: 14, fontWeight: '700' },

  errorCard: { backgroundColor: '#fff', width: '80%', borderRadius: 24, padding: 30, alignItems: 'center' },
  errorIconBox: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#FEF2F2', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  errorTitle: { fontSize: 20, fontWeight: '800', color: '#c0392b', marginBottom: 10 },
  errorSub: { fontSize: 13, color: '#6B7280', textAlign: 'center', marginBottom: 25 },

  fab: { position: 'absolute', right: 20, bottom: 30, width: 60, height: 60, borderRadius: 30, backgroundColor: '#c0392b', justifyContent: 'center', alignItems: 'center', elevation: 10, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 10 },

  pickerCardJS: { backgroundColor: '#fff', width: '90%', borderRadius: 16, padding: 20, elevation: 20, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 15 },
  pickerHd: { fontSize: 16, fontWeight: '800', color: '#1a2d5a', marginBottom: 20, textAlign: 'center' },
  pickerGrid: { flexDirection: 'row', gap: 10, height: 200 },
  pickerCol: { flex: 1 },
  pickerColHd: { fontSize: 10, fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', marginBottom: 10, textAlign: 'center' },
  pickerItemJS: { paddingVertical: 10, alignItems: 'center', borderRadius: 8, marginBottom: 4 },
  pickerItemJSActive: { backgroundColor: '#F0FDF4' },
  pickerItemJSTxt: { fontSize: 14, color: '#374151', fontWeight: '500' },
  pickerItemJSTxtActive: { color: '#059669', fontWeight: '800' },
  pickerBtn: { backgroundColor: '#1a2d5a', borderRadius: 10, padding: 15, alignItems: 'center', marginTop: 20 },
  pickerBtnTxt: { color: '#fff', fontWeight: '700' },
});


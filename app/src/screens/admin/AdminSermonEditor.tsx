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
        {/* ── Hero Section ── */}
        <View style={styles.hero}>
          <View style={styles.heroTitleRow}>
            <TouchableOpacity onPress={() => setActiveTab(3)} style={{ flexDirection: 'row', alignItems: 'center' }}>
              <ChevronLeft size={20} color="#fff" style={{ marginLeft: -6, marginRight: 4 }} />
              <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>Back</Text>
            </TouchableOpacity>
            <Text style={[styles.heroTitle, { marginHorizontal: 12, opacity: 0.4 }]}>|</Text>
            <Text style={styles.heroTitle}>{editingData ? 'Edit Sermon' : 'New Sermon'}</Text>
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
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.btnDraft} onPress={() => handleSave('Draft')}>
            <FileText size={18} color="#1a2d5a" />
            <Text style={styles.btnDraftTxt}>Save as Draft</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.btnPublish} onPress={() => handleSave('Published')}>
            <CheckCircle2 size={18} color="#fff" />
            <Text style={styles.btnPublishTxt}>Publish</Text>
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
  // ─── Layout ──────────────────────────────────────────────────────────────
  container: { flex: 1, backgroundColor: '#EDE8DC' },
  scroll: { padding: 14, paddingBottom: 100 },

  // ─── Hero ────────────────────────────────────────────────────────────────
  hero: {
    backgroundColor: '#1a2d5a',
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
    paddingHorizontal: 22,
    paddingTop: 10,
    paddingBottom: 24,
    marginBottom: 14,
    marginHorizontal: -14,
    marginTop: -14, // counteract scroll padding for hero flush to top
  },
  heroTitleRow: { flexDirection: 'row', alignItems: 'center' },
  heroTitle: { color: '#fff', fontSize: 24, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', fontWeight: '600', letterSpacing: -0.5 },
  heroSub: { color: '#AEB8D4', fontSize: 13, marginTop: 4 },

  // ─── Cards ───────────────────────────────────────────────────────────────
  modBox: { 
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(26,45,90,0.08)',
    borderTopWidth: 3,
    borderTopColor: '#1a2d5a',
    shadowColor: '#1a2d5a',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  modHd: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(26,45,90,0.08)', paddingBottom: 10 },
  hdBlue: { },
  hdYellow: { },
  modHdTxt: { fontSize: 12, fontWeight: '800', color: '#1a2d5a', textTransform: 'uppercase', letterSpacing: 0.5 },

  fGroup: { marginBottom: 16 },
  fLabel: { fontSize: 12, fontWeight: '700', color: '#1a2d5a', marginBottom: 6 },
  fHint: { fontSize: 9, color: '#9CA3AF', fontWeight: '500', marginTop: 4 },
  row: { flexDirection: 'row', gap: 10 },

  input: { backgroundColor: '#FDFDFD', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, padding: 12, fontSize: 13, color: '#1a2d5a' },
  inputWithIcon: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FDFDFD', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, paddingHorizontal: 12, height: 45 },
  inputTxt: { fontSize: 13, color: '#1a2d5a' },
  teIn: { fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', color: '#1a2d5a', fontStyle: 'italic', backgroundColor: '#F9F6F0' },
  textarea: { minHeight: 80, textAlignVertical: 'top' },

  selectBox: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, padding: 12 },
  selectTxt: { fontSize: 13, color: '#1a2d5a', fontWeight: '600' },

  mediaBanner: { backgroundColor: '#F9F6F0', borderRadius: 8, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 15, marginTop: 5 },
  mediaBannerTxt: { color: '#1a2d5a', fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },

  dashBox: { borderStyle: 'dashed', borderWidth: 1.5, borderColor: '#D1D5DB', borderRadius: 12, padding: 25, alignItems: 'center', backgroundColor: '#FAFAFA' },
  dashBoxActive: { borderColor: '#2E6B4F', backgroundColor: '#F0FDF4', borderStyle: 'solid' },
  dashTxt: { fontSize: 11, fontWeight: '700', color: '#1a2d5a', marginTop: 10 },
  dashHint: { fontSize: 9, color: '#9CA3AF', marginTop: 4, fontWeight: '500' },

  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  toggleTxt: { fontSize: 12, color: '#1a2d5a', fontWeight: '600' },
  switch: { width: 44, height: 24, borderRadius: 12, backgroundColor: '#D1D5DB', padding: 2 },
  switchOn: { backgroundColor: '#1a2d5a' },
  switchDot: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff' },
  switchDotOn: { alignSelf: 'flex-end' },

  notifPreview: { backgroundColor: '#F8FAFC', borderRadius: 12, padding: 12, marginTop: 10, borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#1a2d5a', shadowOpacity: 0.05, shadowRadius: 5 },
  notifHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  notifLogo: { width: 14, height: 14, backgroundColor: '#1a2d5a', borderRadius: 4, justifyContent: 'center', alignItems: 'center' },
  notifHeaderTxt: { fontSize: 9, color: '#64748B', fontWeight: '600' },
  notifTitle: { fontSize: 11, fontWeight: '800', color: '#1E293B' },
  notifBody: { fontSize: 10, color: '#64748B', fontWeight: '500' },

  actionRow: { flexDirection: 'row', gap: 10, marginTop: 10, marginBottom: 40 },
  btnDraft: { flex: 1, backgroundColor: '#F5F0E8', borderRadius: 12, paddingVertical: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: '#E2DDD5' },
  btnDraftTxt: { color: '#1a2d5a', fontSize: 14, fontWeight: '800' },
  btnPublish: { flex: 1, backgroundColor: '#2E6B4F', borderRadius: 12, paddingVertical: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
  btnPublishTxt: { color: '#fff', fontSize: 14, fontWeight: '800' },

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

  fab: { position: 'absolute', right: 20, bottom: 30, width: 60, height: 60, borderRadius: 30, backgroundColor: '#2E6B4F', justifyContent: 'center', alignItems: 'center', elevation: 10, shadowColor: '#1a2d5a', shadowOpacity: 0.3, shadowRadius: 10 },

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


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
  KeyboardAvoidingView,
  Share,
  Image
} from 'react-native';
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { formatDateDisplay } from '../../utils/DateUtils';
import { LinearGradient } from 'expo-linear-gradient';
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
  FolderPlus,
  Radio, 
  Clock, 
  Type, 
  CheckCircle2, 
  AlertCircle, 
  Play, 
  Monitor, 
  ChevronRight, 
  ArrowLeft, 
  ArrowRight,
  X, 
  Bell, 
  Save,
  Send,
  Check,
  User
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

const extractYoutubeId = (url: string) => {
  if (!url || typeof url !== 'string') return '';
  const cleanUrl = url.trim();
  const match = cleanUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/|live\/))([\w-]+)/);
  return match ? match[1] : cleanUrl;
};

export default function AdminSermonEditor() {
  const { setActiveTab, editingData, setEditingData, setTabByName } = useContext(AdminTabContext);
  const [loading, setLoading] = useState(false);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [lastSavedStatus, setLastSavedStatus] = useState<string>('Published');
  const [savingActionText, setSavingActionText] = useState('Saving Sermon…');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [audioFile, setAudioFile] = useState<any>(null);
  const [thumbnailFile, setThumbnailFile] = useState<any>(null);
  
  const [form, setForm] = useState({
    titleEn: '',
    titleTe: '',
    pastor: '',
    date: (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; })(),
    ref: '',
    duration: '',
    youtubeId: '',
    description: '',
    thumbnailUrl: '',
    status: 'Published',
    notifyMembers: true,
    autoSend: false
  });
  const [categories, setCategories] = useState<string[]>(SERMON_CATEGORIES);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showNewCategoryModal, setShowNewCategoryModal] = useState(false);
  const [newCatInput, setNewCatInput] = useState('');
  const [savingCategory, setSavingCategory] = useState(false);

  useEffect(() => {
    FirestoreService.getSermonCategories().then(cats => {
      if (Array.isArray(cats) && cats.length > 0) {
        setCategories(cats);
      }
    }).catch(err => console.warn('Could not fetch sermon categories:', err));
  }, []);

  const toggleCategory = (cat: string) => {
    setSelectedCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const handleAddNewCategory = async () => {
    const trimmed = newCatInput.trim();
    if (!trimmed) {
      Alert.alert('Required', 'Please enter a category name.');
      return;
    }

    const existingMatch = categories.find(c => c.toLowerCase() === trimmed.toLowerCase());
    if (existingMatch) {
      if (!selectedCategories.includes(existingMatch)) {
        setSelectedCategories(prev => [...prev, existingMatch]);
      }
      setShowNewCategoryModal(false);
      setNewCatInput('');
      return;
    }

    setSavingCategory(true);
    try {
      const updated = await FirestoreService.addSermonCategory(trimmed);
      setCategories(updated);
      setSelectedCategories(prev => [...prev, trimmed]);
      setShowNewCategoryModal(false);
      setNewCatInput('');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save category. Please try again.');
    } finally {
      setSavingCategory(false);
    }
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
        thumbnailUrl: editingData.thumbnailUrl || editingData.imageUrl || '',
        status: editingData.status || 'Published'
      }));
      // Load existing categories
      if (editingData.categories) {
        const loaded = typeof editingData.categories === 'string'
          ? editingData.categories.split(';').map((c: string) => c.trim()).filter(Boolean)
          : editingData.categories;
        setSelectedCategories(loaded);
        setCategories(prev => {
          const merged = [...prev];
          loaded.forEach((c: string) => {
            if (!merged.includes(c)) merged.push(c);
          });
          return merged;
        });
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

  const uploadImageToCloud = async (localUri: string): Promise<string> => {
    try {
      const storage = require('@react-native-firebase/storage').default;
      const churchId = await FirestoreService.getChurchId();
      const ext = localUri.substring(localUri.lastIndexOf('.') + 1) || 'jpg';
      const storagePath = `churches/${churchId || 'common'}/sermons/thumbnails/thumb_${Date.now()}.${ext}`;
      
      const reference = storage().ref(storagePath);
      await reference.putFile(localUri);
      const downloadURL = await reference.getDownloadURL();
      return downloadURL;
    } catch (error) {
      console.error('Storage upload failed:', error);
      throw new Error('Cloud upload failed');
    }
  };

  const handleImagePick = async () => {
    try {
      const ImagePicker = require('expo-image-picker');
      const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: 'images', allowsEditing: true, aspect: [16, 9], quality: 0.8 });
      if (!res.canceled && res.assets && res.assets[0]?.uri) {
        const localUri = res.assets[0].uri;
        setThumbnailFile(res.assets[0]);
        setUploadingThumbnail(true);
        try {
          const cloudUrl = await uploadImageToCloud(localUri);
          setForm(prev => ({ ...prev, thumbnailUrl: cloudUrl }));
        } catch (uploadErr) {
          Alert.alert("Upload Failed", "Could not upload thumbnail to cloud storage. Please check your connection.");
        } finally {
          setUploadingThumbnail(false);
        }
      }
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
    const finalStatus = status || form.status || 'Published';
    setLastSavedStatus(finalStatus);
    setSavingActionText(
      finalStatus === 'Published' 
        ? 'Publishing Sermon…' 
        : finalStatus === 'Scheduled' 
        ? 'Scheduling Sermon…' 
        : 'Saving Sermon Draft…'
    );
    setLoading(true);
    try {
      const payload = {
        id: editingData?.id,
        ...form,
        title: form.titleEn,
        titleTelugu: form.titleTe,
        status: finalStatus,
        scripture: form.ref,
        categories: selectedCategories.join(';'),
        thumbnailUrl: form.thumbnailUrl || '',
        imageUrl: form.thumbnailUrl || '',
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

      setForm(prev => ({ ...prev, status: finalStatus }));
      setShowSuccess(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save sermon. Please check your connection.');
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };

  const closeSuccess = () => {
    setShowSuccess(false);
    setTabByName?.('Sermons');
  };

  const cleanYId = extractYoutubeId(form.youtubeId || '');
  const autoYoutubeThumb = cleanYId && cleanYId.length === 11 ? `https://img.youtube.com/vi/${cleanYId}/hqdefault.jpg` : null;
  const currentThumbnailUri = form.thumbnailUrl || (thumbnailFile ? thumbnailFile.uri : null);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a2d5a" />

      {/* ── Hero Section ── */}
      <View style={styles.hero}>
        <View style={styles.heroTitleRow}>
          <TouchableOpacity onPress={() => setTabByName?.('Sermons')} style={{ flexDirection: 'row', alignItems: 'center' }}>
            <ChevronLeft size={20} color="#fff" style={{ marginLeft: -6, marginRight: 4 }} />
            <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>Back</Text>
          </TouchableOpacity>
          <Text style={[styles.heroTitle, { marginHorizontal: 12, opacity: 0.4 }]}>|</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle}>{editingData ? 'Edit Sermon' : 'New Sermon'}</Text>
            <Text style={styles.heroSub}>{editingData ? 'Update sermon details & media' : 'Create & publish sermon video'}</Text>
          </View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

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
                  {formatDateDisplay(form.date)}
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
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {categories.map(cat => {
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

            {/* + New Category Button */}
            <TouchableOpacity
              onPress={() => setShowNewCategoryModal(true)}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 20,
                borderWidth: 1.5,
                borderStyle: 'dashed',
                borderColor: '#1a2d5a',
                backgroundColor: '#f0f4ff',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6
              }}
            >
              <Plus size={14} color="#1a2d5a" />
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#1a2d5a' }}>New</Text>
            </TouchableOpacity>
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
            <Text style={styles.fLabel}>Thumbnail <Text style={styles.fHint}>16:9 Landscape Banner</Text></Text>
            {uploadingThumbnail ? (
              <View style={[styles.dashBox, { height: 160, justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#1a2d5a" />
                <Text style={[styles.dashTxt, { marginTop: 10, color: '#1a2d5a' }]}>Uploading thumbnail to cloud...</Text>
              </View>
            ) : currentThumbnailUri ? (
              <View style={styles.thumbPreviewCard}>
                <Image 
                  source={{ uri: currentThumbnailUri }} 
                  style={styles.thumbPreviewImg} 
                  resizeMode="cover" 
                />
                <View style={styles.thumbOverlayBar}>
                  <TouchableOpacity style={styles.thumbBtnEdit} onPress={handleImagePick}>
                    <ImageIcon size={13} color="#fff" />
                    <Text style={styles.thumbBtnTxt}>Change Image</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.thumbBtnDelete} 
                    onPress={() => {
                      setThumbnailFile(null);
                      setForm(prev => ({ ...prev, thumbnailUrl: '' }));
                    }}
                  >
                    <X size={13} color="#fff" />
                    <Text style={styles.thumbBtnTxt}>Remove</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : autoYoutubeThumb ? (
              <View style={styles.thumbPreviewCard}>
                <Image 
                  source={{ uri: autoYoutubeThumb }} 
                  style={styles.thumbPreviewImg} 
                  resizeMode="cover" 
                />
                <View style={styles.thumbYoutubeBadge}>
                  <Text style={styles.thumbYoutubeBadgeTxt}>📺 Auto-fetched from YouTube</Text>
                </View>
                <TouchableOpacity style={styles.thumbBtnUploadCustom} onPress={handleImagePick}>
                  <ImageIcon size={13} color="#1a2d5a" />
                  <Text style={{ color: '#1a2d5a', fontSize: 11, fontWeight: '700' }}>Upload Custom Thumbnail</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.dashBox} onPress={handleImagePick}>
                <ImageIcon size={26} color="#9CA3AF" />
                <Text style={styles.dashTxt}>Upload custom thumbnail</Text>
                <Text style={styles.dashHint}>JPG or PNG — 16:9 recommended</Text>
              </TouchableOpacity>
            )}
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
            <Text style={styles.notifBody}>Sermon title will appear here for members</Text>
          </View>
        </View>

        {/* 5. Publish Status */}
        <View style={styles.modBox}>
          <View style={[styles.modHd, styles.hdBlue]}>
            <Radio size={14} color="#1a2d5a" />
            <Text style={styles.modHdTxt}>Publish Status</Text>
          </View>
          <View style={styles.statusSelectorContainer}>
            {/* Option 1: Publish Now */}
            <TouchableOpacity
              style={[
                styles.statusOptionCard,
                form.status === 'Published' && styles.statusOptionCardPublished
              ]}
              onPress={() => setForm({ ...form, status: 'Published' })}
              activeOpacity={0.8}
            >
              <View style={[
                styles.statusOptionIconBox,
                form.status === 'Published' ? styles.statusOptionIconBoxPublished : {}
              ]}>
                <Send size={15} color={form.status === 'Published' ? '#fff' : '#059669'} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={[
                    styles.statusOptionTitle,
                    form.status === 'Published' && styles.statusOptionTitlePublished
                  ]}>
                    Publish Now
                  </Text>
                  {form.status === 'Published' && (
                    <View style={styles.activeDotGreen} />
                  )}
                </View>
                <Text style={styles.statusOptionSub}>Live immediately on Member Sermons View</Text>
              </View>
              <View style={[
                styles.statusRadioCircle,
                form.status === 'Published' && styles.statusRadioCirclePublished
              ]}>
                {form.status === 'Published' && <Check size={12} color="#fff" strokeWidth={3} />}
              </View>
            </TouchableOpacity>

            {/* Option 2: Scheduled */}
            <TouchableOpacity
              style={[
                styles.statusOptionCard,
                form.status === 'Scheduled' && styles.statusOptionCardScheduled
              ]}
              onPress={() => setForm({ ...form, status: 'Scheduled' })}
              activeOpacity={0.8}
            >
              <View style={[
                styles.statusOptionIconBox,
                form.status === 'Scheduled' ? styles.statusOptionIconBoxScheduled : {}
              ]}>
                <Clock size={15} color={form.status === 'Scheduled' ? '#fff' : '#D97706'} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={[
                    styles.statusOptionTitle,
                    form.status === 'Scheduled' && styles.statusOptionTitleScheduled
                  ]}>
                    Scheduled
                  </Text>
                  {form.status === 'Scheduled' && (
                    <View style={styles.activeDotAmber} />
                  )}
                </View>
                <Text style={styles.statusOptionSub}>
                  Auto-publishes on {formatDateDisplay(form.date)}
                </Text>
              </View>
              <View style={[
                styles.statusRadioCircle,
                form.status === 'Scheduled' && styles.statusRadioCircleScheduled
              ]}>
                {form.status === 'Scheduled' && <Check size={12} color="#fff" strokeWidth={3} />}
              </View>
            </TouchableOpacity>

            {/* Option 3: Draft */}
            <TouchableOpacity
              style={[
                styles.statusOptionCard,
                form.status === 'Draft' && styles.statusOptionCardDraft
              ]}
              onPress={() => setForm({ ...form, status: 'Draft' })}
              activeOpacity={0.8}
            >
              <View style={[
                styles.statusOptionIconBox,
                form.status === 'Draft' ? styles.statusOptionIconBoxDraft : {}
              ]}>
                <FileText size={15} color={form.status === 'Draft' ? '#fff' : '#475569'} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={[
                    styles.statusOptionTitle,
                    form.status === 'Draft' && styles.statusOptionTitleDraft
                  ]}>
                    Save as Draft
                  </Text>
                  {form.status === 'Draft' && (
                    <View style={styles.activeDotSlate} />
                  )}
                </View>
                <Text style={styles.statusOptionSub}>Saved privately, hidden from members</Text>
              </View>
              <View style={[
                styles.statusRadioCircle,
                form.status === 'Draft' && styles.statusRadioCircleDraft
              ]}>
                {form.status === 'Draft' && <Check size={12} color="#fff" strokeWidth={3} />}
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer Action Buttons exactly like New Promise */}
        <View style={styles.footerBtnRow}>
          {form.status === 'Published' ? (
            <>
              <TouchableOpacity 
                style={styles.btnDraft} 
                onPress={() => handleSave('Draft')}
                disabled={loading}
              >
                <FileText size={15} color="#1a2d5a" />
                <Text style={styles.btnDraftTxt}>Save as Draft</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.btnSave, { backgroundColor: '#15803D' }, loading && { opacity: 0.85 }]} 
                onPress={() => handleSave('Published')}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Send size={15} color="#fff" />
                )}
                <Text style={styles.btnSaveTxt}>
                  {loading ? 'Publishing…' : 'Save & Publish Now'}
                </Text>
              </TouchableOpacity>
            </>
          ) : form.status === 'Scheduled' ? (
            <>
              <TouchableOpacity 
                style={styles.btnDraft} 
                onPress={() => handleSave('Draft')}
                disabled={loading}
              >
                <FileText size={15} color="#1a2d5a" />
                <Text style={styles.btnDraftTxt}>Save as Draft</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.btnSave, { backgroundColor: '#1a2d5a' }, loading && { opacity: 0.85 }]} 
                onPress={() => handleSave('Scheduled')}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Clock size={15} color="#fff" />
                )}
                <Text style={styles.btnSaveTxt}>
                  {loading ? 'Scheduling…' : 'Save & Schedule'}
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity 
                style={styles.btnDraft} 
                onPress={() => handleSave('Published')}
                disabled={loading}
              >
                <Send size={15} color="#15803D" />
                <Text style={[styles.btnDraftTxt, { color: '#15803D' }]}>Publish Now</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.btnSave, { backgroundColor: '#475569' }, loading && { opacity: 0.85 }]} 
                onPress={() => handleSave('Draft')}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Save size={15} color="#fff" />
                )}
                <Text style={styles.btnSaveTxt}>
                  {loading ? 'Saving…' : 'Save as Draft'}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
        <View style={{ height: 60 }} />
      </ScrollView>

      {/* Saving / Publishing Full-Screen Loading State */}
      <Modal visible={loading} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.savingCard}>
            <ActivityIndicator size="large" color="#1a2d5a" />
            <Text style={styles.savingTitle}>{savingActionText}</Text>
            <Text style={styles.savingSub}>Syncing sermon details and media with Member View…</Text>
          </View>
        </View>
      </Modal>

      {/* ── New Category Modal ── */}
      <Modal visible={showNewCategoryModal} transparent animationType="fade">
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
          style={styles.modalOverlay}
        >
          <View style={styles.newCatCard}>
            <View style={styles.newCatHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <FolderPlus size={20} color="#1a2d5a" />
                <Text style={styles.newCatTitle}>New Sermon Category</Text>
              </View>
              <TouchableOpacity onPress={() => { setShowNewCategoryModal(false); setNewCatInput(''); }} hitSlop={{top:10, bottom:10, left:10, right:10}}>
                <X size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <Text style={styles.newCatSubtitle}>
              Enter a name for the new category. It will be saved and visible to members.
            </Text>

            <TextInput
              style={styles.newCatInput}
              placeholder="e.g. Youth Camp, Healing Revival..."
              placeholderTextColor="#9ca3af"
              value={newCatInput}
              onChangeText={setNewCatInput}
              autoFocus
            />

            <View style={styles.newCatActions}>
              <TouchableOpacity 
                style={styles.newCatBtnCancel} 
                onPress={() => { setShowNewCategoryModal(false); setNewCatInput(''); }}
              >
                <Text style={styles.newCatBtnCancelTxt}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.newCatBtnSave, savingCategory && { opacity: 0.7 }]} 
                onPress={handleAddNewCategory}
                disabled={savingCategory}
              >
                {savingCategory ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.newCatBtnSaveTxt}>Save Category</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Redesigned Celebratory Success Modal */}
      <Modal visible={showSuccess} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.successModalCard}>
            {/* Top Decorative Accent Bar */}
            <LinearGradient
              colors={
                lastSavedStatus === 'Published'
                  ? ['#059669', '#10B981', '#34D399']
                  : lastSavedStatus === 'Scheduled'
                  ? ['#1E3A8A', '#2563EB', '#F59E0B']
                  : ['#475569', '#64748B', '#94A3B8']
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.successTopAccentBar}
            />

            <View style={styles.successModalBody}>
              {/* Close Button */}
              <TouchableOpacity 
                style={styles.successCloseBtn} 
                onPress={() => setShowSuccess(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X size={16} color="#64748B" />
              </TouchableOpacity>

              {/* Layered Multi-Ring Glowing Icon Badge */}
              <View style={[
                styles.successIconOuterRing,
                lastSavedStatus === 'Published' && styles.outerRingPublished,
                lastSavedStatus === 'Scheduled' && styles.outerRingScheduled,
                lastSavedStatus === 'Draft' && styles.outerRingDraft,
              ]}>
                <View style={[
                  styles.successIconMidRing,
                  lastSavedStatus === 'Published' && styles.midRingPublished,
                  lastSavedStatus === 'Scheduled' && styles.midRingScheduled,
                  lastSavedStatus === 'Draft' && styles.midRingDraft,
                ]}>
                  <LinearGradient
                    colors={
                      lastSavedStatus === 'Published'
                        ? ['#10B981', '#059669']
                        : lastSavedStatus === 'Scheduled'
                        ? ['#F59E0B', '#D97706']
                        : ['#64748B', '#475569']
                    }
                    style={styles.successIconCenter}
                  >
                    {lastSavedStatus === 'Published' ? (
                      <CheckCircle2 size={26} color="#FFFFFF" strokeWidth={2.8} />
                    ) : lastSavedStatus === 'Scheduled' ? (
                      <Clock size={24} color="#FFFFFF" strokeWidth={2.6} />
                    ) : (
                      <FileText size={24} color="#FFFFFF" strokeWidth={2.6} />
                    )}
                  </LinearGradient>
                </View>
              </View>

              {/* Status Pill Badge */}
              <View style={[
                styles.successStatusPill,
                lastSavedStatus === 'Published' && styles.statusPillPublished,
                lastSavedStatus === 'Scheduled' && styles.statusPillScheduled,
                lastSavedStatus === 'Draft' && styles.statusPillDraft,
              ]}>
                <View style={[
                  styles.statusPillDot,
                  lastSavedStatus === 'Published' && { backgroundColor: '#059669' },
                  lastSavedStatus === 'Scheduled' && { backgroundColor: '#D97706' },
                  lastSavedStatus === 'Draft' && { backgroundColor: '#64748B' },
                ]} />
                <Text style={[
                  styles.statusPillTxt,
                  lastSavedStatus === 'Published' && { color: '#065F46' },
                  lastSavedStatus === 'Scheduled' && { color: '#92400E' },
                  lastSavedStatus === 'Draft' && { color: '#334155' },
                ]}>
                  {lastSavedStatus === 'Published' 
                    ? 'LIVE ON MEMBER APP' 
                    : lastSavedStatus === 'Scheduled'
                    ? `SCHEDULED • ${formatDateDisplay(form.date)}`
                    : 'SAVED AS PRIVATE DRAFT'}
                </Text>
              </View>

              {/* Headline & Description */}
              <Text style={styles.successHeading}>
                {lastSavedStatus === 'Published'
                  ? 'Sermon Published! 🎉'
                  : lastSavedStatus === 'Scheduled'
                  ? 'Sermon Scheduled! ⏰'
                  : 'Draft Saved! 💾'}
              </Text>

              <Text style={styles.successDescription}>
                {lastSavedStatus === 'Published'
                  ? 'Your sermon is live and visible immediately to church members on the Sermons screen.'
                  : lastSavedStatus === 'Scheduled'
                  ? `Your sermon is scheduled and will automatically go live on ${formatDateDisplay(form.date)}.`
                  : 'Your sermon draft is safely saved. It remains private and hidden from members until published.'}
              </Text>

              {/* Summary Details Card */}
              <View style={styles.successDetailsCard}>
                <View style={styles.successDetailRow}>
                  <Film size={14} color="#1a2d5a" />
                  <Text style={styles.successDetailLabel}>Title:</Text>
                  <Text style={styles.successDetailVal} numberOfLines={1}>
                    {form.titleEn || form.titleTe || 'Sermon'}
                  </Text>
                </View>
                <View style={styles.successDetailRow}>
                  <CalendarIcon size={14} color="#1a2d5a" />
                  <Text style={styles.successDetailLabel}>Date:</Text>
                  <Text style={styles.successDetailVal}>{formatDateDisplay(form.date)}</Text>
                </View>
                {!!form.pastor?.trim() && (
                  <View style={styles.successDetailRow}>
                    <User size={14} color="#1a2d5a" />
                    <Text style={styles.successDetailLabel}>Pastor:</Text>
                    <Text style={styles.successDetailVal} numberOfLines={1}>{form.pastor}</Text>
                  </View>
                )}
              </View>

              {/* Primary Button */}
              <TouchableOpacity 
                style={styles.successPrimaryBtnWrap} 
                onPress={closeSuccess} 
                activeOpacity={0.88}
              >
                <LinearGradient
                  colors={
                    lastSavedStatus === 'Published'
                      ? ['#059669', '#10B981']
                      : lastSavedStatus === 'Scheduled'
                      ? ['#1a2d5a', '#2b4c8a']
                      : ['#334155', '#475569']
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.successPrimaryBtnGrad}
                >
                  <Text style={styles.successPrimaryBtnTxt}>View Sermons List</Text>
                  <ArrowRight size={16} color="#FFFFFF" strokeWidth={2.5} />
                </LinearGradient>
              </TouchableOpacity>

              {/* Secondary Button */}
              <TouchableOpacity 
                style={styles.successSecondaryBtn} 
                onPress={() => setShowSuccess(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.successSecondaryBtnTxt}>Keep Editing</Text>
              </TouchableOpacity>
            </View>
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
      <TouchableOpacity 
        style={[
          styles.fab,
          form.status === 'Published' && { backgroundColor: '#15803D' },
          form.status === 'Scheduled' && { backgroundColor: '#1a2d5a' },
          form.status === 'Draft' && { backgroundColor: '#475569' }
        ]} 
        onPress={() => handleSave(form.status)}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : form.status === 'Published' ? (
          <Send size={22} color="#fff" />
        ) : form.status === 'Scheduled' ? (
          <Clock size={22} color="#fff" />
        ) : (
          <Save size={22} color="#fff" />
        )}
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
    paddingBottom: 22,
    marginBottom: 4,
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
  modHd: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginBottom: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(26,45,90,0.08)', paddingBottom: 10 },
  hdBlue: { },
  hdYellow: { },
  modHdTxt: { fontSize: 12, fontWeight: '800', color: '#1a2d5a', textTransform: 'uppercase', letterSpacing: 0.5 },

  fGroup: { marginBottom: 16 },
  fLabel: { fontSize: 12, fontWeight: '700', color: '#1a2d5a', marginBottom: 6 },
  fHint: { fontSize: 9, color: '#9CA3AF', fontWeight: '500', marginTop: 4 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },

  input: { backgroundColor: '#FDFDFD', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, padding: 12, fontSize: 13, color: '#1a2d5a' },
  inputWithIcon: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FDFDFD', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, paddingHorizontal: 12, height: 45 },
  inputTxt: { fontSize: 13, color: '#1a2d5a' },
  teIn: { fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', color: '#1a2d5a', fontStyle: 'italic', backgroundColor: '#F9F6F0' },
  textarea: { minHeight: 80, textAlignVertical: 'top' },

  selectBox: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, padding: 12 },
  selectTxt: { fontSize: 13, color: '#1a2d5a', fontWeight: '600' },

  mediaBanner: { backgroundColor: '#F9F6F0', borderRadius: 8, padding: 10, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginBottom: 15, marginTop: 5 },
  mediaBannerTxt: { color: '#1a2d5a', fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },

  dashBox: { borderStyle: 'dashed', borderWidth: 1.5, borderColor: '#D1D5DB', borderRadius: 12, padding: 25, alignItems: 'center', backgroundColor: '#FAFAFA' },
  dashBoxActive: { borderColor: '#2E6B4F', backgroundColor: '#F0FDF4', borderStyle: 'solid' },
  dashTxt: { fontSize: 11, fontWeight: '700', color: '#1a2d5a', marginTop: 10 },
  dashHint: { fontSize: 9, color: '#9CA3AF', marginTop: 4, fontWeight: '500' },

  thumbPreviewCard: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#0f172a',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  thumbPreviewImg: {
    width: '100%',
    height: '100%',
  },
  thumbOverlayBar: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    flexDirection: 'row',
    gap: 8,
  },
  thumbBtnEdit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(26,45,90,0.85)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  thumbBtnDelete: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(220,38,38,0.85)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  thumbBtnTxt: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  thumbYoutubeBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  thumbYoutubeBadgeTxt: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  thumbBtnUploadCustom: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },

  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  toggleTxt: { fontSize: 12, color: '#1a2d5a', fontWeight: '600' },
  switch: { width: 44, height: 24, borderRadius: 12, backgroundColor: '#D1D5DB', padding: 2 },
  switchOn: { backgroundColor: '#1a2d5a' },
  switchDot: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff' },
  switchDotOn: { alignSelf: 'flex-end' },

  notifPreview: { backgroundColor: '#F8FAFC', borderRadius: 12, padding: 12, marginTop: 10, borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#1a2d5a', shadowOpacity: 0.05, shadowRadius: 5 },
  notifHeader: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginBottom: 4 },
  notifLogo: { width: 14, height: 14, backgroundColor: '#1a2d5a', borderRadius: 4, justifyContent: 'center', alignItems: 'center' },
  notifHeaderTxt: { fontSize: 9, color: '#64748B', fontWeight: '600' },
  notifTitle: { fontSize: 11, fontWeight: '800', color: '#1E293B' },
  notifBody: { fontSize: 10, color: '#64748B', fontWeight: '500' },

  pickerCard: { backgroundColor: '#fff', width: '90%', borderRadius: 12, padding: 8, elevation: 20, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 15 },
  pickerItem: { padding: 15, borderRadius: 8 },
  pickerItemActive: { backgroundColor: '#1a2d5a' },
  pickerItemTxt: { fontSize: 13, color: '#374151', fontWeight: '500' },
  pickerItemTxtActive: { color: '#fff', fontWeight: '700' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },

  // ─── Publish Status 3-Card Selector ───────────────────────────────────────
  statusSelectorContainer: {
    gap: 8,
    marginTop: 4,
  },
  statusOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FAFAF9',
    borderWidth: 1.5,
    borderColor: '#E2DDD5',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  statusOptionCardPublished: {
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
  },
  statusOptionCardScheduled: {
    borderColor: '#F59E0B',
    backgroundColor: '#FFFBEB',
  },
  statusOptionCardDraft: {
    borderColor: '#64748B',
    backgroundColor: '#F8FAFC',
  },
  statusOptionIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusOptionIconBoxPublished: {
    backgroundColor: '#059669',
  },
  statusOptionIconBoxScheduled: {
    backgroundColor: '#D97706',
  },
  statusOptionIconBoxDraft: {
    backgroundColor: '#475569',
  },
  statusOptionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
  },
  statusOptionTitlePublished: {
    color: '#065F46',
  },
  statusOptionTitleScheduled: {
    color: '#92400E',
  },
  statusOptionTitleDraft: {
    color: '#1E293B',
  },
  statusOptionSub: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  activeDotGreen: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  activeDotAmber: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F59E0B',
  },
  activeDotSlate: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#64748B',
  },
  statusRadioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusRadioCirclePublished: {
    borderColor: '#10B981',
    backgroundColor: '#10B981',
  },
  statusRadioCircleScheduled: {
    borderColor: '#D97706',
    backgroundColor: '#D97706',
  },
  statusRadioCircleDraft: {
    borderColor: '#475569',
    backgroundColor: '#475569',
  },

  // ─── Footer Action Buttons ───────────────────────────────────────────────
  footerBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 6,
    marginBottom: 20,
  },
  btnDraft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingVertical: 13,
  },
  btnDraftTxt: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  btnSave: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 12,
    paddingVertical: 13,
    elevation: 2,
  },
  btnSaveTxt: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // ─── Saving Loader Modal ──────────────────────────────────────────────────
  savingCard: {
    backgroundColor: '#fff',
    width: '82%',
    maxWidth: 340,
    borderRadius: 20,
    padding: 26,
    alignItems: 'center',
    elevation: 20,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 15,
  },
  savingTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1a2d5a',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  savingSub: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
  },

  // ─── Celebratory Success Modal ────────────────────────────────────────────
  successModalCard: {
    backgroundColor: '#FFFFFF',
    width: '88%',
    maxWidth: 380,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
    elevation: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
  },
  successTopAccentBar: {
    height: 6,
    width: '100%',
  },
  successModalBody: {
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 22,
    alignItems: 'center',
    position: 'relative',
  },
  successCloseBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  successIconOuterRing: {
    width: 76,
    height: 76,
    borderRadius: 38,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 6,
  },
  outerRingPublished: { backgroundColor: '#ECFDF5' },
  outerRingScheduled: { backgroundColor: '#FFFBEB' },
  outerRingDraft: { backgroundColor: '#F1F5F9' },
  successIconMidRing: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  midRingPublished: { backgroundColor: '#D1FAE5' },
  midRingScheduled: { backgroundColor: '#FEF3C7' },
  midRingDraft: { backgroundColor: '#E2E8F0' },
  successIconCenter: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
  },
  successStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4.5,
    marginTop: 14,
    borderWidth: 1,
  },
  statusPillPublished: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  statusPillScheduled: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  statusPillDraft: {
    backgroundColor: '#F1F5F9',
    borderColor: '#CBD5E1',
  },
  statusPillDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  statusPillTxt: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  successHeading: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 12,
    marginBottom: 6,
    textAlign: 'center',
  },
  successDescription: {
    fontSize: 12.5,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 6,
    marginBottom: 16,
  },
  successDetailsCard: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    marginBottom: 18,
    gap: 8,
  },
  successDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  successDetailLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  successDetailVal: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: '#1a2d5a',
  },
  successPrimaryBtnWrap: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  successPrimaryBtnGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    paddingHorizontal: 16,
  },
  successPrimaryBtnTxt: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  successSecondaryBtn: {
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  successSecondaryBtnTxt: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },

  errorCard: { backgroundColor: '#fff', width: '80%', borderRadius: 24, padding: 30, alignItems: 'center' },
  errorIconBox: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#FEF2F2', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  errorTitle: { fontSize: 20, fontWeight: '800', color: '#c0392b', marginBottom: 10 },
  errorSub: { fontSize: 13, color: '#6B7280', textAlign: 'center', marginBottom: 25 },
  successBtn: { backgroundColor: '#1a2d5a', width: '100%', paddingVertical: 15, borderRadius: 12, alignItems: 'center' },
  successBtnTxt: { color: '#fff', fontSize: 14, fontWeight: '700' },

  fab: { position: 'absolute', right: 20, bottom: 30, width: 60, height: 60, borderRadius: 30, backgroundColor: '#2E6B4F', justifyContent: 'center', alignItems: 'center', elevation: 10, shadowColor: '#1a2d5a', shadowOpacity: 0.3, shadowRadius: 10 },

  pickerCardJS: { backgroundColor: '#fff', width: '90%', borderRadius: 16, padding: 20, elevation: 20, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 15 },
  pickerHd: { fontSize: 16, fontWeight: '800', color: '#1a2d5a', marginBottom: 20, textAlign: 'center' },
  pickerGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, height: 200 },
  pickerCol: { flex: 1 },
  pickerColHd: { fontSize: 10, fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', marginBottom: 10, textAlign: 'center' },
  pickerItemJS: { paddingVertical: 10, alignItems: 'center', borderRadius: 8, marginBottom: 4 },
  pickerItemJSActive: { backgroundColor: '#F0FDF4' },
  pickerItemJSTxt: { fontSize: 14, color: '#374151', fontWeight: '500' },
  pickerItemJSTxtActive: { color: '#059669', fontWeight: '800' },
  pickerBtn: { backgroundColor: '#1a2d5a', borderRadius: 10, padding: 15, alignItems: 'center', marginTop: 20 },
  pickerBtnTxt: { color: '#fff', fontWeight: '700' },

  // New Category Modal Styles
  newCatCard: { backgroundColor: '#fff', width: '85%', borderRadius: 20, padding: 22, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 15, elevation: 15 },
  newCatHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  newCatTitle: { fontSize: 16, fontWeight: '800', color: '#1a2d5a' },
  newCatSubtitle: { fontSize: 12, color: '#64748b', marginBottom: 16, lineHeight: 17 },
  newCatInput: { backgroundColor: '#F8FAFC', borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#1a2d5a', marginBottom: 20 },
  newCatActions: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 10 },
  newCatBtnCancel: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8 },
  newCatBtnCancelTxt: { fontSize: 13, fontWeight: '600', color: '#64748b' },
  newCatBtnSave: { backgroundColor: '#1a2d5a', paddingVertical: 10, paddingHorizontal: 18, borderRadius: 8, minWidth: 110, alignItems: 'center', justifyContent: 'center' },
  newCatBtnSaveTxt: { fontSize: 13, fontWeight: '700', color: '#fff' },
});


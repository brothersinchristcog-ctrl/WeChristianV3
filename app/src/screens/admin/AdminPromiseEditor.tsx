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
  CheckCircle2,
  Wand2
} from 'lucide-react-native';
import { Ionicons } from '@expo/vector-icons';

import { AppAlert } from '../../components/CustomAlert';
import { formatDateDisplay } from '../../utils/DateUtils';
import { AdminTabContext } from '../../context/AdminTabContext';
import * as MediaLibrary from 'expo-media-library';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { captureRef } from 'react-native-view-shot';
import firestore from '@react-native-firebase/firestore';

import FirestoreService from '../../services/FirestoreService';
import AIService from '../../services/AIService';

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

const ENGLISH_NAMES = [
  'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy', 'Joshua', 'Judges', 'Ruth', '1 Samuel', '2 Samuel',
  '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles', 'Ezra', 'Nehemiah', 'Esther', 'Job', 'Psalms', 'Proverbs',
  'Ecclesiastes', 'Song of Solomon', 'Isaiah', 'Jeremiah', 'Lamentations', 'Ezekiel', 'Daniel', 'Hosea', 'Joel', 'Amos',
  'Obadiah', 'Jonah', 'Micah', 'Nahum', 'Habakkuk', 'Zephaniah', 'Haggai', 'Zechariah', 'Malachi',
  'Matthew', 'Mark', 'Luke', 'John', 'Acts', 'Romans', '1 Corinthians', '2 Corinthians', 'Galatians', 'Ephesians',
  'Philippians', 'Colossians', '1 Thessalonians', '2 Thessalonians', '1 Timothy', '2 Timothy', 'Titus', 'Philemon', 'Hebrews', 'James',
  '1 Peter', '2 Peter', '1 John', '2 John', '3 John', 'Jude', 'Revelation'
];

const TELUGU_NAMES = [
  'ఆదికాండము', 'నిర్గమకాండము', 'లేవీయకాండము', 'సంఖ్యాకాండము', 'ద్వితీయోపదేశకాండము', 'యెహోషువ', 'న్యాయాధిపతులు', 'రూతు', 'సమూయేలు మొదటి గ్రంథము', 'సమూయేలు రెండవ గ్రంథము',
  'రాజులు మొదటి గ్రంథము', 'రాజులు రెండవ గ్రంథము', 'దినవృత్తాంతములు మొదటి గ్రంథము', 'దినవృత్తాంతములు రెండవ గ్రంథము', 'ఎజ్రా', 'నెహెమ్యా', 'ఎస్తేరు', 'యోబు', 'కీర్తనల గ్రంథము', 'సామెతలు',
  'ప్రసంగి', 'పరమగీతము', 'యెషయా', 'యిర్మీయా', 'విలాపవాక్యములు', 'యెహెజ్కేలు', 'దానియేలు', 'హోషేయ', 'యోవేలు', 'ఆమోసు',
  'ఓబద్యా', 'యోనా', 'మీకా', 'నహూము', 'హబక్కూకు', 'జెఫన్యా', 'హగ్గయి', 'జెకర్యా', 'మలాకీ',
  'మత్తయి సువార్త', 'మార్కు సువార్త', 'లూకా సువార్త', 'యోహాను సువార్త', 'అపొస్తలుల కార్యములు', 'రోమీయులకు', 'కొరింథీయులకు 1వ పత్రిక', 'కొరింథీయులకు 2వ పత్రిక', 'గలతీయులకు', 'ఎఫెసీయులకు',
  'ఫిలిప్పీయులకు', 'కొలొస్సయులకు', 'థెస్సలొనీకయులకు 1వ పత్రిక', 'థెస్సలొనీకయులకు 2వ పత్రిక', 'తిమోతికి 1వ పత్రిక', 'తిమోతికి 2వ పత్రిక', 'తీతుకు', 'ఫిలేమోనుకు', 'హెబ్రీయులకు', 'యాకోబు',
  'పేతురు 1వ పత్రిక', 'పేతురు 2వ పత్రిక', 'యోహాను 1వ పత్రిక', 'యోహాను 2వ పత్రిక', 'యోహాను 3వ పత్రిక', 'యూదా', 'ప్రకటన గ్రంథము'
];

const LOCAL_TELUGU_BIBLE: any = require('../../../assets/telugu_bible.json');

const STATUS_OPTIONS = [
  { label: 'Draft — save only, not visible', value: 'Draft' },
  { label: 'Scheduled — auto-publish at midnight', value: 'Scheduled' },
  { label: 'Publish now — live immediately', value: 'Published' }
];

export default function AdminPromiseEditor() {
  const { setActiveTab, editingData, setEditingData, setTabByName } = useContext(AdminTabContext);
  const [loading, setLoading] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStatusPicker, setShowStatusPicker] = useState(false);
  const [selectedBook, setSelectedBook] = useState<number | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
  const [selectedVerse, setSelectedVerse] = useState<number | null>(null);
  const [isFetchingVerse, setIsFetchingVerse] = useState(false);
  const [isGeneratingThumbnail, setIsGeneratingThumbnail] = useState(false);
  const [selectionModalType, setSelectionModalType] = useState<'book' | 'chapter' | 'verse' | null>(null);
  
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

  const handleFetchVerse = async () => {
    if (selectedBook === null || selectedChapter === null || selectedVerse === null) {
      AppAlert.alert('Error', 'Please select a Book, Chapter, and Verse first.', undefined, 'error');
      return;
    }

    setIsFetchingVerse(true);
    try {
      const bookId = selectedBook + 1;
      const url = `https://bolls.life/get-text/KJV/${bookId}/${selectedChapter}/`;
      const engResponse = await fetch(url, { headers: { 'Accept': 'application/json' } });
      let engText = '';
      if (engResponse.ok) {
        const result = await engResponse.json();
        const verseObj = result.find((v: any) => v.verse === selectedVerse);
        if (verseObj) {
          engText = verseObj.text ? verseObj.text.replace(/<[^>]*>?/gm, '').replace(/\d+/g, '').replace(/\s+/g, ' ').trim() : '';
        }
      }

      let telText = '';
      const bookData = LOCAL_TELUGU_BIBLE.Book[selectedBook];
      if (bookData && bookData.Chapter && bookData.Chapter[selectedChapter - 1]) {
        const chapterData = bookData.Chapter[selectedChapter - 1].Verse;
        if (chapterData && chapterData[selectedVerse - 1]) {
          telText = chapterData[selectedVerse - 1].Verse;
        }
      }

      const engBookName = ENGLISH_NAMES[selectedBook];
      const teBookName = TELUGU_NAMES[selectedBook];

      setForm(prev => ({
        ...prev,
        enRef: `${engBookName} ${selectedChapter}:${selectedVerse}`,
        enVerse: engText,
        teRef: `${teBookName} ${selectedChapter}:${selectedVerse}`,
        teVerse: telText
      }));

    } catch (err) {
      console.error('Failed to fetch verses:', err);
      AppAlert.alert('Error', 'Failed to fetch verses automatically. Please enter manually.', undefined, 'error');
    } finally {
      setIsFetchingVerse(false);
    }
  };

  const handleGenerateThumbnail = async () => {
    if (!form.enVerse) {
      AppAlert.alert('Error', 'Please enter an English verse first to generate a thumbnail.', undefined, 'error');
      return;
    }

    setIsGeneratingThumbnail(true);
    try {
      const churchId = await FirestoreService.getChurchId();
      const imageUrl = await AIService.generateContentImage({
        prompt: `A beautiful, serene, inspiring background suitable for this bible verse: "${form.enVerse}". No text on the image, highly aesthetic.`,
        churchId: churchId!
      });
      setForm(prev => ({ ...prev, imageUrl }));
      AppAlert.alert('Success', 'AI Thumbnail generated successfully!', undefined, 'success');
    } catch (err) {
      console.error('Failed to generate thumbnail:', err);
      AppAlert.alert('Error', 'Failed to generate AI thumbnail.', undefined, 'error');
    } finally {
      setIsGeneratingThumbnail(false);
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
        setIsUploadingImage(true);
        const cloudUrl = await uploadImageToCloud(result.assets[0].uri);
        setForm(prev => ({ ...prev, imageUrl: cloudUrl }));
        AppAlert.alert('Success', 'Thumbnail uploaded to cloud successfully! Remember to Save Changes.', undefined, 'success');
      }
    } catch (err) {
      console.error('Upload Error:', err);
      AppAlert.alert('Upload Failed', 'There was an issue uploading your image.', undefined, 'error');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSave = async (statusOverride?: string) => {
    const finalStatus = statusOverride || form.status;
    
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
        } catch (notifErr) {
          console.warn('⚠️ Daily Promise push notification failed:', notifErr);
        }
      }

      setShowSuccess(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save to database.');
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };

  const closeSuccess = () => {
    setShowSuccess(false);
    setEditingData?.(null);
    setTabByName?.('Promises');
  };

  const currentStatusLabel = STATUS_OPTIONS.find(o => o.value === form.status)?.label || form.status;

  const renderDatePicker = () => {
    const days = Array.from({ length: 30 }, (_, i) => i + 1);
    return (
      <Modal visible={showDatePicker} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.pickerCard}>
            <View style={styles.pickerHd}>
              <Text style={styles.pickerTitle}>Select Date</Text>
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
          <TouchableOpacity onPress={() => setTabByName?.('Promises')} style={{ flexDirection: 'row', alignItems: 'center' }}>
            <ChevronLeft size={20} color="#fff" style={{ marginLeft: -6, marginRight: 4 }} />
            <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>Back</Text>
          </TouchableOpacity>
          <Text style={[styles.heroTitle, { marginHorizontal: 12, opacity: 0.4 }]}>|</Text>
          <Text style={styles.heroTitle}>{editingData ? 'Edit Promise' : 'New Promise'}</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

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
              <Text style={styles.inputText}>{formatDateDisplay(form.date)}</Text>
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

        <View style={[styles.section, styles.secNavy]}>
          <View style={styles.secHd}>
            <View style={styles.secHdPill}>
              <BookOpen size={13} color="#fff" />
            </View>
            <Text style={styles.secHdTXT}>English Promise</Text>
          </View>

          <View style={{ backgroundColor: '#F8FAFC', padding: 15, borderRadius: 12, marginBottom: 20, borderWidth: 1, borderColor: '#E2E8F0' }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#1a2d5a', marginBottom: 12 }}>Auto-Populate Bible Verse</Text>
            
            <View style={{ flexDirection: 'column', gap: 10, marginBottom: 12 }}>
              <TouchableOpacity 
                style={[styles.input, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]} 
                onPress={() => setSelectionModalType('book')}
              >
                <Text style={{ color: selectedBook !== null ? '#1a2d5a' : '#94A3B8', flex: 1 }} numberOfLines={1}>
                  {selectedBook !== null ? `${ENGLISH_NAMES[selectedBook]} - ${TELUGU_NAMES[selectedBook]}` : 'Select Book'}
                </Text>
                <ChevronDown size={16} color="#94A3B8" />
              </TouchableOpacity>
              
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity 
                  style={[styles.input, { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]} 
                  onPress={() => {
                    if (selectedBook === null) return AppAlert.alert('Info', 'Please select a Book first');
                    setSelectionModalType('chapter');
                  }}
                >
                  <Text style={{ color: selectedChapter !== null ? '#1a2d5a' : '#94A3B8' }}>
                    {selectedChapter !== null ? `Chapter ${selectedChapter}` : 'Select Chapter'}
                  </Text>
                  <ChevronDown size={16} color="#94A3B8" />
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.input, { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]} 
                  onPress={() => {
                    if (selectedChapter === null) return AppAlert.alert('Info', 'Please select a Chapter first');
                    setSelectionModalType('verse');
                  }}
                >
                  <Text style={{ color: selectedVerse !== null ? '#1a2d5a' : '#94A3B8' }}>
                    {selectedVerse !== null ? `Verse ${selectedVerse}` : 'Select Verse'}
                  </Text>
                  <ChevronDown size={16} color="#94A3B8" />
                </TouchableOpacity>
              </View>
            </View>

            {selectedBook !== null && selectedChapter !== null && selectedVerse !== null && (
              <View style={{ backgroundColor: '#EEF2FF', padding: 12, borderRadius: 8, marginBottom: 12, borderWidth: 1, borderColor: '#C7D2FE' }}>
                <Text style={{ color: '#1E40AF', fontSize: 13, fontWeight: '600', textAlign: 'center' }}>
                  {ENGLISH_NAMES[selectedBook]} → Chapter {selectedChapter} → Verse {selectedVerse}
                </Text>
              </View>
            )}

            <TouchableOpacity 
              style={{ backgroundColor: '#1a2d5a', padding: 12, borderRadius: 8, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }}
              onPress={handleFetchVerse}
              disabled={isFetchingVerse}
            >
              {isFetchingVerse ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <BookOpen size={16} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={{ color: '#fff', fontWeight: '600' }}>Fetch Verse Text</Text>
                </>
              )}
            </TouchableOpacity>
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

        <View style={[styles.section, styles.secNavy]}>
          <View style={styles.secHd}>
            <View style={styles.secHdPill}>
              <Eye size={13} color="#fff" />
            </View>
            <Text style={styles.secHdTXT}>Daily Promise Thumbnail</Text>
          </View>
          <View style={styles.fGroup}>
            <Text style={styles.fLabel}>Thumbnail Image <Text style={styles.fHint}>(Visible on member home screen)</Text></Text>
            {form.imageUrl ? (
              <View style={styles.thumbnailPreviewContainer}>
                <Image source={{ uri: form.imageUrl }} style={styles.thumbnailImg} resizeMode="cover" />
                <TouchableOpacity style={styles.removeThumbnailBtn} onPress={() => setForm(prev => ({ ...prev, imageUrl: '' }))}>
                  <Text style={styles.btnChangeThumbTxt}>Remove Image</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity style={[styles.btnUploadThumb, { flex: 1 }]} onPress={pickThumbnail}>
                  <Text style={styles.btnUploadThumbTxt}>Pick Image</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.btnUploadThumb, { flex: 1, backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]} 
                  onPress={handleGenerateThumbnail}
                  disabled={isGeneratingThumbnail}
                >
                  {isGeneratingThumbnail ? (
                     <ActivityIndicator size="small" color="#1E3A8A" />
                  ) : (
                     <Wand2 size={24} color="#1E3A8A" />
                  )}
                  <Text style={[styles.btnUploadThumbTxt, { color: '#1E3A8A', marginTop: 8 }]}>
                    {isGeneratingThumbnail ? 'Generating...' : 'AI Thumbnail'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

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
            <Text style={styles.fLabel}>YouTube video URL</Text>
            <TextInput style={styles.input} value={form.ytUrl} onChangeText={(v) => setForm({...form, ytUrl: v})} placeholder="https://youtube.com/watch?v=…" />
          </View>
        </View>

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

        <TouchableOpacity style={styles.btnBack} onPress={() => setTabByName?.('Promises')}>
          <Text style={styles.btnBackTxt}>← Back to list</Text>
        </TouchableOpacity>

        <View style={{ height: 60 }} />
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => handleSave()}>
        <Save size={24} color="#fff" />
      </TouchableOpacity>

      <Modal visible={selectionModalType !== null} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.pickerCard, { height: '70%' }]}>
            <View style={styles.pickerHd}>
              <Text style={styles.pickerTitle}>
                {selectionModalType === 'book' ? 'Select Bible Book' : 
                 selectionModalType === 'chapter' ? `Select Chapter (${selectedBook !== null ? ENGLISH_NAMES[selectedBook] : ''})` : 
                 'Select Verse'}
              </Text>
              <TouchableOpacity onPress={() => setSelectionModalType(null)} style={{ padding: 5 }}>
                <X size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {selectionModalType === 'book' && ENGLISH_NAMES.map((name, idx) => (
                <TouchableOpacity 
                  key={idx} 
                  style={[styles.modalOption, selectedBook === idx && styles.modalOptionActive]}
                  onPress={() => {
                    setSelectedBook(idx);
                    setSelectedChapter(null);
                    setSelectedVerse(null);
                    setSelectionModalType(null);
                  }}
                >
                  <Text style={[styles.modalOptionText, selectedBook === idx && { color: '#fff' }]}>{name} - {TELUGU_NAMES[idx]}</Text>
                </TouchableOpacity>
              ))}
              
              {selectionModalType === 'chapter' && selectedBook !== null && Array.from({ length: LOCAL_TELUGU_BIBLE.Book[selectedBook]?.Chapter?.length || 0 }).map((_, idx) => (
                <TouchableOpacity 
                  key={idx} 
                  style={[styles.modalOption, selectedChapter === idx + 1 && styles.modalOptionActive]}
                  onPress={() => {
                    setSelectedChapter(idx + 1);
                    setSelectedVerse(null);
                    setSelectionModalType(null);
                  }}
                >
                  <Text style={[styles.modalOptionText, selectedChapter === idx + 1 && { color: '#fff' }]}>Chapter {idx + 1}</Text>
                </TouchableOpacity>
              ))}

              {selectionModalType === 'verse' && selectedBook !== null && selectedChapter !== null && Array.from({ length: LOCAL_TELUGU_BIBLE.Book[selectedBook]?.Chapter?.[selectedChapter - 1]?.Verse?.length || 0 }).map((_, idx) => (
                <TouchableOpacity 
                  key={idx} 
                  style={[styles.modalOption, selectedVerse === idx + 1 && styles.modalOptionActive]}
                  onPress={() => {
                    setSelectedVerse(idx + 1);
                    setSelectionModalType(null);
                  }}
                >
                  <Text style={[styles.modalOptionText, selectedVerse === idx + 1 && { color: '#fff' }]}>Verse {idx + 1}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

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

      <Modal visible={showSuccess} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.successCard}>
            <View style={styles.successIconBox}>
              <CheckCircle2 size={50} color="#15803D" strokeWidth={3} />
            </View>
            <Text style={styles.successTitle}>Success!</Text>
            <Text style={styles.successSub}>Your daily promise has been {form.status === 'Published' ? 'published and members have been notified!' : 'saved successfully.'}</Text>
            <TouchableOpacity style={styles.successBtn} onPress={closeSuccess}>
              <Text style={styles.successBtnTxt}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EDE8DC' },
  scroll: { padding: 14, paddingBottom: 100 },
  hero: { backgroundColor: '#1a2d5a', borderBottomLeftRadius: 26, borderBottomRightRadius: 26, paddingHorizontal: 22, paddingTop: 10, paddingBottom: 24, marginBottom: 6 },
  heroTitleRow: { flexDirection: 'row', alignItems: 'center' },
  heroTitle: { color: '#fff', fontSize: 24, fontWeight: '600' },
  section: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(26,45,90,0.08)', borderTopWidth: 3, borderTopColor: '#1a2d5a' },
  secNavy: {}, secBlue: {}, secRed: {},
  secHd: { flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(26,45,90,0.07)', paddingBottom: 10 },
  secHdPill: { width: 26, height: 26, borderRadius: 7, backgroundColor: '#1a2d5a', justifyContent: 'center', alignItems: 'center' },
  secHdTXT: { fontSize: 12, fontWeight: '800', color: '#1a2d5a', textTransform: 'uppercase', letterSpacing: 1.3, flex: 1 },
  fGroup: { marginBottom: 12 },
  fLabel: { fontSize: 10, fontWeight: '700', color: '#374151', textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 6 },
  fHint: { fontWeight: '500', color: '#9CA3AF', fontSize: 11, textTransform: 'none' },
  fSub: { fontSize: 11, color: '#6B7280', marginTop: 6, fontStyle: 'italic' },
  statusDropdownTxt: { fontSize: 13, fontWeight: '600', color: '#1a2d5a', flex: 1 },
  input: { backgroundColor: '#FAFAF9', borderWidth: 1, borderColor: '#E2DDD5', borderRadius: 10, paddingHorizontal: 13, paddingVertical: 11, fontSize: 13, color: '#1a2d5a', fontWeight: '500' },
  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FAFAF9', borderWidth: 1, borderColor: '#E2DDD5', borderRadius: 10, paddingHorizontal: 13, paddingVertical: 11 },
  inputText: { flex: 1, fontSize: 13, color: '#1a2d5a', fontWeight: '500' },
  inputIcon: { marginLeft: 10 },
  textarea: { minHeight: 80, textAlignVertical: 'top' },
  teIn: { fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', fontSize: 14, lineHeight: 22 },
  themeRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 6, gap: 10 },
  themeChip: { width: 38, height: 38, borderRadius: 19, borderWidth: 2.5, borderColor: 'transparent' },
  themeActive: { borderColor: '#C9A84C', transform: [{ scale: 1.1 }] },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center' },
  pickerCard: { backgroundColor: '#fff', width: '85%', borderRadius: 20, padding: 20 },
  pickerHd: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  pickerTitle: { fontSize: 14, fontWeight: '700', color: '#1a2d5a' },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  calCell: { width: (width * 0.85 - 70) / 7, height: 35, justifyContent: 'center', alignItems: 'center', borderRadius: 8, backgroundColor: '#F5F0E8' },
  calCellActive: { backgroundColor: '#1a2d5a' },
  calCellTxt: { fontSize: 11, color: '#374151', fontWeight: '600' },
  calCellTxtActive: { color: '#fff' },

  modalOption: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalOptionActive: {
    backgroundColor: '#1a2d5a',
  },
  modalOptionText: {
    fontSize: 15,
    color: '#374151',
    fontWeight: '500'
  },

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
  cardBtnRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
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
  // Primary: forest green — Save & Publish
  btnSave: {
    flex: 1,
    backgroundColor: '#2E6B4F',
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    elevation: 6,
    shadowColor: '#2E6B4F',
    shadowOpacity: 0.35,
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
  thumbContainer: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 15 },
  thumbnailPreviewContainer: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 15, marginTop: 10 },
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

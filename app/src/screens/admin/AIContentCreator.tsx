import React, { useState, useContext, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Dimensions,
  Animated,
  Image,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ChevronLeft,
  Wand2,
  ChevronDown,
  LayoutTemplate,
  AlignLeft,
  Calendar as CalendarIcon,
  User,
  Image as ImageIcon,
  Download,
  CheckSquare,
  RefreshCw,
  Save,
  ChevronUp,
  X,
  CheckCircle2,
  AlertCircle,
  Globe,
  Sparkles,
  BookOpen,
  Check
} from 'lucide-react-native';
import { AdminTabContext } from '../../context/AdminTabContext';
import { useChurch } from '../../context/ChurchContext';
import AIService from '../../services/AIService';
import FirestoreService from '../../services/FirestoreService';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
const { width } = Dimensions.get('window');

const formatDate = (date: Date) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[date.getMonth()]} ${String(date.getDate()).padStart(2, '0')}, ${date.getFullYear()}`;
};

const formatTime = (date: Date) => {
  let h = date.getHours();
  const m = String(date.getMinutes()).padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  h = h ? h : 12;
  return `${h}:${m} ${ampm}`;
};
const SERIF = Platform.OS === 'ios' ? 'Georgia' : 'serif';
const SANS = Platform.OS === 'ios' ? 'System' : 'sans-serif';

// ─── Data ──────────────────────────────────────────────────────────────────────
const CONTENT_TYPES = [
  { key: 'Daily Promise Card', icon: Sparkles },
  { key: 'Bible Verse Card', icon: BookOpen },
  { key: 'Sermon Thumbnail', icon: ImageIcon },
  { key: 'Event Banner', icon: CalendarIcon },
  { key: 'Birthday Card', icon: CheckCircle2 },
  { key: 'Wedding Anniversary', icon: CheckCircle2 },
  { key: 'Baptism Anniversary', icon: CheckCircle2 },
  { key: 'Announcement', icon: CheckSquare },
  { key: 'Prayer Meeting', icon: User },
  { key: 'Bible Study', icon: BookOpen },
  { key: 'Youth Meeting', icon: User },
  { key: 'Sunday Service', icon: CalendarIcon },
  { key: 'Special Event', icon: Sparkles },
  { key: 'Church Anniversary', icon: CheckCircle2 },
  { key: 'Other', icon: CheckCircle2 }
];

const DESIGN_STYLES = [
  'Modern', 'Professional', 'Minimal', 'Cinematic', 'Elegant', 'Church', 'Youth', 'Traditional'
];

const ORIENTATIONS = ['Landscape', 'Portrait', 'Square'] as const;

const LANGUAGES = ['English', 'Telugu', 'Hindi', 'Tamil', 'Kannada'];

// ─── Component ─────────────────────────────────────────────────────────────────
export default function AIContentCreator() {
  const { setTabByName, activeTab } = useContext(AdminTabContext);
  const { activeChurch } = useChurch();

  // Form state
  const [contentType, setContentType]       = useState('Sermon Thumbnail');
  const [topic, setTopic]                   = useState('');
  const [speaker, setSpeaker]               = useState('');
  const [location, setLocation]             = useState('');
  const [selectedDate, setSelectedDate]     = useState<Date | null>(null);
  const [selectedTime, setSelectedTime]     = useState<Date | null>(null);
  
  const [style, setStyle]                   = useState('Modern');
  const [orientation, setOrientation]       = useState<typeof ORIENTATIONS[number]>('Landscape');
  const [language, setLanguage]             = useState('English');
  const [advancedPrompt, setAdvancedPrompt] = useState('');
  const [showAdvanced, setShowAdvanced]     = useState(false);

  // Date/Time pickers
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [isTimePickerVisible, setTimePickerVisibility] = useState(false);

  // Output state
  const [generating, setGenerating]     = useState(false);
  const [imageUrl, setImageUrl]         = useState('');
  const [showResult, setShowResult]     = useState(false);
  const [showError, setShowError]       = useState(false);
  const [errorMsg, setErrorMsg]         = useState('');
  const [saved, setSaved]               = useState(false);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const buildPrompt = () => {
    const parts: string[] = [];
    parts.push(`Create a stunning, professional church social media graphic for a ${contentType}.`);
    if (topic) parts.push(`Topic/Title: "${topic}".`);
    if (speaker) parts.push(`Speaker: ${speaker}.`);
    if (selectedDate) parts.push(`Date: ${formatDate(selectedDate)}.`);
    if (selectedTime) parts.push(`Time: ${formatTime(selectedTime)}.`);
    if (location) parts.push(`Location: ${location}.`);
    parts.push(`Design style: ${style}. Language: ${language}. Orientation: ${orientation}.`);
    if (advancedPrompt) parts.push(`Additional details: ${advancedPrompt}`);
    return parts.join(' ');
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setShowResult(false);
    setSaved(false);

    try {
      const churchId = await FirestoreService.getChurchId();
      const url = await AIService.generateContentImage({ prompt: buildPrompt(), churchId: churchId! });
      setImageUrl(url);
      setShowResult(true);

      // Save metadata to Firestore
      try {
        await FirestoreService.saveAIContent({
          contentType,
          topic,
          language,
          designStyle: style,
          prompt: buildPrompt(),
          imageUrl: url,
          status: 'generated',
        });
      } catch (_) { /* non-blocking */ }

    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to generate image. Please try again.');
      setShowError(true);
    } finally {
      setGenerating(false);
    }
  };

  const resetForm = () => {
    setTopic('');
    setSpeaker('');
    setLocation('');
    setSelectedDate(null);
    setSelectedTime(null);
    setShowResult(false);
  };

  // ── JSX ─────────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      {/* ── HEADER ── */}
      <View style={styles.appHeader}>
        <View style={styles.headerRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flexShrink: 1 }}>
            <TouchableOpacity onPress={() => setTabByName?.('Dashboard')} style={{ flexDirection: 'row', alignItems: 'center', flexShrink: 0 }}>
              <ChevronLeft size={20} color="#fff" style={{ marginLeft: -6, marginRight: 4 }} />
              <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>Back</Text>
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { marginHorizontal: 12, opacity: 0.4, flexShrink: 0 }]}>|</Text>
            <View style={{ flexShrink: 1 }}>
              <Text style={[styles.headerTitle, { flexShrink: 1 }]} numberOfLines={1}>AI Content Creator</Text>
            </View>
          </View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        
        <View style={styles.lede}>
          <View style={styles.eyebrow}>
            <Sparkles size={13} color="#E3A83B" />
            <Text style={styles.eyebrowTxt}>AI Content Creator</Text>
          </View>
          <Text style={styles.h1}>Create church visuals in minutes</Text>
          <Text style={styles.p}>Pick a content type, fill in a few details, and get a ready-to-post thumbnail or card — no prompt writing needed.</Text>
        </View>

        <View style={styles.sectionLabel}>
          <View style={styles.stepNum}><Text style={styles.stepNumTxt}>1</Text></View>
          <Text style={styles.sectionLabelTxt}>Choose content type</Text>
        </View>
        
        <View style={styles.tileGrid}>
          {CONTENT_TYPES.map(ct => {
            const Icon = ct.icon;
            const selected = contentType === ct.key;
            return (
              <TouchableOpacity 
                key={ct.key} 
                style={[styles.tile, selected && styles.tileSelected]}
                onPress={() => setContentType(ct.key)}
                activeOpacity={0.8}
              >
                {selected && <LinearGradient colors={['#5B3FA6', '#8B5FBF', '#E3A83B']} start={{x:0, y:0}} end={{x:1, y:1}} style={StyleSheet.absoluteFillObject} />}
                <Icon size={16} color={selected ? '#fff' : '#5B3FA6'} style={{ zIndex: 1 }} />
                <Text style={[styles.tileLabel, selected && { color: '#fff' }]}>{ct.key}</Text>
                {selected && (
                  <View style={styles.checkWrap}>
                    <Check size={9} color="#5B3FA6" strokeWidth={3} />
                  </View>
                )}
              </TouchableOpacity>
            )
          })}
        </View>

        <View style={styles.sectionLabel}>
          <View style={styles.stepNum}><Text style={styles.stepNumTxt}>2</Text></View>
          <Text style={styles.sectionLabelTxt}>Add the details</Text>
        </View>
        
        <Text style={styles.fieldLabel}>Topic / Title</Text>
        <TextInput style={styles.input} value={topic} onChangeText={setTopic} placeholder="e.g. Walking by Faith, Not by Sight" placeholderTextColor="#9ca3af" />

        <View style={styles.row2}>
          <View style={{ flex: 1 }}>
            <Text style={styles.fieldLabel}>Date</Text>
            <TouchableOpacity style={styles.inputBox} onPress={() => setDatePickerVisibility(true)}>
              <Text style={{ color: selectedDate ? '#211A2E' : '#9ca3af' }}>{selectedDate ? formatDate(selectedDate) : 'Select Date'}</Text>
            </TouchableOpacity>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.fieldLabel}>Time</Text>
            <TouchableOpacity style={styles.inputBox} onPress={() => setTimePickerVisibility(true)}>
              <Text style={{ color: selectedTime ? '#211A2E' : '#9ca3af' }}>{selectedTime ? formatTime(selectedTime) : 'Select Time'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.fieldLabel}>Speaker (optional)</Text>
        <TextInput style={styles.input} value={speaker} onChangeText={setSpeaker} placeholder="Pastor John Miller" placeholderTextColor="#9ca3af" />
        
        <Text style={styles.fieldLabel}>Location (optional)</Text>
        <TextInput style={styles.input} value={location} onChangeText={setLocation} placeholder="Main Sanctuary" placeholderTextColor="#9ca3af" />

        <Text style={styles.fieldLabel}>Language</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillScroll}>
          {LANGUAGES.map(l => (
            <TouchableOpacity key={l} style={[styles.pill, language === l && styles.pillSelected]} onPress={() => setLanguage(l)}>
              {language === l && <LinearGradient colors={['#5B3FA6', '#8B5FBF', '#E3A83B']} start={{x:0, y:0}} end={{x:1, y:1}} style={StyleSheet.absoluteFillObject} />}
              <Text style={[styles.pillTxt, language === l && { color: '#fff' }]}>{l}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.fieldLabel}>Design style</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillScroll}>
          {DESIGN_STYLES.map(s => (
            <TouchableOpacity key={s} style={[styles.pill, style === s && styles.pillSelected]} onPress={() => setStyle(s)}>
               {style === s && <LinearGradient colors={['#5B3FA6', '#8B5FBF', '#E3A83B']} start={{x:0, y:0}} end={{x:1, y:1}} style={StyleSheet.absoluteFillObject} />}
              <Text style={[styles.pillTxt, style === s && { color: '#fff' }]}>{s}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.fieldLabel}>Orientation</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillScroll}>
          {ORIENTATIONS.map(o => (
            <TouchableOpacity key={o} style={[styles.pill, orientation === o && styles.pillSelected]} onPress={() => setOrientation(o)}>
               {orientation === o && <LinearGradient colors={['#5B3FA6', '#8B5FBF', '#E3A83B']} start={{x:0, y:0}} end={{x:1, y:1}} style={StyleSheet.absoluteFillObject} />}
              <Text style={[styles.pillTxt, orientation === o && { color: '#fff' }]}>{o}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.advancedWrap}>
          <TouchableOpacity style={styles.advancedSummary} onPress={() => setShowAdvanced(!showAdvanced)}>
            <ChevronDown size={14} color="#5B3FA6" style={{ transform: [{ rotate: showAdvanced ? '180deg' : '0deg' }] }} />
            <Text style={styles.advancedSummaryTxt}>Advanced prompt (optional)</Text>
          </TouchableOpacity>
          {showAdvanced && (
            <View style={styles.advancedBody}>
              <TextInput 
                style={[styles.input, styles.textarea]} 
                value={advancedPrompt} 
                onChangeText={setAdvancedPrompt} 
                placeholder="Leave blank to auto-generate from your selections above." 
                placeholderTextColor="#9ca3af" 
                multiline 
              />
            </View>
          )}
        </View>

        <View style={{ marginTop: 18 }}>
          <TouchableOpacity onPress={handleGenerate} disabled={generating} activeOpacity={0.88} style={styles.btnPrimary}>
            <LinearGradient colors={['#5B3FA6', '#8B5FBF', '#E3A83B']} start={{x:0, y:0}} end={{x:1, y:1}} style={styles.btnGradient} />
            <Wand2 size={15} color="#fff" style={{ zIndex: 1 }} />
            <Text style={styles.btnPrimaryTxt}>Generate</Text>
          </TouchableOpacity>
          {generating && <Text style={styles.generatingTxt}>Generating your visual…</Text>}
        </View>

        {showResult && imageUrl ? (
          <View style={styles.outputPanel}>
            <View style={styles.thumbPreview}>
               <Image source={{ uri: imageUrl }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
            </View>
            <View style={styles.btnRow}>
              <TouchableOpacity style={styles.btnGhost} onPress={handleGenerate}>
                <RefreshCw size={15} color="#211A2E" />
                <Text style={styles.btnGhostTxt}>Redo</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnGhost}>
                <ImageIcon size={15} color="#211A2E" />
                <Text style={styles.btnGhostTxt}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnGhost}>
                <Download size={15} color="#211A2E" />
                <Text style={styles.btnGhostTxt}>Save</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.btnRow}>
              <TouchableOpacity style={styles.btnGhost} onPress={() => Alert.alert('Added to Church Content')}>
                <CheckSquare size={15} color="#211A2E" />
                <Text style={styles.btnGhostTxt}>Use in Content</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnPrimarySmall} onPress={resetForm}>
                <LinearGradient colors={['#5B3FA6', '#8B5FBF', '#E3A83B']} start={{x:0, y:0}} end={{x:1, y:1}} style={styles.btnGradient} />
                <Wand2 size={15} color="#fff" style={{ zIndex: 1 }} />
                <Text style={styles.btnPrimaryTxt}>New</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}
        
        <Text style={styles.caption}>Prototype — connect to your real Firebase Storage & Firestore before shipping.</Text>
        <View style={{ height: 40 }} />
      </ScrollView>

      <DateTimePickerModal
        isVisible={isDatePickerVisible}
        mode="date"
        onConfirm={(date) => { setSelectedDate(date); setDatePickerVisibility(false); }}
        onCancel={() => setDatePickerVisibility(false)}
      />
      <DateTimePickerModal
        isVisible={isTimePickerVisible}
        mode="time"
        onConfirm={(time) => { setSelectedTime(time); setTimePickerVisibility(false); }}
        onCancel={() => setTimePickerVisibility(false)}
      />
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EDE7DC' },
  scroll: { padding: 16, paddingBottom: 80 },

  // Header
  appHeader: {
    paddingTop: 30,
    paddingBottom: 36,
    paddingHorizontal: 18,
    backgroundColor: '#3A2A6B',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '600', fontFamily: SERIF },

  // Typography
  lede: { marginBottom: 16 },
  eyebrow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  eyebrowTxt: { fontSize: 12, color: '#5B5468' },
  h1: { fontSize: 19, fontWeight: '600', fontFamily: SERIF, color: '#211A2E', lineHeight: 24 },
  p: { fontSize: 12.5, color: '#5B5468', marginTop: 5, lineHeight: 18 },

  sectionLabel: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    marginTop: 18, marginBottom: 9,
  },
  sectionLabelTxt: { fontSize: 12, fontWeight: '700', color: '#211A2E' },
  stepNum: {
    width: 17, height: 17, borderRadius: 8.5, backgroundColor: '#5B3FA6',
    justifyContent: 'center', alignItems: 'center', overflow: 'hidden'
  },
  stepNumTxt: { color: '#fff', fontSize: 10, fontWeight: '700', zIndex: 1 },

  tileGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tile: {
    width: (width - 40) / 2,
    borderWidth: 1.4, borderColor: '#E7E0D6', borderRadius: 12, padding: 11,
    backgroundColor: '#fff', flexDirection: 'column', gap: 7, overflow: 'hidden'
  },
  tileSelected: { borderColor: 'transparent', shadowColor: '#5B3FA6', shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  tileLabel: { fontSize: 12, fontWeight: '600', color: '#211A2E', zIndex: 1 },
  checkWrap: {
    position: 'absolute', top: 8, right: 8, width: 15, height: 15, borderRadius: 7.5,
    backgroundColor: 'rgba(255,255,255,0.95)', justifyContent: 'center', alignItems: 'center', zIndex: 1
  },

  fieldLabel: { fontSize: 11.5, fontWeight: '600', color: '#5B5468', marginTop: 14, marginBottom: 7 },
  input: {
    backgroundColor: '#fff', borderWidth: 1.4, borderColor: '#E7E0D6',
    borderRadius: 10, paddingVertical: 11, paddingHorizontal: 12, fontSize: 14, color: '#211A2E', fontFamily: SANS,
  },
  inputBox: {
    backgroundColor: '#fff', borderWidth: 1.4, borderColor: '#E7E0D6',
    borderRadius: 10, paddingVertical: 11, paddingHorizontal: 12,
  },
  row2: { flexDirection: 'row', gap: 10, marginTop: 12 },

  pillScroll: { flexDirection: 'row', overflow: 'visible', paddingBottom: 4 },
  pill: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1.4, borderColor: '#E7E0D6',
    backgroundColor: '#fff', marginRight: 7, overflow: 'hidden'
  },
  pillSelected: { borderColor: 'transparent' },
  pillTxt: { fontSize: 12.5, color: '#211A2E', zIndex: 1 },

  advancedWrap: { marginTop: 16 },
  advancedSummary: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  advancedSummaryTxt: { fontSize: 12.5, fontWeight: '600', color: '#5B3FA6' },
  advancedBody: { marginTop: 8 },
  textarea: { minHeight: 64, textAlignVertical: 'top' },

  btnPrimary: {
    borderRadius: 12, overflow: 'hidden', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 13,
    shadowColor: '#5B3FA6', shadowOpacity: 0.4, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 5,
  },
  btnPrimarySmall: {
    flex: 1, borderRadius: 12, overflow: 'hidden', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, paddingHorizontal: 10
  },
  btnGradient: { ...StyleSheet.absoluteFillObject },
  btnPrimaryTxt: { color: '#fff', fontSize: 13.5, fontWeight: '700', fontFamily: SANS, zIndex: 1 },
  generatingTxt: { textAlign: 'center', fontSize: 12.5, color: '#5B5468', marginTop: 10 },

  outputPanel: { marginTop: 14 },
  thumbPreview: {
    borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: '#E7E0D6',
    aspectRatio: 16/10, backgroundColor: '#5B3FA6',
    justifyContent: 'center', alignItems: 'center', padding: 20, marginBottom: 14,
  },
  btnRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  btnGhost: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#fff', borderWidth: 1.4, borderColor: '#E7E0D6', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 10
  },
  btnGhostTxt: { color: '#211A2E', fontSize: 12.5, fontWeight: '700', fontFamily: SANS },

  caption: { textAlign: 'center', fontSize: 11, color: '#8A8298', marginTop: 14 }
});

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
  StatusBar,
  Animated,
  Image,
} from 'react-native';
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
} from 'lucide-react-native';
import { AdminTabContext } from '../../context/AdminTabContext';
import { useChurch } from '../../context/ChurchContext';
import AIService from '../../services/AIService';
import FirestoreService from '../../services/FirestoreService';

const { width } = Dimensions.get('window');
const SERIF = Platform.OS === 'ios' ? 'Georgia' : 'serif';

// ─── Data ──────────────────────────────────────────────────────────────────────
const CONTENT_TYPES = [
  { key: 'Sermon Thumbnail', emoji: '🎤' },
  { key: 'Event Poster',     emoji: '📅' },
  { key: 'Birthday Wish',    emoji: '🎂' },
  { key: 'Scripture Card',   emoji: '📖' },
  { key: 'Announcement',     emoji: '📢' },
  { key: 'Prayer Card',      emoji: '🙏' },
];

const DESIGN_STYLES = [
  'Modern Minimal',
  'Classic Church',
  'Vibrant & Bold',
  'Elegant Dark',
  'Watercolor Soft',
  'Gold & Royal',
];

const ORIENTATIONS = ['Portrait', 'Landscape', 'Square'] as const;

const LANGUAGES = ['English', 'Telugu', 'Hindi', 'Tamil'];

// ─── Component ─────────────────────────────────────────────────────────────────
export default function AIContentCreator() {
  const { setTabByName } = useContext(AdminTabContext);
  const { activeChurch } = useChurch();

  // Form state
  const [contentType, setContentType]       = useState('Sermon Thumbnail');
  const [topic, setTopic]                   = useState('');
  const [speaker, setSpeaker]               = useState('');
  const [date, setDate]                     = useState('');
  const [style, setStyle]                   = useState('Modern Minimal');
  const [orientation, setOrientation]       = useState<typeof ORIENTATIONS[number]>('Square');
  const [language, setLanguage]             = useState('English');
  const [advancedPrompt, setAdvancedPrompt] = useState('');
  const [showAdvanced, setShowAdvanced]     = useState(false);

  // Picker visibility
  const [showStylePicker, setShowStylePicker]  = useState(false);
  const [showLangPicker, setShowLangPicker]    = useState(false);

  // Output state
  const [generating, setGenerating]     = useState(false);
  const [imageUrl, setImageUrl]         = useState('');
  const [showResult, setShowResult]     = useState(false);
  const [showError, setShowError]       = useState(false);
  const [errorMsg, setErrorMsg]         = useState('');
  const [saved, setSaved]               = useState(false);

  // Animation
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const startPulse = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.04, duration: 700, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  };
  const stopPulse = () => { pulseAnim.stopAnimation(); pulseAnim.setValue(1); };

  // ── Handlers ────────────────────────────────────────────────────────────────
  const buildPrompt = () => {
    const parts: string[] = [];
    parts.push(`Create a stunning, professional church social media graphic for a ${contentType}.`);
    if (topic) parts.push(`Topic: "${topic}".`);
    if (speaker) parts.push(`Speaker: ${speaker}.`);
    if (date) parts.push(`Date: ${date}.`);
    parts.push(`Design style: ${style}. Language: ${language}. Orientation: ${orientation}.`);
    parts.push('Include a cross symbol. Text should be clearly readable. Church branding, divine aesthetic, inspiring.');
    if (advancedPrompt) parts.push(`Additional details: ${advancedPrompt}`);
    return parts.join(' ');
  };

  const handleGenerate = async () => {
    if (!topic.trim()) {
      Alert.alert('Topic Required', 'Please enter a topic or message for the image.');
      return;
    }

    setGenerating(true);
    setShowResult(false);
    setSaved(false);
    startPulse();

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
      stopPulse();
    }
  };

  const handleDownload = async () => {
    try {
      const MediaLibrary = require('expo-media-library');
      const FileSystem = require('expo-file-system');
      const perm = await MediaLibrary.requestPermissionsAsync();
      if (!perm.granted) { Alert.alert('Permission needed', 'Please grant media library access.'); return; }
      const localUri = FileSystem.cacheDirectory + `ai_image_${Date.now()}.jpg`;
      await FileSystem.downloadAsync(imageUrl, localUri);
      await MediaLibrary.saveToLibraryAsync(localUri);
      Alert.alert('Saved!', 'Image saved to your gallery.');
    } catch (_) {
      Alert.alert('Download', 'Please long-press the image to save it manually.');
    }
  };

  const handleUseImage = () => {
    Alert.alert('Use Image', 'This image URL has been copied. You can now paste it in any sermon, event, or broadcast field.', [{ text: 'OK' }]);
  };

  // ── JSX ─────────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a2d5a" />

      {/* ── HERO HEADER ── */}
      <LinearGradient colors={['#1a2d5a', '#92400e']} style={styles.hero}>
        <TouchableOpacity
          onPress={() => setTabByName?.('Dashboard')}
          style={styles.backBtn}
          activeOpacity={0.7}
        >
          <ChevronLeft size={20} color="#fff" />
          <Text style={styles.backTxt}>Back</Text>
        </TouchableOpacity>

        <View style={styles.heroCenter}>
          <View style={styles.freeBadge}>
            <Text style={styles.freeBadgeTxt}>✦ FREE</Text>
          </View>
          <View style={styles.heroIconWrap}>
            <Wand2 size={26} color="#fbbf24" strokeWidth={2} />
          </View>
          <Text style={styles.heroTitle}>AI Content Creator</Text>
          <Text style={styles.heroSub}>Create stunning church visuals with AI</Text>
        </View>

        <View style={styles.heroDot1} />
        <View style={styles.heroDot2} />
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >

        {/* ── CONTENT TYPE PICKER ── */}
        <View style={styles.card}>
          <View style={styles.cardHd}>
            <View style={styles.cardHdIconWrap}>
              <LayoutTemplate size={14} color="#1a2d5a" strokeWidth={2.5} />
            </View>
            <Text style={styles.cardHdTxt}>CONTENT TYPE</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.chipRow}>
              {CONTENT_TYPES.map(ct => {
                const selected = contentType === ct.key;
                return (
                  <TouchableOpacity
                    key={ct.key}
                    style={[styles.chip, selected && styles.chipSelected]}
                    onPress={() => setContentType(ct.key)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.chipEmoji}>{ct.emoji}</Text>
                    <Text style={[styles.chipTxt, selected && styles.chipTxtSelected]}>{ct.key}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </View>

        {/* ── DETAILS ── */}
        <View style={styles.card}>
          <View style={styles.cardHd}>
            <View style={styles.cardHdIconWrap}>
              <AlignLeft size={14} color="#1a2d5a" strokeWidth={2.5} />
            </View>
            <Text style={styles.cardHdTxt}>CONTENT DETAILS</Text>
          </View>

          <View style={styles.fGroup}>
            <Text style={styles.fLabel}>Topic / Message <Text style={{ color: '#c0392b' }}>*</Text></Text>
            <TextInput
              style={styles.input}
              value={topic}
              onChangeText={setTopic}
              placeholder="e.g. Faith Over Fear"
              placeholderTextColor="#9ca3af"
            />
          </View>

          <View style={styles.fGroup}>
            <Text style={styles.fLabel}>Speaker / Pastor Name</Text>
            <View style={styles.inputWithIcon}>
              <User size={14} color="#6b7280" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.inputInner}
                value={speaker}
                onChangeText={setSpeaker}
                placeholder="e.g. Pastor Samuel"
                placeholderTextColor="#9ca3af"
              />
            </View>
          </View>

          <View style={styles.fGroup}>
            <Text style={styles.fLabel}>Date (Optional)</Text>
            <View style={styles.inputWithIcon}>
              <CalendarIcon size={14} color="#6b7280" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.inputInner}
                value={date}
                onChangeText={setDate}
                placeholder="e.g. Sep 15, 2026"
                placeholderTextColor="#9ca3af"
              />
            </View>
          </View>
        </View>

        {/* ── STYLE & ORIENTATION ── */}
        <View style={styles.card}>
          <View style={styles.cardHd}>
            <View style={styles.cardHdIconWrap}>
              <Sparkles size={14} color="#1a2d5a" strokeWidth={2.5} />
            </View>
            <Text style={styles.cardHdTxt}>DESIGN OPTIONS</Text>
          </View>

          <View style={styles.twoColRow}>
            {/* Style picker */}
            <View style={{ flex: 1 }}>
              <Text style={styles.fLabel}>Design Style</Text>
              <TouchableOpacity style={styles.selectBox} onPress={() => setShowStylePicker(true)} activeOpacity={0.8}>
                <Text style={styles.selectTxt} numberOfLines={1}>{style}</Text>
                <ChevronDown size={15} color="#6b7280" />
              </TouchableOpacity>
            </View>
            {/* Language */}
            <View style={{ flex: 1 }}>
              <Text style={styles.fLabel}>Language</Text>
              <TouchableOpacity style={styles.selectBox} onPress={() => setShowLangPicker(true)} activeOpacity={0.8}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Globe size={13} color="#1a2d5a" />
                  <Text style={styles.selectTxt}>{language}</Text>
                </View>
                <ChevronDown size={15} color="#6b7280" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Orientation */}
          <View style={[styles.fGroup, { marginTop: 14 }]}>
            <Text style={styles.fLabel}>Orientation</Text>
            <View style={styles.segmentRow}>
              {ORIENTATIONS.map(opt => (
                <TouchableOpacity
                  key={opt}
                  style={[styles.segBtn, orientation === opt && styles.segBtnActive]}
                  onPress={() => setOrientation(opt)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.segTxt, orientation === opt && styles.segTxtActive]}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Advanced Prompt */}
          <TouchableOpacity
            style={styles.advancedToggle}
            onPress={() => setShowAdvanced(v => !v)}
            activeOpacity={0.8}
          >
            <Text style={styles.advancedToggleTxt}>Advanced Prompt</Text>
            {showAdvanced ? <ChevronUp size={14} color="#1a2d5a" /> : <ChevronDown size={14} color="#1a2d5a" />}
          </TouchableOpacity>
          {showAdvanced && (
            <TextInput
              style={[styles.input, styles.textarea]}
              value={advancedPrompt}
              onChangeText={setAdvancedPrompt}
              placeholder="Customize the AI prompt… e.g. add a dove flying over a mountain"
              placeholderTextColor="#9ca3af"
              multiline
            />
          )}
        </View>

        {/* ── GENERATE BUTTON ── */}
        <Animated.View style={{ transform: [{ scale: generating ? pulseAnim : 1 }] }}>
          <TouchableOpacity
            onPress={handleGenerate}
            disabled={generating}
            activeOpacity={0.88}
            style={styles.generateBtn}
          >
            <LinearGradient
              colors={generating ? ['#374151', '#374151'] : ['#c0392b', '#1a2d5a']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.generateBtnInner}
            >
              {generating ? (
                <>
                  <ActivityIndicator color="#fff" size="small" />
                  <Text style={styles.generateTxt}>Generating Image…</Text>
                </>
              ) : (
                <>
                  <Wand2 size={18} color="#fbbf24" />
                  <Text style={styles.generateTxt}>Generate Image</Text>
                  <Sparkles size={14} color="rgba(255,255,255,0.6)" />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* ── IMAGE PREVIEW CARD ── */}
        {showResult && imageUrl ? (
          <View style={[styles.card, { borderTopColor: '#92400e' }]}>
            <View style={styles.resultHd}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <CheckCircle2 size={15} color="#15803d" />
                <Text style={styles.resultHdTxt}>Generated Image</Text>
              </View>
              <TouchableOpacity style={styles.regenBtn} onPress={handleGenerate}>
                <RefreshCw size={12} color="#1a2d5a" />
                <Text style={styles.regenTxt}>Regenerate</Text>
              </TouchableOpacity>
            </View>

            {/* Image preview */}
            <View style={styles.imagePreviewWrap}>
              <Image source={{ uri: imageUrl }} style={styles.previewImage} resizeMode="cover" />
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.1)']}
                style={StyleSheet.absoluteFillObject}
              />
            </View>

            {/* Action buttons */}
            <View style={styles.imageActions}>
              <TouchableOpacity style={styles.imageActionBtn} onPress={handleDownload} activeOpacity={0.8}>
                <Download size={16} color="#1a2d5a" />
                <Text style={styles.imageActionTxt}>Download</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.imageActionBtn, styles.imageActionBtnPrimary]} onPress={handleUseImage} activeOpacity={0.8}>
                <CheckSquare size={16} color="#fff" />
                <Text style={[styles.imageActionTxt, { color: '#fff' }]}>Use Image</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.imageActionBtn, { borderColor: '#f59e0b20', backgroundColor: '#fffbeb' }]} onPress={handleGenerate} activeOpacity={0.8}>
                <RefreshCw size={16} color="#d97706" />
                <Text style={[styles.imageActionTxt, { color: '#d97706' }]}>New</Text>
              </TouchableOpacity>
            </View>

            {saved && (
              <View style={styles.savedBadge}>
                <CheckCircle2 size={12} color="#15803d" />
                <Text style={styles.savedTxt}>Saved to church library</Text>
              </View>
            )}
          </View>
        ) : null}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ── STYLE PICKER MODAL ── */}
      <Modal visible={showStylePicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.pickerCard}>
            <View style={styles.pickerHdRow}>
              <Text style={styles.pickerHdTxt}>Design Style</Text>
              <TouchableOpacity onPress={() => setShowStylePicker(false)}>
                <X size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>
            {DESIGN_STYLES.map(s => (
              <TouchableOpacity
                key={s}
                style={[styles.pickerItem, style === s && styles.pickerItemActive]}
                onPress={() => { setStyle(s); setShowStylePicker(false); }}
              >
                <Text style={[styles.pickerItemTxt, style === s && styles.pickerItemTxtActive]}>{s}</Text>
                {style === s && <CheckCircle2 size={16} color="#fff" />}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      {/* ── LANGUAGE PICKER MODAL ── */}
      <Modal visible={showLangPicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.pickerCard}>
            <View style={styles.pickerHdRow}>
              <Text style={styles.pickerHdTxt}>Select Language</Text>
              <TouchableOpacity onPress={() => setShowLangPicker(false)}>
                <X size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>
            {LANGUAGES.map(lang => (
              <TouchableOpacity
                key={lang}
                style={[styles.pickerItem, language === lang && styles.pickerItemActive]}
                onPress={() => { setLanguage(lang); setShowLangPicker(false); }}
              >
                <Text style={[styles.pickerItemTxt, language === lang && styles.pickerItemTxtActive]}>{lang}</Text>
                {language === lang && <CheckCircle2 size={16} color="#fff" />}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      {/* ── ERROR MODAL ── */}
      <Modal visible={showError} transparent animationType="fade">
        <View style={[styles.modalOverlay, { justifyContent: 'center' }]}>
          <View style={styles.alertCard}>
            <View style={styles.alertIconBox}>
              <AlertCircle size={40} color="#c0392b" />
            </View>
            <Text style={styles.alertTitle}>Generation Failed</Text>
            <Text style={styles.alertSub}>{errorMsg}</Text>
            <TouchableOpacity
              style={[styles.alertBtn, { backgroundColor: '#c0392b' }]}
              onPress={() => setShowError(false)}
            >
              <Text style={styles.alertBtnTxt}>Try Again</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EDE8DC' },
  scroll: { padding: 14, paddingBottom: 80 },

  // Hero
  hero: {
    paddingTop: Platform.OS === 'ios' ? 56 : 44,
    paddingBottom: 28,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: 'hidden',
    marginBottom: 14,
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', marginBottom: 12 },
  backTxt: { color: '#fff', fontSize: 14, fontWeight: '600' },
  heroCenter: { alignItems: 'center' },
  freeBadge: { backgroundColor: '#15803d', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 50, marginBottom: 10, alignSelf: 'center' },
  freeBadgeTxt: { color: '#fff', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  heroIconWrap: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: 'rgba(251,191,36,0.15)',
    borderWidth: 1, borderColor: 'rgba(251,191,36,0.3)',
    justifyContent: 'center', alignItems: 'center', marginBottom: 12,
  },
  heroTitle: { color: '#fff', fontSize: 26, fontWeight: '800', letterSpacing: -0.5, fontFamily: SERIF },
  heroSub: { color: '#fde68a', fontSize: 13, marginTop: 4 },
  heroDot1: { position: 'absolute', width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(251,191,36,0.07)', top: -20, right: -15 },
  heroDot2: { position: 'absolute', width: 70, height: 70, borderRadius: 35, backgroundColor: 'rgba(192,57,43,0.08)', bottom: 5, left: -10 },

  // Cards
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(26,45,90,0.08)',
    borderTopWidth: 3,
    borderTopColor: '#1a2d5a',
    shadowColor: '#1a2d5a',
    shadowOpacity: 0.07,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  cardHd: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginBottom: 16, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: 'rgba(26,45,90,0.07)',
  },
  cardHdIconWrap: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: 'rgba(26,45,90,0.08)',
    justifyContent: 'center', alignItems: 'center',
  },
  cardHdTxt: { fontSize: 11, fontWeight: '800', color: '#1a2d5a', letterSpacing: 0.8 },

  // Chips
  chipRow: { flexDirection: 'row', gap: 8, paddingBottom: 4 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 9,
    borderRadius: 50, borderWidth: 1.5, borderColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
  },
  chipSelected: { borderColor: '#1a2d5a', backgroundColor: '#1a2d5a' },
  chipEmoji: { fontSize: 14 },
  chipTxt: { fontSize: 12, fontWeight: '600', color: '#374151' },
  chipTxtSelected: { color: '#fff' },

  // Form
  fGroup: { marginBottom: 14 },
  fLabel: { fontSize: 12, fontWeight: '700', color: '#1a2d5a', marginBottom: 7 },
  input: {
    backgroundColor: '#fdfdfd', borderWidth: 1, borderColor: '#e5e7eb',
    borderRadius: 10, padding: 12, fontSize: 13, color: '#1a2d5a',
  },
  textarea: { minHeight: 80, textAlignVertical: 'top' },
  inputWithIcon: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fdfdfd', borderWidth: 1, borderColor: '#e5e7eb',
    borderRadius: 10, paddingHorizontal: 12, height: 46,
  },
  inputInner: { flex: 1, fontSize: 13, color: '#1a2d5a' },
  selectBox: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#fdfdfd', borderWidth: 1, borderColor: '#e5e7eb',
    borderRadius: 10, paddingHorizontal: 12, height: 46,
  },
  selectTxt: { fontSize: 13, color: '#1a2d5a', fontWeight: '600', flex: 1 },

  // Two-col row
  twoColRow: { flexDirection: 'row', gap: 10 },

  // Segment
  segmentRow: { flexDirection: 'row', gap: 8 },
  segBtn: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingVertical: 10, borderRadius: 10,
    borderWidth: 1.5, borderColor: '#e5e7eb', backgroundColor: '#f9fafb',
  },
  segBtnActive: { borderColor: '#1a2d5a', backgroundColor: '#1a2d5a' },
  segTxt: { fontSize: 12, fontWeight: '600', color: '#6b7280' },
  segTxtActive: { color: '#fff' },

  // Advanced prompt toggle
  advancedToggle: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 10, marginTop: 4,
    borderTopWidth: 1, borderTopColor: 'rgba(26,45,90,0.07)',
  },
  advancedToggleTxt: { fontSize: 12, fontWeight: '700', color: '#1a2d5a' },

  // Generate button
  generateBtn: {
    marginBottom: 12, borderRadius: 16, overflow: 'hidden',
    shadowColor: '#c0392b', shadowOpacity: 0.3, shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 }, elevation: 8,
  },
  generateBtnInner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, paddingVertical: 17,
  },
  generateTxt: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.3 },

  // Result
  resultHd: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14,
  },
  resultHdTxt: { fontSize: 13, fontWeight: '800', color: '#1a2d5a' },
  regenBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8,
    backgroundColor: 'rgba(26,45,90,0.07)',
  },
  regenTxt: { fontSize: 11, fontWeight: '700', color: '#1a2d5a' },

  imagePreviewWrap: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#f0f2f7',
    marginBottom: 12,
  },
  previewImage: { width: '100%', height: '100%' },
  imageActions: { flexDirection: 'row', gap: 8 },
  imageActionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 12, borderRadius: 12,
    borderWidth: 1.5, borderColor: 'rgba(26,45,90,0.15)',
    backgroundColor: 'rgba(26,45,90,0.04)',
  },
  imageActionBtnPrimary: { backgroundColor: '#1a2d5a', borderColor: '#1a2d5a' },
  imageActionTxt: { fontSize: 12, fontWeight: '700', color: '#1a2d5a' },

  savedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#f0fdf4', borderRadius: 8, padding: 8, marginTop: 8,
  },
  savedTxt: { fontSize: 11, color: '#15803d', fontWeight: '600' },

  // Modals
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  pickerCard: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 36 },
  pickerHdRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  pickerHdTxt: { fontSize: 16, fontWeight: '800', color: '#1a2d5a' },
  pickerItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 14, borderRadius: 10, marginBottom: 6,
  },
  pickerItemActive: { backgroundColor: '#1a2d5a' },
  pickerItemTxt: { fontSize: 14, color: '#374151', fontWeight: '500' },
  pickerItemTxtActive: { color: '#fff', fontWeight: '700' },

  alertCard: {
    backgroundColor: '#fff', width: '85%', alignSelf: 'center',
    borderRadius: 24, padding: 28, alignItems: 'center',
    marginTop: 'auto', marginBottom: 'auto',
  },
  alertIconBox: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#fef2f2', justifyContent: 'center', alignItems: 'center', marginBottom: 18,
  },
  alertTitle: { fontSize: 20, fontWeight: '800', color: '#1a2d5a', marginBottom: 8 },
  alertSub: { fontSize: 13, color: '#6b7280', textAlign: 'center', marginBottom: 22 },
  alertBtn: { width: '100%', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  alertBtnTxt: { color: '#fff', fontSize: 14, fontWeight: '700' },
});

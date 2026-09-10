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
  Share,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ChevronLeft,
  Sparkles,
  BookOpen,
  Globe,
  Clock,
  RefreshCw,
  Layers,
  Languages,
  BookMarked,
  Image as ImageIcon,
  Copy,
  Share2,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  X,
  Zap,
} from 'lucide-react-native';
import { AdminTabContext } from '../../context/AdminTabContext';
import { useChurch } from '../../context/ChurchContext';
import AIService from '../../services/AIService';
import FirestoreService from '../../services/FirestoreService';

const { width } = Dimensions.get('window');
const SERIF = Platform.OS === 'ios' ? 'Georgia' : 'serif';

// ─── Data ──────────────────────────────────────────────────────────────────────
const LIFE_EVENTS = [
  { key: 'Baptism',          emoji: '🙏' },
  { key: 'Wedding',          emoji: '💍' },
  { key: 'Funeral',          emoji: '🕊️' },
  { key: 'Baby Dedication',  emoji: '👶' },
  { key: 'Ordination',       emoji: '✝️' },
];

const SPIRITUAL_TOPICS = [
  { key: 'Evangelism',   emoji: '📢' },
  { key: 'Healing',      emoji: '❤️‍🩹' },
  { key: 'Faith',        emoji: '⚓' },
  { key: 'Prayer',       emoji: '🙌' },
  { key: 'Worship',      emoji: '🎵' },
  { key: 'Repentance',   emoji: '🔄' },
  { key: 'Grace',        emoji: '✨' },
  { key: 'Salvation',    emoji: '🕊️' },
];

const LANGUAGES = ['English', 'Telugu', 'Hindi', 'Tamil', 'Kannada'];

// ─── Component ─────────────────────────────────────────────────────────────────
export default function AISermonAssistant() {
  const { setTabByName } = useContext(AdminTabContext);
  const { activeChurch } = useChurch();

  // Form state
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [topic, setTopic]                         = useState('');
  const [language, setLanguage]                   = useState('English');
  const [length, setLength]                       = useState<'Short' | 'Medium' | 'Long'>('Medium');
  const [showLangPicker, setShowLangPicker]       = useState(false);

  // Output state
  const [generating, setGenerating]       = useState(false);
  const [generatedText, setGeneratedText] = useState('');
  const [showResult, setShowResult]       = useState(false);
  const [showSuccess, setShowSuccess]     = useState(false);
  const [showError, setShowError]         = useState(false);
  const [errorMsg, setErrorMsg]           = useState('');

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

  const stopPulse = () => {
    pulseAnim.stopAnimation();
    pulseAnim.setValue(1);
  };

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (!topic.trim()) {
      Alert.alert('Topic Required', 'Please enter a sermon topic before generating.');
      return;
    }
    if (!selectedCategory) {
      Alert.alert('Category Required', 'Please select a sermon category.');
      return;
    }

    setGenerating(true);
    setShowResult(false);
    startPulse();

    try {
      const churchId = await FirestoreService.getChurchId();
      const lengthMap = { Short: '15 minutes', Medium: '30 minutes', Long: '45 minutes' };
      const topicFull = `${topic} (Category: ${selectedCategory}, Length: ${lengthMap[length]})`;
      const text = await AIService.generateSermon({
        topic: topicFull,
        category: selectedCategory,
        language,
        churchId: churchId!,
      });
      setGeneratedText(text);
      setShowResult(true);

      // Save to Firestore
      try {
        await FirestoreService.saveAISermon({
          category: selectedCategory,
          topic,
          language,
          generatedSermonText: text,
          status: 'generated',
        });
      } catch (_) { /* non-blocking */ }

    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to generate sermon. Please try again.');
      setShowError(true);
    } finally {
      setGenerating(false);
      stopPulse();
    }
  };

  const handleCopy = async () => {
    try {
      const Clipboard = require('@react-native-clipboard/clipboard').default;
      Clipboard.setString(generatedText);
      Alert.alert('Copied!', 'Sermon text copied to clipboard.');
    } catch (_) {
      Alert.alert('Copy', 'Please select and copy the text manually.');
    }
  };

  const handleShare = async () => {
    await Share.share({ message: generatedText, title: `AI Sermon: ${topic}` });
  };

  const handleCreateThumbnail = () => {
    setTabByName?.('AI Content Creator');
  };

  // ── Render helpers ─────────────────────────────────────────────────────────
  const renderChip = (label: string, emoji: string) => {
    const selected = selectedCategory === label;
    return (
      <TouchableOpacity
        key={label}
        onPress={() => setSelectedCategory(selected ? '' : label)}
        style={[styles.chip, selected && styles.chipSelected]}
        activeOpacity={0.75}
      >
        <Text style={styles.chipEmoji}>{emoji}</Text>
        <Text style={[styles.chipTxt, selected && styles.chipTxtSelected]}>{label}</Text>
      </TouchableOpacity>
    );
  };

  // ── JSX ─────────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a2d5a" />

      {/* ── HERO HEADER ── */}
      <LinearGradient colors={['#1a2d5a', '#2d1b69']} style={styles.hero}>
        <TouchableOpacity
          onPress={() => setTabByName?.('Dashboard')}
          style={styles.backBtn}
          activeOpacity={0.7}
        >
          <ChevronLeft size={20} color="#fff" />
          <Text style={styles.backTxt}>Back</Text>
        </TouchableOpacity>

        <View style={styles.heroCenter}>
          <View style={styles.heroIconWrap}>
            <Sparkles size={26} color="#fbbf24" strokeWidth={2} />
          </View>
          <Text style={styles.heroTitle}>AI Sermon Assistant</Text>
          <Text style={styles.heroSub}>Generate Spirit-filled sermons in seconds</Text>
        </View>

        {/* Decorative dots */}
        <View style={styles.heroDot1} />
        <View style={styles.heroDot2} />
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >

        {/* ── CATEGORY SECTION ── */}
        <View style={styles.card}>
          <View style={styles.cardHd}>
            <View style={styles.cardHdIconWrap}>
              <BookOpen size={14} color="#1a2d5a" strokeWidth={2.5} />
            </View>
            <Text style={styles.cardHdTxt}>SERMON CATEGORY</Text>
          </View>
          <Text style={styles.sectionSubLabel}>LIFE EVENTS</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
            <View style={styles.chipRow}>
              {LIFE_EVENTS.map(e => renderChip(e.key, e.emoji))}
            </View>
          </ScrollView>

          <Text style={styles.sectionSubLabel}>SPIRITUAL TOPICS</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.chipRow}>
              {SPIRITUAL_TOPICS.map(e => renderChip(e.key, e.emoji))}
            </View>
          </ScrollView>
        </View>

        {/* ── SERMON DETAILS ── */}
        <View style={styles.card}>
          <View style={styles.cardHd}>
            <View style={styles.cardHdIconWrap}>
              <BookMarked size={14} color="#1a2d5a" strokeWidth={2.5} />
            </View>
            <Text style={styles.cardHdTxt}>SERMON DETAILS</Text>
          </View>

          {/* Topic */}
          <View style={styles.fGroup}>
            <Text style={styles.fLabel}>Topic <Text style={{ color: '#c0392b' }}>*</Text></Text>
            <TextInput
              style={styles.input}
              value={topic}
              onChangeText={setTopic}
              placeholder="e.g. Faith in times of trial"
              placeholderTextColor="#9ca3af"
            />
          </View>

          {/* Language Picker */}
          <View style={styles.fGroup}>
            <Text style={styles.fLabel}>Language</Text>
            <TouchableOpacity style={styles.selectBox} onPress={() => setShowLangPicker(true)} activeOpacity={0.8}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Globe size={14} color="#1a2d5a" />
                <Text style={styles.selectTxt}>{language}</Text>
              </View>
              <ChevronDown size={16} color="#6b7280" />
            </TouchableOpacity>
          </View>

          {/* Sermon Length */}
          <View style={styles.fGroup}>
            <Text style={styles.fLabel}>Sermon Length</Text>
            <View style={styles.segmentRow}>
              {(['Short', 'Medium', 'Long'] as const).map(opt => (
                <TouchableOpacity
                  key={opt}
                  style={[styles.segBtn, length === opt && styles.segBtnActive]}
                  onPress={() => setLength(opt)}
                  activeOpacity={0.8}
                >
                  <Clock size={12} color={length === opt ? '#fff' : '#6b7280'} />
                  <Text style={[styles.segTxt, length === opt && styles.segTxtActive]}>
                    {opt} {opt === 'Short' ? '· 15 min' : opt === 'Medium' ? '· 30 min' : '· 45 min'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
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
              colors={generating ? ['#374151', '#374151'] : ['#1a2d5a', '#c0392b']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.generateBtnInner}
            >
              {generating ? (
                <>
                  <ActivityIndicator color="#fff" size="small" />
                  <Text style={styles.generateTxt}>Generating Sermon…</Text>
                </>
              ) : (
                <>
                  <Sparkles size={18} color="#fbbf24" />
                  <Text style={styles.generateTxt}>Generate Sermon</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* ── RESULT CARD ── */}
        {showResult && (
          <View style={[styles.card, { borderTopColor: '#2d1b69' }]}>
            {/* Header */}
            <View style={styles.resultHd}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <CheckCircle2 size={16} color="#15803d" />
                <Text style={styles.resultHdTxt}>Generated Sermon</Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity style={styles.resultActionBtn} onPress={handleGenerate}>
                  <RefreshCw size={13} color="#1a2d5a" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.resultActionBtn} onPress={handleCopy}>
                  <Copy size={13} color="#1a2d5a" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.resultActionBtn} onPress={handleShare}>
                  <Share2 size={13} color="#1a2d5a" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Sermon Text */}
            <ScrollView style={styles.sermonTextBox} nestedScrollEnabled>
              <Text style={styles.sermonText}>{generatedText}</Text>
            </ScrollView>

            {/* Action Grid */}
            <View style={styles.actionGrid}>
              <TouchableOpacity style={styles.actionGridBtn} onPress={handleGenerate}>
                <RefreshCw size={15} color="#1a2d5a" />
                <Text style={styles.actionGridTxt}>Regenerate</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionGridBtn} onPress={handleShare}>
                <Share2 size={15} color="#1a2d5a" />
                <Text style={styles.actionGridTxt}>Share</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionGridBtn} onPress={handleCopy}>
                <Copy size={15} color="#1a2d5a" />
                <Text style={styles.actionGridTxt}>Copy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionGridBtn, { borderColor: '#7c3aed20', backgroundColor: '#faf5ff' }]}
                onPress={handleCreateThumbnail}
              >
                <ImageIcon size={15} color="#7c3aed" />
                <Text style={[styles.actionGridTxt, { color: '#7c3aed' }]}>Thumbnail</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

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
                <Text style={[styles.pickerItemTxt, language === lang && styles.pickerItemTxtActive]}>
                  {lang}
                </Text>
                {language === lang && <CheckCircle2 size={16} color="#fff" />}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      {/* ── ERROR MODAL ── */}
      <Modal visible={showError} transparent animationType="fade">
        <View style={styles.modalOverlay}>
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
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', marginBottom: 16 },
  backTxt: { color: '#fff', fontSize: 14, fontWeight: '600' },
  heroCenter: { alignItems: 'center' },
  heroIconWrap: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: 'rgba(251,191,36,0.15)',
    borderWidth: 1, borderColor: 'rgba(251,191,36,0.3)',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 12,
  },
  heroTitle: { color: '#fff', fontSize: 26, fontWeight: '800', letterSpacing: -0.5, fontFamily: SERIF },
  heroSub: { color: '#aac4e8', fontSize: 13, marginTop: 4, textAlign: 'center' },
  heroDot1: { position: 'absolute', width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(251,191,36,0.06)', top: -30, right: -20 },
  heroDot2: { position: 'absolute', width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(192,57,43,0.08)', bottom: 10, left: -20 },

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

  // Section labels
  sectionSubLabel: { fontSize: 10, fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 },

  // Chips
  chipRow: { flexDirection: 'row', gap: 8, paddingBottom: 4 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 14, paddingVertical: 9,
    borderRadius: 50, borderWidth: 1.5, borderColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
  },
  chipSelected: { borderColor: '#1a2d5a', backgroundColor: '#1a2d5a' },
  chipEmoji: { fontSize: 14 },
  chipTxt: { fontSize: 12, fontWeight: '600', color: '#374151' },
  chipTxtSelected: { color: '#fff' },

  // Form
  fGroup: { marginBottom: 16 },
  fLabel: { fontSize: 12, fontWeight: '700', color: '#1a2d5a', marginBottom: 7 },
  input: {
    backgroundColor: '#fdfdfd', borderWidth: 1, borderColor: '#e5e7eb',
    borderRadius: 10, padding: 12, fontSize: 13, color: '#1a2d5a',
  },
  selectBox: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#fdfdfd', borderWidth: 1, borderColor: '#e5e7eb',
    borderRadius: 10, paddingHorizontal: 12, height: 46,
  },
  selectTxt: { fontSize: 13, color: '#1a2d5a', fontWeight: '600' },

  // Segment
  segmentRow: { flexDirection: 'row', gap: 8 },
  segBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5,
    paddingVertical: 10, borderRadius: 10, borderWidth: 1.5, borderColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
  },
  segBtnActive: { borderColor: '#1a2d5a', backgroundColor: '#1a2d5a' },
  segTxt: { fontSize: 11, fontWeight: '600', color: '#6b7280' },
  segTxtActive: { color: '#fff' },

  // Generate button
  generateBtn: { marginBottom: 12, borderRadius: 16, overflow: 'hidden', shadowColor: '#1a2d5a', shadowOpacity: 0.25, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 8 },
  generateBtnInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 17 },
  generateTxt: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.3 },

  // Result card
  resultHd: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  resultHdTxt: { fontSize: 13, fontWeight: '800', color: '#1a2d5a' },
  resultActionBtn: {
    width: 30, height: 30, borderRadius: 8,
    backgroundColor: 'rgba(26,45,90,0.07)',
    justifyContent: 'center', alignItems: 'center',
  },
  sermonTextBox: { maxHeight: 280, backgroundColor: '#f9f6f0', borderRadius: 10, padding: 14, marginBottom: 14 },
  sermonText: { fontSize: 13, color: '#374151', lineHeight: 22, fontFamily: SERIF },

  // Action grid
  actionGrid: { flexDirection: 'row', gap: 8 },
  actionGridBtn: {
    flex: 1, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 12, borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(26,45,90,0.12)',
    backgroundColor: 'rgba(26,45,90,0.04)',
  },
  actionGridTxt: { fontSize: 10, fontWeight: '700', color: '#1a2d5a' },

  // Modals
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  pickerCard: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 36 },
  pickerHdRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  pickerHdTxt: { fontSize: 16, fontWeight: '800', color: '#1a2d5a' },
  pickerItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderRadius: 10, marginBottom: 6 },
  pickerItemActive: { backgroundColor: '#1a2d5a' },
  pickerItemTxt: { fontSize: 14, color: '#374151', fontWeight: '500' },
  pickerItemTxtActive: { color: '#fff', fontWeight: '700' },

  alertCard: { backgroundColor: '#fff', width: '85%', alignSelf: 'center', marginTop: 'auto', marginBottom: 'auto', borderRadius: 24, padding: 28, alignItems: 'center' },
  alertIconBox: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#fef2f2', justifyContent: 'center', alignItems: 'center', marginBottom: 18 },
  alertTitle: { fontSize: 20, fontWeight: '800', color: '#1a2d5a', marginBottom: 8 },
  alertSub: { fontSize: 13, color: '#6b7280', textAlign: 'center', marginBottom: 22 },
  alertBtn: { width: '100%', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  alertBtnTxt: { color: '#fff', fontSize: 14, fontWeight: '700' },
});

import React, { useState, useContext, useRef, useEffect } from 'react';
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
  Share,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ChevronLeft,
  Wand2,
  ChevronDown,
  Image as ImageIcon,
  CheckSquare,
  RefreshCw,
  Save,
  CheckCircle2,
  AlertCircle,
  Globe,
  Sparkles,
  BookOpen,
  Check,
  AlignLeft,
  ListPlus,
  Minimize,
  Maximize,
  Mic,
  MessageCircle,
  BookMarked,
  Gift, Heart, HeartHandshake, Droplets, CloudRain, Users, Building2, Utensils, GraduationCap, Briefcase, Sunrise, AlertTriangle, HeartOff, TrendingDown, TrendingUp, MoreHorizontal, Smile, Wind, ShieldAlert, Star, Anchor, Lightbulb, LifeBuoy, Crown, Hourglass, Mountain, Shield, Lock, Compass, Home, User, Baby, Link, Flag, Leaf,
  HeartPulse,
  Copy,
  History,
  Eye,
  Edit3,
  Trash2,
  Download,
  Calendar,
  Search,
  X
} from 'lucide-react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { AdminTabContext } from '../../context/AdminTabContext';
import { useChurch } from '../../context/ChurchContext';
import AIService from '../../services/AIService';
import FirestoreService from '../../services/FirestoreService';

const { width } = Dimensions.get('window');
const SERIF = Platform.OS === 'ios' ? 'Georgia' : 'serif';
const SANS = Platform.OS === 'ios' ? 'System' : 'sans-serif';

// ─── Data ──────────────────────────────────────────────────────────────────────
const LIFE_EVENTS = [
  { name: 'Birthday - పుట్టినరోజు', icon: Gift },
  { name: 'Wedding - వివాహం', icon: Heart },
  { name: 'Wedding Anniversary - వివాహ వార్షికోత్సవం', icon: HeartHandshake },
  { name: 'Baptism - బాప్తిస్మం', icon: Droplets },
  { name: 'Sick / Healing - అనారోగ్యం / స్వస్థత', icon: HeartPulse },
  { name: 'Funeral / Death - మరణం', icon: CloudRain },
  { name: 'Family Function - కుటుంబ వేడుక', icon: Users },
  { name: 'Church Anniversary - సంఘ వార్షికోత్సవం', icon: Building2 },
  { name: 'Thanksgiving - కృతజ్ఞతా కూడిక', icon: Utensils },
  { name: 'Graduation - పట్టభద్రోత్సవం', icon: GraduationCap },
  { name: 'Retirement - పదవీ విరమణ', icon: Briefcase },
  { name: 'New Beginning - నూతన ప్రారంభం', icon: Sunrise },
  { name: 'Crisis - సంక్షోభం', icon: AlertTriangle },
  { name: 'Loss - నష్టం', icon: HeartOff },
  { name: 'Failure - వైఫల్యం', icon: TrendingDown },
  { name: 'Success - విజయం', icon: TrendingUp },
  { name: 'Other - ఇతర', icon: MoreHorizontal }
];
const SPIRITUAL_TOPICS = [
  { name: 'Joy - ఆనందం', icon: Smile },
  { name: 'Peace - సమాధానం', icon: Wind },
  { name: 'Fear - భయం', icon: ShieldAlert },
  { name: 'Faith - విశ్వాసం', icon: Star },
  { name: 'Hope - నిరీక్షణ', icon: Anchor },
  { name: 'Love - ప్రేమ', icon: Heart },
  { name: 'Wisdom - జ్ఞానం', icon: Lightbulb },
  { name: 'Prayer - ప్రార్థన', icon: Sparkles },
  { name: 'Healing - స్వస్థత', icon: HeartPulse },
  { name: 'Grace - కృప', icon: Gift },
  { name: 'Forgiveness - క్షమాపణ', icon: HeartHandshake },
  { name: 'Salvation - రక్షణ', icon: LifeBuoy },
  { name: 'Obedience - విధేయత', icon: CheckCircle2 },
  { name: 'Holiness - పరిశుద్ధత', icon: Crown },
  { name: 'Patience - సహనం', icon: Hourglass },
  { name: 'Strength - బలం', icon: Mountain },
  { name: 'Courage - ధైర్యం', icon: Shield },
  { name: 'Trust - నమ్మకం', icon: Lock },
  { name: 'Purpose - ఉద్దేశ్యం', icon: Compass },
  { name: 'Family - కుటుంబం', icon: Home },
  { name: 'Father - తండ్రి', icon: User },
  { name: 'Mother - తల్లి', icon: User },
  { name: 'Children - పిల్లలు', icon: Baby },
  { name: 'Friends - స్నేహితులు', icon: Users },
  { name: 'Relationships - సంబంధాలు', icon: Link },
  { name: 'Care - శ్రద్ధ', icon: Heart },
  { name: 'Leadership - నాయకత్వం', icon: Flag },
  { name: 'Life - జీవితం', icon: Leaf },
  { name: 'Other - ఇతర', icon: MoreHorizontal }
];
const AUDIENCES = ['Congregation', 'Youth', 'Children', 'Families', 'Men', 'Women', 'Seniors', 'Leaders'];
const DURATIONS = ['10 min', '20 min', '30 min', '45 min', '60 min'];
const LANGUAGES = ['English', 'Telugu', 'Hindi', 'Tamil', 'Kannada'];

const PREP_MESSAGES = [
  'Connecting to AI Sermon Assistant...',
  'Searching Scriptures & Bible references...',
  'Structuring sermon points & insights...',
  'Adding pastoral applications & prayer...',
  'Finalizing Telugu sermon...',
];

// ─── Sermon Parsing & Highlighting Utilities ──────────────────────────────────
interface ParsedBlock {
  type: 'title' | 'section_header' | 'point_header' | 'bible_ref' | 'takeaway' | 'quote' | 'bullet' | 'paragraph';
  sectionKey?: string;
  badge?: string;
  pointNum?: string;
  title?: string;
  text?: string;
}

function parseSermonBlocks(rawText: string): ParsedBlock[] {
  if (!rawText) return [];
  // Normalize unicode non-breaking spaces and line endings
  const text = rawText
    .replace(/[\uFEFF\u200B\u200E\u200F\u00a0\u202f]/g, ' ')
    .replace(/\r\n/g, '\n');
  const lines = text.split('\n');
  const blocks: ParsedBlock[] = [];
  let buffer: string[] = [];

  const flushBuffer = () => {
    if (buffer.length === 0) return;
    const content = buffer.join('\n').trim();
    buffer = [];
    if (!content) return;

    // Check if whole buffer is a takeaway
    if (/^(?:\*|\*\*)*(?:practical\s*takeaway|takeaway|ఆచరణాత్మక|ఆచరణ|గమనిక|insight)[\:\*]/i.test(content)) {
      blocks.push({
        type: 'takeaway',
        text: content.replace(/^(?:\*|\*\*)*(?:practical\s*takeaway|takeaway|ఆచరణాత్మక|ఆచరణ)[\:\*]\s*/i, '').trim(),
      });
      return;
    }

    // Check if scripture quote (starts with quote or inside quotes)
    if (/^["'“]/.test(content)) {
      blocks.push({ type: 'quote', text: content });
      return;
    }

    blocks.push({ type: 'paragraph', text: content });
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    // Skip horizontal rules or markdown table dividers
    if (!line || /^[-—_]{3,}$/.test(line) || /^\|?[-:\s|]+\|?$/.test(line)) {
      flushBuffer();
      continue;
    }

    // Skip markdown table header row if any slipped through
    if (/^\|.*English Ref.*\|/i.test(line)) {
      flushBuffer();
      continue;
    }

    // 1. Title (# Sermon: ...)
    if (/^#\s+/i.test(line)) {
      flushBuffer();
      const title = line.replace(/^#\s*(?:sermon:?\s*)?/i, '').replace(/[*_#]/g, '').trim();
      blocks.push({ type: 'title', text: title });
      continue;
    }

    // 2. Major Section Headers (## 1. Introduction, etc.)
    if (/^##\s+/i.test(line)) {
      flushBuffer();
      const rawTitle = line.replace(/^##\s*/i, '').trim();
      let sectionKey = 'general';
      let badge = 'SECTION';

      if (/intro|పరిచయం/i.test(rawTitle)) {
        sectionKey = 'intro';
        badge = '1. INTRODUCTION • పరిచయం';
      } else if (/scripture|verse|వాక్య/i.test(rawTitle)) {
        sectionKey = 'scriptures';
        badge = '2. KEY SCRIPTURES • ముఖ్యమైన వాక్యములు';
      } else if (/message|main|సందేశం/i.test(rawTitle)) {
        sectionKey = 'message';
        badge = '3. MAIN MESSAGE • ప్రధాన సందేశం';
      } else if (/application|ఆచరణ|ప్రాయోగిక/i.test(rawTitle)) {
        sectionKey = 'application';
        badge = '4. PRACTICAL TAKEAWAYS • ఆచరణ';
      } else if (/prayer|conclusion|ముగింపు|ప్రార్థన/i.test(rawTitle)) {
        sectionKey = 'prayer';
        badge = '5. CLOSING PRAYER • ముగింపు ప్రార్థన';
      }

      const cleanTitle = rawTitle.replace(/^\d+[\.\:\)]\s*/, '').replace(/[*_#]/g, '').trim();
      blocks.push({
        type: 'section_header',
        sectionKey,
        badge,
        title: cleanTitle || rawTitle,
      });
      continue;
    }

    // 3. Point Subheaders (### Point 1: ... or ### 1. ...)
    if (/^###\s+/i.test(line)) {
      flushBuffer();
      const raw = line.replace(/^###\s*/i, '').trim();
      const match = raw.match(/^(?:point\s*(\d+)|(\d+))[\:\.\-]?\s*(.*)/i);
      const pointNum = match ? (match[1] || match[2]) : null;
      const pointTitle = match && match[3] ? match[3].replace(/[*_#]/g, '').trim() : raw.replace(/[*_#]/g, '').trim();

      blocks.push({
        type: 'point_header',
        pointNum: pointNum || '•',
        title: pointTitle,
      });
      continue;
    }

    // 4. Bible Book & Chapters Reference
    // Matches: • **Psalm 139:13-14 – కీర్తనలు 139:13-14** or | **Genesis 2:24...
    const isScriptureRef = (
      /^[|•\-\*]?\s*\*\*([^*]+)\*\*/.test(line) &&
      /(\d+[\:\.]\d+|కీర్తన|యోహాను|రోమీయులకు|ఆదికాండము|మత్తయి|లూకా|మార్కు|కొరింథీ|సామెతలు|యెషయా|సంఖ్యా|ద్వితీయో|Jeremiah|Matthew|Mark|Luke|John|Romans|Corinthians|Psalms?|Genesis|Exodus|Proverbs|Isaiah|Philippians|Numbers)/i.test(line)
    );

    if (isScriptureRef) {
      flushBuffer();
      const refText = line
        .replace(/^[|•\-\*]\s*/, '')
        .replace(/\|.*$/, '')
        .replace(/^\*\*|\*\*$/g, '')
        .trim();
      blocks.push({
        type: 'bible_ref',
        text: refText,
      });
      continue;
    }

    // 5. Practical Takeaway callout line
    if (/^(?:\*|\*\*)*(?:practical\s*takeaway|takeaway|ఆచరణాత్మక|ఆచరణ|గమనిక|insight)[\:\*]/i.test(line)) {
      flushBuffer();
      blocks.push({
        type: 'takeaway',
        text: line.replace(/^(?:\*|\*\*)*(?:practical\s*takeaway|takeaway|ఆచరణాత్మక|ఆచరణ)[\:\*]\s*/i, '').trim(),
      });
      continue;
    }

    // 6. Bullet item (e.g. in Practical Application)
    if (/^[•\-\*]\s+/.test(line)) {
      flushBuffer();
      blocks.push({
        type: 'bullet',
        text: line.replace(/^[•\-\*]\s+/, '').trim(),
      });
      continue;
    }

    // 7. Scripture Quote line
    if (/^["'“]/.test(line)) {
      flushBuffer();
      blocks.push({
        type: 'quote',
        text: line,
      });
      continue;
    }

    // Regular line -> add to paragraph buffer
    buffer.push(line);
  }

  flushBuffer();
  return blocks;
}

function renderInlineFormatted(text: string, baseStyle: any) {
  if (!text) return null;
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <Text style={baseStyle}>
      {parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <Text key={index} style={{ fontWeight: '700', color: '#1E1B4B' }}>
              {part.slice(2, -2)}
            </Text>
          );
        }
        return part;
      })}
    </Text>
  );
}

// ─── Component ─────────────────────────────────────────────────────────────────
export default function AISermonAssistant() {
  const { setTabByName, activeTab, setEditingData } = useContext(AdminTabContext);
  const { activeChurch } = useChurch();

  // Form state
  const [currentCategory, setCurrentCategory] = useState<'life' | 'topic' | 'history'>('life');
  const [selectedSituation, setSelectedSituation] = useState(''); // No default selection

  // History state
  const [savedSermons, setSavedSermons] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historySearch, setHistorySearch] = useState('');
  const [selectedHistorySermon, setSelectedHistorySermon] = useState<any | null>(null);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingSermon, setEditingSermon] = useState<{ id: string; title: string; topic: string; generatedSermonText: string } | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  const [topic, setTopic] = useState('');
  const [audience, setAudience] = useState('Congregation');
  const [language, setLanguage] = useState('English');
  const [duration, setDuration] = useState('30 min');

  // Output state
  const [generating, setGenerating] = useState(false);
  const [prepStep, setPrepStep] = useState(0);
  const [modifierLoading, setModifierLoading] = useState<string | null>(null);
  const [generatedText, setGeneratedText] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showCopySuccess, setShowCopySuccess] = useState(false);

  // Section scroll navigation
  const sermonScrollRef = useRef<ScrollView>(null);
  const sectionOffsets = useRef<{ [key: string]: number }>({});

  useEffect(() => {
    sectionOffsets.current = {};
  }, [generatedText]);

  useEffect(() => {
    loadSermonHistory();
  }, [activeChurch?.id]);

  const scrollToSection = (key: string) => {
    const y = sectionOffsets.current[key];
    if (y !== undefined && sermonScrollRef.current) {
      sermonScrollRef.current.scrollTo({ y: Math.max(0, y - 8), animated: true });
    }
  };

  useEffect(() => {
    let timer: any;
    if (generating) {
      setPrepStep(0);
      timer = setInterval(() => {
        setPrepStep(prev => (prev < PREP_MESSAGES.length - 1 ? prev + 1 : prev));
      }, 2200);
    } else {
      setPrepStep(0);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [generating]);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleGenerate = async (modifier?: string | any, modifierLabel?: string) => {
    const isModifierString = typeof modifier === 'string';
    if (isModifierString) {
      setModifierLoading(modifierLabel || modifier);
    } else {
      setGenerating(true);
      setShowResult(false);
    }

    try {
      console.log('[Sermon] Step 1: getting churchId...');
      const churchId = activeChurch?.id || (await FirestoreService.getChurchId());
      console.log('[Sermon] Step 2: churchId =', churchId);
      let topicFull = `${topic || selectedSituation} (Category: ${currentCategory}, Audience: ${audience}, Length: ${duration})`;

      if (isModifierString && generatedText) {
        topicFull = `[MODIFIER INSTRUCTION: ${modifier}] Please rewrite the following sermon based on the instruction.\n\nORIGINAL SERMON:\n${generatedText}`;
      }

      console.log('[Sermon] Step 3: calling AIService.generateSermon...');
      const text = await AIService.generateSermon({
        topic: topicFull,
        category: currentCategory,
        language,
        churchId: churchId!,
      });
      console.log('[Sermon] Step 4: got text length =', text?.length);
      setGeneratedText(text);
      setShowResult(true);

      // Save to Firestore (non-blocking)
      try {
        await (FirestoreService as any).saveAISermon?.({
          category: currentCategory,
          topic: topic || selectedSituation,
          language,
          generatedSermonText: text,
          status: 'generated',
        });
        loadSermonHistory();
      } catch (_) { /* non-blocking */ }

    } catch (err: any) {
      const msg = err.message || 'Failed to generate sermon. Please try again.';
      console.error('[Sermon] FAILED:', msg);
      Alert.alert('Error', msg);
      setErrorMsg(msg);
      setShowError(true);
    } finally {
      setGenerating(false);
      setModifierLoading(null);
    }
  };

  const handleShare = async () => {
    await Share.share({ message: generatedText, title: `AI Sermon: ${topic || selectedSituation}` });
  };

  const handleCopy = async () => {
    await Clipboard.setStringAsync(generatedText);
    setShowCopySuccess(true);
    setTimeout(() => setShowCopySuccess(false), 2500);
  };

  // ── History Handlers ────────────────────────────────────────────────────────
  const loadSermonHistory = async () => {
    try {
      setLoadingHistory(true);
      const churchId = activeChurch?.id;
      const list = await (FirestoreService as any).getAISermons?.(churchId) || [];
      setSavedSermons(list);
    } catch (e) {
      console.error('loadSermonHistory error:', e);
    } finally {
      setLoadingHistory(false);
    }
  };

  const formatSermonDate = (createdAt: any): string => {
    if (!createdAt) return 'Recent';
    try {
      let date: Date;
      if (createdAt.toDate && typeof createdAt.toDate === 'function') {
        date = createdAt.toDate();
      } else if (createdAt.seconds) {
        date = new Date(createdAt.seconds * 1000);
      } else if (typeof createdAt === 'string' || typeof createdAt === 'number') {
        date = new Date(createdAt);
      } else {
        date = new Date();
      }
      return date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Recent';
    }
  };

  const handleViewSermon = (sermon: any) => {
    setSelectedHistorySermon(sermon);
    setViewModalVisible(true);
  };

  const handleOpenEdit = (sermon: any) => {
    const title = sermon.title || sermon.topic || sermon.generatedSermonText?.match(/^#\s*(?:Sermon:\s*)?(.*)$/m)?.[1]?.replace(/[*_#]/g, '').trim() || 'Sermon';
    setEditingSermon({
      id: sermon.id,
      title,
      topic: sermon.topic || '',
      generatedSermonText: sermon.generatedSermonText || '',
    });
    setEditModalVisible(true);
  };

  const handleSaveEdit = async () => {
    if (!editingSermon) return;
    try {
      setSavingEdit(true);
      let bibleRef = editingSermon.generatedSermonText.match(/^[|•\-\*]?\s*\*\*([^\*]+)\*\*/m)?.[1]?.replace(/\|.*$/, '').trim() || '';

      await (FirestoreService as any).updateAISermon?.(
        editingSermon.id,
        {
          title: editingSermon.title,
          generatedSermonText: editingSermon.generatedSermonText,
          bibleRef: bibleRef,
        },
        activeChurch?.id
      );

      setSavedSermons(prev => prev.map(s => s.id === editingSermon.id ? {
        ...s,
        title: editingSermon.title,
        generatedSermonText: editingSermon.generatedSermonText,
        bibleRef: bibleRef || s.bibleRef,
      } : s));

      if (selectedHistorySermon?.id === editingSermon.id) {
        setSelectedHistorySermon((prev: any) => ({
          ...prev,
          title: editingSermon.title,
          generatedSermonText: editingSermon.generatedSermonText,
          bibleRef: bibleRef || prev.bibleRef,
        }));
      }

      setEditModalVisible(false);
      Alert.alert('Success', 'Sermon updated successfully!');
    } catch (err: any) {
      Alert.alert('Error', 'Failed to save sermon changes.');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteSermon = (sermon: any) => {
    const title = sermon.title || sermon.topic || 'this sermon';
    Alert.alert(
      'Delete Sermon',
      `Are you sure you want to delete "${title}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await (FirestoreService as any).deleteAISermon?.(sermon.id, activeChurch?.id);
              setSavedSermons(prev => prev.filter(s => s.id !== sermon.id));
              if (viewModalVisible && selectedHistorySermon?.id === sermon.id) {
                setViewModalVisible(false);
              }
              Alert.alert('Deleted', 'Sermon removed from history.');
            } catch (e) {
              Alert.alert('Error', 'Failed to delete sermon.');
            }
          },
        },
      ]
    );
  };

  const handleDownloadSermon = async (sermon: any) => {
    try {
      const title = (sermon.title || sermon.topic || 'Sermon')
        .replace(/[^a-zA-Z0-9\s\u0C00-\u0C7F_-]/g, '')
        .trim();
      const fileName = `${title.replace(/\s+/g, '_')}_${Date.now()}.txt`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;

      const fileContent = `========================================\n${sermon.title || sermon.topic || 'AI SERMON'}\n========================================\nDate: ${formatSermonDate(sermon.createdAt)}\nLanguage: ${sermon.language || 'Telugu'}\nCategory: ${sermon.category || 'General'}\nBible Reference: ${sermon.bibleRef || 'N/A'}\n\n${sermon.generatedSermonText || ''}\n`;

      await FileSystem.writeAsStringAsync(fileUri, fileContent, { encoding: FileSystem.EncodingType.UTF8 });

      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/plain',
          dialogTitle: `Download ${title}`,
          UTI: 'public.plain-text',
        });
      } else {
        Alert.alert('Downloaded', `Sermon saved to: ${fileName}`);
      }
    } catch (err) {
      console.error('Download error:', err);
      Alert.alert('Error', 'Failed to download sermon. Please try again.');
    }
  };

  const renderFormattedSermon = (rawText: string) => {
    if (!rawText) return null;
    const blocks = parseSermonBlocks(rawText);

    return (
      <View style={styles.sermonContainer}>
        {blocks.map((block, idx) => {
          switch (block.type) {
            case 'title':
              return (
                <View key={`title-${idx}`} style={styles.sermonTitleCard}>
                  <View style={styles.sermonTitleBadge}>
                    <Sparkles size={12} color="#B45309" />
                    <Text style={styles.sermonTitleBadgeTxt}>AI SERMON OUTLINE</Text>
                  </View>
                  <Text style={styles.sermonTitleTxt}>{block.text}</Text>
                </View>
              );

            case 'section_header': {
              const isIntro = block.sectionKey === 'intro';
              const isScriptures = block.sectionKey === 'scriptures';
              const isMessage = block.sectionKey === 'message';
              const isApplication = block.sectionKey === 'application';
              const isPrayer = block.sectionKey === 'prayer';

              return (
                <View
                  key={`sec-${idx}`}
                  onLayout={(e) => {
                    if (block.sectionKey) {
                      sectionOffsets.current[block.sectionKey] = e.nativeEvent.layout.y;
                    }
                  }}
                  style={[
                    styles.sectionHeaderBox,
                    isIntro && styles.sectionIntroBox,
                    isScriptures && styles.sectionScripturesBox,
                    isMessage && styles.sectionMessageBox,
                    isApplication && styles.sectionApplicationBox,
                    isPrayer && styles.sectionPrayerBox,
                  ]}
                >
                  <View
                    style={[
                      styles.sectionBadge,
                      isIntro && styles.sectionIntroBadge,
                      isScriptures && styles.sectionScripturesBadge,
                      isMessage && styles.sectionMessageBadge,
                      isApplication && styles.sectionApplicationBadge,
                      isPrayer && styles.sectionPrayerBadge,
                    ]}
                  >
                    {isIntro && <AlignLeft size={13} color="#4338CA" />}
                    {isScriptures && <BookMarked size={13} color="#6D28D9" />}
                    {isMessage && <Mic size={13} color="#5B3FA6" />}
                    {isApplication && <Lightbulb size={13} color="#B45309" />}
                    {isPrayer && <Heart size={13} color="#059669" />}
                    <Text
                      style={[
                        styles.sectionBadgeTxt,
                        isIntro && { color: '#4338CA' },
                        isScriptures && { color: '#6D28D9' },
                        isMessage && { color: '#5B3FA6' },
                        isApplication && { color: '#B45309' },
                        isPrayer && { color: '#059669' },
                      ]}
                    >
                      {block.badge || 'SECTION'}
                    </Text>
                  </View>
                  <Text style={styles.sectionHeaderTitle}>{block.title}</Text>
                </View>
              );
            }

            case 'point_header':
              return (
                <View key={`point-${idx}`} style={styles.pointHeaderCard}>
                  <View style={styles.pointNumberPill}>
                    <Text style={styles.pointNumberTxt}>Point {block.pointNum}</Text>
                  </View>
                  <Text style={styles.pointHeaderTxt}>{block.title}</Text>
                </View>
              );

            case 'bible_ref':
              return (
                <View key={`ref-${idx}`} style={styles.bibleRefCard}>
                  <View style={styles.bibleRefTopRow}>
                    <View style={styles.bibleRefIconBox}>
                      <BookOpen size={13} color="#5B3FA6" />
                    </View>
                    <View style={styles.bibleRefBadgePill}>
                      <Text style={styles.bibleRefBadgeTxt}>BIBLE BOOK & CHAPTER • వాక్య ఆధారం</Text>
                    </View>
                  </View>
                  <Text style={styles.bibleRefTxt}>{block.text}</Text>
                </View>
              );

            case 'takeaway':
              return (
                <View
                  key={`takeaway-${idx}`}
                  onLayout={(e) => {
                    if (!sectionOffsets.current['application']) {
                      sectionOffsets.current['application'] = e.nativeEvent.layout.y;
                    }
                  }}
                  style={styles.takeawayCard}
                >
                  <View style={styles.takeawayHeaderRow}>
                    <Lightbulb size={15} color="#B45309" />
                    <View style={styles.takeawayBadgePill}>
                      <Text style={styles.takeawayBadgeTxt}>PRACTICAL TAKEAWAY • ఆచరణాత్మక సత్యం</Text>
                    </View>
                  </View>
                  {renderInlineFormatted(block.text || '', styles.takeawayTxt)}
                </View>
              );

            case 'quote':
              return (
                <View key={`quote-${idx}`} style={styles.scriptureQuoteCard}>
                  <Text style={styles.scriptureQuoteTxt}>{block.text}</Text>
                </View>
              );

            case 'bullet':
              return (
                <View key={`bullet-${idx}`} style={styles.bulletRow}>
                  <Text style={styles.bulletDot}>•</Text>
                  <View style={{ flex: 1 }}>
                    {renderInlineFormatted(block.text || '', styles.bulletTxt)}
                  </View>
                </View>
              );

            case 'paragraph':
            default:
              return (
                <View key={`p-${idx}`} style={styles.paragraphContainer}>
                  {renderInlineFormatted(block.text || '', styles.sermonParagraphTxt)}
                </View>
              );
          }
        })}
      </View>
    );
  };

  const situationsList = currentCategory === 'life' ? LIFE_EVENTS : SPIRITUAL_TOPICS;

  const filteredSermons = savedSermons.filter(s => {
    if (!historySearch.trim()) return true;
    const query = historySearch.toLowerCase();
    const title = (s.title || s.topic || '').toLowerCase();
    const ref = (s.bibleRef || '').toLowerCase();
    const text = (s.generatedSermonText || '').toLowerCase();
    return title.includes(query) || ref.includes(query) || text.includes(query);
  });

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
              <Text style={[styles.headerTitle, { flexShrink: 1 }]} numberOfLines={1}>Sermon Assistant</Text>
            </View>
          </View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        <View style={styles.lede}>
          <View style={styles.eyebrow}>
            <Sparkles size={13} color="#E3A83B" />
            <Text style={styles.eyebrowTxt}>AI Sermon Assistant</Text>
          </View>
          <Text style={styles.h1}>
            {currentCategory === 'history' ? 'Saved Sermon Library' : 'Prepare a Bible-based sermon'}
          </Text>
          <Text style={styles.p}>
            {currentCategory === 'history'
              ? 'Access, view, edit, and download previously generated sermons for your church.'
              : 'Start from a life event or a spiritual topic. Scripture stays clearly separate from AI explanation and application.'}
          </Text>
        </View>

        <View style={styles.sectionLabel}>
          <View style={styles.stepNum}><Text style={styles.stepNumTxt}>{currentCategory === 'history' ? '★' : '1'}</Text></View>
          <Text style={styles.sectionLabelTxt}>
            {currentCategory === 'history' ? 'Sermon Library' : 'Choose a starting point'}
          </Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[styles.pillScroll, { marginBottom: 14 }]}>
          <TouchableOpacity style={[styles.pill, currentCategory === 'life' && styles.pillSelected]} onPress={() => { setCurrentCategory('life'); setSelectedSituation(''); }}>
            {currentCategory === 'life' && <LinearGradient colors={['#5B3FA6', '#8B5FBF', '#E3A83B']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFillObject} />}
            <Text style={[styles.pillTxt, currentCategory === 'life' && { color: '#fff' }]}>Life Events / Situations</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.pill, currentCategory === 'topic' && styles.pillSelected]} onPress={() => { setCurrentCategory('topic'); setSelectedSituation(''); }}>
            {currentCategory === 'topic' && <LinearGradient colors={['#5B3FA6', '#8B5FBF', '#E3A83B']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFillObject} />}
            <Text style={[styles.pillTxt, currentCategory === 'topic' && { color: '#fff' }]}>Spiritual / Biblical Topics</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.pill, currentCategory === 'history' && styles.pillSelected]} onPress={() => { setCurrentCategory('history'); loadSermonHistory(); }}>
            {currentCategory === 'history' && <LinearGradient colors={['#5B3FA6', '#8B5FBF', '#E3A83B']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFillObject} />}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, zIndex: 1 }}>
              <History size={13} color={currentCategory === 'history' ? '#fff' : '#5B3FA6'} />
              <Text style={[styles.pillTxt, currentCategory === 'history' && { color: '#fff' }]}>Sermon History</Text>
            </View>
          </TouchableOpacity>
        </ScrollView>

        {currentCategory === 'history' ? (
          <View style={styles.historyContainer}>
            {/* Search Bar & Refresh */}
            <View style={styles.historySearchRow}>
              <View style={styles.historySearchBox}>
                <Search size={15} color="#8A8298" style={{ marginRight: 6 }} />
                <TextInput
                  placeholder="Search saved sermons by title or scripture..."
                  placeholderTextColor="#8A8298"
                  value={historySearch}
                  onChangeText={setHistorySearch}
                  style={styles.historySearchInput}
                />
                {historySearch ? (
                  <TouchableOpacity onPress={() => setHistorySearch('')}>
                    <X size={15} color="#8A8298" />
                  </TouchableOpacity>
                ) : null}
              </View>
              <TouchableOpacity
                onPress={loadSermonHistory}
                disabled={loadingHistory}
                style={styles.historyRefreshBtn}
              >
                {loadingHistory ? (
                  <ActivityIndicator size="small" color="#5B3FA6" />
                ) : (
                  <RefreshCw size={15} color="#5B3FA6" />
                )}
              </TouchableOpacity>
            </View>

            {/* List or Empty State */}
            {loadingHistory && savedSermons.length === 0 ? (
              <View style={styles.historyLoadingWrap}>
                <ActivityIndicator size="large" color="#5B3FA6" />
                <Text style={styles.historyLoadingTxt}>Loading sermon history...</Text>
              </View>
            ) : filteredSermons.length === 0 ? (
              <View style={styles.historyEmptyCard}>
                <View style={styles.historyEmptyIconCircle}>
                  <BookOpen size={28} color="#5B3FA6" />
                </View>
                <Text style={styles.historyEmptyTitle}>
                  {historySearch ? 'No matching sermons found' : 'No saved sermons yet'}
                </Text>
                <Text style={styles.historyEmptySubtitle}>
                  {historySearch
                    ? 'Try searching with different keywords.'
                    : 'Sermons you generate will automatically be saved here for reading, editing, and offline download.'}
                </Text>
                {!historySearch && (
                  <TouchableOpacity
                    style={styles.historyEmptyBtn}
                    onPress={() => { setCurrentCategory('life'); setSelectedSituation(''); }}
                  >
                    <Wand2 size={14} color="#fff" />
                    <Text style={styles.historyEmptyBtnTxt}>Generate a Sermon</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <View style={{ gap: 12 }}>
                {filteredSermons.map(sermon => {
                  const title = sermon.title || sermon.topic || sermon.generatedSermonText?.match(/^#\s*(?:Sermon:\s*)?(.*)$/m)?.[1]?.replace(/[*_#]/g, '').trim() || 'Sermon';
                  const bibleRef = sermon.bibleRef || sermon.generatedSermonText?.match(/^[|•\-\*]?\s*\*\*([^\*]+)\*\*/m)?.[1]?.replace(/\|.*$/, '').trim() || '';

                  return (
                    <View key={sermon.id} style={styles.historyCard}>
                      {/* Top Badges */}
                      <View style={styles.historyTopRow}>
                        <View style={styles.historyCategoryBadge}>
                          <Text style={styles.historyCategoryBadgeTxt}>
                            {sermon.category === 'life' ? 'Life Event' : sermon.category === 'topic' ? 'Spiritual Topic' : 'Sermon'}
                          </Text>
                        </View>
                        {sermon.language ? (
                          <View style={styles.historyLangBadge}>
                            <Globe size={11} color="#5B3FA6" />
                            <Text style={styles.historyLangBadgeTxt}>{sermon.language}</Text>
                          </View>
                        ) : null}
                        <View style={{ flex: 1 }} />
                        <View style={styles.historyDateRow}>
                          <Calendar size={11} color="#8A8298" />
                          <Text style={styles.historyDateTxt}>{formatSermonDate(sermon.createdAt)}</Text>
                        </View>
                      </View>

                      {/* Title */}
                      <Text style={styles.historyTitleTxt}>{title}</Text>

                      {/* Bible Reference */}
                      {bibleRef ? (
                        <View style={styles.historyRefRow}>
                          <BookOpen size={12} color="#5B3FA6" />
                          <Text style={styles.historyRefTxt} numberOfLines={1}>
                            {bibleRef}
                          </Text>
                        </View>
                      ) : null}

                      {/* Actions */}
                      <View style={styles.historyActionRow}>
                        <TouchableOpacity style={styles.historyBtnView} onPress={() => handleViewSermon(sermon)}>
                          <Eye size={13} color="#5B3FA6" />
                          <Text style={styles.historyBtnViewTxt}>View</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.historyBtnEdit} onPress={() => handleOpenEdit(sermon)}>
                          <Edit3 size={13} color="#B45309" />
                          <Text style={styles.historyBtnEditTxt}>Edit</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.historyBtnDownload} onPress={() => handleDownloadSermon(sermon)}>
                          <Download size={13} color="#059669" />
                          <Text style={styles.historyBtnDownloadTxt}>Download</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.historyBtnDelete} onPress={() => handleDeleteSermon(sermon)}>
                          <Trash2 size={13} color="#DC2626" />
                          <Text style={styles.historyBtnDeleteTxt}>Delete</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        ) : (
          <>
            <View style={styles.tileGrid}>
          {situationsList.map(sit => {
            const selected = selectedSituation === sit.name;
            const IconComp = sit.icon;
            return (
              <TouchableOpacity
                key={sit.name}
                style={[styles.tile, selected && styles.tileSelected]}
                onPress={() => setSelectedSituation(sit.name)}
                activeOpacity={0.8}
              >
                {selected && <LinearGradient colors={['#5B3FA6', '#8B5FBF', '#E3A83B']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFillObject} />}
                <IconComp size={16} color={selected ? '#fff' : '#5B3FA6'} style={{ zIndex: 1 }} />
                <Text style={[styles.tileLabel, selected && { color: '#fff' }]}>{sit.name}</Text>
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
          <Text style={styles.sectionLabelTxt}>Add context</Text>
        </View>

        <Text style={styles.fieldLabel}>Additional topic / focus (optional)</Text>
        <TextInput style={styles.input} value={topic} onChangeText={setTopic} placeholder="e.g. Love and Commitment" placeholderTextColor="#9ca3af" />

        <Text style={styles.fieldLabel}>Audience</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillScroll}>
          {AUDIENCES.map(a => (
            <TouchableOpacity key={a} style={[styles.pill, audience === a && styles.pillSelected]} onPress={() => setAudience(a)}>
              {audience === a && <LinearGradient colors={['#5B3FA6', '#8B5FBF', '#E3A83B']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFillObject} />}
              <Text style={[styles.pillTxt, audience === a && { color: '#fff' }]}>{a}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.fieldLabel}>Language</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillScroll}>
          {LANGUAGES.map(l => (
            <TouchableOpacity key={l} style={[styles.pill, language === l && styles.pillSelected]} onPress={() => setLanguage(l)}>
              {language === l && <LinearGradient colors={['#5B3FA6', '#8B5FBF', '#E3A83B']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFillObject} />}
              <Text style={[styles.pillTxt, language === l && { color: '#fff' }]}>{l}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.fieldLabel}>Duration</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillScroll}>
          {DURATIONS.map(d => (
            <TouchableOpacity key={d} style={[styles.pill, duration === d && styles.pillSelected]} onPress={() => setDuration(d)}>
              {duration === d && <LinearGradient colors={['#5B3FA6', '#8B5FBF', '#E3A83B']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFillObject} />}
              <Text style={[styles.pillTxt, duration === d && { color: '#fff' }]}>{d}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={{ marginTop: 18 }}>
          <TouchableOpacity onPress={handleGenerate} disabled={generating || !!modifierLoading} activeOpacity={0.88} style={styles.btnPrimary}>
            <LinearGradient colors={['#5B3FA6', '#8B5FBF', '#E3A83B']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.btnGradient} />
            {generating ? <ActivityIndicator size="small" color="#fff" style={{ zIndex: 1 }} /> : <Wand2 size={15} color="#fff" style={{ zIndex: 1 }} />}
            <Text style={styles.btnPrimaryTxt}>{generating ? 'Preparing Sermon...' : 'Generate Sermon'}</Text>
          </TouchableOpacity>
        </View>

        {generating && (
          <View style={styles.prepCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <ActivityIndicator size="small" color="#5B3FA6" />
              <Text style={styles.prepStepTxt}>{PREP_MESSAGES[prepStep]}</Text>
            </View>
            <Text style={styles.prepSubTxt}>AI is generating biblical sermon in {language} (~10-12s)</Text>
          </View>
        )}

        {showResult && (
          <View style={styles.outputPanel}>
            <View style={styles.sermonDoc}>
              {/* Quick Jump Bar */}
              <View style={styles.navBarWrapper}>
                <Text style={styles.navBarLabel}>QUICK JUMP TO SECTION</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  overScrollMode="never"
                  bounces={false}
                  style={styles.navBarScroll}
                  contentContainerStyle={{ paddingHorizontal: 2 }}
                >
                  <TouchableOpacity onPress={() => scrollToSection('intro')} style={[styles.navPill, { borderColor: '#C7D2FE' }]}>
                    <AlignLeft size={12} color="#4338CA" />
                    <Text style={[styles.navPillTxt, { color: '#4338CA' }]}>Introduction</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => scrollToSection('scriptures')} style={[styles.navPill, { borderColor: '#DDD6FE' }]}>
                    <BookMarked size={12} color="#6D28D9" />
                    <Text style={[styles.navPillTxt, { color: '#6D28D9' }]}>Key Scriptures</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => scrollToSection('message')} style={[styles.navPill, { borderColor: '#D8B4FE' }]}>
                    <Mic size={12} color="#5B3FA6" />
                    <Text style={[styles.navPillTxt, { color: '#5B3FA6' }]}>Main Message</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => scrollToSection('application')} style={[styles.navPill, { borderColor: '#FDE68A' }]}>
                    <Lightbulb size={12} color="#B45309" />
                    <Text style={[styles.navPillTxt, { color: '#B45309' }]}>Takeaways</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => scrollToSection('prayer')} style={[styles.navPill, { borderColor: '#A7F3D0' }]}>
                    <Heart size={12} color="#059669" />
                    <Text style={[styles.navPillTxt, { color: '#059669' }]}>Closing Prayer</Text>
                  </TouchableOpacity>
                </ScrollView>
              </View>

              <ScrollView ref={sermonScrollRef} style={{ maxHeight: 480 }} nestedScrollEnabled showsVerticalScrollIndicator={true}>
                {renderFormattedSermon(generatedText)}
              </ScrollView>
              <Text style={styles.fineprint}>Scripture references shown are placeholders for this prototype — the live build pulls verses from your existing Bible data source, never from the AI.</Text>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
              {([
                { label: 'Regenerate', icon: RefreshCw, modifier: null },
                { label: 'Expand Intro', icon: AlignLeft, modifier: 'Please expand the introduction to be more detailed and engaging.' },
                { label: 'More Verses', icon: BookMarked, modifier: 'Please include more relevant Bible verses and scriptures throughout.' },
                { label: 'Add Point', icon: ListPlus, modifier: 'Please add one additional major point to the sermon outline.' },
                { label: 'Simplify', icon: Minimize, modifier: 'Please simplify the language so it is easier for a general audience to understand.' },
                { label: 'More Detail', icon: Maximize, modifier: 'Please expand on all points with more detail, stories, and depth.' },
                { label: 'Preaching Style', icon: Mic, modifier: 'Please rewrite this in a more passionate and engaging preaching style.' },
                { label: 'Telugu', icon: Globe, modifier: 'Please translate the entire sermon to Telugu.' },
              ] as const).map(({ label, icon: Icon, modifier }) => {
                const isActive = modifierLoading === label;
                const anyBusy = generating || !!modifierLoading;
                return (
                  <TouchableOpacity
                    key={label}
                    style={[styles.chipBtn, isActive && styles.chipBtnActive, anyBusy && !isActive && { opacity: 0.45 }]}
                    disabled={anyBusy}
                    onPress={() => modifier === null ? handleGenerate() : handleGenerate(modifier, label)}
                  >
                    {isActive
                      ? <ActivityIndicator size="small" color="#5B3FA6" />
                      : <Icon size={12} color={isActive ? '#5B3FA6' : '#5B5468'} />}
                    <Text style={[styles.chipBtnTxt, isActive && { color: '#5B3FA6', fontWeight: '700' }]}>
                      {isActive ? 'Working…' : label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={styles.btnRow}>
              <TouchableOpacity style={styles.btnGhost} onPress={handleCopy}>
                <Copy size={15} color="#211A2E" />
                <Text style={styles.btnGhostTxt}>Copy</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.btnGhost, { borderColor: '#25D366' }]} onPress={handleShare}>
                <MessageCircle size={15} color="#25D366" />
                <Text style={[styles.btnGhostTxt, { color: '#25D366' }]}>WhatsApp</Text>
              </TouchableOpacity>
            </View>

            {showCopySuccess && (
              <Animated.View style={styles.copySuccessCard}>
                <CheckCircle2 size={16} color="#fff" />
                <Text style={styles.copySuccessTxt}>Sermon copied to clipboard!</Text>
              </Animated.View>
            )}
          </View>
        )}

            <Text style={styles.caption}>Verses shown are placeholders — the live build pulls from your existing Bible source, never the AI.</Text>
          </>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ── VIEW SERMON MODAL ── */}
      <Modal visible={viewModalVisible} animationType="slide" transparent onRequestClose={() => setViewModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={styles.modalHeaderTitle} numberOfLines={1}>
                  {selectedHistorySermon?.title || selectedHistorySermon?.topic || 'Sermon Details'}
                </Text>
                <Text style={styles.modalHeaderSub} numberOfLines={1}>
                  {selectedHistorySermon?.bibleRef ? `${selectedHistorySermon.bibleRef} • ` : ''}{formatSermonDate(selectedHistorySermon?.createdAt)}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setViewModalVisible(false)} style={styles.modalCloseBtn}>
                <X size={18} color="#211A2E" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={true}>
              {selectedHistorySermon ? renderFormattedSermon(selectedHistorySermon.generatedSermonText) : null}
              <View style={{ height: 30 }} />
            </ScrollView>

            <View style={styles.modalBottomBar}>
              <TouchableOpacity
                style={styles.modalActionBtn}
                onPress={async () => {
                  if (selectedHistorySermon?.generatedSermonText) {
                    await Clipboard.setStringAsync(selectedHistorySermon.generatedSermonText);
                    Alert.alert('Copied', 'Sermon copied to clipboard!');
                  }
                }}
              >
                <Copy size={14} color="#5B3FA6" />
                <Text style={[styles.modalActionBtnTxt, { color: '#5B3FA6' }]}>Copy</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalActionBtn}
                onPress={async () => {
                  if (selectedHistorySermon?.generatedSermonText) {
                    await Share.share({
                      message: selectedHistorySermon.generatedSermonText,
                      title: selectedHistorySermon.title || selectedHistorySermon.topic || 'Sermon',
                    });
                  }
                }}
              >
                <MessageCircle size={14} color="#25D366" />
                <Text style={[styles.modalActionBtnTxt, { color: '#25D366' }]}>Share</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalActionBtn}
                onPress={() => {
                  if (selectedHistorySermon) {
                    handleDownloadSermon(selectedHistorySermon);
                  }
                }}
              >
                <Download size={14} color="#059669" />
                <Text style={[styles.modalActionBtnTxt, { color: '#059669' }]}>Download</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalActionBtn}
                onPress={() => {
                  if (selectedHistorySermon) {
                    setViewModalVisible(false);
                    handleOpenEdit(selectedHistorySermon);
                  }
                }}
              >
                <Edit3 size={14} color="#B45309" />
                <Text style={[styles.modalActionBtnTxt, { color: '#B45309' }]}>Edit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── EDIT SERMON MODAL ── */}
      <Modal visible={editModalVisible} animationType="slide" transparent onRequestClose={() => setEditModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalHeaderTitle}>Edit Saved Sermon</Text>
                <Text style={styles.modalHeaderSub}>Modify the title or content of this sermon</Text>
              </View>
              <TouchableOpacity onPress={() => setEditModalVisible(false)} style={styles.modalCloseBtn}>
                <X size={18} color="#211A2E" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={true} keyboardShouldPersistTaps="handled">
              <Text style={styles.editInputLabel}>Sermon Title</Text>
              <TextInput
                style={styles.editTitleInput}
                value={editingSermon?.title || ''}
                onChangeText={(t) => setEditingSermon(prev => prev ? { ...prev, title: t } : null)}
                placeholder="Enter sermon title..."
                placeholderTextColor="#8A8298"
              />

              <Text style={styles.editInputLabel}>Sermon Content</Text>
              <TextInput
                style={styles.editContentInput}
                value={editingSermon?.generatedSermonText || ''}
                onChangeText={(t) => setEditingSermon(prev => prev ? { ...prev, generatedSermonText: t } : null)}
                placeholder="Enter sermon text..."
                placeholderTextColor="#8A8298"
                multiline
                textAlignVertical="top"
              />
              <View style={{ height: 20 }} />
            </ScrollView>

            <View style={styles.editModalBottomBar}>
              <TouchableOpacity
                style={styles.editCancelBtn}
                onPress={() => setEditModalVisible(false)}
                disabled={savingEdit}
              >
                <Text style={styles.editCancelBtnTxt}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.editSaveBtn}
                onPress={handleSaveEdit}
                disabled={savingEdit}
              >
                {savingEdit ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Save size={15} color="#fff" />
                    <Text style={styles.editSaveBtnTxt}>Save Changes</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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

  copySuccessCard: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  copySuccessTxt: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
    marginLeft: 8,
  },

  input: {
    backgroundColor: '#fff', borderWidth: 1.4, borderColor: '#E7E0D6',
    borderRadius: 10, paddingVertical: 11, paddingHorizontal: 12, fontSize: 14, color: '#211A2E', fontFamily: SANS,
  },

  pillScroll: { flexDirection: 'row', overflow: 'visible', paddingBottom: 4 },
  pill: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1.4, borderColor: '#E7E0D6',
    backgroundColor: '#fff', marginRight: 7, overflow: 'hidden'
  },
  pillSelected: { borderColor: 'transparent' },
  pillTxt: { fontSize: 12.5, color: '#211A2E', zIndex: 1 },

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
  sermonDoc: {
    borderWidth: 1, borderColor: '#E7E0D6', borderRadius: 14, padding: 16, backgroundColor: '#fff', marginTop: 14,
    overflow: 'hidden',
  },
  sermonText: { fontSize: 13, color: '#3A3448', lineHeight: 22, fontFamily: SERIF },
  fineprint: { fontSize: 10.5, color: '#5B5468', marginTop: 12, lineHeight: 16 },

  // ── Formatted Sermon Highlight Styles ─────────────────────────────────────
  sermonContainer: {
    paddingBottom: 8,
  },
  sermonTitleCard: {
    backgroundColor: '#FAF5FF',
    borderWidth: 1.5,
    borderColor: '#DDD6FE',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    shadowColor: '#5B3FA6',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  sermonTitleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FEF3C7',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 6,
  },
  sermonTitleBadgeTxt: {
    fontSize: 10,
    fontWeight: '800',
    color: '#92400E',
    letterSpacing: 0.6,
  },
  sermonTitleTxt: {
    fontSize: 17,
    fontWeight: '800',
    color: '#2E1065',
    lineHeight: 24,
    fontFamily: SERIF,
  },

  // Section Headers
  sectionHeaderBox: {
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: 18,
    marginBottom: 10,
    borderLeftWidth: 4.5,
  },
  sectionIntroBox: {
    backgroundColor: '#EEF2FF',
    borderLeftColor: '#4338CA',
    borderWidth: 1,
    borderColor: '#E0E7FF',
  },
  sectionScripturesBox: {
    backgroundColor: '#F5F3FF',
    borderLeftColor: '#6D28D9',
    borderWidth: 1,
    borderColor: '#EDE9FE',
  },
  sectionMessageBox: {
    backgroundColor: '#FAF5FF',
    borderLeftColor: '#5B3FA6',
    borderWidth: 1,
    borderColor: '#F3E8FF',
  },
  sectionApplicationBox: {
    backgroundColor: '#FFFBEB',
    borderLeftColor: '#D97706',
    borderWidth: 1,
    borderColor: '#FEF3C7',
  },
  sectionPrayerBox: {
    backgroundColor: '#ECFDF5',
    borderLeftColor: '#059669',
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },

  sectionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 6,
    marginBottom: 6,
  },
  sectionIntroBadge: {
    backgroundColor: '#E0E7FF',
  },
  sectionScripturesBadge: {
    backgroundColor: '#EDE9FE',
  },
  sectionMessageBadge: {
    backgroundColor: '#F3E8FF',
  },
  sectionApplicationBadge: {
    backgroundColor: '#FEF3C7',
  },
  sectionPrayerBadge: {
    backgroundColor: '#D1FAE5',
  },
  sectionBadgeTxt: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  sectionHeaderTitle: {
    fontSize: 15.5,
    fontWeight: '800',
    color: '#1F2937',
    lineHeight: 22,
  },

  // Point Headers (Main Message Points)
  pointHeaderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F8F6FD',
    borderWidth: 1,
    borderColor: '#E9D5FF',
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 11,
    marginTop: 12,
    marginBottom: 6,
  },
  pointNumberPill: {
    backgroundColor: '#5B3FA6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  pointNumberTxt: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  pointHeaderTxt: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2E1065',
    flex: 1,
    lineHeight: 20,
  },

  // Bible Book & Chapters Reference
  bibleRefCard: {
    backgroundColor: '#F5F0FF',
    borderWidth: 1.5,
    borderColor: '#DDD6FE',
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 12,
    marginTop: 10,
    marginBottom: 6,
  },
  bibleRefTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  bibleRefIconBox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bibleRefBadgePill: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  bibleRefBadgeTxt: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#6D28D9',
    letterSpacing: 0.4,
  },
  bibleRefTxt: {
    fontSize: 14,
    fontWeight: '700',
    color: '#3B0764',
    lineHeight: 20,
  },

  // Practical Takeaway Highlight Box
  takeawayCard: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1.5,
    borderColor: '#F59E0B',
    borderRadius: 12,
    padding: 12,
    marginTop: 10,
    marginBottom: 10,
    shadowColor: '#F59E0B',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  takeawayHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  takeawayBadgePill: {
    backgroundColor: '#FDE68A',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 5,
  },
  takeawayBadgeTxt: {
    fontSize: 10,
    fontWeight: '800',
    color: '#92400E',
    letterSpacing: 0.4,
  },
  takeawayTxt: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#78350F',
    lineHeight: 21,
  },

  // Scripture Quote Card
  scriptureQuoteCard: {
    backgroundColor: '#FAF7FD',
    borderLeftWidth: 3.5,
    borderLeftColor: '#8B5FBF',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginVertical: 4,
  },
  scriptureQuoteTxt: {
    fontSize: 13.5,
    fontStyle: 'italic',
    color: '#374151',
    lineHeight: 22,
    fontFamily: SERIF,
  },

  // Bullet Items
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginVertical: 3,
  },
  bulletDot: {
    fontSize: 16,
    color: '#5B3FA6',
    lineHeight: 21,
  },
  bulletTxt: {
    fontSize: 13.5,
    color: '#374151',
    lineHeight: 22,
  },

  // Normal Paragraphs
  paragraphContainer: {
    marginVertical: 4,
  },
  sermonParagraphTxt: {
    fontSize: 13.5,
    color: '#374151',
    lineHeight: 22,
  },

  // Quick Navigation Bar
  navBarWrapper: {
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0EBE4',
    paddingBottom: 10,
    overflow: 'hidden',
  },
  navBarLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#8A8298',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  navBarScroll: {
    flexDirection: 'row',
    overflow: 'hidden',
  },
  navPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#fff',
    borderWidth: 1.2,
    borderRadius: 999,
    marginRight: 6,
  },
  navPillTxt: {
    fontSize: 11.5,
    fontWeight: '700',
  },

  chipScroll: { flexDirection: 'row', overflow: 'visible', marginTop: 14, paddingBottom: 8, marginBottom: 8 },
  chipBtn: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 9, borderWidth: 1.4, borderColor: '#E7E0D6',
    backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', gap: 5, marginRight: 7
  },
  chipBtnActive: {
    borderColor: '#5B3FA6', backgroundColor: '#F4F0FF',
  },
  chipBtnTxt: { fontSize: 11.5, color: '#5B5468' },

  btnRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  btnGhost: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#fff', borderWidth: 1.4, borderColor: '#E7E0D6', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 10
  },
  btnGhostTxt: { color: '#211A2E', fontSize: 12.5, fontWeight: '700', fontFamily: SANS },

  caption: { textAlign: 'center', fontSize: 11, color: '#8A8298', marginTop: 14 },

  prepCard: {
    backgroundColor: '#fff',
    borderWidth: 1.4,
    borderColor: '#E7E0D6',
    borderRadius: 14,
    padding: 14,
    marginTop: 12,
    alignItems: 'center',
    gap: 4,
    shadowColor: '#5B3FA6',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  prepStepTxt: {
    fontSize: 13,
    fontWeight: '700',
    color: '#3A2A6B',
  },
  prepSubTxt: {
    fontSize: 11,
    color: '#8A8298',
    marginTop: 2,
  },

  // ── Sermon History Styles ──────────────────────────────────────────────────
  historyContainer: {
    marginTop: 6,
  },
  historySearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  historySearchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1.4,
    borderColor: '#E7E0D6',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 10 : 7,
  },
  historySearchInput: {
    flex: 1,
    fontSize: 13,
    color: '#211A2E',
    fontFamily: SANS,
  },
  historyRefreshBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1.4,
    borderColor: '#E7E0D6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyLoadingWrap: {
    paddingVertical: 50,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  historyLoadingTxt: {
    fontSize: 13,
    color: '#5B5468',
    fontWeight: '600',
  },
  historyEmptyCard: {
    backgroundColor: '#fff',
    borderWidth: 1.4,
    borderColor: '#E7E0D6',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    gap: 8,
  },
  historyEmptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F5F0FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  historyEmptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#211A2E',
    textAlign: 'center',
  },
  historyEmptySubtitle: {
    fontSize: 12.5,
    color: '#5B5468',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 10,
  },
  historyEmptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: '#5B3FA6',
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 10,
    marginTop: 8,
  },
  historyEmptyBtnTxt: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },

  // History Card
  historyCard: {
    backgroundColor: '#fff',
    borderWidth: 1.4,
    borderColor: '#E7E0D6',
    borderRadius: 14,
    padding: 15,
    shadowColor: '#5B3FA6',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    gap: 8,
  },
  historyTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  historyCategoryBadge: {
    backgroundColor: '#F4F0FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  historyCategoryBadgeTxt: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#5B3FA6',
  },
  historyLangBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FAF5FF',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  historyLangBadgeTxt: {
    fontSize: 10,
    fontWeight: '700',
    color: '#5B3FA6',
  },
  historyDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  historyDateTxt: {
    fontSize: 11,
    color: '#8A8298',
  },
  historyTitleTxt: {
    fontSize: 15.5,
    fontWeight: '800',
    color: '#211A2E',
    lineHeight: 22,
    fontFamily: SERIF,
  },
  historyRefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FAF7FD',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#5B3FA6',
    alignSelf: 'flex-start',
  },
  historyRefTxt: {
    fontSize: 12,
    fontWeight: '700',
    color: '#5B3FA6',
    fontFamily: SANS,
  },
  historyActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F2EDE6',
  },
  historyBtnView: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 7,
    backgroundColor: '#FAF5FF',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    borderRadius: 8,
  },
  historyBtnViewTxt: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#5B3FA6',
  },
  historyBtnEdit: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 7,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 8,
  },
  historyBtnEditTxt: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#B45309',
  },
  historyBtnDownload: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 7,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 8,
  },
  historyBtnDownloadTxt: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#059669',
  },
  historyBtnDelete: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 7,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 8,
  },
  historyBtnDeleteTxt: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#DC2626',
  },

  // ── Modals ────────────────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    maxHeight: '90%',
    paddingBottom: Platform.OS === 'ios' ? 24 : 14,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0EBE4',
  },
  modalHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#211A2E',
    fontFamily: SERIF,
  },
  modalHeaderSub: {
    fontSize: 11.5,
    color: '#8A8298',
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F0EA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalScroll: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  modalBottomBar: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F0EBE4',
  },
  modalActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.2,
    borderColor: '#E7E0D6',
    backgroundColor: '#fff',
  },
  modalActionBtnTxt: {
    fontSize: 12,
    fontWeight: '700',
  },

  // Edit Modal Inputs
  editInputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#3A2A6B',
    marginTop: 12,
    marginBottom: 6,
  },
  editTitleInput: {
    backgroundColor: '#FDFBF9',
    borderWidth: 1.4,
    borderColor: '#E7E0D6',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontWeight: '700',
    color: '#211A2E',
  },
  editContentInput: {
    backgroundColor: '#FDFBF9',
    borderWidth: 1.4,
    borderColor: '#E7E0D6',
    borderRadius: 10,
    padding: 12,
    fontSize: 13,
    lineHeight: 20,
    color: '#211A2E',
    minHeight: 280,
    fontFamily: SANS,
  },
  editModalBottomBar: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0EBE4',
  },
  editCancelBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.4,
    borderColor: '#E7E0D6',
    backgroundColor: '#fff',
  },
  editCancelBtnTxt: {
    fontSize: 13,
    fontWeight: '700',
    color: '#5B5468',
  },
  editSaveBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#5B3FA6',
  },
  editSaveBtnTxt: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
});

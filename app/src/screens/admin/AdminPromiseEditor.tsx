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
  ChevronUp,
  X,
  CheckCircle2,
  Wand2,
  Phone,
  Sparkles,
  Upload,
  Trash2,
  RefreshCw,
  Palette,
  Check,
  Clock,
  Send,
  FileText,
  ArrowRight
} from 'lucide-react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { AppAlert } from '../../components/CustomAlert';
import { formatDateDisplay } from '../../utils/DateUtils';
import { AdminTabContext } from '../../context/AdminTabContext';
import { useChurch } from '../../context/ChurchContext';
import * as MediaLibrary from 'expo-media-library';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import ViewShot, { captureRef } from 'react-native-view-shot';
import firestore from '@react-native-firebase/firestore';

import FirestoreService from '../../services/FirestoreService';
import AIService from '../../services/AIService';

const { width } = Dimensions.get('window');
const SERIF = Platform.OS === 'ios' ? 'Georgia' : 'serif';

const TELUGU_MONTHS_LIST = [
  'జనవరి', 'ఫిబ్రవరి', 'మార్చి', 'ఏప్రిల్', 'మే', 'జూన్',
  'జూలై', 'ఆగస్టు', 'సెప్టెంబర్', 'అక్టోబర్', 'నవంబర్', 'డిసెంబర్'
];
const FULL_EN_MONTHS_LIST = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const getPromiseDateDisplay = (dateStr: string, isTelugu: boolean = true) => {
  if (!dateStr) {
    const today = new Date();
    return isTelugu
      ? `${TELUGU_MONTHS_LIST[today.getMonth()]} ${today.getDate()}`
      : `${FULL_EN_MONTHS_LIST[today.getMonth()]} ${today.getDate()}`;
  }
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    if (!isNaN(month) && !isNaN(day) && month >= 0 && month < 12) {
      return isTelugu ? `${TELUGU_MONTHS_LIST[month]} ${day}` : `${FULL_EN_MONTHS_LIST[month]} ${day}`;
    }
  }
  return dateStr;
};

const cleanVerse = (v: string) => (v || '').trim().replace(/^[“"']+|[”"'.]+$/g, '');
const cleanRef = (r: string) => {
  const c = (r || '').trim().replace(/^\(|\)$/g, '');
  return c ? `(${c})` : '';
};

function hexToRgba(hex: string, alpha: number): string {
  if (!hex || typeof hex !== 'string') return `rgba(15, 8, 26, ${alpha})`;
  let cleanHex = hex.replace('#', '').trim();
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map(c => c + c).join('');
  }
  if (cleanHex.length !== 6) return `rgba(15, 8, 26, ${alpha})`;
  const r = parseInt(cleanHex.substring(0, 2), 16) || 0;
  const g = parseInt(cleanHex.substring(2, 4), 16) || 0;
  const b = parseInt(cleanHex.substring(4, 6), 16) || 0;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function darkenHex(hex: string, factor: number): string {
  if (!hex || typeof hex !== 'string') return '#0A0512';
  let cleanHex = hex.replace('#', '').trim();
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map(c => c + c).join('');
  }
  if (cleanHex.length !== 6) return '#0A0512';
  const r = Math.max(0, Math.floor(parseInt(cleanHex.substring(0, 2), 16) * factor));
  const g = Math.max(0, Math.floor(parseInt(cleanHex.substring(2, 4), 16) * factor));
  const b = Math.max(0, Math.floor(parseInt(cleanHex.substring(4, 6), 16) * factor));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function getLuminance(hex: string): number {
  if (!hex || typeof hex !== 'string') return 0.2;
  let cleanHex = hex.replace('#', '').trim();
  if (cleanHex.length === 3) cleanHex = cleanHex.split('').map(c => c + c).join('');
  if (cleanHex.length !== 6) return 0.2;
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255;
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

interface ColorFamily {
  name: string;
  shades: {
    label: string;
    hex: string;
  }[];
}

const COLOR_FAMILIES: ColorFamily[] = [
  {
    name: 'Blue',
    shades: [
      { label: 'Deep Blue', hex: '#1E3A8A' },
      { label: 'Royal Blue', hex: '#2563EB' },
      { label: 'Cobalt', hex: '#3B82F6' },
      { label: 'Soft Blue', hex: '#60A5FA' },
    ]
  },
  {
    name: 'Navy',
    shades: [
      { label: 'Midnight Navy', hex: '#0F172A' },
      { label: 'Deep Navy', hex: '#1E293B' },
      { label: 'Classic Navy', hex: '#1A2D5A' },
      { label: 'Steel Navy', hex: '#334155' },
    ]
  },
  {
    name: 'Sky Blue',
    shades: [
      { label: 'Deep Sky', hex: '#0284C7' },
      { label: 'Sky Blue', hex: '#0EA5E9' },
      { label: 'Azure', hex: '#38BDF8' },
      { label: 'Light Sky', hex: '#7DD3FC' },
    ]
  },
  {
    name: 'Purple',
    shades: [
      { label: 'Imperial Purple', hex: '#581C87' },
      { label: 'Royal Purple', hex: '#6B21A8' },
      { label: 'Deep Purple', hex: '#7E22CE' },
      { label: 'Amethyst', hex: '#9333EA' },
    ]
  },
  {
    name: 'Violet',
    shades: [
      { label: 'Deep Violet', hex: '#4C1D95' },
      { label: 'Indigo Violet', hex: '#5B21B6' },
      { label: 'Vibrant Violet', hex: '#6D28D9' },
      { label: 'Soft Violet', hex: '#8B5CF6' },
    ]
  },
  {
    name: 'Pink',
    shades: [
      { label: 'Deep Rose', hex: '#9D174D' },
      { label: 'Magenta Pink', hex: '#BE185D' },
      { label: 'Vibrant Pink', hex: '#DB2777' },
      { label: 'Rose Gold', hex: '#F472B6' },
    ]
  },
  {
    name: 'Red',
    shades: [
      { label: 'Maroon', hex: '#7F1D1D' },
      { label: 'Crimson', hex: '#991B1B' },
      { label: 'Ruby Red', hex: '#DC2626' },
      { label: 'Scarlet', hex: '#EF4444' },
    ]
  },
  {
    name: 'Orange',
    shades: [
      { label: 'Burnt Orange', hex: '#9A3412' },
      { label: 'Rust', hex: '#C2410C' },
      { label: 'Amber Orange', hex: '#EA580C' },
      { label: 'Tangerine', hex: '#F97316' },
    ]
  },
  {
    name: 'Yellow',
    shades: [
      { label: 'Golden Olive', hex: '#854D0E' },
      { label: 'Deep Gold', hex: '#A16207' },
      { label: 'Warm Gold', hex: '#CA8A04' },
      { label: 'Sun Gold', hex: '#EAB308' },
    ]
  },
  {
    name: 'Green',
    shades: [
      { label: 'Forest Green', hex: '#14532D' },
      { label: 'Deep Emerald', hex: '#166534' },
      { label: 'Emerald Green', hex: '#15803D' },
      { label: 'Olive Green', hex: '#16A34A' },
    ]
  },
  {
    name: 'Teal',
    shades: [
      { label: 'Deep Teal', hex: '#134E4A' },
      { label: 'Dark Teal', hex: '#115E59' },
      { label: 'Ocean Teal', hex: '#0F766E' },
      { label: 'Vibrant Teal', hex: '#0D9488' },
    ]
  },
  {
    name: 'Cyan',
    shades: [
      { label: 'Deep Cyan', hex: '#164E63' },
      { label: 'Dark Cyan', hex: '#155E75' },
      { label: 'Pacific Cyan', hex: '#0891B2' },
      { label: 'Aqua Cyan', hex: '#06B6D4' },
    ]
  },
  {
    name: 'Brown',
    shades: [
      { label: 'Deep Espresso', hex: '#3E2723' },
      { label: 'Chocolate', hex: '#4E342E' },
      { label: 'Warm Walnut', hex: '#5D4037' },
      { label: 'Cedar Bronze', hex: '#6D4C41' },
    ]
  },
  {
    name: 'Black',
    shades: [
      { label: 'Pure Obsidian', hex: '#0A0A0A' },
      { label: 'Midnight Black', hex: '#121212' },
      { label: 'Onyx', hex: '#18181B' },
      { label: 'Charcoal', hex: '#27272A' },
    ]
  },
  {
    name: 'White',
    shades: [
      { label: 'Pure Pearl', hex: '#FFFFFF' },
      { label: 'Ivory Cream', hex: '#FAFAF9' },
      { label: 'Alabaster', hex: '#F5F5F4' },
      { label: 'Warm White', hex: '#E7E5E4' },
    ]
  },
  {
    name: 'Gray',
    shades: [
      { label: 'Slate Gray', hex: '#334155' },
      { label: 'Cool Gray', hex: '#475569' },
      { label: 'Pewter Gray', hex: '#64748B' },
      { label: 'Silver Gray', hex: '#94A3B8' },
    ]
  },
];

interface GradientPreset {
  name: string;
  colors: [string, string];
}

const GRADIENT_PRESETS: GradientPreset[] = [
  { name: 'Blue → Purple', colors: ['#1E40AF', '#7C3AED'] },
  { name: 'Blue → Cyan', colors: ['#1D4ED8', '#06B6D4'] },
  { name: 'Purple → Pink', colors: ['#6B21A8', '#DB2777'] },
  { name: 'Red → Orange', colors: ['#B91C1C', '#EA580C'] },
  { name: 'Orange → Yellow', colors: ['#EA580C', '#EAB308'] },
  { name: 'Green → Teal', colors: ['#15803D', '#0D9488'] },
  { name: 'Navy → Blue', colors: ['#0F172A', '#2563EB'] },
  { name: 'Purple → Blue', colors: ['#7C3AED', '#3B82F6'] },
  { name: 'Pink → Orange', colors: ['#BE185D', '#F97316'] },
  { name: 'Midnight → Gold', colors: ['#0F172A', '#D97706'] },
  { name: 'Deep Royal → Amber', colors: ['#2E1065', '#B45309'] },
  { name: 'Emerald → Lime', colors: ['#064E3B', '#10B981'] },
  { name: 'Crimson → Wine', colors: ['#450A0A', '#991B1B'] },
  { name: 'Twilight → Rose', colors: ['#312E81', '#E11D48'] },
  { name: 'Dark Slate → Silver', colors: ['#18181B', '#71717A'] },
  { name: 'Holy Gold → Bronze', colors: ['#78350F', '#F59E0B'] },
];

const SPECTRUM_SWATCHES = [
  '#EF4444', '#F97316', '#F59E0B', '#EAB308', '#84CC16', '#10B981',
  '#14B8A6', '#06B6D4', '#0EA5E9', '#3B82F6', '#6366F1', '#8B5CF6',
  '#A855F7', '#D946EF', '#EC4899', '#F43F5E', '#78716C', '#0F172A'
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
  const { activeChurch } = useChurch();
  const [loading, setLoading] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedBook, setSelectedBook] = useState<number | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
  const [selectedVerse, setSelectedVerse] = useState<number | null>(null);
  const [isFetchingVerse, setIsFetchingVerse] = useState(false);
  const [isGeneratingThumbnail, setIsGeneratingThumbnail] = useState(false);
  const [selectionModalType, setSelectionModalType] = useState<'book' | 'chapter' | 'verse' | null>(null);
  const [bgImageUrl, setBgImageUrl] = useState('');
  const [isCustomUploaded, setIsCustomUploaded] = useState(false);
  
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

  // ─── Thumbnail Color & Theme State ─────────────────────────────────────────
  const [colorMode, setColorMode] = useState<'solid' | 'gradient' | 'custom'>('solid');
  const [selectedSolidColor, setSelectedSolidColor] = useState('#1E3A8A');
  const [selectedGradient, setSelectedGradient] = useState<[string, string]>(['#1E40AF', '#7C3AED']);
  const [activeFamilyTab, setActiveFamilyTab] = useState('All');
  
  // Custom Color states
  const [customSolidInput, setCustomSolidInput] = useState('#1E3A8A');
  const [customGradStart, setCustomGradStart] = useState('#1E40AF');
  const [customGradEnd, setCustomGradEnd] = useState('#7C3AED');
  const [customType, setCustomType] = useState<'solid' | 'gradient'>('solid');
  const [isColorPickerExpanded, setIsColorPickerExpanded] = useState(false);
  const [savingActionText, setSavingActionText] = useState('Saving & Publishing Daily Promise…');

  const stripHtml = (html?: string) => {
    if (!html) return '';
    return html.replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ').replace(/&#39;/g, "'").trim();
  };

  useEffect(() => {
    if (editingData) {
      const cleanEnRef = editingData.verseReferenceEn?.startsWith('DP-') ? '' : editingData.verseReferenceEn;
      const cleanTeRef = editingData.verseReferenceTe || '';
      const savedTheme = editingData.theme || '#1E3A8A';

      if (savedTheme.includes('|')) {
        const [c1, c2] = savedTheme.split('|');
        setColorMode('gradient');
        setSelectedGradient([c1, c2]);
        setCustomGradStart(c1);
        setCustomGradEnd(c2);
      } else {
        setColorMode('solid');
        setSelectedSolidColor(savedTheme);
        setCustomSolidInput(savedTheme);
      }
      
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
        theme: savedTheme,
        imageUrl: editingData.imageUrl || ''
      });
      setLastSavedStatus(editingData.status || 'Scheduled');
      setBgImageUrl(editingData.imageUrl || '');
      setIsCustomUploaded(!!editingData.imageUrl);
    } else {
      setColorMode('solid');
      setSelectedSolidColor('#1E3A8A');
      setSelectedGradient(['#1E40AF', '#7C3AED']);
      setCustomSolidInput('#1E3A8A');
      setCustomGradStart('#1E40AF');
      setCustomGradEnd('#7C3AED');
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
        theme: '#1E3A8A',
        imageUrl: ''
      });
      setBgImageUrl('');
      setIsCustomUploaded(false);
    }
  }, [editingData]);

  // Derived active colors for live thumbnail composite
  const activePrimaryColor = colorMode === 'gradient'
    ? selectedGradient[0]
    : (colorMode === 'custom' && customType === 'gradient' ? customGradStart : selectedSolidColor);

  const activeSecondaryColor = colorMode === 'gradient'
    ? selectedGradient[1]
    : (colorMode === 'custom' && customType === 'gradient' ? customGradEnd : activePrimaryColor);

  const thumbnailVignetteColors: [string, string, string] = (colorMode === 'gradient' || (colorMode === 'custom' && customType === 'gradient'))
    ? [
        hexToRgba(activePrimaryColor, 0.42),
        hexToRgba(activeSecondaryColor, 0.68),
        hexToRgba(darkenHex(activeSecondaryColor, 0.35), 0.88),
      ]
    : [
        hexToRgba(activePrimaryColor, 0.42),
        hexToRgba(darkenHex(activePrimaryColor, 0.65), 0.70),
        hexToRgba(darkenHex(activePrimaryColor, 0.35), 0.88),
      ];

  const thumbnailGradientStart = { x: 0, y: 0 };
  const thumbnailGradientEnd = (colorMode === 'gradient' || (colorMode === 'custom' && customType === 'gradient'))
    ? { x: 1, y: 1 }
    : { x: 0, y: 1 };

  const [showSuccess, setShowSuccess] = useState(false);
  const [lastSavedStatus, setLastSavedStatus] = useState<'Published' | 'Scheduled' | 'Draft'>('Published');
  const [showError, setShowError] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const viewShotRef = useRef(null);

  const handleFetchVerse = async (bIdx?: number | null, cNum?: number | null, vNum?: number | null) => {
    const bookIndex = (typeof bIdx === 'number') ? bIdx : selectedBook;
    const chapterNumber = (typeof cNum === 'number') ? cNum : selectedChapter;
    const verseNumber = (typeof vNum === 'number') ? vNum : selectedVerse;

    if (bookIndex === null || chapterNumber === null || verseNumber === null) {
      return;
    }

    setIsFetchingVerse(true);
    try {
      const bookId = bookIndex + 1;
      const url = `https://bolls.life/get-text/KJV/${bookId}/${chapterNumber}/`;
      const engResponse = await fetch(url, { headers: { 'Accept': 'application/json' } });
      let engText = '';
      if (engResponse.ok) {
        const result = await engResponse.json();
        const verseObj = result.find((v: any) => v.verse === verseNumber);
        if (verseObj) {
          engText = verseObj.text ? verseObj.text.replace(/<[^>]*>?/gm, '').replace(/\d+/g, '').replace(/\s+/g, ' ').trim() : '';
        }
      }

      let telText = '';
      const bookData = LOCAL_TELUGU_BIBLE.Book[bookIndex];
      if (bookData && bookData.Chapter && bookData.Chapter[chapterNumber - 1]) {
        const chapterData = bookData.Chapter[chapterNumber - 1].Verse;
        if (chapterData && chapterData[verseNumber - 1]) {
          telText = chapterData[verseNumber - 1].Verse;
        }
      }

      const engBookName = ENGLISH_NAMES[bookIndex];
      const teBookName = TELUGU_NAMES[bookIndex];

      setForm(prev => ({
        ...prev,
        enRef: `${engBookName} ${chapterNumber}:${verseNumber}`,
        enVerse: engText,
        teRef: `${teBookName} ${chapterNumber}:${verseNumber}`,
        teVerse: telText
      }));

    } catch (err) {
      console.error('Failed to fetch verses:', err);
      AppAlert.alert('Error', 'Failed to fetch verses automatically. Please enter manually.', undefined, 'error');
    } finally {
      setIsFetchingVerse(false);
    }
  };

  const handleGenerateThumbnail = async (excludeCurrent: boolean = true) => {
    if (!form.enVerse?.trim() && !form.teVerse?.trim()) {
      AppAlert.alert('Verse Required', 'Please select or enter a Bible verse first so AI can generate a message-related visual.', undefined, 'error');
      return;
    }

    setIsGeneratingThumbnail(true);
    try {
      const churchId = await FirestoreService.getChurchId();
      const verseContext = form.enVerse || form.teVerse;
      const refContext = form.enRef || form.teRef || 'Daily Promise';
      
      const PROMISE_MOODS = [
        'radiant morning golden sunrise over wheat field and green olive trees, open Holy Bible bathed in morning dawn light rays',
        'heavenly sunbeams piercing through misty clouds over peaceful mountain valley, divine peace and sacred renewal',
        'open Holy Scripture on rustic cedar wood bathed in serene warm dawn illumination, sacred promise',
        'peaceful calm morning dawn horizon over living waters, soft divine golden glow, spiritual tranquility',
        'majestic sunrise breaking over green hills, olive branches, radiant golden hour Christian morning devotional',
        'glorious morning dawn sky with ethereal rays of light, reverent sacred atmosphere of blessing and divine health'
      ];
      const selectedMood = PROMISE_MOODS[Math.floor(Math.random() * PROMISE_MOODS.length)];

      const colorDesc = (colorMode === 'gradient' || (colorMode === 'custom' && customType === 'gradient'))
        ? `gradient palette of ${activePrimaryColor} blending into ${activeSecondaryColor}`
        : `${activePrimaryColor}`;

      const prompt = `${selectedMood}, bathed in radiant ${colorDesc} cinematic ambient illumination, sacred promise of long life divine health peace, scripture "${verseContext.slice(0, 100)}", reference ${refContext}, longevity, divine satisfaction, Psalm 91:16 devotional atmosphere, cinematic 8k Christian photography`;

      const currentBg = bgImageUrl || form.imageUrl || undefined;

      const visualUrl = await AIService.generateContentImage({
        prompt,
        churchId: churchId || 'default',
        orientation: 'Landscape',
        style: 'Professional',
        contentType: 'Daily Promise Card',
        color: activePrimaryColor,
        excludeUrl: excludeCurrent ? currentBg : undefined,
      });

      if (visualUrl) {
        setIsCustomUploaded(false);
        setBgImageUrl(visualUrl);
        setForm(prev => ({ ...prev, imageUrl: visualUrl }));
        AppAlert.alert('Success 🎉', 'New background loaded! Scripture and date are automatically placed.', undefined, 'success');
      }
    } catch (err: any) {
      console.error('Failed to generate thumbnail:', err);
      AppAlert.alert('Error', err.message || 'Failed to generate AI thumbnail.', undefined, 'error');
    } finally {
      setIsGeneratingThumbnail(false);
    }
  };

  const handleChangeBackground = () => {
    // Immediately cycles to a fresh new background visual
    handleGenerateThumbnail(true);
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
      console.warn('Storage upload error, using local/source URI:', error);
      return localUri;
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

      if (!result.canceled && result.assets && result.assets[0]?.uri) {
        setIsUploadingImage(true);
        const cloudUrl = await uploadImageToCloud(result.assets[0].uri);
        setIsCustomUploaded(true);
        setBgImageUrl(cloudUrl);
        setForm(prev => ({ ...prev, imageUrl: cloudUrl }));
        AppAlert.alert('Success', 'Custom image uploaded successfully! Displayed exactly as uploaded without any text overlay.', undefined, 'success');
      }
    } catch (err) {
      console.error('Upload Error:', err);
      AppAlert.alert('Upload Failed', 'There was an issue uploading your image.', undefined, 'error');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSave = async (statusOverride?: 'Published' | 'Scheduled' | 'Draft') => {
    const finalStatus: 'Published' | 'Scheduled' | 'Draft' = statusOverride || (form.status as 'Published' | 'Scheduled' | 'Draft') || 'Published';
    
    if (!form.date) return AppAlert.alert('Error', 'Please select a promise date.', undefined, 'error');
    if (!form.enVerse?.trim() && !form.teVerse?.trim()) return AppAlert.alert('Error', 'Please enter the verse.', undefined, 'error');

    let actionLabel = 'Saving Daily Promise…';
    if (finalStatus === 'Published') {
      actionLabel = 'Saving & Publishing Daily Promise…';
    } else if (finalStatus === 'Scheduled') {
      actionLabel = `Scheduling Promise for ${formatDateDisplay(form.date)}…`;
    } else {
      actionLabel = 'Saving Promise Draft…';
    }
    setSavingActionText(actionLabel);
    setLoading(true);
    try {
      let finalImageUrl = form.imageUrl || bgImageUrl;
      
      // If live composite view is active (AI generated mode), capture it so the saved promise has the complete branded graphic.
      // For custom uploaded images, skip ViewShot capture completely to preserve the exact uploaded image without any overlay.
      if (!isCustomUploaded && (bgImageUrl || form.imageUrl) && viewShotRef.current) {
        try {
          const capturedUri = await captureRef(viewShotRef, { format: 'jpg', quality: 0.95 });
          if (capturedUri) {
            const uploadedUrl = await uploadImageToCloud(capturedUri);
            if (uploadedUrl) {
              finalImageUrl = uploadedUrl;
            }
          }
        } catch (capErr) {
          console.warn('ViewShot composite capture skipped, using visualUrl:', capErr);
        }
      }

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
        theme: (colorMode === 'gradient' || (colorMode === 'custom' && customType === 'gradient')) ? `${activePrimaryColor}|${activeSecondaryColor}` : activePrimaryColor,
        imageUrl: finalImageUrl
      };
      
      await FirestoreService.createDailyPromise(details);

      // Invalidate local cached promise so Member view re-fetches immediately
      try {
        await AsyncStorage.removeItem('@cached_daily_promise');
      } catch (_) {}

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

      setForm(prev => ({ ...prev, status: finalStatus, imageUrl: finalImageUrl }));
      setLastSavedStatus(finalStatus);
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
            
            <View style={{ flexDirection: 'column', gap: 10 }}>
              <TouchableOpacity 
                style={[styles.input, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 46, paddingVertical: 10, paddingHorizontal: 12 }]} 
                onPress={() => setSelectionModalType('book')}
                activeOpacity={0.7}
              >
                <Text style={{ color: selectedBook !== null ? '#1a2d5a' : '#94A3B8', flex: 1, fontSize: 13, fontWeight: '600' }} numberOfLines={1} ellipsizeMode="tail">
                  {selectedBook !== null ? `${ENGLISH_NAMES[selectedBook]} - ${TELUGU_NAMES[selectedBook]}` : 'Select Book'}
                </Text>
                <ChevronDown size={16} color="#94A3B8" style={{ marginLeft: 6 }} />
              </TouchableOpacity>
              
              <View style={{ flexDirection: 'row', gap: 10, alignItems: 'stretch' }}>
                <TouchableOpacity 
                  style={[styles.input, { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 46, paddingVertical: 10, paddingHorizontal: 10 }]} 
                  onPress={() => {
                    if (selectedBook === null) return AppAlert.alert('Info', 'Please select a Book first');
                    setSelectionModalType('chapter');
                  }}
                  activeOpacity={0.7}
                >
                  <Text 
                    style={{ color: selectedChapter !== null ? '#1a2d5a' : '#94A3B8', fontSize: 12.5, fontWeight: '600', flex: 1, marginRight: 4 }}
                    numberOfLines={1}
                    adjustsFontSizeToFit={true}
                    minimumFontScale={0.8}
                  >
                    {selectedChapter !== null ? `Chapter ${selectedChapter}` : 'Select Chapter'}
                  </Text>
                  <ChevronDown size={15} color="#94A3B8" />
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.input, { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 46, paddingVertical: 10, paddingHorizontal: 10 }]} 
                  onPress={() => {
                    if (selectedChapter === null) return AppAlert.alert('Info', 'Please select a Chapter first');
                    setSelectionModalType('verse');
                  }}
                  activeOpacity={0.7}
                >
                  <Text 
                    style={{ color: selectedVerse !== null ? '#1a2d5a' : '#94A3B8', fontSize: 12.5, fontWeight: '600', flex: 1, marginRight: 4 }}
                    numberOfLines={1}
                    adjustsFontSizeToFit={true}
                    minimumFontScale={0.8}
                  >
                    {selectedVerse !== null ? `Verse ${selectedVerse}` : 'Select Verse'}
                  </Text>
                  <ChevronDown size={15} color="#94A3B8" />
                </TouchableOpacity>
              </View>
            </View>

            {isFetchingVerse && (
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 12 }}>
                <ActivityIndicator size="small" color="#1a2d5a" />
                <Text style={{ fontSize: 12, color: '#64748B', fontWeight: '500' }}>Fetching verse text…</Text>
              </View>
            )}
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
            <View style={[styles.secHdPill, { backgroundColor: '#F59E0B' }]}>
              <Sparkles size={13} color="#211A2E" />
            </View>
            <Text style={styles.secHdTXT}>Daily Promise AI Thumbnail</Text>
            <View style={styles.landscapeBadge}>
              <Text style={styles.landscapeBadgeTxt}>16:9 Landscape</Text>
            </View>
          </View>

          <View style={styles.fGroup}>
            <Text style={styles.fLabel}>
              {isCustomUploaded ? 'Custom Thumbnail ' : 'Devotional Thumbnail '}
              <Text style={styles.fHint}>
                {isCustomUploaded ? '(Displayed exactly as uploaded — no overlays)' : '(Synchronized live with selected verse & date)'}
              </Text>
            </Text>

            {(bgImageUrl || form.imageUrl) ? (
              <View style={{ marginTop: 6 }}>
                {isCustomUploaded ? (
                  /* ── UPLOADED CUSTOM IMAGE: Displayed exactly as it is, without any duplicate, overlay, or unwanted text ── */
                  <View style={[styles.promiseThumbnailFrame, { borderColor: '#1E3A8A', overflow: 'hidden' }]}>
                    <Image
                      source={{ uri: form.imageUrl || bgImageUrl }}
                      style={StyleSheet.absoluteFillObject}
                      resizeMode="cover"
                    />
                  </View>
                ) : (
                  /* ── 16:9 LANDSCAPE VIEWSHOT COMPOSITE FOR AI DEVOTIONAL TEMPLATES ── */
                  <ViewShot
                    ref={viewShotRef}
                    options={{ format: 'jpg', quality: 1.0 }}
                    style={[styles.promiseThumbnailFrame, { borderColor: activePrimaryColor }]}
                  >
                    {/* 1. Message-Related Background Image */}
                    <Image
                      source={{ uri: bgImageUrl || form.imageUrl }}
                      style={StyleSheet.absoluteFillObject}
                      resizeMode="cover"
                    />

                    {/* 2. Professional Dynamic Vignette Gradient */}
                    <LinearGradient
                      colors={thumbnailVignetteColors}
                      start={thumbnailGradientStart}
                      end={thumbnailGradientEnd}
                      style={StyleSheet.absoluteFillObject}
                    />

                    {/* 3. Devotional Altar Content Layout */}
                    <View style={styles.promiseMainLayout}>
                      {/* Top Header Bar */}
                      <View style={styles.promiseTopBar}>
                        <View style={styles.promiseLogoRow}>
                          {activeChurch?.theme?.logoUrl ? (
                            <Image source={{ uri: activeChurch.theme.logoUrl }} style={styles.promiseChurchLogo} resizeMode="contain" />
                          ) : (
                            <View style={[styles.promiseLogoFallback, { backgroundColor: activePrimaryColor }]}>
                              <Text style={styles.promiseChurchLogoCross} allowFontScaling={false}>✝</Text>
                            </View>
                          )}
                          <View style={{ flexShrink: 1 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                              <Text style={{ fontSize: 8.5 }} allowFontScaling={false}>🕊</Text>
                              <Text style={styles.promiseChurchName} numberOfLines={1} allowFontScaling={false}>
                                {(activeChurch?.name || 'WE CHRISTIAN').toUpperCase()}
                              </Text>
                            </View>
                            <Text style={styles.promiseSubHeaderTxt} numberOfLines={1} allowFontScaling={false}>నేటి దైవిక వాగ్దానం</Text>
                          </View>
                        </View>

                        {/* Dynamic Date Badge (Pulls from selected promise date) */}
                        <View style={[styles.promiseDatePill, { borderColor: `${activePrimaryColor}AA`, backgroundColor: hexToRgba(activePrimaryColor, 0.28) }]}>
                          <CalendarIcon size={7} color={activeSecondaryColor} />
                          <Text style={styles.promiseDateTxt} numberOfLines={1} allowFontScaling={false}>
                            {getPromiseDateDisplay(form.date, true)}
                          </Text>
                        </View>
                      </View>

                      {/* Center Devotional Card */}
                      <View style={[styles.promiseCenterCard, { borderColor: `${activeSecondaryColor}66` }]}>
                        {/* Ribbon Pill */}
                        <View style={[styles.promiseRibbonPill, { backgroundColor: activeSecondaryColor }]}>
                          <Sparkles size={7} color={getLuminance(activeSecondaryColor) > 0.6 ? '#111827' : '#FFFFFF'} />
                          <Text style={[styles.promiseRibbonTxt, { color: getLuminance(activeSecondaryColor) > 0.6 ? '#111827' : '#FFFFFF' }]} allowFontScaling={false} numberOfLines={1}>
                            ✨ నేటి దేవుని వాగ్దానం ✨
                          </Text>
                        </View>

                        {/* Scripture Presentation: Automatically pulled from selected Bible verse */}
                        <View style={styles.promiseQuoteContainer}>
                          {/* Telugu Scripture Line */}
                          <View style={styles.promiseQuoteLineWrap}>
                            <Text
                              style={styles.promiseQuoteTelugu}
                              numberOfLines={2}
                              adjustsFontSizeToFit={true}
                              minimumFontScale={0.75}
                              allowFontScaling={false}
                            >
                              “{cleanVerse(form.teVerse || 'దీర్ఘాయువు చేత అతనిని తృప్తిపరచెదను')}.”{' '}
                              {form.teRef ? (
                                <Text style={[styles.promiseQuoteTeluguRef, { color: activeSecondaryColor }]} allowFontScaling={false}>
                                  {cleanRef(form.teRef)}
                                </Text>
                              ) : null}
                            </Text>
                          </View>

                          {/* Dynamic Divider with Cross */}
                          <View style={styles.promiseDividerRow}>
                            <View style={[styles.promiseDividerLine, { backgroundColor: `${activeSecondaryColor}66` }]} />
                            <Text style={[styles.promiseDividerCross, { color: activeSecondaryColor }]} allowFontScaling={false}>✝</Text>
                            <View style={[styles.promiseDividerLine, { backgroundColor: `${activeSecondaryColor}66` }]} />
                          </View>

                          {/* English Scripture Line */}
                          <View style={styles.promiseQuoteLineWrap}>
                            <Text
                              style={styles.promiseQuoteEnglish}
                              numberOfLines={2}
                              adjustsFontSizeToFit={true}
                              minimumFontScale={0.75}
                              allowFontScaling={false}
                            >
                              “{cleanVerse(form.enVerse || 'I will satisfy him with long life')}.”{' '}
                              {form.enRef ? (
                                <Text style={styles.promiseQuoteEnglishRef} allowFontScaling={false}>
                                  {cleanRef(form.enRef)}
                                </Text>
                              ) : null}
                            </Text>
                          </View>
                        </View>

                        {/* Tagline / Devotional Note */}
                        <View style={styles.promiseTagRow}>
                          <Text style={{ fontSize: 6.5 }} allowFontScaling={false}>🌿</Text>
                          <Text style={styles.promiseTagTxt} numberOfLines={1} adjustsFontSizeToFit={true} minimumFontScale={0.8} allowFontScaling={false}>
                            {form.teNote || form.enNote || 'దీర్ఘాయువునిచ్చు దేవుని వాగ్దానం'}
                          </Text>
                          <Text style={{ fontSize: 6.5 }} allowFontScaling={false}>🌿</Text>
                        </View>
                      </View>

                      {/* Bottom Footer Bar */}
                      <View style={styles.promiseBottomBar}>
                        <View style={[styles.promisePhonePill, { backgroundColor: activePrimaryColor }]}>
                          <Phone size={7} color="#fff" />
                          <Text style={styles.promisePhoneTxt} numberOfLines={1} allowFontScaling={false}>
                            {`మరిన్ని వివరాలకు : ${activeChurch?.contactPhone || '8000504070'}`}
                          </Text>
                        </View>
                        <Text style={[styles.promiseWelcomeScript, { color: activeSecondaryColor }]} numberOfLines={1} allowFontScaling={false}>
                          దీవించబడుదురు గాక
                        </Text>
                      </View>

                      {/* Live Loading Overlay while generating thumbnail */}
                      {isGeneratingThumbnail && (
                        <View style={styles.thumbnailGeneratingOverlay}>
                          <ActivityIndicator size="large" color="#FFFFFF" />
                          <Text style={styles.thumbnailGeneratingTxt}>Generating New Background…</Text>
                        </View>
                      )}
                    </View>
                  </ViewShot>
                )}

                {/* Thumbnail Action Controls */}
                <View style={styles.thumbActionContainer}>
                  {/* Row 1: Primary AI Generation Actions */}
                  <View style={styles.thumbActionRow}>
                    <TouchableOpacity
                      style={[styles.btnThumbAction, styles.btnThumbActionPrimary]}
                      onPress={() => handleGenerateThumbnail()}
                      disabled={isGeneratingThumbnail}
                      activeOpacity={0.7}
                    >
                      {isGeneratingThumbnail ? (
                        <ActivityIndicator size="small" color="#1E3A8A" />
                      ) : (
                        <RefreshCw size={14} color="#1E3A8A" strokeWidth={2.2} />
                      )}
                      <Text 
                        style={styles.btnThumbActionPrimaryTxt} 
                        numberOfLines={1} 
                        adjustsFontSizeToFit={true} 
                        minimumFontScale={0.85}
                      >
                        {isGeneratingThumbnail ? 'Generating…' : (isCustomUploaded ? 'Generate with AI' : 'Re-Generate')}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.btnThumbAction, styles.btnThumbActionSuccess]}
                      onPress={() => handleChangeBackground()}
                      disabled={isGeneratingThumbnail}
                      activeOpacity={0.7}
                    >
                      <Sparkles size={14} color="#15803D" strokeWidth={2.2} />
                      <Text 
                        style={styles.btnThumbActionSuccessTxt} 
                        numberOfLines={1} 
                        adjustsFontSizeToFit={true} 
                        minimumFontScale={0.85}
                      >
                        {isCustomUploaded ? 'AI Background' : 'Change Background'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Row 2: Secondary Utility Actions */}
                  <View style={styles.thumbActionRow}>
                    <TouchableOpacity
                      style={[styles.btnThumbActionSub, styles.btnThumbActionSecondary]}
                      onPress={pickThumbnail}
                      disabled={isGeneratingThumbnail || isUploadingImage}
                      activeOpacity={0.7}
                    >
                      {isUploadingImage ? (
                        <ActivityIndicator size="small" color="#374151" />
                      ) : (
                        <Upload size={13} color="#374151" strokeWidth={2.2} />
                      )}
                      <Text 
                        style={styles.btnThumbActionSecondaryTxt} 
                        numberOfLines={1} 
                        adjustsFontSizeToFit={true} 
                        minimumFontScale={0.85}
                      >
                        {isUploadingImage ? 'Uploading…' : (isCustomUploaded ? 'Replace Image' : 'Upload Image')}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.btnThumbActionSub, styles.btnThumbActionDanger]}
                      onPress={() => {
                        setBgImageUrl('');
                        setForm(prev => ({ ...prev, imageUrl: '' }));
                        setIsCustomUploaded(false);
                      }}
                      disabled={isGeneratingThumbnail}
                      activeOpacity={0.7}
                    >
                      <X size={13} color="#DC2626" strokeWidth={2.2} />
                      <Text 
                        style={styles.btnThumbActionDangerTxt} 
                        numberOfLines={1} 
                        adjustsFontSizeToFit={true} 
                        minimumFontScale={0.85}
                      >
                        Remove Thumbnail
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ) : (
              <View style={{ gap: 10, marginTop: 6 }}>
                <TouchableOpacity
                  style={styles.btnGenerateHeroThumb}
                  onPress={() => handleGenerateThumbnail()}
                  disabled={isGeneratingThumbnail}
                >
                  {isGeneratingThumbnail ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Wand2 size={20} color="#fff" />
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.btnGenerateHeroThumbTitle}>
                      {isGeneratingThumbnail ? 'Generating Daily Promise Thumbnail…' : 'Generate Daily Promise Thumbnail'}
                    </Text>
                    <Text style={styles.btnGenerateHeroThumbSub}>
                      Auto-creates 16:9 landscape graphic with selected verse, reference & date
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity style={styles.btnUploadThumbSecondary} onPress={pickThumbnail}>
                  <Upload size={16} color="#4B5563" />
                  <Text style={styles.btnUploadThumbSecondaryTxt}>Or Upload Custom Image</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* ── THUMBNAIL COLOR & THEME PALETTE ── */}
            <View style={styles.colorPickerSection}>
              <TouchableOpacity
                style={styles.colorPickerHeaderTouchable}
                activeOpacity={0.7}
                onPress={() => setIsColorPickerExpanded(prev => !prev)}
              >
                <View style={styles.colorPickerTitleRow}>
                  <Palette size={15} color="#1a2d5a" />
                  <Text style={styles.colorPickerTitle} numberOfLines={1} ellipsizeMode="tail">Thumbnail Color & Theme</Text>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                  <View style={styles.colorActiveIndicator}>
                    <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: activePrimaryColor, borderWidth: 1, borderColor: '#D1D5DB' }} />
                    {(colorMode === 'gradient' || (colorMode === 'custom' && customType === 'gradient')) ? (
                      <>
                        <Text style={{ fontSize: 9, color: '#9CA3AF' }}>→</Text>
                        <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: activeSecondaryColor, borderWidth: 1, borderColor: '#D1D5DB' }} />
                      </>
                    ) : null}
                    <Text style={styles.colorActiveIndicatorTxt} numberOfLines={1}>
                      {(colorMode === 'gradient' || (colorMode === 'custom' && customType === 'gradient')) ? 'Gradient' : activePrimaryColor}
                    </Text>
                  </View>

                  <View style={styles.chevronWrap}>
                    {isColorPickerExpanded ? (
                      <ChevronUp size={16} color="#1a2d5a" />
                    ) : (
                      <ChevronDown size={16} color="#1a2d5a" />
                    )}
                  </View>
                </View>
              </TouchableOpacity>

              {isColorPickerExpanded && (
                <View style={styles.colorPickerExpandedContent}>
                  {/* Mode Switcher Tabs */}
                  <View style={styles.colorModeTabs}>
                <TouchableOpacity
                  style={[styles.colorModeTab, colorMode === 'solid' && styles.colorModeTabActive]}
                  onPress={() => setColorMode('solid')}
                >
                  <Text style={[styles.colorModeTabTxt, colorMode === 'solid' && styles.colorModeTabTxtActive]}>
                    Solid Color
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.colorModeTab, colorMode === 'gradient' && styles.colorModeTabActive]}
                  onPress={() => setColorMode('gradient')}
                >
                  <Text style={[styles.colorModeTabTxt, colorMode === 'gradient' && styles.colorModeTabTxtActive]}>
                    Gradient Color
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.colorModeTab, colorMode === 'custom' && styles.colorModeTabActive]}
                  onPress={() => setColorMode('custom')}
                >
                  <Text style={[styles.colorModeTabTxt, colorMode === 'custom' && styles.colorModeTabTxtActive]}>
                    Custom Color
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Tab 1: Solid Color */}
              {colorMode === 'solid' && (
                <View style={styles.solidColorContainer}>
                  {/* Family Filter Chips */}
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.familyTabsScroll} contentContainerStyle={styles.familyTabsContent}>
                    {['All', ...COLOR_FAMILIES.map(f => f.name)].map(family => (
                      <TouchableOpacity
                        key={family}
                        style={[styles.familyTabChip, activeFamilyTab === family && styles.familyTabChipActive]}
                        onPress={() => setActiveFamilyTab(family)}
                      >
                        <Text style={[styles.familyTabChipTxt, activeFamilyTab === family && styles.familyTabChipTxtActive]}>
                          {family}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  {/* Swatches Grid */}
                  <View style={styles.swatchGrid}>
                    {(activeFamilyTab === 'All'
                      ? COLOR_FAMILIES.flatMap(f => f.shades)
                      : (COLOR_FAMILIES.find(f => f.name === activeFamilyTab)?.shades || [])
                    ).map((shade, idx) => {
                      const isSelected = selectedSolidColor.toLowerCase() === shade.hex.toLowerCase();
                      const light = getLuminance(shade.hex) > 0.65;
                      return (
                        <TouchableOpacity
                          key={`${shade.hex}-${idx}`}
                          style={[styles.swatchCard, isSelected && styles.swatchCardSelected]}
                          onPress={() => {
                            setSelectedSolidColor(shade.hex);
                            setForm(prev => ({ ...prev, theme: shade.hex }));
                          }}
                        >
                          <View style={[styles.swatchCircle, { backgroundColor: shade.hex }]}>
                            {isSelected && <Check size={13} color={light ? '#111827' : '#FFFFFF'} strokeWidth={3} />}
                          </View>
                          <Text style={styles.swatchLabel} numberOfLines={1}>{shade.label}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* Tab 2: Gradient Color */}
              {colorMode === 'gradient' && (
                <View style={styles.gradientContainer}>
                  <Text style={styles.subHintTxt}>Select from rich Christian & devotional gradient themes:</Text>
                  <View style={styles.gradientGrid}>
                    {GRADIENT_PRESETS.map((grad, idx) => {
                      const isSelected =
                        selectedGradient[0].toLowerCase() === grad.colors[0].toLowerCase() &&
                        selectedGradient[1].toLowerCase() === grad.colors[1].toLowerCase();
                      return (
                        <TouchableOpacity
                          key={`${grad.name}-${idx}`}
                          style={[styles.gradientCard, isSelected && styles.gradientCardSelected]}
                          onPress={() => {
                            setSelectedGradient(grad.colors);
                            setForm(prev => ({ ...prev, theme: `${grad.colors[0]}|${grad.colors[1]}` }));
                          }}
                        >
                          <LinearGradient
                            colors={grad.colors}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.gradientPill}
                          >
                            {isSelected && (
                              <View style={styles.gradientCheckWrap}>
                                <Check size={11} color="#fff" strokeWidth={3} />
                              </View>
                            )}
                          </LinearGradient>
                          <Text style={[styles.gradientCardTxt, isSelected && styles.gradientCardTxtSelected]} numberOfLines={1}>
                            {grad.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* Tab 3: Custom Color & Custom Gradient */}
              {colorMode === 'custom' && (
                <View style={styles.customColorContainer}>
                  <View style={styles.customSubTabs}>
                    <TouchableOpacity
                      style={[styles.customSubTab, customType === 'solid' && styles.customSubTabActive]}
                      onPress={() => setCustomType('solid')}
                    >
                      <Text style={[styles.customSubTabTxt, customType === 'solid' && styles.customSubTabTxtActive]}>
                        Custom Solid
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.customSubTab, customType === 'gradient' && styles.customSubTabActive]}
                      onPress={() => setCustomType('gradient')}
                    >
                      <Text style={[styles.customSubTabTxt, customType === 'gradient' && styles.customSubTabTxtActive]}>
                        Custom Gradient
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {customType === 'solid' ? (
                    <View style={styles.customSolidBox}>
                      <Text style={styles.inputLabel}>Enter Exact HEX Color Code:</Text>
                      <View style={styles.hexInputRow}>
                        <View style={[styles.hexPreviewCircle, { backgroundColor: customSolidInput || '#1E3A8A' }]} />
                        <TextInput
                          style={styles.hexTextInput}
                          value={customSolidInput}
                          onChangeText={(t) => {
                            let val = t.trim();
                            if (!val.startsWith('#') && val.length > 0) val = '#' + val;
                            setCustomSolidInput(val);
                            if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(val)) {
                              setSelectedSolidColor(val);
                              setForm(prev => ({ ...prev, theme: val }));
                            }
                          }}
                          placeholder="#1E3A8A"
                          placeholderTextColor="#9CA3AF"
                          autoCapitalize="characters"
                          maxLength={7}
                        />
                        <TouchableOpacity
                          style={styles.btnApplyCustom}
                          onPress={() => {
                            if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(customSolidInput)) {
                              setSelectedSolidColor(customSolidInput);
                              setForm(prev => ({ ...prev, theme: customSolidInput }));
                              AppAlert.alert('Applied 🎉', `Custom color ${customSolidInput} set as thumbnail theme!`);
                            } else {
                              AppAlert.alert('Invalid HEX', 'Please enter a valid 6-character hex code like #1E3A8A');
                            }
                          }}
                        >
                          <Text style={styles.btnApplyCustomTxt}>Apply</Text>
                        </TouchableOpacity>
                      </View>

                      <Text style={[styles.inputLabel, { marginTop: 12 }]}>Quick Spectrum Pick:</Text>
                      <View style={styles.quickSpectrumRow}>
                        {SPECTRUM_SWATCHES.map(hex => (
                          <TouchableOpacity
                            key={hex}
                            style={[styles.spectrumDot, { backgroundColor: hex }, customSolidInput.toLowerCase() === hex.toLowerCase() && styles.spectrumDotActive]}
                            onPress={() => {
                              setCustomSolidInput(hex);
                              setSelectedSolidColor(hex);
                              setForm(prev => ({ ...prev, theme: hex }));
                            }}
                          />
                        ))}
                      </View>
                    </View>
                  ) : (
                    <View style={styles.customGradBox}>
                      <Text style={styles.subHintTxt}>Design a custom multi-color gradient:</Text>

                      {/* Live Gradient Preview Bar */}
                      <LinearGradient
                        colors={[customGradStart || '#1E40AF', customGradEnd || '#7C3AED']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.customGradPreviewBar}
                      >
                        <Text style={styles.customGradPreviewTxt}>Live Custom Gradient Preview</Text>
                      </LinearGradient>

                      {/* Color 1 Picker */}
                      <Text style={styles.inputLabel}>Start Color (Color 1):</Text>
                      <View style={styles.hexInputRow}>
                        <View style={[styles.hexPreviewCircle, { backgroundColor: customGradStart }]} />
                        <TextInput
                          style={styles.hexTextInput}
                          value={customGradStart}
                          onChangeText={(t) => {
                            let val = t.trim();
                            if (!val.startsWith('#') && val.length > 0) val = '#' + val;
                            setCustomGradStart(val);
                          }}
                          placeholder="#1E40AF"
                          maxLength={7}
                        />
                      </View>
                      <View style={styles.quickSpectrumRow}>
                        {SPECTRUM_SWATCHES.slice(0, 9).map(hex => (
                          <TouchableOpacity
                            key={`c1-${hex}`}
                            style={[styles.spectrumDot, { backgroundColor: hex }, customGradStart.toLowerCase() === hex.toLowerCase() && styles.spectrumDotActive]}
                            onPress={() => setCustomGradStart(hex)}
                          />
                        ))}
                      </View>

                      {/* Color 2 Picker */}
                      <Text style={[styles.inputLabel, { marginTop: 10 }]}>End Color (Color 2):</Text>
                      <View style={styles.hexInputRow}>
                        <View style={[styles.hexPreviewCircle, { backgroundColor: customGradEnd }]} />
                        <TextInput
                          style={styles.hexTextInput}
                          value={customGradEnd}
                          onChangeText={(t) => {
                            let val = t.trim();
                            if (!val.startsWith('#') && val.length > 0) val = '#' + val;
                            setCustomGradEnd(val);
                          }}
                          placeholder="#7C3AED"
                          maxLength={7}
                        />
                      </View>
                      <View style={styles.quickSpectrumRow}>
                        {SPECTRUM_SWATCHES.slice(9, 18).map(hex => (
                          <TouchableOpacity
                            key={`c2-${hex}`}
                            style={[styles.spectrumDot, { backgroundColor: hex }, customGradEnd.toLowerCase() === hex.toLowerCase() && styles.spectrumDotActive]}
                            onPress={() => setCustomGradEnd(hex)}
                          />
                        ))}
                      </View>

                      <TouchableOpacity
                        style={[styles.btnApplyCustom, { marginTop: 14, width: '100%', paddingVertical: 10 }]}
                        onPress={() => {
                          const c1 = customGradStart || '#1E40AF';
                          const c2 = customGradEnd || '#7C3AED';
                          setSelectedGradient([c1, c2]);
                          setForm(prev => ({ ...prev, theme: `${c1}|${c2}` }));
                          AppAlert.alert('Applied 🎉', `Custom gradient ${c1} → ${c2} set as thumbnail theme!`);
                        }}
                      >
                        <Text style={styles.btnApplyCustomTxt}>Apply Custom Gradient</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )}
            </View>
          )}
        </View>
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
                  <Text style={styles.statusOptionSub}>Live immediately on Member Home View</Text>
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
        </View>

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

        <TouchableOpacity style={styles.btnBack} onPress={() => setTabByName?.('Promises')} disabled={loading}>
          <Text style={styles.btnBackTxt}>← Back to list</Text>
        </TouchableOpacity>

        <View style={{ height: 60 }} />
      </ScrollView>

      <TouchableOpacity 
        style={[
          styles.fab,
          form.status === 'Published' && { backgroundColor: '#15803D' },
          form.status === 'Scheduled' && { backgroundColor: '#1a2d5a' },
          form.status === 'Draft' && { backgroundColor: '#475569' }
        ]} 
        onPress={() => handleSave(form.status as 'Published' | 'Scheduled' | 'Draft')} 
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
                    const vNum = idx + 1;
                    setSelectedVerse(vNum);
                    setSelectionModalType(null);
                    handleFetchVerse(selectedBook, selectedChapter, vNum);
                  }}
                >
                  <Text style={[styles.modalOptionText, selectedVerse === idx + 1 && { color: '#fff' }]}>Verse {idx + 1}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Saving / Publishing Full-Screen Loading State */}
      <Modal visible={loading} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.savingCard}>
            <ActivityIndicator size="large" color="#1a2d5a" />
            <Text style={styles.savingTitle}>{savingActionText}</Text>
            <Text style={styles.savingSub}>Capturing high-resolution 16:9 graphic and syncing directly with Member View…</Text>
          </View>
        </View>
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
                  ? 'Promise Published! 🎉'
                  : lastSavedStatus === 'Scheduled'
                  ? 'Promise Scheduled! ⏰'
                  : 'Draft Saved! 💾'}
              </Text>

              <Text style={styles.successDescription}>
                {lastSavedStatus === 'Published'
                  ? 'Your Daily Promise is live and visible immediately to church members on the Home Screen.'
                  : lastSavedStatus === 'Scheduled'
                  ? `Your Daily Promise is scheduled and will automatically go live on ${formatDateDisplay(form.date)} at 12:00 AM.`
                  : 'Your Daily Promise draft is safely saved. It remains private and hidden from members until published.'}
              </Text>

              {/* Summary Details Card */}
              <View style={styles.successDetailsCard}>
                <View style={styles.successDetailRow}>
                  <BookOpen size={14} color="#1a2d5a" />
                  <Text style={styles.successDetailLabel}>Verse:</Text>
                  <Text style={styles.successDetailVal} numberOfLines={1}>
                    {form.enRef || form.teRef || 'Daily Promise'}
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
                  <Text style={styles.successPrimaryBtnTxt}>View Promises List</Text>
                  <ArrowRight size={16} color="#FFFFFF" strokeWidth={2.5} />
                </LinearGradient>
              </TouchableOpacity>

              {/* Secondary Button */}
              <TouchableOpacity 
                style={styles.successSecondaryBtn} 
                onPress={() => setShowSuccess(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.successSecondaryBtnTxt}>Stay & Keep Editing</Text>
              </TouchableOpacity>
            </View>
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
  statusOptionTitleActive: {
    color: '#1a2d5a',
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
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  successSecondaryBtn: {
    marginTop: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  successSecondaryBtnTxt: {
    color: '#64748B',
    fontSize: 12.5,
    fontWeight: '600',
  },

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

  // ─── Daily Promise Dedicated Devotional Thumbnail ─────────────────────────
  landscapeBadge: {
    backgroundColor: '#DEF7EC',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginLeft: 'auto',
  },
  landscapeBadgeTxt: { color: '#03543F', fontSize: 10, fontWeight: '700' },
  promiseThumbnailFrame: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#1E192B',
    position: 'relative',
    borderWidth: 2,
    marginBottom: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  promiseMainLayout: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 5,
    zIndex: 10,
  },
  promiseTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 4,
  },
  promiseLogoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flex: 1,
    marginRight: 6,
  },
  promiseChurchLogo: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.2,
    borderColor: 'rgba(255,255,255,0.9)',
    backgroundColor: '#fff',
  },
  promiseLogoFallback: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  promiseChurchLogoCross: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '900',
  },
  promiseChurchName: {
    color: '#FFFFFF',
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 0.6,
    fontFamily: SERIF,
  },
  promiseSubHeaderTxt: {
    color: '#FDE68A',
    fontSize: 6.0,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  promiseDatePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(245, 158, 11, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.65)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
    flexShrink: 0,
  },
  promiseDateTxt: {
    color: '#FFFFFF',
    fontSize: 7.0,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  promiseCenterCard: {
    flex: 1,
    marginHorizontal: 4,
    marginVertical: 2,
    backgroundColor: 'rgba(15, 8, 26, 0.72)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.55)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    justifyContent: 'space-between',
    alignItems: 'center',
    overflow: 'hidden',
  },
  promiseRibbonPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 1.5,
    borderRadius: 999,
    marginBottom: 2,
  },
  promiseRibbonTxt: {
    color: '#211A2E',
    fontSize: 6.2,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  promiseQuoteContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
    flexShrink: 1,
  },
  promiseQuoteLineWrap: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  promiseQuoteTelugu: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 14.5,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  promiseQuoteTeluguRef: {
    fontSize: 8.8,
    fontWeight: '800',
    color: '#F59E0B',
  },
  promiseDividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    width: '50%',
    marginVertical: 1.5,
  },
  promiseDividerLine: {
    flex: 1,
    height: 1,
    opacity: 0.6,
  },
  promiseDividerCross: {
    fontSize: 7,
    color: '#F59E0B',
  },
  promiseQuoteEnglish: {
    fontSize: 8.0,
    fontStyle: 'italic',
    fontWeight: '700',
    color: '#FEF3C7',
    textAlign: 'center',
    lineHeight: 11.5,
    fontFamily: SERIF,
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  promiseQuoteEnglishRef: {
    fontSize: 7.5,
    fontWeight: '800',
    color: '#FCD34D',
  },
  promiseTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 1,
  },
  promiseTagTxt: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: 6.0,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  promiseBottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 4,
  },
  promisePhonePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2.5,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 999,
    borderWidth: 0.8,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  promisePhoneTxt: {
    color: '#fff',
    fontSize: 6.2,
    fontWeight: '700',
  },
  promiseWelcomeScript: {
    fontSize: 8.5,
    fontStyle: 'italic',
    fontWeight: '700',
    color: '#F59E0B',
    fontFamily: SERIF,
  },
  thumbActionContainer: {
    marginTop: 10,
    gap: 8,
  },
  thumbActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  btnThumbAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 11,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1.2,
    minHeight: 44,
  },
  btnThumbActionPrimary: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  btnThumbActionPrimaryTxt: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#1E3A8A',
  },
  btnThumbActionSuccess: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  btnThumbActionSuccessTxt: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#15803D',
  },
  btnThumbActionSub: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: 8,
    borderRadius: 9,
    borderWidth: 1,
    minHeight: 38,
  },
  btnThumbActionSecondary: {
    backgroundColor: '#F9FAFB',
    borderColor: '#E5E7EB',
  },
  btnThumbActionSecondaryTxt: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#374151',
  },
  btnThumbActionDanger: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  btnThumbActionDangerTxt: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#DC2626',
  },
  btnGenerateHeroThumb: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#1E3A8A',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    shadowColor: '#1E3A8A',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  btnGenerateHeroThumbTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
  btnGenerateHeroThumbSub: {
    color: '#BFDBFE',
    fontSize: 11,
    marginTop: 2,
  },
  btnUploadThumbSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FAFAF9',
    borderRadius: 10,
    paddingVertical: 11,
    borderWidth: 1.2,
    borderColor: '#D9D3C7',
    borderStyle: 'dashed',
  },
  btnUploadThumbSecondaryTxt: {
    color: '#4B5563',
    fontSize: 12.5,
    fontWeight: '700',
  },

  // ─── Color & Gradient Theme Selector Styles ───────────────────────────────
  colorPickerSection: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    marginTop: 14,
  },
  colorPickerHeaderTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  chevronWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorPickerExpandedContent: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 12,
  },
  thumbnailGeneratingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.78)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 14,
    gap: 10,
    zIndex: 20,
  },
  thumbnailGeneratingTxt: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  colorPickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  colorPickerTitleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginRight: 6,
  },
  colorPickerTitle: {
    flex: 1,
    fontSize: 11.5,
    fontWeight: '800',
    color: '#1a2d5a',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  colorActiveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  colorActiveIndicatorTxt: {
    fontSize: 10,
    fontWeight: '700',
    color: '#374151',
  },
  colorModeTabs: {
    flexDirection: 'row',
    backgroundColor: '#EEF2F6',
    borderRadius: 8,
    padding: 2.5,
    marginBottom: 12,
    gap: 3,
  },
  colorModeTab: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
  },
  colorModeTabActive: {
    backgroundColor: '#1a2d5a',
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  colorModeTabTxt: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  colorModeTabTxtActive: {
    color: '#FFFFFF',
  },
  solidColorContainer: {},
  familyTabsScroll: {
    marginBottom: 10,
  },
  familyTabsContent: {
    gap: 6,
    paddingVertical: 2,
  },
  familyTabChip: {
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    borderRadius: 999,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  familyTabChipActive: {
    backgroundColor: '#1a2d5a',
    borderColor: '#1a2d5a',
  },
  familyTabChipTxt: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#64748B',
  },
  familyTabChipTxtActive: {
    color: '#FFFFFF',
  },
  swatchGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },
  swatchCard: {
    width: '23%',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 6,
    alignItems: 'center',
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
  },
  swatchCardSelected: {
    borderColor: '#1a2d5a',
    backgroundColor: '#F0F5FF',
    transform: [{ scale: 1.03 }],
  },
  swatchCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  swatchLabel: {
    fontSize: 8.5,
    fontWeight: '700',
    color: '#374151',
    textAlign: 'center',
  },
  gradientContainer: {},
  subHintTxt: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 10,
    fontWeight: '500',
  },
  gradientGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  gradientCard: {
    width: '48.5%',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 6,
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
  },
  gradientCardSelected: {
    borderColor: '#1a2d5a',
    backgroundColor: '#F0F5FF',
  },
  gradientPill: {
    height: 24,
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  gradientCheckWrap: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradientCardTxt: {
    fontSize: 10,
    fontWeight: '700',
    color: '#374151',
    textAlign: 'center',
  },
  gradientCardTxtSelected: {
    color: '#1a2d5a',
  },
  customColorContainer: {},
  customSubTabs: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  customSubTab: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  customSubTabActive: {
    backgroundColor: '#1a2d5a',
    borderColor: '#1a2d5a',
  },
  customSubTabTxt: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#4B5563',
  },
  customSubTabTxtActive: {
    color: '#fff',
  },
  customSolidBox: {},
  customGradBox: {},
  inputLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#374151',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 5,
  },
  hexInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  hexPreviewCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  hexTextInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 7,
    paddingHorizontal: 10,
    paddingVertical: 7,
    fontSize: 12.5,
    fontWeight: '700',
    color: '#1a2d5a',
  },
  btnApplyCustom: {
    backgroundColor: '#1a2d5a',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnApplyCustomTxt: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  quickSpectrumRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  spectrumDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  spectrumDotActive: {
    borderWidth: 2.5,
    borderColor: '#1a2d5a',
    transform: [{ scale: 1.15 }],
  },
  customGradPreviewBar: {
    height: 32,
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  customGradPreviewTxt: {
    color: '#fff',
    fontSize: 10.5,
    fontWeight: '800',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },

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

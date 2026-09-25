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
  Image,
  KeyboardAvoidingView,
  Vibration,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import ViewShot from 'react-native-view-shot';
import * as Clipboard from 'expo-clipboard';
import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import * as ImagePicker from 'expo-image-picker';
import {
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Wand2,
  Calendar as CalendarIcon,
  User,
  Image as ImageIcon,
  Download,
  CheckSquare,
  RefreshCw,
  X,
  CheckCircle2,
  Sparkles,
  BookOpen,
  Check,
  Share2,
  Trash2,
  Search,
  Eye,
  Layers,
  MapPin,
  Clock,
  Mic,
  Phone,
  Upload,
  Heart,
  Palette,
  Type,
  Minus,
  Plus
} from 'lucide-react-native';
import { AdminTabContext } from '../../context/AdminTabContext';
import { useChurch } from '../../context/ChurchContext';
import AIService from '../../services/AIService';
import FirestoreService from '../../services/FirestoreService';
import { BibleService } from '../../services/BibleService';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import {
  hexToRgba,
  darkenHex,
  getLuminance,
  COLOR_FAMILIES,
  GRADIENT_PRESETS,
  SPECTRUM_SWATCHES
} from '../../utils/ThumbnailColorUtils';
import {
  loadTeluguFonts,
  TELUGU_FONT_OPTIONS,
  getActiveFontFamily,
  isCustomTeluguFont,
  FONT_SIZE_PRESETS,
  TEXT_COLOR_PALETTE,
  TEXT_COLOR_CATEGORIES,
  isDarkColor
} from '../../utils/ThumbnailTypography';

const DEFAULT_PREVIEW_BACKGROUND = 'https://images.unsplash.com/photo-1504052434569-70ad5836ab65?w=1280&q=85';

export interface BibleVersionOption {
  id: string;
  name: string;
  language: 'Telugu' | 'English';
  tag: string;
  description: string;
  apiCode: string;
}

const BIBLE_VERSIONS: BibleVersionOption[] = [
  { id: 'te-bsi', name: 'Telugu (BSI)', language: 'Telugu', tag: 'BSI', description: 'బైబిల్ సొసైటీ ఆఫ్ ఇండియా (ప్రామాణిక శైలి)', apiCode: 'BSI' },
  { id: 'te-erv', name: 'Telugu (ERV)', language: 'Telugu', tag: 'ERV', description: 'సులభ వచన బైబిల్ (Easy-to-Read Version)', apiCode: 'ERV' },
  { id: 'en-kjv', name: 'English (KJV)', language: 'English', tag: 'KJV', description: 'King James Version (Classic Reverent)', apiCode: 'KJV' },
  { id: 'en-niv', name: 'English (NIV)', language: 'English', tag: 'NIV', description: 'New International Version', apiCode: 'NIV' },
  { id: 'en-esv', name: 'English (ESV)', language: 'English', tag: 'ESV', description: 'English Standard Version', apiCode: 'ESV' },
  { id: 'en-nkjv', name: 'English (NKJV)', language: 'English', tag: 'NKJV', description: 'New King James Version', apiCode: 'NKJV' },
];

const LOCAL_TELUGU_BIBLE: any = require('../../../assets/telugu_bible.json');

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

const { width } = Dimensions.get('window');

const TELUGU_MONTHS = [
  'జనవరి', 'ఫిబ్రవరి', 'మార్చి', 'ఏప్రిల్', 'మే', 'జూన్',
  'జూలై', 'ఆగస్టు', 'సెప్టెంబర్', 'అక్టోబర్', 'నవంబర్', 'డిసెంబర్'
];

const ENGLISH_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const formatDate = (date: Date) => {
  return `${ENGLISH_MONTHS[date.getMonth()]} ${String(date.getDate()).padStart(2, '0')}, ${date.getFullYear()}`;
};

const formatDateDisplay = (date: Date, isTelugu: boolean = true) => {
  if (isTelugu) {
    return `${TELUGU_MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  }
  return formatDate(date);
};

// Intelligently formats date ranges:
// - Same date: "సెప్టెంబర్ 13, 2026" (NEVER repeats month or date twice)
// - Same month: "సెప్టెంబర్ 13 - 15, 2026" (NEVER repeats month name twice)
// - Different month: "సెప్టెంబర్ 30 - అక్టోబర్ 2, 2026"
const formatDateRange = (start: Date | null, end: Date | null, isTelugu: boolean = true): string => {
  if (!start && !end) return '';
  if (start && !end) return formatDateDisplay(start, isTelugu);
  if (!start && end) return formatDateDisplay(end, isTelugu);

  const sYear = start!.getFullYear();
  const sMonth = start!.getMonth();
  const sDate = start!.getDate();

  const eYear = end!.getFullYear();
  const eMonth = end!.getMonth();
  const eDate = end!.getDate();

  // Exactly the same day -> show single clean date, no duplication!
  if (sYear === eYear && sMonth === eMonth && sDate === eDate) {
    return formatDateDisplay(start!, isTelugu);
  }

  const sMonthName = isTelugu ? TELUGU_MONTHS[sMonth] : ENGLISH_MONTHS[sMonth];
  const eMonthName = isTelugu ? TELUGU_MONTHS[eMonth] : ENGLISH_MONTHS[eMonth];

  // Same month and year: e.g. "సెప్టెంబర్ 13 - 15, 2026" or "Sep 13 - 15, 2026"
  if (sYear === eYear && sMonth === eMonth) {
    return `${sMonthName} ${sDate} - ${eDate}, ${sYear}`;
  }

  // Same year, different months
  if (sYear === eYear) {
    return `${sMonthName} ${sDate} - ${eMonthName} ${eDate}, ${sYear}`;
  }

  // Different years
  return `${sMonthName} ${sDate}, ${sYear} - ${eMonthName} ${eDate}, ${eYear}`;
};

// Accurate Telugu church time periods:
// - 4:00 AM - 11:59 AM: ఉదయం (Morning)
// - 12:00 PM - 3:59 PM: మధ్యాహ్నం (Afternoon)
// - 4:00 PM - 7:59 PM: సాయంత్రం (Evening - e.g. 7:00 PM)
// - 8:00 PM - 3:59 AM: రాత్రి (Night - e.g. 11:30 PM is night / రాత్రి!)
const getTeluguTimePeriod = (hour24: number): string => {
  if (hour24 >= 4 && hour24 < 12) return 'ఉదయం';
  if (hour24 >= 12 && hour24 < 16) return 'మధ్యాహ్నం';
  if (hour24 >= 16 && hour24 < 20) return 'సాయంత్రం';
  return 'రాత్రి';
};

const formatTime12 = (date: Date) => {
  const h24 = date.getHours();
  const m = String(date.getMinutes()).padStart(2, '0');
  const ampm = h24 >= 12 ? 'PM' : 'AM';
  let h12 = h24 % 12;
  h12 = h12 ? h12 : 12;
  return {
    hour: h12,
    minute: m,
    ampm,
    periodTelugu: getTeluguTimePeriod(h24),
  };
};

const formatTime = (date: Date) => {
  const t = formatTime12(date);
  return `${t.hour}:${t.minute} ${t.ampm}`;
};

const formatTimeTelugu = (date: Date) => {
  const t = formatTime12(date);
  return `${t.periodTelugu} ${t.hour}:${t.minute}`;
};

// Intelligently formats time ranges:
// - Same time: "సాయంత్రం 7:00" (no duplicate)
// - Same period: "సాయంత్రం 5:00 - 7:00" (never repeats "సాయంత్రం" twice!)
// - Different periods: "సాయంత్రం 7:00 - రాత్రి 11:30" (7 PM evening, 11:30 PM night!)
const formatTimeRange = (start: Date | null, end: Date | null, isTelugu: boolean = true): string => {
  if (!start && !end) return '';
  if (start && !end) return isTelugu ? formatTimeTelugu(start) : formatTime(start);
  if (!start && end) return isTelugu ? formatTimeTelugu(end) : formatTime(end);

  const s = formatTime12(start!);
  const e = formatTime12(end!);

  // If start and end time are identical
  if (start!.getHours() === end!.getHours() && start!.getMinutes() === end!.getMinutes()) {
    return isTelugu ? `${s.periodTelugu} ${s.hour}:${s.minute}` : `${s.hour}:${s.minute} ${s.ampm}`;
  }

  if (isTelugu) {
    if (s.periodTelugu === e.periodTelugu) {
      // Same period: e.g. "సాయంత్రం 5:00 - 7:00" or "రాత్రి 8:00 - 10:00"
      return `${s.periodTelugu} ${s.hour}:${s.minute} - ${e.hour}:${e.minute}`;
    }
    // Different periods: e.g. "సాయంత్రం 6:30 - రాత్రి 8:30"
    return `${s.periodTelugu} ${s.hour}:${s.minute} - ${e.periodTelugu} ${e.hour}:${e.minute}`;
  } else {
    if (s.ampm === e.ampm) {
      return `${s.hour}:${s.minute} - ${e.hour}:${e.minute} ${s.ampm}`;
    }
    return `${s.hour}:${s.minute} ${s.ampm} - ${e.hour}:${e.minute} ${e.ampm}`;
  }
};

const SERIF = Platform.OS === 'ios' ? 'Georgia' : 'serif';
const SANS = Platform.OS === 'ios' ? 'System' : 'sans-serif';

// ─── Dynamic Church Content Database ──────────────────────────────────────────
export interface ScriptureVariation {
  themeTitleTelugu?: string;
  themeTitleEnglish?: string;
  verseTextTelugu: string;
  verseRefTelugu: string;
  verseTextEnglish: string;
  verseRefEnglish: string;
  taglineTelugu?: string;
  taglineEnglish?: string;
}

export interface DynamicChurchData {
  teluguTitle: string;
  englishTitle: string;
  tagline: string;
  taglineTelugu?: string;
  verseTextTelugu: string;
  verseRefTelugu: string;
  verseTextEnglish: string;
  verseRefEnglish: string;
  primaryColor: string;
  accentColor: string;
  visualSubject: string;
  visualVariations?: string[];
  scriptureVariations?: ScriptureVariation[];
}

const DYNAMIC_CHURCH_CONTENT: Record<string, DynamicChurchData> = {
  'Bible Study': {
    teluguTitle: 'బైబిల్ అధ్యయనం',
    englishTitle: 'BIBLE STUDY',
    tagline: 'DISCOVER THE WORD OF TRUTH',
    taglineTelugu: 'సత్య వాక్య పరిచర్య',
    verseTextTelugu: 'నీ వాక్యము నా పాదములకు దీపమును, నా త్రోవకు వెలుగునై యున్నది',
    verseRefTelugu: 'కీర్తనలు 119:105',
    verseTextEnglish: 'Your word is a lamp to my feet and a light to my path',
    verseRefEnglish: 'PSALM 119:105',
    primaryColor: '#3B225C',
    accentColor: '#E3A83B',
    visualSubject: 'aesthetic open Holy Bible on wooden pulpit, warm candlelight glow, sacred church background, scripture focus',
    visualVariations: [
      'aesthetic open Holy Bible on wooden pulpit, warm candlelight glow, sacred church background, scripture focus',
      'macro close-up of open Holy Bible pages with golden sunlight streaming across sacred verses, soft bokeh depth of field',
      'holy scripture open on antique church altar, glowing stained glass window reflections in background, reverent light',
      'peaceful church study sanctuary, Holy Bible bathed in morning light rays, wooden desk with gentle olive branch',
      'dramatic cinematic composition of holy scripture on communion table with warm golden church bokeh',
      'illuminated open Bible on church podium, sacred cathedral background with soft spiritual illumination'
    ],
    scriptureVariations: [
      {
        themeTitleTelugu: 'బైబిల్ అధ్యయనం',
        themeTitleEnglish: 'BIBLE STUDY',
        verseRefTelugu: 'కీర్తనలు 119:105',
        verseTextTelugu: 'నీ వాక్యము నా పాదములకు దీపమును, నా త్రోవకు వెలుగునై యున్నది',
        verseRefEnglish: 'PSALM 119:105',
        verseTextEnglish: 'Your word is a lamp to my feet and a light to my path',
        taglineTelugu: 'సత్య వాక్య పరిచర్య',
        taglineEnglish: 'DISCOVER THE WORD OF TRUTH'
      },
      {
        themeTitleTelugu: 'దైవప్రేరిత వాక్యం',
        themeTitleEnglish: 'GOD-BREATHED SCRIPTURE',
        verseRefTelugu: '2 తిమోతికి 3:16',
        verseTextTelugu: 'దైవజనుడు సిద్ధపడి యుండునట్లు లేఖనమంతయు దైవప్రేరితమై యున్నది',
        verseRefEnglish: '2 TIMOTHY 3:16',
        verseTextEnglish: 'All Scripture is God-breathed and useful for teaching and rebuking',
        taglineTelugu: 'దైవప్రేరిత సత్య వాక్యం',
        taglineEnglish: 'EQUIPPED BY GOD\'S WORD'
      },
      {
        themeTitleTelugu: 'సజీవ దేవుని వాక్యం',
        themeTitleEnglish: 'LIVING & ACTIVE WORD',
        verseRefTelugu: 'హెబ్రీయులకు 4:12',
        verseTextTelugu: 'దేవుని వాక్యము సజీవమైనదై బలముగలదై రెండంచులుగల ఖడ్గముకంటెను వాడిగా ఉన్నది',
        verseRefEnglish: 'HEBREWS 4:12',
        verseTextEnglish: 'For the word of God is alive and active, sharper than any double-edged sword',
        taglineTelugu: 'సజీవమైన దేవుని వాక్యం',
        taglineEnglish: 'LIVING AND POWERFUL WORD'
      },
      {
        themeTitleTelugu: 'వాక్య ధ్యానం • విజయం',
        themeTitleEnglish: 'MEDITATE ON THE WORD',
        verseRefTelugu: 'యెహోషువ 1:8',
        verseTextTelugu: 'ఈ ధర్మశాస్త్ర గ్రంథమును నీ నోటినుండి తొలగిపోనియ్యక రాత్రింబగళ్లు దాని ధ్యానింపవలెను',
        verseRefEnglish: 'JOSHUA 1:8',
        verseTextEnglish: 'Meditate on the Book of the Law day and night, then you will have success',
        taglineTelugu: 'వాక్య ధ్యానం • విజయం',
        taglineEnglish: 'MEDITATE ON GOD\'S WORD'
      },
      {
        themeTitleTelugu: 'జీవవాక్యాహారం',
        themeTitleEnglish: 'BREAD OF LIFE',
        verseRefTelugu: 'మత్తయి 4:4',
        verseTextTelugu: 'మనుష్యుడు రొట్టెవలన మాత్రమే కాదుగాని దేవుని నోటనుండి వచ్చు ప్రతిమాటవలన జీవించును',
        verseRefEnglish: 'MATTHEW 4:4',
        verseTextEnglish: 'Man shall not live on bread alone, but on every word from the mouth of God',
        taglineTelugu: 'జీవవాక్యాహారం',
        taglineEnglish: 'BREAD OF ETERNAL LIFE'
      },
      {
        themeTitleTelugu: 'క్రీస్తు వాక్య సమృద్ధి',
        themeTitleEnglish: 'CHRIST DWELLING RICHLY',
        verseRefTelugu: 'కొలొస్సయులకు 3:16',
        verseTextTelugu: 'సంగీతములతోను కీర్తనలతోను క్రీస్తు వాక్యము మీలో సమృద్ధిగా నివసింపనీయుడి',
        verseRefEnglish: 'COLOSSIANS 3:16',
        verseTextEnglish: 'Let the message of Christ dwell among you richly as you teach one another',
        taglineTelugu: 'క్రీస్తు వాక్య సమృద్ధి',
        taglineEnglish: 'CHRIST DWELLING RICHLY'
      }
    ],
  },
  'Sunday Worship': {
    teluguTitle: 'ఆదివారపు ఆరాధన',
    englishTitle: 'SUNDAY WORSHIP',
    tagline: 'WORSHIP • WORD • FELLOWSHIP',
    taglineTelugu: 'ఆరాధన • వాక్యం • సహవాసం',
    verseTextTelugu: 'సంతోషముతో యెహోవాను సేవించుడి; ఉత్సాహగానము చేయుచు ఆయన సన్నిధికి రండి',
    verseRefTelugu: 'కీర్తనలు 100:2',
    verseTextEnglish: 'Serve the Lord with gladness; come before His presence with singing',
    verseRefEnglish: 'PSALM 100:2',
    primaryColor: '#1A2744',
    accentColor: '#E3A83B',
    visualSubject: 'majestic church sanctuary, radiant golden cross on altar stage, warm worship lighting, sacred church',
    visualVariations: [
      'majestic church sanctuary, radiant golden cross on altar stage, warm worship lighting, sacred church',
      'grand church sanctuary auditorium with atmospheric stage illumination and glowing silhouette cross',
      'cathedral arches with morning sunlight streaming through stained glass onto the communion altar',
      'cinematic perspective of church worship podium with soft heavenly light and modern church interior',
      'peaceful morning church altar illuminated by golden volumetric light rays, sacred sanctuary atmosphere'
    ],
    scriptureVariations: [
      {
        themeTitleTelugu: 'ఆదివారపు ఆరాధన',
        themeTitleEnglish: 'SUNDAY WORSHIP',
        verseRefTelugu: 'కీర్తనలు 100:2',
        verseTextTelugu: 'సంతోషముతో యెహోవాను సేవించుడి; ఉత్సాహగానము చేయుచు ఆయన సన్నిధికి రండి',
        verseRefEnglish: 'PSALM 100:2',
        verseTextEnglish: 'Serve the Lord with gladness; come before His presence with singing',
        taglineTelugu: 'ఆరాధన • వాక్యం • సహవాసం',
        taglineEnglish: 'WORSHIP • WORD • FELLOWSHIP'
      },
      {
        themeTitleTelugu: 'ఆత్మతో సత్యముతో ఆరాధన',
        themeTitleEnglish: 'WORSHIP IN SPIRIT & TRUTH',
        verseRefTelugu: 'యోహాను 4:24',
        verseTextTelugu: 'దేవుడు ఆత్మయై యున్నాడు; ఆయనను ఆరాధించువారు ఆత్మతోను సత్యముతోను ఆరాధింపవలెను',
        verseRefEnglish: 'JOHN 4:24',
        verseTextEnglish: 'God is spirit, and His worshipers must worship in the Spirit and in truth',
        taglineTelugu: 'ఆత్మతోను సత్యముతోను ఆరాధన',
        taglineEnglish: 'WORSHIP IN SPIRIT & TRUTH'
      },
      {
        themeTitleTelugu: 'స్తుతికి పాత్రుడు మన దేవుడు',
        themeTitleEnglish: 'BOW BEFORE OUR MAKER',
        verseRefTelugu: 'కీర్తనలు 95:6',
        verseTextTelugu: 'రండి నమస్కారము చేసి సాగిలపడుదము; మనలను సృజించిన యెహోవా సన్నిధిని మోకాళ్లూరుదము',
        verseRefEnglish: 'PSALM 95:6',
        verseTextEnglish: 'Come, let us bow down in worship, let us kneel before the Lord our Maker',
        taglineTelugu: 'స్తుతికి పాత్రుడు మన దేవుడు',
        taglineEnglish: 'BOW BEFORE OUR MAKER'
      },
      {
        themeTitleTelugu: 'మందిరములో ఆనందం',
        themeTitleEnglish: 'JOY IN GOD\'S HOUSE',
        verseRefTelugu: 'కీర్తనలు 122:1',
        verseTextTelugu: 'యెహోవా మందిరమునకు వెళ్లుదమని జనులు నాతో అనినప్పుడు నేను సంతోషించితిని',
        verseRefEnglish: 'PSALM 122:1',
        verseTextEnglish: 'I rejoiced with those who said to me, Let us go to the house of the Lord',
        taglineTelugu: 'దేవుని మందిరములో ఆనందం',
        taglineEnglish: 'JOY IN THE HOUSE OF GOD'
      },
      {
        themeTitleTelugu: 'పరిశుద్ధ ఆరాధన మహోత్సవం',
        themeTitleEnglish: 'BEAUTY OF HOLINESS',
        verseRefTelugu: 'కీర్తనలు 29:2',
        verseTextTelugu: 'యెహోవా నామమునకు చెందవలసిన ప్రభావమును ఆయనకు చెల్లించుడి; పరిశుద్ధాలంకారములు ధరించి ఆయనను ఆరాధించుడి',
        verseRefEnglish: 'PSALM 29:2',
        verseTextEnglish: 'Ascribe to the Lord the glory due His name; worship the Lord in the beauty of holiness',
        taglineTelugu: 'పరిశుద్ధాలంకారములతో ఆరాధన',
        taglineEnglish: 'WORSHIP IN BEAUTY OF HOLINESS'
      }
    ],
  },
  'Prayer Meeting': {
    teluguTitle: 'ప్రార్థన కూటం',
    englishTitle: 'MIDWEEK PRAYER MEETING',
    tagline: 'PRAYER MOVES THE HAND OF GOD',
    taglineTelugu: 'ప్రార్థన శక్తివంతమైనది',
    verseTextTelugu: 'నీతిమంతుని విజ్ఞాపన మనఃపూర్వకమైనదై బహు బలము గలదై యుండును',
    verseRefTelugu: 'యాకోబు 5:16',
    verseTextEnglish: 'The effective, fervent prayer of a righteous person avails much',
    verseRefEnglish: 'JAMES 5:16',
    primaryColor: '#1E293B',
    accentColor: '#38BDF8',
    visualSubject: 'serene praying hands, golden heavenly morning rays, peaceful sanctuary',
    visualVariations: [
      'serene praying hands, golden heavenly morning rays, peaceful sanctuary',
      'sacred church prayer altar with glowing candles, open scriptures, warm spiritual atmosphere',
      'hands lifted in humble prayer with heavenly sunbeams illuminating the church auditorium',
      'quiet reverent church chapel with soft amber illumination, intimate prayer gathering atmosphere'
    ],
    scriptureVariations: [
      {
        themeTitleTelugu: 'ప్రార్థన కూటం',
        themeTitleEnglish: 'MIDWEEK PRAYER MEETING',
        verseRefTelugu: 'యాకోబు 5:16',
        verseTextTelugu: 'నీతిమంతుని విజ్ఞాపన మనఃపూర్వకమైనదై బహు బలము గలదై యుండును',
        verseRefEnglish: 'JAMES 5:16',
        verseTextEnglish: 'The effective, fervent prayer of a righteous person avails much',
        taglineTelugu: 'ప్రార్థన శక్తివంతమైనది',
        taglineEnglish: 'PRAYER MOVES THE HAND OF GOD'
      },
      {
        themeTitleTelugu: 'విజ్ఞాపన ప్రార్థన కూటం',
        themeTitleEnglish: 'INTERCESSORY PRAYER',
        verseRefTelugu: 'ఫిలిప్పీయులకు 4:6',
        verseTextTelugu: 'దేనినిగూర్చియు చింతపడకుడి గాని ప్రతి విషయములోను కృతజ్ఞతాపూర్వకముగా మీ విన్నపములను దేవునికి తెలియజేయుడి',
        verseRefEnglish: 'PHILIPPIANS 4:6',
        verseTextEnglish: 'Do not be anxious about anything, but in every situation present your requests to God',
        taglineTelugu: 'సమస్త విషయములలో ప్రార్థన',
        taglineEnglish: 'PRAYER WITH THANKSGIVING'
      },
      {
        themeTitleTelugu: 'జయమిచ్చు ప్రార్థన',
        themeTitleEnglish: 'VICTORIOUS PRAYER NIGHT',
        verseRefTelugu: '1 థెస్సలొనీకయులకు 5:17',
        verseTextTelugu: 'ఎడతెగక ప్రార్థన చేయుడి; ప్రతి విషయమునందును కృతజ్ఞతాస్తుతులు చెల్లించుడి',
        verseRefEnglish: '1 THESSALONIANS 5:17',
        verseTextEnglish: 'Pray continually, give thanks in all circumstances',
        taglineTelugu: 'ఎడతెగక ప్రార్థన చేయుడి',
        taglineEnglish: 'PRAY WITHOUT CEASING'
      },
      {
        themeTitleTelugu: 'సన్నిధిలో మొఱ్ఱపెట్టుట',
        themeTitleEnglish: 'CALL UNTO THE LORD',
        verseRefTelugu: 'యిర్మీయా 33:3',
        verseTextTelugu: 'నాకు మొఱ్ఱపెట్టుము నేను నీకు ఉత్తరమిచ్చెదను, నీవు గ్రహింపలేని గొప్ప సంగతులను నీకు తెలియజేతును',
        verseRefEnglish: 'JEREMIAH 33:3',
        verseTextEnglish: 'Call to Me and I will answer you and tell you great and unsearchable things',
        taglineTelugu: 'ఆయన జవాబిచ్చు దేవుడు',
        taglineEnglish: 'HE HEARS AND REVEALS'
      }
    ]
  },
  'Fasting Prayer': {
    teluguTitle: 'ఉపవాస ప్రార్థన',
    englishTitle: 'FASTING & PRAYER',
    tagline: 'SEEKING GOD WITH ALL OUR HEART',
    taglineTelugu: 'ఉపవాస ప్రార్థన కూటం',
    verseTextTelugu: 'మీరు నన్ను వెదకినయెడల, పూర్ణహృదయముతో నన్ను గూర్చి విచారించినయెడల నన్ను కనుగొందురు',
    verseRefTelugu: 'యిర్మీయా 29:13',
    verseTextEnglish: 'You will seek Me and find Me when you search for Me with all your heart',
    verseRefEnglish: 'JEREMIAH 29:13',
    primaryColor: '#2E1A47',
    accentColor: '#F59E0B',
    visualSubject: 'reverent praying hands, open Bible, glowing silhouette cross, deep spiritual worship atmosphere',
    visualVariations: [
      'reverent praying hands, open Bible, glowing silhouette cross, deep spiritual worship atmosphere',
      'solitary mountain cross silhouetted against glowing golden sunrise, atmospheric holy contemplation',
      'reverent Christian believer in prayer kneeling before church altar bathed in heavenly shaft of light',
      'folded hands on Holy Bible with warm ambient candle glow, quiet solitude seeking God'
    ],
    scriptureVariations: [
      {
        themeTitleTelugu: 'ఉపవాస ప్రార్థన',
        themeTitleEnglish: 'FASTING & PRAYER',
        verseRefTelugu: 'యిర్మీయా 29:13',
        verseTextTelugu: 'మీరు నన్ను వెదకినయెడల, పూర్ణహృదయముతో నన్ను గూర్చి విచారించినయెడల నన్ను కనుగొందురు',
        verseRefEnglish: 'JEREMIAH 29:13',
        verseTextEnglish: 'You will seek Me and find Me when you search for Me with all your heart',
        taglineTelugu: 'పూర్ణహృదయముతో దేవుని వెదకుట',
        taglineEnglish: 'SEEKING GOD WITH ALL OUR HEART'
      },
      {
        themeTitleTelugu: 'కన్నీటి ప్రార్థన • గొప్ప విడుదల',
        themeTitleEnglish: 'PRAYER WITH FASTING & TEARS',
        verseRefTelugu: 'యోవేలు 2:12',
        verseTextTelugu: 'ఇప్పుడైనను మీరు ఉపవాసముండి కన్నీరు విడుచుచు దుఃఖించుచు పూర్ణహృదయముతో నాయొద్దకు తిరుగుడి',
        verseRefEnglish: 'JOEL 2:12',
        verseTextEnglish: 'Even now, return to Me with all your heart, with fasting, weeping and mourning',
        taglineTelugu: 'ఉపవాసముండి విలాపముతో రండి',
        taglineEnglish: 'RETURN TO GOD WITH FASTING'
      },
      {
        themeTitleTelugu: 'కట్లన్నియు విప్పు ఉపవాసం',
        themeTitleEnglish: 'THE FAST GOD CHOOSES',
        verseRefTelugu: 'యెషయా 58:6',
        verseTextTelugu: 'దుర్మార్గులు కట్టిన కట్లను విప్పుటయు, కాడిమాను మోకులను తీయుటయు కాదా నేను ఏర్పరచుకొనిన ఉపవాసము?',
        verseRefEnglish: 'ISAIAH 58:6',
        verseTextEnglish: 'Is not this the fast that I have chosen: to loose the chains of injustice?',
        taglineTelugu: 'దేవుడు కోరుకున్న ఉపవాసం',
        taglineEnglish: 'BREAKING EVERY YOKE'
      },
      {
        themeTitleTelugu: 'బలమైన ఆత్మీయ పునరుజ్జీవం',
        themeTitleEnglish: 'SPIRITUAL RENEWAL & POWER',
        verseRefTelugu: 'మత్తయి 17:21',
        verseTextTelugu: 'ఈ విధమైనది ప్రార్థన వలనను ఉపవాసము వలనను తప్ప మరి దేనివలనను వదిలిపోదు',
        verseRefEnglish: 'MATTHEW 17:21',
        verseTextEnglish: 'However, this kind does not go out except by prayer and fasting',
        taglineTelugu: 'ప్రార్థన ఉపవాసముల ద్వారా జయం',
        taglineEnglish: 'VICTORY THROUGH FASTING & PRAYER'
      }
    ]
  },
  "Women's Fasting Prayer": {
    teluguTitle: 'మహిళల ఉపవాస ప్రార్థన',
    englishTitle: "WOMEN'S FASTING PRAYER",
    tagline: 'SEEKING GOD IN PRAYER & FASTING',
    taglineTelugu: 'విజ్ఞాపన ప్రార్థన కూటం',
    verseTextTelugu: 'నేనును నా పనికత్తెలును కూడ ఉపవాసముందుము; నేను నశించిన నశించెదను',
    verseRefTelugu: 'ఎస్తేరు 4:16',
    verseTextEnglish: 'I and my attendants will fast as you do. And if I perish, I perish',
    verseRefEnglish: 'ESTHER 4:16',
    primaryColor: '#3D1C4E',
    accentColor: '#F59E0B',
    visualSubject: 'reverent Christian women kneeling in prayer before altar, soft holy morning glow, warm spiritual sanctuary',
    visualVariations: [
      'reverent Christian women kneeling in prayer before altar, soft holy morning glow, warm spiritual sanctuary',
      'graceful hands holding open Holy Bible with gentle roses and soft candle glow in church prayer room',
      'praying women fellowship in sacred church with warm golden light rays filtering through stained glass',
      'serene holy church altar with open scripture, glowing candles, peaceful fasting and prayer atmosphere'
    ],
    scriptureVariations: [
      {
        themeTitleTelugu: 'మహిళల ఉపవాస ప్రార్థన',
        themeTitleEnglish: "WOMEN'S FASTING PRAYER",
        verseRefTelugu: 'ఎస్తేరు 4:16',
        verseTextTelugu: 'నేనును నా పనికత్తెలును కూడ ఉపవాసముందుము; నేను నశించిన నశించెదను',
        verseRefEnglish: 'ESTHER 4:16',
        verseTextEnglish: 'I and my attendants will fast as you do. If I perish, I perish',
        taglineTelugu: 'విశ్వాస విజ్ఞాపన కూటం',
        taglineEnglish: 'SEEKING GOD IN PRAYER & FASTING'
      },
      {
        themeTitleTelugu: 'కన్నీటి విజ్ఞాపన ప్రార్థన',
        themeTitleEnglish: 'FERVENT PRAYER OF FAITH',
        verseRefTelugu: '1 సమూయేలు 1:15',
        verseTextTelugu: 'హన్నా- నేను యెహోవా సన్నిధిని నా హృదయమును కుమ్మరించుకొనుచుంటిని అనెను',
        verseRefEnglish: '1 SAMUEL 1:15',
        verseTextEnglish: 'I was pouring out my soul to the Lord, Hannah replied',
        taglineTelugu: 'ప్రభువు సన్నిధిలో హృదయమును కుమ్మరించుట',
        taglineEnglish: 'POURING OUT OUR HEARTS TO GOD'
      },
      {
        themeTitleTelugu: 'దేవుని సన్నిధిలో ఉపవాసం',
        themeTitleEnglish: 'DEVOTED IN FASTING & PRAYER',
        verseRefTelugu: 'లూకా 2:37',
        verseTextTelugu: 'ఆమె దేవాలయమును విడువక ఉపవాస ప్రార్థనలతో రాత్రింబగళ్లు సేవచేయుచుండెను',
        verseRefEnglish: 'LUKE 2:37',
        verseTextEnglish: 'She never left the temple but worshiped night and day, fasting and praying',
        taglineTelugu: 'రాత్రింబగళ్లు ప్రభువును సేవించుట',
        taglineEnglish: 'NIGHT AND DAY IN HIS PRESENCE'
      },
      {
        themeTitleTelugu: 'ప్రార్థనాపరురాలైన స్త్రీలు',
        themeTitleEnglish: 'WOMEN OF FAITH & POWER',
        verseRefTelugu: 'సామెతలు 31:30',
        verseTextTelugu: 'సౌందర్యము మోసకరము, అందము వ్యర్థము; యెహోవాయందు భయభక్తులుగల స్త్రీ కొనియాడబడును',
        verseRefEnglish: 'PROVERBS 31:30',
        verseTextEnglish: 'Charm is deceptive and beauty is fleeting; but a woman who fears the Lord is to be praised',
        taglineTelugu: 'దైవభక్తిగల ప్రార్థనా వీరులు',
        taglineEnglish: 'A WOMAN WHO FEARS THE LORD'
      }
    ]
  },
  'Holy Communion': {
    teluguTitle: 'పరిశుద్ధ సంస్కార ఆరాధన',
    englishTitle: 'HOLY COMMUNION',
    tagline: 'HOLY COMMUNION',
    taglineTelugu: 'ప్రభువు బల్ల సంస్కార ఆరాధన',
    verseTextTelugu: 'నన్ను జ్ఞాపకము చేసికొనుటకు దీనిని చేయుడి',
    verseRefTelugu: 'లూకా 22:19',
    verseTextEnglish: 'Do this in remembrance of Me',
    verseRefEnglish: 'LUKE 22:19',
    primaryColor: '#5B1527',
    accentColor: '#E3A83B',
    visualSubject: 'holy communion broken loaf of bread on wooden plate, wheat stalks, fresh grapes, ornate golden chalice cup on rustic table, wooden cross draped in purple fabric',
    visualVariations: [
      'holy communion broken loaf of bread on wooden plate, wheat stalks, fresh grapes, ornate golden chalice cup on rustic table, wooden cross draped in purple fabric',
      'sacred silver chalice cup filled with communion wine and unleavened bread on pure linen altar table, soft candlelight',
      'close-up of golden communion chalice with bread, warm ambient glow, deep reverent worship atmosphere',
      'communion table set in sacred church sanctuary with open Bible, chalice cup, and glowing background cross'
    ],
    scriptureVariations: [
      {
        themeTitleTelugu: 'పరిశుద్ధ సంస్కార ఆరాధన',
        themeTitleEnglish: 'HOLY COMMUNION',
        verseRefTelugu: 'లూకా 22:19',
        verseTextTelugu: 'నన్ను జ్ఞాపకము చేసికొనుటకు దీనిని చేయుడి',
        verseRefEnglish: 'LUKE 22:19',
        verseTextEnglish: 'Do this in remembrance of Me',
        taglineTelugu: 'ప్రభువు బల్ల సంస్కార ఆరాధన',
        taglineEnglish: 'IN REMEMBRANCE OF CHRIST'
      },
      {
        themeTitleTelugu: 'క్రీస్తు బలియాగ స్మరణ',
        themeTitleEnglish: 'PROCLAIMING HIS SACRIFICE',
        verseRefTelugu: '1 కొరింథీయులకు 11:26',
        verseTextTelugu: 'మీరు ఈ రొట్టెను తిని ఈ పాత్రలోనిది త్రాగునప్పుడెల్ల ప్రభువు మరణమును ప్రచురించుదురు',
        verseRefEnglish: '1 CORINTHIANS 11:26',
        verseTextEnglish: 'Whenever you eat this bread and drink this cup, you proclaim the Lord\'s death',
        taglineTelugu: 'క్రీస్తు బలియాగ స్మరణ',
        taglineEnglish: 'PROCLAIMING HIS SACRIFICE'
      },
      {
        themeTitleTelugu: 'పరలోక జీవపురొట్టె',
        themeTitleEnglish: 'THE BREAD OF HEAVEN',
        verseRefTelugu: 'యోహాను 6:35',
        verseTextTelugu: 'యేసు వారితో అనెను—నేనే జీవపురొట్టెను; నాయొద్దకు వచ్చువాడు ఏమాత్రమును ఆకలిగొనడు',
        verseRefEnglish: 'JOHN 6:35',
        verseTextEnglish: 'I am the bread of life; whoever comes to Me will never go hungry',
        taglineTelugu: 'పరలోక జీవపురొట్టె',
        taglineEnglish: 'THE BREAD OF HEAVEN'
      },
      {
        themeTitleTelugu: 'నూతన నిబంధన రక్తము',
        themeTitleEnglish: 'NEW COVENANT IN HIS BLOOD',
        verseRefTelugu: 'మత్తయి 26:28',
        verseTextTelugu: 'ఇది నా రక్తము, అనగా పాపక్షమాపణ నిమిత్తము అనేకుల కొరకు చిందింపబడుచున్న నిబంధన రక్తము',
        verseRefEnglish: 'MATTHEW 26:28',
        verseTextEnglish: 'This is My blood of the covenant, which is poured out for many for forgiveness',
        taglineTelugu: 'పాపక్షమాపణ కొరకు చిందింపబడినది',
        taglineEnglish: 'POURED OUT FOR FORGIVENESS'
      }
    ],
  },
  'Youth Meeting': {
    teluguTitle: 'యవ్వనస్థుల కూటం',
    englishTitle: 'YOUTH IMPACT SERVICE',
    tagline: 'ROOTED IN FAITH • SHINING FOR CHRIST',
    taglineTelugu: 'యవ్వనస్థుల ప్రత్యేక కూటం',
    verseTextTelugu: 'నీ యౌవనమునుబట్టి ఎవడును నిన్ను తృణీకరింపనియ్యకుము',
    verseRefTelugu: '1 తిమోతికి 4:12',
    verseTextEnglish: 'Let no one despise your youth, but be an example to believers',
    verseRefEnglish: '1 TIMOTHY 4:12',
    primaryColor: '#0F172A',
    accentColor: '#F59E0B',
    visualSubject: 'contemporary Christian worship stage, glowing ambient lighting, modern youth church aesthetic',
    visualVariations: [
      'contemporary Christian worship stage, glowing ambient lighting, modern youth church aesthetic',
      'modern church stage with vibrant cinematic stage lights, glowing cross silhouette, dynamic youth atmosphere',
      'inspiring contemporary youth worship setting with warm neon ambient glow, high-end church production',
      'creative Christian youth ministry hall with aesthetic warm string lights, acoustic guitars, and open Bible'
    ],
    scriptureVariations: [
      {
        themeTitleTelugu: 'యవ్వనస్థుల కూటం',
        themeTitleEnglish: 'YOUTH IMPACT SERVICE',
        verseRefTelugu: '1 తిమోతికి 4:12',
        verseTextTelugu: 'నీ యౌవనమునుబట్టి ఎవడును నిన్ను తృణీకరింపనియ్యకుము; మాటలోను, ప్రవర్తనలోను మాదిరిగా ఉండుము',
        verseRefEnglish: '1 TIMOTHY 4:12',
        verseTextEnglish: 'Let no one despise your youth, but be an example to believers',
        taglineTelugu: 'విశ్వాసులకు మాదిరిగా ఉండుము',
        taglineEnglish: 'AN EXAMPLE TO BELIEVERS'
      },
      {
        themeTitleTelugu: 'నూతన తరం ఆరాధన',
        themeTitleEnglish: 'CHOSEN GENERATION',
        verseRefTelugu: '1 పేతురు 2:9',
        verseTextTelugu: 'మీరు చీకటిలోనుండి తన ఆశ్చర్యకరమైన వెలుగులోనికి పిలిచినవాని గుణాతిశయములను ప్రచురము చేయు ఏర్పరచబడిన వంశము',
        verseRefEnglish: '1 PETER 2:9',
        verseTextEnglish: 'You are a chosen people, called out of darkness into His marvelous light',
        taglineTelugu: 'ఆయన ఆశ్చర్యకరమైన వెలుగు',
        taglineEnglish: 'CALLED INTO HIS LIGHT'
      },
      {
        themeTitleTelugu: 'యవ్వనమందు సృష్టికర్తను స్మరించు',
        themeTitleEnglish: 'REMEMBER YOUR CREATOR',
        verseRefTelugu: 'ప్రసంగి 12:1',
        verseTextTelugu: 'దుర్దినములు రాకమునుపే నీ యౌవనదినములందే నీ సృష్టికర్తను స్మరణకు తెచ్చుకొనుము',
        verseRefEnglish: 'ECCLESIASTES 12:1',
        verseTextEnglish: 'Remember your Creator in the days of your youth, before the difficult days come',
        taglineTelugu: 'దేవుని మహిమార్థమై యవ్వనం',
        taglineEnglish: 'DEDICATED IN YOUTH'
      },
      {
        themeTitleTelugu: 'క్రీస్తు కోసం ప్రకాశించు',
        themeTitleEnglish: 'SHINE LIKE STARS',
        verseRefTelugu: 'ఫిలిప్పీయులకు 2:15',
        verseTextTelugu: 'మీరు లోకమందు జ్యోతులవలె కనబడుచున్నారు; జీవవాక్యమును చేతపట్టుకొని నిర్దోషులుగా ఉండుడి',
        verseRefEnglish: 'PHILIPPIANS 2:15',
        verseTextEnglish: 'You shine among them like stars in the sky as you hold firmly to the word of life',
        taglineTelugu: 'జీవవాక్యమును చేతపట్టుకొనుడి',
        taglineEnglish: 'HOLDING FIRM TO THE WORD'
      }
    ]
  },
  'Daily Promise Card': {
    teluguTitle: 'నేటి దేవుని వాగ్దానం',
    englishTitle: 'DAILY PROMISE',
    tagline: 'I WILL SATISFY HIM WITH LONG LIFE',
    taglineTelugu: 'దీర్ఘాయువునిచ్చు దేవుని వాగ్దానం',
    verseTextTelugu: 'దీర్ఘాయువు చేత అతనిని తృప్తిపరచెదను',
    verseRefTelugu: 'కీర్తనల గ్రంథము 91:16',
    verseTextEnglish: 'I will satisfy him with long life',
    verseRefEnglish: 'Psalm 91:16',
    primaryColor: '#2B1238',
    accentColor: '#F59E0B',
    visualSubject: 'peaceful serene morning sunrise breaking over golden wheat field, radiant divine sunbeams, open Holy Bible bathed in morning dawn light, sacred promise of long life and divine health, cinematic devotional photography',
    visualVariations: [
      'peaceful serene morning sunrise breaking over golden wheat field, radiant divine sunbeams, open Holy Bible bathed in morning dawn light, sacred promise of long life and divine health, cinematic devotional photography',
      'dramatic heavenly golden rays illuminating mountain summit, open scripture with glowing promises of God, majestic morning light',
      'serene church altar in morning sunlight, open Holy Bible with olive branch of peace and long life',
      'heavenly golden sunrise over calm waters with divine sunbeams and reverent Christian devotional ambiance'
    ],
    scriptureVariations: [
      {
        themeTitleTelugu: 'నేటి దేవుని వాగ్దానం',
        themeTitleEnglish: 'DAILY PROMISE',
        verseRefTelugu: 'కీర్తనల గ్రంథము 91:16',
        verseTextTelugu: 'దీర్ఘాయువు చేత అతనిని తృప్తిపరచెదను',
        verseRefEnglish: 'Psalm 91:16',
        verseTextEnglish: 'I will satisfy him with long life',
        taglineTelugu: 'దీర్ఘాయువునిచ్చు దేవుని వాగ్దానం',
        taglineEnglish: 'I WILL SATISFY HIM WITH LONG LIFE'
      },
      {
        themeTitleTelugu: 'తోడుగా నుండు దేవుని వాగ్దానం',
        themeTitleEnglish: 'FEAR NOT, I AM WITH YOU',
        verseRefTelugu: 'యెషయా 41:10',
        verseTextTelugu: 'నేను నీకు తోడైయున్నాను, భయపడకుము; నేను నీ దేవుడనై యున్నాను, దిగులుపడకుము; నేను నిన్ను బలపరతును',
        verseRefEnglish: 'ISAIAH 41:10',
        verseTextEnglish: 'Fear not, for I am with you; be not dismayed, for I am your God; I will strengthen you',
        taglineTelugu: 'భయపడకుము నేను నీకు తోడైయున్నాను',
        taglineEnglish: 'GOD IS FAITHFUL TO HIS PROMISE'
      },
      {
        themeTitleTelugu: 'ఆశీర్వాదపు వాగ్దానం',
        themeTitleEnglish: 'ALL THINGS FOR GOOD',
        verseRefTelugu: 'రోమీయులకు 8:28',
        verseTextTelugu: 'దేవుని ప్రేమించువారికి సమస్తమును సమకూడి మేలుకొరకే జరుగుచున్నవని యెరుగుదుము',
        verseRefEnglish: 'ROMANS 8:28',
        verseTextEnglish: 'We know that in all things God works for the good of those who love Him',
        taglineTelugu: 'సమస్తము మేలుకొరకే జరుగును',
        taglineEnglish: 'PURPOSED FOR HIS GLORY'
      },
      {
        themeTitleTelugu: 'దేవుని సమాధాన వాగ్దానం',
        themeTitleEnglish: 'FUTURE & A HOPE',
        verseRefTelugu: 'యిర్మీయా 29:11',
        verseTextTelugu: 'మీకు నిరీక్షణ కలుగునట్లుగా సమాధానకరమైన తలంపులే గాని హానికరమైనవి కావు',
        verseRefEnglish: 'JEREMIAH 29:11',
        verseTextEnglish: 'Plans to prosper you and not to harm you, plans to give you hope and a future',
        taglineTelugu: 'సమాధానకరమైన తలంపులు',
        taglineEnglish: 'PLANS FOR PEACE & HOPE'
      },
      {
        themeTitleTelugu: 'నూతన బలమిచ్చు వాగ్దానం',
        themeTitleEnglish: 'RENEW YOUR STRENGTH',
        verseRefTelugu: 'యెషయా 40:31',
        verseTextTelugu: 'యెహోవాకొరకు ఎదురుచూచువారు నూతన బలము పొందుదురు; పక్షులవలె రెక్కలు చాపి పైకి ఎగురుదురు',
        verseRefEnglish: 'ISAIAH 40:31',
        verseTextEnglish: 'Those who hope in the Lord will renew their strength; they will soar on wings like eagles',
        taglineTelugu: 'పక్షులవలె పైకి ఎగురుదురు',
        taglineEnglish: 'SOAR ON WINGS LIKE EAGLES'
      }
    ]
  },
  'Bible Verse Card': {
    teluguTitle: 'పరిశుద్ధ వాక్యం',
    englishTitle: 'HOLY SCRIPTURE VERSE',
    tagline: 'LIVING AND POWERFUL WORD',
    taglineTelugu: 'జీవముగల దేవుని వాక్యం',
    verseTextTelugu: 'యెహోవా నా కాపరి; నాకు లేమి కలుగదు',
    verseRefTelugu: 'కీర్తనలు 23:1',
    verseTextEnglish: 'The Lord is my shepherd; I shall not want',
    verseRefEnglish: 'PSALM 23:1',
    primaryColor: '#2A1F45',
    accentColor: '#E3A83B',
    visualSubject: 'open Holy Bible bathed in morning light, gentle olive leaves, sacred reverent atmosphere',
    visualVariations: [
      'open Holy Bible bathed in morning light, gentle olive leaves, sacred reverent atmosphere',
      'golden glowing scripture pages resting on weathered rustic cedar wood with soft bokeh',
      'antique open Bible on stone pedestal with gentle sunbeams and autumn leaves',
      'reverent open scripture on pulpit with warm candlelight in church background'
    ],
    scriptureVariations: [
      {
        themeTitleTelugu: 'పరిశుద్ధ వాక్యం',
        themeTitleEnglish: 'HOLY SCRIPTURE VERSE',
        verseRefTelugu: 'కీర్తనలు 23:1',
        verseTextTelugu: 'యెహోవా నా కాపరి; నాకు లేమి కలుగదు',
        verseRefEnglish: 'PSALM 23:1',
        verseTextEnglish: 'The Lord is my shepherd; I shall not want',
        taglineTelugu: 'యెహోవా నా కాపరి',
        taglineEnglish: 'LIVING AND POWERFUL WORD'
      },
      {
        themeTitleTelugu: 'బలపరచు దేవుని వాక్యం',
        themeTitleEnglish: 'ALL THINGS THROUGH CHRIST',
        verseRefTelugu: 'ఫిలిప్పీయులకు 4:13',
        verseTextTelugu: 'నన్ను బలపరచువానియందే నేను సమస్తమును చేయగలను',
        verseRefEnglish: 'PHILIPPIANS 4:13',
        verseTextEnglish: 'I can do all this through Him who gives me strength',
        taglineTelugu: 'క్రీస్తునందు సమస్తము సాధ్యం',
        taglineEnglish: 'HE WHO STRENGTHENS ME'
      },
      {
        themeTitleTelugu: 'శాంతి సమాధానముల వాక్యం',
        themeTitleEnglish: 'PEACE BEYOND UNDERSTANDING',
        verseRefTelugu: 'ఫిలిప్పీయులకు 4:7',
        verseTextTelugu: 'సమస్త జ్ఞానమునకు మించిన దేవుని సమాధానము యేసుక్రీస్తువలన మీ హృదయములకు కావలియుండును',
        verseRefEnglish: 'PHILIPPIANS 4:7',
        verseTextEnglish: 'And the peace of God, which transcends all understanding, will guard your hearts',
        taglineTelugu: 'హృదయములను కావలియుంచు సమాధానం',
        taglineEnglish: 'GUARDING YOUR HEARTS'
      },
      {
        themeTitleTelugu: 'దేవుని అద్భుత రక్షణ',
        themeTitleEnglish: 'SAVED BY GRACE',
        verseRefTelugu: 'ఎఫెసీయులకు 2:8',
        verseTextTelugu: 'మీరు విశ్వాసముద్వారా కృపచేతనే రక్షింపబడియున్నారు; ఇది దేవుని వరమే',
        verseRefEnglish: 'EPHESIANS 2:8',
        verseTextEnglish: 'For by grace you have been saved through faith; it is the gift of God',
        taglineTelugu: 'విశ్వాసముద్వారా కృపచేతనే',
        taglineEnglish: 'GIFT OF GOD THROUGH FAITH'
      }
    ]
  },
  'Birthday': {
    teluguTitle: 'పుట్టినరోజు శుభాకాంక్షలు',
    englishTitle: 'HAPPY BLESSED BIRTHDAY',
    tagline: 'BLESSED AND HIGHLY FAVORED',
    taglineTelugu: 'దీర్ఘాయుష్షు గల ఆశీర్వాదం',
    verseTextTelugu: 'దీర్ఘాయువు చేత అతనిని తృప్తిపరచెదను, నా రక్షణ వానికి చూపించెదను',
    verseRefTelugu: 'కీర్తనలు 91:16',
    verseTextEnglish: 'With long life will I satisfy him, and show him My salvation',
    verseRefEnglish: 'PSALM 91:16',
    primaryColor: '#4C1D95',
    accentColor: '#F59E0B',
    visualSubject: 'festive sacred church celebration, golden bokeh, elegant Christian floral celebration',
    visualVariations: [
      'festive sacred church celebration, golden bokeh, elegant Christian floral celebration',
      'warm celebration background with golden fairy lights, elegant church hall, celebratory bokeh',
      'joyful Christian celebration aesthetic with soft golden sparkles, white lilies, and elegant warm lighting',
      'luxurious golden light orbs with soft Christian celebration ambiance and sacred joy'
    ],
    scriptureVariations: [
      {
        themeTitleTelugu: 'పుట్టినరోజు శుభాకాంక్షలు',
        themeTitleEnglish: 'HAPPY BLESSED BIRTHDAY',
        verseRefTelugu: 'కీర్తనలు 91:16',
        verseTextTelugu: 'దీర్ఘాయువు చేత అతనిని తృప్తిపరచెదను, నా రక్షణ వానికి చూపించెదను',
        verseRefEnglish: 'PSALM 91:16',
        verseTextEnglish: 'With long life will I satisfy him, and show him My salvation',
        taglineTelugu: 'దీర్ఘాయుష్షు గల ఆశీర్వాదం',
        taglineEnglish: 'BLESSED AND HIGHLY FAVORED'
      },
      {
        themeTitleTelugu: 'జన్మదిన ఆశీర్వాదాలు',
        themeTitleEnglish: 'THE LORD BLESS YOU & KEEP YOU',
        verseRefTelugu: 'సంఖ్యాకాండము 6:24',
        verseTextTelugu: 'యెహోవా నిన్ను ఆశీర్వదించి నిన్ను కాపాడును గాక; యెహోవా తన సన్నిధిని నీపై ప్రకాశింపజేయును గాక',
        verseRefEnglish: 'NUMBERS 6:24',
        verseTextEnglish: 'The Lord bless you and keep you; the Lord make His face shine upon you',
        taglineTelugu: 'సన్నిధి నీపై ప్రకాశించును గాక',
        taglineEnglish: 'HIS FACE SHINE UPON YOU'
      },
      {
        themeTitleTelugu: 'నూతన వత్సరపు దీవెనలు',
        themeTitleEnglish: 'YEAR CROWNED WITH GOODNESS',
        verseRefTelugu: 'కీర్తనలు 65:11',
        verseTextTelugu: 'సంవత్సరమును నీ దయాళుత్వముతో కిరీటము ధరింపజేసియున్నావు; నీ జాడలు సారము వెదజల్లుచున్నవి',
        verseRefEnglish: 'PSALM 65:11',
        verseTextEnglish: 'You crown the year with Your bounty, and Your carts overflow with abundance',
        taglineTelugu: 'దయాళుత్వపు కిరీటము',
        taglineEnglish: 'OVERFLOWING WITH BOUNTY'
      },
      {
        themeTitleTelugu: 'దేవుని అద్భుత సృష్టి',
        themeTitleEnglish: 'FEARFULLY & WONDERFULLY MADE',
        verseRefTelugu: 'కీర్తనలు 139:14',
        verseTextTelugu: 'నీవు నన్ను భయము పుట్టించునట్లుగాను ఆశ్చర్యముగాను నిర్మించితివి; అందునుబట్టి కృతజ్ఞతాస్తుతులు చెల్లించుచున్నాను',
        verseRefEnglish: 'PSALM 139:14',
        verseTextEnglish: 'I praise You because I am fearfully and wonderfully made; Your works are wonderful',
        taglineTelugu: 'ఆశ్చర్యముగా నిర్మింపబడిన ప్రాణం',
        taglineEnglish: 'PRAISING GOD FOR LIFE'
      }
    ]
  },
  'Wedding Anniversary': {
    teluguTitle: 'వివాహ వార్షికోత్సవం',
    englishTitle: 'HAPPY WEDDING ANNIVERSARY',
    tagline: 'UNITED IN GOD\'S UNFAILING LOVE',
    taglineTelugu: 'దేవుని ప్రేమలో ఒక్కటైన బంధం',
    verseTextTelugu: 'దేవుడు జతపరచినవారిని మనుష్యుడు వేరుపరచకూడదు',
    verseRefTelugu: 'మత్తయి 19:6',
    verseTextEnglish: 'What God has joined together, let not man put asunder',
    verseRefEnglish: 'MATTHEW 19:6',
    primaryColor: '#4A044E',
    accentColor: '#F472B6',
    visualSubject: 'golden wedding rings on Holy Bible, warm glowing church candles, sacred covenant atmosphere',
    visualVariations: [
      'golden wedding rings on Holy Bible, warm glowing church candles, sacred covenant atmosphere',
      'white bridal roses and golden bands beside open scripture on church altar, warm romantic sunset rays',
      'sacred Christian marriage covenant with two interlocking golden rings, soft candlelight, and white lace',
      'church altar adorned with elegant floral arch, glowing candles, and open Bible for holy matrimony'
    ],
    scriptureVariations: [
      {
        themeTitleTelugu: 'వివాహ వార్షికోత్సవం',
        themeTitleEnglish: 'HAPPY WEDDING ANNIVERSARY',
        verseRefTelugu: 'మత్తయి 19:6',
        verseTextTelugu: 'దేవుడు జతపరచినవారిని మనుష్యుడు వేరుపరచకూడదు',
        verseRefEnglish: 'MATTHEW 19:6',
        verseTextEnglish: 'What God has joined together, let not man put asunder',
        taglineTelugu: 'దేవుని ప్రేమలో ఒక్కటైన బంధం',
        taglineEnglish: 'UNITED IN GOD\'S UNFAILING LOVE'
      },
      {
        themeTitleTelugu: 'ప్రేమ సమాధానముల దాంపత్యం',
        themeTitleEnglish: 'A CORD OF THREE STRANDS',
        verseRefTelugu: 'ప్రసంగి 4:12',
        verseTextTelugu: 'ముప్పేట త్రాడు త్వరగా తెగిపోదు; ఇద్దరు కలిసి ఉండుట మేలు',
        verseRefEnglish: 'ECCLESIASTES 4:12',
        verseTextEnglish: 'A cord of three strands is not quickly broken',
        taglineTelugu: 'ముప్పేట త్రాడు త్వరగా తెగిపోదు',
        taglineEnglish: 'NOT QUICKLY BROKEN'
      },
      {
        themeTitleTelugu: 'నిత్యమైన ప్రేమ బంధం',
        themeTitleEnglish: 'LOVE NEVER FAILS',
        verseRefTelugu: '1 కొరింథీయులకు 13:8',
        verseTextTelugu: 'ప్రేమ ఎన్నడును విఫలము కాదు; ప్రేమ ఓర్పుగలది మరియు దయగలది',
        verseRefEnglish: '1 CORINTHIANS 13:8',
        verseTextEnglish: 'Love never fails; love is patient, love is kind',
        taglineTelugu: 'ప్రేమ ఓర్పుగలది, దయగలది',
        taglineEnglish: 'PATIENT AND KIND'
      },
      {
        themeTitleTelugu: 'ఆశీర్వదించబడిన సంసారం',
        themeTitleEnglish: 'A GODLY HOME BLESSED',
        verseRefTelugu: 'కీర్తనలు 128:1',
        verseTextTelugu: 'యెహోవాయందు భయభక్తులు కలిగి ఆయన త్రోవలయందు నడుచువారందరు ధన్యులు',
        verseRefEnglish: 'PSALM 128:1',
        verseTextEnglish: 'Blessed are all who fear the Lord, who walk in obedience to Him',
        taglineTelugu: 'యెహోవాయందు భయభక్తులు గల కుటుంబం',
        taglineEnglish: 'WALKING IN HIS WAYS'
      }
    ]
  },
  'Baptism Anniversary': {
    teluguTitle: 'బాప్తిస్మ వార్షికోత్సవం',
    englishTitle: 'BAPTISM CELEBRATION',
    tagline: 'BURIED WITH CHRIST • RISEN TO LIFE',
    taglineTelugu: 'క్రీస్తులో నూతన జీవం',
    verseTextTelugu: 'క్రీస్తుతోకూడ సమాధి చేయబడితిరి, ఆయనతోకూడ లేపబడితిరి',
    verseRefTelugu: 'కొలొస్సయులకు 2:12',
    verseTextEnglish: 'Buried with Him in baptism, in which you also were raised with Him',
    verseRefEnglish: 'COLOSSIANS 2:12',
    primaryColor: '#0C4A6E',
    accentColor: '#38BDF8',
    visualSubject: 'peaceful sacred living water, white dove, glowing sunlight on river, sacred baptism',
    visualVariations: [
      'peaceful sacred living water, white dove, glowing sunlight on river, sacred baptism',
      'crystal clear water ripples reflecting golden sunlight, white dove symbol, sacred holy baptism',
      'sacred baptismal font in ancient church chapel with sunbeams dancing on pure water'
    ],
    scriptureVariations: [
      {
        themeTitleTelugu: 'బాప్తిస్మ వార్షికోత్సవం',
        themeTitleEnglish: 'BAPTISM CELEBRATION',
        verseRefTelugu: 'కొలొస్సయులకు 2:12',
        verseTextTelugu: 'క్రీస్తుతోకూడ సమాధి చేయబడితిరి, ఆయనతోకూడ లేపబడితిరి',
        verseRefEnglish: 'COLOSSIANS 2:12',
        verseTextEnglish: 'Buried with Him in baptism, in which you also were raised with Him',
        taglineTelugu: 'క్రీస్తులో నూతన జీవం',
        taglineEnglish: 'BURIED WITH CHRIST • RISEN TO LIFE'
      },
      {
        themeTitleTelugu: 'క్రీస్తులో నూతన సృష్టి',
        themeTitleEnglish: 'NEW CREATION IN CHRIST',
        verseRefTelugu: '2 కొరింథీయులకు 5:17',
        verseTextTelugu: 'ఎవడైనను క్రీస్తునందున్నయెడల వాడు నూతన సృష్టి; పాతవి గతించెను, ఇదిగో సమస్తము నూతనమాయెను',
        verseRefEnglish: '2 CORINTHIANS 5:17',
        verseTextEnglish: 'If anyone is in Christ, the new creation has come: The old has gone, the new is here!',
        taglineTelugu: 'పాతవి గతించెను, సమస్తము నూతనమాయెను',
        taglineEnglish: 'OLD HAS GONE, NEW HAS COME'
      },
      {
        themeTitleTelugu: 'క్రీస్తును ధరించుకొనుట',
        themeTitleEnglish: 'CLOTHED WITH CHRIST',
        verseRefTelugu: 'గలతీయులకు 3:27',
        verseTextTelugu: 'క్రీస్తులోనికి బాప్తిస్మము పొందిన మీరందరును క్రీస్తును ధరించుకొనియున్నారు',
        verseRefEnglish: 'GALATIANS 3:27',
        verseTextEnglish: 'For all of you who were baptized into Christ have clothed yourselves with Christ',
        taglineTelugu: 'బాప్తిస్మము పొందినవారందరు క్రీస్తును ధరించిరి',
        taglineEnglish: 'BAPTIZED INTO CHRIST'
      }
    ]
  },
  'Church Anniversary': {
    teluguTitle: 'సంఘ వార్షికోత్సవం',
    englishTitle: 'CHURCH ANNIVERSARY',
    tagline: 'CELEBRATING YEARS OF GOD\'S GRACE',
    taglineTelugu: 'ఎబెనెజరు — సహాయము చేసెను',
    verseTextTelugu: 'ఇంతవరకు యెహోవా మాకు సహాయము చేసెను — ఎబెనెజెరు',
    verseRefTelugu: '1 సమూయేలు 7:12',
    verseTextEnglish: 'Thus far the Lord has helped us — Ebenezer',
    verseRefEnglish: '1 SAMUEL 7:12',
    primaryColor: '#3B0764',
    accentColor: '#FCD34D',
    visualSubject: 'grand cathedral architecture, festive golden bokeh, elegant sacred celebration',
    visualVariations: [
      'grand cathedral architecture, festive golden bokeh, elegant sacred celebration',
      'majestic church building exterior with golden sunburst sky, celebrating God\'s faithfulness',
      'interior of historic church sanctuary illuminated with celebratory golden chandeliers'
    ],
    scriptureVariations: [
      {
        themeTitleTelugu: 'సంఘ వార్షికోత్సవం',
        themeTitleEnglish: 'CHURCH ANNIVERSARY',
        verseRefTelugu: '1 సమూయేలు 7:12',
        verseTextTelugu: 'ఇంతవరకు యెహోవా మాకు సహాయము చేసెను — ఎబెనెజెరు',
        verseRefEnglish: '1 SAMUEL 7:12',
        verseTextEnglish: 'Thus far the Lord has helped us — Ebenezer',
        taglineTelugu: 'ఎబెనెజరు — సహాయము చేసెను',
        taglineEnglish: 'CELEBRATING YEARS OF GOD\'S GRACE'
      },
      {
        themeTitleTelugu: 'సంఘ ప్రతిష్ఠాపన మహోత్సవం',
        themeTitleEnglish: 'BUILT UPON THE ROCK',
        verseRefTelugu: 'మత్తయి 16:18',
        verseTextTelugu: 'ఈ బండమీద నా సంఘమును కట్టుదును, పాతాళలోక ద్వారములు దానియెదుట నిలువనేరవు',
        verseRefEnglish: 'MATTHEW 16:18',
        verseTextEnglish: 'On this rock I will build My church, and the gates of Hades will not overcome it',
        taglineTelugu: 'బండపై కట్టబడిన సంఘం',
        taglineEnglish: 'THE GATES OF HADES SHALL NOT PREVAIL'
      },
      {
        themeTitleTelugu: 'దేవుని నిత్య నమ్మకత్వము',
        themeTitleEnglish: 'GREAT IS THY FAITHFULNESS',
        verseRefTelugu: 'విలాపవాక్యములు 3:23',
        verseTextTelugu: 'ఉదయమున నూతనముగా ఆయన వాత్సల్యత పుట్టుచున్నది; నీవు ఎంతైనను నమ్మదగినవాడవు',
        verseRefEnglish: 'LAMENTATIONS 3:23',
        verseTextEnglish: 'They are new every morning; great is Your faithfulness',
        taglineTelugu: 'తరతరములు ఆయన కృప నిలుచును',
        taglineEnglish: 'NEW EVERY MORNING'
      }
    ]
  },
  'Special Event': {
    teluguTitle: 'ప్రత్యేక ఆరాధన కూటం',
    englishTitle: 'SPECIAL REVIVAL EVENT',
    tagline: 'COME • RECEIVE • BE BLESSED',
    taglineTelugu: 'రండి • పొందుకోండి • దీవించబడండి',
    verseTextTelugu: 'ప్రయాసపడి భారము మోసికొనుచున్న సమస్త జనులారా, నా యొద్దకు రండి; నేను మీకు విశ్రాంతి కలుగజేతును',
    verseRefTelugu: 'మత్తయి 11:28',
    verseTextEnglish: 'Come unto Me, all that labour and are heavy laden, and I will give you rest',
    verseRefEnglish: 'MATTHEW 11:28',
    primaryColor: '#1E1B4B',
    accentColor: '#F59E0B',
    visualSubject: 'grand cathedral sanctuary, golden lighting, sacred celebration atmosphere',
    visualVariations: [
      'grand cathedral sanctuary, golden lighting, sacred celebration atmosphere',
      'inspiring Christian revival stage with dramatic stage illumination and majestic cross',
      'panoramic church auditorium ready for special service with warm ambient golden glow'
    ],
    scriptureVariations: [
      {
        themeTitleTelugu: 'ప్రత్యేక ఆరాధన కూటం',
        themeTitleEnglish: 'SPECIAL REVIVAL EVENT',
        verseRefTelugu: 'మత్తయి 11:28',
        verseTextTelugu: 'ప్రయాసపడి భారము మోసికొనుచున్న సమస్త జనులారా, నా యొద్దకు రండి; నేను మీకు విశ్రాంతి కలుగజేతును',
        verseRefEnglish: 'MATTHEW 11:28',
        verseTextEnglish: 'Come unto Me, all that labour and are heavy laden, and I will give you rest',
        taglineTelugu: 'రండి • పొందుకోండి • దీవించబడండి',
        taglineEnglish: 'COME • RECEIVE • BE BLESSED'
      },
      {
        themeTitleTelugu: 'ఆధ్యాత్మిక పునరుజ్జీవ సభలు',
        themeTitleEnglish: 'SPIRITUAL REVIVAL CRUSADE',
        verseRefTelugu: 'అపొస్తలుల కార్యములు 1:8',
        verseTextTelugu: 'పరిశుద్ధాత్మ మీమీదికి వచ్చునప్పుడు మీరు శక్తి నొందెదరు; భూదిగంతములవరకు నాకు సాక్షులై యుందురు',
        verseRefEnglish: 'ACTS 1:8',
        verseTextEnglish: 'You will receive power when the Holy Spirit comes on you; and you will be My witnesses',
        taglineTelugu: 'పరిశుద్ధాత్మ శక్తితో నింపబడుడి',
        taglineEnglish: 'FILLED WITH HOLY SPIRIT POWER'
      },
      {
        themeTitleTelugu: 'కృపాభిషేక మహోత్సవం',
        themeTitleEnglish: 'ANOINTING & MIRACLES NIGHT',
        verseRefTelugu: 'లూకా 4:18',
        verseTextTelugu: 'ప్రభువు ఆత్మ నామీద ఉన్నది; బంధింపబడినవారికి విడుదలను ప్రకటించుటకు నన్ను పంపెను',
        verseRefEnglish: 'LUKE 4:18',
        verseTextEnglish: 'The Spirit of the Lord is on me, because He has anointed me to proclaim freedom',
        taglineTelugu: 'ప్రభువు సన్నిధిలో స్వస్థత • విడుదల',
        taglineEnglish: 'LIBERTY IN HIS PRESENCE'
      },
      {
        themeTitleTelugu: 'మహిమోన్నత ఆరాధన సంబరం',
        themeTitleEnglish: 'GLORIOUS WORSHIP GATHERING',
        verseRefTelugu: 'కీర్తనలు 133:1',
        verseTextTelugu: 'సహోదరులు ఐక్యత కలిగి నివసించుట ఎంత మేలు! ఎంత మనోహరము!',
        verseRefEnglish: 'PSALM 133:1',
        verseTextEnglish: 'How good and pleasant it is when God\'s people live together in unity!',
        taglineTelugu: 'ప్రభువు నామములో ఏకమవుదాం',
        taglineEnglish: 'UNITED IN CHRIST JESUS'
      }
    ]
  },
  'Announcement': {
    teluguTitle: 'సంఘ ప్రకటన',
    englishTitle: 'CHURCH ANNOUNCEMENT',
    tagline: 'IMPORTANT NOTICE & UPDATES',
    taglineTelugu: 'ముఖ్యమైన సంఘ ప్రకటన',
    verseTextTelugu: 'ప్రతి విషయమును మర్యాదగాను క్రమముగాను జరుగవలెను',
    verseRefTelugu: '1 కొరింథీయులకు 14:40',
    verseTextEnglish: 'Let all things be done decently and in order',
    verseRefEnglish: '1 CORINTHIANS 14:40',
    primaryColor: '#1E293B',
    accentColor: '#E3A83B',
    visualSubject: 'sacred church podium, open scripture scroll, golden ambient lighting',
    visualVariations: [
      'sacred church podium, open scripture scroll, golden ambient lighting',
      'wooden church lectern with warm soft spotlight and church stained glass in soft blur',
      'clean minimalist church stage with warm illumination and wooden textures'
    ],
    scriptureVariations: [
      {
        themeTitleTelugu: 'సంఘ ప్రకటన',
        themeTitleEnglish: 'CHURCH ANNOUNCEMENT',
        verseRefTelugu: '1 కొరింథీయులకు 14:40',
        verseTextTelugu: 'ప్రతి విషయమును మర్యాదగాను క్రమముగాను జరుగవలెను',
        verseRefEnglish: '1 CORINTHIANS 14:40',
        verseTextEnglish: 'Let all things be done decently and in order',
        taglineTelugu: 'ముఖ్యమైన సంఘ ప్రకటన',
        taglineEnglish: 'IMPORTANT NOTICE & UPDATES'
      },
      {
        themeTitleTelugu: 'పరిచర్య విశేషాలు',
        themeTitleEnglish: 'MINISTRY UPDATES & SCHEDULE',
        verseRefTelugu: 'ఫిలిప్పీయులకు 1:5',
        verseTextTelugu: 'మొదటి దినమునుండి ఇదివరకు సువార్త విషయములో మీరు పాలుపంచుకొనుచున్నారు',
        verseRefEnglish: 'PHILIPPIANS 1:5',
        verseTextEnglish: 'Because of your partnership in the gospel from the first day until now',
        taglineTelugu: 'దేవుని రాజ్య పరిచర్యలో పాలుపంపులు',
        taglineEnglish: 'PARTNERS IN THE GOSPEL'
      },
      {
        themeTitleTelugu: 'ప్రత్యేక సమాచారం',
        themeTitleEnglish: 'SPECIAL CHURCH NOTICE',
        verseRefTelugu: 'గలతీయులకు 5:13',
        verseTextTelugu: 'ప్రేమ కలిగి ఒకరికొకరు దాసులుగా ఉండుడి',
        verseRefEnglish: 'GALATIANS 5:13',
        verseTextEnglish: 'Serve one another humbly in love',
        taglineTelugu: 'ప్రేమతో పరిచర్య చేయుడి',
        taglineEnglish: 'SERVE ONE ANOTHER IN LOVE'
      }
    ]
  },
  'Other': {
    teluguTitle: 'ప్రత్యేక ఆరాధన',
    englishTitle: 'CHURCH FELLOWSHIP',
    tagline: 'WALKING TOGETHER IN FAITH',
    taglineTelugu: 'విశ్వాస సహవాసం',
    verseTextTelugu: 'కృపయు సమాధానమును మీకు కలుగును గాక',
    verseRefTelugu: '1 పేతురు 1:2',
    verseTextEnglish: 'Grace and peace be multiplied to you',
    verseRefEnglish: '1 PETER 1:2',
    primaryColor: '#2A1F45',
    accentColor: '#E3A83B',
    visualSubject: 'peaceful church sanctuary, warm spiritual light, sacred altar',
    visualVariations: [
      'peaceful church sanctuary, warm spiritual light, sacred altar',
      'golden rays illuminating peaceful church sanctuary, quiet fellowship atmosphere',
      'sacred altar with gentle glowing candles and open Holy Bible'
    ],
    scriptureVariations: [
      {
        themeTitleTelugu: 'ప్రత్యేక ఆరాధన',
        themeTitleEnglish: 'CHURCH FELLOWSHIP',
        verseRefTelugu: '1 పేతురు 1:2',
        verseTextTelugu: 'కృపయు సమాధానమును మీకు కలుగును గాక',
        verseRefEnglish: '1 PETER 1:2',
        verseTextEnglish: 'Grace and peace be multiplied to you',
        taglineTelugu: 'విశ్వాస సహవాసం',
        taglineEnglish: 'WALKING TOGETHER IN FAITH'
      },
      {
        themeTitleTelugu: 'క్రీస్తులో ఐక్యత',
        themeTitleEnglish: 'UNITY IN CHRIST',
        verseRefTelugu: '2 కొరింథీయులకు 13:14',
        verseTextTelugu: 'ప్రభువైన యేసుక్రీస్తు కృపయు దేవుని ప్రేమయు పరిశుద్ధాత్మ సహవాసమును మీకందరికి తోడైయుండును గాక',
        verseRefEnglish: '2 CORINTHIANS 13:14',
        verseTextEnglish: 'May the grace of the Lord Jesus Christ, and the love of God, and the fellowship of the Holy Spirit be with you all',
        taglineTelugu: 'పరిశుద్ధ సహవాసము',
        taglineEnglish: 'FELLOWSHIP OF THE HOLY SPIRIT'
      },
      {
        themeTitleTelugu: 'కృపా సమాధానములు',
        themeTitleEnglish: 'GRACE & PEACE MULTIPLIED',
        verseRefTelugu: 'కీర్తనలు 16:11',
        verseTextTelugu: 'నీ సన్నిధిని సంపూర్ణసంతోషము కలదు; నీ కుడిచేతిలో నిత్యము సుఖములు కలవు',
        verseRefEnglish: 'PSALM 16:11',
        verseTextEnglish: 'You will fill me with joy in Your presence, with eternal pleasures at Your right hand',
        taglineTelugu: 'ప్రభువు సన్నిధిలో సంతోషం',
        taglineEnglish: 'JOY IN HIS PRESENCE'
      }
    ]
  }
};

const getDynamicContent = (type: string): DynamicChurchData => {
  if (type === "Women's Fasting Prayer" || type === "Womens Fasting Prayer") {
    return DYNAMIC_CHURCH_CONTENT["Women's Fasting Prayer"];
  }
  return DYNAMIC_CHURCH_CONTENT[type] || DYNAMIC_CHURCH_CONTENT['Bible Study'] || DYNAMIC_CHURCH_CONTENT['Sunday Worship'];
};

// ─── Content Types List ─────────────────────────────────────────────────────────
const CONTENT_TYPES = [
  { key: 'Bible Study', icon: BookOpen },
  { key: 'Sunday Worship', icon: CalendarIcon },
  { key: 'Prayer Meeting', icon: User },
  { key: 'Fasting Prayer', icon: Heart },
  { key: "Women's Fasting Prayer", icon: Heart },
  { key: 'Holy Communion', icon: Sparkles },
  { key: 'Birthday', icon: Sparkles },
  { key: 'Wedding Anniversary', icon: Heart },
  { key: 'Youth Meeting', icon: User },
  { key: 'Daily Promise Card', icon: Sparkles },
  { key: 'Bible Verse Card', icon: BookOpen },
  { key: 'Baptism Anniversary', icon: CheckCircle2 },
  { key: 'Church Anniversary', icon: CheckCircle2 },
  { key: 'Special Event', icon: Sparkles },
  { key: 'Announcement', icon: CheckSquare },
  { key: 'Other', icon: CheckCircle2 }
];

const LANGUAGES = ['Telugu', 'English', 'Hindi', 'Tamil', 'Kannada'];

export default function AIContentCreator() {
  const { setTabByName } = useContext(AdminTabContext);
  const { activeChurch } = useChurch();

  // Screen Mode
  const [activeScreenTab, setActiveScreenTab] = useState<'create' | 'history'>('create');

  // Streamlined Form State (Starts with a default content type so live preview is active immediately)
  const [contentType, setContentType]       = useState('Sunday Worship');
  const [speaker, setSpeaker]               = useState('');
  const [startDate, setStartDate]           = useState<Date | null>(new Date());
  const [endDate, setEndDate]               = useState<Date | null>(null);
  const [startTime, setStartTime]           = useState<Date | null>(() => {
    const d = new Date();
    d.setHours(9, 30, 0, 0);
    return d;
  });
  const [endTime, setEndTime]               = useState<Date | null>(null);
  const [location, setLocation]             = useState('');
  const [language, setLanguage]             = useState('Telugu');

  // User-editable & auto-selected Theme, Tagline, and Scripture state
  const [customTheme, setCustomTheme]                     = useState('');
  const [customTagline, setCustomTagline]                 = useState('');
  const [customVerseRef, setCustomVerseRef]               = useState('');
  const [customVerseText, setCustomVerseText]             = useState('');
  const [customVerseEnglishRef, setCustomVerseEnglishRef]   = useState('');
  const [customVerseEnglishText, setCustomVerseEnglishText] = useState('');

  // ─── Bible Selection State ────────────────────────────────────────────────
  const [selectedBibleVersion, setSelectedBibleVersion]   = useState('Telugu (BSI)');
  const [isFetchingVerse, setIsFetchingVerse]             = useState(false);
  const [selectedBook, setSelectedBook]                   = useState<number | null>(null);
  const [selectedChapter, setSelectedChapter]             = useState<number | null>(null);
  const [selectedVerse, setSelectedVerse]                 = useState<number | null>(null);
  const [selectionModalType, setSelectionModalType]       = useState<'book' | 'chapter' | 'verse' | null>(null);
  const [bookSearchQuery, setBookSearchQuery]             = useState('');

  // ─── Typography & Telugu Font State ───────────────────────────────────────
  const [fontsReady, setFontsReady]                       = useState(false);
  const [thumbFontFamily, setThumbFontFamily]             = useState<string>('Suranna');
  const [thumbFontSize, setThumbFontSize]                 = useState<number>(11.0);
  const [thumbFontWeight, setThumbFontWeight]             = useState<string>('700');
  const [thumbIsItalic, setThumbIsItalic]                 = useState<boolean>(false);
  const [thumbTextColor, setThumbTextColor]               = useState<string>('#FFFFFF');
  const [thumbTextAlign, setThumbTextAlign]               = useState<'left' | 'center' | 'right'>('center');
  const [thumbTextPosition, setThumbTextPosition]         = useState<'top' | 'center' | 'bottom'>('center');
  const [activeTextColorCategory, setActiveTextColorCategory] = useState<string>('All');
  const [customTextColorInput, setCustomTextColorInput]   = useState<string>('#FFFFFF');
  const [isTypographyExpanded, setIsTypographyExpanded]   = useState<boolean>(false);

  // ─── Download Success Modal State ──────────────────────────────────────────
  const [downloadSuccessModal, setDownloadSuccessModal]   = useState<{
    visible: boolean;
    imageUri: string | null;
  }>({
    visible: false,
    imageUri: null,
  });

  // Load authentic Telugu Google Fonts on mount
  useEffect(() => {
    loadTeluguFonts().then(() => setFontsReady(true));
  }, []);

  // ─── Thumbnail Color & Theme State ─────────────────────────────────────────
  const [colorMode, setColorMode] = useState<'solid' | 'gradient' | 'custom'>('solid');
  const [selectedSolidColor, setSelectedSolidColor] = useState<string | null>(null);
  const [selectedGradient, setSelectedGradient] = useState<[string, string] | null>(null);
  const [activeFamilyTab, setActiveFamilyTab] = useState('All');
  
  // Custom Color states
  const [customSolidInput, setCustomSolidInput] = useState('#1E3A8A');
  const [customGradStart, setCustomGradStart] = useState('#1E40AF');
  const [customGradEnd, setCustomGradEnd] = useState('#7C3AED');
  const [customType, setCustomType] = useState<'solid' | 'gradient'>('solid');
  const [isColorPickerExpanded, setIsColorPickerExpanded] = useState(false);

  // Per-content-type variation rotation counter (kept for selectContentTypeWithVariation)
  const variationCounterMapRef = useRef<Record<string, number>>({});

  // Per-content-type registry of already-used visual prompts — prevents repeats until pool exhausted
  const usedPromptsRef = useRef<Record<string, Set<string>>>({});

  // Reference Thumbnail State (Selected at Generate stage)
  const [sampleImageUri, setSampleImageUri] = useState<string | null>(null);
  const [showRefModal, setShowRefModal]     = useState(false);

  // Date/Time pickers
  const [isStartDatePickerVisible, setStartDatePickerVisibility] = useState(false);
  const [isEndDatePickerVisible, setEndDatePickerVisibility]     = useState(false);
  const [isStartTimePickerVisible, setStartTimePickerVisibility] = useState(false);
  const [isEndTimePickerVisible, setEndTimePickerVisibility]     = useState(false);

  // Output state
  const [generating, setGenerating]         = useState(false);
  const [bgImageUrl, setBgImageUrl]         = useState('');
  const [showResult, setShowResult]         = useState(false);
  const [savingImage, setSavingImage]       = useState(false);
  const [sharingImage, setSharingImage]     = useState(false);

  // ViewShot Ref for capturing pristine thumbnail
  const viewShotRef = useRef<ViewShot>(null);

  // Modals
  const [viewImageModal, setViewImageModal]       = useState<string | null>(null);

  // History state
  const [historyItems, setHistoryItems]     = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historySearch, setHistorySearch]   = useState('');

  // Load history when tab is opened
  useEffect(() => {
    if (activeScreenTab === 'history') {
      loadHistory();
    }
  }, [activeScreenTab, activeChurch?.id]);

  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const items = await FirestoreService.getAIContent();
      setHistoryItems(items);
    } catch (e) {
      console.error('Error loading AI content history:', e);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleDeleteHistory = (item: any) => {
    Alert.alert(
      'Delete Creation',
      `Are you sure you want to delete "${item.topic || item.contentType}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await FirestoreService.deleteAIContent(item.id);
              setHistoryItems(prev => prev.filter(x => x.id !== item.id));
            } catch (err: any) {
              Alert.alert('Error', 'Failed to delete creation.');
            }
          }
        }
      ]
    );
  };

  // Initial default selection on mount so preview is live immediately
  useEffect(() => {
    selectContentTypeWithVariation('Sunday Worship', 'Telugu');
  }, []);

  // ── Variation Selection & Rotation Handlers ──────────────────────────────────
  const selectContentTypeWithVariation = (type: string, overrideLang?: string) => {
    const targetLang = overrideLang || language;
    const isTelugu = targetLang === 'Telugu';

    const currentCount = variationCounterMapRef.current[type] ?? -1;
    const nextCount = currentCount + 1;
    variationCounterMapRef.current[type] = nextCount;

    setContentType(type);

    if (type === 'Daily Promise Card') {
      setStartDate(new Date()); // Automatically use actual/current date
    }

    const dyn = getDynamicContent(type);
    const vars = (dyn.scriptureVariations && dyn.scriptureVariations.length > 0)
      ? dyn.scriptureVariations
      : [
          {
            themeTitleTelugu: dyn.teluguTitle,
            themeTitleEnglish: dyn.englishTitle,
            taglineTelugu: dyn.taglineTelugu || dyn.teluguTitle,
            taglineEnglish: dyn.tagline,
            verseRefTelugu: dyn.verseRefTelugu,
            verseRefEnglish: dyn.verseRefEnglish,
            verseTextTelugu: dyn.verseTextTelugu,
            verseTextEnglish: dyn.verseTextEnglish,
          }
        ];

    const chosenVar = vars[nextCount % vars.length];

    const newTheme = isTelugu
      ? (chosenVar.themeTitleTelugu || dyn.teluguTitle)
      : (chosenVar.themeTitleEnglish || dyn.englishTitle);
    const newTagline = isTelugu
      ? (chosenVar.taglineTelugu || dyn.taglineTelugu || dyn.teluguTitle)
      : (chosenVar.taglineEnglish || dyn.tagline);
    const newVerseRef = isTelugu ? chosenVar.verseRefTelugu : chosenVar.verseRefEnglish;
    const newVerseText = isTelugu ? chosenVar.verseTextTelugu : chosenVar.verseTextEnglish;

    setCustomTheme(newTheme);
    setCustomTagline(newTagline);
    setCustomVerseRef(newVerseRef);
    setCustomVerseText(newVerseText);
    setCustomVerseEnglishRef(chosenVar.verseRefEnglish || dyn.verseRefEnglish || '');
    setCustomVerseEnglishText(chosenVar.verseTextEnglish || dyn.verseTextEnglish || '');

    // Reset coordinate pickers when cycling variations
    setSelectedBook(null);
    setSelectedChapter(null);
    setSelectedVerse(null);
    setBookSearchQuery('');
  };

  const handleLanguageChange = (newLang: string) => {
    setLanguage(newLang);
    if (!contentType) return;
    const isTelugu = newLang === 'Telugu';
    const dyn = getDynamicContent(contentType);
    const vars = (dyn.scriptureVariations && dyn.scriptureVariations.length > 0)
      ? dyn.scriptureVariations
      : [];
    const currentCount = variationCounterMapRef.current[contentType] ?? 0;
    if (vars.length > 0) {
      const chosenVar = vars[currentCount % vars.length];
      setCustomTheme(isTelugu ? (chosenVar.themeTitleTelugu || dyn.teluguTitle) : (chosenVar.themeTitleEnglish || dyn.englishTitle));
      setCustomTagline(isTelugu ? (chosenVar.taglineTelugu || dyn.taglineTelugu || dyn.teluguTitle) : (chosenVar.taglineEnglish || dyn.tagline));
      setCustomVerseRef(isTelugu ? chosenVar.verseRefTelugu : chosenVar.verseRefEnglish);
      setCustomVerseText(isTelugu ? chosenVar.verseTextTelugu : chosenVar.verseTextEnglish);
      setCustomVerseEnglishRef(chosenVar.verseRefEnglish || dyn.verseRefEnglish || '');
      setCustomVerseEnglishText(chosenVar.verseTextEnglish || dyn.verseTextEnglish || '');
    }
  };

  const handleBibleVersionChange = async (verOption: BibleVersionOption) => {
    setSelectedBibleVersion(verOption.name);
    if (selectedBook !== null && selectedChapter !== null && selectedVerse !== null) {
      await handleFetchVerse(selectedBook, selectedChapter, selectedVerse, verOption.name);
      return;
    }

    const targetLangCode = verOption.language === 'Telugu' ? 'te' : 'en';
    const refToFetch = (targetLangCode === 'te' ? customVerseRef : (customVerseEnglishRef || customVerseRef)).trim();

    if (refToFetch) {
      setIsFetchingVerse(true);
      try {
        const fetched = await BibleService.fetchVerseByReference(refToFetch, targetLangCode, verOption.apiCode);
        if (fetched && fetched.verse) {
          if (targetLangCode === 'te') {
            setCustomVerseText(fetched.verse);
            if (fetched.reference) setCustomVerseRef(fetched.reference);
          } else {
            setCustomVerseEnglishText(fetched.verse);
            if (fetched.reference) setCustomVerseEnglishRef(fetched.reference);
          }
        }
      } catch (e) {
        console.warn('Could not auto-fetch verse for version:', e);
      } finally {
        setIsFetchingVerse(false);
      }
    }
  };

  const handleFetchVerse = async (bIdx?: number | null, cNum?: number | null, vNum?: number | null, overrideVer?: string) => {
    const bookIndex = (typeof bIdx === 'number') ? bIdx : selectedBook;
    const chapterNumber = (typeof cNum === 'number') ? cNum : selectedChapter;
    const verseNumber = (typeof vNum === 'number') ? vNum : selectedVerse;
    const versionToUse = overrideVer || selectedBibleVersion;

    if (bookIndex !== null && chapterNumber !== null && verseNumber !== null) {
      setIsFetchingVerse(true);
      try {
        const bookId = bookIndex + 1;
        const engBookName = ENGLISH_NAMES[bookIndex];
        const teBookName = TELUGU_NAMES[bookIndex];
        const engRef = `${engBookName} ${chapterNumber}:${verseNumber}`;
        const teRef = `${teBookName} ${chapterNumber}:${verseNumber}`;

        let engText = '';
        let telText = '';

        // 1. Fetch Telugu text from offline local Bible JSON
        const bookData = LOCAL_TELUGU_BIBLE.Book[bookIndex];
        if (bookData && bookData.Chapter && bookData.Chapter[chapterNumber - 1]) {
          const chapterData = bookData.Chapter[chapterNumber - 1].Verse;
          if (chapterData && chapterData[verseNumber - 1]) {
            telText = chapterData[verseNumber - 1].Verse || '';
          }
        }

        // 2. Fetch English text from Bolls API (KJV default)
        try {
          const url = `https://bolls.life/get-text/KJV/${bookId}/${chapterNumber}/`;
          const engResponse = await fetch(url, { headers: { 'Accept': 'application/json' } });
          if (engResponse.ok) {
            const result = await engResponse.json();
            const verseObj = result.find((v: any) => v.verse === verseNumber);
            if (verseObj) {
              engText = verseObj.text ? verseObj.text.replace(/<[^>]*>?/gm, '').replace(/\d+/g, '').replace(/\s+/g, ' ').trim() : '';
            }
          }
        } catch (apiErr) {
          console.warn('bolls.life fetch failed, trying BibleService:', apiErr);
        }

        // 3. If a specific version is selected (like ERV, NIV, ESV, NKJV), fetch that specific translation
        const verObj = BIBLE_VERSIONS.find(v => v.name === versionToUse);
        if (verObj && verObj.apiCode !== 'BSI' && verObj.apiCode !== 'KJV') {
          try {
            const fetchedVer = await BibleService.fetchVerseByReference(
              verObj.language === 'Telugu' ? teRef : engRef,
              verObj.language === 'Telugu' ? 'te' : 'en',
              verObj.apiCode
            );
            if (fetchedVer && fetchedVer.verse) {
              if (verObj.language === 'Telugu') {
                telText = fetchedVer.verse;
              } else {
                engText = fetchedVer.verse;
              }
            }
          } catch (vErr) {
            console.warn('Version-specific fetch failed, keeping base translation:', vErr);
          }
        }

        setCustomVerseEnglishRef(engRef);
        setCustomVerseEnglishText(engText);
        setCustomVerseRef(teRef);
        setCustomVerseText(telText);

      } catch (err) {
        console.error('Failed to fetch verses:', err);
        Alert.alert('Error', 'Failed to fetch verses automatically. Please enter manually.');
      } finally {
        setIsFetchingVerse(false);
      }
      return;
    }

    // Fallback if book/chapter/verse are not chosen from modal
    const isTelugu = language === 'Telugu';
    const currentVer = BIBLE_VERSIONS.find(v => v.name === versionToUse) || BIBLE_VERSIONS[0];
    const targetLangCode = isTelugu ? 'te' : 'en';
    const refToFetch = customVerseRef.trim() || customVerseEnglishRef.trim();
    if (!refToFetch) {
      Alert.alert('Reference Required', 'Please select Book, Chapter and Verse or enter a reference (e.g. John 3:16).');
      return;
    }
    setIsFetchingVerse(true);
    try {
      const fetched = await BibleService.fetchVerseByReference(refToFetch, targetLangCode, currentVer.apiCode);
      if (fetched && fetched.verse) {
        setCustomVerseText(fetched.verse);
        if (fetched.reference) setCustomVerseRef(fetched.reference);
      } else {
        Alert.alert('Scripture Not Found', 'Could not locate that verse reference. You can type or paste the verse text directly.');
      }
    } catch (e: any) {
      Alert.alert('Fetch Error', e.message || 'Could not load scripture.');
    } finally {
      setIsFetchingVerse(false);
    }
  };

  // ── Generation Handlers ──────────────────────────────────────────────────────
  const handleGeneratePress = () => {
    if (!contentType) {
      Alert.alert('Content Type Required', 'Please select a content type (e.g. Holy Communion, Sunday Worship, Bible Study) before generating.');
      return;
    }
    // If user has not chosen a reference thumbnail yet, show the optional reference thumbnail prompt
    if (!sampleImageUri) {
      setShowRefModal(true);
    } else {
      executeGenerate();
    }
  };

  const executeGenerate = async (chosenRefUri?: string) => {
    setShowRefModal(false);
    setGenerating(true);

    const dyn = getDynamicContent(contentType);

    // ── True-random prompt selection — never repeat consecutively ──────────────
    const variations = dyn.visualVariations && dyn.visualVariations.length > 0
      ? dyn.visualVariations
      : [dyn.visualSubject];

    // Retrieve previously used prompts for this content type (per-session)
    const usedKey = `used_prompts_${contentType}`;
    const usedSet: Set<string> = (usedPromptsRef.current[usedKey] as Set<string>) || new Set<string>();

    // Filter out already-used prompts; if all used, reset
    let freshVariations = variations.filter(v => !usedSet.has(v));
    if (freshVariations.length === 0) {
      usedSet.clear();
      freshVariations = variations;
    }

    // Pick a random prompt from the fresh pool
    const chosenPrompt = freshVariations[Math.floor(Math.random() * freshVariations.length)];
    usedSet.add(chosenPrompt);
    usedPromptsRef.current[usedKey] = usedSet;

    const isGrad = colorMode === 'gradient' || (colorMode === 'custom' && customType === 'gradient');
    const primColor = colorMode === 'gradient'
      ? (selectedGradient ? selectedGradient[0] : (dyn.primaryColor || '#1E3A8A'))
      : (colorMode === 'custom' && customType === 'gradient' ? customGradStart : (selectedSolidColor || dyn.primaryColor || '#1E3A8A'));
    const secColor = colorMode === 'gradient'
      ? (selectedGradient ? selectedGradient[1] : (dyn.accentColor || '#E3A83B'))
      : (colorMode === 'custom' && customType === 'gradient' ? customGradEnd : (selectedSolidColor ? primColor : (dyn.accentColor || '#E3A83B')));

    const colorDesc = isGrad
      ? `gradient tones blending ${primColor} into ${secColor}`
      : `${primColor} thematic palette`;

    const promptWithTheme = `${chosenPrompt}, beautiful spiritual atmosphere, harmonized with ${colorDesc}`;

    try {
      const churchId = await FirestoreService.getChurchId();
      // Generate authentic visual based on dynamic content type & visual theme
      const visualUrl = await AIService.generateContentImage({
        prompt: promptWithTheme,
        churchId: churchId || 'default',
        orientation: 'Landscape',
        style: 'Professional',
        contentType,
        color: primColor,
        excludeUrl: bgImageUrl || undefined,
      });

      setBgImageUrl(visualUrl);
      setShowResult(true);

      // Save metadata to Firestore
      try {
        const isTelugu = language === 'Telugu';
        const effectiveStartDate = (contentType === 'Daily Promise Card' && !startDate) ? new Date() : startDate;
        const dateStr = formatDateRange(effectiveStartDate, endDate, isTelugu);
        const timeStr = formatTimeRange(startTime, endTime, isTelugu);

        const effectiveTheme = customTheme.trim() || (isTelugu ? dyn.teluguTitle : dyn.englishTitle);
        const effectiveVerseRef = customVerseRef.trim() || (isTelugu ? dyn.verseRefTelugu : dyn.verseRefEnglish);
        const effectiveVerseText = customVerseText.trim() || (isTelugu ? dyn.verseTextTelugu : dyn.verseTextEnglish);

        await FirestoreService.saveAIContent({
          contentType,
          topic: effectiveTheme,
          language,
          designStyle: 'Professional',
          orientation: 'Landscape',
          speaker: speaker.trim(),
          location: location.trim() || activeChurch?.address || (isTelugu ? 'చర్చి ప్రాంగణం' : 'Church Sanctuary'),
          header: `${activeChurch?.name || 'CHURCH OF GOD'}`,
          contactNumber: activeChurch?.contactPhone || '8000504070',
          socialMedia: activeChurch?.socialLinks?.youtube || '@wechristian',
          bibleVerse: effectiveVerseText,
          verseReference: effectiveVerseRef,
          color: isGrad ? `${primColor}|${secColor}` : primColor,
          dateText: dateStr,
          timeText: timeStr,
          prompt: chosenPrompt,
          imageUrl: visualUrl,
          status: 'generated',
        });
      } catch (_) { /* non-blocking */ }

    } catch (err: any) {
      Alert.alert('Generation Error', err.message || 'Failed to generate thumbnail. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  // Capture the complete thumbnail with all selected details and save to gallery
  const handleSaveToGallery = async () => {
    setSavingImage(true);
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync(true);
      if (status !== 'granted') {
        Alert.alert('Permission Needed', 'Please grant photos permission to save images to your gallery.');
        return;
      }

      if (viewShotRef.current?.capture) {
        const capturedUri = await viewShotRef.current.capture();
        await MediaLibrary.saveToLibraryAsync(capturedUri);
        try { Vibration.vibrate(60); } catch (_) {}
        setDownloadSuccessModal({ visible: true, imageUri: capturedUri });
      } else {
        throw new Error('Capture view not ready');
      }
    } catch (err: any) {
      console.error('Save error:', err);
      Alert.alert('Save Error', 'Could not save the image. Please try again.');
    } finally {
      setSavingImage(false);
    }
  };

  // Capture the complete thumbnail and trigger native share sheet
  const handleShareImage = async () => {
    setSharingImage(true);
    try {
      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert('Sharing Unavailable', 'Sharing is not available on this device.');
        return;
      }

      if (viewShotRef.current?.capture) {
        const capturedUri = await viewShotRef.current.capture();
        await Sharing.shareAsync(capturedUri);
      } else {
        throw new Error('Capture view not ready');
      }
    } catch (err: any) {
      console.error('Share error:', err);
      Alert.alert('Share Error', 'Could not share thumbnail.');
    } finally {
      setSharingImage(false);
    }
  };

  const resetForm = () => {
    setContentType('Sunday Worship');
    selectContentTypeWithVariation('Sunday Worship', language);
    setSpeaker('');
    setLocation('');
    setStartDate(new Date());
    setEndDate(null);
    setStartTime(null);
    setEndTime(null);
    setSampleImageUri(null);
    setShowResult(false);
    setBgImageUrl('');
    setSelectedSolidColor(null);
    setSelectedGradient(null);
    setColorMode('solid');
    setSelectedBibleVersion('Telugu (BSI)');
    setThumbFontFamily('Suranna');
    setThumbFontSize(11.0);
    setThumbFontWeight('700');
    setThumbIsItalic(false);
    setThumbTextColor('#FFFFFF');
    setThumbTextAlign('center');
    setThumbTextPosition('center');
  };

  const filteredHistory = historyItems.filter(item => {
    if (!historySearch.trim()) return true;
    const q = historySearch.toLowerCase();
    return (
      (item.topic && item.topic.toLowerCase().includes(q)) ||
      (item.contentType && item.contentType.toLowerCase().includes(q)) ||
      (item.designStyle && item.designStyle.toLowerCase().includes(q))
    );
  });

  const activeDyn = getDynamicContent(contentType);

  // ── Derived Active Colors for Live Thumbnail Composite & AI Theme ──
  const defaultPrimary = activeDyn.primaryColor || '#1E3A8A';
  const defaultSecondary = activeDyn.accentColor || '#E3A83B';

  const activePrimaryColor = colorMode === 'gradient'
    ? (selectedGradient ? selectedGradient[0] : defaultPrimary)
    : (colorMode === 'custom' && customType === 'gradient' ? customGradStart : (selectedSolidColor || defaultPrimary));

  const activeSecondaryColor = colorMode === 'gradient'
    ? (selectedGradient ? selectedGradient[1] : defaultSecondary)
    : (colorMode === 'custom' && customType === 'gradient' ? customGradEnd : (selectedSolidColor ? activePrimaryColor : defaultSecondary));

  const isGradientMode = colorMode === 'gradient' || (colorMode === 'custom' && customType === 'gradient');

  const thumbnailVignetteColors: [string, string, string] = isGradientMode
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
  const thumbnailGradientEnd = isGradientMode
    ? { x: 1, y: 1 }
    : { x: 0, y: 1 };

  // ── Render Color & Theme Selector Section ──
  const renderColorPickerSection = () => {
    return (
      <View style={styles.colorPickerSection}>
        <TouchableOpacity
          style={styles.colorPickerHeaderTouchable}
          activeOpacity={0.7}
          onPress={() => setIsColorPickerExpanded(prev => !prev)}
        >
          <View style={styles.colorPickerTitleRow}>
            <Palette size={15} color="#1a2d5a" />
            <Text style={styles.colorPickerTitle} numberOfLines={1} ellipsizeMode="tail">రంగు & థీమ్ (Color & Theme)</Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            <View style={styles.colorActiveIndicator}>
              <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: activePrimaryColor, borderWidth: 1, borderColor: '#D1D5DB' }} />
              {isGradientMode ? (
                <>
                  <Text style={{ fontSize: 9, color: '#9CA3AF' }}>→</Text>
                  <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: activeSecondaryColor, borderWidth: 1, borderColor: '#D1D5DB' }} />
                </>
              ) : null}
              <Text style={styles.colorActiveIndicatorTxt} numberOfLines={1}>
                {isGradientMode ? 'Gradient' : activePrimaryColor}
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
                onPress={() => {
                  setColorMode('gradient');
                  if (!selectedGradient) {
                    setSelectedGradient(['#1E40AF', '#7C3AED']);
                  }
                }}
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
                    const isSelected = (selectedSolidColor || activePrimaryColor).toLowerCase() === shade.hex.toLowerCase();
                    const light = getLuminance(shade.hex) > 0.65;
                    return (
                      <TouchableOpacity
                        key={`${shade.hex}-${idx}`}
                        style={[styles.swatchCard, isSelected && styles.swatchCardSelected]}
                        onPress={() => {
                          setSelectedSolidColor(shade.hex);
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
                    const isSelected = selectedGradient &&
                      selectedGradient[0].toLowerCase() === grad.colors[0].toLowerCase() &&
                      selectedGradient[1].toLowerCase() === grad.colors[1].toLowerCase();
                    return (
                      <TouchableOpacity
                        key={`${grad.name}-${idx}`}
                        style={[styles.gradientCard, isSelected && styles.gradientCardSelected]}
                        onPress={() => {
                          setSelectedGradient(grad.colors);
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
                            Alert.alert('Applied 🎉', `Custom color ${customSolidInput} set as thumbnail theme!`);
                          } else {
                            Alert.alert('Invalid HEX', 'Please enter a valid 6-character hex code like #1E3A8A');
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
                        Alert.alert('Applied 🎉', `Custom gradient ${c1} → ${c2} set as thumbnail theme!`);
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
    );
  };

  // ── Render Typography & Telugu Font Selector Section ──
  const renderTypographySection = () => {
    const activeTeluguFont = getActiveFontFamily(thumbFontFamily);
    return (
      <View style={styles.typographySection}>
        <TouchableOpacity
          style={styles.typographyHeaderTouchable}
          activeOpacity={0.7}
          onPress={() => setIsTypographyExpanded(prev => !prev)}
        >
          <View style={styles.typographyTitleRow}>
            <Type size={16} color="#5B3FA6" />
            <Text style={styles.typographyHeaderTitle} numberOfLines={1}>తెలుగు ఫాంట్ & శైలి (Typography & Fonts)</Text>
          </View>

          <View style={styles.typographyHeaderRight}>
            <View style={styles.typographyActivePill}>
              <Text style={[styles.typographyActivePillTxt, { fontFamily: activeTeluguFont }]}>
                {TELUGU_FONT_OPTIONS.find(f => f.id === thumbFontFamily)?.teluguName || 'సురన్న'} · {thumbFontSize}pt
              </Text>
            </View>
            <View style={styles.chevronWrap}>
              {isTypographyExpanded ? <ChevronUp size={16} color="#5B3FA6" /> : <ChevronDown size={16} color="#5B3FA6" />}
            </View>
          </View>
        </TouchableOpacity>

        {isTypographyExpanded && (
          <View style={styles.typographyExpandedContent}>
            {/* 1. TELUGU FONT SELECTION */}
            <Text style={styles.typoSubHeading}>తెలుగు ఫాంట్ ఎంపిక (Select Telugu Font)</Text>
            <View style={styles.teluguFontGrid}>
              {TELUGU_FONT_OPTIONS.map((fOption) => {
                const isSelected = thumbFontFamily === fOption.id;
                return (
                  <TouchableOpacity
                    key={fOption.id}
                    style={[styles.teluguFontCard, isSelected && styles.teluguFontCardSelected]}
                    onPress={() => setThumbFontFamily(fOption.id)}
                    activeOpacity={0.75}
                  >
                    <View style={styles.teluguFontCardHeader}>
                      <Text 
                        style={[
                          styles.teluguFontSample, 
                          { 
                            fontFamily: getActiveFontFamily(fOption.id),
                            fontWeight: fOption.id === 'System' ? '700' : 'normal',
                          }, 
                          isSelected && styles.teluguFontSampleSelected
                        ]} 
                        numberOfLines={1}
                      >
                        {fOption.teluguName}
                      </Text>
                      <View style={[styles.fontRadioCircle, isSelected && styles.fontRadioCircleSelected]}>
                        {isSelected && <Check size={10} color="#FFFFFF" strokeWidth={3} />}
                      </View>
                    </View>
                    <Text style={[styles.teluguFontSub, isSelected && styles.teluguFontSubSelected]} numberOfLines={1}>
                      {fOption.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* 2. FONT SIZE & STEPPER */}
            <View style={{ marginTop: 14 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <Text style={styles.typoSubHeading}>అక్షర పరిమాణం (Font Size)</Text>
                <View style={styles.stepperContainer}>
                  <TouchableOpacity
                    style={styles.stepperBtn}
                    onPress={() => setThumbFontSize(prev => Math.max(8.0, Number((prev - 0.5).toFixed(1))))}
                    activeOpacity={0.7}
                  >
                    <Minus size={13} color="#1a2d5a" />
                  </TouchableOpacity>
                  <Text style={styles.stepperValueTxt}>{thumbFontSize} pt</Text>
                  <TouchableOpacity
                    style={styles.stepperBtn}
                    onPress={() => setThumbFontSize(prev => Math.min(18.0, Number((prev + 0.5).toFixed(1))))}
                    activeOpacity={0.7}
                  >
                    <Plus size={13} color="#1a2d5a" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Quick Size Presets */}
              <View style={styles.presetRow}>
                {FONT_SIZE_PRESETS.map((p) => {
                  const isSelected = thumbFontSize === p.size;
                  return (
                    <TouchableOpacity
                      key={p.label}
                      style={[styles.presetChip, isSelected && styles.presetChipActive]}
                      onPress={() => setThumbFontSize(p.size)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.presetChipTxt, isSelected && styles.presetChipTxtActive]} numberOfLines={1}>
                        {p.label}
                      </Text>
                      <Text style={[styles.presetChipSubTxt, isSelected && styles.presetChipSubTxtActive]} numberOfLines={1}>
                        {p.size}pt
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* 3. ALIGNMENT (HORIZONTAL) */}
            <View style={{ marginTop: 14 }}>
              <Text style={styles.typoSubHeading}>టెక్స్ట్ అలైన్‌మెంట్ (Horizontal Alignment)</Text>
              <View style={styles.segmentedControl}>
                {(['left', 'center', 'right'] as const).map((align) => {
                  const isSelected = thumbTextAlign === align;
                  const label = align === 'left' ? 'ఎడమ (Left)' : align === 'center' ? 'మధ్యలో (Center)' : 'కుడి (Right)';
                  return (
                    <TouchableOpacity
                      key={align}
                      style={[styles.segmentBtn, isSelected && styles.segmentBtnActive]}
                      onPress={() => setThumbTextAlign(align)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.segmentBtnTxt, isSelected && styles.segmentBtnTxtActive]}>
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* 4. POSITION (VERTICAL) */}
            <View style={{ marginTop: 12 }}>
              <Text style={styles.typoSubHeading}>వాక్య స్థానం (Vertical Position)</Text>
              <View style={styles.segmentedControl}>
                {(['top', 'center', 'bottom'] as const).map((pos) => {
                  const isSelected = thumbTextPosition === pos;
                  const label = pos === 'top' ? 'పైభాగం (Top)' : pos === 'center' ? 'మధ్యలో (Center)' : 'క్రింద (Bottom)';
                  return (
                    <TouchableOpacity
                      key={pos}
                      style={[styles.segmentBtn, isSelected && styles.segmentBtnActive]}
                      onPress={() => setThumbTextPosition(pos)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.segmentBtnTxt, isSelected && styles.segmentBtnTxtActive]}>
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* 5. TEXT COLOR SELECTION */}
            <View style={{ marginTop: 14 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <Text style={styles.typoSubHeading}>టెక్స్ట్ రంగు (Text Color)</Text>
                <View style={styles.selectedColorBadge}>
                  <View style={[styles.selectedColorDot, { backgroundColor: thumbTextColor }]} />
                  <Text style={styles.selectedColorBadgeTxt} numberOfLines={1}>
                    {TEXT_COLOR_PALETTE.find(c => c.hex.toLowerCase() === thumbTextColor.toLowerCase())?.label || thumbTextColor}
                  </Text>
                </View>
              </View>

              {/* Category Filter Tabs */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.colorCategoryScroll}>
                {TEXT_COLOR_CATEGORIES.map((cat) => {
                  const isCatSelected = activeTextColorCategory === cat;
                  return (
                    <TouchableOpacity
                      key={cat}
                      style={[styles.colorCategoryChip, isCatSelected && styles.colorCategoryChipActive]}
                      onPress={() => setActiveTextColorCategory(cat)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.colorCategoryChipTxt, isCatSelected && styles.colorCategoryChipTxtActive]}>
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Color Swatches Grid */}
              <View style={styles.colorSwatchWrap}>
                {TEXT_COLOR_PALETTE
                  .filter(c => activeTextColorCategory === 'All' || c.category === activeTextColorCategory)
                  .map((c) => {
                    const isSelected = thumbTextColor.toLowerCase() === c.hex.toLowerCase();
                    return (
                      <TouchableOpacity
                        key={c.hex}
                        style={[
                          styles.textSwatchCircle,
                          { backgroundColor: c.hex },
                          isSelected && styles.textSwatchCircleActive,
                        ]}
                        onPress={() => {
                          setThumbTextColor(c.hex);
                          setCustomTextColorInput(c.hex);
                        }}
                        activeOpacity={0.7}
                      >
                        {isSelected && (
                          <Check
                            size={12}
                            color={isDarkColor(c.hex) ? '#FFFFFF' : '#111827'}
                            strokeWidth={3}
                          />
                        )}
                      </TouchableOpacity>
                    );
                  })}
              </View>

              {/* Custom Hex Color input */}
              <View style={styles.customColorInputRow}>
                <Text style={styles.customColorInputLabel}>Custom Hex:</Text>
                <TextInput
                  style={styles.customColorTextInput}
                  value={customTextColorInput}
                  placeholder="#FFFFFF"
                  placeholderTextColor="#94A3B8"
                  maxLength={7}
                  autoCapitalize="characters"
                  onChangeText={(txt) => {
                    setCustomTextColorInput(txt);
                    if (/^#[0-9A-Fa-f]{6}$/.test(txt)) {
                      setThumbTextColor(txt);
                    }
                  }}
                />
                <View style={[styles.customColorSample, { backgroundColor: thumbTextColor }]} />
              </View>
            </View>

            {/* 6. FONT WEIGHT & ITALIC STYLE */}
            <View style={{ marginTop: 14 }}>
              <Text style={styles.typoSubHeading}>స్టైల్ & మందం (Style & Weight)</Text>
              <View style={styles.styleAndWeightRow}>
                <View style={styles.weightSegmentedControl}>
                  {[
                    { label: 'Regular', val: '400' },
                    { label: 'SemiBold', val: '600' },
                    { label: 'Bold', val: '700' },
                    { label: 'Heavy', val: '800' },
                  ].map((w) => {
                    const isSelected = thumbFontWeight === w.val;
                    return (
                      <TouchableOpacity
                        key={w.val}
                        style={[styles.segmentBtn, isSelected && styles.segmentBtnActive]}
                        onPress={() => setThumbFontWeight(w.val)}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.segmentBtnTxt, isSelected && styles.segmentBtnTxtActive]}>
                          {w.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Italic Toggle */}
                <TouchableOpacity
                  style={[styles.italicToggleBtn, thumbIsItalic && styles.italicToggleBtnActive]}
                  onPress={() => setThumbIsItalic(prev => !prev)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.italicToggleTxt, thumbIsItalic && styles.italicToggleTxtActive]}>
                    Italic (వాలు)
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </View>
    );
  };

  // ── JSX ─────────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* ── APP HEADER ── */}
      <View style={styles.appHeader}>
        <View style={styles.headerRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flexShrink: 1 }}>
            <TouchableOpacity onPress={() => setTabByName?.('Dashboard')} style={{ flexDirection: 'row', alignItems: 'center', flexShrink: 0 }}>
              <ChevronLeft size={20} color="#fff" style={{ marginLeft: -6, marginRight: 4 }} />
              <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>Back</Text>
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { marginHorizontal: 12, opacity: 0.4, flexShrink: 0 }]}>|</Text>
            <View style={{ flexShrink: 1 }}>
              <Text style={[styles.headerTitle, { flexShrink: 1 }]} numberOfLines={1}>AI Thumbnail Creation</Text>
            </View>
          </View>
        </View>

      </View>

      {/* ── TOP OF THE PAGE TAB SWITCHER ── */}
      <View style={styles.topTabSwitcherWrap}>
        <View style={styles.topTabSwitcher}>
          <TouchableOpacity
            style={[styles.switchBtn, activeScreenTab === 'create' && styles.switchBtnActive]}
            onPress={() => setActiveScreenTab('create')}
            activeOpacity={0.85}
          >
            {activeScreenTab === 'create' && (
              <LinearGradient
                colors={['#5B3FA6', '#8B5FBF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFillObject}
              />
            )}
            <Wand2 size={14} color={activeScreenTab === 'create' ? '#fff' : '#6B627F'} style={{ zIndex: 1 }} />
            <Text style={[styles.switchBtnTxt, activeScreenTab === 'create' && styles.switchBtnTxtActive]}>
              Create Thumbnail
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.switchBtn, activeScreenTab === 'history' && styles.switchBtnActive]}
            onPress={() => setActiveScreenTab('history')}
            activeOpacity={0.85}
          >
            {activeScreenTab === 'history' && (
              <LinearGradient
                colors={['#5B3FA6', '#8B5FBF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFillObject}
              />
            )}
            <Layers size={14} color={activeScreenTab === 'history' ? '#fff' : '#6B627F'} style={{ zIndex: 1 }} />
            <Text style={[styles.switchBtnTxt, activeScreenTab === 'history' && styles.switchBtnTxtActive]}>
              Creations History
            </Text>
            {historyItems.length > 0 && (
              <View style={[styles.badgeCount, activeScreenTab === 'history' && styles.badgeCountActive]}>
                <Text style={[styles.badgeCountTxt, activeScreenTab === 'history' && styles.badgeCountTxtActive]}>
                  {historyItems.length}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* ── MAIN CONTENT / FORM SECTION ── */}
      <View style={styles.mainContentArea}>
        {activeScreenTab === 'create' ? (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          <ScrollView
            showsVerticalScrollIndicator={true}
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
          >
          
          <View style={styles.lede}>
            <Text style={styles.h1}>Church Event Thumbnail Studio</Text>
            <Text style={styles.p}>
              Pick your content type and date. Titles, scriptures, church logo, contact details, and visuals are generated dynamically for you!
            </Text>
          </View>

          {/* STEP 1: CONTENT TYPE */}
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
                  onPress={() => selectContentTypeWithVariation(ct.key)}
                  activeOpacity={0.8}
                >
                  {selected && (
                    <LinearGradient 
                      colors={['#5B3FA6', '#8B5FBF', '#E3A83B']} 
                      start={{x:0, y:0}} 
                      end={{x:1, y:1}} 
                      style={StyleSheet.absoluteFillObject} 
                      pointerEvents="none"
                    />
                  )}
                  <Icon size={16} color={selected ? '#fff' : '#5B3FA6'} style={{ zIndex: 1 }} />
                  <Text style={[styles.tileLabel, selected && { color: '#fff' }]}>{ct.key}</Text>
                  {selected && (
                    <View style={styles.checkWrap} pointerEvents="none">
                      <Check size={9} color="#5B3FA6" strokeWidth={3} />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* THEME & BIBLE SCRIPTURE SECTION (AUTO-SELECTED ON TILE PRESS & FULLY EDITABLE) */}
          {contentType ? (
            <View style={styles.themeScriptureCard}>
              <View style={styles.themeScriptureHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Sparkles size={15} color="#5B3FA6" />
                  <Text style={styles.themeScriptureHeaderTitle}>Theme & Bible Verse</Text>
                </View>

                {/* 🔀 Shuffle / Different Variation Button */}
                <TouchableOpacity
                  style={styles.shuffleBtn}
                  onPress={() => selectContentTypeWithVariation(contentType)}
                  activeOpacity={0.75}
                >
                  <RefreshCw size={12} color="#5B3FA6" />
                  <Text style={styles.shuffleBtnTxt}>Different Theme & Verse</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.themeScriptureSub}>
                Auto-picked for “{contentType}”. You can select any Bible book, chapter and verse below, switch Bible translations, or manually edit any field.
              </Text>

              {/* ── AUTO-POPULATE BIBLE VERSE (Matching Create Promise Flow) ── */}
              <View style={styles.autoPopulateCard}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <BookOpen size={14} color="#1a2d5a" />
                    <Text style={styles.autoPopulateTitle}>Auto-Populate Bible Verse</Text>
                  </View>
                  {isFetchingVerse && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                      <ActivityIndicator size="small" color="#1a2d5a" />
                      <Text style={{ fontSize: 11, color: '#64748B', fontWeight: '500' }}>Fetching verse…</Text>
                    </View>
                  )}
                </View>

                <View style={{ flexDirection: 'column', gap: 10 }}>
                  {/* Select Book Touchable */}
                  <TouchableOpacity 
                    style={[styles.input, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 46, paddingVertical: 10, paddingHorizontal: 12, backgroundColor: '#FFFFFF' }]} 
                    onPress={() => { setSelectionModalType('book'); setBookSearchQuery(''); }}
                    activeOpacity={0.7}
                  >
                    <Text style={{ color: selectedBook !== null ? '#1a2d5a' : '#94A3B8', flex: 1, fontSize: 13, fontWeight: '600' }} numberOfLines={1} ellipsizeMode="tail">
                      {selectedBook !== null ? `${ENGLISH_NAMES[selectedBook]} - ${TELUGU_NAMES[selectedBook]}` : 'Select Bible Book (గ్రంథము ఎంచుకోండి)'}
                    </Text>
                    <ChevronDown size={16} color="#94A3B8" style={{ marginLeft: 6 }} />
                  </TouchableOpacity>
                  
                  {/* Select Chapter & Verse Touchables Row */}
                  <View style={{ flexDirection: 'row', gap: 10, alignItems: 'stretch' }}>
                    <TouchableOpacity 
                      style={[styles.input, { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 46, paddingVertical: 10, paddingHorizontal: 10, backgroundColor: '#FFFFFF' }]} 
                      onPress={() => {
                        if (selectedBook === null) return Alert.alert('Info', 'Please select a Bible Book first');
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
                        {selectedChapter !== null ? `Chapter ${selectedChapter}` : 'Select Chapter (అధ్యాయం)'}
                      </Text>
                      <ChevronDown size={15} color="#94A3B8" />
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={[styles.input, { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 46, paddingVertical: 10, paddingHorizontal: 10, backgroundColor: '#FFFFFF' }]} 
                      onPress={() => {
                        if (selectedChapter === null) return Alert.alert('Info', 'Please select a Chapter first');
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
                        {selectedVerse !== null ? `Verse ${selectedVerse}` : 'Select Verse (వచనం)'}
                      </Text>
                      <ChevronDown size={15} color="#94A3B8" />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Bible Version Selection Chips */}
                <View style={{ marginTop: 12 }}>
                  <Text style={{ fontSize: 11.5, fontWeight: '700', color: '#475569', marginBottom: 6 }}>
                    బైబిల్ వెర్షన్ (Bible Selection)
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                    {BIBLE_VERSIONS.map((bv) => {
                      const isSelected = selectedBibleVersion === bv.name;
                      return (
                        <TouchableOpacity
                          key={bv.id}
                          style={[styles.bibleVersionChip, isSelected && styles.bibleVersionChipActive]}
                          onPress={() => handleBibleVersionChange(bv)}
                          activeOpacity={0.75}
                        >
                          <View style={[styles.bibleVersionTag, isSelected && styles.bibleVersionTagActive]}>
                            <Text style={[styles.bibleVersionTagTxt, isSelected && styles.bibleVersionTagTxtActive]}>
                              {bv.tag}
                            </Text>
                          </View>
                          <Text style={[styles.bibleVersionChipTxt, isSelected && styles.bibleVersionChipTxtActive]} numberOfLines={1}>
                            {bv.name}
                          </Text>
                          {isSelected && <Check size={11} color="#FFFFFF" strokeWidth={3} style={{ marginLeft: 4 }} />}
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              </View>

              {/* Theme / Event Title Input */}
              <Text style={styles.fieldLabelSmall}>Theme / Event Title (శీర్షిక)</Text>
              <TextInput
                style={styles.themeInput}
                value={customTheme}
                onChangeText={setCustomTheme}
                placeholder={language === 'Telugu' ? 'ఉదా. బైబిల్ అధ్యయనం' : 'e.g. BIBLE STUDY'}
                placeholderTextColor="#9ca3af"
              />

              {/* Tagline / Subtitle Input */}
              <Text style={styles.fieldLabelSmall}>Tagline / Subtitle (ఉప శీర్షిక)</Text>
              <TextInput
                style={styles.themeInput}
                value={customTagline}
                onChangeText={setCustomTagline}
                placeholder={language === 'Telugu' ? 'ఉదా. సత్య వాక్య పరిచర్య' : 'e.g. DISCOVER THE WORD'}
                placeholderTextColor="#9ca3af"
              />

              {/* Telugu Bible Verse Section */}
              <View style={{ marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#E2E8F0' }}>
                <Text style={[styles.fieldLabelSmall, { color: '#1a2d5a', fontWeight: '700' }]}>
                  Telugu Promise - తెలుగు వాగ్దానం
                </Text>
                
                <Text style={styles.fieldLabelSmall}>Verse Reference — Telugu (రిఫరెన్స్)</Text>
                <TextInput
                  style={styles.themeInput}
                  value={customVerseRef}
                  onChangeText={setCustomVerseRef}
                  placeholder="ఉదా. యోహాను 3:16"
                  placeholderTextColor="#9ca3af"
                />

                <Text style={styles.fieldLabelSmall}>Verse Text — Telugu (వాక్య భాగం)</Text>
                <TextInput
                  style={[styles.themeInput, styles.multilineInput]}
                  value={customVerseText}
                  onChangeText={setCustomVerseText}
                  multiline
                  numberOfLines={3}
                  placeholder="తెలుగులో బైబిల్ వచనం ఇక్కడ టైప్ చేయండి…"
                  placeholderTextColor="#9ca3af"
                />
              </View>

              {/* English Bible Verse Section */}
              <View style={{ marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#E2E8F0' }}>
                <Text style={[styles.fieldLabelSmall, { color: '#1a2d5a', fontWeight: '700' }]}>
                  English Promise - ఇంగ్లీష్ వాగ్దానం
                </Text>

                <Text style={styles.fieldLabelSmall}>Verse Reference — English</Text>
                <TextInput
                  style={styles.themeInput}
                  value={customVerseEnglishRef}
                  onChangeText={setCustomVerseEnglishRef}
                  placeholder="e.g. John 3:16"
                  placeholderTextColor="#9ca3af"
                />

                <Text style={styles.fieldLabelSmall}>Verse Text — English</Text>
                <TextInput
                  style={[styles.themeInput, styles.multilineInput]}
                  value={customVerseEnglishText}
                  onChangeText={setCustomVerseEnglishText}
                  multiline
                  numberOfLines={2}
                  placeholder="Type or paste Bible verse in English…"
                  placeholderTextColor="#9ca3af"
                />
              </View>

              {/* Quick Fetch Verse in Selected Translation */}
              <TouchableOpacity
                style={styles.fetchScriptureBtn}
                onPress={() => handleFetchVerse(selectedBook, selectedChapter, selectedVerse)}
                disabled={isFetchingVerse}
                activeOpacity={0.75}
              >
                {isFetchingVerse ? (
                  <ActivityIndicator size="small" color="#5B3FA6" />
                ) : (
                  <RefreshCw size={12} color="#5B3FA6" />
                )}
                <Text style={styles.fetchScriptureBtnTxt}>
                  {isFetchingVerse ? 'Loading Verse…' : `Re-Fetch in ${selectedBibleVersion}`}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.emptyPromptCard}>
              <Sparkles size={15} color="#8B5CF6" />
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={styles.emptyPromptTitle}>
                  {language === 'Telugu' ? 'ఈవెంట్ రకాన్ని ఎంచుకోండి' : 'Choose a Content Type Above'}
                </Text>
                <Text style={styles.emptyPromptSub} numberOfLines={1}>
                  {language === 'Telugu'
                    ? 'థీమ్, వాక్యం & ప్రత్యేక డిజైన్ ఆటోమేటిక్‌గా రూపొందించబడతాయి'
                    : 'Theme, scriptures & unique AI background will generate dynamically'}
                </Text>
              </View>
            </View>
          )}

          {/* STEP 2: EVENT DETAILS */}
          <View style={styles.sectionLabel}>
            <View style={styles.stepNum}><Text style={styles.stepNumTxt}>2</Text></View>
            <Text style={styles.sectionLabelTxt}>Event details</Text>
          </View>

          {/* Language Selector: Telugu vs English */}
          <Text style={styles.fieldLabel}>Thumbnail Language / భాష</Text>
          <View style={styles.langSelectorRow}>
            <TouchableOpacity
              style={[styles.langChoiceBtn, language === 'Telugu' && styles.langChoiceBtnActive]}
              onPress={() => handleLanguageChange('Telugu')}
              activeOpacity={0.8}
            >
              {language === 'Telugu' && (
                <LinearGradient
                  colors={['#5B3FA6', '#8B5FBF']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFillObject}
                />
              )}
              <Text style={[styles.langChoiceTxt, language === 'Telugu' && styles.langChoiceTxtActive]}>
                తెలుగు (Telugu)
              </Text>
              {language === 'Telugu' && <Check size={13} color="#fff" style={{ marginLeft: 6, zIndex: 1 }} />}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.langChoiceBtn, language === 'English' && styles.langChoiceBtnActive]}
              onPress={() => handleLanguageChange('English')}
              activeOpacity={0.8}
            >
              {language === 'English' && (
                <LinearGradient
                  colors={['#5B3FA6', '#8B5FBF']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFillObject}
                />
              )}
              <Text style={[styles.langChoiceTxt, language === 'English' && styles.langChoiceTxtActive]}>
                English
              </Text>
              {language === 'English' && <Check size={13} color="#fff" style={{ marginLeft: 6, zIndex: 1 }} />}
            </TouchableOpacity>
          </View>

          {/* Speaker Name */}
          <Text style={styles.fieldLabel}>Speaker Name (Optional)</Text>
          <TextInput
            style={styles.input}
            value={speaker}
            onChangeText={setSpeaker}
            placeholder="e.g. Pastor John Miller / పాస్టర్ గారు"
            placeholderTextColor="#9ca3af"
          />

          {/* Start Date & End Date */}
          <View style={styles.row2}>
            <View style={{ flex: 1 }}>
              <Text style={styles.fieldLabel}>Start Date</Text>
              <TouchableOpacity style={styles.inputBox} onPress={() => setStartDatePickerVisibility(true)}>
                <Text style={{ color: startDate ? '#211A2E' : '#9ca3af', fontSize: 13 }}>
                  {startDate ? formatDate(startDate) : 'Select Start Date'}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.fieldLabel}>End Date</Text>
              <TouchableOpacity style={styles.inputBox} onPress={() => setEndDatePickerVisibility(true)}>
                <Text style={{ color: endDate ? '#211A2E' : '#9ca3af', fontSize: 13 }}>
                  {endDate ? formatDate(endDate) : 'Select End Date'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Start Time & End Time */}
          <View style={styles.row2}>
            <View style={{ flex: 1 }}>
              <Text style={styles.fieldLabel}>Start Time</Text>
              <TouchableOpacity style={styles.inputBox} onPress={() => setStartTimePickerVisibility(true)}>
                <Text style={{ color: startTime ? '#211A2E' : '#9ca3af', fontSize: 13 }}>
                  {startTime ? formatTime(startTime) : 'Select Start Time'}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.fieldLabel}>End Time</Text>
              <TouchableOpacity style={styles.inputBox} onPress={() => setEndTimePickerVisibility(true)}>
                <Text style={{ color: endTime ? '#211A2E' : '#9ca3af', fontSize: 13 }}>
                  {endTime ? formatTime(endTime) : 'Select End Time'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Location */}
          <Text style={styles.fieldLabel}>Location</Text>
          <TextInput
            style={styles.input}
            value={location}
            onChangeText={setLocation}
            placeholder="e.g. Church Sanctuary / Live Online"
            placeholderTextColor="#9ca3af"
          />

          {/* Reference Thumbnail Attached Banner (If user selected one at Generate stage) */}
          {sampleImageUri && (
            <View style={styles.refThumbnailBanner}>
              <Image source={{ uri: sampleImageUri }} style={styles.refThumbnailImg} />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.refThumbnailTitle}>Reference Thumbnail Active</Text>
                <Text style={styles.refThumbnailSub}>AI will match this layout, color & visual style</Text>
              </View>
              <TouchableOpacity onPress={() => setSampleImageUri(null)} style={{ padding: 6 }}>
                <X size={16} color="#DC2626" />
              </TouchableOpacity>
            </View>
          )}

          {/* ── STEP 3: TYPOGRAPHY & TELUGU FONTS (Requirement 5) ── */}
          {renderTypographySection()}

          {/* ── THUMBNAIL COLOR & THEME PALETTE ── */}
          {renderColorPickerSection()}

          {/* GENERATE BUTTON */}
          <View style={{ marginTop: 16 }}>
            <TouchableOpacity onPress={handleGeneratePress} disabled={generating} activeOpacity={0.88} style={styles.btnPrimary}>
              <LinearGradient colors={['#5B3FA6', '#8B5FBF', '#E3A83B']} start={{x:0, y:0}} end={{x:1, y:1}} style={styles.btnGradient} />
              {generating && (
                <ActivityIndicator size="small" color="#fff" style={{ zIndex: 1, marginRight: 8 }} />
              )}
              <Text style={styles.btnPrimaryTxt}>
                {generating ? 'Generating AI Background…' : (bgImageUrl ? 'Re-Generate AI Background' : 'Generate AI Background')}
              </Text>
            </TouchableOpacity>
            {generating && (
              <Text style={styles.generatingTxt}>
                Generating authentic visual without watermarks… ~5-10s.
              </Text>
            )}
          </View>

          {/* ── LIVE THUMBNAIL PREVIEW & RESULT (Requirement 3 & 6: Real-Time 2-Way Sync) ── */}
          <View style={styles.outputPanel}>
            <View style={styles.outputHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Sparkles size={15} color="#5B3FA6" />
                <Text style={styles.outputHeaderTxt}>
                  {bgImageUrl ? 'Generated Church Graphic' : 'Live Thumbnail Preview'}
                </Text>
              </View>
              <View style={styles.cleanBadge}>
                <Text style={styles.cleanBadgeTxt}>
                  {bgImageUrl ? '100% Watermark-Free' : '⚡ Real-Time Sync'}
                </Text>
              </View>
            </View>

            {/* VIEWSHOT CAPTURE FRAME (16:9 Landscape) */}
            {(() => {
              const isTelugu = language === 'Telugu';
              const dyn = activeDyn;
              const churchLogoUrl = activeChurch?.theme?.logoUrl;
              const churchName = (activeChurch?.name || 'CHURCH OF GOD').toUpperCase();
              const churchPhone = activeChurch?.contactPhone || '8000504070';
              const effectiveLocation = location.trim() || activeChurch?.address || (isTelugu ? 'చర్చి ప్రాంగణం' : 'Church Sanctuary');

              const effectiveTheme = customTheme.trim() || (isTelugu ? dyn.teluguTitle : dyn.englishTitle);
              const effectiveTagline = customTagline.trim() || (isTelugu ? (dyn.taglineTelugu || dyn.teluguTitle) : dyn.tagline);
              const effectiveVerseRef = customVerseRef.trim() || (isTelugu ? dyn.verseRefTelugu : dyn.verseRefEnglish);
              const effectiveVerseText = customVerseText.trim() || (isTelugu ? dyn.verseTextTelugu : dyn.verseTextEnglish);

              const dateDisplay = formatDateRange(startDate, endDate, isTelugu);
              const timeDisplay = formatTimeRange(startTime, endTime, isTelugu);

              // ── Dynamic Responsive Typography & Layout Calculations ──
              const activeTeluguFont = getActiveFontFamily(thumbFontFamily);
              const isTeluguCustom = isCustomTeluguFont(thumbFontFamily);
              // Android Typeface fallback protection:
              // Custom Telugu fonts on Android fail/fallback if fontWeight !== 'normal'
              const effectiveFontWeight = isTeluguCustom && Platform.OS === 'android' ? 'normal' : thumbFontWeight;
              const effectiveFontStyle = isTeluguCustom ? 'normal' : (thumbIsItalic ? 'italic' : 'normal');
              const syntheticSkew = (isTeluguCustom && thumbIsItalic) ? [{ skewX: '-12deg' }] : [];
              const directTextJustify = thumbTextPosition === 'top' ? 'flex-start' : thumbTextPosition === 'bottom' ? 'flex-end' : 'center';

              // Title / Theme calculations
              const themeLen = effectiveTheme.length;
              const hasMultipleWords = effectiveTheme.trim().includes(' ');
              const isThemeLong = isTelugu ? themeLen > 11 : (themeLen > 10 || hasMultipleWords);
              const themeMaxLines = themeLen > 35 ? 3 : isThemeLong ? 2 : 1;
              const themeFontSize = (() => {
                if (isTelugu) {
                  if (themeLen <= 9) return 16.5;
                  if (themeLen <= 15) return 14.0;
                  if (themeLen <= 24) return 12.2;
                  if (themeLen <= 36) return 10.8;
                  return 9.6;
                } else {
                  if (themeLen <= 8) return 16.0;
                  if (themeLen <= 14) return 13.0;
                  if (themeLen <= 24) return 11.5;
                  if (themeLen <= 36) return 10.2;
                  return 9.2;
                }
              })();
              const themeLineHeight = Math.round(themeFontSize * (isTelugu ? 1.25 : 1.18));

              // Tagline calculations
              const tagLen = effectiveTagline.length;
              const tagFontSize = tagLen > 30 ? 5.6 : tagLen > 20 ? 6.3 : 7.0;

              // Location calculations
              const locLen = effectiveLocation.length;
              const isLocLong = locLen > 30;
              const isLocVeryLong = locLen > 55;
              const locFontSize = isLocVeryLong ? 4.9 : isLocLong ? 5.5 : 6.2;
              const locLineHeight = Math.round(locFontSize * 1.25);
              const locMaxLines = isLocLong ? 2 : 1;

              // Date & Time calculations
              const timeLen = timeDisplay.length;
              const isTimeVeryLong = timeLen > 22;
              const timeFontSize = isTimeVeryLong ? 4.1 : timeLen > 16 ? 4.8 : 5.8;
              const timeLineHeight = Math.round(timeFontSize * 1.25);

              const dateLen = dateDisplay.length;
              const isDateLong = dateLen > 18;
              const dateFontSize = isDateLong ? 4.9 : 5.8;
              const dateLineHeight = Math.round(dateFontSize * 1.25);

              // Speaker calculations
              const speakerLen = speaker ? speaker.length : 0;
              const speakerFontSize = speakerLen > 26 ? 7.0 : 8.0;

              // Church Name calculations
              const churchNameFontSize = churchName.length > 25 ? 8.2 : 9.5;

              // Scripture Verse calculations (Left Column)
              const verseLen = effectiveVerseText.length;
              const verseFontSize = verseLen > 110 ? 7.4 : verseLen > 70 ? 8.2 : 8.8;
              const verseLineHeight = Math.round(verseFontSize * 1.32);
              const verseMaxLines = verseLen > 90 ? 5 : 4;

              // Dynamic vertical spacing adjustments to prevent any crowding or clipping
              const isDenseLayout = isThemeLong || isLocLong || speakerLen > 20;
              const heroBannerPaddingV = isDenseLayout ? 2 : 3.5;
              const metaContainerGap = isDenseLayout ? 2 : 2.5;

              // Dedicated Daily Promise Card check & formatting
              const isDailyPromise = contentType === 'Daily Promise Card';
              const promiseDateDisplay = (() => {
                const FULL_EN_MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
                const targetDate = startDate || new Date();
                const m = targetDate.getMonth();
                const d = targetDate.getDate();
                if (endDate && (endDate.getDate() !== d || endDate.getMonth() !== m)) {
                  return formatDateRange(targetDate, endDate, isTelugu);
                }
                return isTelugu ? `${TELUGU_MONTHS[m]} ${d}` : `${FULL_EN_MONTHS[m]} ${d}`;
              })();

              const cleanVerse = (v: string) => (v || '').trim().replace(/^[“"']+|[”"'.]+$/g, '');
              const cleanRefWithoutOuter = (r: string) => {
                return (r || '').trim().replace(/^[-—\s()]+|[-—\s()]+$/g, '');
              };

              const teluguText = customVerseText.trim() || dyn.verseTextTelugu || 'దీర్ఘాయువు చేత అతనిని తృప్తిపరచెదను';
              const teluguRef = customVerseRef.trim() || dyn.verseRefTelugu || 'కీర్తనల గ్రంథము 91:16';
              const englishText = customVerseEnglishText.trim() || dyn.verseTextEnglish || 'I will satisfy him with long life';
              const englishRef = customVerseEnglishRef.trim() || dyn.verseRefEnglish || 'Psalm 91:16';

              return (
                <ViewShot
                  ref={viewShotRef}
                  options={{ format: 'jpg', quality: 1.0 }}
                  style={[styles.thumbnailFrame, { borderColor: activeSecondaryColor }]}
                >
                  {/* 1. Pure AI Background Image or Default Devotional Visual */}
                  <Image
                    source={{ uri: bgImageUrl || DEFAULT_PREVIEW_BACKGROUND }}
                    style={StyleSheet.absoluteFillObject}
                    resizeMode="cover"
                  />

                  {/* 2. Professional Cinematic Vignette Gradient */}
                  <LinearGradient
                    colors={thumbnailVignetteColors}
                    start={thumbnailGradientStart}
                    end={thumbnailGradientEnd}
                    style={StyleSheet.absoluteFillObject}
                  />

                  {/* 3. CONTENT LAYOUT: DEDICATED DEVOTIONAL STYLE FOR DAILY PROMISE, OR TWO-COLUMN FOR EVENTS */}
                  {isDailyPromise ? (
                    <View style={styles.promiseMainLayout}>
                      {/* Top Header Bar: Church Logo & Name on left, Date Badge on right */}
                      <View style={styles.promiseTopBar}>
                        <View style={styles.promiseLogoRow}>
                          {churchLogoUrl ? (
                            <Image source={{ uri: churchLogoUrl }} style={styles.promiseChurchLogo} resizeMode="contain" />
                          ) : (
                            <View style={[styles.promiseLogoFallback, { backgroundColor: activePrimaryColor }]}>
                              <Text style={styles.thumbChurchLogoCross} allowFontScaling={false}>✝</Text>
                            </View>
                          )}
                          <View style={{ flexShrink: 1 }}>
                            <Text
                              style={[
                                styles.promiseChurchName,
                                {
                                  fontFamily: activeTeluguFont,
                                  fontWeight: effectiveFontWeight as any,
                                  transform: syntheticSkew,
                                }
                              ]}
                              numberOfLines={1}
                              allowFontScaling={false}
                            >
                              {churchName}
                            </Text>
                          </View>
                        </View>

                        {/* Date Badge */}
                        <View style={styles.promiseDatePill}>
                          <CalendarIcon size={8.5} color="#F59E0B" strokeWidth={2.4} />
                          <Text
                            style={[
                              styles.promiseDateTxt,
                              {
                                fontFamily: activeTeluguFont,
                                fontWeight: effectiveFontWeight as any,
                                transform: syntheticSkew,
                              }
                            ]}
                            numberOfLines={1}
                            allowFontScaling={false}
                          >
                            {promiseDateDisplay}
                          </Text>
                        </View>
                      </View>

                      {/* Theme / Event Title (if entered) */}
                      {effectiveTheme ? (
                        <View style={[styles.promiseThemeHeaderWrap, { alignItems: thumbTextAlign === 'left' ? 'flex-start' : thumbTextAlign === 'right' ? 'flex-end' : 'center' }]}>
                          <Text
                            style={[
                              styles.promiseThemeTitle,
                              {
                                fontFamily: activeTeluguFont,
                                fontWeight: effectiveFontWeight as any,
                                fontStyle: effectiveFontStyle as any,
                                transform: syntheticSkew,
                                color: thumbTextColor || '#FFFFFF',
                                textAlign: thumbTextAlign,
                              }
                            ]}
                            numberOfLines={1}
                            allowFontScaling={false}
                          >
                            {effectiveTheme}
                          </Text>
                        </View>
                      ) : null}

                      {/* Speaker Badge (if entered) */}
                      {speaker ? (
                        <View style={[styles.promiseSpeakerRow, { alignItems: thumbTextAlign === 'left' ? 'flex-start' : thumbTextAlign === 'right' ? 'flex-end' : 'center', marginTop: 2, marginBottom: 2 }]}>
                          <View style={[styles.thumbSpeakerBadge, { borderColor: `${activeSecondaryColor}99` }]}>
                            <Mic size={7.5} color={activeSecondaryColor} />
                            <Text
                              style={[
                                styles.thumbSpeakerBadgeTxt,
                                {
                                  fontSize: 7.2,
                                  fontFamily: activeTeluguFont,
                                  fontWeight: effectiveFontWeight as any,
                                  fontStyle: effectiveFontStyle as any,
                                  transform: syntheticSkew,
                                  color: thumbTextColor || '#FFFFFF',
                                }
                              ]}
                              numberOfLines={1}
                              allowFontScaling={false}
                            >
                              {(() => {
                                const s = speaker.trim();
                                if (/^(with|by|pastor|bro|rev|డాక్టర్|పాస్టర్|బ్రదర్|సందేశం|వాక్య)/i.test(s)) return s;
                                return isTelugu ? `సందేశం: ${s}` : `With ${s}`;
                              })()}
                            </Text>
                          </View>
                        </View>
                      ) : null}

                      {/* Direct Scripture Placement on Background */}
                      <View style={[styles.promiseDirectTextWrapper, { justifyContent: directTextJustify }]}>
                        <View style={styles.promiseQuoteContainer}>
                          {(() => {
                            const hasEnglish = !!englishText;
                            const teLen = (teluguText || '').length;
                            const enLen = (englishText || '').length;

                            // Dynamic height & font balancing so bilingual verses never collide with header or footer:
                            const effectiveTeFontSize = hasEnglish
                              ? (teLen > 80 ? Math.min(thumbFontSize, 11.0) : teLen > 50 ? Math.min(thumbFontSize, 11.8) : Math.min(thumbFontSize, 12.6))
                              : thumbFontSize;
                            const effectiveTeLineHeight = Math.round(effectiveTeFontSize * 1.34);
                            const effectiveTeRefFontSize = Math.min(effectiveTeFontSize * 0.72, 8.5);

                            // English companion verse: elegant SERIF, legible sizing, compact vertical footprint
                            const effectiveEnFontSize = enLen > 110 ? 6.8 : enLen > 65 ? 7.4 : 8.2;
                            const effectiveEnLineHeight = Math.round(effectiveEnFontSize * 1.25);
                            const effectiveEnRefFontSize = Math.min(effectiveEnFontSize * 0.95, 7.0);

                            return (
                              <>
                                {/* Telugu Scripture Line */}
                                <View style={[styles.promiseQuoteLineWrap, { alignItems: thumbTextAlign === 'left' ? 'flex-start' : thumbTextAlign === 'right' ? 'flex-end' : 'center' }]}>
                                  <Text
                                    style={[
                                      styles.promiseQuoteTelugu,
                                      {
                                        fontFamily: activeTeluguFont,
                                        fontSize: effectiveTeFontSize,
                                        lineHeight: effectiveTeLineHeight,
                                        color: thumbTextColor,
                                        fontWeight: effectiveFontWeight as any,
                                        fontStyle: effectiveFontStyle as any,
                                        textAlign: thumbTextAlign,
                                        transform: syntheticSkew,
                                      }
                                    ]}
                                    numberOfLines={hasEnglish ? 3 : 4}
                                    adjustsFontSizeToFit={true}
                                    minimumFontScale={0.65}
                                    allowFontScaling={false}
                                  >
                                    “{cleanVerse(teluguText)}.”
                                  </Text>
                                </View>

                                {/* Dedicated Telugu Scripture Reference Row */}
                                {teluguRef ? (
                                  <View style={[styles.promiseRefRow, { marginTop: 1, marginBottom: 0, alignItems: thumbTextAlign === 'left' ? 'flex-start' : thumbTextAlign === 'right' ? 'flex-end' : 'center' }]}>
                                    <Text
                                      style={[
                                        styles.promiseQuoteTeluguRef,
                                        {
                                          fontFamily: activeTeluguFont,
                                          fontSize: effectiveTeRefFontSize,
                                          color: isDarkColor(activeSecondaryColor) ? '#FCD34D' : activeSecondaryColor,
                                          fontWeight: effectiveFontWeight as any,
                                          fontStyle: effectiveFontStyle as any,
                                          textAlign: thumbTextAlign,
                                          transform: syntheticSkew,
                                        }
                                      ]}
                                      numberOfLines={1}
                                      adjustsFontSizeToFit={true}
                                      minimumFontScale={0.75}
                                      allowFontScaling={false}
                                    >
                                      — {cleanRefWithoutOuter(teluguRef)}
                                    </Text>
                                  </View>
                                ) : null}

                                {/* Subtle Decorative Golden Divider (only if English is entered) */}
                                {hasEnglish ? (
                                  <View style={[styles.promiseDividerRow, { marginVertical: 1.5, width: '36%' }]}>
                                    <View style={styles.promiseDividerLine} />
                                    <Text style={styles.promiseDividerCross} allowFontScaling={false}>✝</Text>
                                    <View style={styles.promiseDividerLine} />
                                  </View>
                                ) : null}

                                {/* English Scripture Line */}
                                {englishText ? (
                                  <View style={[styles.promiseQuoteLineWrap, { alignItems: thumbTextAlign === 'left' ? 'flex-start' : thumbTextAlign === 'right' ? 'flex-end' : 'center' }]}>
                                    <Text
                                      style={[
                                        styles.promiseQuoteEnglish,
                                        {
                                          fontFamily: SERIF,
                                          fontSize: effectiveEnFontSize,
                                          lineHeight: effectiveEnLineHeight,
                                          color: thumbTextColor === '#FFFFFF' ? '#FEF3C7' : thumbTextColor,
                                          fontWeight: '500',
                                          fontStyle: 'italic',
                                          textAlign: thumbTextAlign,
                                          letterSpacing: 0.12,
                                          textShadowColor: isDarkColor(thumbTextColor) ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.92)',
                                          textShadowOffset: { width: 0, height: 1.2 },
                                          textShadowRadius: 3,
                                        }
                                      ]}
                                      numberOfLines={2}
                                      adjustsFontSizeToFit={true}
                                      minimumFontScale={0.7}
                                      allowFontScaling={false}
                                    >
                                      “{cleanVerse(englishText)}.”
                                    </Text>
                                    {englishRef ? (
                                      <View style={[styles.promiseRefRow, { marginTop: 1, marginBottom: 0, alignItems: thumbTextAlign === 'left' ? 'flex-start' : thumbTextAlign === 'right' ? 'flex-end' : 'center' }]}>
                                        <Text
                                          style={[
                                            styles.promiseQuoteEnglishRef,
                                            {
                                              fontFamily: SERIF,
                                              fontSize: effectiveEnRefFontSize,
                                              fontWeight: '600',
                                              fontStyle: 'normal',
                                              textAlign: thumbTextAlign,
                                              color: '#FCD34D',
                                              letterSpacing: 0.2,
                                            }
                                          ]}
                                          numberOfLines={1}
                                          adjustsFontSizeToFit={true}
                                          minimumFontScale={0.8}
                                          allowFontScaling={false}
                                        >
                                          — {cleanRefWithoutOuter(englishRef)}
                                        </Text>
                                      </View>
                                    ) : null}
                                  </View>
                                ) : null}
                              </>
                            );
                          })()}
                        </View>

                        {/* Devotional Tagline / Blessing */}
                        {effectiveTagline ? (
                          <View style={[styles.promiseTagRow, { alignItems: thumbTextAlign === 'left' ? 'flex-start' : thumbTextAlign === 'right' ? 'flex-end' : 'center' }]}>
                            <Text
                              style={[
                                styles.promiseTagTxt,
                                {
                                  fontFamily: activeTeluguFont,
                                  fontWeight: effectiveFontWeight as any,
                                  fontStyle: effectiveFontStyle as any,
                                  textAlign: thumbTextAlign,
                                  transform: syntheticSkew,
                                }
                              ]}
                              numberOfLines={1}
                              adjustsFontSizeToFit={true}
                              minimumFontScale={0.8}
                              allowFontScaling={false}
                            >
                              {effectiveTagline}
                            </Text>
                          </View>
                        ) : null}

                        {/* Optional Time & Location in Daily Promise (if entered) */}
                        {(timeDisplay || effectiveLocation) ? (
                          <View style={[styles.promiseMetaRow, { justifyContent: thumbTextAlign === 'left' ? 'flex-start' : thumbTextAlign === 'right' ? 'flex-end' : 'center', marginTop: 2, marginBottom: 2 }]}>
                            {timeDisplay ? (
                              <View style={styles.promiseMetaPill}>
                                <Clock size={7} color="#FDE68A" />
                                <Text
                                  style={[
                                    styles.promiseMetaTxt,
                                    {
                                      fontFamily: activeTeluguFont,
                                      fontWeight: effectiveFontWeight as any,
                                      fontStyle: effectiveFontStyle as any,
                                      transform: syntheticSkew,
                                    }
                                  ]}
                                  numberOfLines={1}
                                  allowFontScaling={false}
                                >
                                  {timeDisplay}
                                </Text>
                              </View>
                            ) : null}
                            {effectiveLocation ? (
                              <View style={styles.promiseMetaPill}>
                                <MapPin size={7} color="#FDE68A" />
                                <Text
                                  style={[
                                    styles.promiseMetaTxt,
                                    {
                                      fontFamily: activeTeluguFont,
                                      fontWeight: effectiveFontWeight as any,
                                      fontStyle: effectiveFontStyle as any,
                                      transform: syntheticSkew,
                                    }
                                  ]}
                                  numberOfLines={1}
                                  allowFontScaling={false}
                                >
                                  {effectiveLocation}
                                </Text>
                              </View>
                            ) : null}
                          </View>
                        ) : null}
                      </View>

                      {/* Bottom Footer: Phone on left, Blessing on right */}
                      <View style={styles.promiseBottomBar}>
                        <View style={[styles.thumbPhonePill, { backgroundColor: activePrimaryColor }]}>
                          <Phone size={7} color="#fff" />
                          <Text
                            style={[
                              styles.thumbPhoneTxt,
                              {
                                fontFamily: activeTeluguFont,
                                fontWeight: effectiveFontWeight as any,
                                transform: syntheticSkew,
                              }
                            ]}
                            numberOfLines={1}
                            allowFontScaling={false}
                          >
                            {isTelugu ? `మరిన్ని వివరాలకు : ${churchPhone}` : `for more information : ${churchPhone}`}
                          </Text>
                        </View>
                        <Text
                          style={[
                            styles.thumbWelcomeScript,
                            {
                              color: isDarkColor(activeSecondaryColor) ? '#FDE68A' : activeSecondaryColor,
                              fontFamily: activeTeluguFont,
                              fontWeight: effectiveFontWeight as any,
                              fontStyle: effectiveFontStyle as any,
                              transform: syntheticSkew,
                            }
                          ]}
                          numberOfLines={1}
                          allowFontScaling={false}
                        >
                          {isTelugu ? 'దీవించబడుదురు గాక' : 'Be Blessed & Victorious'}
                        </Text>
                      </View>

                      {/* Live Loading Overlay while generating thumbnail */}
                      {generating && (
                        <View style={styles.thumbnailGeneratingOverlay}>
                          <ActivityIndicator size="large" color="#FFFFFF" />
                          <Text style={styles.thumbnailGeneratingTxt}>Generating New Background…</Text>
                        </View>
                      )}
                    </View>
                  ) : (
                    <View style={styles.thumbMainRow}>
                      
                      {/* LEFT COLUMN (38% width): Church Logo at top, Scripture in center, Sub-footer at bottom */}
                      <View style={styles.thumbLeftCol}>
                        {/* Top Left Church Logo */}
                        <View style={styles.thumbTopLeftLogoWrap}>
                          {churchLogoUrl ? (
                            <Image source={{ uri: churchLogoUrl }} style={styles.thumbChurchLogoImg} resizeMode="contain" />
                          ) : (
                            <View style={[styles.thumbChurchLogoFallback, { backgroundColor: activePrimaryColor }]}>
                              <Text style={styles.thumbChurchLogoCross}>✝</Text>
                            </View>
                          )}
                        </View>

                        {/* Scripture Verse Quote & Reference */}
                        <View style={styles.thumbLeftScriptureBox}>
                          <Text
                            style={[
                              styles.scriptureQuoteItalic,
                              {
                                fontFamily: activeTeluguFont,
                                fontSize: Math.min(verseFontSize, thumbFontSize),
                                lineHeight: verseLineHeight,
                                color: thumbTextColor,
                                fontWeight: effectiveFontWeight as any,
                                fontStyle: effectiveFontStyle as any,
                                textAlign: thumbTextAlign,
                                transform: syntheticSkew,
                              }
                            ]}
                            numberOfLines={verseMaxLines}
                            allowFontScaling={false}
                          >
                            “{effectiveVerseText}”
                          </Text>
                          <Text
                            style={[
                              styles.scriptureRefBadge,
                              {
                                color: activeSecondaryColor,
                                fontFamily: activeTeluguFont,
                                textAlign: thumbTextAlign,
                                transform: syntheticSkew,
                              }
                            ]}
                            allowFontScaling={false}
                          >
                            {effectiveVerseRef}
                          </Text>
                        </View>

                        {/* Bottom Left Sub-text */}
                        <Text
                          style={[
                            styles.thumbLeftFooterTxt,
                            {
                              fontFamily: activeTeluguFont,
                              fontWeight: effectiveFontWeight as any,
                              fontStyle: effectiveFontStyle as any,
                              transform: syntheticSkew,
                            }
                          ]}
                          allowFontScaling={false}
                        >
                          {isTelugu
                            ? 'రండి   |   ఆరాధించండి   |   పొందుకోండి   |   దీవించబడండి'
                            : 'COME   |   WORSHIP   |   RECEIVE   |   BE BLESSED'}
                        </Text>
                      </View>

                      {/* RIGHT COLUMN (62% width): Header, Title, Speaker, Metadata, Phone Bar */}
                      <View style={styles.thumbRightCol}>
                        
                        {/* Church Header */}
                        <View style={styles.thumbHeaderBlock}>
                          <View style={styles.thumbChurchHeaderRow}>
                            <Text
                              style={[
                                styles.thumbChurchNameCaps,
                                {
                                  fontSize: churchNameFontSize,
                                  fontFamily: activeTeluguFont,
                                  fontWeight: effectiveFontWeight as any,
                                  transform: syntheticSkew,
                                }
                              ]}
                              numberOfLines={1}
                              allowFontScaling={false}
                            >
                              {churchName}
                            </Text>
                          </View>
                        </View>

                        {/* Hero Title Block (Theme / Event Title) */}
                        <View style={[styles.thumbHeroBanner, { backgroundColor: `${activePrimaryColor}88`, borderColor: `${activeSecondaryColor}55`, borderWidth: 1, paddingVertical: heroBannerPaddingV }]}>
                          <Text
                            style={[
                              isTelugu ? styles.thumbHeroTitleTelugu : styles.thumbHeroTitleEnglish,
                              {
                                fontFamily: activeTeluguFont,
                                fontSize: themeFontSize,
                                lineHeight: themeLineHeight,
                                letterSpacing: isTelugu ? 0.2 : (themeLen > 12 ? 0.4 : 0.7),
                                textAlign: thumbTextAlign,
                                fontWeight: effectiveFontWeight as any,
                                fontStyle: effectiveFontStyle as any,
                                transform: syntheticSkew,
                                color: thumbTextColor || '#FFFFFF',
                              }
                            ]}
                            numberOfLines={themeMaxLines}
                            adjustsFontSizeToFit={true}
                            minimumFontScale={0.75}
                            allowFontScaling={false}
                          >
                            {effectiveTheme}
                          </Text>
                          {effectiveTagline ? (
                            <View style={[styles.thumbTagPillWrap, { marginTop: isDenseLayout ? 1.5 : 2 }]}>
                              <Text style={styles.thumbLeaf} allowFontScaling={false}>🌿</Text>
                              <View style={[styles.thumbTagPill, { paddingVertical: tagLen > 25 ? 0.5 : 1 }]}>
                                <Text
                                  style={[
                                    styles.thumbTagPillTxt,
                                    {
                                      fontSize: tagFontSize,
                                      fontFamily: activeTeluguFont,
                                      fontWeight: effectiveFontWeight as any,
                                      fontStyle: effectiveFontStyle as any,
                                      transform: syntheticSkew,
                                    }
                                  ]}
                                  numberOfLines={1}
                                  adjustsFontSizeToFit={true}
                                  minimumFontScale={0.8}
                                  allowFontScaling={false}
                                >
                                  {effectiveTagline}
                                </Text>
                              </View>
                              <Text style={styles.thumbLeaf} allowFontScaling={false}>🌿</Text>
                            </View>
                          ) : null}
                        </View>

                        {/* Speaker Name */}
                        {speaker ? (
                          <View style={[styles.thumbSpeakerBadge, { borderColor: `${activeSecondaryColor}99` }]}>
                            <Mic size={9} color={activeSecondaryColor} />
                            <Text
                              style={[
                                styles.thumbSpeakerBadgeTxt,
                                {
                                  fontSize: speakerFontSize,
                                  fontFamily: activeTeluguFont,
                                  fontWeight: effectiveFontWeight as any,
                                  fontStyle: effectiveFontStyle as any,
                                  transform: syntheticSkew,
                                  color: thumbTextColor || '#FFFFFF',
                                }
                              ]}
                              numberOfLines={1}
                              allowFontScaling={false}
                            >
                              {(() => {
                                const s = speaker.trim();
                                if (/^(with|by|pastor|bro|rev|డాక్టర్|పాస్టర్|బ్రదర్|సందేశం|వాక్య)/i.test(s)) {
                                  return s;
                                }
                                if (isTelugu) {
                                  return `సందేశం: ${s}`;
                                }
                                return `With ${s}`;
                              })()}
                            </Text>
                          </View>
                        ) : null}

                        {/* Metadata Container: Row 1 for Date & Time, Row 2 for Full Location */}
                        <View style={[styles.thumbMetaContainer, { gap: metaContainerGap }]}>
                          {(dateDisplay || timeDisplay) ? (
                            <View style={styles.thumbMetaRow}>
                              {dateDisplay ? (
                                <View style={[styles.thumbMetaCard, timeDisplay ? { flex: 0.82 } : { flex: 1 }]}>
                                  <View style={[styles.thumbMetaIconCircle, { backgroundColor: activePrimaryColor }]}>
                                    <CalendarIcon size={8} color="#fff" />
                                  </View>
                                  <View style={styles.thumbMetaTextWrap}>
                                    <Text
                                      style={[
                                        styles.thumbMetaLabel,
                                        {
                                          fontFamily: activeTeluguFont,
                                          fontWeight: effectiveFontWeight as any,
                                          transform: syntheticSkew,
                                        }
                                      ]}
                                      allowFontScaling={false}
                                    >
                                      {isTelugu ? 'తేదీ :' : 'Date :'}
                                    </Text>
                                    <Text
                                      style={[
                                        styles.thumbMetaValue,
                                        {
                                          fontSize: dateFontSize,
                                          lineHeight: dateLineHeight,
                                          fontFamily: activeTeluguFont,
                                          fontWeight: effectiveFontWeight as any,
                                          fontStyle: effectiveFontStyle as any,
                                          transform: syntheticSkew,
                                        }
                                      ]}
                                      numberOfLines={1}
                                      adjustsFontSizeToFit
                                      minimumFontScale={0.75}
                                      allowFontScaling={false}
                                    >
                                      {dateDisplay}
                                    </Text>
                                  </View>
                                </View>
                              ) : null}

                              {timeDisplay ? (
                                <View style={[styles.thumbMetaCard, dateDisplay ? { flex: 1.18 } : { flex: 1 }]}>
                                  <View style={[styles.thumbMetaIconCircle, { backgroundColor: activePrimaryColor }]}>
                                    <Clock size={8} color="#fff" />
                                  </View>
                                  <View style={styles.thumbMetaTextWrap}>
                                    <Text
                                      style={[
                                        styles.thumbMetaLabel,
                                        {
                                          fontFamily: activeTeluguFont,
                                          fontWeight: effectiveFontWeight as any,
                                          transform: syntheticSkew,
                                        }
                                      ]}
                                      allowFontScaling={false}
                                    >
                                      {isTelugu ? 'సమయం :' : 'Time :'}
                                    </Text>
                                    <Text
                                      style={[
                                        styles.thumbMetaValue,
                                        {
                                          fontSize: timeFontSize,
                                          lineHeight: timeLineHeight,
                                          fontFamily: activeTeluguFont,
                                          fontWeight: effectiveFontWeight as any,
                                          fontStyle: effectiveFontStyle as any,
                                          transform: syntheticSkew,
                                        }
                                      ]}
                                      numberOfLines={1}
                                      adjustsFontSizeToFit
                                      minimumFontScale={0.7}
                                      allowFontScaling={false}
                                    >
                                      {timeDisplay}
                                    </Text>
                                  </View>
                                </View>
                              ) : null}
                            </View>
                          ) : null}

                          {effectiveLocation ? (
                            <View style={[styles.thumbLocationCard, isLocLong && { paddingVertical: 1.5 }]}>
                              <View style={[styles.thumbMetaIconCircle, { backgroundColor: activePrimaryColor }]}>
                                <MapPin size={8} color="#fff" />
                              </View>
                              <View style={styles.thumbLocationTextWrap}>
                                <Text
                                  style={[
                                    styles.thumbLocationValue,
                                    {
                                      fontSize: locFontSize,
                                      lineHeight: locLineHeight,
                                      fontFamily: activeTeluguFont,
                                      fontWeight: effectiveFontWeight as any,
                                      fontStyle: effectiveFontStyle as any,
                                      transform: syntheticSkew,
                                    }
                                  ]}
                                  numberOfLines={locMaxLines}
                                  allowFontScaling={false}
                                >
                                  <Text
                                    style={[
                                      styles.thumbMetaLabel,
                                      {
                                        fontFamily: activeTeluguFont,
                                        fontWeight: effectiveFontWeight as any,
                                        transform: syntheticSkew,
                                      }
                                    ]}
                                    allowFontScaling={false}
                                  >
                                    {isTelugu ? 'స్థలం: ' : 'Location: '}
                                  </Text>
                                  {effectiveLocation}
                                </Text>
                              </View>
                            </View>
                          ) : null}
                        </View>

                        {/* Bottom Footer Row: Phone pill on left, "All are Welcome" on right */}
                        <View style={styles.thumbBottomBarRow}>
                          <View style={[styles.thumbPhonePill, { backgroundColor: activePrimaryColor }]}>
                            <Phone size={8} color="#fff" />
                            <Text
                              style={[
                                styles.thumbPhoneTxt,
                                {
                                  fontFamily: activeTeluguFont,
                                  fontWeight: effectiveFontWeight as any,
                                  transform: syntheticSkew,
                                }
                              ]}
                              allowFontScaling={false}
                            >
                              {isTelugu ? `మరిన్ని వివరాలకు : ${churchPhone}` : `for more information : ${churchPhone}`}
                            </Text>
                          </View>
                          <Text
                            style={[
                              styles.thumbWelcomeScript,
                              {
                                color: activeSecondaryColor,
                                fontFamily: activeTeluguFont,
                                fontWeight: effectiveFontWeight as any,
                                fontStyle: effectiveFontStyle as any,
                                transform: syntheticSkew,
                              }
                            ]}
                            allowFontScaling={false}
                          >
                            {isTelugu ? 'అందరికీ ఆహ్వానం' : 'All are Welcome'}
                          </Text>
                        </View>

                      </View>
                    </View>
                  )}

                  {/* Live Loading Overlay while generating thumbnail */}
                  {generating && (
                    <View style={styles.thumbnailGeneratingOverlay}>
                      <ActivityIndicator size="large" color="#FFFFFF" />
                      <Text style={styles.thumbnailGeneratingTxt}>Generating New Background…</Text>
                    </View>
                  )}
                </ViewShot>
              );
            })()}

            {/* Thumbnail Action Controls */}
            <View style={styles.thumbActionContainer}>
              {/* Row 1: Re-Generate & Change Background */}
              <View style={styles.thumbActionRow}>
                <TouchableOpacity
                  style={[styles.btnThumbAction, styles.btnThumbActionPrimary]}
                  onPress={() => executeGenerate()}
                  disabled={generating}
                  activeOpacity={0.7}
                >
                  {generating ? (
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
                    {generating ? 'Generating…' : (bgImageUrl ? 'Re-Generate AI Visual' : 'Generate AI Background')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.btnThumbAction, styles.btnThumbActionSuccess]}
                  onPress={() => executeGenerate()}
                  disabled={generating}
                  activeOpacity={0.7}
                >
                  <Sparkles size={14} color="#15803D" strokeWidth={2.2} />
                  <Text 
                    style={styles.btnThumbActionSuccessTxt} 
                    numberOfLines={1} 
                    adjustsFontSizeToFit={true} 
                    minimumFontScale={0.85}
                  >
                    Change Visual Style
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Row 2: Download & Share */}
              <View style={styles.thumbActionRow}>
                <TouchableOpacity
                  style={[styles.btnThumbActionSub, styles.btnThumbActionSecondary]}
                  onPress={handleSaveToGallery}
                  disabled={savingImage || generating}
                  activeOpacity={0.7}
                >
                  {savingImage ? (
                    <ActivityIndicator size="small" color="#374151" />
                  ) : (
                    <Download size={13} color="#374151" strokeWidth={2.2} />
                  )}
                  <Text 
                    style={styles.btnThumbActionSecondaryTxt} 
                    numberOfLines={1} 
                    adjustsFontSizeToFit={true} 
                    minimumFontScale={0.85}
                  >
                    {savingImage ? 'Downloading…' : 'Download Thumbnail'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.btnThumbActionSub, styles.btnThumbActionSecondary]}
                  onPress={handleShareImage}
                  disabled={sharingImage || generating}
                  activeOpacity={0.7}
                >
                  {sharingImage ? (
                    <ActivityIndicator size="small" color="#374151" />
                  ) : (
                    <Share2 size={13} color="#374151" strokeWidth={2.2} />
                  )}
                  <Text 
                    style={styles.btnThumbActionSecondaryTxt} 
                    numberOfLines={1} 
                    adjustsFontSizeToFit={true} 
                    minimumFontScale={0.85}
                  >
                    {sharingImage ? 'Sharing…' : 'Share'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Row 3: New Creation */}
              <View style={styles.thumbActionRow}>
                <TouchableOpacity
                  style={[styles.btnThumbActionSub, { backgroundColor: '#F3F4F6', borderColor: '#E5E7EB' }]}
                  onPress={resetForm}
                  disabled={generating}
                  activeOpacity={0.7}
                >
                  <Wand2 size={13} color="#4B5563" strokeWidth={2.2} />
                  <Text 
                    style={[styles.btnThumbActionSecondaryTxt, { color: '#4B5563' }]} 
                    numberOfLines={1} 
                    adjustsFontSizeToFit={true} 
                    minimumFontScale={0.85}
                  >
                    Reset / New Creation
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={{ height: 24 }} />
        </ScrollView>
      </KeyboardAvoidingView>
      ) : (
        /* ── CREATIONS HISTORY TAB ── */
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          <View style={styles.searchBarWrap}>
            <Search size={16} color="#8A8298" style={{ marginLeft: 12 }} />
            <TextInput
              style={styles.searchInput}
              value={historySearch}
              onChangeText={setHistorySearch}
              placeholder="Search previous creations…"
              placeholderTextColor="#9ca3af"
            />
            {historySearch ? (
              <TouchableOpacity onPress={() => setHistorySearch('')} style={{ padding: 8 }}>
                <X size={14} color="#8A8298" />
              </TouchableOpacity>
            ) : null}
          </View>

          {loadingHistory ? (
            <View style={{ paddingVertical: 40, alignItems: 'center' }}>
              <ActivityIndicator size="large" color="#5B3FA6" />
              <Text style={{ marginTop: 12, color: '#5B5468', fontSize: 13 }}>Loading past creations…</Text>
            </View>
          ) : filteredHistory.length === 0 ? (
            <View style={styles.emptyHistoryWrap}>
              <ImageIcon size={44} color="#8A8298" />
              <Text style={styles.emptyHistoryTitle}>No Creations Found</Text>
              <Text style={styles.emptyHistorySub}>
                {historySearch ? 'No creations match your search.' : 'You haven’t generated any visuals yet. Switch to "Create Visual" to begin!'}
              </Text>
              <TouchableOpacity
                style={styles.emptyHistoryBtn}
                onPress={() => setActiveScreenTab('create')}
              >
                <Text style={styles.emptyHistoryBtnTxt}>Create First Visual</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.historyGrid}>
              {filteredHistory.map(item => (
                <View key={item.id} style={styles.historyCard}>
                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => setViewImageModal(item.imageUrl)}
                    style={styles.historyImgWrap}
                  >
                    <Image source={{ uri: item.imageUrl }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
                    <View style={styles.historyTypeBadge}>
                      <Text style={styles.historyTypeBadgeTxt}>{item.contentType || 'Graphic'}</Text>
                    </View>
                  </TouchableOpacity>

                  <View style={styles.historyBody}>
                    <Text style={styles.historyTopic} numberOfLines={2}>
                      {item.topic || 'Untitled Graphic'}
                    </Text>
                    <Text style={styles.historyDate}>
                      {item.dateText ? item.dateText : item.createdAt?.seconds ? formatDate(new Date(item.createdAt.seconds * 1000)) : 'Recent'}
                      {item.speaker ? ` • ${item.speaker}` : ''}
                    </Text>

                    <View style={styles.historyActionRow}>
                      <TouchableOpacity
                        style={styles.historyIconBtn}
                        onPress={() => setViewImageModal(item.imageUrl)}
                      >
                        <Eye size={14} color="#5B3FA6" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.historyIconBtn}
                        onPress={async () => {
                          if (item.imageUrl) {
                            try {
                              const filename = `church_${Date.now()}.jpg`;
                              const fileUri = `${FileSystem.cacheDirectory}${filename}`;
                              const downloadRes = await FileSystem.downloadAsync(item.imageUrl, fileUri);
                              await MediaLibrary.saveToLibraryAsync(downloadRes.uri);
                              try { Vibration.vibrate(60); } catch (_) {}
                              setDownloadSuccessModal({ visible: true, imageUri: downloadRes.uri });
                            } catch (e) {
                              Alert.alert('Error', 'Failed to save.');
                            }
                          }
                        }}
                      >
                        <Download size={14} color="#5B3FA6" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.historyIconBtn, { backgroundColor: '#FDE8E8' }]}
                        onPress={() => handleDeleteHistory(item)}
                      >
                        <Trash2 size={14} color="#DC2626" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}

          <View style={{ height: 24 }} />
        </ScrollView>
      )}
      </View>

      {/* ── BIBLE SELECTION MODAL (Book / Chapter / Verse) ── */}
      <Modal visible={selectionModalType !== null} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.biblePickerCard, { height: '75%', maxHeight: 580 }]}>
            <View style={styles.biblePickerHd}>
              <Text style={styles.biblePickerTitle}>
                {selectionModalType === 'book' ? 'Select Bible Book (గ్రంథము)' : 
                 selectionModalType === 'chapter' ? `Select Chapter (${selectedBook !== null ? ENGLISH_NAMES[selectedBook] : ''})` : 
                 `Select Verse (${selectedBook !== null ? ENGLISH_NAMES[selectedBook] : ''} ${selectedChapter || ''})`}
              </Text>
              <TouchableOpacity onPress={() => { setSelectionModalType(null); setBookSearchQuery(''); }} style={{ padding: 5 }}>
                <X size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Book Search Input for 66 books */}
            {selectionModalType === 'book' && (
              <View style={styles.bibleModalSearchBox}>
                <Search size={15} color="#64748B" style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.bibleModalSearchInput}
                  placeholder="Search Book (e.g. John / యోహాను)..."
                  placeholderTextColor="#94A3B8"
                  value={bookSearchQuery}
                  onChangeText={setBookSearchQuery}
                  autoCorrect={false}
                  autoCapitalize="none"
                />
                {bookSearchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setBookSearchQuery('')} style={{ padding: 4 }}>
                    <X size={14} color="#64748B" />
                  </TouchableOpacity>
                )}
              </View>
            )}

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {selectionModalType === 'book' && ENGLISH_NAMES
                .map((name, idx) => ({ name, teName: TELUGU_NAMES[idx], idx }))
                .filter(b => {
                  if (!bookSearchQuery.trim()) return true;
                  const q = bookSearchQuery.toLowerCase().trim();
                  return b.name.toLowerCase().includes(q) || b.teName.toLowerCase().includes(q);
                })
                .map((b) => (
                  <TouchableOpacity 
                    key={b.idx} 
                    style={[styles.bibleModalOption, selectedBook === b.idx && styles.bibleModalOptionActive]}
                    onPress={() => {
                      setSelectedBook(b.idx);
                      setSelectedChapter(null);
                      setSelectedVerse(null);
                      setSelectionModalType('chapter');
                      setBookSearchQuery('');
                    }}
                  >
                    <Text style={[styles.bibleModalOptionText, selectedBook === b.idx && { color: '#fff', fontWeight: '700' }]}>
                      {b.name} - {b.teName}
                    </Text>
                  </TouchableOpacity>
              ))}
              
              {selectionModalType === 'chapter' && selectedBook !== null && Array.from({ length: LOCAL_TELUGU_BIBLE?.Book?.[selectedBook]?.Chapter?.length || 0 }).map((_, idx) => (
                <TouchableOpacity 
                  key={idx} 
                  style={[styles.bibleModalOption, selectedChapter === idx + 1 && styles.bibleModalOptionActive]}
                  onPress={() => {
                    setSelectedChapter(idx + 1);
                    setSelectedVerse(null);
                    setSelectionModalType('verse');
                  }}
                >
                  <Text style={[styles.bibleModalOptionText, selectedChapter === idx + 1 && { color: '#fff', fontWeight: '700' }]}>
                    Chapter {idx + 1}
                  </Text>
                </TouchableOpacity>
              ))}

              {selectionModalType === 'verse' && selectedBook !== null && selectedChapter !== null && Array.from({ length: LOCAL_TELUGU_BIBLE?.Book?.[selectedBook]?.Chapter?.[selectedChapter - 1]?.Verse?.length || 0 }).map((_, idx) => (
                <TouchableOpacity 
                  key={idx} 
                  style={[styles.bibleModalOption, selectedVerse === idx + 1 && styles.bibleModalOptionActive]}
                  onPress={() => {
                    const vNum = idx + 1;
                    setSelectedVerse(vNum);
                    setSelectionModalType(null);
                    handleFetchVerse(selectedBook, selectedChapter, vNum);
                  }}
                >
                  <Text style={[styles.bibleModalOptionText, selectedVerse === idx + 1 && { color: '#fff', fontWeight: '700' }]}>
                    Verse {idx + 1}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── REFERENCE THUMBNAIL STAGE MODAL ── */}
      <Modal visible={showRefModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Design Reference Thumbnail</Text>
              <TouchableOpacity onPress={() => setShowRefModal(false)} style={{ padding: 4 }}>
                <X size={18} color="#8A8298" />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSub}>
              Would you like to select a reference thumbnail to guide the visual composition, colors, and layout?
            </Text>

            <TouchableOpacity
              style={styles.modalOption}
              onPress={async () => {
                try {
                  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                  if (status !== 'granted') {
                    Alert.alert('Permission Needed', 'Please allow gallery access to select a reference thumbnail.');
                    return;
                  }
                  const res = await ImagePicker.launchImageLibraryAsync({
                    mediaTypes: ['images'],
                    allowsEditing: true,
                    quality: 0.8,
                  });
                  if (!res.canceled && res.assets && res.assets[0]?.uri) {
                    const uri = res.assets[0].uri;
                    setSampleImageUri(uri);
                    executeGenerate(uri);
                  }
                } catch (e) {
                  console.error('Ref image error:', e);
                }
              }}
            >
              <Upload size={18} color="#5B3FA6" />
              <View style={{ flex: 1 }}>
                <Text style={styles.modalOptionTitle}>Upload Reference Thumbnail</Text>
                <Text style={styles.modalOptionDesc}>AI will match layout & visual style from your image</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalOption, { backgroundColor: '#F3E8FF' }]}
              onPress={() => executeGenerate()}
            >
              <Sparkles size={18} color="#5B3FA6" />
              <View style={{ flex: 1 }}>
                <Text style={[styles.modalOptionTitle, { color: '#5B3FA6' }]}>Generate Directly (AI Auto-Style)</Text>
                <Text style={styles.modalOptionDesc}>AI automatically creates high-contrast, professional layout</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── FULLSCREEN IMAGE PREVIEW MODAL ── */}
      <Modal visible={!!viewImageModal} transparent animationType="fade">
        <View style={styles.fsModalOverlay}>
          <TouchableOpacity style={styles.fsCloseBtn} onPress={() => setViewImageModal(null)}>
            <X size={22} color="#fff" />
          </TouchableOpacity>

          {viewImageModal ? (
            <View style={styles.fsImageContainer}>
              <Image source={{ uri: viewImageModal }} style={styles.fsImage} resizeMode="contain" />
            </View>
          ) : null}
        </View>
      </Modal>

      {/* ── BEAUTIFUL DOWNLOAD SUCCESS MODAL ── */}
      <Modal
        visible={downloadSuccessModal.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setDownloadSuccessModal({ visible: false, imageUri: null })}
      >
        <View style={styles.downloadModalOverlay}>
          <View style={styles.downloadModalCard}>
            {/* Top Close Button */}
            <TouchableOpacity
              style={styles.downloadModalCloseBtn}
              onPress={() => setDownloadSuccessModal({ visible: false, imageUri: null })}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <X size={16} color="#64748B" strokeWidth={2.5} />
            </TouchableOpacity>

            {/* Glowing Icon Badge */}
            <View style={styles.downloadModalIconGlow}>
              <LinearGradient
                colors={['#10B981', '#059669']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.downloadModalIconBadge}
              >
                <CheckCircle2 size={30} color="#FFFFFF" strokeWidth={2.4} />
              </LinearGradient>
            </View>

            {/* Title & Description */}
            <Text style={styles.downloadModalTitle}>Thumbnail Saved! 🎉</Text>
            <Text style={styles.downloadModalSub}>
              High-resolution church thumbnail is now safely stored in your photo gallery.
            </Text>

            {/* Live Thumbnail Preview Frame */}
            {downloadSuccessModal.imageUri ? (
              <View style={styles.downloadPreviewFrame}>
                <Image
                  source={{ uri: downloadSuccessModal.imageUri }}
                  style={styles.downloadPreviewImage}
                  resizeMode="cover"
                />
                <View style={styles.downloadPillBadge}>
                  <Check size={11} color="#FFFFFF" strokeWidth={3} />
                  <Text style={styles.downloadPillText}>Ready to Publish</Text>
                </View>
              </View>
            ) : null}

            {/* Action Buttons */}
            <View style={styles.downloadModalBtnRow}>
              {downloadSuccessModal.imageUri ? (
                <TouchableOpacity
                  style={styles.downloadShareBtn}
                  onPress={async () => {
                    try {
                      if (downloadSuccessModal.imageUri && (await Sharing.isAvailableAsync())) {
                        await Sharing.shareAsync(downloadSuccessModal.imageUri);
                      }
                    } catch (e) {
                      console.error('Share from modal error:', e);
                    }
                  }}
                  activeOpacity={0.8}
                >
                  <Share2 size={16} color="#5B3FA6" strokeWidth={2.2} />
                  <Text style={styles.downloadShareBtnTxt}>Share</Text>
                </TouchableOpacity>
              ) : null}

              <TouchableOpacity
                style={[
                  styles.downloadDoneBtn,
                  !downloadSuccessModal.imageUri && { flex: 1 }
                ]}
                onPress={() => setDownloadSuccessModal({ visible: false, imageUri: null })}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={['#5B3FA6', '#4A2F92']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.downloadDoneBtnGrad}
                >
                  <Text style={styles.downloadDoneBtnTxt}>Awesome!</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Date & Time Picker Modals */}
      <DateTimePickerModal
        isVisible={isStartDatePickerVisible}
        mode="date"
        onConfirm={(date) => { setStartDate(date); setStartDatePickerVisibility(false); }}
        onCancel={() => setStartDatePickerVisibility(false)}
      />
      <DateTimePickerModal
        isVisible={isEndDatePickerVisible}
        mode="date"
        onConfirm={(date) => { setEndDate(date); setEndDatePickerVisibility(false); }}
        onCancel={() => setEndDatePickerVisibility(false)}
      />
      <DateTimePickerModal
        isVisible={isStartTimePickerVisible}
        mode="time"
        onConfirm={(time) => { setStartTime(time); setStartTimePickerVisibility(false); }}
        onCancel={() => setStartTimePickerVisibility(false)}
      />
      <DateTimePickerModal
        isVisible={isEndTimePickerVisible}
        mode="time"
        onConfirm={(time) => { setEndTime(time); setEndTimePickerVisibility(false); }}
        onCancel={() => setEndTimePickerVisibility(false)}
      />
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EDE7DC' },
  mainContentArea: { flex: 1 },
  scroll: { padding: 16, paddingTop: 8, paddingBottom: 100 },

  appHeader: {
    paddingTop: Platform.OS === 'ios' ? 54 : 36,
    paddingBottom: 16,
    paddingHorizontal: 18,
    backgroundColor: '#3A2A6B',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '700', fontFamily: SERIF },

  topTabSwitcherWrap: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 6,
    backgroundColor: '#EDE7DC',
  },
  topTabSwitcher: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 4,
    gap: 6,
    borderWidth: 1.2,
    borderColor: '#E7E0D6',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  switchBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 10,
    borderRadius: 10,
    overflow: 'hidden',
  },
  switchBtnActive: {
    backgroundColor: '#5B3FA6',
    shadowColor: '#5B3FA6',
    shadowOpacity: 0.25,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  switchBtnTxt: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B627F',
    zIndex: 1,
  },
  switchBtnTxtActive: {
    color: '#fff',
    fontWeight: '700',
  },
  badgeCount: {
    backgroundColor: '#E3A83B',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    marginLeft: 3,
    zIndex: 1,
  },
  badgeCountActive: {
    backgroundColor: '#fff',
  },
  badgeCountTxt: {
    color: '#211A2E',
    fontSize: 10.5,
    fontWeight: '800',
  },
  badgeCountTxtActive: {
    color: '#5B3FA6',
  },

  // Typography
  lede: { marginTop: 4, marginBottom: 12 },
  h1: { fontSize: 18, fontWeight: '700', fontFamily: SERIF, color: '#211A2E', lineHeight: 24 },
  p: { fontSize: 12, color: '#5B5468', marginTop: 4, lineHeight: 17 },

  sectionLabel: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    marginTop: 14, marginBottom: 8,
  },
  sectionLabelTxt: { fontSize: 12, fontWeight: '700', color: '#211A2E' },
  stepNum: {
    width: 17, height: 17, borderRadius: 8.5, backgroundColor: '#5B3FA6',
    justifyContent: 'center', alignItems: 'center', overflow: 'hidden'
  },
  stepNumTxt: { color: '#fff', fontSize: 10, fontWeight: '700' },

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
  themeScriptureCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginTop: 12,
    borderWidth: 1.4,
    borderColor: '#E7E0D6',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  themeScriptureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  themeScriptureHeaderTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#3A2A6B',
  },
  autoPill: {
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  autoPillTxt: {
    fontSize: 10,
    fontWeight: '700',
    color: '#7C3AED',
  },
  shuffleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F5F3FF',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  shuffleBtnTxt: {
    fontSize: 11,
    fontWeight: '600',
    color: '#5B3FA6',
  },
  themeScriptureSub: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 8,
    lineHeight: 15,
  },
  fieldLabelSmall: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4B5563',
    marginTop: 8,
    marginBottom: 4,
  },
  themeInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1.2,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    fontSize: 13,
    color: '#1F2937',
    fontFamily: SANS,
  },
  multilineInput: {
    minHeight: 58,
    textAlignVertical: 'top',
  },
  emptyPromptCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F3FF',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 10,
    borderLeftWidth: 3.5,
    borderLeftColor: '#8B5CF6',
  },
  emptyPromptTitle: {
    color: '#6D28D9',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyPromptSub: {
    color: '#6B7280',
    fontSize: 11,
    marginTop: 2,
  },

  fieldLabel: { fontSize: 11.5, fontWeight: '600', color: '#5B5468', marginTop: 12, marginBottom: 6 },
  langSelectorRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 2,
    marginBottom: 4,
  },
  langChoiceBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1.4,
    borderColor: '#E7E0D6',
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  langChoiceBtnActive: {
    borderColor: '#5B3FA6',
    shadowColor: '#5B3FA6',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  langChoiceTxt: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  langChoiceTxtActive: {
    color: '#fff',
    fontWeight: '700',
    zIndex: 1,
  },
  input: {
    backgroundColor: '#fff', borderWidth: 1.4, borderColor: '#E7E0D6',
    borderRadius: 10, paddingVertical: 10, paddingHorizontal: 12, fontSize: 13.5, color: '#211A2E', fontFamily: SANS,
  },
  inputBox: {
    backgroundColor: '#fff', borderWidth: 1.4, borderColor: '#E7E0D6',
    borderRadius: 10, paddingVertical: 10, paddingHorizontal: 12,
  },
  row2: { flexDirection: 'row', gap: 10, marginTop: 4 },

  pillScroll: { flexDirection: 'row', overflow: 'visible', paddingBottom: 4 },
  pill: {
    paddingHorizontal: 13, paddingVertical: 7, borderRadius: 999, borderWidth: 1.4, borderColor: '#E7E0D6',
    backgroundColor: '#fff', marginRight: 7, overflow: 'hidden'
  },
  pillSelected: { borderColor: 'transparent' },
  pillTxt: { fontSize: 12, color: '#211A2E', zIndex: 1, fontWeight: '500' },

  refThumbnailBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1.4,
    borderColor: '#5B3FA6',
    borderRadius: 12,
    padding: 8,
    marginTop: 14,
  },
  refThumbnailImg: { width: 48, height: 32, borderRadius: 6, backgroundColor: '#1E192B' },
  refThumbnailTitle: { fontSize: 12, fontWeight: '700', color: '#211A2E' },
  refThumbnailSub: { fontSize: 10.5, color: '#5B3FA6', marginTop: 2 },

  btnPrimary: {
    borderRadius: 12, overflow: 'hidden', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 13,
    shadowColor: '#5B3FA6', shadowOpacity: 0.4, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 5,
  },
  btnPrimarySmall: {
    flex: 1, borderRadius: 12, overflow: 'hidden', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, paddingHorizontal: 10
  },
  btnGradient: { ...StyleSheet.absoluteFillObject },
  btnPrimaryTxt: { color: '#fff', fontSize: 13.5, fontWeight: '700', fontFamily: SANS, zIndex: 1 },
  generatingTxt: { textAlign: 'center', fontSize: 11.5, color: '#5B5468', marginTop: 8, lineHeight: 16 },

  // Output Panel & Composite Thumbnail Styles
  outputPanel: {
    marginTop: 18,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.2,
    borderColor: '#E7E0D6',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3
  },
  outputHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  outputHeaderTxt: { fontSize: 13, fontWeight: '700', color: '#211A2E' },
  cleanBadge: {
    marginLeft: 'auto',
    backgroundColor: '#DEF7EC',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  cleanBadgeTxt: { color: '#03543F', fontSize: 10, fontWeight: '700' },

  // ── 16:9 Landscape Composite Canvas (Matches Reference Image) ──
  thumbnailFrame: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#1E192B',
    position: 'relative',
    borderWidth: 2,
    marginBottom: 12,
  },
  thumbMainRow: {
    flex: 1,
    flexDirection: 'row',
    paddingHorizontal: 9,
    paddingVertical: 8,
    zIndex: 10,
  },

  // Left Column (38% width)
  thumbLeftCol: {
    width: '38%',
    height: '100%',
    justifyContent: 'space-between',
    paddingRight: 6,
  },
  thumbTopLeftLogoWrap: {
    alignSelf: 'flex-start',
  },
  thumbChurchLogoImg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.95)',
    backgroundColor: '#fff',
  },
  thumbChurchLogoFallback: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1.5,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbChurchLogoCross: { color: '#fff', fontSize: 13, fontWeight: '800' },
  thumbLeftScriptureBox: {
    paddingVertical: 2,
  },
  thumbLeftScriptureArea: {
    paddingVertical: 2,
  },
  scriptureQuoteItalic: {
    color: '#fff',
    fontSize: 8.8,
    fontStyle: 'italic',
    fontFamily: SERIF,
    fontWeight: '700',
    lineHeight: 12,
    textShadowColor: 'rgba(0,0,0,0.95)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  scriptureRefBadge: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginTop: 2,
    textShadowColor: 'rgba(0,0,0,0.95)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  thumbLeftFooterTxt: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 5.5,
    letterSpacing: 0.6,
    fontWeight: '700',
  },

  // Right Column (62% width)
  thumbRightCol: {
    width: '62%',
    height: '100%',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: 4,
  },
  thumbHeaderBlock: {
    alignItems: 'center',
    width: '100%',
  },
  thumbChurchHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  thumbDoveIcon: { fontSize: 11 },
  thumbChurchNameCaps: {
    color: '#fff',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 1.8,
  },
  thumbChurchHeaderTxt: {
    color: '#fff',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 1.8,
  },
  thumbSubheaderTxt: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 6.5,
    fontWeight: '700',
    letterSpacing: 1,
    marginTop: 1,
  },

  // Hero Title Banner
  thumbHeroBanner: {
    width: '100%',
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: 7,
    alignItems: 'center',
    borderWidth: 0.8,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  thumbHeroTitleTelugu: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 0.2,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.95)',
    textShadowOffset: { width: 1, height: 2 },
    textShadowRadius: 4,
  },
  thumbHeroTitleEnglish: {
    color: '#fff',
    fontSize: 16.5,
    fontWeight: '900',
    letterSpacing: 0.5,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.95)',
    textShadowOffset: { width: 1, height: 2 },
    textShadowRadius: 4,
  },
  thumbHeroSubTitle: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginTop: 1,
    textAlign: 'center',
  },
  thumbHeroSubEnglish: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1.6,
    marginTop: 1,
    textAlign: 'center',
  },
  thumbTagPillWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  thumbLeaf: { fontSize: 7 },
  thumbTagPill: {
    backgroundColor: '#FDF6E2',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 3,
  },
  thumbTagPillTxt: {
    color: '#3B1800',
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 0.6,
  },

  // Speaker Badge
  thumbSpeakerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 7,
    paddingVertical: 1.5,
    borderRadius: 4,
    borderWidth: 0.8,
  },
  thumbSpeakerBadgeTxt: {
    color: '#fff',
    fontSize: 8,
    fontWeight: '700',
  },

  // Metadata Row & Container
  thumbMetaContainer: {
    width: '100%',
    gap: 2.5,
  },
  thumbMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 3.5,
    width: '100%',
  },
  thumbMetaCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2.5,
    backgroundColor: 'rgba(255,255,255,0.94)',
    paddingHorizontal: 3.5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  thumbMetaTextWrap: {
    flex: 1,
    flexShrink: 1,
  },
  thumbMetaIconCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  thumbMetaLabel: {
    fontSize: 5.5,
    fontWeight: '800',
    color: '#6B7280',
    lineHeight: 7.5,
  },
  thumbMetaValue: {
    fontSize: 6.2,
    fontWeight: '700',
    color: '#111827',
    lineHeight: 8.2,
  },
  thumbLocationCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3.5,
    backgroundColor: 'rgba(255,255,255,0.94)',
    paddingHorizontal: 4.5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  thumbLocationTextWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  thumbLocationValue: {
    fontSize: 6.2,
    fontWeight: '700',
    color: '#111827',
    flexShrink: 1,
    lineHeight: 8.2,
  },

  // Bottom Footer Bar
  thumbBottomBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingRight: 2,
  },
  thumbPhonePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 5,
    paddingVertical: 1.8,
    borderRadius: 999,
    borderWidth: 0.8,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  thumbPhoneTxt: {
    color: '#fff',
    fontSize: 6.8,
    fontWeight: '700',
  },
  thumbWelcomeScript: {
    fontSize: 9.5,
    fontStyle: 'italic',
    fontWeight: '700',
    fontFamily: SERIF,
  },

  // Backward compatibility aliases
  thumbRightContentBlock: {
    width: '62%',
  },
  thumbBottomBarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  thumbSubFooterRow: {
    alignItems: 'center',
  },
  thumbSubFooterTxt: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 5.5,
    letterSpacing: 1,
    fontWeight: '700',
  },

  // ── Daily Promise Dedicated Devotional Layout Styles ──
  promiseMainLayout: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 7,
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
    gap: 4,
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.65)',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 999,
    flexShrink: 0,
  },
  promiseDateTxt: {
    color: '#FFFFFF',
    fontSize: 7.5,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  promiseDirectTextWrapper: {
    flex: 1,
    marginHorizontal: 8,
    marginVertical: 2,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  promiseQuoteContainer: {
    width: '100%',
    paddingHorizontal: 4,
    flexShrink: 1,
  },
  promiseQuoteLineWrap: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  promiseQuoteTelugu: {
    fontSize: 10.5,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 14.5,
    textShadowColor: 'rgba(0, 0, 0, 0.95)',
    textShadowOffset: { width: 0, height: 1.5 },
    textShadowRadius: 3,
  },
  promiseRefRow: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
    marginBottom: 0,
  },
  promiseQuoteTeluguRef: {
    fontSize: 9.2,
    color: '#FCD34D',
    letterSpacing: 0.3,
    textShadowColor: 'rgba(0, 0, 0, 0.95)',
    textShadowOffset: { width: 0, height: 1.2 },
    textShadowRadius: 3,
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
    backgroundColor: 'rgba(245, 158, 11, 0.55)',
  },
  promiseDividerCross: {
    fontSize: 7.5,
    color: '#F59E0B',
    fontWeight: '800',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  promiseQuoteEnglish: {
    fontSize: 8.0,
    fontStyle: 'italic',
    fontWeight: '700',
    color: '#FEF3C7',
    textAlign: 'center',
    lineHeight: 11.5,
    fontFamily: SERIF,
    textShadowColor: 'rgba(0, 0, 0, 0.92)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  promiseQuoteEnglishRef: {
    fontSize: 8.0,
    fontWeight: '700',
    color: '#FCD34D',
    letterSpacing: 0.2,
    textShadowColor: 'rgba(0, 0, 0, 0.95)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  promiseRefBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    marginTop: 3,
  },
  promiseRefTxt: {
    fontSize: 7.5,
    fontWeight: '800',
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

  // Theme title row (shown above scripture in Daily Promise layout)
  promiseThemeHeaderWrap: {
    width: '100%',
    alignItems: 'center',
    marginTop: 3,
    marginBottom: 2,
    paddingHorizontal: 4,
  },
  promiseThemeTitle: {
    color: '#FFFFFF',
    fontSize: 11.0,
    fontWeight: '800',
    letterSpacing: 0.3,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.95)',
    textShadowOffset: { width: 0, height: 1.5 },
    textShadowRadius: 3,
  },

  // Speaker badge row (Daily Promise layout)
  promiseSpeakerRow: {
    width: '100%',
    alignItems: 'center',
    marginTop: 2,
    marginBottom: 2,
  },

  // Inline time/location pills inside scripture block (Daily Promise layout)
  promiseMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    marginTop: 2,
    marginBottom: 2,
    flexWrap: 'wrap',
  },
  promiseMetaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
    borderWidth: 0.8,
    borderColor: 'rgba(245, 158, 11, 0.55)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 999,
    flexShrink: 0,
  },
  promiseMetaTxt: {
    color: '#FDE68A',
    fontSize: 6.5,
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  promiseBottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 4,
    zIndex: 20,
    marginTop: 'auto',
    paddingTop: 1,
    paddingBottom: 1,
  },

  btnRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  btnGhost: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: '#F7F4EF', borderWidth: 1.2, borderColor: '#E7E0D6', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 8
  },
  btnGhostTxt: { fontSize: 13, fontWeight: '700', color: '#211A2E' },

  // History Grid
  emptyHistoryWrap: {
    paddingVertical: 50,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyHistoryTitle: { fontSize: 16, fontWeight: '700', color: '#211A2E', marginTop: 12 },
  emptyHistorySub: { fontSize: 12.5, color: '#5B5468', textAlign: 'center', marginTop: 6, lineHeight: 18 },
  emptyHistoryBtn: {
    marginTop: 16,
    backgroundColor: '#5B3FA6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  emptyHistoryBtnTxt: { color: '#fff', fontSize: 13, fontWeight: '700' },
  historyGrid: { gap: 12 },
  historyCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: '#E7E0D6',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  historyImgWrap: { height: 160, backgroundColor: '#1E192B', position: 'relative' },
  historyTypeBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(91,63,166,0.92)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  historyTypeBadgeTxt: { color: '#fff', fontSize: 10, fontWeight: '700' },
  historyBody: { padding: 12 },
  historyTopic: { fontSize: 14, fontWeight: '700', color: '#211A2E' },
  historyDate: { fontSize: 11, color: '#8A8298', marginTop: 3 },
  historyActionRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  historyIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Modals
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalBox: { width: '100%', maxWidth: 420, backgroundColor: '#fff', borderRadius: 18, padding: 18 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  modalTitle: { fontSize: 17, fontWeight: '700', color: '#211A2E', fontFamily: SERIF },
  modalSub: { fontSize: 12, color: '#5B5468', marginBottom: 14 },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#F7F4EF',
    marginBottom: 8,
  },
  modalOptionTitle: { fontSize: 13.5, fontWeight: '700', color: '#211A2E' },
  modalOptionDesc: { fontSize: 11, color: '#8A8298', marginTop: 2 },

  // Fullscreen Preview Modal
  fsModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' },
  fsCloseBtn: { position: 'absolute', top: 48, right: 20, zIndex: 10, padding: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20 },
  fsImageContainer: { width: '100%', height: '70%', justifyContent: 'center', alignItems: 'center' },
  fsImage: { width: '92%', height: '100%' },

  // Search
  searchBarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1.4,
    borderColor: '#E7E0D6',
    borderRadius: 12,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 10,
    fontSize: 13,
    color: '#211A2E',
  },

  // ── Thumbnail Action Controls ──
  thumbActionContainer: {
    marginTop: 12,
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

  // ── Auto-Populate Bible Verse Card (matching AdminPromiseEditor) ──
  autoPopulateCard: {
    backgroundColor: '#F8FAFC',
    padding: 14,
    borderRadius: 12,
    marginTop: 12,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  autoPopulateTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1a2d5a',
  },

  // ── Bible Selection Modal Styles ──
  biblePickerCard: {
    backgroundColor: '#fff',
    width: '90%',
    maxWidth: 380,
    borderRadius: 20,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  biblePickerHd: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  biblePickerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a2d5a',
    flex: 1,
  },
  bibleModalSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  bibleModalSearchInput: {
    flex: 1,
    fontSize: 13,
    color: '#1E293B',
    padding: 0,
  },
  bibleModalOption: {
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    borderRadius: 8,
  },
  bibleModalOptionActive: {
    backgroundColor: '#1a2d5a',
  },
  bibleModalOptionText: {
    fontSize: 14,
    color: '#334155',
    fontWeight: '500',
  },

  // ── Color & Theme Picker Styles ──
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
  colorPickerTitleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginRight: 6,
  },
  colorPickerTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: '#1a2d5a',
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

  // ─── Scripture Typography & Telugu Fonts ─────────────────────────────────
  typographySection: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    marginTop: 14,
  },
  typographyHeaderTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  typographyTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    flexShrink: 1,
    marginRight: 8,
  },
  typographyHeaderTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1a2d5a',
    letterSpacing: 0.2,
  },
  typographyHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  typographyActivePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  typographyActivePillTxt: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1a2d5a',
  },
  typographyExpandedContent: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 12,
  },
  typoSubHeading: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1a2d5a',
    marginBottom: 6,
  },
  teluguFontGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 8,
  },
  teluguFontCard: {
    width: '48.5%',
    minHeight: 56,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingVertical: 7,
    paddingHorizontal: 10,
    justifyContent: 'center',
  },
  teluguFontCardSelected: {
    borderColor: '#5B3FA6',
    backgroundColor: '#F3EEFF',
  },
  teluguFontCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  teluguFontSample: {
    fontSize: 16,
    color: '#1E293B',
    flex: 1,
  },
  teluguFontSampleSelected: {
    color: '#5B3FA6',
  },
  fontRadioCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.2,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  fontRadioCircleSelected: {
    borderColor: '#5B3FA6',
    backgroundColor: '#5B3FA6',
  },
  teluguFontSub: {
    fontSize: 9.5,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '600',
  },
  teluguFontSubSelected: {
    color: '#5B3FA6',
    fontWeight: '700',
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 3,
    height: 30,
    gap: 4,
  },
  stepperBtn: {
    width: 24,
    height: 24,
    borderRadius: 5,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValueTxt: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#1a2d5a',
    minWidth: 46,
    textAlign: 'center',
  },
  presetRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
  },
  presetChip: {
    flex: 1,
    height: 42,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  presetChipActive: {
    backgroundColor: '#5B3FA6',
    borderColor: '#5B3FA6',
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  presetChipTxt: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
  },
  presetChipTxtActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  presetChipSubTxt: {
    fontSize: 8.5,
    fontWeight: '600',
    color: '#94A3B8',
    marginTop: 1,
  },
  presetChipSubTxtActive: {
    color: '#DDD6FE',
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#EEF2F6',
    borderRadius: 8,
    padding: 3,
    height: 36,
    gap: 3,
  },
  segmentBtn: {
    flex: 1,
    height: '100%',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentBtnActive: {
    backgroundColor: '#5B3FA6',
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 1.5,
  },
  segmentBtnTxt: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#64748B',
  },
  segmentBtnTxtActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  selectedColorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  selectedColorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  selectedColorBadgeTxt: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1a2d5a',
  },
  colorCategoryScroll: {
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 6,
  },
  colorCategoryChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  colorCategoryChipActive: {
    backgroundColor: '#5B3FA6',
    borderColor: '#5B3FA6',
  },
  colorCategoryChipTxt: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#64748B',
  },
  colorCategoryChipTxtActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  colorSwatchWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
    paddingVertical: 8,
  },
  textSwatchCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
  },
  textSwatchCircleActive: {
    borderColor: '#5B3FA6',
    borderWidth: 2.5,
    transform: [{ scale: 1.14 }],
    elevation: 4,
  },
  customColorInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 10,
    height: 38,
    marginTop: 8,
    gap: 8,
  },
  customColorInputLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  customColorTextInput: {
    flex: 1,
    fontSize: 12,
    color: '#1a2d5a',
    fontWeight: '700',
    paddingVertical: 0,
  },
  customColorSample: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
  },
  styleAndWeightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  weightSegmentedControl: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#EEF2F6',
    borderRadius: 8,
    padding: 3,
    height: 38,
    gap: 2,
  },
  italicToggleBtn: {
    height: 38,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  italicToggleBtnActive: {
    backgroundColor: '#F3EEFF',
    borderColor: '#5B3FA6',
    borderWidth: 1.5,
  },
  italicToggleTxt: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#64748B',
    fontStyle: 'italic',
  },
  italicToggleTxtActive: {
    color: '#5B3FA6',
    fontWeight: '700',
  },

  // ─── Bible Selection Styles ──────────────────────────────────────────────
  bibleVersionContainer: {
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  bibleVersionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  bibleVersionHeaderTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#5B3FA6',
  },
  bibleVersionSub: {
    fontSize: 10.5,
    color: '#6B7280',
    marginBottom: 8,
    lineHeight: 14,
  },
  bibleVersionScroll: {
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 2,
  },
  bibleVersionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  bibleVersionChipActive: {
    backgroundColor: '#5B3FA6',
    borderColor: '#5B3FA6',
    elevation: 1,
  },
  bibleVersionTag: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
    marginRight: 6,
  },
  bibleVersionTagActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  bibleVersionTagTxt: {
    fontSize: 9,
    fontWeight: '800',
    color: '#5B3FA6',
  },
  bibleVersionTagTxtActive: {
    color: '#FFFFFF',
  },
  bibleVersionChipTxt: {
    fontSize: 11,
    fontWeight: '600',
    color: '#374151',
  },
  bibleVersionChipTxtActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  fetchScriptureBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    backgroundColor: '#F3EEFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#DDD6FE',
    marginTop: 6,
    marginBottom: 10,
  },
  fetchScriptureBtnTxt: {
    fontSize: 11,
    fontWeight: '700',
    color: '#5B3FA6',
  },
  downloadModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.78)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 22,
  },
  downloadModalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 28,
    paddingBottom: 22,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.28,
    shadowRadius: 24,
    elevation: 16,
    position: 'relative',
  },
  downloadModalCloseBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  downloadModalIconGlow: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  downloadModalIconBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  downloadModalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  downloadModalSub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 19,
    paddingHorizontal: 10,
    marginBottom: 18,
  },
  downloadPreviewFrame: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#0F172A',
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  downloadPreviewImage: {
    width: '100%',
    height: '100%',
  },
  downloadPillBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(16, 185, 129, 0.92)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  downloadPillText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  downloadModalBtnRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  downloadShareBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: '#F3EEFF',
    borderWidth: 1.5,
    borderColor: '#DDD6FE',
  },
  downloadShareBtnTxt: {
    fontSize: 14,
    fontWeight: '700',
    color: '#5B3FA6',
  },
  downloadDoneBtn: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  downloadDoneBtnGrad: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  downloadDoneBtnTxt: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
});

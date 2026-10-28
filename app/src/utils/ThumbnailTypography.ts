import * as Font from 'expo-font';
import { Platform } from 'react-native';

export interface TeluguFontOption {
  id: string;
  name: string;
  teluguName: string;
  styleTag: string;
  fontFamily: string;
}

let fontsLoadedPromise: Promise<boolean> | null = null;
let isFontsLoaded = false;

export const loadTeluguFonts = async (): Promise<boolean> => {
  if (isFontsLoaded) return true;
  if (!fontsLoadedPromise) {
    fontsLoadedPromise = (async () => {
      try {
        await Font.loadAsync({
          // Suranna
          Suranna: require('../../assets/fonts/Suranna-Regular.ttf'),
          'Suranna-Regular': require('../../assets/fonts/Suranna-Regular.ttf'),
          // Suguna
          Suguna: require('../../assets/fonts/Suguna-Regular.ttf'),
          'Suguna-Regular': require('../../assets/fonts/Suguna-Regular.ttf'),
          // Anek
          Anek: require('../../assets/fonts/AnekTelugu-Regular.ttf'),
          AnekTelugu: require('../../assets/fonts/AnekTelugu-Regular.ttf'),
          'Anek Telugu': require('../../assets/fonts/AnekTelugu-Regular.ttf'),
          'AnekTelugu-Regular': require('../../assets/fonts/AnekTelugu-Regular.ttf'),
          // Chatura
          Chatura: require('../../assets/fonts/Chathura-Regular.ttf'),
          Chathura: require('../../assets/fonts/Chathura-Regular.ttf'),
          'Chathura-Regular': require('../../assets/fonts/Chathura-Regular.ttf'),
          'Chatura-Regular': require('../../assets/fonts/Chathura-Regular.ttf'),
          // Ramaraja
          Ramaraja: require('../../assets/fonts/Ramaraja-Regular.ttf'),
          'Ramaraja-Regular': require('../../assets/fonts/Ramaraja-Regular.ttf'),
          'Ramaraja Regular': require('../../assets/fonts/Ramaraja-Regular.ttf'),
          // Seela Veeraju
          SeelaVeeraju: require('../../assets/fonts/SeelaVeeraju-Regular.ttf'),
          'Seela Veeraju': require('../../assets/fonts/SeelaVeeraju-Regular.ttf'),
          SeelaVeerraju: require('../../assets/fonts/SeelaVeeraju-Regular.ttf'),
          'Seela Veerraju': require('../../assets/fonts/SeelaVeeraju-Regular.ttf'),
          'SeelaVeeraju-Regular': require('../../assets/fonts/SeelaVeeraju-Regular.ttf'),
          // Tenali Ramakrishna
          TenaliRamakrishna: require('../../assets/fonts/TenaliRamakrishna-Regular.ttf'),
          'Tenali Ramakrishna': require('../../assets/fonts/TenaliRamakrishna-Regular.ttf'),
          'TenaliRamakrishna-Regular': require('../../assets/fonts/TenaliRamakrishna-Regular.ttf'),
          // Peddana
          Peddana: require('../../assets/fonts/Peddana-Regular.ttf'),
          'Peddana-Regular': require('../../assets/fonts/Peddana-Regular.ttf'),
          'Peddana Regular': require('../../assets/fonts/Peddana-Regular.ttf'),
          // Mandali
          Mandali: require('../../assets/fonts/Mandali-Regular.ttf'),
          'Mandali-Regular': require('../../assets/fonts/Mandali-Regular.ttf'),
          // Ramabhadra
          Ramabhadra: require('../../assets/fonts/Ramabhadra-Regular.ttf'),
          'Ramabhadra-Regular': require('../../assets/fonts/Ramabhadra-Regular.ttf'),
          // Gidugu
          Gidugu: require('../../assets/fonts/Gidugu-Regular.ttf'),
          'Gidugu-Regular': require('../../assets/fonts/Gidugu-Regular.ttf'),
          'Gidugu Regular': require('../../assets/fonts/Gidugu-Regular.ttf'),
          // NTR
          NTR: require('../../assets/fonts/NTR-Regular.ttf'),
          'NTR-Regular': require('../../assets/fonts/NTR-Regular.ttf'),
        });
        isFontsLoaded = true;
        return true;
      } catch (err) {
        console.warn('⚠️ Error loading custom Telugu fonts, falling back to system:', err);
        return false;
      }
    })();
  }
  return fontsLoadedPromise;
};

export const getActiveFontFamily = (fontId: string): string => {
  if (fontId === 'System') {
    return Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }) as string;
  }
  const opt = TELUGU_FONT_OPTIONS.find(f => f.id === fontId || f.name === fontId || f.fontFamily === fontId);
  return opt ? opt.fontFamily : (fontId || 'Suranna');
};

export const isCustomTeluguFont = (fontId: string): boolean => {
  return fontId !== 'System';
};

export const TELUGU_FONT_OPTIONS: TeluguFontOption[] = [
  {
    id: 'Suranna',
    name: 'Suranna',
    teluguName: 'సురన్న',
    styleTag: 'భక్తి శైలి / Devotional',
    fontFamily: 'Suranna',
  },
  {
    id: 'Suguna',
    name: 'Suguna',
    teluguName: 'సుగుణ',
    styleTag: 'హస్తలిపి / Handwriting',
    fontFamily: 'Suguna',
  },
  {
    id: 'Anek',
    name: 'Anek',
    teluguName: 'అనేక్',
    styleTag: 'ఆధునిక / Modern Sans',
    fontFamily: 'AnekTelugu',
  },
  {
    id: 'Chatura',
    name: 'Chatura',
    teluguName: 'చతుర',
    styleTag: 'సరళమైన / Condensed',
    fontFamily: 'Chathura',
  },
  {
    id: 'Ramaraja',
    name: 'Ramaraja',
    teluguName: 'రామరాజ',
    styleTag: 'గంభీరమైన / Headline Serif',
    fontFamily: 'Ramaraja',
  },
  {
    id: 'SeelaVeeraju',
    name: 'Seela Veeraju',
    teluguName: 'శీలా వీర్రాజు',
    styleTag: 'కళాత్మక / Artistic',
    fontFamily: 'SeelaVeeraju',
  },
  {
    id: 'TenaliRamakrishna',
    name: 'Tenali Ramakrishna',
    teluguName: 'తెనాలి రామకృష్ణ',
    styleTag: 'సాహిత్య / Literary',
    fontFamily: 'TenaliRamakrishna',
  },
  {
    id: 'Peddana',
    name: 'Peddana',
    teluguName: 'పెద్దన',
    styleTag: 'గాఢమైన / Bold Headline',
    fontFamily: 'Peddana',
  },
  {
    id: 'Mandali',
    name: 'Mandali',
    teluguName: 'మండలి',
    styleTag: 'స్పష్టమైన / Clean Modern',
    fontFamily: 'Mandali',
  },
  {
    id: 'Ramabhadra',
    name: 'Ramabhadra',
    teluguName: 'రామభద్ర',
    styleTag: 'శక్తివంతమైన / Display',
    fontFamily: 'Ramabhadra',
  },
  {
    id: 'Gidugu',
    name: 'Gidugu',
    teluguName: 'గిడుగు',
    styleTag: 'సుందర / Script',
    fontFamily: 'Gidugu',
  },
  {
    id: 'NTR',
    name: 'NTR',
    teluguName: 'ఎన్టీఆర్',
    styleTag: 'పోస్టర్ / Headline',
    fontFamily: 'NTR',
  },
  {
    id: 'System',
    name: 'System Serif',
    teluguName: 'సిస్టమ్ డిఫాల్ట్',
    styleTag: 'సాధారణ / Native',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }) as string,
  },
];

export const FONT_SIZE_PRESETS = [
  { label: 'Compact', size: 9.0 },
  { label: 'Regular', size: 10.5 },
  { label: 'Large', size: 12.5 },
  { label: 'Hero', size: 14.5 },
];

export interface TextColorOption {
  label: string;
  hex: string;
  category: 'Gold/Yellow' | 'White/Ivory' | 'Orange/Red' | 'Sky/Blue' | 'Mint/Green' | 'Purple/Dark';
}

export const TEXT_COLOR_CATEGORIES = [
  'All',
  'Gold/Yellow',
  'White/Ivory',
  'Orange/Red',
  'Sky/Blue',
  'Mint/Green',
  'Purple/Dark',
] as const;

export const TEXT_COLOR_PALETTE: TextColorOption[] = [
  // ─── Golds & Yellows ───
  { label: 'Divine Gold', hex: '#FCD34D', category: 'Gold/Yellow' },
  { label: 'Sun Gold', hex: '#FDE047', category: 'Gold/Yellow' },
  { label: 'Bright Gold', hex: '#EAB308', category: 'Gold/Yellow' },
  { label: 'Rich Amber', hex: '#F59E0B', category: 'Gold/Yellow' },
  { label: 'Warm Honey', hex: '#D97706', category: 'Gold/Yellow' },

  // ─── Whites & Ivories ───
  { label: 'Pure White', hex: '#FFFFFF', category: 'White/Ivory' },
  { label: 'Warm Cream', hex: '#FEF9C3', category: 'White/Ivory' },
  { label: 'Soft Ivory', hex: '#FEF3C7', category: 'White/Ivory' },
  { label: 'Pearl Glow', hex: '#F8FAFC', category: 'White/Ivory' },

  // ─── Oranges, Corals & Reds ───
  { label: 'Sunset Orange', hex: '#FB923C', category: 'Orange/Red' },
  { label: 'Vibrant Orange', hex: '#F97316', category: 'Orange/Red' },
  { label: 'Rose Petal', hex: '#FDA4AF', category: 'Orange/Red' },
  { label: 'Blush Pink', hex: '#F472B6', category: 'Orange/Red' },
  { label: 'Ruby Red', hex: '#F43F5E', category: 'Orange/Red' },
  { label: 'Crimson Red', hex: '#EF4444', category: 'Orange/Red' },

  // ─── Sky, Blues & Cyans ───
  { label: 'Heavenly Sky', hex: '#BAE6FD', category: 'Sky/Blue' },
  { label: 'Ice Blue', hex: '#7DD3FC', category: 'Sky/Blue' },
  { label: 'Electric Azure', hex: '#38BDF8', category: 'Sky/Blue' },
  { label: 'Cerulean', hex: '#0EA5E9', category: 'Sky/Blue' },
  { label: 'Royal Blue', hex: '#60A5FA', category: 'Sky/Blue' },

  // ─── Mint, Emeralds & Teals ───
  { label: 'Fresh Mint', hex: '#6EE7B7', category: 'Mint/Green' },
  { label: 'Radiant Emerald', hex: '#34D399', category: 'Mint/Green' },
  { label: 'Spring Green', hex: '#4ADE80', category: 'Mint/Green' },
  { label: 'Ocean Teal', hex: '#2DD4BF', category: 'Mint/Green' },
  { label: 'Soft Lime', hex: '#A3E635', category: 'Mint/Green' },

  // ─── Purples & Contrast Darks ───
  { label: 'Soft Lavender', hex: '#DDD6FE', category: 'Purple/Dark' },
  { label: 'Mystic Violet', hex: '#C084FC', category: 'Purple/Dark' },
  { label: 'Royal Purple', hex: '#A855F7', category: 'Purple/Dark' },
  { label: 'Silver Gray', hex: '#CBD5E1', category: 'Purple/Dark' },
  { label: 'Deep Charcoal', hex: '#334155', category: 'Purple/Dark' },
  { label: 'Midnight Onyx', hex: '#0F172A', category: 'Purple/Dark' },
];

export function isDarkColor(hex: string): boolean {
  if (!hex || typeof hex !== 'string') return false;
  let cleanHex = hex.replace('#', '').trim();
  if (cleanHex.length === 3) cleanHex = cleanHex.split('').map(c => c + c).join('');
  if (cleanHex.length !== 6) return false;
  const r = parseInt(cleanHex.substring(0, 2), 16) || 0;
  const g = parseInt(cleanHex.substring(2, 4), 16) || 0;
  const b = parseInt(cleanHex.substring(4, 6), 16) || 0;
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance < 0.4;
}

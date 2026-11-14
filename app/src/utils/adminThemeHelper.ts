import { useMemo } from 'react';
import { Platform, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export const FONT_STYLE_OPTIONS = [
  { id: 'modern', family: Platform.OS === 'ios' ? 'System' : 'sans-serif' },
];

const PRESERVED_DECORATIVE_FONTS = /pacifico|snell|alexbrush|borel|caveat|damion|satisfy|yellowtail|applehello|dancingscript|mrdafoe/i;

const PAGE_BG_KEYS = /^(container|safeArea|mainContainer|screen|page|pageContainer|root|wrapper|scroll|scrollContainer|header|topBar|headerContainer|stickyHeader|main|body|content|contentContainer|listContainer)$/i;

const PRESERVED_WHITE_KEYS = /gradJoinBtn|playBtn|logoCircle|drawerAvatar|activeCircle|btnSaveDark|cadence/i;

const SECONDARY_SURFACE_KEYS = /input|search|filter|chip|pill|tab|segment|badge|tag|box|well|empty|placeholder|footer|toolbar|bar|row|cell|thead|tableHeader|sectionHeader|subHeader/i;

const LIGHT_PAGE_BGS = new Set([
  '#faf8f0', '#faf7f2', '#fafdf9', '#f9f6f0', '#f8f7f4', '#faf8f2',
  '#ebe7df', '#e5ddd5', '#ede8dc', '#f0ebe0', '#f4f0ea', '#fafaf9',
  '#fffdf5', '#f5f0e8', '#faf7f1', '#f3ead9', '#fdfbf7', '#f0f2f7',
  '#eef2f6', '#f8f9fa', '#faf8f5', '#f5f2eb',
]);

const LIGHT_SECONDARY_BGS = new Set([
  '#f1f5f9', '#f8fafc', '#f3f4f6', '#e2e8f0', '#e5e7eb', '#f4efe6',
  '#faf3e3', '#f4f6f8', '#f9fafb', '#e7ebf3', '#eef2ff', '#f0f9ff',
  '#f0f7ff', '#f0f4ff',
]);

const WHITE_SURFACE_BGS = new Set([
  '#ffffff', '#fff', 'white', 'rgba(255,255,255,0.7)', 'rgba(255,255,255,0.8)',
  'rgba(255,255,255,0.85)', 'rgba(255,255,255,0.9)', 'rgba(255,255,255,0.95)',
]);

const BRIGHT_BADGE_BGS = new Set([
  '#fcd34d', '#fde68a', '#fef3c7', '#fffbeb', '#dcfce7', '#d1fae5',
  '#ecfdf5', '#f0fdf4', '#dbeafe', '#eff6ff', '#e0f2fe', '#fee2e2',
  '#fef2f2', '#ede9fe', '#f5f3ff', '#faf5ff', '#f3e8ff', '#ccfbf1',
  '#f0fdfa', '#ffedd5', '#fff7ed', '#fce7f3', '#fdf2f8', '#e6c079',
  '#c9973f', '#eac259', '#f3e4b6', '#be9a3a',
]);

const PRIMARY_DARK_TEXTS = new Set([
  '#0f172a', '#1e293b', '#111827', '#1f2937', '#000000', '#000',
  '#111111', '#111', '#18181b', '#27272a', '#334155', '#374151',
  '#333333', '#333', '#222222', '#241f1a', '#141d33', '#1b2a4a',
  '#1a2d5a', '#162057', '#1e3a8a', '#1e2a63', '#0b1120', '#2c1810',
]);

const SECONDARY_TEXTS = new Set([
  '#475569', '#64748b', '#6b7280', '#4b5563', '#71717a', '#52525b',
  '#645d54', '#887d6d', '#8b8b8b', '#848796', '#6b7593', '#94a3b8',
  '#9ca3af', '#a89f92',
]);

const LIGHT_BORDERS = new Set([
  '#e2e8f0', '#f1f5f9', '#e5e7eb', '#d1d5db', '#cbd5e1', '#f3f4f6',
  '#e8e0d5', '#e6dec8', '#ebe7df', '#e5ddd5', '#e7ebf3', '#f0ebe0',
  '#f4efe6', '#e2d9c8', '#d6cfc2', 'rgba(0,0,0,0.04)', 'rgba(0,0,0,0.05)',
  'rgba(0,0,0,0.06)', 'rgba(0,0,0,0.07)', 'rgba(0,0,0,0.08)', 'rgba(0,0,0,0.1)',
]);

export interface GlobalAdminThemeState {
  appearance: string;
  isDark: boolean;
  colors: any;
  fontStyle: string;
}

let globalState: GlobalAdminThemeState = {
  appearance: 'warm_white',
  isDark: false,
  colors: {
    background: '#FAF7F2',
    surface: '#FFFFFF',
    text: '#111827',
    textSecondary: '#64748B',
    border: '#E2E8F0',
    barStyle: 'dark-content',
  },
  fontStyle: 'modern',
};

export function setGlobalAdminThemeState(next: GlobalAdminThemeState) {
  globalState = next;
}

function buildThemedStyleSheet<T extends Record<string, any>>(
  baseStyles: T,
  state: GlobalAdminThemeState
): T {
  const { isDark, colors, fontStyle } = state;
  const appFontFamily = Platform.OS === 'ios' ? 'System' : 'sans-serif';
  const screenBg = isDark ? '#000000' : colors?.background || '#FAF7F2';
  const cardSurface = isDark ? '#18181B' : colors?.surface || '#FFFFFF';
  const secondarySurface = isDark ? '#27272A' : '#F1F5F9';
  const primaryText = isDark ? '#FFFFFF' : colors?.text || '#0F172A';
  const secondaryText = isDark ? '#A1A1AA' : colors?.textSecondary || '#475569';
  const borderColor = isDark ? '#27272A' : colors?.border || '#E2E8F0';

  const result: Record<string, any> = {};

  for (const key of Object.keys(baseStyles)) {
    const rule = baseStyles[key];
    if (!rule || typeof rule !== 'object') {
      result[key] = rule;
      continue;
    }

    const cloned: Record<string, any> = { ...rule };
    const rawBg = typeof cloned.backgroundColor === 'string' ? cloned.backgroundColor.trim().toLowerCase() : '';
    const rawColor = typeof cloned.color === 'string' ? cloned.color.trim().toLowerCase() : '';
    const isPageKey = PAGE_BG_KEYS.test(key);
    const isSecondaryKey = SECONDARY_SURFACE_KEYS.test(key);
    const parentKey = key.replace(/(Txt|Text|Label|Title)$/, '');
    const parentRule = parentKey !== key ? baseStyles[parentKey] : undefined;
    const parentBg =
      parentRule && typeof parentRule === 'object' && typeof parentRule.backgroundColor === 'string'
        ? parentRule.backgroundColor.trim().toLowerCase()
        : '';
    const hasBrightBadgeBg =
      (rawBg !== '' && BRIGHT_BADGE_BGS.has(rawBg)) ||
      (parentBg !== '' && (BRIGHT_BADGE_BGS.has(parentBg) || parentBg === '#e4eeea'));

    // 1. Font family
    if (cloned.fontFamily && typeof cloned.fontFamily === 'string') {
      if (!PRESERVED_DECORATIVE_FONTS.test(cloned.fontFamily)) {
        cloned.fontFamily = appFontFamily;
      }
    }

    // 2. Background color
    if (rawBg) {
      if (LIGHT_PAGE_BGS.has(rawBg)) {
        cloned.backgroundColor = isPageKey ? screenBg : (isSecondaryKey ? secondarySurface : screenBg);
      } else if (LIGHT_SECONDARY_BGS.has(rawBg)) {
        if (isPageKey) {
          cloned.backgroundColor = screenBg;
        } else {
          cloned.backgroundColor = isDark ? '#18181B' : secondarySurface;
        }
      } else if (WHITE_SURFACE_BGS.has(rawBg)) {
        if (isPageKey) {
          cloned.backgroundColor = screenBg;
        } else if (!PRESERVED_WHITE_KEYS.test(key)) {
          cloned.backgroundColor = cardSurface;
        }
      } else if (isDark && BRIGHT_BADGE_BGS.has(rawBg) && isPageKey) {
        cloned.backgroundColor = screenBg;
      }
    }

    // 3. Text color
    if (rawColor && !hasBrightBadgeBg) {
      const finalBgLower = typeof cloned.backgroundColor === 'string' ? cloned.backgroundColor.trim().toLowerCase() : '';
      const bgStayedLight = BRIGHT_BADGE_BGS.has(finalBgLower) || finalBgLower === '#ffffff' || finalBgLower === '#fff';

      if (!bgStayedLight || !isDark) {
        if (PRIMARY_DARK_TEXTS.has(rawColor)) {
          if (isDark) {
            cloned.color = '#FFFFFF';
          } else if (rawColor !== '#1a2d5a' && rawColor !== '#1e3a8a' && rawColor !== '#1b2a4a') {
            cloned.color = primaryText;
          }
        } else if (SECONDARY_TEXTS.has(rawColor)) {
          cloned.color = secondaryText;
        }
      }
    }

    // 4. Borders
    for (const bProp of ['borderColor', 'borderTopColor', 'borderBottomColor', 'borderLeftColor', 'borderRightColor']) {
      if (typeof cloned[bProp] === 'string') {
        const bVal = cloned[bProp].trim().toLowerCase();
        if (LIGHT_BORDERS.has(bVal)) {
          cloned[bProp] = borderColor;
        }
      }
    }

    result[key] = cloned;
  }

  return result as T;
}

export function createAdminThemedStyles<T extends StyleSheet.NamedStyles<T> | StyleSheet.NamedStyles<any>>(
  baseStyles: T & StyleSheet.NamedStyles<any>
): T {
  let cachedKey = '';
  let cachedSheet: T = baseStyles as T;

  const getActiveSheet = (): T => {
    const key = `${globalState.appearance}_${globalState.fontStyle}_${globalState.isDark}`;
    if (key !== cachedKey) {
      cachedKey = key;
      cachedSheet = buildThemedStyleSheet(baseStyles as Record<string, any>, globalState) as T;
    }
    return cachedSheet;
  };

  return new Proxy(baseStyles as T, {
    get(_target, prop: string | symbol) {
      const sheet = getActiveSheet();
      return (sheet as any)[prop];
    },
  });
}

export function useAdminTheme() {
  const themeContext = useTheme();
  const isDark = !!themeContext?.isDark;
  const colors = themeContext?.colors || {};
  const activeAppearance = isDark ? 'dark' : 'warm_white';

  // Ensure module-level state is always synced
  setGlobalAdminThemeState({
    appearance: activeAppearance,
    isDark,
    colors,
    fontStyle: 'modern',
  });

  const appFontFamily = Platform.OS === 'ios' ? 'System' : 'sans-serif';
  const screenBg = isDark ? '#0F172A' : colors.background || '#F0F2F7';
  const cardSurface = isDark ? '#1E293B' : colors.surface || '#FFFFFF';
  const secondarySurface = isDark ? '#334155' : '#F1F5F9';
  const primaryText = isDark ? '#F8FAFC' : colors.text || '#111827';
  const secondaryText = isDark ? '#94A3B8' : colors.textSecondary || '#64748B';
  const borderColor = isDark ? '#334155' : colors.border || '#E2E8F0';
  const barStyle: 'light-content' | 'dark-content' = isDark ? 'light-content' : 'dark-content';

  return {
    theme: activeAppearance,
    appearance: activeAppearance,
    isDark,
    colors,
    fontStyle: 'modern',
    fontSize: 14,
    scaleFont: (s: number) => s,
    appFontFamily,
    screenBg,
    cardSurface,
    secondarySurface,
    primaryText,
    secondaryText,
    borderColor,
    barStyle,
  };
}

export function useAdminThemedStyles<T extends StyleSheet.NamedStyles<T> | StyleSheet.NamedStyles<any>>(
  baseStyles: T & StyleSheet.NamedStyles<any>
): T {
  const state = useAdminTheme();
  return useMemo(
    () =>
      buildThemedStyleSheet(baseStyles as Record<string, any>, {
        appearance: state.appearance,
        isDark: state.isDark,
        colors: state.colors,
        fontStyle: state.fontStyle,
      }) as T,
    [baseStyles, state.appearance, state.isDark, state.colors, state.fontStyle]
  );
}


import { Platform, StyleSheet } from 'react-native';

/**
 * Light Warm-Parchment theme for Care Cells Admin Dashboard views,
 * matching the rest of the Admin Dashboard tabs (#EDE8DC backdrop + #FFFFFF cards).
 */
export function useCareCellAdminTheme() {
  const appFontFamily = Platform.OS === 'ios' ? 'System' : 'sans-serif';
  const screenBg = '#EDE8DC';
  const cardSurface = '#FFFFFF';
  const secondarySurface = '#F1F5F9';
  const primaryText = '#0F172A';
  const secondaryText = '#64748B';
  const borderColor = '#E2E8F0';

  return {
    theme: 'warm_white',
    appearance: 'warm_white',
    isDark: false,
    colors: {
      background: screenBg,
      surface: cardSurface,
      text: primaryText,
      textSecondary: secondaryText,
      border: borderColor,
      barStyle: 'light-content',
    },
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
    barStyle: 'light-content' as const,
  };
}

export function createCareCellAdminStyles<
  T extends StyleSheet.NamedStyles<T> | StyleSheet.NamedStyles<any>
>(baseStyles: T & StyleSheet.NamedStyles<any>): T {
  const normalized: Record<string, any> = {};
  for (const key of Object.keys(baseStyles)) {
    const rule = baseStyles[key];
    if (
      rule &&
      typeof rule === 'object' &&
      typeof (rule as any).backgroundColor === 'string' &&
      (rule as any).backgroundColor.trim().toLowerCase() === '#faf7f2'
    ) {
      normalized[key] = { ...rule, backgroundColor: '#EDE8DC' };
    } else {
      normalized[key] = rule;
    }
  }
  return StyleSheet.create(normalized) as T;
}

export const useAdminTheme = useCareCellAdminTheme;
export const createAdminThemedStyles = createCareCellAdminStyles;

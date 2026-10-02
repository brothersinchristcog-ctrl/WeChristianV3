export function hexToRgba(hex: string, alpha: number): string {
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

export function darkenHex(hex: string, factor: number): string {
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

export function getLuminance(hex: string): number {
  if (!hex || typeof hex !== 'string') return 0.2;
  let cleanHex = hex.replace('#', '').trim();
  if (cleanHex.length === 3) cleanHex = cleanHex.split('').map(c => c + c).join('');
  if (cleanHex.length !== 6) return 0.2;
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255;
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

export interface ColorFamily {
  name: string;
  shades: {
    label: string;
    hex: string;
  }[];
}

export const COLOR_FAMILIES: ColorFamily[] = [
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

export interface GradientPreset {
  name: string;
  colors: [string, string];
}

export const GRADIENT_PRESETS: GradientPreset[] = [
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

export const SPECTRUM_SWATCHES = [
  '#EF4444', '#F97316', '#F59E0B', '#EAB308', '#84CC16', '#10B981',
  '#14B8A6', '#06B6D4', '#0EA5E9', '#3B82F6', '#6366F1', '#8B5CF6',
  '#A855F7', '#D946EF', '#EC4899', '#F43F5E', '#78716C', '#0F172A'
];

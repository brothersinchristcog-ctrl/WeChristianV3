import { en, TranslationSchema } from './en';
import { te } from './te';
import { hi } from './hi';
import { ta } from './ta';
import { mr } from './mr';
import { ml } from './ml';
import { kn } from './kn';

export type SupportedLanguage = 'en' | 'te' | 'hi' | 'ta' | 'mr' | 'ml' | 'kn';

export interface LanguageOption {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  sub: string;
}

export const LANGUAGES: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English', sub: 'English' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', sub: 'Telugu' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', sub: 'Hindi' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', sub: 'Tamil' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', sub: 'Marathi' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', sub: 'Malayalam' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', sub: 'Kannada' },
];

export const translations: Record<SupportedLanguage, TranslationSchema> = {
  en,
  te,
  hi,
  ta,
  mr,
  ml,
  kn,
};

export { en, te, hi, ta, mr, ml, kn, TranslationSchema };

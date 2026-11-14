import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { SupportedLanguage, LanguageOption, LANGUAGES, translations } from '../locales';

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => Promise<void>;
  t: (keyPath: string, params?: Record<string, string | number>) => string;
  languages: LanguageOption[];
  currentLanguageOption: LanguageOption;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = '@user_language';

function getNestedValue(obj: any, path: string): string | undefined {
  if (!obj) return undefined;
  const parts = path.split('.');
  let current = obj;
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      return undefined;
    }
  }
  return typeof current === 'string' ? current : undefined;
}

function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  return Object.entries(params).reduce((str, [key, val]) => {
    return str.replace(new RegExp(`\\{${key}\\}`, 'g'), String(val));
  }, template);
}

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<SupportedLanguage>('en');

  useEffect(() => {
    loadSavedLanguage();
  }, []);

  const loadSavedLanguage = async () => {
    try {
      const savedLang = await AsyncStorage.getItem(STORAGE_KEY);
      if (savedLang && (savedLang in translations)) {
        setLanguageState(savedLang as SupportedLanguage);
      }
    } catch (e) {
      console.warn('[LanguageContext] Failed to load saved language:', e);
    }
  };

  const setLanguage = async (newLang: SupportedLanguage) => {
    try {
      setLanguageState(newLang);
      await AsyncStorage.setItem(STORAGE_KEY, newLang);

      // Best effort sync to Firestore if user is authenticated
      const currentUser = auth().currentUser;
      if (currentUser && !currentUser.isAnonymous) {
        firestore()
          .collection('users')
          .doc(currentUser.uid)
          .set({ language: newLang }, { merge: true })
          .catch(() => {});
      }
    } catch (e) {
      console.warn('[LanguageContext] Failed to persist language:', e);
    }
  };

  const t = useCallback(
    (keyPath: string, params?: Record<string, string | number>): string => {
      const currentDict = translations[language] || translations.en;
      let text = getNestedValue(currentDict, keyPath);
      
      // Fallback to English if missing in selected language
      if (!text && language !== 'en') {
        text = getNestedValue(translations.en, keyPath);
      }

      // If still not found, return keyPath
      if (!text) {
        return keyPath;
      }

      return interpolate(text, params);
    },
    [language]
  );

  const currentLanguageOption =
    LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        languages: LANGUAGES,
        currentLanguageOption,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

// Convenience alias commonly used in i18n
export const useTranslation = () => {
  return useLanguage();
};

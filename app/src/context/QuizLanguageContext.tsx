import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SupportedLanguage, LanguageOption, LANGUAGES } from '../locales';
import { useLanguage } from './LanguageContext';

interface QuizLanguageContextType {
  quizLanguage: SupportedLanguage;
  setQuizLanguage: (lang: SupportedLanguage) => Promise<void>;
  quizLanguageOption: LanguageOption;
  languages: LanguageOption[];
}

const QuizLanguageContext = createContext<QuizLanguageContextType | undefined>(undefined);

const QUIZ_LANG_STORAGE_KEY = '@bible_quiz_local_language';

export const QuizLanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { language: memberViewLanguage } = useLanguage();
  const [quizLanguage, setQuizLanguageState] = useState<SupportedLanguage>(memberViewLanguage || 'en');
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  useEffect(() => {
    loadSavedQuizLanguage();
  }, []);

  const loadSavedQuizLanguage = async () => {
    try {
      const saved = await AsyncStorage.getItem(QUIZ_LANG_STORAGE_KEY);
      if (saved && LANGUAGES.some((l) => l.code === saved)) {
        setQuizLanguageState(saved as SupportedLanguage);
      } else {
        // Default to current member view language initially
        setQuizLanguageState(memberViewLanguage || 'en');
      }
    } catch {
      setQuizLanguageState(memberViewLanguage || 'en');
    } finally {
      setIsLoaded(true);
    }
  };

  const setQuizLanguage = async (newLang: SupportedLanguage) => {
    try {
      // Local to Bible Quiz ONLY - Does NOT modify global Member View language
      setQuizLanguageState(newLang);
      await AsyncStorage.setItem(QUIZ_LANG_STORAGE_KEY, newLang);
    } catch (e) {
      console.warn('[QuizLanguageContext] Failed to persist quiz language:', e);
    }
  };

  const quizLanguageOption =
    LANGUAGES.find((l) => l.code === quizLanguage) || LANGUAGES[0];

  return (
    <QuizLanguageContext.Provider
      value={{
        quizLanguage,
        setQuizLanguage,
        quizLanguageOption,
        languages: LANGUAGES,
      }}
    >
      {children}
    </QuizLanguageContext.Provider>
  );
};

export const useQuizLanguage = () => {
  const context = useContext(QuizLanguageContext);
  if (!context) {
    // Graceful fallback if rendered outside provider
    const { language, languages } = useLanguage();
    const opt = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];
    return {
      quizLanguage: language,
      setQuizLanguage: async () => {},
      quizLanguageOption: opt,
      languages,
    };
  }
  return context;
};

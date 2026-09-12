import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { LanguageCode, LanguageInfo, TranslationDictionary } from './types';
import { en } from './translations/en';
import { hi } from './translations/hi';
import { gu } from './translations/gu';
import { mr } from './translations/mr';
import { bn } from './translations/bn';
import { pa } from './translations/pa';

export const AVAILABLE_LANGUAGES: LanguageInfo[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', flag: '🇮🇳' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', flag: '🇮🇳' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', flag: '🇮🇳' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', flag: '🇮🇳' },
];

const TRANSLATIONS: Record<LanguageCode, TranslationDictionary> = {
  en,
  hi,
  gu,
  mr,
  bn,
  pa,
};

const STORAGE_KEY = 'vigilai_language';

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  currentLanguageInfo: LanguageInfo;
  languages: LanguageInfo[];
  t: (keyPath: string, fallbackText?: string) => string;
  dict: TranslationDictionary;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<LanguageCode>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as LanguageCode | null;
      if (saved && TRANSLATIONS[saved]) {
        return saved;
      }
    } catch (e) {
      console.warn('Failed to load language preference:', e);
    }
    return 'en';
  });

  const setLanguage = useCallback((newLang: LanguageCode) => {
    if (TRANSLATIONS[newLang]) {
      setLanguageState(newLang);
      try {
        localStorage.setItem(STORAGE_KEY, newLang);
        document.documentElement.lang = newLang;
      } catch (e) {
        console.warn('Failed to persist language preference:', e);
      }
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const currentLanguageInfo = useMemo(() => {
    return AVAILABLE_LANGUAGES.find((l) => l.code === language) || AVAILABLE_LANGUAGES[0];
  }, [language]);

  const dict = useMemo(() => {
    return TRANSLATIONS[language] || en;
  }, [language]);

  // Nested translation helper: t('nav.commandCenter')
  const t = useCallback(
    (keyPath: string, fallbackText?: string): string => {
      const parts = keyPath.split('.');
      let current: any = dict;
      for (const part of parts) {
        if (current && typeof current === 'object' && part in current) {
          current = current[part];
        } else {
          current = undefined;
          break;
        }
      }

      if (typeof current === 'string') {
        return current;
      }

      // Fallback to English dictionary
      let fallbackCurrent: any = en;
      for (const part of parts) {
        if (fallbackCurrent && typeof fallbackCurrent === 'object' && part in fallbackCurrent) {
          fallbackCurrent = fallbackCurrent[part];
        } else {
          fallbackCurrent = undefined;
          break;
        }
      }

      if (typeof fallbackCurrent === 'string') {
        return fallbackCurrent;
      }

      return fallbackText || keyPath;
    },
    [dict]
  );

  const contextValue = useMemo<LanguageContextType>(
    () => ({
      language,
      setLanguage,
      currentLanguageInfo,
      languages: AVAILABLE_LANGUAGES,
      t,
      dict,
    }),
    [language, setLanguage, currentLanguageInfo, t, dict]
  );

  return <LanguageContext.Provider value={contextValue}>{children}</LanguageContext.Provider>;
};

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

export function useTranslation() {
  const { t, language, dict } = useLanguage();
  return { t, language, dict };
}


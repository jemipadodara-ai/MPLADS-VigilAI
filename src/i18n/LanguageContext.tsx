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

  // Dynamic DOM text translator for universal coverage across all views and components
  useEffect(() => {
    if (typeof document === 'undefined') return;

    document.documentElement.lang = language;

    if (language === 'en') {
      // Revert any translated nodes
      document.querySelectorAll('[data-vigilai-orig]').forEach((el) => {
        const orig = el.getAttribute('data-vigilai-orig');
        if (orig) {
          el.textContent = orig;
          el.removeAttribute('data-vigilai-orig');
        }
      });
      return;
    }

    const currentDict = TRANSLATIONS[language] || en;
    const phraseMap = currentDict.phrases || {};
    const textMap = new Map<string, string>();
    for (const [k, v] of Object.entries(phraseMap)) {
      if (k && v && typeof v === 'string') {
        textMap.set(k.trim(), v.trim());
      }
    }

    const translateNode = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.nodeValue || '';
        const trimmed = text.trim();
        if (!trimmed || trimmed.length < 2) return;

        if (textMap.has(trimmed)) {
          const parent = node.parentElement;
          if (parent) {
            const tag = parent.tagName.toLowerCase();
            if (['script', 'style', 'input', 'textarea', 'code', 'pre'].includes(tag)) return;
            if (parent.isContentEditable) return;
            if (!parent.hasAttribute('data-vigilai-orig')) {
              parent.setAttribute('data-vigilai-orig', trimmed);
            }
          }
          const translated = textMap.get(trimmed)!;
          const leading = text.match(/^\s*/)?.[0] || '';
          const trailing = text.match(/\s*$/)?.[0] || '';
          node.nodeValue = leading + translated + trailing;
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;
        const tag = el.tagName.toLowerCase();
        if (['script', 'style', 'input', 'textarea', 'code', 'pre'].includes(tag)) return;
        if (el.isContentEditable) return;
        for (let i = 0; i < el.childNodes.length; i++) {
          translateNode(el.childNodes[i]);
        }
      }
    };

    // Initial pass
    translateNode(document.body);

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((n) => translateNode(n));
        } else if (mutation.type === 'characterData') {
          const text = mutation.target.nodeValue?.trim() || '';
          if (textMap.has(text) && textMap.get(text) !== text) {
            translateNode(mutation.target);
          }
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => {
      observer.disconnect();
    };
  }, [language]);

  const currentLanguageInfo = useMemo(() => {
    return AVAILABLE_LANGUAGES.find((l) => l.code === language) || AVAILABLE_LANGUAGES[0];
  }, [language]);

  const dict = useMemo(() => {
    return TRANSLATIONS[language] || en;
  }, [language]);

  // Nested translation & direct phrase helper: t('nav.commandCenter') or t('Sign In')
  const t = useCallback(
    (keyPath: string, fallbackText?: string): string => {
      // 1. Check direct phrase map in current language
      if (dict.phrases && typeof dict.phrases[keyPath] === 'string') {
        return dict.phrases[keyPath];
      }

      // 2. Nested dot-path in current language dict
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

      // 3. Fallback to English phrase map
      if (en.phrases && typeof en.phrases[keyPath] === 'string') {
        return en.phrases[keyPath];
      }

      // 4. Fallback to English dictionary dot-path
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


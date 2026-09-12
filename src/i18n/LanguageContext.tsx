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
  { code: 'hi', name: 'Hindi', nativeName: 'हिंदी', flag: '🇮🇳' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', flag: '🇮🇳' },
];

const TRANSLATIONS: Record<LanguageCode, TranslationDictionary> = {
  en,
  hi,
  gu,
  mr,
  bn,
  pa,
};

const STORAGE_KEY = 'mplads_language';
const LEGACY_STORAGE_KEY = 'vigilai_language';

function detectBrowserLanguage(): LanguageCode {
  if (typeof window === 'undefined' || !window.navigator) return 'en';
  const browserLang = (navigator.language || (navigator as any).userLanguage || '').toLowerCase();
  if (browserLang.startsWith('hi')) return 'hi';
  if (browserLang.startsWith('gu')) return 'gu';
  return 'en';
}

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  currentLanguageInfo: LanguageInfo;
  languages: LanguageInfo[];
  t: (keyPath: string, fallbackText?: string) => string;
  dict: TranslationDictionary;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Precompute reverse lookup from any language phrase to canonical English key
const reverseToEnglish = new Map<string, string>();
for (const langKey of Object.keys(TRANSLATIONS) as LanguageCode[]) {
  const p = TRANSLATIONS[langKey]?.phrases || {};
  for (const [enKey, transVal] of Object.entries(p)) {
    if (transVal && typeof transVal === 'string') {
      reverseToEnglish.set(transVal.trim().toLowerCase(), enKey.trim());
    }
  }
}

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<LanguageCode>(() => {
    try {
      const saved = (localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY)) as LanguageCode | null;
      if (saved && TRANSLATIONS[saved]) {
        return saved;
      }
    } catch (e) {
      console.warn('Failed to load language preference:', e);
    }
    return detectBrowserLanguage();
  });

  const setLanguage = useCallback((newLang: LanguageCode) => {
    if (TRANSLATIONS[newLang]) {
      setLanguageState(newLang);
      try {
        localStorage.setItem(STORAGE_KEY, newLang);
        localStorage.setItem(LEGACY_STORAGE_KEY, newLang);
        if (typeof document !== 'undefined') {
          document.documentElement.lang = newLang;
        }
      } catch (e) {
        console.warn('Failed to persist language preference:', e);
      }
    }
  }, []);

  // Dynamic DOM text translator for universal coverage across all views and components
  useEffect(() => {
    if (typeof document === 'undefined') return;

    document.documentElement.lang = language;

    // 1. Reset all previously translated nodes and attributes
    document.querySelectorAll('[data-vigilai-orig]').forEach((el) => {
      const orig = el.getAttribute('data-vigilai-orig');
      if (orig) {
        el.textContent = orig;
        el.removeAttribute('data-vigilai-orig');
      }
    });

    document.querySelectorAll('[data-vigilai-orig-ph]').forEach((el) => {
      const orig = el.getAttribute('data-vigilai-orig-ph');
      if (orig) {
        (el as HTMLInputElement).placeholder = orig;
        el.removeAttribute('data-vigilai-orig-ph');
      }
    });

    document.querySelectorAll('[data-vigilai-orig-title]').forEach((el) => {
      const orig = el.getAttribute('data-vigilai-orig-title');
      if (orig) {
        (el as HTMLElement).title = orig;
        el.removeAttribute('data-vigilai-orig-title');
      }
    });

    if (language === 'en') {
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

    // Helper to resolve translation for a string (direct or reverse lookup)
    const getTranslation = (raw: string): string | null => {
      const trimmed = raw.trim();
      if (!trimmed || trimmed.length < 2) return null;

      // Direct match
      if (textMap.has(trimmed)) {
        return textMap.get(trimmed)!;
      }

      // Reverse lookup (in case text was in another language)
      const enKey = reverseToEnglish.get(trimmed.toLowerCase());
      if (enKey && textMap.has(enKey)) {
        return textMap.get(enKey)!;
      }

      // Compound phrase replacements
      // e.g., "12 Entities" -> "12 इकाइयां"
      if (/\b\d+\s+Entities\b/i.test(trimmed) && textMap.has('Entities')) {
        return trimmed.replace(/\bEntities\b/gi, textMap.get('Entities')!);
      }
      if (/\b\d+\s+Vendors\b/i.test(trimmed) && textMap.has('Vendors')) {
        return trimmed.replace(/\bVendors\b/gi, textMap.get('Vendors')!);
      }
      if (/\b\d+\s+(?:works|Works)\b/i.test(trimmed) && (textMap.has('works') || textMap.has('Works Registry'))) {
        const transWorks = textMap.get('works') || textMap.get('Works Registry')!;
        return trimmed.replace(/\b(?:works|Works)\b/gi, transWorks);
      }
      if (/\b\d+d?\s+Overdue\b/i.test(trimmed) && (textMap.has('Overdue') || textMap.has('Days Overdue'))) {
        const trans = textMap.get('Overdue') || textMap.get('Days Overdue')!;
        return trimmed.replace(/\bOverdue\b/gi, trans);
      }
      if (/[+-]?\d+%?\s+Overrun\b/i.test(trimmed) && textMap.has('Overrun')) {
        return trimmed.replace(/\bOverrun\b/gi, textMap.get('Overrun')!);
      }
      if (/\d+%\s+Done\b/i.test(trimmed) && textMap.has('Done')) {
        return trimmed.replace(/\bDone\b/gi, textMap.get('Done')!);
      }
      if (/\d+%\s+disbursed\b/i.test(trimmed) && textMap.has('disbursed')) {
        return trimmed.replace(/\bdisbursed\b/gi, textMap.get('disbursed')!);
      }
      if (/^Score:\s*/i.test(trimmed) && textMap.has('Score:')) {
        return trimmed.replace(/^Score:\s*/i, `${textMap.get('Score:')!} `);
      }

      return null;
    };

    const translateNode = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.nodeValue || '';
        const trimmed = text.trim();
        if (!trimmed || trimmed.length < 2) return;

        const translated = getTranslation(trimmed);
        if (translated) {
          const parent = node.parentElement;
          if (parent) {
            const tag = parent.tagName.toLowerCase();
            if (['script', 'style', 'code', 'pre'].includes(tag)) return;
            if (parent.isContentEditable) return;
            if (!parent.hasAttribute('data-vigilai-orig')) {
              parent.setAttribute('data-vigilai-orig', trimmed);
            }
          }
          const leading = text.match(/^\s*/)?.[0] || '';
          const trailing = text.match(/\s*$/)?.[0] || '';
          node.nodeValue = leading + translated + trailing;
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;
        const tag = el.tagName.toLowerCase();
        if (['script', 'style', 'code', 'pre'].includes(tag)) return;
        if (el.isContentEditable) return;

        // Check placeholder on input/textarea
        if (tag === 'input' || tag === 'textarea') {
          const input = el as HTMLInputElement | HTMLTextAreaElement;
          if (input.placeholder) {
            const transPlaceholder = getTranslation(input.placeholder);
            if (transPlaceholder && transPlaceholder !== input.placeholder) {
              if (!input.hasAttribute('data-vigilai-orig-ph')) {
                input.setAttribute('data-vigilai-orig-ph', input.placeholder);
              }
              input.placeholder = transPlaceholder;
            }
          }
        }

        // Check title attribute (tooltip)
        if (el.title) {
          const transTitle = getTranslation(el.title);
          if (transTitle && transTitle !== el.title) {
            if (!el.hasAttribute('data-vigilai-orig-title')) {
              el.setAttribute('data-vigilai-orig-title', el.title);
            }
            el.title = transTitle;
          }
        }

        for (let i = 0; i < el.childNodes.length; i++) {
          translateNode(el.childNodes[i]);
        }
      }
    };

    // Initial pass over the entire document body
    translateNode(document.body);

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((n) => translateNode(n));
        } else if (mutation.type === 'characterData') {
          const text = mutation.target.nodeValue?.trim() || '';
          const trans = getTranslation(text);
          if (trans && trans !== text) {
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


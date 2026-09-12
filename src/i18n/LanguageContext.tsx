import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { LanguageCode, LanguageInfo, TranslationDictionary } from './types';
import { en } from './translations/en';
import { hi } from './translations/hi';
import { gu } from './translations/gu';
import { mr } from './translations/mr';
import { bn } from './translations/bn';
import { pa } from './translations/pa';
import { VOCABULARY, transliterateEnglish, SupportedLang } from './vocabulary';

export const AVAILABLE_LANGUAGES: LanguageInfo[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिंदी', flag: '🇮🇳' },
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

const STORAGE_KEY = 'mplads_language';
const LEGACY_STORAGE_KEY = 'vigilai_language';

function detectBrowserLanguage(): LanguageCode {
  if (typeof window === 'undefined' || !window.navigator) return 'en';
  const browserLang = (navigator.language || (navigator as any).userLanguage || '').toLowerCase();
  if (browserLang.startsWith('hi')) return 'hi';
  if (browserLang.startsWith('gu')) return 'gu';
  if (browserLang.startsWith('mr')) return 'mr';
  if (browserLang.startsWith('bn')) return 'bn';
  if (browserLang.startsWith('pa')) return 'pa';
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

// Precompute translation maps and multi-word phrase patterns per language
interface LanguageEngine {
  textMap: Map<string, string>;
  textMapLower: Map<string, string>;
  multiWordList: Array<{
    lower: string;
    regex: RegExp;
    translation: string;
  }>;
  translate: (raw: string) => string;
}

const ENGINE_CACHE = new Map<LanguageCode, LanguageEngine>();

function getEngine(lang: LanguageCode): LanguageEngine {
  if (ENGINE_CACHE.has(lang)) {
    return ENGINE_CACHE.get(lang)!;
  }

  const textMap = new Map<string, string>();
  const textMapLower = new Map<string, string>();
  const multiWordList: Array<{ lower: string; regex: RegExp; translation: string }> = [];

  if (lang === 'en') {
    const engine: LanguageEngine = {
      textMap,
      textMapLower,
      multiWordList,
      translate: (s) => s,
    };
    ENGINE_CACHE.set(lang, engine);
    return engine;
  }

  const dict = TRANSLATIONS[lang] || en;
  const mergedPhrases: Record<string, string> = {
    ...(dict.phrases || {}),
    ...((VOCABULARY as any)[lang] || {}),
  };

  const rawMultiList: Array<{ raw: string; lower: string; translation: string; len: number }> = [];

  for (const [k, v] of Object.entries(mergedPhrases)) {
    if (k && v && typeof v === 'string') {
      const kTrim = k.trim();
      const vTrim = v.trim();
      textMap.set(kTrim, vTrim);
      textMapLower.set(kTrim.toLowerCase(), vTrim);

      if (/\s|[-/–—]/.test(kTrim) && kTrim.length >= 2) {
        rawMultiList.push({
          raw: kTrim,
          lower: kTrim.toLowerCase(),
          translation: vTrim,
          len: kTrim.length,
        });
      }
    }
  }

  // Sort multi-word phrases by length descending to match longer phrases first
  rawMultiList.sort((a, b) => b.len - a.len);

  for (const item of rawMultiList) {
    const escaped = item.raw.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    multiWordList.push({
      lower: item.lower,
      regex: new RegExp('\\b' + escaped + '\\b', 'gi'),
      translation: item.translation,
    });
  }

  const translate = (str: string): string => {
    if (!str || typeof str !== 'string') return str;
    const trimmed = str.trim();
    if (!trimmed) return str;

    // 1. Exact match (case preserved or lowercase)
    if (textMap.has(trimmed)) {
      return str.replace(trimmed, textMap.get(trimmed)!);
    }
    const lower = trimmed.toLowerCase();
    if (textMapLower.has(lower)) {
      return str.replace(trimmed, textMapLower.get(lower)!);
    }

    // 2. Multi-word phrase replacements
    let out = str;
    for (const item of multiWordList) {
      if (out.toLowerCase().includes(item.lower)) {
        out = out.replace(item.regex, item.translation);
      }
    }

    // 3. Word token replacement & transliteration fallback
    out = out.replace(/\b[A-Za-z]+(?:'[A-Za-z]+)?\b/g, (token) => {
      const tLower = token.toLowerCase();
      if (textMapLower.has(tLower)) {
        return textMapLower.get(tLower)!;
      }
      return transliterateEnglish(token, lang as SupportedLang);
    });

    return out;
  };

  const engine: LanguageEngine = {
    textMap,
    textMapLower,
    multiWordList,
    translate,
  };

  ENGINE_CACHE.set(lang, engine);
  return engine;
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

  // Universal Non-Destructive DOM Text Translator
  useEffect(() => {
    if (typeof document === 'undefined') return;

    document.documentElement.lang = language;
    const engine = getEngine(language);

    const translateNode = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const textNode = node as Text;
        const parent = textNode.parentElement;
        if (parent) {
          const tag = parent.tagName.toLowerCase();
          if (['script', 'style', 'code', 'pre'].includes(tag)) return;
          if (parent.isContentEditable) return;
        }

        const currentVal = textNode.nodeValue || '';
        if (!currentVal.trim()) return;

        // Save pristine original text on first encounter
        if ((textNode as any).__vigilai_orig === undefined) {
          (textNode as any).__vigilai_orig = currentVal;
        }
        const orig = (textNode as any).__vigilai_orig;

        const targetVal = language === 'en' ? orig : engine.translate(orig);
        if (textNode.nodeValue !== targetVal) {
          (textNode as any).__vigilai_translating = true;
          textNode.nodeValue = targetVal;
          (textNode as any).__vigilai_translating = false;
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;
        const tag = el.tagName.toLowerCase();
        if (['script', 'style', 'code', 'pre'].includes(tag)) return;
        if (el.isContentEditable) return;

        // Input and textarea placeholders
        if (tag === 'input' || tag === 'textarea') {
          const input = el as HTMLInputElement | HTMLTextAreaElement;
          if (input.placeholder) {
            if ((input as any).__vigilai_orig_ph === undefined) {
              (input as any).__vigilai_orig_ph = input.placeholder;
            }
            const origPh = (input as any).__vigilai_orig_ph;
            const targetPh = language === 'en' ? origPh : engine.translate(origPh);
            if (input.placeholder !== targetPh) {
              input.placeholder = targetPh;
            }
          }
        }

        // Element title tooltip
        if (el.title) {
          if ((el as any).__vigilai_orig_title === undefined) {
            (el as any).__vigilai_orig_title = el.title;
          }
          const origTitle = (el as any).__vigilai_orig_title;
          const targetTitle = language === 'en' ? origTitle : engine.translate(origTitle);
          if (el.title !== targetTitle) {
            el.title = targetTitle;
          }
        }

        // Accessibility aria-label
        if (el.hasAttribute('aria-label')) {
          const aria = el.getAttribute('aria-label') || '';
          if (aria) {
            if ((el as any).__vigilai_orig_aria === undefined) {
              (el as any).__vigilai_orig_aria = aria;
            }
            const origAria = (el as any).__vigilai_orig_aria;
            const targetAria = language === 'en' ? origAria : engine.translate(origAria);
            if (el.getAttribute('aria-label') !== targetAria) {
              el.setAttribute('aria-label', targetAria);
            }
          }
        }

        for (let i = 0; i < el.childNodes.length; i++) {
          translateNode(el.childNodes[i]);
        }
      }
    };

    // Full traversal over document.body
    translateNode(document.body);

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((n) => translateNode(n));
        } else if (mutation.type === 'characterData') {
          const target = mutation.target as Text;
          if ((target as any).__vigilai_translating) continue;

          if (language !== 'en') {
            const current = target.nodeValue || '';
            if (/[A-Za-z]/.test(current)) {
              (target as any).__vigilai_orig = current;
              const translated = engine.translate(current);
              if (target.nodeValue !== translated) {
                (target as any).__vigilai_translating = true;
                target.nodeValue = translated;
                (target as any).__vigilai_translating = false;
              }
            }
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

  const engine = useMemo(() => getEngine(language), [language]);

  // Translation helper: t('keyPath') or t('Exact English Phrase')
  const t = useCallback(
    (keyPath: string, fallbackText?: string): string => {
      if (language === 'en') {
        return fallbackText || keyPath;
      }

      // 1. Direct phrase lookup in current dictionary
      if (dict.phrases && typeof dict.phrases[keyPath] === 'string') {
        return dict.phrases[keyPath];
      }

      // 2. Vocabulary lookup
      const vocabLang = (VOCABULARY as any)[language];
      if (vocabLang && typeof vocabLang[keyPath] === 'string') {
        return vocabLang[keyPath];
      }

      // 3. Dot-notation nested lookup
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

      // 4. Translate the fallbackText or keyPath through the engine
      const source = fallbackText || keyPath;
      return engine.translate(source);
    },
    [dict, language, engine]
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

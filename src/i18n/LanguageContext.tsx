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

// ---------------------------------------------------------------------------
// 1. REVERSE INDEX: Maps strings from ANY language back to canonical English
// ---------------------------------------------------------------------------
const toEnglishMap = new Map<string, string>();
const toEnglishMultiList: Array<{
  foreignLower: string;
  regex: RegExp;
  en: string;
  len: number;
}> = [];

function registerReverse(enText: string, foreignText: string) {
  if (!enText || !foreignText || typeof enText !== 'string' || typeof foreignText !== 'string') return;
  const enTrim = enText.trim();
  const foreignTrim = foreignText.trim();
  if (!enTrim || !foreignTrim || enTrim === foreignTrim) return;

  toEnglishMap.set(foreignTrim, enTrim);
  toEnglishMap.set(foreignTrim.toLowerCase(), enTrim);

  if (/\s|[-/–—]/.test(foreignTrim) && foreignTrim.length >= 2) {
    toEnglishMultiList.push({
      foreignLower: foreignTrim.toLowerCase(),
      regex: new RegExp(foreignTrim.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'), 'gi'),
      en: enTrim,
      len: foreignTrim.length,
    });
  }
}

// Index all translation files and vocabulary
for (const l of ['hi', 'gu', 'mr', 'bn', 'pa'] as LanguageCode[]) {
  const dict = TRANSLATIONS[l];
  if (dict && dict.phrases) {
    for (const [enKey, transVal] of Object.entries(dict.phrases)) {
      registerReverse(enKey, transVal);
    }
  }
  const vocab = (VOCABULARY as any)[l];
  if (vocab) {
    for (const [enKey, transVal] of Object.entries(vocab)) {
      registerReverse(enKey, transVal as string);
    }
  }
}

const CANONICAL_PRIORITY: Record<string, string> = {
  'स्वीकृत': 'Sanctioned',
  'મંજૂર': 'Sanctioned',
  'मंजूर': 'Sanctioned',
  'অনুমোদিত': 'Sanctioned',
  'ਮਨਜ਼ੂਰ': 'Sanctioned',
  'पूर्ण': 'Completed',
  'પૂર્ણ': 'Completed',
  'संपन्न': 'Completed',
  'ਪੂਰਾ': 'Completed',
  'प्रगति पर': 'In Progress',
  'પ્રગતિમાં': 'In Progress',
  'प्रगतीपथावर': 'In Progress',
  'চলমান': 'In Progress',
  'ਚੱਲ ਰਿਹਾ ਹੈ': 'In Progress',
  'विलंबित': 'Delayed',
  'વિલંબિત': 'Delayed',
  'বিলম্বিত': 'Delayed',
  'ਦੇਰੀ ਨਾਲ': 'Delayed',
  'समीक्षाधीन': 'Under Review',
  'સમીક્ષા હેઠળ': 'Under Review',
  'पुनरावलोकनाधीन': 'Under Review',
  'পর্যালোচনাধীন': 'Under Review',
  'ਸਮੀਖਿਆ ਅਧੀਨ': 'Under Review',
  'अवरुद्ध': 'Stalled',
  'અટકેલું': 'Stalled',
  'रखडलेले': 'Stalled',
  'স্থবির': 'Stalled',
  'ਰੁਕਿਆ ਹੋਇਆ': 'Stalled',
  'जांच के अधीन': 'Under Investigation',
  'તપાસ હેઠળ': 'Under Investigation',
  'तपासाधीन': 'Under Investigation',
  'তদন্তাধীন': 'Under Investigation',
  'ਜਾਂਚ ਅਧੀਨ': 'Under Investigation',
  'अति गंभीर': 'Critical',
  'अत्यधिक गंभीर जोखिम': 'Critical Risk',
  'उच्च जोखिम': 'High Risk',
  'मध्यम जोखिम': 'Medium Risk',
  'कम जोखिम': 'Low Risk',
  'सभी जोखिम': 'All Risks',
  'पी० तत्काल': 'P0 Immediate',
  'पी१ उच्च': 'P1 High',
  'पी२ सामान्य': 'P2 Normal',
  'पी३ निगरानी': 'P3 Monitor',
};

for (const [k, v] of Object.entries(CANONICAL_PRIORITY)) {
  toEnglishMap.set(k.trim(), v);
  toEnglishMap.set(k.trim().toLowerCase(), v);
}

// Sort multi-word reverse list descending by length to match longer phrases first
toEnglishMultiList.sort((a, b) => b.len - a.len);

export function toEnglish(str: string): string {
  if (!str || typeof str !== 'string') return str;
  const trimmed = str.trim();
  if (!trimmed) return str;

  // Exact match
  if (toEnglishMap.has(trimmed)) {
    return str.replace(trimmed, toEnglishMap.get(trimmed)!);
  }
  if (toEnglishMap.has(trimmed.toLowerCase())) {
    return str.replace(trimmed, toEnglishMap.get(trimmed.toLowerCase())!);
  }

  // Multi-word phrase replacements
  let out = str;
  for (const item of toEnglishMultiList) {
    if (out.toLowerCase().includes(item.foreignLower)) {
      out = out.replace(item.regex, item.en);
    }
  }

  // Token replacement for any remaining non-ASCII tokens
  out = out.replace(/[^\x00-\x7F\s,.:;!?'"()\[\]{}\/\\-]+/g, (token) => {
    const tTrim = token.trim();
    if (toEnglishMap.has(tTrim)) {
      return toEnglishMap.get(tTrim)!;
    }
    if (toEnglishMap.has(tTrim.toLowerCase())) {
      return toEnglishMap.get(tTrim.toLowerCase())!;
    }
    return token;
  });

  return out;
}

// ---------------------------------------------------------------------------
// 2. FORWARD ENGINES: Maps Canonical English to target language
// ---------------------------------------------------------------------------
interface ForwardEngine {
  textMap: Map<string, string>;
  textMapLower: Map<string, string>;
  multiWordList: Array<{
    lower: string;
    regex: RegExp;
    translation: string;
  }>;
  translate: (canonicalEn: string) => string;
}

const FORWARD_ENGINES = new Map<LanguageCode, ForwardEngine>();

function getForwardEngine(lang: LanguageCode): ForwardEngine {
  if (FORWARD_ENGINES.has(lang)) {
    return FORWARD_ENGINES.get(lang)!;
  }

  const textMap = new Map<string, string>();
  const textMapLower = new Map<string, string>();
  const multiWordList: Array<{ lower: string; regex: RegExp; translation: string }> = [];

  if (lang === 'en') {
    const engine: ForwardEngine = {
      textMap,
      textMapLower,
      multiWordList,
      translate: (s) => toEnglish(s),
    };
    FORWARD_ENGINES.set(lang, engine);
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

  rawMultiList.sort((a, b) => b.len - a.len);

  for (const item of rawMultiList) {
    const escaped = item.raw.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    multiWordList.push({
      lower: item.lower,
      regex: new RegExp('\\b' + escaped + '\\b', 'gi'),
      translation: item.translation,
    });
  }

  const translate = (canonicalEn: string): string => {
    if (!canonicalEn || typeof canonicalEn !== 'string') return canonicalEn;
    const trimmed = canonicalEn.trim();
    if (!trimmed) return canonicalEn;

    if (textMap.has(trimmed)) {
      return canonicalEn.replace(trimmed, textMap.get(trimmed)!);
    }
    const lower = trimmed.toLowerCase();
    if (textMapLower.has(lower)) {
      return canonicalEn.replace(trimmed, textMapLower.get(lower)!);
    }

    let out = canonicalEn;
    for (const item of multiWordList) {
      if (out.toLowerCase().includes(item.lower)) {
        out = out.replace(item.regex, item.translation);
      }
    }

    out = out.replace(/\b[A-Za-z]+(?:'[A-Za-z]+)?\b/g, (token) => {
      const tLower = token.toLowerCase();
      if (textMapLower.has(tLower)) {
        return textMapLower.get(tLower)!;
      }
      return transliterateEnglish(token, lang as SupportedLang);
    });

    return out;
  };

  const engine: ForwardEngine = {
    textMap,
    textMapLower,
    multiWordList,
    translate,
  };

  FORWARD_ENGINES.set(lang, engine);
  return engine;
}

// ---------------------------------------------------------------------------
// 3. UNIVERSAL TRANSLATE: Converts from ANY language to ANY target language
// ---------------------------------------------------------------------------
export function universalTranslate(rawText: string, targetLang: LanguageCode): string {
  if (!rawText || typeof rawText !== 'string') return rawText;
  const trimmed = rawText.trim();
  if (!trimmed) return rawText;

  // Step 1: Normalize any language into Canonical English
  const canonicalEn = toEnglish(rawText);

  // Step 2: If target is English, we are done
  if (targetLang === 'en') {
    return canonicalEn;
  }

  // Step 3: Forward translate canonical English into target language
  const forwardEngine = getForwardEngine(targetLang);
  return forwardEngine.translate(canonicalEn);
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

  // Universal Symmetrical DOM Text Translator
  useEffect(() => {
    if (typeof document === 'undefined') return;

    document.documentElement.lang = language;

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

        const targetVal = universalTranslate(currentVal, language);
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
            const targetPh = universalTranslate(input.placeholder, language);
            if (input.placeholder !== targetPh) {
              input.placeholder = targetPh;
            }
          }
        }

        // Element title tooltip
        if (el.title) {
          const targetTitle = universalTranslate(el.title, language);
          if (el.title !== targetTitle) {
            el.title = targetTitle;
          }
        }

        // Accessibility aria-label
        if (el.hasAttribute('aria-label')) {
          const aria = el.getAttribute('aria-label') || '';
          if (aria) {
            const targetAria = universalTranslate(aria, language);
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

          const current = target.nodeValue || '';
          if (!current.trim()) continue;

          const targetVal = universalTranslate(current, language);
          if (target.nodeValue !== targetVal) {
            (target as any).__vigilai_translating = true;
            target.nodeValue = targetVal;
            (target as any).__vigilai_translating = false;
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

  // Translation helper: t('keyPath') or t('Exact English Phrase')
  const t = useCallback(
    (keyPath: string, fallbackText?: string): string => {
      if (language === 'en') {
        if (en.phrases && typeof en.phrases[keyPath] === 'string') {
          return en.phrases[keyPath];
        }
        const parts = keyPath.split('.');
        let current: any = en;
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
        return toEnglish(fallbackText || keyPath);
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

      // 4. Translate source through universalTranslate
      const source = fallbackText || keyPath;
      return universalTranslate(source, language);
    },
    [dict, language]
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

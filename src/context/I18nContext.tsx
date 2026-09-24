// ===== INTERNATIONALIZATION (i18n) =====
// Reuses the locale JSON the vanilla app ships in /public/locales/<lang>/<section>.json.
// Files are bundled at build time (they total ~60KB) rather than fetched, so there
// is no untranslated flash on first paint.
//
// Only English is fully translated; every other language falls back to English
// per-key, then to the key itself.

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export const LANGUAGES = [
  { code: 'en', label: 'EN' },
  { code: 'nl', label: 'NL' },
  { code: 'mr', label: 'मराठी' }
] as const;

export type LanguageCode = (typeof LANGUAGES)[number]['code'];

const STORAGE_KEY = 'ntd-lang';
const FALLBACK_LANG: LanguageCode = 'en';

type Catalog = Record<string, string>;

// Eager glob: one flat catalog per language, merged from that language's sections.
const modules = (import.meta as any).glob('../../public/locales/*/*.json', { eager: true }) as Record<
  string,
  { default: Catalog }
>;

const catalogs: Record<string, Catalog> = {};
for (const [path, mod] of Object.entries(modules)) {
  const lang = path.split('/').at(-2);
  if (!lang) continue;
  catalogs[lang] = { ...catalogs[lang], ...mod.default };
}

function isSupported(lang: string | null): lang is LanguageCode {
  return !!lang && LANGUAGES.some(l => l.code === lang);
}

function readStoredLang(): LanguageCode {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return isSupported(stored) ? stored : FALLBACK_LANG;
  } catch {
    return FALLBACK_LANG;
  }
}

export type TranslateFn = (key: string, params?: Record<string, string | number>) => string;

export interface I18nContextValue {
  lang: LanguageCode;
  setLang: (lang: LanguageCode) => void;
  t: TranslateFn;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<LanguageCode>(readStoredLang);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((next: LanguageCode) => {
    setLangState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Preference just won't persist.
    }
  }, []);

  const t = useCallback<TranslateFn>(
    (key, params) => {
      let str = catalogs[lang]?.[key] ?? catalogs[FALLBACK_LANG]?.[key] ?? key;
      if (params) {
        for (const [param, value] of Object.entries(params)) {
          str = str.split(`{${param}}`).join(String(value));
        }
      }
      return str;
    },
    [lang]
  );

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return context;
}

// Some translations embed markup (e.g. "<strong>NOT available</strong>"). The
// catalogs are developer-authored and bundled at build time — never user input —
// so rendering them as HTML is safe. Plain strings render as text.
export function RichText({
  k,
  params,
  as: Tag = 'span',
  className
}: {
  k: string;
  params?: Record<string, string | number>;
  as?: 'span' | 'p' | 'h1' | 'h2' | 'h3';
  className?: string;
}) {
  const { t } = useI18n();
  const value = t(k, params);
  if (!value.includes('<')) return <Tag className={className}>{value}</Tag>;
  return <Tag className={className} dangerouslySetInnerHTML={{ __html: value }} />;
}

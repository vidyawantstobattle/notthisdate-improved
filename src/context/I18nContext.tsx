// ===== INTERNATIONALIZATION (i18n) =====
// Reuses the locale JSON the vanilla app ships in /public/locales/<lang>/<section>.json.
// Files are bundled at build time (they total ~60KB) rather than fetched, so there
// is no untranslated flash on first paint.
//
// Only English is fully translated; every other language falls back to English
// per-key, then to the key itself.
//
// Which languages are offered lives in src/config/languages.ts.

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  DEFAULT_LANGUAGE,
  FALLBACK_LANGUAGE,
  LANGUAGES,
  isEnabledLanguage,
  type LanguageCode
} from '../config/languages';

export { LANGUAGES, type LanguageCode };

const STORAGE_KEY = 'ntd-lang';

type Catalog = Record<string, string>;

// Eager glob: one flat catalog per language, merged from that language's sections.
// Deliberately covers every locale folder, not just the enabled ones, so a language
// can be switched back on in config alone.
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

// A stored language that has since been disabled falls back to the default.
function readStoredLang(): LanguageCode {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return isEnabledLanguage(stored) ? stored : DEFAULT_LANGUAGE;
  } catch {
    return DEFAULT_LANGUAGE;
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
      let str = catalogs[lang]?.[key] ?? catalogs[FALLBACK_LANGUAGE]?.[key] ?? key;
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
// catalogs are developer-authored and bundled at build time, and never come from
// user input, so rendering them as HTML is safe. Plain strings render as text.
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

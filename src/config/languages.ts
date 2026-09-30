// ===== LANGUAGE CONFIGURATION =====
// Single place to control which languages the app offers.
//
// Add a language:    add it to LANGUAGE_REGISTRY, drop matching JSON into
//                    public/locales/<code>/, then list the code in ENABLED_LANGUAGES.
// Retire a language: comment it out of ENABLED_LANGUAGES. The registry entry and
//                    its locale files stay put, so re-enabling is a one-line change.

// Every language the app knows how to render. Entries here stay valid targets for
// t() and setLang() even while they're absent from ENABLED_LANGUAGES.
export const LANGUAGE_REGISTRY = {
  en: { label: 'EN' },
  nl: { label: 'NL' },
  mr: { label: 'मराठी' }
} as const;

export type LanguageCode = keyof typeof LANGUAGE_REGISTRY;

// What the dropdown offers, in display order. Comment a line out to hide it.
const ENABLED_LANGUAGES: LanguageCode[] = [
  'en',
  // 'nl',
  'mr'
];

// Keys resolve against this language before falling back to the key itself,
// whether or not it is currently offered in the dropdown.
export const FALLBACK_LANGUAGE: LanguageCode = 'en';

export const LANGUAGES: ReadonlyArray<{ code: LanguageCode; label: string }> = ENABLED_LANGUAGES.map(
  code => ({ code, label: LANGUAGE_REGISTRY[code].label })
);

export const DEFAULT_LANGUAGE: LanguageCode = LANGUAGES[0]?.code ?? FALLBACK_LANGUAGE;

export function isEnabledLanguage(lang: string | null | undefined): lang is LanguageCode {
  return !!lang && LANGUAGES.some(l => l.code === lang);
}

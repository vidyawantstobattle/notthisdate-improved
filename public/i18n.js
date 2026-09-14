// ===== INTERNATIONALIZATION (i18n) =====
// Supports English (en), Dutch (nl), and Marathi (mr).
// Wording is split by page/section under /locales/<lang>/<section>.json so
// translators can work on one part of the site at a time. Only English is
// fully translated right now; other languages fall back to English for any
// section/key that hasn't been translated yet.

const I18N_LANGUAGES = ['en', 'nl', 'mr'];
const I18N_SECTIONS = [
    'common',
    'header',
    'footer',
    'landing',
    'about',
    'privacy',
    'dashboard',
    'calendarShell',
    'calendarSubmit',
    'calendarView'
];

const translations = { en: {}, nl: {}, mr: {} };
let currentLang = localStorage.getItem('ntd-lang') || 'en';
let i18nLoaded = false;
let resolveReady;
// Resolves once every locale file has loaded, so callers can await it before
// calling t() synchronously.
const readyPromise = new Promise(resolve => { resolveReady = resolve; });

async function loadLocale(lang) {
    const sections = await Promise.all(
        I18N_SECTIONS.map(section =>
            fetch(`/locales/${lang}/${section}.json`)
                .then(res => (res.ok ? res.json() : {}))
                .catch(() => ({}))
        )
    );
    translations[lang] = Object.assign({}, ...sections);
}

async function loadAllLocales() {
    await Promise.all(I18N_LANGUAGES.map(loadLocale));
    i18nLoaded = true;
    resolveReady();
}

// Looks up `key` in the active language, falling back to English then the key itself.
// `params` (optional) fills in `{placeholder}` tokens in the translated string.
function t(key, params) {
    let str = translations[currentLang]?.[key] ?? translations.en?.[key] ?? key;

    if (params) {
        Object.keys(params).forEach(param => {
            str = str.replace(new RegExp(`\\{${param}\\}`, 'g'), params[param]);
        });
    }

    return str;
}

function applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        const translation = t(key);
        if (translation.includes('<')) {
            el.innerHTML = translation;
        } else {
            el.textContent = translation;
        }
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        el.setAttribute('placeholder', t(el.getAttribute('data-i18n-placeholder')));
    });

    document.querySelectorAll('[data-i18n-aria-label]').forEach(el => {
        el.setAttribute('aria-label', t(el.getAttribute('data-i18n-aria-label')));
    });

    document.querySelectorAll('[data-i18n-title]').forEach(el => {
        el.setAttribute('title', t(el.getAttribute('data-i18n-title')));
    });

    document.querySelectorAll('[data-i18n-alt]').forEach(el => {
        el.setAttribute('alt', t(el.getAttribute('data-i18n-alt')));
    });

    document.querySelectorAll('.lang-select').forEach(select => {
        select.value = currentLang;
    });

    document.documentElement.lang = currentLang;
}

function setLanguage(lang) {
    if (!I18N_LANGUAGES.includes(lang)) return;
    currentLang = lang;
    localStorage.setItem('ntd-lang', lang);
    applyTranslations();
}

async function initLanguageToggle() {
    document.querySelectorAll('.lang-select').forEach(select => {
        select.value = currentLang;
        select.addEventListener('change', () => setLanguage(select.value));
    });

    await loadAllLocales();
    applyTranslations();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLanguageToggle);
} else {
    initLanguageToggle();
}

window.i18n = {
    t,
    setLanguage,
    getCurrentLang: () => currentLang,
    ready: () => i18nLoaded,
    whenReady: () => readyPromise
};


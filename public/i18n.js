// ===== INTERNATIONALIZATION (i18n) =====
// Supports English (en) and Dutch (nl)

const translations = {
    en: {
        'app.name': 'NotThisDate',
        'nav.login': 'Login',
        'nav.logout': 'Logout',
        'nav.howItWorks': 'How It Works',
        'nav.about': 'About',
        'footer.tagline': 'Group scheduling made simple.',
        'footer.product': 'Product',
        'footer.home': 'Home',
        'footer.about': 'About Us',
        'footer.resources': 'Resources',
        'footer.howItWorks': 'How It Works',
        'footer.legal': 'Legal',
        'footer.privacy': 'Privacy Policy',
        'footer.madeWith': 'Made with ❤️ for easier group planning.'
    },
    nl: {
        'app.name': 'NotThisDate',
        'nav.login': 'Inloggen',
        'nav.logout': 'Uitloggen',
        'nav.howItWorks': 'Hoe Het Werkt',
        'nav.about': 'Over Ons',
        'footer.tagline': 'Groepsplanning simpel gemaakt.',
        'footer.product': 'Product',
        'footer.home': 'Home',
        'footer.about': 'Over Ons',
        'footer.resources': 'Bronnen',
        'footer.howItWorks': 'Hoe Het Werkt',
        'footer.legal': 'Juridisch',
        'footer.privacy': 'Privacybeleid',
        'footer.madeWith': 'Gemaakt met ❤️ voor makkelijker groepsplannen.'
    }
};

let currentLang = localStorage.getItem('ntd-lang') || 'en';

function t(key) {
    return translations[currentLang]?.[key] || translations['en']?.[key] || key;
}

function setLanguage(lang) {
    if (!translations[lang]) return;
    currentLang = lang;
    localStorage.setItem('ntd-lang', lang);

    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        const translation = t(key);
        if (translation.includes('<')) {
            el.innerHTML = translation;
        } else {
            el.textContent = translation;
        }
    });

    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.lang === lang);
    });

    document.documentElement.lang = lang;
}

function initLanguageToggle() {
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.addEventListener('click', () => setLanguage(btn.dataset.lang));
    });
    setLanguage(currentLang);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLanguageToggle);
} else {
    initLanguageToggle();
}

window.i18n = { t, setLanguage, getCurrentLang: () => currentLang };


// ===== SHARED UTILITIES =====
// Loaded on every page before the page-specific scripts. These are plain script
// globals (no modules), so everything here is available to app.js, calendar.js,
// calendar-utils.js and calendar-availability.js.

const PROD_SITE_URL = 'https://reverse-date-picker.netlify.app';

// Netlify Functions can't run against the static local dev server, so local
// requests are proxied to the deployed site.
async function fetchFunction(path, options = {}) {
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

    if (isLocalhost) {
        return fetch(`${PROD_SITE_URL}${path}`, options);
    }

    return fetch(path, options);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDisplayDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr + 'T12:00:00');
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function openModal(modalId) {
    document.getElementById(modalId)?.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closeModal(modalId) {
    document.getElementById(modalId)?.classList.add('hidden');
    document.body.style.overflow = '';
}

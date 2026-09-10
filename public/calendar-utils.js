// ===== CALENDAR UTILITIES =====

function formatDateLocal(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function formatDateDisplay(dateStr) {
    const date = new Date(dateStr + 'T12:00:00');
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatDisplayDate(dateStr) {
    const date = new Date(dateStr + 'T12:00:00');
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function groupIntoRanges(dates) {
    if (dates.length === 0) return [];

    const sorted = [...dates].sort();
    const ranges = [];
    let rangeStart = sorted[0];
    let rangeEnd = sorted[0];

    for (let i = 1; i < sorted.length; i++) {
        const prevDate = new Date(sorted[i - 1] + 'T12:00:00');
        const currDate = new Date(sorted[i] + 'T12:00:00');
        const diffDays = (currDate - prevDate) / (1000 * 60 * 60 * 24);

        if (diffDays === 1) {
            rangeEnd = sorted[i];
        } else {
            ranges.push({ start: rangeStart, end: rangeEnd });
            rangeStart = sorted[i];
            rangeEnd = sorted[i];
        }
    }

    ranges.push({ start: rangeStart, end: rangeEnd });
    return ranges;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function generateVerificationCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

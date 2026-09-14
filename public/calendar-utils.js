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

function generateVerificationCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function normalizeSubmissions(submissions, participantName = '') {
    if (!submissions) return [];

    const normalizeOne = (entry, fallbackName = '') => {
        if (!entry || typeof entry !== 'object') {
            return null;
        }

        const dates = Array.isArray(entry.dates)
            ? entry.dates
            : (Array.isArray(entry) ? entry : []);

        return {
            participantName: entry.participantName || fallbackName || participantName || '',
            dates,
            timestamp: entry.timestamp || entry.submittedAt || null
        };
    };

    if (Array.isArray(submissions)) {
        return submissions
            .map(item => normalizeOne(item))
            .filter(Boolean);
    }

    if (typeof submissions === 'object' && Array.isArray(submissions.dates)) {
        const single = normalizeOne(submissions, participantName);
        return single ? [single] : [];
    }

    if (typeof submissions === 'object') {
        return Object.entries(submissions)
            .map(([name, value]) => normalizeOne(value, name))
            .filter(Boolean);
    }

    return [];
}

function normalizeParticipantName(name = '') {
    return name.trim().toLowerCase();
}

function mergeSubmissionsByParticipant(submissions, fallbackName = '') {
    const mergedDates = [];
    let latestTimestamp = null;

    submissions.forEach(submission => {
        const dates = Array.isArray(submission.dates) ? submission.dates : [];
        dates.forEach(date => {
            if (!mergedDates.includes(date)) {
                mergedDates.push(date);
            }
        });

        if (submission.timestamp) {
            if (!latestTimestamp || new Date(submission.timestamp) > new Date(latestTimestamp)) {
                latestTimestamp = submission.timestamp;
            }
        }
    });

    return {
        participantName: submissions[0]?.participantName || fallbackName,
        dates: mergedDates.sort(),
        timestamp: latestTimestamp
    };
}

function parseDateLocal(dateValue) {
    if (!dateValue) return null;

    const raw = String(dateValue);
    const date = raw.includes('T')
        ? new Date(raw)
        : new Date(`${raw}T12:00:00`);

    if (Number.isNaN(date.getTime())) return null;

    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

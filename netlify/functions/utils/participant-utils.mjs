export function normalizeParticipantName(name = '') {
    return name.trim().toLowerCase();
}

export function normalizeEmail(email = '') {
    return email.trim().toLowerCase();
}

export function findMatchingParticipantKeys(unavailability = {}, participantName = '') {
    const query = normalizeParticipantName(participantName);
    if (!query) return [];

    return Object.keys(unavailability)
        .filter(name => normalizeParticipantName(name) === query);
}

// Lets one signed-in person be recognised across calendars even when they used
// a different display name on each one.
export function findParticipantKeysByEmail(unavailability = {}, email = '') {
    const query = normalizeEmail(email);
    if (!query) return [];

    return Object.entries(unavailability)
        .filter(([, value]) =>
            value &&
            typeof value === 'object' &&
            !Array.isArray(value) &&
            normalizeEmail(value.userEmail || '') === query)
        .map(([name]) => name);
}

// Netlify Identity verifies the JWT at the gateway, so reading the payload here is enough.
export function readUserEmail(request) {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;

    try {
        const payload = JSON.parse(atob(authHeader.split(' ')[1].split('.')[1]));
        return typeof payload.email === 'string' ? payload.email : null;
    } catch {
        return null;
    }
}

export function chooseCanonicalParticipantKey(matchingKeys = [], enteredName = '') {
    const trimmed = enteredName.trim();
    return matchingKeys.find(name => name === trimmed)
        || matchingKeys[0]
        || trimmed;
}

export function collapseParticipantKeys(unavailability = {}, matchingKeys = [], keepKey = '') {
    matchingKeys.forEach(name => {
        if (name !== keepKey) {
            delete unavailability[name];
        }
    });
}

export function toSubmissionEntry(name, value) {
    const submission = value && typeof value === 'object' && !Array.isArray(value)
        ? value
        : { dates: Array.isArray(value) ? value : [] };

    return {
        participantName: name,
        dates: Array.isArray(submission.dates) ? submission.dates : [],
        timestamp: submission.timestamp || submission.submittedAt || null,
        userEmail: typeof submission.userEmail === 'string' ? submission.userEmail : null
    };
}

export function mergeSubmissionEntries(entries = [], fallbackName = '') {
    const mergedDates = [];
    let latestTimestamp = null;
    let userEmail = null;

    entries.forEach(entry => {
        entry.dates.forEach(date => {
            if (!mergedDates.includes(date)) {
                mergedDates.push(date);
            }
        });

        if (!userEmail && entry.userEmail) {
            userEmail = entry.userEmail;
        }

        if (entry.timestamp) {
            if (!latestTimestamp || new Date(entry.timestamp) > new Date(latestTimestamp)) {
                latestTimestamp = entry.timestamp;
            }
        }
    });

    return {
        participantName: fallbackName,
        dates: mergedDates,
        timestamp: latestTimestamp,
        userEmail
    };
}
export function normalizeParticipantName(name = '') {
    return name.trim().toLowerCase();
}

export function findMatchingParticipantKeys(unavailability = {}, participantName = '') {
    const query = normalizeParticipantName(participantName);
    if (!query) return [];

    return Object.keys(unavailability)
        .filter(name => normalizeParticipantName(name) === query);
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
        timestamp: submission.timestamp || submission.submittedAt || null
    };
}

export function mergeSubmissionEntries(entries = [], fallbackName = '') {
    const mergedDates = [];
    let latestTimestamp = null;

    entries.forEach(entry => {
        entry.dates.forEach(date => {
            if (!mergedDates.includes(date)) {
                mergedDates.push(date);
            }
        });

        if (entry.timestamp) {
            if (!latestTimestamp || new Date(entry.timestamp) > new Date(latestTimestamp)) {
                latestTimestamp = entry.timestamp;
            }
        }
    });

    return {
        participantName: fallbackName,
        dates: mergedDates,
        timestamp: latestTimestamp
    };
}
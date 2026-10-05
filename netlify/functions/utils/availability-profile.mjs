// Shared helpers for the per-user availability profile: the set of dates a
// signed-in user treats as their default "not available", reusable across the
// calendars they participate in.

export const AVAILABILITY_PROFILE_STORE = 'user-availability';

// One year of dates plus headroom; bounds what a single profile can store.
export const MAX_PROFILE_DATES = 400;
export const MAX_DISMISSED_CALENDARS = 50;

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function emptyProfile() {
    return { dates: [], dismissedCalendars: [], updatedAt: null };
}

export function sanitizeDates(value) {
    if (!Array.isArray(value)) return [];
    const unique = new Set();
    for (const entry of value) {
        if (typeof entry !== 'string' || !DATE_PATTERN.test(entry)) continue;
        unique.add(entry);
        if (unique.size >= MAX_PROFILE_DATES) break;
    }
    return Array.from(unique).sort();
}

export function sanitizeCalendarIds(value) {
    if (!Array.isArray(value)) return [];
    const unique = new Set();
    for (const entry of value) {
        if (typeof entry !== 'string') continue;
        const trimmed = entry.trim();
        if (!trimmed || trimmed.length > 64) continue;
        unique.add(trimmed);
        if (unique.size >= MAX_DISMISSED_CALENDARS) break;
    }
    return Array.from(unique);
}

export function normalizeProfile(raw) {
    if (!raw || typeof raw !== 'object') return emptyProfile();
    return {
        dates: sanitizeDates(raw.dates),
        dismissedCalendars: sanitizeCalendarIds(raw.dismissedCalendars),
        updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : null
    };
}

// Netlify Identity signs the JWT; the gateway verifies it before the function
// runs, so decoding the payload is enough to read the subject here.
export function readUserId(request) {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;

    try {
        const token = authHeader.split(' ')[1];
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.sub || null;
    } catch {
        return null;
    }
}

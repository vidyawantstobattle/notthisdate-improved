// Shared helpers for the per-user sync preferences: which calendars the user has
// told us not to offer cross-calendar date suggestions on.

export const AVAILABILITY_PROFILE_STORE = 'user-availability';

export const MAX_DISMISSED_CALENDARS = 50;

export function emptyProfile() {
    return { dismissedCalendars: [], updatedAt: null };
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

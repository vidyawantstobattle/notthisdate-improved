// ===== SHARED-CALENDAR MEMBERSHIP INDEX =====
// Keyed by normalised email rather than user id, because a participant's identity
// on a calendar is only ever established by the email on their submission.
//
// Without this index the only way to answer "which calendars am I in?" would be
// to scan every calendar blob on every dashboard load.

import { getStore } from "@netlify/blobs";
import { normalizeEmail } from "./participant-utils.mjs";

const STORE_NAME = "user-memberships";

function membershipStore(context) {
    return getStore({
        name: STORE_NAME,
        siteID: context.site.id,
        token: context.token
    });
}

export async function readMemberships(context, email) {
    const key = normalizeEmail(email);
    if (!key) return [];

    try {
        const existing = await membershipStore(context).get(key, { type: 'json', consistency: 'strong' });
        return Array.isArray(existing) ? existing : [];
    } catch (e) {
        return [];
    }
}

// Best-effort: a failure here must never fail the submission that triggered it.
// Returns whether the calendar is now in the list, so callers that joined on
// purpose (rather than as a side effect) can report a genuine failure.
export async function recordMembership(context, email, calendarId) {
    const key = normalizeEmail(email);
    if (!key || !calendarId) return false;

    try {
        const store = membershipStore(context);
        const existing = await readMemberships(context, key);

        if (existing.some(entry => entry.id === calendarId)) return true;

        existing.push({ id: calendarId, joinedAt: new Date().toISOString() });
        await store.setJSON(key, existing);
        return true;
    } catch (e) {
        console.warn('Could not record calendar membership:', e);
        return false;
    }
}

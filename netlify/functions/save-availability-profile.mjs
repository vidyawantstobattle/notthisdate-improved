import { getStore } from "@netlify/blobs";
import {
    AVAILABILITY_PROFILE_STORE,
    MAX_DISMISSED_CALENDARS,
    emptyProfile,
    normalizeProfile,
    readUserId
} from "./utils/availability-profile.mjs";

export default async (request, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers });
    }

    if (request.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers });
    }

    const userId = readUserId(request);
    if (!userId) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers });
    }

    try {
        const body = await request.json();
        const { dismissCalendarId, undismissCalendarId } = body || {};

        const store = getStore({
            name: AVAILABILITY_PROFILE_STORE,
            siteID: context.site.id,
            token: context.token
        });

        let profile = emptyProfile();
        try {
            const raw = await store.get(userId, { type: 'json', consistency: 'strong' });
            if (raw) profile = normalizeProfile(raw);
        } catch {
            // First write for this user; start from the empty profile.
        }

        if (typeof dismissCalendarId === 'string' && dismissCalendarId.trim()) {
            const id = dismissCalendarId.trim().slice(0, 64);
            if (!profile.dismissedCalendars.includes(id)) {
                profile.dismissedCalendars.push(id);
            }
            // Keep the newest dismissals when the list is full.
            profile.dismissedCalendars = profile.dismissedCalendars.slice(-MAX_DISMISSED_CALENDARS);
        }

        if (typeof undismissCalendarId === 'string' && undismissCalendarId.trim()) {
            const id = undismissCalendarId.trim();
            profile.dismissedCalendars = profile.dismissedCalendars.filter(entry => entry !== id);
        }

        profile.updatedAt = new Date().toISOString();
        await store.setJSON(userId, profile);

        return new Response(JSON.stringify({ success: true, profile }), { status: 200, headers });
    } catch (error) {
        console.error('Error saving availability profile:', error);
        return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers });
    }
};

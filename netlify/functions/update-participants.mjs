import { getStore } from "@netlify/blobs";
import { normalizeParticipantName } from "./utils/participant-utils.mjs";

const MAX_PARTICIPANTS = 50;

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

    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers });
    }

    let userId;
    try {
        const payload = JSON.parse(atob(authHeader.split(' ')[1].split('.')[1]));
        userId = payload.sub;
    } catch (e) {
        return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401, headers });
    }

    const url = new URL(request.url);
    const calendarId = url.searchParams.get('id');

    if (!calendarId) {
        return new Response(JSON.stringify({ error: 'Calendar ID is required' }), { status: 400, headers });
    }

    try {
        const body = await request.json();
        const { participants } = body;

        if (!Array.isArray(participants)) {
            return new Response(JSON.stringify({ error: 'participants must be an array' }), { status: 400, headers });
        }

        // Trim, drop blanks, and de-duplicate case-insensitively while keeping entered casing.
        const seen = new Set();
        const cleanParticipants = [];
        participants.forEach(entry => {
            if (typeof entry !== 'string') return;
            const trimmed = entry.trim();
            if (!trimmed) return;
            const key = normalizeParticipantName(trimmed);
            if (seen.has(key)) return;
            seen.add(key);
            cleanParticipants.push(trimmed);
        });

        if (cleanParticipants.length === 0) {
            return new Response(JSON.stringify({ error: 'At least one participant is required' }), { status: 400, headers });
        }

        if (cleanParticipants.length > MAX_PARTICIPANTS) {
            return new Response(JSON.stringify({
                error: `A calendar can have at most ${MAX_PARTICIPANTS} participants.`
            }), { status: 400, headers });
        }

        const calendarStore = getStore({
            name: "calendars",
            siteID: context.site.id,
            token: context.token
        });

        let calendar;
        try {
            calendar = await calendarStore.get(calendarId, { type: 'json', consistency: 'strong' });
        } catch (e) {
            calendar = null;
        }

        if (!calendar) {
            return new Response(JSON.stringify({ error: 'Calendar not found' }), { status: 404, headers });
        }

        if (calendar.ownerId !== userId) {
            return new Response(JSON.stringify({ error: 'Forbidden: You do not own this calendar' }), { status: 403, headers });
        }

        if (calendar.participantsType !== 'defined') {
            return new Response(JSON.stringify({
                error: 'Only calendars with a predetermined participant list can be edited.'
            }), { status: 400, headers });
        }

        // Drop submissions from participants who are no longer on the list.
        if (calendar.unavailability) {
            const allowed = new Set(cleanParticipants.map(normalizeParticipantName));
            Object.keys(calendar.unavailability).forEach(name => {
                if (!allowed.has(normalizeParticipantName(name))) {
                    delete calendar.unavailability[name];
                }
            });
        }

        calendar.participants = cleanParticipants;
        await calendarStore.setJSON(calendarId, calendar);

        return new Response(JSON.stringify({
            success: true,
            participants: cleanParticipants
        }), { status: 200, headers });

    } catch (error) {
        console.error('Error updating participants:', error);
        return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers });
    }
};

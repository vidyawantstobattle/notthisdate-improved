import { getStore } from "@netlify/blobs";
import {
    findMatchingParticipantKeys,
    chooseCanonicalParticipantKey,
    collapseParticipantKeys,
    toSubmissionEntry
} from "./utils/participant-utils.mjs";

export default async (request, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers });
    }

    if (request.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers });
    }

    const url = new URL(request.url);
    const calendarId = url.searchParams.get('calendarId');

    if (!calendarId) {
        return new Response(JSON.stringify({ error: 'Calendar ID is required' }), { status: 400, headers });
    }

    try {
        const body = await request.json();
        const { participantName, unavailableDates } = body;

        if (!participantName || !participantName.trim()) {
            return new Response(JSON.stringify({ error: 'Participant name is required' }), { status: 400, headers });
        }

        if (!Array.isArray(unavailableDates)) {
            return new Response(JSON.stringify({ error: 'Unavailable dates must be an array' }), { status: 400, headers });
        }

        const calendarStore = getStore({
            name: "calendars",
            siteID: context.site.id,
            token: context.token
        });

        // Get calendar
        let calendar;
        try {
            calendar = await calendarStore.get(calendarId, { type: 'json', consistency: 'strong' });
            if (!calendar) {
                return new Response(JSON.stringify({ error: 'Calendar not found' }), { status: 404, headers });
            }
        } catch (e) {
            return new Response(JSON.stringify({ error: 'Calendar not found' }), { status: 404, headers });
        }

        // Initialize unavailability object if it doesn't exist
        if (!calendar.unavailability) {
            calendar.unavailability = {};
        }

        const enteredName = participantName.trim();
        const matchingKeys = findMatchingParticipantKeys(calendar.unavailability, enteredName);

        // Reuse an existing key for this user (case-insensitive) to avoid duplicates.
        const participantKey = chooseCanonicalParticipantKey(matchingKeys, enteredName);

        // Preserve existing dates across all case variants before key collapse.
        const existingDates = [];
        matchingKeys.forEach(name => {
            const existingEntry = toSubmissionEntry(name, calendar.unavailability[name]);
            existingEntry.dates.forEach(date => {
                if (!existingDates.includes(date)) {
                    existingDates.push(date);
                }
            });
        });

        // Collapse historical casing duplicates into one canonical participant key.
        collapseParticipantKeys(calendar.unavailability, matchingKeys, participantKey);
        const mergedDates = Array.from(new Set([
            ...existingDates,
            ...unavailableDates
        ])).sort();

        // Store participant's unavailability
        calendar.unavailability[participantKey] = {
            dates: mergedDates,
            submittedAt: new Date().toISOString()
        };

        // Save updated calendar
        await calendarStore.setJSON(calendarId, calendar);

        return new Response(JSON.stringify({
            success: true,
            message: 'Unavailability submitted',
            participant: participantKey,
            unavailableDates: mergedDates
        }), { status: 200, headers });

    } catch (error) {
        console.error('Error submitting unavailability:', error);
        return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers });
    }
};


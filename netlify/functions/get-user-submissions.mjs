import { getStore } from "@netlify/blobs";
import {
    findMatchingParticipantKeys,
    toSubmissionEntry,
    mergeSubmissionEntries
} from "./utils/participant-utils.mjs";

export default async (request, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Content-Type': 'application/json'
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers });
    }

    if (request.method !== 'GET') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers });
    }

    const url = new URL(request.url);
    const calendarId = url.searchParams.get('calendarId');
    const participantName = url.searchParams.get('participant');

    if (!calendarId) {
        return new Response(JSON.stringify({ error: 'Calendar ID is required' }), { status: 400, headers });
    }

    try {
        const calendarStore = getStore({
            name: "calendars",
            siteID: context.site.id,
            token: context.token
        });

        try {
            const calendar = await calendarStore.get(calendarId, { type: 'json', consistency: 'strong' });
            if (!calendar) {
                return new Response(JSON.stringify({ error: 'Calendar not found' }), { status: 404, headers });
            }

            let submissions;
            if (participantName) {
                // Get specific participant submission with case/trim-insensitive matching.
                const unavailability = calendar.unavailability || {};
                const matchingKeys = findMatchingParticipantKeys(unavailability, participantName);

                if (matchingKeys.length === 0) {
                    submissions = [];
                } else {
                    const entries = matchingKeys.map(name => toSubmissionEntry(name, unavailability[name]));
                    submissions = [mergeSubmissionEntries(entries, matchingKeys[0])];
                }
            } else {
                // Get all submissions as an array of normalized entries.
                submissions = Object.entries(calendar.unavailability || {})
                    .map(([name, value]) => toSubmissionEntry(name, value));
            }

            return new Response(JSON.stringify({ submissions }), { status: 200, headers });
        } catch (e) {
            return new Response(JSON.stringify({ error: 'Calendar not found' }), { status: 404, headers });
        }
    } catch (error) {
        console.error('Error retrieving submissions:', error);
        return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers });
    }
};


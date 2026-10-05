import { getStore } from "@netlify/blobs";
import {
    findMatchingParticipantKeys,
    findParticipantKeysByEmail,
    toSubmissionEntry,
    mergeSubmissionEntries,
    readUserEmail
} from "./utils/participant-utils.mjs";

// Emails are only ever used for server-side matching, never returned to callers.
const stripEmail = ({ userEmail, ...entry }) => entry;

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
    const matchBy = url.searchParams.get('matchBy');

    if (!calendarId) {
        return new Response(JSON.stringify({ error: 'Calendar ID is required' }), { status: 400, headers });
    }

    // The email is read from the verified token, never from the query string, so
    // a caller can only ever look up their own submissions.
    const tokenEmail = matchBy === 'email' ? readUserEmail(request) : null;
    if (matchBy === 'email' && !tokenEmail) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers });
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

            const unavailability = calendar.unavailability || {};
            let submissions;

            if (tokenEmail) {
                const matchingKeys = findParticipantKeysByEmail(unavailability, tokenEmail);
                submissions = matchingKeys.length === 0
                    ? []
                    : [mergeSubmissionEntries(
                        matchingKeys.map(name => toSubmissionEntry(name, unavailability[name])),
                        matchingKeys[0]
                    )];
            } else if (participantName) {
                // Get specific participant submission with case/trim-insensitive matching.
                const matchingKeys = findMatchingParticipantKeys(unavailability, participantName);

                if (matchingKeys.length === 0) {
                    submissions = [];
                } else {
                    const entries = matchingKeys.map(name => toSubmissionEntry(name, unavailability[name]));
                    submissions = [mergeSubmissionEntries(entries, matchingKeys[0])];
                }
            } else {
                // Get all submissions as an array of normalized entries.
                submissions = Object.entries(unavailability)
                    .map(([name, value]) => toSubmissionEntry(name, value));
            }

            return new Response(JSON.stringify({ submissions: submissions.map(stripEmail) }), { status: 200, headers });
        } catch (e) {
            return new Response(JSON.stringify({ error: 'Calendar not found' }), { status: 404, headers });
        }
    } catch (error) {
        console.error('Error retrieving submissions:', error);
        return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers });
    }
};


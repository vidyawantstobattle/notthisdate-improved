import { getStore } from "@netlify/blobs";

export default async (request, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Content-Type': 'application/json'
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
        return new Response('', { status: 204, headers });
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
        const calendarStore = getStore("calendars");

        try {
            const calendar = await calendarStore.get(calendarId, { type: 'json' });
            if (!calendar) {
                return new Response(JSON.stringify({ error: 'Calendar not found' }), { status: 404, headers });
            }

            let submissions;
            if (participantName) {
                // Get specific participant's submission
                submissions = calendar.unavailability?.[participantName] || null;
            } else {
                // Get all submissions
                submissions = calendar.unavailability || {};
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


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

    // Get calendar ID from query parameter
    const url = new URL(request.url);
    const calendarId = url.searchParams.get('id');

    console.log('Getting calendar with ID:', calendarId);

    if (!calendarId) {
        return new Response(JSON.stringify({ error: 'Calendar ID is required' }), { status: 400, headers });
    }

    try {
        // Use context to get the proper store
        const calendarStore = getStore({
            name: "calendars",
            siteID: context.site.id,
            token: context.token
        });
        console.log(`Attempting to retrieve calendar: ${calendarId}`);

        try {
            const calendar = await calendarStore.get(calendarId, { type: 'json' });
            console.log(`Calendar retrieval result:`, calendar ? 'Found' : 'Not found');

            if (!calendar) {
                console.log(`Calendar ${calendarId} does not exist in store`);
                return new Response(JSON.stringify({ error: 'Calendar not found' }), { status: 404, headers });
            }

            console.log(`Successfully returning calendar: ${calendar.name}`);
            // Return calendar data (without sensitive info if needed)
            return new Response(JSON.stringify(calendar), { status: 200, headers });
        } catch (e) {
            console.error(`Error getting calendar from store:`, e);
            return new Response(JSON.stringify({ error: 'Calendar not found', details: e.message }), { status: 404, headers });
        }
    } catch (error) {
        console.error('Error retrieving calendar:', error);
        return new Response(JSON.stringify({ error: 'Internal server error', details: error.message }), { status: 500, headers });
    }
};


import { getStore } from "@netlify/blobs";

export default async (request, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Content-Type': 'application/json'
    };

    if (request.method !== 'GET') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers });
    }

    const url = new URL(request.url);
    const calendarId = url.searchParams.get('calendarId');

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

            // Return only unavailability data
            return new Response(JSON.stringify({
                unavailability: calendar.unavailability || {}
            }), { status: 200, headers });
        } catch (e) {
            return new Response(JSON.stringify({ error: 'Calendar not found' }), { status: 404, headers });
        }
    } catch (error) {
        console.error('Error retrieving unavailability:', error);
        return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers });
    }
};


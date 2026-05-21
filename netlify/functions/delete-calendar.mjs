import { getStore } from "@netlify/blobs";

export default async (request, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
        'Content-Type': 'application/json'
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
        return new Response('', { status: 204, headers });
    }

    if (request.method !== 'DELETE') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers });
    }

    // Verify authentication
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers });
    }

    const token = authHeader.split(' ')[1];
    let userId;

    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
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
        const calendarStore = getStore("calendars");
        const userStore = getStore("user-calendars");

        // Get calendar to verify ownership
        let calendar;
        try {
            calendar = await calendarStore.get(calendarId, { type: 'json' });
            if (!calendar) {
                return new Response(JSON.stringify({ error: 'Calendar not found' }), { status: 404, headers });
            }
        } catch (e) {
            return new Response(JSON.stringify({ error: 'Calendar not found' }), { status: 404, headers });
        }

        // Verify ownership
        if (calendar.ownerId !== userId) {
            return new Response(JSON.stringify({ error: 'Forbidden: You do not own this calendar' }), { status: 403, headers });
        }

        // Delete calendar
        await calendarStore.delete(calendarId);

        // Remove from user's calendar list
        try {
            let userCalendars = [];
            const existing = await userStore.get(userId, { type: 'json' });
            if (existing) {
                userCalendars = existing.filter(cal => cal.id !== calendarId);
                await userStore.setJSON(userId, userCalendars);
            }
        } catch (e) {}

        return new Response(JSON.stringify({
            success: true,
            message: 'Calendar deleted'
        }), { status: 200, headers });

    } catch (error) {
        console.error('Error deleting calendar:', error);
        return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers });
    }
};


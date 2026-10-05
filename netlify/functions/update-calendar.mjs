import { getStore } from "@netlify/blobs";

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
        return new Response(JSON.stringify({ error: 'Calendar ID required' }), { status: 400, headers });
    }

    try {
        const body = await request.json();
        const { name, description, blockedDates } = body;

        if (!name || typeof name !== 'string') {
            return new Response(JSON.stringify({ error: 'Calendar name is required' }), { status: 400, headers });
        }

        const calendarStore = getStore({
            name: "calendars",
            siteID: context.site.id,
            token: context.token
        });

        const userStore = getStore({
            name: "user-calendars",
            siteID: context.site.id,
            token: context.token
        });

        // Get existing calendar
        const existing = await calendarStore.get(calendarId, { type: 'json', consistency: 'strong' });
        if (!existing) {
            return new Response(JSON.stringify({ error: 'Calendar not found' }), { status: 404, headers });
        }

        // Check ownership - ensure the user owns this calendar
        if (existing.ownerId !== userId) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 403, headers });
        }

        // Verify user has this calendar in their list
        const userCalendarRefs = await userStore.get(userId, { type: 'json', consistency: 'strong' }) || [];
        if (!userCalendarRefs.some(ref => ref.id === calendarId)) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 403, headers });
        }

        // Update calendar
        const updated = {
            ...existing,
            name: name.trim(),
            description: description ? description.trim() : '',
            blockedDates: Array.isArray(blockedDates) ? blockedDates : []
        };

        await calendarStore.setJSON(calendarId, updated);

        return new Response(
            JSON.stringify({ success: true, calendar: updated }),
            { status: 200, headers }
        );
    } catch (error) {
        console.error('Error updating calendar:', error);
        return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers });
    }
};

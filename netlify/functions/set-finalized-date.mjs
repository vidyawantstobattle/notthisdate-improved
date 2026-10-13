import { getStore } from "@netlify/blobs";

// Lets the organiser lock in a meeting date (or clear it to reopen the
// calendar) without touching the rest of the calendar's fields.
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
        const { finalizedDate, finalizedEndDate } = body;

        // null/undefined clears the finalized date and reopens the calendar.
        const isDateString = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
        const clearing = finalizedDate === null;

        if (!clearing && !isDateString(finalizedDate)) {
            return new Response(JSON.stringify({ error: 'finalizedDate must be a YYYY-MM-DD string or null' }), { status: 400, headers });
        }

        const calendarStore = getStore({
            name: "calendars",
            siteID: context.site.id,
            token: context.token
        });

        const calendar = await calendarStore.get(calendarId, { type: 'json', consistency: 'strong' });
        if (!calendar) {
            return new Response(JSON.stringify({ error: 'Calendar not found' }), { status: 404, headers });
        }

        if (calendar.ownerId !== userId) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 403, headers });
        }

        let safeEnd = null;

        if (!clearing) {
            // The lock-in has to land inside the window participants actually
            // answered for, otherwise the overlay advertises a date nobody rated.
            if (finalizedDate < calendar.startDate || finalizedDate > calendar.endDate) {
                return new Response(JSON.stringify({ error: 'finalizedDate must fall within the calendar date range' }), { status: 400, headers });
            }

            if (finalizedEndDate !== null && finalizedEndDate !== undefined && finalizedEndDate !== '') {
                if (!isDateString(finalizedEndDate)) {
                    return new Response(JSON.stringify({ error: 'finalizedEndDate must be a YYYY-MM-DD string or null' }), { status: 400, headers });
                }
                if (finalizedEndDate < finalizedDate) {
                    return new Response(JSON.stringify({ error: 'finalizedEndDate cannot be before finalizedDate' }), { status: 400, headers });
                }
                if (finalizedEndDate > calendar.endDate) {
                    return new Response(JSON.stringify({ error: 'finalizedEndDate must fall within the calendar date range' }), { status: 400, headers });
                }
                // A one-day lock-in is stored as a bare start date so readers
                // don't have to special-case start === end.
                safeEnd = finalizedEndDate === finalizedDate ? null : finalizedEndDate;
            }
        }

        const updated = {
            ...calendar,
            finalizedDate: clearing ? null : finalizedDate,
            finalizedEndDate: clearing ? null : safeEnd
        };

        await calendarStore.setJSON(calendarId, updated);

        return new Response(JSON.stringify({ success: true, calendar: updated }), { status: 200, headers });
    } catch (error) {
        console.error('Error setting finalized date:', error);
        return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers });
    }
};

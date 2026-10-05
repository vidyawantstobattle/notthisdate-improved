import { getStore } from "@netlify/blobs";

/**
 * Get app-wide statistics: number of users and calendars
 * No authentication required - public endpoint
 */
export default async (request, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers });
    }

    if (request.method !== 'GET') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers });
    }

    try {
        const userStore = getStore({
            name: "user-calendars",
            siteID: context.site.id,
            token: context.token
        });

        const calendarStore = getStore({
            name: "calendars",
            siteID: context.site.id,
            token: context.token
        });

        // Count unique users (one entry per user in user-calendars store)
        let userCount = 0;
        try {
            for await (const entry of userStore.list()) {
                userCount++;
            }
        } catch (e) {
            console.warn('Error counting users:', e);
        }

        // Count total calendars (one entry per calendar in calendars store)
        let calendarCount = 0;
        try {
            for await (const entry of calendarStore.list()) {
                calendarCount++;
            }
        } catch (e) {
            console.warn('Error counting calendars:', e);
        }

        const stats = {
            users: userCount,
            calendars: calendarCount,
            timestamp: new Date().toISOString()
        };

        console.log('Returning stats:', stats);

        return new Response(
            JSON.stringify(stats),
            {
                status: 200,
                headers
            }
        );
    } catch (error) {
        console.error('Failed to fetch stats:', error);
        // Return default stats (0) rather than erroring
        return new Response(
            JSON.stringify({
                users: 0,
                calendars: 0,
                timestamp: new Date().toISOString()
            }),
            { status: 200, headers }
        );
    }
};


import { getStore } from "@netlify/blobs";
import { MAX_CALENDAR_HORIZON_DAYS } from "./utils/limits.mjs";

const MAX_BLOCKED_REASON_LENGTH = 100;

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
        const { name, description, endDate, blockedDates, blockedDateReasons } = body;

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

        // Validate and set end date
        let safeEndDate = existing.endDate;
        if (endDate && typeof endDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
            if (endDate >= existing.startDate) {
                const start = new Date(existing.startDate + 'T00:00:00');
                const end = new Date(endDate + 'T00:00:00');
                const diffMs = end.getTime() - start.getTime();
                const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                if (diffDays <= MAX_CALENDAR_HORIZON_DAYS) {
                    safeEndDate = endDate;
                }
            }
        }

        // Keep only well-formed dates that sit inside the calendar's new range.
        const safeBlockedDates = Array.isArray(blockedDates)
            ? Array.from(new Set(
                blockedDates.filter(d => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d)
                    && (!existing.startDate || d >= existing.startDate)
                    && (!safeEndDate || d <= safeEndDate))
            )).sort()
            : [];

        // Only keep notes for dates that survived validation above.
        const safeBlockedDateReasons = {};
        if (blockedDateReasons && typeof blockedDateReasons === 'object' && !Array.isArray(blockedDateReasons)) {
            safeBlockedDates.forEach(dateStr => {
                const reason = blockedDateReasons[dateStr];
                if (typeof reason !== 'string') return;
                const trimmed = reason.trim().slice(0, MAX_BLOCKED_REASON_LENGTH);
                if (trimmed) safeBlockedDateReasons[dateStr] = trimmed;
            });
        }

        const updated = {
            ...existing,
            name: name.trim(),
            description: description ? description.trim() : '',
            endDate: safeEndDate,
            blockedDates: safeBlockedDates,
            blockedDateReasons: safeBlockedDateReasons
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

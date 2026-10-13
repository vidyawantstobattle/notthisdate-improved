import { getStore } from "@netlify/blobs";
import { readUserEmail, normalizeEmail, findParticipantKeysByEmail } from "./utils/participant-utils.mjs";
import { recordMembership } from "./utils/memberships.mjs";

// Adds a calendar to the signed-in user's "invited to" list, either because they
// opened the link or because they pasted it on their dashboard.
//
// Calendars with requireEmailVerification on are only joinable by someone whose
// email is already recorded against a submission, so a leaked link alone is not
// enough to appear on the roster. Everything else joins on sight.
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

    const email = readUserEmail(request);
    if (!email) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers });
    }

    try {
        const body = await request.json();
        const calendarId = typeof body.calendarId === 'string' ? body.calendarId.trim() : '';

        if (!calendarId) {
            return new Response(JSON.stringify({ error: 'Calendar ID is required' }), { status: 400, headers });
        }

        const calendarStore = getStore({
            name: "calendars",
            siteID: context.site.id,
            token: context.token
        });

        const calendar = await calendarStore.get(calendarId, { type: 'json', consistency: 'strong' });
        if (!calendar) {
            return new Response(JSON.stringify({ error: 'Calendar not found', reason: 'not_found' }), { status: 404, headers });
        }

        // Owned calendars are already on the dashboard under their own heading.
        if (normalizeEmail(calendar.ownerEmail || '') === normalizeEmail(email)) {
            return new Response(JSON.stringify({ joined: false, reason: 'owner', calendarId }), { status: 200, headers });
        }

        if (calendar.requireEmailVerification) {
            const matches = findParticipantKeysByEmail(calendar.unavailability || {}, email);
            if (matches.length === 0) {
                return new Response(JSON.stringify({
                    joined: false,
                    reason: 'verification_required',
                    calendarId
                }), { status: 403, headers });
            }
        }

        const stored = await recordMembership(context, email, calendarId);
        if (!stored) {
            return new Response(JSON.stringify({ error: 'Could not save the calendar' }), { status: 500, headers });
        }

        return new Response(JSON.stringify({ joined: true, calendarId, name: calendar.name }), { status: 200, headers });
    } catch (error) {
        console.error('Error joining calendar:', error);
        return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers });
    }
};

import { getStore } from "@netlify/blobs";
import { readUserEmail, normalizeEmail, findParticipantKeysByEmail } from "./utils/participant-utils.mjs";
import { readMemberships } from "./utils/memberships.mjs";

// Calendars the signed-in user takes part in but does not own. Membership is
// established by the email recorded on their submission, so a calendar only
// appears here once the person has actually responded while signed in.
export default async (request, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Content-Type': 'application/json'
    };

    if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers });
    }

    if (request.method !== 'GET') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers });
    }

    const email = readUserEmail(request);
    if (!email) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers });
    }

    try {
        const calendarStore = getStore({
            name: "calendars",
            siteID: context.site.id,
            token: context.token
        });

        const memberships = await readMemberships(context, email);
        const normalized = normalizeEmail(email);
        const calendars = [];

        for (const ref of memberships) {
            try {
                const cal = await calendarStore.get(ref.id, { type: 'json', consistency: 'strong' });
                if (!cal) continue;

                // Owned calendars are already listed by get-calendars.
                if (normalizeEmail(cal.ownerEmail || '') === normalized) continue;

                const { unavailability, participantSubmissions, ...calendarInfo } = cal;
                const myKeys = findParticipantKeysByEmail(unavailability || {}, email);

                calendarInfo.submittedParticipantsCount = unavailability ? Object.keys(unavailability).length : 0;
                calendarInfo.myParticipantName = myKeys[0] || null;
                calendarInfo.joinedAt = ref.joinedAt || null;

                calendars.push(calendarInfo);
            } catch (e) {
                // A calendar that has since been deleted just drops out of the list.
            }
        }

        return new Response(JSON.stringify({ calendars }), { status: 200, headers });
    } catch (error) {
        console.error('Error getting shared calendars:', error);
        return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers });
    }
};

import { getStore } from "@netlify/blobs";
import {
    AVAILABILITY_PROFILE_STORE,
    emptyProfile,
    normalizeProfile,
    readUserId
} from "./utils/availability-profile.mjs";

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

    const userId = readUserId(request);
    if (!userId) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers });
    }

    try {
        const store = getStore({
            name: AVAILABILITY_PROFILE_STORE,
            siteID: context.site.id,
            token: context.token
        });

        const raw = await store.get(userId, { type: 'json', consistency: 'strong' });
        return new Response(JSON.stringify({
            profile: raw ? normalizeProfile(raw) : emptyProfile()
        }), { status: 200, headers });
    } catch (error) {
        console.error('Error reading availability profile:', error);
        return new Response(JSON.stringify({ profile: emptyProfile() }), { status: 200, headers });
    }
};

import { connectLambda, getStore } from "@netlify/blobs";

// GDPR "right to erasure": removes every calendar the user owns and then the
// Identity account itself.
//
// This is the one function written with the legacy (Lambda) signature on
// purpose: deleting a GoTrue user needs the Identity admin token, and that is
// only handed to functions through `context.clientContext.identity`. The same
// clientContext also gives us a *verified* user, so unlike the other endpoints
// this one never trusts a client-decoded JWT.
export const handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 204, headers, body: '' };
    }

    if (event.httpMethod !== 'DELETE') {
        return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
    }

    const { identity, user } = context.clientContext || {};

    if (!user?.sub) {
        return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    if (!identity?.url || !identity?.token) {
        console.error('Identity admin context unavailable; cannot delete account');
        return { statusCode: 500, headers, body: JSON.stringify({ error: 'Account deletion is unavailable' }) };
    }

    const userId = user.sub;

    try {
        connectLambda(event);

        const calendarStore = getStore({ name: 'calendars', consistency: 'strong' });
        const userStore = getStore({ name: 'user-calendars', consistency: 'strong' });

        let ownedRefs = [];
        try {
            const existing = await userStore.get(userId, { type: 'json', consistency: 'strong' });
            if (Array.isArray(existing)) ownedRefs = existing;
        } catch (e) {
            // No index yet: nothing to clean up.
        }

        // Only delete calendars this account actually owns, in case a stale index
        // entry points at a calendar that was transferred or recreated.
        for (const ref of ownedRefs) {
            if (!ref?.id) continue;
            try {
                const calendar = await calendarStore.get(ref.id, { type: 'json', consistency: 'strong' });
                if (calendar && calendar.ownerId === userId) {
                    await calendarStore.delete(ref.id);
                }
            } catch (e) {
                console.error(`Failed to delete calendar ${ref.id} during account deletion`, e);
            }
        }

        try {
            await userStore.delete(userId);
        } catch (e) {
            console.error('Failed to delete user calendar index during account deletion', e);
        }

        // Data is gone before the account is, so a failure here can never leave
        // orphaned calendars behind with no owner able to remove them.
        const response = await fetch(`${identity.url}/admin/users/${userId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${identity.token}` }
        });

        if (!response.ok) {
            console.error('Identity user deletion failed', response.status, await response.text());
            return {
                statusCode: 502,
                headers,
                body: JSON.stringify({ error: 'Your data was removed but the account could not be deleted. Please contact support.' })
            };
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ success: true, deletedCalendars: ownedRefs.length })
        };
    } catch (error) {
        console.error('Error deleting account:', error);
        return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal server error' }) };
    }
};

// Production origin used for canonical/og URLs. Deploy previews and localhost must
// still point at this domain, so it is a constant rather than window.location.origin.
export const SITE_URL = 'https://reverse-date-picker.netlify.app';

// Mirrors netlify/functions/utils/limits.mjs; keep both in sync.
export const MAX_CALENDARS_PER_USER = 5;
export const MAX_PARTICIPANTS = 40;

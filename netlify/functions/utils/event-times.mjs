// Optional meeting time on a calendar. Stored as "HH:MM" 24-hour strings so it
// sorts and compares as text, and kept deliberately loose — organisers are told
// an approximate window is fine, because its only job is to decide whether a
// participant's existing appointments actually clash.

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

function isTimeString(value) {
    return typeof value === 'string' && TIME_PATTERN.test(value);
}

/**
 * Normalises a submitted time window.
 *
 * Returns `{ startTime, endTime }` with both set, or both null when the window
 * is absent or unusable. A window is only kept when both ends are present and
 * the end is strictly after the start, so a zero-length or inverted window can
 * never reach the import matcher.
 */
export function normalizeEventTimes(startTime, endTime) {
    const empty = { startTime: null, endTime: null };

    if (startTime === null || startTime === undefined || startTime === '') return empty;
    if (endTime === null || endTime === undefined || endTime === '') return empty;
    if (!isTimeString(startTime) || !isTimeString(endTime)) return empty;
    if (endTime <= startTime) return empty;

    return { startTime, endTime };
}

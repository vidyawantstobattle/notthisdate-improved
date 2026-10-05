// Shared quota limits, kept in one place so every function enforces the same numbers.
export const MAX_CALENDARS_PER_USER = 5;
export const MAX_PARTICIPANTS = 40;

// How far ahead a calendar's end date may be scheduled, counted from today.
export const MAX_CALENDAR_HORIZON_DAYS = 365;

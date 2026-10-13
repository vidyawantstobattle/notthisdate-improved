// ===== SHARED DOMAIN TYPES =====
// These describe the data contract between the frontend and whatever backend
// implements it (currently Netlify Functions). Keep this file backend-agnostic:
// if the backend changes, this is the contract a new implementation must satisfy.

export type ParticipantsType = 'defined' | 'open';
export type DateRangeType = 'custom' | 'open';

export interface Calendar {
  id: string;
  name: string;
  description: string;
  dateRangeType: DateRangeType;
  startDate: string;
  endDate: string;
  // Optional approximate meeting window, "HH:MM" 24-hour. Both set or both null.
  // Lets the .ics import ignore appointments that don't actually clash.
  startTime?: string | null;
  endTime?: string | null;
  participantsType: ParticipantsType;
  participants: string[];
  blockedDates?: string[];
  // Optional note per blocked date, keyed by the date string. Dates without a note are absent.
  blockedDateReasons?: Record<string, string>;
  requireEmailVerification: boolean;
  ownerId: string;
  ownerEmail: string;
  createdAt: string;
  submittedParticipantsCount?: number;
  // Only set on calendars returned as "shared with you": the name this user answered under.
  myParticipantName?: string | null;
  // Set by the owner to lock in a meeting date; clearing it reopens the calendar.
  finalizedDate?: string | null;
  finalizedEndDate?: string | null;
}

export interface CreateCalendarInput {
  name: string;
  description?: string;
  dateRangeType: DateRangeType;
  startDate: string;
  endDate: string;
  startTime?: string | null;
  endTime?: string | null;
  participantsType: ParticipantsType;
  participants?: string[];
  requireEmailVerification?: boolean;
  blockedDates?: string[];
  blockedDateReasons?: Record<string, string>;
}

export interface Submission {
  participantName: string;
  dates: string[];
  timestamp: string | null;
}

// Per-user sync preferences: calendars where the cross-calendar date suggestion
// has been turned down.
export interface AvailabilityProfile {
  dismissedCalendars: string[];
  updatedAt: string | null;
}

export interface DateRange {
  start: string;
  end: string;
}

// Date string -> list of participant names unavailable on that date.
export type UnavailabilityByDate = Record<string, string[]>;

export interface ApiError {
  error: string;
  code?: string;
  [key: string]: unknown;
}

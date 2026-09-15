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
  participantsType: ParticipantsType;
  participants: string[];
  blockedDates?: string[];
  requireEmailVerification: boolean;
  ownerId: string;
  ownerEmail: string;
  createdAt: string;
  submittedParticipantsCount?: number;
}

export interface CreateCalendarInput {
  name: string;
  description?: string;
  dateRangeType: DateRangeType;
  startDate: string;
  endDate: string;
  participantsType: ParticipantsType;
  participants?: string[];
  requireEmailVerification?: boolean;
  blockedDates?: string[];
}

export interface Submission {
  participantName: string;
  dates: string[];
  timestamp: string | null;
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

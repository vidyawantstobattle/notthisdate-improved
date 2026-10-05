// ===== UNAVAILABILITY API =====
// Typed methods for submitting/reading/resetting a participant's unavailable dates.

import { apiClient } from './client';
import type { UnavailabilityByDate } from '../types';

export const unavailabilityApi = {
  submit(
    calendarId: string,
    participantName: string,
    unavailableDates: string[],
    removedDates: string[] = []
  ): Promise<{ success: boolean; participant: string; unavailableDates: string[]; error?: string }> {
    return apiClient.post(`/submit-unavailability?calendarId=${encodeURIComponent(calendarId)}`, {
      participantName,
      unavailableDates,
      removedDates
    });
  },

  reset(calendarId: string, participantName: string): Promise<{ success: boolean; error?: string }> {
    return apiClient.post(
      `/reset-unavailability?calendarId=${encodeURIComponent(calendarId)}&participant=${encodeURIComponent(participantName)}`,
      {}
    );
  },

  // Raw per-date map: { "2026-06-15": ["Alice", "Bob"], ... }
  getForCalendar(calendarId: string): Promise<{ unavailability: Record<string, unknown> }> {
    return apiClient.get(`/get-unavailability?calendarId=${encodeURIComponent(calendarId)}`);
  },

  getUserSubmissions(calendarId: string, participant?: string): Promise<{ submissions: unknown }> {
    const query = participant
      ? `?calendarId=${encodeURIComponent(calendarId)}&participant=${encodeURIComponent(participant)}`
      : `?calendarId=${encodeURIComponent(calendarId)}`;
    return apiClient.get(`/get-user-submissions${query}`);
  },

  // Matches on the email in the caller's token, so a user is recognised even if
  // they used a different display name on that calendar.
  getOwnSubmissionsByEmail(calendarId: string, token?: string | null): Promise<{ submissions: unknown }> {
    return apiClient.get(
      `/get-user-submissions?calendarId=${encodeURIComponent(calendarId)}&matchBy=email`,
      token
    );
  }
};

export type { UnavailabilityByDate };

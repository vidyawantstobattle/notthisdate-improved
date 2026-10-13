// ===== CALENDARS API =====
// Typed methods for calendar CRUD + participant management. Component code
// should only ever import from here, never call apiClient/fetch directly.

import { apiClient } from './client';
import type { Calendar, CreateCalendarInput, ParticipantsType } from '../types';

export const calendarsApi = {
  list(token?: string | null): Promise<{ calendars: Calendar[] }> {
    return apiClient.get('/get-calendars', token);
  },

  // Calendars the user takes part in but doesn't own.
  listShared(token?: string | null): Promise<{ calendars: Calendar[] }> {
    return apiClient.get('/get-shared-calendars', token);
  },

  // Adds a calendar to the user's "invited to" list. `joined: false` with a
  // reason means it was understood but deliberately not added.
  join(
    calendarId: string,
    token?: string | null
  ): Promise<{ joined: boolean; reason?: string; calendarId: string; name?: string }> {
    return apiClient.post('/join-calendar', { calendarId }, token);
  },

  get(calendarId: string): Promise<Calendar> {
    return apiClient.get(`/get-calendar?id=${encodeURIComponent(calendarId)}`);
  },

  create(input: CreateCalendarInput, token?: string | null): Promise<{ success: boolean; calendar: Calendar }> {
    return apiClient.post('/create-calendar', input, token);
  },

  remove(calendarId: string, token?: string | null): Promise<{ success: boolean }> {
    return apiClient.delete(`/delete-calendar?id=${encodeURIComponent(calendarId)}`, token);
  },

  // Passing participantsType: 'open' converts a named calendar to link-based; it is one-way.
  updateParticipants(
    calendarId: string,
    input: { participants?: string[]; participantsType?: ParticipantsType },
    token?: string | null
  ): Promise<{ success: boolean; participants: string[]; participantsType: ParticipantsType }> {
    return apiClient.post(`/update-participants?id=${encodeURIComponent(calendarId)}`, input, token);
  },

  update(
    calendarId: string,
    input: {
      name: string;
      description?: string;
      endDate?: string;
      startTime?: string | null;
      endTime?: string | null;
      blockedDates?: string[];
      blockedDateReasons?: Record<string, string>;
    },
    token?: string | null
  ): Promise<{ success: boolean; calendar: Calendar }> {
    return apiClient.post(`/update-calendar?id=${encodeURIComponent(calendarId)}`, input, token);
  },

  // Pass finalizedDate: null to reopen the calendar.
  setFinalizedDate(
    calendarId: string,
    input: { finalizedDate: string | null; finalizedEndDate?: string | null },
    token?: string | null
  ): Promise<{ success: boolean; calendar: Calendar }> {
    return apiClient.post(`/set-finalized-date?id=${encodeURIComponent(calendarId)}`, input, token);
  }
};

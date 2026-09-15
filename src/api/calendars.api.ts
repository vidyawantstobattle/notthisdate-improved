// ===== CALENDARS API =====
// Typed methods for calendar CRUD + participant management. Component code
// should only ever import from here, never call apiClient/fetch directly.

import { apiClient } from './client';
import type { Calendar, CreateCalendarInput } from '../types';

export const calendarsApi = {
  list(token?: string | null): Promise<{ calendars: Calendar[] }> {
    return apiClient.get('/get-calendars', token);
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

  updateParticipants(
    calendarId: string,
    participants: string[],
    token?: string | null
  ): Promise<{ success: boolean; participants: string[] }> {
    return apiClient.post(`/update-participants?id=${encodeURIComponent(calendarId)}`, { participants }, token);
  }
};

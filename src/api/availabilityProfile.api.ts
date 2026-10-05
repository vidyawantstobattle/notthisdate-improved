// ===== AVAILABILITY PROFILE API =====
// Tracks which calendars a signed-in user has dismissed the cross-calendar date
// suggestion on.

import { apiClient } from './client';
import type { AvailabilityProfile } from '../types';

export const availabilityProfileApi = {
  get(token?: string | null): Promise<{ profile: AvailabilityProfile }> {
    return apiClient.get('/get-availability-profile', token);
  },

  save(
    input: { dismissCalendarId?: string; undismissCalendarId?: string },
    token?: string | null
  ): Promise<{ success: boolean; profile: AvailabilityProfile }> {
    return apiClient.post('/save-availability-profile', input, token);
  }
};

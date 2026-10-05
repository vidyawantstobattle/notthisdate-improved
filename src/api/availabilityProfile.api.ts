// ===== AVAILABILITY PROFILE API =====
// A signed-in user's reusable "usually not available" dates, offered as an
// optional starting point on every calendar they join.

import { apiClient } from './client';
import type { AvailabilityProfile } from '../types';

export const availabilityProfileApi = {
  get(token?: string | null): Promise<{ profile: AvailabilityProfile }> {
    return apiClient.get('/get-availability-profile', token);
  },

  save(
    input: { dates?: string[]; dismissCalendarId?: string; undismissCalendarId?: string },
    token?: string | null
  ): Promise<{ success: boolean; profile: AvailabilityProfile }> {
    return apiClient.post('/save-availability-profile', input, token);
  }
};

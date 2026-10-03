// ===== ACCOUNT API =====
// Typed methods for operations on the signed-in account itself.

import { apiClient } from './client';

export const accountApi = {
  // GDPR right to erasure: deletes the user's calendars and the account.
  // Irreversible; the caller is responsible for confirming intent.
  remove(token?: string | null): Promise<{ success: boolean; deletedCalendars: number }> {
    return apiClient.delete('/delete-account', token);
  }
};

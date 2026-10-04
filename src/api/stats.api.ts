import { apiClient } from './client';

interface AppStats {
  users: number;
  calendars: number;
  timestamp: string;
}

export const statsApi = {
  async getStats(token?: string | null): Promise<AppStats> {
    return apiClient.get<AppStats>('/get-stats', token);
  }
};

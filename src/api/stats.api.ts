import { apiClient } from './client';

interface AppStats {
  users: number;
  calendars: number;
  timestamp: string;
}

export const statsApi = {
  async getStats(token?: string | null): Promise<AppStats> {
    console.log('Fetching stats from API...');
    try {
      const stats = await apiClient.get<AppStats>('/get-stats', token);
      console.log('Stats received:', stats);
      return stats;
    } catch (error) {
      console.error('Stats API error:', error);
      throw error;
    }
  }
};

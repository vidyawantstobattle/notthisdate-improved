import { useState, useEffect } from 'react';
import { calendarsApi } from '../api/calendars.api';
import type { Calendar } from '../types';

export function useCalendar(calendarId: string | undefined) {
  const [calendar, setCalendar] = useState<Calendar | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!calendarId) {
      setLoading(false);
      return;
    }

    async function fetchCalendar() {
      try {
        setLoading(true);
        setError(null);
        const data = await calendarsApi.get(calendarId as string);
        setCalendar(data);
      } catch (err) {
        console.error('Error loading calendar:', err);
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }

    fetchCalendar();
  }, [calendarId]);

  return { calendar, loading, error };
}

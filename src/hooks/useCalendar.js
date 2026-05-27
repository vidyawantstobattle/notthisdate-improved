import { useState, useEffect } from 'react';

export function useCalendar(calendarId) {
  const [calendar, setCalendar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!calendarId) {
      setLoading(false);
      return;
    }

    async function fetchCalendar() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/.netlify/functions/get-calendar?id=${calendarId}`);

        if (!response.ok) {
          throw new Error(`Calendar not found (Status: ${response.status})`);
        }

        const data = await response.json();
        setCalendar(data);
      } catch (err) {
        console.error('Error loading calendar:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchCalendar();
  }, [calendarId]);

  return { calendar, loading, error };
}


// Remembers which name a visitor used on a given calendar so returning users
// (including anonymous link-access ones) don't accidentally submit twice.

const STORAGE_PREFIX = 'ntd.participant.';

const keyFor = (calendarId: string) => `${STORAGE_PREFIX}${calendarId}`;

export function getRememberedParticipant(calendarId?: string): string {
  if (!calendarId) return '';
  try {
    return localStorage.getItem(keyFor(calendarId))?.trim() || '';
  } catch {
    return '';
  }
}

export function rememberParticipant(calendarId: string, name: string): void {
  if (!calendarId || !name.trim()) return;
  try {
    localStorage.setItem(keyFor(calendarId), name.trim());
  } catch {
    // Storage unavailable (private mode / blocked cookies) - remembering is optional.
  }
}

export function forgetParticipant(calendarId?: string): void {
  if (!calendarId) return;
  try {
    localStorage.removeItem(keyFor(calendarId));
  } catch {
    // Ignore - nothing to clean up if storage is unavailable.
  }
}

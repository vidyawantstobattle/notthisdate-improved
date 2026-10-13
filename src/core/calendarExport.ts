// ===== CALENDAR EXPORT =====
// Builds the payloads that drop a locked-in date into someone's own calendar.
// Deliberately link/file based rather than OAuth: it needs no API keys and works
// for anonymous participants, who are the majority of people on a shared link.
//
// All-day events use an EXCLUSIVE end date everywhere (RFC 5545 DTEND, Google's
// `dates`, Outlook's `enddt`), so a single-day event ends the following day.

export interface CalendarEvent {
  title: string;
  // Plain text only: callers must strip markup before passing a description.
  description?: string;
  url?: string;
  startDate: string;
  // Inclusive last day. Omit for a single-day event.
  endDate?: string | null;
}

function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr + 'T12:00:00');
  date.setDate(date.getDate() + days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function compact(dateStr: string): string {
  return dateStr.replace(/-/g, '');
}

// The day after the last day the event covers.
function exclusiveEnd(event: CalendarEvent): string {
  const lastDay = event.endDate && event.endDate >= event.startDate ? event.endDate : event.startDate;
  return addDays(lastDay, 1);
}

// Escapes the characters that would otherwise end the value or inject a new
// property line. Backslash must be handled first or it double-escapes.
function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r\n|\r|\n/g, '\\n');
}

// RFC 5545 caps content lines at 75 octets, continued by a leading space.
function foldLine(line: string): string {
  if (line.length <= 75) return line;

  const chunks: string[] = [line.slice(0, 75)];
  let rest = line.slice(75);
  while (rest.length > 74) {
    chunks.push(' ' + rest.slice(0, 74));
    rest = rest.slice(74);
  }
  if (rest) chunks.push(' ' + rest);
  return chunks.join('\r\n');
}

function icsTimestamp(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

export function buildIcs(event: CalendarEvent, uidSeed: string, now: Date = new Date()): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//NotThisDate//Calendar Export//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${escapeIcsText(uidSeed)}-${compact(event.startDate)}@notthisdate`,
    `DTSTAMP:${icsTimestamp(now)}`,
    `DTSTART;VALUE=DATE:${compact(event.startDate)}`,
    `DTEND;VALUE=DATE:${compact(exclusiveEnd(event))}`,
    `SUMMARY:${escapeIcsText(event.title)}`
  ];

  if (event.description) lines.push(`DESCRIPTION:${escapeIcsText(event.description)}`);
  if (event.url) lines.push(`URL:${escapeIcsText(event.url)}`);

  lines.push('TRANSP:TRANSPARENT', 'END:VEVENT', 'END:VCALENDAR');

  return lines.map(foldLine).join('\r\n');
}

export function buildGoogleCalendarUrl(event: CalendarEvent): string {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${compact(event.startDate)}/${compact(exclusiveEnd(event))}`
  });

  const details = [event.description, event.url].filter(Boolean).join('\n\n');
  if (details) params.set('details', details);

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function buildOutlookCalendarUrl(event: CalendarEvent): string {
  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    allday: 'true',
    subject: event.title,
    startdt: event.startDate,
    enddt: exclusiveEnd(event)
  });

  const body = [event.description, event.url].filter(Boolean).join('\n\n');
  if (body) params.set('body', body);

  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}

export function buildIcsFileName(title: string): string {
  const slug = title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return `${slug || 'event'}.ics`;
}

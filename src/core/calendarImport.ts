// ===== CALENDAR IMPORT =====
// Turns an .ics export from Google / Outlook / Apple Calendar into the set of
// days a participant is already busy, so they can mark them unavailable without
// cross-checking two calendars by hand.
//
// File based rather than OAuth on purpose: it needs no API keys, no consent
// screen and no server round-trip, and it works for anonymous participants —
// who are most of the people opening a shared link. The file is parsed in the
// browser and never uploaded anywhere.
//
// When the organiser has set a meeting window, a timed appointment only counts
// as a clash if it actually overlaps that window, so a 9am dentist visit leaves
// someone free for an evening meetup. All-day events always clash, because
// there is no way to tell which part of the day they consume.

export interface ImportedBusyDay {
  date: string;
  titles: string[];
}

export interface IcsImportResult {
  busyDays: ImportedBusyDay[];
  eventsParsed: number;
}

// "HH:MM" bounds. Both ends required; omit entirely for an all-day calendar.
export interface MeetingWindow {
  startTime: string;
  endTime: string;
}

const MINUTES_PER_DAY = 24 * 60;
const MAX_EVENT_SPAN_DAYS = 400;

// RFC 5545 folds long lines with a CRLF followed by a single space or tab.
function unfoldLines(text: string): string[] {
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines: string[] = [];

  for (const raw of normalized.split('\n')) {
    if ((raw.startsWith(' ') || raw.startsWith('\t')) && lines.length > 0) {
      lines[lines.length - 1] += raw.slice(1);
    } else {
      lines.push(raw);
    }
  }

  return lines;
}

function unescapeIcsText(value: string): string {
  return value
    .replace(/\\n/gi, ' ')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\')
    .trim();
}

function toDateStr(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr + 'T12:00:00');
  date.setDate(date.getDate() + days);
  return toDateStr(date);
}

export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

interface IcsMoment {
  date: string;
  // Minutes past local midnight, or null for an all-day (date-only) value.
  minutes: number | null;
}

// DTSTART/DTEND come as either a bare `YYYYMMDD` (all-day) or a timestamp like
// `YYYYMMDDTHHMMSSZ`. UTC timestamps are converted to the viewer's local clock,
// which is when they will actually be busy. Times without a Z are floating and
// already local, so they are taken as written.
function parseIcsMoment(rawValue: string): IcsMoment | null {
  const value = rawValue.trim();

  const allDay = /^(\d{4})(\d{2})(\d{2})$/.exec(value);
  if (allDay) return { date: `${allDay[1]}-${allDay[2]}-${allDay[3]}`, minutes: null };

  const timed = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z)?$/.exec(value);
  if (!timed) return null;

  const [, year, month, day, hour, minute, second, utc] = timed;

  if (utc) {
    const asUtc = new Date(Date.UTC(
      Number(year), Number(month) - 1, Number(day),
      Number(hour), Number(minute), Number(second)
    ));
    return { date: toDateStr(asUtc), minutes: asUtc.getHours() * 60 + asUtc.getMinutes() };
  }

  return {
    date: `${year}-${month}-${day}`,
    minutes: Number(hour) * 60 + Number(minute)
  };
}

// A property line is `NAME;PARAM=VALUE:value`; the first unquoted colon splits
// the name/params from the value.
function splitProperty(line: string): { name: string; value: string } | null {
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') inQuotes = !inQuotes;
    else if (char === ':' && !inQuotes) {
      return {
        name: line.slice(0, i).split(';')[0].trim().toUpperCase(),
        value: line.slice(i + 1)
      };
    }
  }

  return null;
}

// Whether a VEVENT says the person is free. TRANSPARENT events (Google's
// "Free" setting) and cancelled ones don't block a day.
function isBusyEvent(event: Record<string, string>): boolean {
  if ((event.TRANSP || '').toUpperCase() === 'TRANSPARENT') return false;
  const status = (event.STATUS || '').toUpperCase();
  return status !== 'CANCELLED';
}

/**
 * Extracts the days covered by busy events, limited to [rangeStart, rangeEnd].
 *
 * Multi-day events are expanded to every day they touch. All-day events use an
 * exclusive DTEND per RFC 5545, so the final day is dropped; timed events keep
 * their end day because an event ending 09:00 still occupies that morning.
 *
 * With a `window`, timed events only mark a day busy when they overlap it.
 */
export function parseIcsBusyDays(
  icsText: string,
  rangeStart: string,
  rangeEnd: string,
  window?: MeetingWindow | null
): IcsImportResult {
  const titlesByDate = new Map<string, Set<string>>();
  let eventsParsed = 0;
  let current: Record<string, string> | null = null;

  for (const line of unfoldLines(icsText)) {
    const trimmed = line.trim();

    if (trimmed.toUpperCase() === 'BEGIN:VEVENT') {
      current = {};
      continue;
    }

    if (trimmed.toUpperCase() === 'END:VEVENT') {
      if (current) {
        eventsParsed++;
        collectEventDays(current, rangeStart, rangeEnd, window || null, titlesByDate);
      }
      current = null;
      continue;
    }

    if (!current) continue;

    const property = splitProperty(line);
    if (property) current[property.name] = property.value;
  }

  const busyDays = Array.from(titlesByDate.entries())
    .map(([date, titles]) => ({ date, titles: Array.from(titles) }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return { busyDays, eventsParsed };
}

// The slice of a given day a possibly-multi-day event occupies, in minutes.
function occupiedMinutesOnDay(
  day: string,
  firstDay: string,
  lastDay: string,
  startMinutes: number,
  endMinutes: number
): { from: number; to: number } {
  return {
    from: day === firstDay ? startMinutes : 0,
    to: day === lastDay ? endMinutes : MINUTES_PER_DAY
  };
}

function collectEventDays(
  event: Record<string, string>,
  rangeStart: string,
  rangeEnd: string,
  window: MeetingWindow | null,
  titlesByDate: Map<string, Set<string>>
): void {
  if (!isBusyEvent(event)) return;

  const start = event.DTSTART ? parseIcsMoment(event.DTSTART) : null;
  if (!start) return;

  const end = event.DTEND ? parseIcsMoment(event.DTEND) : null;
  const isAllDay = start.minutes === null && (!end || end.minutes === null);

  let lastDay = start.date;
  if (end) {
    // All-day DTEND is exclusive: a one-day event ends the following day.
    lastDay = isAllDay ? addDays(end.date, -1) : end.date;
  }
  if (lastDay < start.date) lastDay = start.date;

  const title = event.SUMMARY ? unescapeIcsText(event.SUMMARY) : '';

  const windowFrom = window ? timeToMinutes(window.startTime) : 0;
  const windowTo = window ? timeToMinutes(window.endTime) : MINUTES_PER_DAY;

  const startMinutes = start.minutes ?? 0;
  const endMinutes = end && end.minutes !== null ? end.minutes : MINUTES_PER_DAY;

  let day = start.date;
  for (let i = 0; i <= MAX_EVENT_SPAN_DAYS && day <= lastDay; i++) {
    if (day >= rangeStart && day <= rangeEnd) {
      // An all-day event could cover any part of the day, so it always clashes.
      let clashes = true;

      if (window && !isAllDay) {
        const { from, to } = occupiedMinutesOnDay(day, start.date, lastDay, startMinutes, endMinutes);
        // Touching end-to-end is not an overlap: an appointment finishing at
        // 12:00 leaves a window starting at 12:00 free.
        clashes = from < windowTo && to > windowFrom;
      }

      if (clashes) {
        const titles = titlesByDate.get(day) || new Set<string>();
        if (title) titles.add(title);
        titlesByDate.set(day, titles);
      }
    }
    day = addDays(day, 1);
  }
}

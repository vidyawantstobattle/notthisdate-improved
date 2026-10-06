// ===== AVAILABILITY COLOR SCALE =====
// Pure calculation: how "unavailable" a date is, mapped to a color.
// Canonical scale (5 discrete stops rather than a continuous gradient):
//   ratio === 0      -> green   (#4ade80) everyone available
//   0 < ratio < 0.3   -> light green (#86efac)
//   0.3 <= ratio < 0.5 -> yellow (#fbbf24)
//   0.5 <= ratio < 0.7 -> orange (#f97316)
//   ratio >= 0.7      -> gray   (#6b7280) most/all unavailable

import { formatDateLocal, parseDateLocal } from './dateRanges';
import type { UnavailabilityByDate } from '../types';

export function getGraynessRatio(unavailableCount: number, totalPeople: number): number {
  if (totalPeople <= 0) return 0;
  return Math.min(unavailableCount / totalPeople, 1);
}

export function getAvailabilityColor(ratio: number): string {
  if (ratio === 0) return '#4ade80'; // Green - everyone available
  if (ratio < 0.3) return '#86efac'; // Light green
  if (ratio < 0.5) return '#fbbf24'; // Yellow
  if (ratio < 0.7) return '#f97316'; // Orange
  return '#6b7280'; // Gray - most unavailable
}

export function getAvailabilityTextColor(ratio: number): string {
  return ratio > 0.5 ? '#ffffff' : '#2c3529';
}

// ===== BEST DATE SEARCH =====

export interface BestDatesResult {
  // Every date tied for the fewest clashes, ascending.
  dates: string[];
  unavailableCount: number;
  availableCount: number;
  totalPeople: number;
}

// Scans the calendar range for the date(s) that clash with the fewest people.
// Blocked dates are excluded: nobody can pick them, so they are not a result.
// Dates that have already passed are excluded too - a day nobody marked
// unavailable is still not something the group can go and do.
// Returns null when there is nothing meaningful to report yet.
export function findBestDates(
  startDate: string,
  endDate: string,
  allUnavailability: UnavailabilityByDate,
  totalPeople: number,
  blockedDates: string[] = [],
  today: Date = new Date()
): BestDatesResult | null {
  const start = parseDateLocal(startDate);
  const end = parseDateLocal(endDate);
  if (!start || !end || start > end) return null;

  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const firstCandidate = start > todayStart ? start : todayStart;
  if (firstCandidate > end) return null;

  const blocked = new Set(blockedDates);
  let best = Infinity;
  let dates: string[] = [];

  for (const cursor = new Date(firstCandidate); cursor <= end; cursor.setDate(cursor.getDate() + 1)) {
    const dateStr = formatDateLocal(cursor);
    if (blocked.has(dateStr)) continue;

    const count = allUnavailability[dateStr]?.length || 0;
    if (count < best) {
      best = count;
      dates = [dateStr];
    } else if (count === best) {
      dates.push(dateStr);
    }
  }

  if (dates.length === 0) return null;

  return {
    dates,
    unavailableCount: best,
    availableCount: Math.max(totalPeople - best, 0),
    totalPeople
  };
}

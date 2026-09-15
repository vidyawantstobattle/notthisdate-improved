// ===== DATE RANGE UTILITIES =====
// Pure functions, no React/DOM dependency beyond the Date/Intl built-ins.
// Safe to reuse in any frontend, or even a Node script, unchanged.

import type { DateRange } from '../types';

export function formatDateLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseDateLocal(dateValue: string | null | undefined): Date | null {
  if (!dateValue) return null;

  const raw = String(dateValue);
  const date = raw.includes('T') ? new Date(raw) : new Date(`${raw}T12:00:00`);

  if (Number.isNaN(date.getTime())) return null;

  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function formatDateDisplay(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00');
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function formatDisplayDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  const date = new Date(dateStr + 'T12:00:00');
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Collapses a flat list of dates into contiguous [start, end] ranges,
// e.g. ['2026-06-01','2026-06-02','2026-06-05'] -> [{start:06-01,end:06-02},{start:06-05,end:06-05}]
export function groupIntoRanges(dates: string[]): DateRange[] {
  if (dates.length === 0) return [];

  const sorted = [...dates].sort();
  const ranges: DateRange[] = [];
  let rangeStart = sorted[0];
  let rangeEnd = sorted[0];

  for (let i = 1; i < sorted.length; i++) {
    const prevDate = new Date(sorted[i - 1] + 'T12:00:00');
    const currDate = new Date(sorted[i] + 'T12:00:00');
    const diffDays = (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);

    if (diffDays === 1) {
      rangeEnd = sorted[i];
    } else {
      ranges.push({ start: rangeStart, end: rangeEnd });
      rangeStart = sorted[i];
      rangeEnd = sorted[i];
    }
  }

  ranges.push({ start: rangeStart, end: rangeEnd });
  return ranges;
}

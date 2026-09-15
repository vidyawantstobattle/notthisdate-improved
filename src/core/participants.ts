// ===== PARTICIPANT UTILITIES =====
// Pure functions for case-insensitive participant name handling. Mirrors the
// logic in netlify/functions/utils/participant-utils.mjs so the frontend and
// backend agree on participant identity rules without importing across the
// frontend/backend boundary.

import type { Submission } from '../types';

export function normalizeParticipantName(name = ''): string {
  return name.trim().toLowerCase();
}

export function findMatchingSubmissions(submissions: Submission[], participantName: string): Submission[] {
  const query = normalizeParticipantName(participantName);
  if (!query) return [];
  return submissions.filter(sub => normalizeParticipantName(sub.participantName) === query);
}

// Merges multiple submission records (e.g. from case-variant duplicates) into one.
export function mergeSubmissionsByParticipant(entries: Submission[], fallbackName = ''): Submission {
  const mergedDates: string[] = [];
  let latestTimestamp: string | null = null;

  entries.forEach(entry => {
    (entry.dates || []).forEach(date => {
      if (!mergedDates.includes(date)) {
        mergedDates.push(date);
      }
    });

    if (entry.timestamp) {
      if (!latestTimestamp || new Date(entry.timestamp) > new Date(latestTimestamp)) {
        latestTimestamp = entry.timestamp;
      }
    }
  });

  return {
    participantName: entries[0]?.participantName || fallbackName,
    dates: mergedDates.sort(),
    timestamp: latestTimestamp
  };
}

// Normalizes the various shapes the backend has returned for submissions over time
// (plain array, single object, or a map of name -> submission) into Submission[].
export function normalizeSubmissions(submissions: unknown, participantName = ''): Submission[] {
  if (!submissions) return [];

  const normalizeOne = (entry: any, fallbackName = ''): Submission | null => {
    if (!entry || typeof entry !== 'object') return null;

    const dates = Array.isArray(entry.dates) ? entry.dates : (Array.isArray(entry) ? entry : []);

    return {
      participantName: entry.participantName || fallbackName || participantName || '',
      dates,
      timestamp: entry.timestamp || entry.submittedAt || null
    };
  };

  if (Array.isArray(submissions)) {
    return submissions.map(item => normalizeOne(item)).filter((s): s is Submission => s !== null);
  }

  if (typeof submissions === 'object' && Array.isArray((submissions as any).dates)) {
    const single = normalizeOne(submissions, participantName);
    return single ? [single] : [];
  }

  if (typeof submissions === 'object') {
    return Object.entries(submissions as Record<string, unknown>)
      .map(([name, value]) => normalizeOne(value, name))
      .filter((s): s is Submission => s !== null);
  }

  return [];
}

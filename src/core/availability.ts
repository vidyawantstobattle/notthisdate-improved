// ===== AVAILABILITY COLOR SCALE =====
// Pure calculation: how "unavailable" a date is, mapped to a color.
// Canonical scale (5 discrete stops rather than a continuous gradient):
//   ratio === 0      -> green   (#4ade80) everyone available
//   0 < ratio < 0.3   -> light green (#86efac)
//   0.3 <= ratio < 0.5 -> yellow (#fbbf24)
//   0.5 <= ratio < 0.7 -> orange (#f97316)
//   ratio >= 0.7      -> gray   (#6b7280) most/all unavailable

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

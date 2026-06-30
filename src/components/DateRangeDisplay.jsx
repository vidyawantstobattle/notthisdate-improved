import React from 'react';

function DateRangeDisplay({ dates, onRemoveRange }) {
  if (!dates || dates.length === 0) {
    return <p className="empty-message">No dates selected yet</p>;
  }

  const ranges = groupIntoRanges(dates);

  return (
    <div className="selected-dates-list">
      {ranges.map((range, index) => {
        const displayText = range.start === range.end
          ? formatDateDisplay(range.start)
          : `${formatDateDisplay(range.start)} - ${formatDateDisplay(range.end)}`;

        return (
          <span key={index} className="date-tag">
            {displayText}
            {onRemoveRange && (
              <button
                type="button"
                className="remove-btn"
                onClick={() => onRemoveRange(range)}
                title="Remove this date range"
                aria-label={`Remove ${displayText}`}
              >
                &times;
              </button>
            )}
          </span>
        );
      })}
    </div>
  );
}

// Helper: Group consecutive dates into ranges
function groupIntoRanges(dates) {
  if (dates.length === 0) return [];

  const sorted = [...dates].sort();
  const ranges = [];
  let rangeStart = sorted[0];
  let rangeEnd = sorted[0];

  for (let i = 1; i < sorted.length; i++) {
    const prevDate = new Date(sorted[i - 1] + 'T12:00:00');
    const currDate = new Date(sorted[i] + 'T12:00:00');
    const diffDays = (currDate - prevDate) / (1000 * 60 * 60 * 24);

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

// Helper: Format date for display
function formatDateDisplay(dateStr) {
  const date = new Date(dateStr + 'T12:00:00');
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default DateRangeDisplay;


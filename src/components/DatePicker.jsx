import React, { useEffect, useRef, useCallback } from 'react';
import flatpickr from 'flatpickr';
import 'flatpickr/dist/flatpickr.min.css';

function DatePicker({
  startDate,
  endDate,
  selectedDates = [],
  submittedDates = [],
  onDateRangeSelect
}) {
  const pickerRef = useRef(null);
  const instanceRef = useRef(null);

  // Memoize the date arrays to prevent unnecessary re-renders
  const selectedDatesRef = useRef(selectedDates);
  const submittedDatesRef = useRef(submittedDates);

  useEffect(() => {
    selectedDatesRef.current = selectedDates;
    submittedDatesRef.current = submittedDates;
  }, [selectedDates, submittedDates]);

  useEffect(() => {
    if (!pickerRef.current || !startDate || !endDate) return;

    // Parse dates properly
    const start = new Date(startDate + 'T12:00:00');
    const end = new Date(endDate + 'T12:00:00');
    const isMobile = window.innerWidth <= 600;

    // Destroy existing instance
    if (instanceRef.current) {
      instanceRef.current.destroy();
    }

    instanceRef.current = flatpickr(pickerRef.current, {
      mode: 'range',
      minDate: start,
      maxDate: end,
      dateFormat: 'Y-m-d',
      inline: true,
      showMonths: isMobile ? 1 : 2,
      locale: {
        firstDayOfWeek: 0 // Sunday
      },
      onChange: (selectedDateRange) => {
        if (selectedDateRange.length === 2) {
          // Complete range selected
          const rangeStart = selectedDateRange[0];
          const rangeEnd = selectedDateRange[1];

          if (onDateRangeSelect) {
            onDateRangeSelect(rangeStart, rangeEnd);
          }

          // Clear the picker for next selection
          setTimeout(() => {
            if (instanceRef.current) {
              instanceRef.current.clear();
            }
          }, 100);
        } else if (selectedDateRange.length === 1) {
          // Single date - treat as a single day range on second click or timeout
          // We'll wait briefly to see if user selects an end date
        }
      },
      onDayCreate: (dObj, dStr, fp, dayElem) => {
        const dateStr = formatDateLocal(dayElem.dateObj);
        const isSubmitted = submittedDatesRef.current.includes(dateStr);
        const isPending = selectedDatesRef.current.includes(dateStr);

        // Clear any existing custom classes
        dayElem.classList.remove('user-submitted', 'user-pending', 'range-start', 'range-middle', 'range-end', 'range-single');

        if (isSubmitted) {
          dayElem.classList.add('user-submitted');
          const rangePosition = getRangePosition(dateStr, submittedDatesRef.current);
          if (rangePosition) {
            dayElem.classList.add(rangePosition);
          }
        } else if (isPending) {
          dayElem.classList.add('user-pending');
          const rangePosition = getRangePosition(dateStr, selectedDatesRef.current);
          if (rangePosition) {
            dayElem.classList.add(rangePosition);
          }
        }
      }
    });

    return () => {
      if (instanceRef.current) {
        instanceRef.current.destroy();
        instanceRef.current = null;
      }
    };
  }, [startDate, endDate, onDateRangeSelect]);

  // Redraw when dates change to update highlighting
  useEffect(() => {
    if (instanceRef.current) {
      instanceRef.current.redraw();
    }
  }, [selectedDates, submittedDates]);

  return (
    <div className="date-picker-wrapper">
      <div ref={pickerRef} className="date-picker-container"></div>
      <div className="date-picker-legend">
        <span className="legend-item">
          <span className="legend-color pending"></span>
          <span>Pending selection</span>
        </span>
        <span className="legend-item">
          <span className="legend-color submitted"></span>
          <span>Already submitted</span>
        </span>
      </div>
    </div>
  );
}

// Helper functions
function formatDateLocal(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getRangePosition(dateStr, dateList) {
  if (!dateList || dateList.length === 0) return null;

  const prevDate = getAdjacentDateStr(dateStr, -1);
  const nextDate = getAdjacentDateStr(dateStr, 1);

  const hasPrev = dateList.includes(prevDate);
  const hasNext = dateList.includes(nextDate);

  if (!hasPrev && !hasNext) {
    return 'range-single';
  } else if (!hasPrev && hasNext) {
    return 'range-start';
  } else if (hasPrev && hasNext) {
    return 'range-middle';
  } else if (hasPrev && !hasNext) {
    return 'range-end';
  }
  return null;
}

function getAdjacentDateStr(dateStr, offsetDays) {
  const date = new Date(dateStr + 'T12:00:00');
  date.setDate(date.getDate() + offsetDays);
  return formatDateLocal(date);
}

export default DatePicker;

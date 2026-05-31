import React, { useEffect, useRef } from 'react';
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
  const hintRef = useRef(null);

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

    // Track selection state (NOT React state - direct DOM manipulation)
    let firstSelectedDate = null;
    let firstSelectedElement = null;

    // Helper to update hint text without React re-render
    const updateHint = (state) => {
      if (hintRef.current) {
        if (state === 'first') {
          hintRef.current.textContent = '👆 Now tap the end date to complete your selection';
          hintRef.current.classList.add('active');
        } else {
          hintRef.current.textContent = 'Tap a date to start, then tap another to select a range';
          hintRef.current.classList.remove('active');
        }
      }
    };

    instanceRef.current = flatpickr(pickerRef.current, {
      mode: 'multiple',
      minDate: start,
      maxDate: end,
      dateFormat: 'Y-m-d',
      inline: true,
      showMonths: isMobile ? 1 : 2,
      static: true,
      disableMobile: false,
      locale: {
        firstDayOfWeek: 0
      },
      onValueUpdate: () => {
        // Prevent default behavior
      },
      onChange: (selectedDateRange, dateStr, instance) => {
        if (selectedDateRange.length === 1) {
          const clickedDate = selectedDateRange[0];

          if (firstSelectedDate === null) {
            // First click - store and show visual feedback
            firstSelectedDate = clickedDate;
            updateHint('first');

            // Highlight first selected date
            const allDays = instance.calendarContainer.querySelectorAll('.flatpickr-day');
            allDays.forEach(day => {
              day.classList.remove('first-selected');
              if (day.dateObj && day.dateObj.getTime() === clickedDate.getTime()) {
                day.classList.add('first-selected');
                firstSelectedElement = day;
              }
            });
          } else {
            // Second click - create range
            const rangeStart = firstSelectedDate < clickedDate ? firstSelectedDate : clickedDate;
            const rangeEnd = firstSelectedDate < clickedDate ? clickedDate : firstSelectedDate;

            if (onDateRangeSelect) {
              onDateRangeSelect(rangeStart, rangeEnd);
            }

            // Clear visual feedback
            if (firstSelectedElement) {
              firstSelectedElement.classList.remove('first-selected');
              firstSelectedElement = null;
            }

            // Reset for next selection
            firstSelectedDate = null;
            updateHint('none');

            setTimeout(() => {
              if (instanceRef.current) {
                instanceRef.current.clear();
              }
            }, 50);
          }
        } else if (selectedDateRange.length >= 2) {
          const rangeStart = selectedDateRange[0];
          const rangeEnd = selectedDateRange[selectedDateRange.length - 1];

          if (onDateRangeSelect) {
            onDateRangeSelect(rangeStart, rangeEnd);
          }

          if (firstSelectedElement) {
            firstSelectedElement.classList.remove('first-selected');
            firstSelectedElement = null;
          }

          firstSelectedDate = null;
          updateHint('none');

          setTimeout(() => {
            if (instanceRef.current) {
              instanceRef.current.clear();
            }
          }, 50);
        }
      },
      onDayCreate: (dObj, dStr, fp, dayElem) => {
        const dateStr = formatDateLocal(dayElem.dateObj);
        const isSubmitted = submittedDatesRef.current.includes(dateStr);
        const isPending = selectedDatesRef.current.includes(dateStr);

        dayElem.classList.remove('user-submitted', 'user-pending', 'range-start', 'range-middle', 'range-end', 'range-single', 'first-selected');

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

        if (isMobile) {
          dayElem.style.minHeight = '44px';
          dayElem.style.minWidth = '44px';
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
      <div
        ref={hintRef}
        className="date-picker-hint"
        role="status"
        aria-live="polite"
      >
        Tap a date to start, then tap another to select a range
      </div>
      <div
        ref={pickerRef} 
        className="date-picker-container"
        role="application"
        aria-label="Date picker for selecting unavailable dates"
      ></div>
      <div className="date-picker-legend" role="region" aria-label="Date picker legend">
        <span className="legend-item">
          <span className="legend-color pending" aria-hidden="true"></span>
          <span>Pending selection</span>
        </span>
        <span className="legend-item">
          <span className="legend-color submitted" aria-hidden="true"></span>
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

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

  useEffect(() => {
    if (!pickerRef.current || !startDate || !endDate) return;

    const start = new Date(startDate + 'T00:00:00');
    const end = new Date(endDate + 'T00:00:00');
    const isMobile = window.innerWidth <= 600;

    instanceRef.current = flatpickr(pickerRef.current, {
      mode: 'range',
      minDate: start,
      maxDate: end,
      dateFormat: 'Y-m-d',
      inline: true,
      showMonths: isMobile ? 1 : 2,
      onChange: (selectedDateRange) => {
        if (selectedDateRange.length === 2 || selectedDateRange.length === 1) {
          const rangeStart = selectedDateRange[0];
          const rangeEnd = selectedDateRange.length === 2 ? selectedDateRange[1] : selectedDateRange[0];

          if (onDateRangeSelect) {
            onDateRangeSelect(rangeStart, rangeEnd);
          }

          instanceRef.current.clear();
        }
      },
      onDayCreate: (dObj, dStr, fp, dayElem) => {
        const dateStr = formatDateLocal(dayElem.dateObj);
        const isSubmitted = submittedDates.includes(dateStr);
        const isPending = selectedDates.includes(dateStr);

        if (isSubmitted || isPending) {
          const dateList = isSubmitted ? submittedDates : selectedDates;
          const baseClass = isSubmitted ? 'user-submitted' : 'user-pending';

          dayElem.classList.add(baseClass);

          const rangePosition = getRangePosition(dateStr, dateList);
          if (rangePosition) {
            dayElem.classList.add(rangePosition);
          }
        }
      }
    });

    return () => {
      if (instanceRef.current) {
        instanceRef.current.destroy();
      }
    };
  }, [startDate, endDate]);

  // Refresh when dates change
  useEffect(() => {
    if (instanceRef.current) {
      instanceRef.current.redraw();
    }
  }, [selectedDates, submittedDates]);

  return <div ref={pickerRef} className="date-picker-container"></div>;
}

// Helper functions
function formatDateLocal(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getRangePosition(dateStr, dateList) {
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


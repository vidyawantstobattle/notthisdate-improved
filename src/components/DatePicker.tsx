import { useEffect, useRef } from 'react';
import flatpickr from 'flatpickr';
import 'flatpickr/dist/flatpickr.min.css';

interface DatePickerProps {
  startDate: string;
  endDate: string;
  selectedDates?: string[];
  submittedDates?: string[];
  onDateSelect?: (dateStr: string) => void;
}

function DatePicker({
  startDate,
  endDate,
  selectedDates = [],
  submittedDates = [],
  onDateSelect
}: DatePickerProps) {
  const pickerRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<any>(null);

  // Memoize the date arrays to prevent unnecessary re-renders
  const selectedDatesRef = useRef(selectedDates);
  const submittedDatesRef = useRef(submittedDates);

  useEffect(() => {
    selectedDatesRef.current = selectedDates;
    submittedDatesRef.current = submittedDates;
  }, [selectedDates, submittedDates]);

  useEffect(() => {
    if (!pickerRef.current || !startDate || !endDate) return;

    const start = new Date(startDate + 'T12:00:00');
    const end = new Date(endDate + 'T12:00:00');
    const isMobile = window.innerWidth <= 600;

    if (instanceRef.current) {
      instanceRef.current.destroy();
    }

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
      onChange: (selectedDateArray) => {
        if (selectedDateArray.length > 0) {
          const lastDate = selectedDateArray[selectedDateArray.length - 1];
          const dateStr = formatDateLocal(lastDate);
          onDateSelect?.(dateStr);
        }

        setTimeout(() => {
          if (instanceRef.current) {
            instanceRef.current.clear();
            instanceRef.current.redraw();
          }
        }, 10);
      },
      onDayCreate: (_dObj, _dStr, _fp, dayElem: any) => {
        const dateStr = formatDateLocal(dayElem.dateObj);
        const isSubmitted = submittedDatesRef.current.includes(dateStr);
        const isPending = selectedDatesRef.current.includes(dateStr);

        dayElem.classList.remove('user-submitted', 'user-pending', 'range-start', 'range-middle', 'range-end', 'range-single');

        if (isSubmitted) {
          dayElem.classList.add('user-submitted');
          const rangePosition = getRangePosition(dateStr, submittedDatesRef.current);
          if (rangePosition) dayElem.classList.add(rangePosition);
        } else if (isPending) {
          dayElem.classList.add('user-pending');
          const rangePosition = getRangePosition(dateStr, selectedDatesRef.current);
          if (rangePosition) dayElem.classList.add(rangePosition);
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
  }, [startDate, endDate, onDateSelect]);

  // Redraw when dates change to update highlighting
  useEffect(() => {
    if (instanceRef.current) {
      instanceRef.current.redraw();
    }
  }, [selectedDates, submittedDates]);

  return (
    <div className="date-picker-wrapper">
      <p className="date-picker-hint">Click on dates to select/deselect them</p>
      <div id="date-picker-container">
        <div
          ref={pickerRef}
          className="date-picker-inner"
          role="application"
          aria-label="Date picker for selecting unavailable dates"
        ></div>
      </div>
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

function formatDateLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getRangePosition(dateStr: string, dateList: string[]): string | null {
  if (!dateList || dateList.length === 0) return null;

  const prevDate = getAdjacentDateStr(dateStr, -1);
  const nextDate = getAdjacentDateStr(dateStr, 1);

  const hasPrev = dateList.includes(prevDate);
  const hasNext = dateList.includes(nextDate);

  if (!hasPrev && !hasNext) return 'range-single';
  if (!hasPrev && hasNext) return 'range-start';
  if (hasPrev && hasNext) return 'range-middle';
  if (hasPrev && !hasNext) return 'range-end';
  return null;
}

function getAdjacentDateStr(dateStr: string, offsetDays: number): string {
  const date = new Date(dateStr + 'T12:00:00');
  date.setDate(date.getDate() + offsetDays);
  return formatDateLocal(date);
}

export default DatePicker;

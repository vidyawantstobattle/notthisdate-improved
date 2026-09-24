import { useState, useEffect, type ReactElement } from 'react';
import { useI18n } from '../context/I18nContext';
import { parseDateLocal, formatDateLocal } from '../core/dateRanges';

interface DatePickerProps {
  startDate: string;
  endDate: string;
  selectedDates?: string[];
  submittedDates?: string[];
  blockedDates?: string[];
  onDateSelect?: (dateStr: string) => void;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MOBILE_BREAKPOINT = 700;

function getMonthsToShow(): number {
  return typeof window !== 'undefined' && window.innerWidth <= MOBILE_BREAKPOINT ? 1 : 2;
}

function getMonthStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, months: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

function getMonthIndex(date: Date): number {
  return date.getFullYear() * 12 + date.getMonth();
}

function toMonthDate(monthIndex: number): Date {
  return new Date(Math.floor(monthIndex / 12), monthIndex % 12, 1);
}

function getMonthLabel(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function clampViewStart(viewStart: Date, rangeStart: Date, rangeEnd: Date, monthsToShow: number): Date {
  const minIndex = getMonthIndex(getMonthStart(rangeStart));
  const maxIndex = getMonthIndex(getMonthStart(rangeEnd));
  const latestStartIndex = Math.max(minIndex, maxIndex - (monthsToShow - 1));
  const targetIndex = Math.min(Math.max(getMonthIndex(getMonthStart(viewStart)), minIndex), latestStartIndex);
  return toMonthDate(targetIndex);
}

function getAdjacentDateStr(dateStr: string, offsetDays: number): string {
  const date = parseDateLocal(dateStr);
  if (!date) return dateStr;
  date.setDate(date.getDate() + offsetDays);
  return formatDateLocal(date);
}

// Marks a date as the start, middle, end, or lone day of a contiguous run so adjacent cells can merge visually.
function getRangePosition(dateStr: string, dateList: string[]): string | null {
  if (!dateList.includes(dateStr)) return null;

  const hasPrev = dateList.includes(getAdjacentDateStr(dateStr, -1));
  const hasNext = dateList.includes(getAdjacentDateStr(dateStr, 1));

  if (!hasPrev && !hasNext) return 'range-single';
  if (!hasPrev && hasNext) return 'range-start';
  if (hasPrev && hasNext) return 'range-middle';
  return 'range-end';
}

function DatePicker({
  startDate,
  endDate,
  selectedDates = [],
  submittedDates = [],
  blockedDates = [],
  onDateSelect
}: DatePickerProps) {
  const { t } = useI18n();
  const [monthsToShow, setMonthsToShow] = useState(getMonthsToShow);
  const [viewStart, setViewStart] = useState<Date | null>(null);

  useEffect(() => {
    const handleResize = () => setMonthsToShow(getMonthsToShow());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const rangeStart = parseDateLocal(startDate);
  const rangeEnd = parseDateLocal(endDate);

  useEffect(() => {
    if (!rangeStart || !rangeEnd) return;
    setViewStart(prev => clampViewStart(prev || getMonthStart(rangeStart), rangeStart, rangeEnd, monthsToShow));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate, monthsToShow]);

  if (!rangeStart || !rangeEnd || !viewStart) return null;

  const monthDates = Array.from({ length: monthsToShow }, (_, i) => addMonths(viewStart, i));
  const minIndex = getMonthIndex(getMonthStart(rangeStart));
  const maxIndex = getMonthIndex(getMonthStart(rangeEnd));
  const latestStartIndex = Math.max(minIndex, maxIndex - (monthsToShow - 1));
  const canGoPrev = getMonthIndex(viewStart) > minIndex;
  const canGoNext = getMonthIndex(viewStart) < latestStartIndex;

  const rangeLabel = monthDates.length === 1
    ? getMonthLabel(monthDates[0])
    : `${getMonthLabel(monthDates[0])} - ${getMonthLabel(monthDates[monthDates.length - 1])}`;

  const shiftMonth = (step: number) => {
    setViewStart(prev => clampViewStart(addMonths(prev || viewStart, step), rangeStart, rangeEnd, monthsToShow));
  };

  const handleDayClick = (dateStr: string) => {
    if (blockedDates.includes(dateStr) || submittedDates.includes(dateStr)) return;
    onDateSelect?.(dateStr);
  };

  return (
    <div className="date-picker-wrapper">
      <p className="date-picker-hint">Click on dates to select/deselect them</p>
      <div className="ntd-picker-shell" role="application" aria-label="Date picker for selecting unavailable dates">
        <div className="ntd-picker-toolbar">
          <button
            type="button"
            className="ntd-nav-btn"
            onClick={() => shiftMonth(-1)}
            disabled={!canGoPrev}
            aria-label={t('calendarSubmit.showPrevMonth')}
          >
            <span aria-hidden="true">&lsaquo;</span>
          </button>
          <div className="ntd-picker-range-label">{rangeLabel}</div>
          <button
            type="button"
            className="ntd-nav-btn"
            onClick={() => shiftMonth(1)}
            disabled={!canGoNext}
            aria-label={t('calendarSubmit.showNextMonth')}
          >
            <span aria-hidden="true">&rsaquo;</span>
          </button>
        </div>
        <div className="ntd-picker-months" data-months={monthsToShow}>
          {monthDates.map(monthDate => (
            <MonthGrid
              key={`${monthDate.getFullYear()}-${monthDate.getMonth()}`}
              monthDate={monthDate}
              rangeStart={rangeStart}
              rangeEnd={rangeEnd}
              selectedDates={selectedDates}
              submittedDates={submittedDates}
              blockedDates={blockedDates}
              onDayClick={handleDayClick}
              t={t}
            />
          ))}
        </div>
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

interface MonthGridProps {
  monthDate: Date;
  rangeStart: Date;
  rangeEnd: Date;
  selectedDates: string[];
  submittedDates: string[];
  blockedDates: string[];
  onDayClick: (dateStr: string) => void;
  t: (key: string) => string;
}

function MonthGrid({ monthDate, rangeStart, rangeEnd, selectedDates, submittedDates, blockedDates, onDayClick, t }: MonthGridProps) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: ReactElement[] = [];

  for (let slot = 0; slot < 42; slot++) {
    const dayNumber = slot - firstWeekday + 1;

    if (dayNumber < 1 || dayNumber > daysInMonth) {
      cells.push(<div key={`empty-${slot}`} className="ntd-day ntd-day--placeholder" aria-hidden="true"></div>);
      continue;
    }

    const dateObj = new Date(year, month, dayNumber);
    const dateStr = formatDateLocal(dateObj);
    const isInRange = dateObj >= rangeStart && dateObj <= rangeEnd;
    const isBlocked = blockedDates.includes(dateStr);
    const isSubmitted = submittedDates.includes(dateStr);
    const isPending = selectedDates.includes(dateStr);

    const classNames = ['ntd-day'];
    let title = t('calendarSubmit.titleClickToMark');
    let disabled = false;

    if (!isInRange) {
      classNames.push('is-out-of-range');
      disabled = true;
      title = t('calendarSubmit.titleOutsideRange');
    } else if (isBlocked) {
      classNames.push('is-blocked');
      disabled = true;
      title = t('calendarView.blocked.tooltip');
    } else if (isSubmitted) {
      classNames.push('is-submitted');
      disabled = true;
      title = t('calendarSubmit.rangeTitleSubmitted');
    } else if (isPending) {
      classNames.push('is-pending');
      title = t('calendarSubmit.rangeTitlePending');
    }

    if (isInRange && (isSubmitted || isPending)) {
      const rangePosition = getRangePosition(dateStr, isSubmitted ? submittedDates : selectedDates);
      if (rangePosition) classNames.push(rangePosition);
    }

    cells.push(
      <button
        key={dayNumber}
        type="button"
        className={classNames.join(' ')}
        disabled={disabled}
        title={title}
        aria-pressed={isInRange && !disabled ? isPending : undefined}
        onClick={() => onDayClick(dateStr)}
      >
        <span className="ntd-day-number">{dayNumber}</span>
      </button>
    );
  }

  return (
    <section className="ntd-picker-month" aria-label={getMonthLabel(monthDate)}>
      <h4 className="ntd-picker-month-title">{getMonthLabel(monthDate)}</h4>
      <div className="ntd-picker-grid">
        {WEEKDAYS.map(day => (
          <div key={day} className="ntd-weekday">{day}</div>
        ))}
        {cells}
      </div>
    </section>
  );
}

export default DatePicker;

import { useEffect, useState } from 'react';
import { useI18n } from '../context/I18nContext';

interface DatePickerProps {
  startDate: string;
  endDate: string;
  selectedDates?: string[];
  submittedDates?: string[];
  datesToRemove?: string[];
  blockedDates?: string[];
  blockedDateReasons?: Record<string, string>;
  onDateSelect?: (dateStr: string) => void;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getMonthsToShow() {
  return window.innerWidth <= 700 ? 1 : 2;
}

function getMonthIndex(date: Date) {
  return date.getFullYear() * 12 + date.getMonth();
}

function toMonthDate(monthIndex: number) {
  const year = Math.floor(monthIndex / 12);
  const month = monthIndex % 12;
  return new Date(year, month, 1);
}

function getMonthStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, months: number) {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

function getMonthLabel(date: Date) {
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function formatDateLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getAdjacentDateStr(dateStr: string, offsetDays: number): string {
  const date = new Date(dateStr + 'T12:00:00');
  date.setDate(date.getDate() + offsetDays);
  return formatDateLocal(date);
}

function getRangePosition(dateStr: string, dateList: string[]): string | null {
  if (!dateList.includes(dateStr)) return null;

  const hasPrev = dateList.includes(getAdjacentDateStr(dateStr, -1));
  const hasNext = dateList.includes(getAdjacentDateStr(dateStr, 1));

  if (!hasPrev && !hasNext) return 'range-single';
  if (!hasPrev && hasNext) return 'range-start';
  if (hasPrev && hasNext) return 'range-middle';
  return 'range-end';
}

function clampViewStart(viewStart: Date, rangeStart: Date, rangeEnd: Date, monthsToShow: number) {
  const minIndex = getMonthIndex(getMonthStart(rangeStart));
  const maxIndex = getMonthIndex(getMonthStart(rangeEnd));
  const latestStartIndex = Math.max(minIndex, maxIndex - (monthsToShow - 1));

  const targetIndex = Math.min(Math.max(getMonthIndex(getMonthStart(viewStart)), minIndex), latestStartIndex);
  return toMonthDate(targetIndex);
}

function DatePicker({
  startDate,
  endDate,
  selectedDates = [],
  submittedDates = [],
  datesToRemove = [],
  blockedDates = [],
  blockedDateReasons = {},
  onDateSelect
}: DatePickerProps) {
  const { t } = useI18n();
  const rangeStart = new Date(startDate + 'T12:00:00');
  const rangeEnd = new Date(endDate + 'T12:00:00');
  const todayStr = formatDateLocal(new Date());

  const [monthsToShow, setMonthsToShow] = useState(getMonthsToShow());
  const [viewStart, setViewStart] = useState(() =>
    clampViewStart(getMonthStart(rangeStart), rangeStart, rangeEnd, monthsToShow)
  );

  useEffect(() => {
    const handleResize = () => setMonthsToShow(getMonthsToShow());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setViewStart(prev => clampViewStart(prev, rangeStart, rangeEnd, monthsToShow));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate, monthsToShow]);

  const monthDates = Array.from({ length: monthsToShow }, (_, i) => addMonths(viewStart, i));
  const minMonthIndex = getMonthIndex(getMonthStart(rangeStart));
  const maxMonthIndex = getMonthIndex(getMonthStart(rangeEnd));
  const latestStartIndex = Math.max(minMonthIndex, maxMonthIndex - (monthsToShow - 1));

  const canGoPrev = getMonthIndex(viewStart) > minMonthIndex;
  const canGoNext = getMonthIndex(viewStart) < latestStartIndex;

  const rangeLabel = monthDates.length === 1
    ? getMonthLabel(monthDates[0])
    : `${getMonthLabel(monthDates[0])} - ${getMonthLabel(monthDates[monthDates.length - 1])}`;

  const shiftMonth = (step: number) => {
    setViewStart(prev => clampViewStart(addMonths(prev, step), rangeStart, rangeEnd, monthsToShow));
  };

  const handleDayClick = (dateStr: string) => {
    if (blockedDates.includes(dateStr)) return;
    if (dateStr < todayStr) return;
    onDateSelect?.(dateStr);
  };

  return (
    <div className="date-picker-wrapper">
      <p className="date-picker-hint">{t('calendarSubmit.pickerHint')}</p>
      <div id="date-picker-container">
        <div className="ntd-picker-shell" role="application" aria-label={t('calendarSubmit.pickerAriaLabel')}>
          <div className="ntd-picker-toolbar">
            <button
              type="button"
              className="ntd-nav-btn"
              aria-label={t('calendarSubmit.showPrevMonth')}
              disabled={!canGoPrev}
              onClick={() => shiftMonth(-1)}
            >
              <span aria-hidden="true">&lsaquo;</span>
            </button>
            <div className="ntd-picker-range-label">{rangeLabel}</div>
            <button
              type="button"
              className="ntd-nav-btn"
              aria-label={t('calendarSubmit.showNextMonth')}
              disabled={!canGoNext}
              onClick={() => shiftMonth(1)}
            >
              <span aria-hidden="true">&rsaquo;</span>
            </button>
          </div>
          <div className="ntd-picker-months" data-months={monthsToShow}>
            {monthDates.map(monthDate => (
              <PickerMonth
                key={`${monthDate.getFullYear()}-${monthDate.getMonth()}`}
                monthDate={monthDate}
                rangeStart={rangeStart}
                rangeEnd={rangeEnd}
                selectedDates={selectedDates}
                submittedDates={submittedDates}
                datesToRemove={datesToRemove}
                blockedDates={blockedDates}
                blockedDateReasons={blockedDateReasons}
                todayStr={todayStr}
                onDayClick={handleDayClick}
                t={t}
              />
            ))}
          </div>
        </div>
      </div>
      <div className="date-picker-legend" role="region" aria-label={t('calendarSubmit.legendAriaLabel')}>
        <span className="legend-item">
          <span className="legend-color pending" aria-hidden="true"></span>
          <span>{t('calendarSubmit.legend.pendingSelection')}</span>
        </span>
        <span className="legend-item">
          <span className="legend-color submitted" aria-hidden="true"></span>
          <span>{t('calendarSubmit.legend.alreadySubmitted')}</span>
        </span>
        <span className="legend-item">
          <span className="legend-color removing" aria-hidden="true"></span>
          <span>{t('calendarSubmit.legend.markedForRemoval')}</span>
        </span>
      </div>
    </div>
  );
}

interface PickerMonthProps {
  monthDate: Date;
  rangeStart: Date;
  rangeEnd: Date;
  selectedDates: string[];
  submittedDates: string[];
  datesToRemove: string[];
  blockedDates: string[];
  blockedDateReasons: Record<string, string>;
  todayStr: string;
  onDayClick: (dateStr: string) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

function PickerMonth({
  monthDate,
  rangeStart,
  rangeEnd,
  selectedDates,
  submittedDates,
  datesToRemove,
  blockedDates,
  blockedDateReasons,
  todayStr,
  onDayClick,
  t
}: PickerMonthProps) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];

  for (let slot = 0; slot < 42; slot++) {
    const dayNumber = slot - firstWeekday + 1;

    if (dayNumber < 1 || dayNumber > daysInMonth) {
      cells.push(<div key={`empty-${slot}`} className="ntd-day ntd-day--placeholder" aria-hidden="true"></div>);
      continue;
    }

    const dateObj = new Date(year, month, dayNumber);
    const dateStr = formatDateLocal(dateObj);
    const isInRange = dateObj >= rangeStart && dateObj <= rangeEnd;
    const isSubmitted = submittedDates.includes(dateStr);
    const isRemoving = isSubmitted && datesToRemove.includes(dateStr);
    const isPending = selectedDates.includes(dateStr);
    const isBlocked = blockedDates.includes(dateStr);
    const isPast = dateStr < todayStr;

    const classNames = ['ntd-day'];
    let disabled = false;
    let title = t('calendarSubmit.titleClickToMark');

    if (!isInRange) {
      classNames.push('is-out-of-range');
      disabled = true;
      title = t('calendarSubmit.titleOutsideRange');
    } else if (isPast) {
      // A day that has already happened can't be planned around any more.
      classNames.push('is-past');
      if (isSubmitted) classNames.push('is-submitted');
      disabled = true;
      title = t('calendarSubmit.titlePastDate');
    } else if (isBlocked) {
      classNames.push('is-blocked');
      disabled = true;
      title = blockedDateReasons[dateStr]
        ? t('calendarView.blocked.tooltipWithReason', { reason: blockedDateReasons[dateStr] })
        : t('calendarView.blocked.tooltip');
    } else if (isRemoving) {
      classNames.push('is-removing');
      title = t('calendarSubmit.titleUndoRemoval');
    } else if (isSubmitted) {
      classNames.push('is-submitted');
      title = t('calendarSubmit.titleClickToUnmark');
    } else if (isPending) {
      classNames.push('is-pending');
      title = t('calendarSubmit.rangeTitlePending');
    }

    if (isInRange && (isSubmitted || isPending)) {
      const rangeSource = isRemoving ? datesToRemove : isSubmitted ? submittedDates : selectedDates;
      const rangePosition = getRangePosition(dateStr, rangeSource);
      if (rangePosition) classNames.push(rangePosition);
    }

    cells.push(
      <button
        key={dateStr}
        type="button"
        className={classNames.join(' ')}
        disabled={disabled}
        title={title}
        aria-pressed={isPending || isSubmitted}
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

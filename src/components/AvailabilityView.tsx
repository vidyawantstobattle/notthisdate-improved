import { useState, useRef, useEffect, type ReactElement } from 'react';
import { getAvailabilityColor, getAvailabilityTextColor, findBestDates, type BestDatesResult } from '../core/availability';
import { groupIntoRanges, formatDisplayDate, formatDateDisplay } from '../core/dateRanges';
import { useI18n } from '../context/I18nContext';
import type { Calendar, UnavailabilityByDate } from '../types';

interface AvailabilityViewProps {
  calendar: Calendar;
  allUnavailability: UnavailabilityByDate;
}

function AvailabilityView({ calendar, allUnavailability }: AvailabilityViewProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const { t } = useI18n();

  if (!calendar) return null;

  const startDate = new Date(calendar.startDate + 'T12:00:00');
  const endDate = new Date(calendar.endDate + 'T12:00:00');

  // Generate months to display
  const months: { year: number; month: number }[] = [];
  let current = new Date(startDate);
  current.setDate(1);

  while (current <= endDate) {
    months.push({ year: current.getFullYear(), month: current.getMonth() });
    current.setMonth(current.getMonth() + 1);
  }

  // Calculate total participants
  const allParticipants = getAllParticipants(allUnavailability, calendar);
  const totalPeople = calendar.participantsType === 'defined'
    ? calendar.participants?.length || 1
    : Math.max(allParticipants.length, 1);

  const blockedDates = calendar.blockedDates || [];
  const blockedDateReasons = calendar.blockedDateReasons || {};

  const hasSubmissions = Object.values(allUnavailability || {}).some(people => people?.length);
  const bestDates = findBestDates(
    calendar.startDate,
    calendar.endDate,
    allUnavailability,
    totalPeople,
    blockedDates
  );

  return (
    <div className="availability-view">
      <div className="availability-header">
        <h3>{t('calendarShell.tabs.view')}</h3>
        <BestDatesPanel result={bestDates} hasSubmissions={hasSubmissions} />
        <p className="form-hint info">{t('calendarView.legend.note')}</p>
      </div>

      <div className="availability-legend" role="region" aria-label={t('calendarView.legend.title')}>
        <div className="legend-item">
          <span className="legend-color" style={{ background: '#4ade80' }} aria-hidden="true"></span>
          <span>{t('calendarView.legend.everyoneAvailable')}</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ background: '#fbbf24' }} aria-hidden="true"></span>
          <span>{t('calendarView.legend.someUnavailable')}</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ background: '#6b7280' }} aria-hidden="true"></span>
          <span>{t('calendarView.legend.manyUnavailable')}</span>
        </div>
        {blockedDates.length > 0 && (
          <div className="legend-item">
            <span className="legend-color legend-color-blocked" aria-hidden="true"></span>
            <span>{t('calendarView.legend.blocked')}</span>
          </div>
        )}
      </div>

      <div className="availability-months-grid">
        {months.map(({ year, month }) => (
          <MonthCalendar
            key={`${year}-${month}`}
            year={year}
            month={month}
            startDate={startDate}
            endDate={endDate}
            allUnavailability={allUnavailability}
            totalPeople={totalPeople}
            blockedDates={blockedDates}
            blockedDateReasons={blockedDateReasons}
            onDateClick={setSelectedDate}
            t={t}
          />
        ))}
      </div>

      {selectedDate && (
        <DateDetailsModal
          dateStr={selectedDate}
          calendar={calendar}
          allUnavailability={allUnavailability}
          blockedDateReason={blockedDateReasons[selectedDate]}
          onClose={() => setSelectedDate(null)}
        />
      )}
    </div>
  );
}

// How many tied ranges to spell out before collapsing the rest into a count.
const MAX_BEST_RANGES_SHOWN = 3;

function formatRange(start: string, end: string): string {
  return start === end ? formatDisplayDate(start) : `${formatDateDisplay(start)} – ${formatDisplayDate(end)}`;
}

interface BestDatesPanelProps {
  result: BestDatesResult | null;
  hasSubmissions: boolean;
}

// The headline answer: which date(s) currently clash with the fewest people.
function BestDatesPanel({ result, hasSubmissions }: BestDatesPanelProps) {
  const { t } = useI18n();

  if (!hasSubmissions) {
    return (
      <p className="best-dates-panel is-empty">{t('calendarView.best.awaitingSubmissions')}</p>
    );
  }

  if (!result) return null;

  if (result.availableCount === 0) {
    return <p className="best-dates-panel is-empty">{t('calendarView.best.none')}</p>;
  }

  const ranges = groupIntoRanges(result.dates);
  const shown = ranges.slice(0, MAX_BEST_RANGES_SHOWN);
  const remaining = ranges.length - shown.length;

  return (
    <div className="best-dates-panel">
      <span className="best-dates-label">{t('calendarView.best.title')}</span>
      <ul className="best-dates-list">
        {shown.map(range => (
          <li key={`${range.start}-${range.end}`} className="best-dates-item">
            {formatRange(range.start, range.end)}
          </li>
        ))}
        {remaining > 0 && (
          <li className="best-dates-item is-more">{t('calendarView.best.more', { count: remaining })}</li>
        )}
      </ul>
      <span className="best-dates-count">
        {result.unavailableCount === 0
          ? t('calendarView.best.everyoneAvailable')
          : t('calendarView.best.someAvailable', { available: result.availableCount, total: result.totalPeople })}
      </span>
    </div>
  );
}

interface MonthCalendarProps {
  year: number;
  month: number;
  startDate: Date;
  endDate: Date;
  allUnavailability: UnavailabilityByDate;
  totalPeople: number;
  blockedDates: string[];
  blockedDateReasons: Record<string, string>;
  onDateClick: (dateStr: string) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

function MonthCalendar({
  year,
  month,
  startDate,
  endDate,
  allUnavailability,
  totalPeople,
  blockedDates,
  blockedDateReasons,
  onDateClick,
  t
}: MonthCalendarProps) {
  const monthName = new Date(year, month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const startDayOfWeek = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const rangeStart = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
  const rangeEnd = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());

  const calendarCells: ReactElement[] = [];

  for (let i = 0; i < startDayOfWeek; i++) {
    calendarCells.push(<div key={`empty-${i}`} className="av-calendar-day empty"></div>);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateObj = new Date(year, month, day);
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const isInRange = dateObj >= rangeStart && dateObj <= rangeEnd;

    if (!isInRange) {
      calendarCells.push(
        <div key={day} className="av-calendar-day out-of-range">
          <span className="day-number">{day}</span>
        </div>
      );
      continue;
    }

    const unavailablePeople = allUnavailability[dateStr] || [];
    const unavailableCount = unavailablePeople.length;

    if (blockedDates.includes(dateStr)) {
      const reason = blockedDateReasons[dateStr];
      const tooltipText = reason
        ? t('calendarView.blocked.tooltipWithReason', { reason })
        : t('calendarView.blocked.tooltip');
      calendarCells.push(
        <button
          key={day}
          className="av-calendar-day in-range is-blocked"
          title={tooltipText}
          aria-label={`${monthName} ${day}. ${tooltipText}`}
          onClick={() => {
            // On mobile, show the reason in the modal;
            // on desktop, the title tooltip already displays it.
            if (reason) onDateClick(dateStr);
          }}
          style={{ cursor: reason ? 'pointer' : 'default' }}
        >
          <span className="day-number">{day}</span>
        </button>
      );
      continue;
    }

    const ratio = totalPeople > 0 ? unavailableCount / totalPeople : 0;
    const bgColor = getAvailabilityColor(ratio);
    const textColor = getAvailabilityTextColor(ratio);

    calendarCells.push(
      <button
        key={day}
        className="av-calendar-day in-range"
        style={{ backgroundColor: bgColor, color: textColor }}
        onClick={() => onDateClick(dateStr)}
        aria-label={`${monthName} ${day}. ${unavailableCount > 0 ? `${unavailableCount} people unavailable` : 'Everyone available'}`}
      >
        <span className="day-number">{day}</span>
        {unavailableCount > 0 && (
          <span className="unavailable-badge" aria-hidden="true">{unavailableCount}</span>
        )}
      </button>
    );
  }

  return (
    <div className="av-month-calendar">
      <h4 className="av-month-name">{monthName}</h4>
      <div className="av-calendar-grid">
        {weekDays.map(day => (
          <div key={day} className="av-weekday-header">{day}</div>
        ))}
        {calendarCells}
      </div>
    </div>
  );
}

interface DateDetailsModalProps {
  dateStr: string;
  calendar: Calendar;
  allUnavailability: UnavailabilityByDate;
  blockedDateReason?: string;
  onClose: () => void;
}

function DateDetailsModal({ dateStr, calendar, allUnavailability, blockedDateReason, onClose }: DateDetailsModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const { t, lang } = useI18n();

  useEffect(() => {
    const firstButton = modalRef.current?.querySelector('button');
    firstButton?.focus();
  }, []);

  const unavailablePeople = allUnavailability[dateStr] || [];
  const isBlocked = calendar.blockedDates?.includes(dateStr);
  const date = new Date(dateStr + 'T12:00:00');
  const dateDisplay = date.toLocaleDateString(lang, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  const allParticipants = calendar.participantsType === 'defined'
    ? calendar.participants || []
    : getAllParticipants(allUnavailability, calendar);

  const availablePeople = allParticipants.filter(p => !unavailablePeople.includes(p));

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="date-details-title">
      <div className="modal-content date-details-modal" onClick={(e) => e.stopPropagation()} ref={modalRef}>
        <button className="modal-close" onClick={onClose} aria-label={t('common.closeDialog')}>&times;</button>
        <h3 id="date-details-title">{dateDisplay}</h3>

        {isBlocked && (
          <div className="blocked-date-notice">
            <p className="blocked-label">{t('calendarView.blocked.tooltip')}</p>
            {blockedDateReason && <p className="blocked-reason">{blockedDateReason}</p>}
          </div>
        )}

        {!isBlocked && (
          <>
            {unavailablePeople.length === 0 ? (
              <div className="all-available-message">
                <span className="success-icon">🎉</span>
                <p>{t('calendarView.dateDetails.everyoneAvailable')}</p>
              </div>
            ) : (
              <div className="availability-details">
                <div className="detail-section unavailable">
                  <h4>❌ {t('calendarView.dateDetails.unavailableCount', { count: unavailablePeople.length })}</h4>
                  <ul>
                    {unavailablePeople.map((person, idx) => (
                      <li key={idx}>{person}</li>
                    ))}
                  </ul>
                </div>

                {availablePeople.length > 0 && (
                  <div className="detail-section available">
                    <h4>✅ {t('calendarView.dateDetails.availableCount', { count: availablePeople.length })}</h4>
                    <p>{availablePeople.join(', ')}</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function getAllParticipants(allUnavailability: UnavailabilityByDate, calendar: Calendar): string[] {
  const participants = new Set<string>();

  if (calendar?.participantsType === 'defined' && calendar?.participants) {
    return calendar.participants;
  }

  Object.values(allUnavailability || {}).forEach(peopleArray => {
    if (Array.isArray(peopleArray)) {
      peopleArray.forEach(p => {
        if (p && typeof p === 'string') participants.add(p);
      });
    }
  });

  return Array.from(participants).sort();
}

export default AvailabilityView;

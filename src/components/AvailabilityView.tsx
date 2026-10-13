import { useState, useRef, useEffect, type ReactElement } from 'react';
import { getAvailabilityColor, getAvailabilityTextColor, findBestDates, type BestDatesResult } from '../core/availability';
import { groupIntoRanges, formatDisplayDate, formatDateDisplay, formatDateLocal } from '../core/dateRanges';
import { normalizeParticipantName } from '../core/participants';
import { richTextToPlainText } from '../utils/richText';
import { SITE_URL } from '../config/site';
import AddToCalendar from './AddToCalendar';
import { useI18n } from '../context/I18nContext';
import type { Calendar, UnavailabilityByDate } from '../types';

interface AvailabilityViewProps {
  calendar: Calendar;
  allUnavailability: UnavailabilityByDate;
  submittedParticipants?: string[];
  isOwner?: boolean;
  onSetFinalizedDate?: (date: string | null, endDate?: string | null) => void | Promise<void>;
  savingFinalizedDate?: boolean;
}

function AvailabilityView({
  calendar,
  allUnavailability,
  submittedParticipants = [],
  isOwner = false,
  onSetFinalizedDate,
  savingFinalizedDate = false
}: AvailabilityViewProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const { t } = useI18n();

  if (!calendar) return null;

  const startDate = new Date(calendar.startDate + 'T12:00:00');
  const endDate = new Date(calendar.endDate + 'T12:00:00');
  const todayStr = formatDateLocal(new Date());

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
  const isEntirelyPast = calendar.endDate < todayStr;

  const pendingParticipants = calendar.participantsType === 'defined'
    ? getPendingParticipants(calendar.participants || [], submittedParticipants)
    : [];

  return (
    <div className="availability-view">
      {isOwner && (
        <FinalizeDateControl
          calendar={calendar}
          onSetFinalizedDate={onSetFinalizedDate}
          saving={savingFinalizedDate}
        />
      )}

      <div className={`availability-dimmable${calendar.finalizedDate ? ' is-finalized' : ''}`}>
        <div className="availability-dimmable-content">
          <div className="availability-header">
            <h3>{t('calendarShell.tabs.view')}</h3>
            <BestDatesPanel result={bestDates} hasSubmissions={hasSubmissions} isEntirelyPast={isEntirelyPast} />
            {calendar.participantsType === 'defined' && (
              <PendingParticipantsPanel
                pending={pendingParticipants}
                total={calendar.participants?.length || 0}
              />
            )}
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
                todayStr={todayStr}
                onDateClick={setSelectedDate}
                t={t}
              />
            ))}
          </div>
        </div>

        {calendar.finalizedDate && (
          <div className="finalized-overlay" role="status">
            <div className="finalized-overlay-card">
              <span className="finalized-overlay-icon" aria-hidden="true">📅</span>
              <p className="finalized-overlay-title">{t('calendarView.finalize.overlayTitle')}</p>
              <p className="finalized-overlay-date">
                {formatFinalizedRange(calendar.finalizedDate, calendar.finalizedEndDate)}
              </p>
              <AddToCalendar
                uidSeed={calendar.id}
                event={{
                  title: calendar.name,
                  description: richTextToPlainText(calendar.description || ''),
                  url: `${SITE_URL}/c/${calendar.id}`,
                  startDate: calendar.finalizedDate,
                  endDate: calendar.finalizedEndDate
                }}
              />
              <p className="finalized-overlay-hint">{t('calendarView.finalize.overlayHint')}</p>
            </div>
          </div>
        )}
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

function formatFinalizedRange(start: string, end?: string | null): string {
  return !end || end === start ? formatDisplayDate(start) : formatRange(start, end);
}

interface FinalizeDateControlProps {
  calendar: Calendar;
  onSetFinalizedDate?: (date: string | null, endDate?: string | null) => void | Promise<void>;
  saving: boolean;
}

// Owner-only control for locking in (or clearing) the meeting date. Clearing it
// is what makes the overlay below disappear and reopens the calendar for everyone.
function FinalizeDateControl({ calendar, onSetFinalizedDate, saving }: FinalizeDateControlProps) {
  const { t } = useI18n();
  const [editing, setEditing] = useState(false);
  const [draftStart, setDraftStart] = useState(calendar.finalizedDate || calendar.startDate);
  const [draftEnd, setDraftEnd] = useState(calendar.finalizedEndDate || '');
  const [error, setError] = useState('');

  const isFinalized = Boolean(calendar.finalizedDate);

  const startEditing = () => {
    setDraftStart(calendar.finalizedDate || calendar.startDate);
    setDraftEnd(calendar.finalizedEndDate || '');
    setError('');
    setEditing(true);
  };

  const handleConfirm = async () => {
    if (!draftStart) return;

    // The date inputs' min/max only constrain the picker UI; a typed-in value
    // can still land outside the window participants answered for.
    if (draftStart < calendar.startDate || draftStart > calendar.endDate) {
      setError(t('calendarView.finalize.errorOutOfRange'));
      return;
    }
    if (draftEnd && (draftEnd < draftStart || draftEnd > calendar.endDate)) {
      setError(t('calendarView.finalize.errorEndBeforeStart'));
      return;
    }

    setError('');
    // A single-day lock-in is stored as a bare start date.
    await onSetFinalizedDate?.(draftStart, draftEnd && draftEnd !== draftStart ? draftEnd : null);
    setEditing(false);
  };

  const handleReopen = async () => {
    setError('');
    await onSetFinalizedDate?.(null);
    setEditing(false);
  };

  if (!editing && !isFinalized) {
    return (
      <div className="finalize-date-control">
        <button type="button" className="btn btn-outline btn-small" onClick={startEditing}>
          {t('calendarView.finalize.pickButton')}
        </button>
      </div>
    );
  }

  if (!editing && isFinalized) {
    return (
      <div className="finalize-date-control is-set">
        <span className="finalize-date-control-summary">
          {t('calendarView.finalize.lockedSummary', {
            date: formatFinalizedRange(calendar.finalizedDate as string, calendar.finalizedEndDate)
          })}
        </span>
        <div className="finalize-date-control-actions">
          <button type="button" className="btn btn-outline btn-small" onClick={startEditing} disabled={saving}>
            {t('calendarView.finalize.changeButton')}
          </button>
          <button type="button" className="btn btn-outline btn-small" onClick={handleReopen} disabled={saving}>
            {saving ? t('common.loading') : t('calendarView.finalize.reopenButton')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="finalize-date-control is-editing">
      <span className="finalize-date-control-label">{t('calendarView.finalize.ownerPanelTitle')}</span>
      <div className="finalize-date-control-inputs">
        <input
          type="date"
          aria-label={t('calendarView.finalize.startLabel')}
          value={draftStart}
          min={calendar.startDate}
          max={calendar.endDate}
          onChange={e => setDraftStart(e.target.value)}
        />
        <span className="finalize-date-control-sep">–</span>
        <input
          type="date"
          aria-label={t('calendarView.finalize.endLabel')}
          value={draftEnd}
          min={draftStart || calendar.startDate}
          max={calendar.endDate}
          onChange={e => setDraftEnd(e.target.value)}
        />
      </div>
      {error && <p className="finalize-date-control-error" role="alert">{error}</p>}
      <div className="finalize-date-control-actions">
        <button
          type="button"
          className="btn btn-primary btn-small"
          onClick={handleConfirm}
          disabled={saving || !draftStart}
        >
          {saving ? t('common.loading') : t('calendarView.finalize.confirmButton')}
        </button>
        <button type="button" className="btn btn-outline btn-small" onClick={() => setEditing(false)} disabled={saving}>
          {t('common.cancel')}
        </button>
      </div>
    </div>
  );
}

interface BestDatesPanelProps {
  result: BestDatesResult | null;
  hasSubmissions: boolean;
  isEntirelyPast: boolean;
}

// The headline answer: which date(s) currently clash with the fewest people.
function BestDatesPanel({ result, hasSubmissions, isEntirelyPast }: BestDatesPanelProps) {
  const { t } = useI18n();

  if (isEntirelyPast) {
    return <p className="best-dates-panel is-empty">{t('calendarView.best.allPast')}</p>;
  }

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
  todayStr: string;
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
  todayStr,
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
    const isPast = dateStr < todayStr;

    calendarCells.push(
      <button
        key={day}
        className={`av-calendar-day in-range${isPast ? ' is-past' : ''}`}
        style={{ backgroundColor: bgColor, color: textColor }}
        onClick={() => onDateClick(dateStr)}
        title={isPast ? t('calendarView.past.tooltip') : undefined}
        aria-label={`${monthName} ${day}. ${isPast ? t('calendarView.past.tooltip') : unavailableCount > 0 ? `${unavailableCount} people unavailable` : 'Everyone available'}`}
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

interface PendingParticipantsPanelProps {
  pending: string[];
  total: number;
}

// Named calendars know exactly who is missing, so say so instead of leaving the
// organiser to work it out from the heatmap.
function PendingParticipantsPanel({ pending, total }: PendingParticipantsPanelProps) {
  const { t } = useI18n();

  if (total === 0) return null;

  if (pending.length === 0) {
    return <p className="pending-participants is-complete">{t('calendarView.pending.allSubmitted')}</p>;
  }

  return (
    <div className="pending-participants">
      <span className="pending-participants-label">{t('calendarView.pending.title')}</span>
      <p className="pending-participants-desc">
        {t('calendarView.pending.desc', { count: pending.length, total })}
      </p>
      <ul className="pending-participants-list">
        {pending.map(name => (
          <li key={name} className="pending-participant">{name}</li>
        ))}
      </ul>
    </div>
  );
}

// Matching is case-insensitive because that is how submissions are keyed.
function getPendingParticipants(participants: string[], submitted: string[]): string[] {
  const submittedKeys = new Set(submitted.map(normalizeParticipantName));
  return participants.filter(name => !submittedKeys.has(normalizeParticipantName(name)));
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

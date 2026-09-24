import { useState, useRef, useEffect, type ReactElement } from 'react';
import { getAvailabilityColor, getAvailabilityTextColor } from '../core/availability';
import { useI18n } from '../context/I18nContext';
import type { Calendar, UnavailabilityByDate } from '../types';

interface AvailabilityViewProps {
  calendar: Calendar;
  allUnavailability: UnavailabilityByDate;
  allSubmitters?: string[];
}

function AvailabilityView({ calendar, allUnavailability, allSubmitters = [] }: AvailabilityViewProps) {
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

  // Calculate total participants. For open calendars this must include everyone who
  // submitted, even with zero unavailable dates, or the ratio skews toward "unavailable".
  const allParticipants = getAllParticipants(allUnavailability, calendar, allSubmitters);
  const totalPeople = calendar.participantsType === 'defined'
    ? calendar.participants?.length || 1
    : Math.max(allParticipants.length, 1);

  return (
    <div className="availability-view">
      <div className="availability-header">
        <h3>{t('calendarShell.tabs.view')}</h3>
        <p className="availability-subtitle">{t('calendarView.legend.note')}</p>
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
            onDateClick={setSelectedDate}
          />
        ))}
      </div>

      {selectedDate && (
        <DateDetailsModal
          dateStr={selectedDate}
          calendar={calendar}
          allUnavailability={allUnavailability}
          allSubmitters={allSubmitters}
          onClose={() => setSelectedDate(null)}
        />
      )}
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
  onDateClick: (dateStr: string) => void;
}

function MonthCalendar({ year, month, startDate, endDate, allUnavailability, totalPeople, onDateClick }: MonthCalendarProps) {
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
  allSubmitters?: string[];
  onClose: () => void;
}

function DateDetailsModal({ dateStr, calendar, allUnavailability, allSubmitters = [], onClose }: DateDetailsModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const { t, lang } = useI18n();

  useEffect(() => {
    const firstButton = modalRef.current?.querySelector('button');
    firstButton?.focus();
  }, []);

  const unavailablePeople = allUnavailability[dateStr] || [];
  const date = new Date(dateStr + 'T12:00:00');
  const dateDisplay = date.toLocaleDateString(lang, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  const allParticipants = calendar.participantsType === 'defined'
    ? calendar.participants || []
    : getAllParticipants(allUnavailability, calendar, allSubmitters);

  const availablePeople = allParticipants.filter(p => !unavailablePeople.includes(p));

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="date-details-title">
      <div className="modal-content date-details-modal" onClick={(e) => e.stopPropagation()} ref={modalRef}>
        <button className="modal-close" onClick={onClose} aria-label="Close dialog">&times;</button>
        <h3 id="date-details-title">{dateDisplay}</h3>

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
      </div>
    </div>
  );
}

function getAllParticipants(allUnavailability: UnavailabilityByDate, calendar: Calendar, allSubmitters: string[] = []): string[] {
  const participants = new Set<string>();

  if (calendar?.participantsType === 'defined' && calendar?.participants) {
    return calendar.participants;
  }

  allSubmitters.forEach(p => {
    if (p && typeof p === 'string') participants.add(p);
  });

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

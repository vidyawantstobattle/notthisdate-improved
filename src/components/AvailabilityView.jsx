import React, { useState, useRef, useEffect } from 'react';

function AvailabilityView({ calendar, allUnavailability }) {
  const [selectedDate, setSelectedDate] = useState(null);

  if (!calendar) return null;

  const startDate = new Date(calendar.startDate + 'T12:00:00');
  const endDate = new Date(calendar.endDate + 'T12:00:00');

  // Generate months to display
  const months = [];
  let current = new Date(startDate);
  current.setDate(1);

  while (current <= endDate) {
    months.push({
      year: current.getFullYear(),
      month: current.getMonth()
    });
    current.setMonth(current.getMonth() + 1);
  }

  // Calculate total participants
  const allParticipants = getAllParticipants(allUnavailability, calendar);
  const totalPeople = calendar.participantsType === 'defined'
    ? calendar.participants?.length || 1
    : Math.max(allParticipants.length, 1);

  console.log('AvailabilityView Debug:', {
    calendarParticipants: calendar.participants,
    participantsType: calendar.participantsType,
    allUnavailability,
    allParticipants,
    totalPeople
  });

  return (
    <div className="availability-view">
      <div className="availability-header">
        <h3>Group Availability Overview</h3>
        <p className="availability-subtitle">Click on any date to see who's available</p>
      </div>

      <div className="availability-legend" role="region" aria-label="Availability color legend">
        <div className="legend-item">
          <span className="legend-color" style={{ background: '#4ade80' }} aria-hidden="true"></span>
          <span>Everyone available (green)</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ background: '#fbbf24' }} aria-hidden="true"></span>
          <span>Some unavailable (yellow)</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ background: '#6b7280' }} aria-hidden="true"></span>
          <span>Most unavailable (gray)</span>
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
          onClose={() => setSelectedDate(null)}
        />
      )}
    </div>
  );
}

function MonthCalendar({ year, month, startDate, endDate, allUnavailability, totalPeople, onDateClick }) {
  const monthName = new Date(year, month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const startDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sunday
  const daysInMonth = lastDayOfMonth.getDate();

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Normalize date range for comparison
  const rangeStart = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
  const rangeEnd = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());

  const calendarCells = [];

  // Add empty cells for days before the 1st
  for (let i = 0; i < startDayOfWeek; i++) {
    calendarCells.push(
      <div key={`empty-${i}`} className="av-calendar-day empty"></div>
    );
  }

  // Add actual days
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
    const textColor = ratio > 0.5 ? '#ffffff' : '#1a1f36';

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

function DateDetailsModal({ dateStr, calendar, allUnavailability, onClose }) {
  const modalRef = useRef(null);
  
  useEffect(() => {
    if (modalRef.current) {
      const firstButton = modalRef.current.querySelector('button');
      if (firstButton) {
        firstButton.focus();
      }
    }
  }, []);
  
  const unavailablePeople = allUnavailability[dateStr] || [];
  const date = new Date(dateStr + 'T12:00:00');
  const dateDisplay = date.toLocaleDateString('en-US', {
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
        <button className="modal-close" onClick={onClose} aria-label="Close dialog">&times;</button>
        <h3 id="date-details-title">{dateDisplay}</h3>

        {unavailablePeople.length === 0 ? (
          <div className="all-available-message">
            <span className="success-icon">🎉</span>
            <p>Everyone is available on this date!</p>
          </div>
        ) : (
          <div className="availability-details">
            <div className="detail-section unavailable">
              <h4>❌ Unavailable ({unavailablePeople.length})</h4>
              <ul>
                {unavailablePeople.map((person, idx) => (
                  <li key={idx}>{person}</li>
                ))}
              </ul>
            </div>

            {availablePeople.length > 0 && (
              <div className="detail-section available">
                <h4>✅ Available ({availablePeople.length})</h4>
                <p>{availablePeople.join(', ')}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function getAllParticipants(allUnavailability, calendar) {
  const participants = new Set();

  // If defined participants, use those
  if (calendar?.participantsType === 'defined' && calendar?.participants) {
    return calendar.participants;
  }

  // Otherwise, collect from unavailability data
  Object.values(allUnavailability || {}).forEach(peopleArray => {
    if (Array.isArray(peopleArray)) {
      peopleArray.forEach(p => {
        if (p && typeof p === 'string') {
          participants.add(p);
        }
      });
    }
  });

  return Array.from(participants).sort();
}

function getAvailabilityColor(ratio) {
  if (ratio === 0) return '#4ade80'; // Green - everyone available
  if (ratio < 0.3) return '#86efac'; // Light green
  if (ratio < 0.5) return '#fbbf24'; // Yellow
  if (ratio < 0.7) return '#f97316'; // Orange
  return '#6b7280'; // Gray - most unavailable
}

export default AvailabilityView;

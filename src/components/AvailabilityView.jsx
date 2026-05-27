import React, { useState } from 'react';

function AvailabilityView({ calendar, allUnavailability }) {
  const [selectedDate, setSelectedDate] = useState(null);

  if (!calendar) return null;

  const startDate = new Date(calendar.startDate + 'T00:00:00');
  const endDate = new Date(calendar.endDate + 'T00:00:00');

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
  const totalPeople = calendar.participantsType === 'defined'
    ? calendar.participants?.length || 1
    : Object.keys(getAllParticipants(allUnavailability)).length || 1;

  return (
    <div className="availability-view">
      <div className="availability-legend">
        <span className="legend-item">
          <span className="legend-color available"></span> Available
        </span>
        <span className="legend-item">
          <span className="legend-color partial"></span> Some unavailable
        </span>
        <span className="legend-item">
          <span className="legend-color unavailable"></span> Most unavailable
        </span>
      </div>

      <div className="availability-calendar">
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
        <DateDetails
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
  const monthName = new Date(year, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDayOfWeek = firstDay.getDay();
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const rangeStartNorm = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
  const rangeEndNorm = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());

  const calendarDays = [];

  // Empty cells before the 1st
  for (let i = 0; i < startDayOfWeek; i++) {
    calendarDays.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
  }

  // Actual days
  for (let day = 1; day <= lastDay.getDate(); day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dateObj = new Date(year, month, day);
    const isInRange = dateObj >= rangeStartNorm && dateObj <= rangeEndNorm;

    if (!isInRange) {
      calendarDays.push(
        <div key={day} className="calendar-day out-of-range">
          <span className="day-number">{day}</span>
        </div>
      );
      continue;
    }

    const unavailablePeople = allUnavailability[dateStr] || [];
    const unavailableCount = unavailablePeople.length;
    const grayness = Math.min(unavailableCount / totalPeople, 1);
    const color = getAvailabilityColor(grayness);
    const textColor = grayness > 0.5 ? '#fff' : '#333';

    calendarDays.push(
      <div
        key={day}
        className="calendar-day clickable"
        style={{ background: color, color: textColor }}
        onClick={() => onDateClick(dateStr)}
        title={`${unavailableCount} unavailable`}
      >
        <span className="day-number">{day}</span>
        {unavailableCount > 0 && <span className="unavailable-count">{unavailableCount}</span>}
      </div>
    );
  }

  return (
    <div className="month-calendar">
      <h3 className="month-name">{monthName}</h3>
      <div className="calendar-grid">
        {days.map(d => (
          <div key={d} className="calendar-header">{d}</div>
        ))}
        {calendarDays}
      </div>
    </div>
  );
}

function DateDetails({ dateStr, calendar, allUnavailability, onClose }) {
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
    : Object.keys(getAllParticipants(allUnavailability));

  const availablePeople = allParticipants.filter(p => !unavailablePeople.includes(p));

  return (
    <div className="date-details-overlay" onClick={onClose}>
      <div className="date-details-modal" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>&times;</button>
        <h4>{dateDisplay}</h4>

        {unavailablePeople.length === 0 ? (
          <p className="all-available">🎉 Everyone is available on this date!</p>
        ) : (
          <>
            <div className="unavailable-section">
              <strong>❌ Unavailable ({unavailablePeople.length}):</strong>
              <ul>
                {unavailablePeople.map((p, idx) => (
                  <li key={idx}>{p}</li>
                ))}
              </ul>
            </div>

            {availablePeople.length > 0 && (
              <div className="available-section">
                <strong>✅ Available ({availablePeople.length}):</strong>
                <p>{availablePeople.join(', ')}</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function getAllParticipants(allUnavailability) {
  const participants = {};
  Object.values(allUnavailability || {}).forEach(peopleArray => {
    if (Array.isArray(peopleArray)) {
      peopleArray.forEach(p => participants[p] = true);
    }
  });
  return participants;
}

function getAvailabilityColor(grayness) {
  if (grayness === 0) return '#4ade80'; // Green

  const green = { r: 74, g: 222, b: 128 };
  const gray = { r: 100, g: 100, b: 100 };

  const r = Math.round(green.r + (gray.r - green.r) * grayness);
  const g = Math.round(green.g + (gray.g - green.g) * grayness);
  const b = Math.round(green.b + (gray.b - green.b) * grayness);

  return `rgb(${r}, ${g}, ${b})`;
}

export default AvailabilityView;


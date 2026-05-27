import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCalendar } from '../hooks/useCalendar';
import DatePicker from '../components/DatePicker';
import DateRangeDisplay from '../components/DateRangeDisplay';
import ParticipantInput from '../components/ParticipantInput';
import AvailabilityView from '../components/AvailabilityView';

function CalendarPage() {
  const { calendarId } = useParams();
  const { calendar, loading, error } = useCalendar(calendarId);

  const [activeTab, setActiveTab] = useState('submit');
  const [currentParticipant, setCurrentParticipant] = useState('');
  const [selectedDates, setSelectedDates] = useState([]);
  const [submittedDates, setSubmittedDates] = useState([]);
  const [allUnavailability, setAllUnavailability] = useState({});
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });
  const [submitting, setSubmitting] = useState(false);

  // Load user submissions when participant changes
  useEffect(() => {
    if (currentParticipant && calendar?.id) {
      loadUserSubmissions();
    }
  }, [currentParticipant, calendar?.id]);

  // Load all unavailability for the view tab
  useEffect(() => {
    if (calendar?.id && activeTab === 'view') {
      loadAllUnavailability();
    }
  }, [calendar?.id, activeTab]);

  const loadUserSubmissions = async () => {
    try {
      const response = await fetch(
        `/.netlify/functions/get-user-submissions?calendarId=${calendar.id}&participant=${encodeURIComponent(currentParticipant)}`
      );
      const data = await response.json();

      const dates = [];
      if (data.submissions && data.submissions.length > 0) {
        data.submissions.forEach(sub => {
          if (sub.dates) {
            sub.dates.forEach(d => {
              if (!dates.includes(d)) {
                dates.push(d);
              }
            });
          }
        });
      }
      setSubmittedDates(dates.sort());
    } catch (err) {
      console.error('Failed to load submissions:', err);
      setSubmittedDates([]);
    }
  };

  const loadAllUnavailability = async () => {
    try {
      const response = await fetch(`/.netlify/functions/get-unavailability?calendarId=${calendar.id}`);
      const data = await response.json();

      const unavailabilityByDate = {};
      const rawUnavailability = data.unavailability || {};

      Object.entries(rawUnavailability).forEach(([participant, info]) => {
        const dates = Array.isArray(info) ? info : (info.dates || []);
        dates.forEach(date => {
          if (!unavailabilityByDate[date]) {
            unavailabilityByDate[date] = [];
          }
          if (!unavailabilityByDate[date].includes(participant)) {
            unavailabilityByDate[date].push(participant);
          }
        });
      });

      setAllUnavailability(unavailabilityByDate);
    } catch (err) {
      console.error('Failed to load unavailability:', err);
      setAllUnavailability({});
    }
  };

  const handleDateRangeSelect = (start, end) => {
    const dates = [];
    let current = new Date(start);
    const endDate = new Date(end);

    while (current <= endDate) {
      const dateStr = formatDateLocal(current);
      if (!selectedDates.includes(dateStr) && !submittedDates.includes(dateStr)) {
        dates.push(dateStr);
      }
      current.setDate(current.getDate() + 1);
    }

    if (dates.length > 0) {
      setSelectedDates([...selectedDates, ...dates].sort());
    }
  };

  const handleRemoveRange = (range) => {
    const start = new Date(range.start + 'T12:00:00');
    const end = new Date(range.end + 'T12:00:00');

    const filtered = selectedDates.filter(dateStr => {
      const date = new Date(dateStr + 'T12:00:00');
      return date < start || date > end;
    });

    setSelectedDates(filtered);
  };

  const handleSubmit = async () => {
    if (!currentParticipant) {
      showStatus('error', 'Please enter your name first');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(
        `/.netlify/functions/submit-unavailability?calendarId=${encodeURIComponent(calendar.id)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            participantName: currentParticipant,
            unavailableDates: selectedDates
          })
        }
      );

      if (response.ok) {
        const message = selectedDates.length === 0
          ? 'Recorded! You\'re available for all dates! 🎉'
          : `Submitted ${selectedDates.length} unavailable date(s)! ✅`;

        showStatus('success', message);

        // Move selected to submitted
        setSubmittedDates([...submittedDates, ...selectedDates].sort());
        setSelectedDates([]);
      } else {
        const result = await response.json();
        showStatus('error', result.error || 'Failed to submit');
      }
    } catch (err) {
      showStatus('error', 'Network error. Please try again.');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = async () => {
    if (!currentParticipant) {
      showStatus('error', 'Please enter your name first');
      return;
    }

    if (!confirm('Are you sure you want to reset all your unavailable dates?')) {
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(
        `/.netlify/functions/reset-unavailability?calendarId=${encodeURIComponent(calendar.id)}&participant=${encodeURIComponent(currentParticipant)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        }
      );

      if (response.ok) {
        showStatus('success', 'Your dates have been reset!');
        setSelectedDates([]);
        setSubmittedDates([]);
      } else {
        showStatus('error', 'Failed to reset');
      }
    } catch (err) {
      showStatus('error', 'Network error. Please try again.');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const showStatus = (type, text) => {
    setStatusMessage({ type, text });
    setTimeout(() => {
      setStatusMessage({ type: '', text: '' });
    }, 4000);
  };

  // Loading state
  if (loading) {
    return (
      <div className="calendar-page">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading calendar...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="calendar-page">
        <div className="error-state">
          <h2>❌ Calendar Not Found</h2>
          <p>This calendar doesn't exist or the link is incorrect.</p>
          <Link to="/" className="btn btn-primary">Go Home</Link>
        </div>
      </div>
    );
  }

  if (!calendar) {
    return null;
  }

  return (
    <div className="calendar-page">
      {/* Header */}
      <header className="calendar-header">
        <Link to="/" className="back-link">← Back</Link>
        <h1>{calendar.name}</h1>
        {calendar.description && <p className="calendar-description">{calendar.description}</p>}
        <p className="date-range-display">
          📅 {formatDisplayDate(calendar.startDate)} - {formatDisplayDate(calendar.endDate)}
        </p>
      </header>

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab-btn ${activeTab === 'submit' ? 'active' : ''}`}
          onClick={() => setActiveTab('submit')}
        >
          📝 Submit Dates
        </button>
        <button
          className={`tab-btn ${activeTab === 'view' ? 'active' : ''}`}
          onClick={() => setActiveTab('view')}
        >
          📊 View Availability
        </button>
      </div>

      {/* Submit Tab */}
      {activeTab === 'submit' && (
        <div className="submit-tab">
          <ParticipantInput
            calendar={calendar}
            currentParticipant={currentParticipant}
            onParticipantChange={setCurrentParticipant}
          />

          {currentParticipant && (
            <>
              <div className="date-picker-section">
                <h3>Select dates you're NOT available</h3>
                <p className="form-hint">Click or drag to select date ranges</p>
                <DatePicker
                  startDate={calendar.startDate}
                  endDate={calendar.endDate}
                  selectedDates={selectedDates}
                  submittedDates={submittedDates}
                  onDateRangeSelect={handleDateRangeSelect}
                />
              </div>

              <div className="selected-dates-section">
                <h3>Selected Dates ({selectedDates.length})</h3>
                <DateRangeDisplay
                  dates={selectedDates}
                  onRemoveRange={handleRemoveRange}
                />
              </div>

              {submittedDates.length > 0 && (
                <div className="submitted-dates-section">
                  <h3>Already Submitted ({submittedDates.length})</h3>
                  <DateRangeDisplay dates={submittedDates} />
                </div>
              )}

              {statusMessage.text && (
                <div className={`status-message ${statusMessage.type}`}>
                  {statusMessage.text}
                </div>
              )}

              <div className="action-buttons">
                <button
                  className="btn btn-primary btn-large"
                  onClick={handleSubmit}
                  disabled={submitting}
                >
                  {submitting ? 'Submitting...' : 'Submit Unavailability'}
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={handleReset}
                  disabled={submitting}
                >
                  Reset My Dates
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* View Tab */}
      {activeTab === 'view' && (
        <div className="view-tab">
          <AvailabilityView
            calendar={calendar}
            allUnavailability={allUnavailability}
          />
        </div>
      )}
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

function formatDisplayDate(dateStr) {
  const date = new Date(dateStr + 'T12:00:00');
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default CalendarPage;


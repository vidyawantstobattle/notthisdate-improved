import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCalendar } from '../hooks/useCalendar';
import useDocumentTitle from '../hooks/useDocumentTitle';
import DatePicker from '../components/DatePicker';
import DateRangeDisplay from '../components/DateRangeDisplay';
import ParticipantInput from '../components/ParticipantInput';
import AvailabilityView from '../components/AvailabilityView';
import { apiGet, apiPost } from '../utils/apiClient';
import ErrorMessage from '../components/ErrorMessage';

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
  const [apiError, setApiError] = useState(null);

  // Set page title based on calendar name
  useDocumentTitle(calendar?.name || 'Calendar');

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
      setApiError(null);
      const data = await apiGet(
        `/.netlify/functions/get-user-submissions?calendarId=${calendar.id}&participant=${encodeURIComponent(currentParticipant)}`
      );

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
      setApiError(err);
      setSubmittedDates([]);
    }
  };

  const loadAllUnavailability = async () => {
    try {
      setApiError(null);
      const data = await apiGet(`/.netlify/functions/get-unavailability?calendarId=${calendar.id}`);

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
      setApiError(err);
      setAllUnavailability({});
    }
  };

  // Handle adding dates from the date picker
  const handleDateRangeSelect = (start, end) => {
    const dates = [];
    let current = new Date(start);
    const endDate = new Date(end);

    while (current <= endDate) {
      const dateStr = formatDateLocal(current);
      // Only add if not already selected or submitted
      if (!selectedDates.includes(dateStr) && !submittedDates.includes(dateStr)) {
        dates.push(dateStr);
      }
      current.setDate(current.getDate() + 1);
    }

    if (dates.length > 0) {
      // Append to existing selections (allows multiple selections)
      setSelectedDates(prev => [...new Set([...prev, ...dates])].sort());
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
    setApiError(null);

    try {
      await apiPost(
        `/.netlify/functions/submit-unavailability?calendarId=${encodeURIComponent(calendar.id)}`,
        {
          participantName: currentParticipant,
          unavailableDates: selectedDates
        }
      );

      const message = selectedDates.length === 0
        ? 'Recorded! You\'re available for all dates! 🎉'
        : `Submitted ${selectedDates.length} unavailable date(s)! ✅`;

      showStatus('success', message);

      // Move selected to submitted
      setSubmittedDates(prev => [...new Set([...prev, ...selectedDates])].sort());
      setSelectedDates([]);
    } catch (err) {
      setApiError(err);
      showStatus('error', 'Failed to submit. Please try again.');
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
    setApiError(null);

    try {
      await apiPost(
        `/.netlify/functions/reset-unavailability?calendarId=${encodeURIComponent(calendar.id)}&participant=${encodeURIComponent(currentParticipant)}`,
        {}
      );

      showStatus('success', 'Your dates have been reset!');
      setSelectedDates([]);
      setSubmittedDates([]);
    } catch (err) {
      setApiError(err);
      showStatus('error', 'Failed to reset. Please try again.');
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
      <div className="page-wrapper">
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
      <div className="page-wrapper">
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
    <div className="page-wrapper">
      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <Link to="/" className="logo">
            <span className="logo-icon">📅</span>
            <span>NotThisDate</span>
          </Link>
          <nav className="header-nav">
            <Link to="/about" className="nav-link">About</Link>
          </nav>
        </div>
      </header>

      {/* Calendar Content */}
      <main className="calendar-main">
        <div className="calendar-container">
          {/* Calendar Header */}
          <div className="calendar-header-section">
            <Link to="/dashboard" className="back-link">← Back to Dashboard</Link>
            <h1>{calendar.name}</h1>
            {calendar.description && <p className="calendar-description">{calendar.description}</p>}
            <p className="calendar-date-range">
              📅 {formatDisplayDate(calendar.startDate)} - {formatDisplayDate(calendar.endDate)}
            </p>
          </div>

          {/* Tabs */}
          <div className="tabs-container">
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

            {/* Tab Content */}
            <div className="tab-content">
              {/* Submit Tab */}
              {activeTab === 'submit' && (
                <div className="submit-tab-content">
                  {apiError && (
                    <ErrorMessage 
                      error={apiError}
                      onRetry={() => loadUserSubmissions()}
                      onDismiss={() => setApiError(null)}
                    />
                  )}
                  
                  <ParticipantInput
                    calendar={calendar}
                    currentParticipant={currentParticipant}
                    onParticipantChange={setCurrentParticipant}
                    submittedDates={submittedDates}
                    onReset={handleReset}
                    isResetting={submitting}
                  />

                  {currentParticipant && (
                    <>
                      <div className="date-picker-section">
                        <h3>Select dates you're NOT available</h3>
                        <p className="form-hint">Click or drag to select date ranges. You can select multiple ranges.</p>
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
                          className="btn btn-outline"
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
                <div className="view-tab-content">
                  {apiError && (
                    <ErrorMessage 
                      error={apiError}
                      onRetry={() => loadAllUnavailability()}
                      onDismiss={() => setApiError(null)}
                    />
                  )}
                  
                  <AvailabilityView
                    calendar={calendar}
                    allUnavailability={allUnavailability}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
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


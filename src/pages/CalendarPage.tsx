import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCalendar } from '../hooks/useCalendar';
import { useAuth } from '../context/AuthContext';
import { useI18n, RichText } from '../context/I18nContext';
import LanguageSelector from '../components/LanguageSelector';
import useDocumentTitle from '../hooks/useDocumentTitle';
import DatePicker from '../components/DatePicker';
import DateRangeDisplay from '../components/DateRangeDisplay';
import ParticipantInput from '../components/ParticipantInput';
import AvailabilityView from '../components/AvailabilityView';
import ErrorMessage from '../components/ErrorMessage';
import ConfirmDialog from '../components/ConfirmDialog';
import Footer from '../components/Footer';
import { unavailabilityApi } from '../api/unavailability.api';
import { normalizeSubmissions } from '../core/participants';
import { formatDisplayDate } from '../core/dateRanges';
import type { DateRange, UnavailabilityByDate } from '../types';

function CalendarPage() {
  const { calendarId } = useParams();
  const { calendar, loading, error } = useCalendar(calendarId);
  const { user } = useAuth();
  const { t } = useI18n();

  const [activeTab, setActiveTab] = useState<'submit' | 'view'>('submit');
  const [currentParticipant, setCurrentParticipant] = useState('');
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [submittedDates, setSubmittedDates] = useState<string[]>([]);
  const [allUnavailability, setAllUnavailability] = useState<UnavailabilityByDate>({});
  const [statusMessage, setStatusMessage] = useState<{ type: string; text: string }>({ type: '', text: '' });
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<Error | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  useDocumentTitle(calendar?.name || 'Calendar');

  useEffect(() => {
    if (currentParticipant && calendar?.id) {
      loadUserSubmissions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentParticipant, calendar?.id]);

  useEffect(() => {
    if (calendar?.id && activeTab === 'view') {
      loadAllUnavailability();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calendar?.id, activeTab]);

  const loadUserSubmissions = async () => {
    if (!calendar) return;
    try {
      setApiError(null);
      const data = await unavailabilityApi.getUserSubmissions(calendar.id, currentParticipant);
      const submissions = normalizeSubmissions(data.submissions, currentParticipant);

      const dates: string[] = [];
      submissions.forEach(sub => {
        (sub.dates || []).forEach(d => {
          if (!dates.includes(d)) dates.push(d);
        });
      });
      setSubmittedDates(dates.sort());
    } catch (err) {
      console.error('Failed to load submissions:', err);
      setApiError(err as Error);
      setSubmittedDates([]);
    }
  };

  const loadAllUnavailability = async () => {
    if (!calendar) return;
    try {
      setApiError(null);
      const data = await unavailabilityApi.getForCalendar(calendar.id);

      const unavailabilityByDate: UnavailabilityByDate = {};
      const rawUnavailability = data.unavailability || {};

      Object.entries(rawUnavailability).forEach(([participant, info]) => {
        const dates: string[] = Array.isArray(info) ? info : ((info as any)?.dates || []);
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
      setApiError(err as Error);
      setAllUnavailability({});
    }
  };

  // Handle single date selection (toggle on/off)
  const handleDateSelect = (dateStr: string) => {
    if (submittedDates.includes(dateStr)) return;

    if (selectedDates.includes(dateStr)) {
      setSelectedDates(prev => prev.filter(d => d !== dateStr));
    } else {
      setSelectedDates(prev => [...prev, dateStr].sort());
    }
  };

  const handleRemoveRange = (range: DateRange) => {
    const start = new Date(range.start + 'T12:00:00');
    const end = new Date(range.end + 'T12:00:00');

    const filtered = selectedDates.filter(dateStr => {
      const date = new Date(dateStr + 'T12:00:00');
      return date < start || date > end;
    });

    setSelectedDates(filtered);
  };

  const handleSubmit = async () => {
    if (!currentParticipant || !calendar) {
      showStatus('error', t('calendarSubmit.errorEnterName'));
      return;
    }

    setSubmitting(true);
    setApiError(null);

    try {
      await unavailabilityApi.submit(calendar.id, currentParticipant, selectedDates);

      const message = selectedDates.length === 0
        ? t('calendarSubmit.successAllAvailable')
        : t('calendarSubmit.successSubmitted');

      showStatus('success', message);

      setSubmittedDates(prev => Array.from(new Set([...prev, ...selectedDates])).sort());
      setSelectedDates([]);
    } catch (err) {
      setApiError(err as Error);
      showStatus('error', t('calendarSubmit.errorSubmitFailed'));
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    if (!currentParticipant) {
      showStatus('error', t('calendarSubmit.errorEnterName'));
      return;
    }

    setConfirmReset(true);
  };

  const performReset = async () => {
    setConfirmReset(false);
    if (!calendar) return;

    setSubmitting(true);
    setApiError(null);

    try {
      await unavailabilityApi.reset(calendar.id, currentParticipant);

      showStatus('success', t('calendarSubmit.successReset'));
      setSelectedDates([]);
      setSubmittedDates([]);
    } catch (err) {
      setApiError(err as Error);
      showStatus('error', t('calendarSubmit.errorResetFailed'));
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const showStatus = (type: string, text: string) => {
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
          <p>{t('calendarShell.loading')}</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="page-wrapper">
        <div className="error-state">
          <h2>❌ {t('calendarShell.error.title')}</h2>
          <p>{t('calendarShell.error.desc')}</p>
          <Link to="/" className="btn btn-primary">{t('common.goHome')}</Link>
        </div>
      </div>
    );
  }

  if (!calendar) {
    return null;
  }

  const isOwner = Boolean(
    user &&
    calendar.ownerEmail &&
    user.email.toLowerCase() === calendar.ownerEmail.toLowerCase()
  );

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
            <Link to="/about" className="nav-link">{t('nav.about')}</Link>
            <LanguageSelector />
          </nav>
        </div>
      </header>

      {/* Calendar Content */}
      <main className="calendar-main">
        <div className="calendar-container">
          {/* Calendar Header */}
          <div className="calendar-header-section">
            {isOwner && <Link to="/dashboard" className="back-link">← Back to Dashboard</Link>}
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
                <span className="tab-btn-content">
                  <span className="tab-icon tab-icon-submit" aria-hidden="true"></span>
                  <span>{t('calendarShell.tabs.submit')}</span>
                </span>
              </button>
              <button
                className={`tab-btn ${activeTab === 'view' ? 'active' : ''}`}
                onClick={() => setActiveTab('view')}
              >
                <span className="tab-btn-content">
                  <span className="tab-icon tab-icon-view" aria-hidden="true"></span>
                  <span>{t('calendarShell.tabs.view')}</span>
                </span>
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
                        <RichText as="h3" k="calendarSubmit.selectDatesLabel" />
                        <p className="form-hint">{t('calendarSubmit.selectDatesHint')}</p>
                        <DatePicker
                          startDate={calendar.startDate}
                          endDate={calendar.endDate}
                          selectedDates={selectedDates}
                          submittedDates={submittedDates}
                          blockedDates={calendar.blockedDates}
                          onDateSelect={handleDateSelect}
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
                          {submitting ? t('common.submitting') : t('calendarSubmit.submitBtn')}
                        </button>
                        <button
                          className="btn btn-outline"
                          onClick={handleReset}
                          disabled={submitting}
                        >
                          {t('calendarSubmit.resetBtn')}
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

      {/* Confirm Reset Dialog */}
      {confirmReset && (
        <ConfirmDialog
          title={t('calendarSubmit.confirmReset')}
          message="This will remove all your unavailable dates for this calendar."
          confirmLabel={t('calendarSubmit.resetBtn')}
          onConfirm={performReset}
          onCancel={() => setConfirmReset(false)}
        />
      )}

      <Footer />
    </div>
  );
}

export default CalendarPage;

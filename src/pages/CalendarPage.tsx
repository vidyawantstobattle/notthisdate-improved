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
import AdPlaceholder from '../components/AdPlaceholder';
import { unavailabilityApi } from '../api/unavailability.api';
import { availabilityProfileApi } from '../api/availabilityProfile.api';
import { normalizeSubmissions } from '../core/participants';
import { formatDisplayDate } from '../core/dateRanges';
import {
  getRememberedParticipant,
  rememberParticipant,
  forgetParticipant
} from '../utils/participantMemory';
import type { AvailabilityProfile, DateRange, UnavailabilityByDate } from '../types';

function CalendarPage() {
  const { calendarId } = useParams();
  const { calendar, loading, error } = useCalendar(calendarId);
  const { user, getAuthHeaders } = useAuth();
  const { t } = useI18n();

  const [activeTab, setActiveTab] = useState<'submit' | 'view'>('submit');
  const [currentParticipant, setCurrentParticipant] = useState('');
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [submittedDates, setSubmittedDates] = useState<string[]>([]);
  const [datesToRemove, setDatesToRemove] = useState<string[]>([]);
  const [allUnavailability, setAllUnavailability] = useState<UnavailabilityByDate>({});
  const [knownParticipants, setKnownParticipants] = useState<string[]>([]);
  const [isReturningVisitor, setIsReturningVisitor] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: string; text: string }>({ type: '', text: '' });
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<Error | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [profile, setProfile] = useState<AvailabilityProfile | null>(null);
  const [syncDismissed, setSyncDismissed] = useState(false);
  const [saveAsDefault, setSaveAsDefault] = useState(false);

  useDocumentTitle(calendar?.name || 'Calendar');

  const getToken = async (): Promise<string | null> => {
    const headers = await getAuthHeaders();
    return headers['Authorization']?.replace('Bearer ', '') || null;
  };

  // A signed-in user's saved dates are only a suggestion; they are never applied
  // automatically, so availability can still differ per group.
  useEffect(() => {
    if (!user) {
      setProfile(null);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const token = await getToken();
        const data = await availabilityProfileApi.get(token);
        if (!cancelled) {
          setProfile(data.profile);
          setSaveAsDefault(data.profile.dates.length === 0);
        }
      } catch (err) {
        console.error('Failed to load availability profile:', err);
      }
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Restore the name this visitor last used on this calendar so they don't submit twice.
  useEffect(() => {
    if (!calendar?.id) return;
    const remembered = getRememberedParticipant(calendar.id);
    if (!remembered) return;

    const isDefined = calendar.participantsType === 'defined' && calendar.participants?.length > 0;
    if (isDefined && !calendar.participants.includes(remembered)) {
      forgetParticipant(calendar.id);
      return;
    }

    setCurrentParticipant(remembered);
    setIsReturningVisitor(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calendar?.id]);

  useEffect(() => {
    if (currentParticipant && calendar?.id) {
      rememberParticipant(calendar.id, currentParticipant);
      loadUserSubmissions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentParticipant, calendar?.id]);

  useEffect(() => {
    if (calendar?.id) {
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
      const participantNames: string[] = [];

      Object.entries(rawUnavailability).forEach(([participant, info]) => {
        if (!participantNames.includes(participant)) {
          participantNames.push(participant);
        }
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
      setKnownParticipants(participantNames.sort((a, b) => a.localeCompare(b)));
    } catch (err) {
      console.error('Failed to load unavailability:', err);
      setApiError(err as Error);
      setAllUnavailability({});
      setKnownParticipants([]);
    }
  };

  // Pending dates toggle on/off; already-submitted dates toggle into a removal set.
  const handleDateSelect = (dateStr: string) => {
    if (submittedDates.includes(dateStr)) {
      setDatesToRemove(prev =>
        prev.includes(dateStr) ? prev.filter(d => d !== dateStr) : [...prev, dateStr].sort()
      );
      return;
    }

    setSelectedDates(prev =>
      prev.includes(dateStr) ? prev.filter(d => d !== dateStr) : [...prev, dateStr].sort()
    );
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

  const handleRemoveSubmittedRange = (range: DateRange) => {
    const inRange = submittedDates.filter(d => d >= range.start && d <= range.end);
    setDatesToRemove(prev => Array.from(new Set([...prev, ...inRange])).sort());
  };

  const handleParticipantChange = (name: string) => {
    setCurrentParticipant(name);
    setSelectedDates([]);
    setDatesToRemove([]);
    if (!name) {
      setIsReturningVisitor(false);
      setSubmittedDates([]);
      forgetParticipant(calendar?.id);
    }
  };

  const handleSubmit = async () => {
    if (!currentParticipant || !calendar) {
      showStatus('error', t('calendarSubmit.errorEnterName'));
      return;
    }

    setSubmitting(true);
    setApiError(null);

    try {
      await unavailabilityApi.submit(calendar.id, currentParticipant, selectedDates, datesToRemove);

      const nextSubmitted = Array.from(new Set([...submittedDates, ...selectedDates]))
        .filter(d => !datesToRemove.includes(d))
        .sort();

      if (user && saveAsDefault) {
        try {
          const token = await getToken();
          const { profile: saved } = await availabilityProfileApi.save({ dates: nextSubmitted }, token);
          setProfile(saved);
        } catch (err) {
          // Saving the reusable profile is a convenience; the submission itself already succeeded.
          console.error('Failed to save availability profile:', err);
        }
      }

      let message = t('calendarSubmit.successSubmitted');
      if (datesToRemove.length > 0) {
        message = t('calendarSubmit.successUpdated');
      } else if (selectedDates.length === 0) {
        message = t('calendarSubmit.successAllAvailable');
      }

      showStatus('success', message);

      setSubmittedDates(nextSubmitted);
      setSelectedDates([]);
      setDatesToRemove([]);
      loadAllUnavailability();
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
      setDatesToRemove([]);
      loadAllUnavailability();
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

  const blockedSet = new Set(calendar.blockedDates || []);

  // Only the saved dates that actually fit this calendar are worth offering.
  const syncCandidates = (profile?.dates || []).filter(d =>
    d >= calendar.startDate &&
    d <= calendar.endDate &&
    !blockedSet.has(d) &&
    !selectedDates.includes(d)
  );

  // Offered once per calendar, and only before the first submission, so a group
  // with different availability is never nudged after they've answered.
  const showSyncOffer = Boolean(
    user &&
    currentParticipant &&
    submittedDates.length === 0 &&
    syncCandidates.length > 0 &&
    !syncDismissed &&
    !profile?.dismissedCalendars.includes(calendar.id)
  );

  const applySync = () => {
    setSelectedDates(prev => Array.from(new Set([...prev, ...syncCandidates])).sort());
    setSyncDismissed(true);
  };

  const dismissSync = async () => {
    setSyncDismissed(true);
    try {
      const token = await getToken();
      await availabilityProfileApi.save({ dismissCalendarId: calendar.id }, token);
    } catch (err) {
      console.error('Failed to record sync preference:', err);
    }
  };

  const pendingChanges = selectedDates.length + datesToRemove.length;

  return (
    <div className="page-wrapper">
      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <Link to="/" className="logo">
            <img src="/images/date_range_outline.svg" alt="Calendar" className="logo-icon" />
            <span>{t('app.name')}</span>
          </Link>
          <nav className="header-nav">
            <Link to="/about" className="nav-link">{t('nav.about')}</Link>
            <LanguageSelector />
          </nav>
        </div>
      </header>

      {/* Calendar Content */}
      <main className="calendar-main">
        <div className="calendar-layout">
          <div className="calendar-rail">
            <AdPlaceholder variant="rail" />
          </div>

          <div className="calendar-container">
          {/* Calendar Header */}
          <div className="calendar-header-section">
            {isOwner && <Link to="/dashboard" className="back-link">← Back to Dashboard</Link>}
            <h1>{calendar.name}</h1>
            {calendar.description && <p className="calendar-description">{calendar.description}</p>}
            <p className="calendar-date-range">
              <span className="meta-icon date-range"></span>
              {formatDisplayDate(calendar.startDate)} - {formatDisplayDate(calendar.endDate)}
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
                    onParticipantChange={handleParticipantChange}
                    submittedDates={submittedDates}
                    knownParticipants={knownParticipants}
                    isReturningVisitor={isReturningVisitor}
                  />

                  {currentParticipant && (
                    <>
                      {showSyncOffer && (
                        <div className="sync-offer" role="region" aria-label={t('calendarSubmit.sync.title')}>
                          <div className="sync-offer-body">
                            <h4>{t('calendarSubmit.sync.title')}</h4>
                            <p>{t('calendarSubmit.sync.desc', { count: syncCandidates.length })}</p>
                          </div>
                          <div className="sync-offer-actions">
                            <button type="button" className="btn btn-primary btn-small" onClick={applySync}>
                              {t('calendarSubmit.sync.apply')}
                            </button>
                            <button type="button" className="btn btn-outline btn-small" onClick={dismissSync}>
                              {t('calendarSubmit.sync.dismiss')}
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="date-picker-section">
                        <RichText as="h3" k="calendarSubmit.selectDatesLabel" />
                        <p className="form-hint">{t('calendarSubmit.selectDatesHint')}</p>
                        <DatePicker
                          startDate={calendar.startDate}
                          endDate={calendar.endDate}
                          selectedDates={selectedDates}
                          submittedDates={submittedDates}
                          datesToRemove={datesToRemove}
                          blockedDates={calendar.blockedDates}
                          blockedDateReasons={calendar.blockedDateReasons}
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
                          <DateRangeDisplay
                            dates={submittedDates}
                            onRemoveRange={handleRemoveSubmittedRange}
                          />
                        </div>
                      )}

                      {datesToRemove.length > 0 && (
                        <div className="removal-dates-section">
                          <h3>{t('calendarSubmit.removal.title', { count: datesToRemove.length })}</h3>
                          <p className="form-hint">{t('calendarSubmit.removal.hint')}</p>
                          <button
                            type="button"
                            className="btn btn-outline btn-small"
                            onClick={() => setDatesToRemove([])}
                          >
                            {t('calendarSubmit.removal.undo')}
                          </button>
                        </div>
                      )}

                      {user && (
                        <label className="checkbox-option save-default-option">
                          <input
                            type="checkbox"
                            checked={saveAsDefault}
                            onChange={e => setSaveAsDefault(e.target.checked)}
                            disabled={submitting}
                          />
                          <span>
                            <strong>{t('calendarSubmit.saveDefault.label')}</strong>
                            <span className="form-hint">{t('calendarSubmit.saveDefault.hint')}</span>
                          </span>
                        </label>
                      )}

                      {statusMessage.text && (
                        <div className={`status-message ${statusMessage.type}`}>
                          {statusMessage.text}
                        </div>
                      )}

                      <div className="action-buttons">
                        <button
                          className="btn btn-primary btn-large submit-availability-btn"
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

                      {/* Mobile-only: keeps the submit action in view so pending dates aren't left unsubmitted. */}
                      <div className="mobile-submit-bar" role="region" aria-label={t('calendarSubmit.submitBtn')}>
                        <span className="mobile-submit-bar-count">
                          {t('calendarSubmit.pendingCount', { count: pendingChanges })}
                        </span>
                        <button
                          className="btn btn-primary"
                          onClick={handleSubmit}
                          disabled={submitting || pendingChanges === 0}
                        >
                          {submitting ? t('common.submitting') : t('calendarSubmit.submitBtn')}
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

          <div className="calendar-rail">
            <AdPlaceholder variant="rail" />
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

import { useState, useEffect, useRef, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, consumePendingAction } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';
import LanguageSelector from '../components/LanguageSelector';
import useDocumentTitle from '../hooks/useDocumentTitle';
import { calendarsApi } from '../api/calendars.api';
import { useToast } from '../context/ToastContext';
import ErrorMessage from '../components/ErrorMessage';
import ConfirmDialog from '../components/ConfirmDialog';
import TagsInput from '../components/TagsInput';
import Footer from '../components/Footer';
import { formatDisplayDate } from '../core/dateRanges';
import type { Calendar, CreateCalendarInput, ParticipantsType } from '../types';

function DashboardPage() {
  const { user, loading, logout, getAuthHeaders } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [calendars, setCalendars] = useState<Calendar[]>([]);
  const [loadingCalendars, setLoadingCalendars] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [editingParticipantsCalendarId, setEditingParticipantsCalendarId] = useState<string | null>(null);

  useDocumentTitle('Dashboard');

  useEffect(() => {
    if (!loading && !user) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user && !loading) {
      loadUserCalendars();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading]);

  // Replay a create-calendar intent parked before the user signed up.
  useEffect(() => {
    if (user && !loading && consumePendingAction() === 'createCalendar') {
      setShowCreateForm(true);
    }
  }, [user, loading]);

  const getToken = async (): Promise<string | null> => {
    const headers = await getAuthHeaders();
    return headers['Authorization']?.replace('Bearer ', '') || null;
  };

  const loadUserCalendars = async () => {
    try {
      setLoadingCalendars(true);
      setError(null);
      const token = await getToken();
      const data = await calendarsApi.list(token);
      setCalendars(Array.isArray(data) ? data : data.calendars || []);
    } catch (err) {
      console.error('Failed to load calendars:', err);
      setError(err as Error);
      setCalendars([]);
    } finally {
      setLoadingCalendars(false);
    }
  };

  const handleDeleteCalendar = (calendarId: string) => {
    setConfirmDeleteId(calendarId);
  };

  const performDeleteCalendar = async () => {
    const calendarId = confirmDeleteId;
    setConfirmDeleteId(null);
    if (!calendarId) return;

    try {
      setDeletingId(calendarId);
      const token = await getToken();
      await calendarsApi.remove(calendarId, token);
      setCalendars(calendars.filter(c => c.id !== calendarId));
      showToast(t('dashboard.toast.deleted'));
    } catch (err) {
      console.error('Failed to delete calendar:', err);
      showToast(t('dashboard.toast.deleteFailed'));
    } finally {
      setDeletingId(null);
    }
  };

  const handleShareCalendar = (calendarId: string) => {
    const url = `${window.location.origin}/c/${calendarId}`;
    navigator.clipboard.writeText(url);
    showToast(t('common.linkCopied'));
  };

  const handleParticipantsUpdated = (calendarId: string, participants: string[]) => {
    setCalendars(prev => prev.map(cal => (cal.id === calendarId ? { ...cal, participants } : cal)));
  };

  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="dashboard-page">
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
            <div className="user-menu">
              <span className="user-email">{user.email}</span>
              <button className="btn btn-outline btn-small" onClick={logout}>{t('nav.logout')}</button>
            </div>
          </nav>
        </div>
      </header>

      {/* Dashboard Content */}
      <main className="dashboard-main">
        <div className="dashboard-container">
          <div className="dashboard-header">
            <div className="dashboard-header-content">
              <h1>{t('dashboard.title')}</h1>
              <p className="dashboard-subtitle">{t('dashboard.subtitle')}</p>
            </div>
            <div className="dashboard-actions">
              <button className="btn btn-primary" onClick={() => setShowCreateForm(true)}>
                + {t('dashboard.createNew')}
              </button>
            </div>
          </div>

          {error && (
            <ErrorMessage
              error={error}
              onRetry={loadUserCalendars}
              onDismiss={() => setError(null)}
            />
          )}

          {loadingCalendars ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>{t('dashboard.loading')}</p>
            </div>
          ) : calendars.length > 0 ? (
            <div className="calendars-grid">
              {calendars.map(calendar => (
                <div key={calendar.id} className="calendar-card">
                  <div className="calendar-card-heading">
                    <h3>{calendar.name}</h3>
                    {calendar.participantsType === 'defined' && (
                      <button
                        type="button"
                        className="calendar-card-edit-btn"
                        onClick={() => setEditingParticipantsCalendarId(calendar.id)}
                        title={t('dashboard.card.editParticipants')}
                        aria-label={t('dashboard.card.editParticipants')}
                      >
                        <img src="/images/setting_outline.svg" alt="" />
                      </button>
                    )}
                  </div>
                  {calendar.description && (
                    <p className="calendar-card-description">{calendar.description}</p>
                  )}
                  <div className="calendar-card-meta">
                    <span className="meta-item">
                      📅 {formatDisplayDate(calendar.startDate)} - {formatDisplayDate(calendar.endDate)}
                    </span>
                    <span className="meta-item">
                      👥 {(() => {
                        const submittedCount = calendar.submittedParticipantsCount || 0;
                        const totalParticipants = Math.max(calendar.participants?.length || 0, submittedCount);
                        return calendar.participantsType === 'defined'
                          ? t('dashboard.card.submitted', { submitted: submittedCount, total: totalParticipants })
                          : t('dashboard.card.joined', { count: submittedCount });
                      })()}
                    </span>
                  </div>
                  <div className="calendar-card-actions">
                    <button
                      className="btn btn-primary btn-small"
                      onClick={() => navigate(`/c/${calendar.id}`)}
                      disabled={deletingId === calendar.id}
                    >
                      {t('dashboard.card.open')}
                    </button>
                    <button
                      className="btn btn-outline btn-small"
                      onClick={() => handleShareCalendar(calendar.id)}
                      disabled={deletingId === calendar.id}
                    >
                      {t('dashboard.card.shareLink')}
                    </button>
                    <button
                      className="btn btn-danger btn-small"
                      onClick={() => handleDeleteCalendar(calendar.id)}
                      disabled={deletingId !== null}
                    >
                      {deletingId === calendar.id ? t('common.loading') : t('dashboard.card.delete')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">📅</div>
              <h3>{t('dashboard.empty.title')}</h3>
              <p>{t('dashboard.empty.desc')}</p>
              <button className="btn btn-primary" onClick={() => setShowCreateForm(true)}>
                {t('dashboard.empty.cta')}
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Create Calendar Modal */}
      {showCreateForm && (
        <CreateCalendarModal
          onClose={() => setShowCreateForm(false)}
          onCalendarCreated={async () => {
            setLoadingCalendars(true);
            setShowCreateForm(false);
            await loadUserCalendars();
            setLoadingCalendars(false);
          }}
          getAuthHeaders={getAuthHeaders}
        />
      )}

      {/* Confirm Delete Dialog */}
      {confirmDeleteId && (
        <ConfirmDialog
          title={t('dashboard.confirmDelete.title')}
          message={t('dashboard.confirmDelete.message')}
          confirmLabel={t('dashboard.confirmDelete.confirmLabel')}
          onConfirm={performDeleteCalendar}
          onCancel={() => setConfirmDeleteId(null)}
        />
      )}

      {/* Edit Participants Modal */}
      {editingParticipantsCalendarId && (
        <EditParticipantsModal
          calendar={calendars.find(cal => cal.id === editingParticipantsCalendarId)!}
          onClose={() => setEditingParticipantsCalendarId(null)}
          onSaved={(participants) => {
            handleParticipantsUpdated(editingParticipantsCalendarId, participants);
            setEditingParticipantsCalendarId(null);
            showToast(t('dashboard.editParticipants.saved'));
          }}
          getAuthHeaders={getAuthHeaders}
        />
      )}

      <Footer />
    </div>
  );
}

interface CreateCalendarModalProps {
  onClose: () => void;
  onCalendarCreated: () => Promise<void>;
  getAuthHeaders: () => Promise<Record<string, string>>;
}

// Create Calendar Modal Component
function CreateCalendarModal({ onClose, onCalendarCreated, getAuthHeaders }: CreateCalendarModalProps) {
  const { t } = useI18n();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: ''
  });
  const [participantsType, setParticipantsType] = useState<ParticipantsType>('defined');
  const [participants, setParticipants] = useState<string[]>([]);
  const [requireEmailVerification, setRequireEmailVerification] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const nameInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('Please enter a calendar name');
      return;
    }
    if (!formData.startDate || !formData.endDate) {
      setError(t('dashboard.createModal.errorMissingDates'));
      return;
    }
    if (formData.startDate > formData.endDate) {
      setError(t('dashboard.createModal.errorEndBeforeStart'));
      return;
    }
    if (participantsType === 'defined' && participants.length === 0) {
      setError(t('dashboard.createModal.errorNoParticipants'));
      return;
    }

    setSubmitting(true);
    try {
      const headers = await getAuthHeaders();
      const token = headers['Authorization']?.replace('Bearer ', '') || null;
      const input: CreateCalendarInput = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        dateRangeType: 'custom',
        startDate: formData.startDate,
        endDate: formData.endDate,
        participantsType,
        participants: participantsType === 'defined' ? participants : [],
        requireEmailVerification: participantsType === 'open' ? requireEmailVerification : false
      };
      await calendarsApi.create(input, token);
      await onCalendarCreated();
    } catch (err) {
      setError(t('dashboard.createModal.errorGeneric', { message: (err as Error).message || '' }));
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  // Set default dates (today + 3 months)
  useEffect(() => {
    const today = new Date();
    const threeMonthsLater = new Date();
    threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3);

    setFormData(prev => ({
      ...prev,
      startDate: formatDateInput(today),
      endDate: formatDateInput(threeMonthsLater)
    }));

    if (nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, []);

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="create-calendar-title">
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close dialog">&times;</button>

        <h2 id="create-calendar-title">{t('dashboard.createModal.title')}</h2>
        <p className="modal-subtitle">{t('dashboard.createModal.subtitle')}</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="cal-name">{t('dashboard.createModal.nameLabel')}</label>
            <input
              ref={nameInputRef}
              id="cal-name"
              type="text"
              value={formData.name}
              placeholder={t('dashboard.createModal.namePlaceholder')}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              required
              disabled={submitting}
            />
          </div>

          <div className="form-group">
            <label htmlFor="cal-desc">{t('dashboard.createModal.descLabel')}</label>
            <textarea
              id="cal-desc"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder={t('dashboard.createModal.descPlaceholder')}
              rows={3}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="cal-start">{t('dashboard.createModal.startDate')}</label>
              <input
                id="cal-start"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label htmlFor="cal-end">{t('dashboard.createModal.endDate')}</label>
              <input
                id="cal-end"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label>{t('dashboard.createModal.participantsLabel')}</label>
            <div className="radio-group">
              <label className="radio-option">
                <input
                  type="radio"
                  name="participants-type"
                  value="defined"
                  checked={participantsType === 'defined'}
                  onChange={() => setParticipantsType('defined')}
                  disabled={submitting}
                />
                <span>{t('dashboard.createModal.specificPeople')}</span>
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  name="participants-type"
                  value="open"
                  checked={participantsType === 'open'}
                  onChange={() => setParticipantsType('open')}
                  disabled={submitting}
                />
                <span>{t('dashboard.createModal.anyoneWithLink')}</span>
              </label>
            </div>
          </div>

          {participantsType === 'defined' ? (
            <div className="form-group">
              <label htmlFor="cal-participants">{t('dashboard.createModal.participantsLabel')}</label>
              <TagsInput
                id="cal-participants"
                tags={participants}
                onChange={setParticipants}
                placeholder={t('dashboard.createModal.participantsPlaceholder')}
                disabled={submitting}
              />
              <p className="form-hint">{t('dashboard.createModal.participantsHint')}</p>
            </div>
          ) : (
            <div className="form-group">
              <label className="checkbox-option">
                <input
                  type="checkbox"
                  checked={requireEmailVerification}
                  onChange={(e) => setRequireEmailVerification(e.target.checked)}
                  disabled={submitting}
                />
                <span>{t('dashboard.createModal.requireVerification')}</span>
              </label>
              <p className="form-hint">{t('dashboard.createModal.verificationHint')}</p>
            </div>
          )}

          {error && <div className="form-error">{error}</div>}

          <div className="form-actions">
            <button type="button" className="btn btn-outline" onClick={onClose} disabled={submitting}>
              {t('common.cancel')}
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? t('common.creating') : t('dashboard.createModal.submit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface EditParticipantsModalProps {
  calendar: Calendar;
  onClose: () => void;
  onSaved: (participants: string[]) => void;
  getAuthHeaders: () => Promise<Record<string, string>>;
}

function EditParticipantsModal({ calendar, onClose, onSaved, getAuthHeaders }: EditParticipantsModalProps) {
  const { t } = useI18n();
  const [participants, setParticipants] = useState<string[]>([...(calendar.participants || [])]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (participants.length === 0) {
      setError(t('dashboard.editParticipants.errorEmpty'));
      return;
    }

    setSaving(true);
    setError('');
    try {
      const headers = await getAuthHeaders();
      const token = headers['Authorization']?.replace('Bearer ', '') || null;
      const result = await calendarsApi.updateParticipants(calendar.id, participants, token);
      onSaved(result.participants);
    } catch (err) {
      setError((err as Error).message || t('dashboard.editParticipants.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="edit-participants-title">
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close dialog">&times;</button>

        <h2 id="edit-participants-title">{t('dashboard.editParticipants.title')}</h2>
        <p className="modal-subtitle">{t('dashboard.editParticipants.desc')}</p>

        <div className="form-group">
          <TagsInput
            tags={participants}
            onChange={setParticipants}
            placeholder={t('dashboard.createModal.participantsPlaceholder')}
            disabled={saving}
          />
          <p className="form-hint">{t('dashboard.editParticipants.warning')}</p>
        </div>

        {error && <div className="form-error">{error}</div>}

        <div className="form-actions">
          <button type="button" className="btn btn-outline" onClick={onClose} disabled={saving}>
            {t('common.cancel')}
          </button>
          <button type="button" className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? t('common.saving') : t('common.save')}
          </button>
        </div>
      </div>
    </div>
  );
}

function formatDateInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default DashboardPage;

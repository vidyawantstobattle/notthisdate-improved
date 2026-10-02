import { useState, useEffect } from 'react';
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
import { MAX_PARTICIPANTS } from '../config/site';
import type { Calendar, ParticipantsType } from '../types';

function DashboardPage() {
  const { user, loading, logout, getAuthHeaders } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [calendars, setCalendars] = useState<Calendar[]>([]);
  const [loadingCalendars, setLoadingCalendars] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [editCalendar, setEditCalendar] = useState<Calendar | null>(null);
  const [editParticipants, setEditParticipants] = useState<string[]>([]);
  const [editParticipantsType, setEditParticipantsType] = useState<ParticipantsType>('defined');
  const [savingParticipants, setSavingParticipants] = useState(false);
  const [editParticipantsError, setEditParticipantsError] = useState('');

  useDocumentTitle(t('dashboard.title'));

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
    if (user && !loading) {
      const action = consumePendingAction();
      if (action === 'createCalendar') {
        navigate('/create', { replace: true });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const openEditParticipantsModal = (calendar: Calendar) => {
    setEditCalendar(calendar);
    setEditParticipants([...(calendar.participants || [])]);
    setEditParticipantsType(calendar.participantsType);
    setEditParticipantsError('');
  };

  const saveParticipants = async () => {
    if (!editCalendar) return;

    const makeOpen = editParticipantsType === 'open';

    if (!makeOpen && editParticipants.length === 0) {
      setEditParticipantsError(t('dashboard.editParticipants.errorEmpty'));
      return;
    }

    if (!makeOpen && editParticipants.length > MAX_PARTICIPANTS) {
      setEditParticipantsError(t('dashboard.editParticipants.errorTooMany', { max: MAX_PARTICIPANTS }));
      return;
    }

    setSavingParticipants(true);
    setEditParticipantsError('');

    try {
      const token = await getToken();
      const result = await calendarsApi.updateParticipants(
        editCalendar.id,
        makeOpen ? { participantsType: 'open' } : { participants: editParticipants },
        token
      );

      setCalendars(prev => prev.map(cal => (
        cal.id === editCalendar.id
          ? { ...cal, participants: result.participants, participantsType: result.participantsType }
          : cal
      )));

      setEditCalendar(null);
      setEditParticipants([]);
      showToast(makeOpen ? t('dashboard.editParticipants.opened') : t('dashboard.editParticipants.saved'));
    } catch (err) {
      const message = (err as Error).message || t('dashboard.editParticipants.saveFailed');
      setEditParticipantsError(message);
      console.error('Failed to update participants:', err);
    } finally {
      setSavingParticipants(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>{t('common.loading')}</p>
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
            <span>{t('app.name')}</span>
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
              <button className="btn btn-primary" onClick={() => navigate('/create')}>
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
                  <div className="calendar-card-header calendar-card-heading">
                    <h3>{calendar.name}</h3>
                    {calendar.participantsType === 'defined' && (
                      <button
                        type="button"
                        className="calendar-card-edit-btn"
                        onClick={() => openEditParticipantsModal(calendar)}
                        title={t('dashboard.card.editParticipants')}
                        aria-label={t('dashboard.card.editParticipants')}
                        disabled={deletingId !== null}
                      >
                        <span className="icon-settings" aria-hidden="true"></span>
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
              <button className="btn btn-primary" onClick={() => navigate('/create')}>
                {t('dashboard.empty.cta')}
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Edit Participants Modal */}
      {editCalendar && (
        <EditParticipantsModal
          onClose={() => {
            if (savingParticipants) return;
            setEditCalendar(null);
            setEditParticipants([]);
            setEditParticipantsError('');
          }}
          onSave={saveParticipants}
          participants={editParticipants}
          onParticipantsChange={setEditParticipants}
          participantsType={editParticipantsType}
          onParticipantsTypeChange={setEditParticipantsType}
          error={editParticipantsError}
          saving={savingParticipants}
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

      <Footer />
    </div>
  );
}

interface EditParticipantsModalProps {
  onClose: () => void;
  onSave: () => void;
  participants: string[];
  onParticipantsChange: (participants: string[]) => void;
  participantsType: ParticipantsType;
  onParticipantsTypeChange: (type: ParticipantsType) => void;
  error: string;
  saving: boolean;
}

function EditParticipantsModal({
  onClose,
  onSave,
  participants,
  onParticipantsChange,
  participantsType,
  onParticipantsTypeChange,
  error,
  saving
}: EditParticipantsModalProps) {
  const { t } = useI18n();

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="edit-participants-title">
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label={t('common.closeDialog')} disabled={saving}>&times;</button>

        <h2 id="edit-participants-title">{t('dashboard.editParticipants.title')}</h2>
        <p className="modal-subtitle">{t('dashboard.editParticipants.desc')}</p>

        <div className="form-group">
          <label>{t('dashboard.editParticipants.whoLabel')}</label>
          <div className="create-choice-group">
            <label className={`create-choice${participantsType === 'defined' ? ' is-selected' : ''}`}>
              <input
                type="radio"
                name="edit-participants-type"
                checked={participantsType === 'defined'}
                onChange={() => onParticipantsTypeChange('defined')}
                disabled={saving}
              />
              <span className="create-choice-title">{t('dashboard.editParticipants.specificPeople')}</span>
              <span className="create-choice-hint">{t('dashboard.editParticipants.specificPeopleHint')}</span>
            </label>
            <label className={`create-choice${participantsType === 'open' ? ' is-selected' : ''}`}>
              <input
                type="radio"
                name="edit-participants-type"
                checked={participantsType === 'open'}
                onChange={() => onParticipantsTypeChange('open')}
                disabled={saving}
              />
              <span className="create-choice-title">{t('dashboard.editParticipants.anyoneWithLink')}</span>
              <span className="create-choice-hint">{t('dashboard.editParticipants.anyoneWithLinkHint')}</span>
            </label>
          </div>
        </div>

        {participantsType === 'defined' ? (
          <div className="form-group">
            <label htmlFor="edit-participants-tags">{t('dashboard.createModal.participantsLabel')}</label>
            <TagsInput
              id="edit-participants-tags"
              tags={participants}
              onChange={onParticipantsChange}
              placeholder={t('dashboard.createModal.participantsPlaceholder')}
              disabled={saving}
            />
            <p className="form-hint">{t('dashboard.editParticipants.warning')}</p>
          </div>
        ) : (
          <p className="form-hint form-hint-warning">{t('dashboard.editParticipants.openWarning')}</p>
        )}

        {error && <div className="form-error">{error}</div>}

        <div className="form-actions">
          <button type="button" className="btn btn-outline" onClick={onClose} disabled={saving}>
            {t('common.cancel')}
          </button>
          <button type="button" className="btn btn-primary" onClick={onSave} disabled={saving}>
            {saving ? t('common.saving') : t('common.save')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;

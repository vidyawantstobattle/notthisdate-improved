import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, consumePendingAction } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';
import LanguageSelector from '../components/LanguageSelector';
import useDocumentTitle from '../hooks/useDocumentTitle';
import { calendarsApi } from '../api/calendars.api';
import { accountApi } from '../api/account.api';
import { useToast } from '../context/ToastContext';
import ErrorMessage from '../components/ErrorMessage';
import ConfirmDialog from '../components/ConfirmDialog';
import EditCalendarModal from '../components/EditCalendarModal';
import Footer from '../components/Footer';
import { formatDisplayDate } from '../core/dateRanges';
import type { Calendar } from '../types';

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
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);

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

  // Close account menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const userMenu = document.querySelector('.user-menu-dropdown');
      if (userMenu && !userMenu.contains(event.target as Node)) {
        setShowAccountMenu(false);
      }
    };

    if (showAccountMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showAccountMenu]);

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

  const performDeleteAccount = async () => {
    setDeletingAccount(true);
    try {
      const token = await getToken();
      await accountApi.remove(token);
      setShowDeleteAccount(false);
      showToast(t('dashboard.account.deleted'));
      // The account no longer exists, so the cached session must go too.
      logout();
      navigate('/', { replace: true });
    } catch (err) {
      console.error('Failed to delete account:', err);
      setDeletingAccount(false);
      throw err;
    }
  };

  const handleCalendarSaved = (updated: Calendar, message: string) => {
    setCalendars(prev => prev.map(cal => (cal.id === updated.id ? updated : cal)));
    setEditCalendar(null);
    showToast(message);
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
            <img src="/images/date_range_outline.svg" alt="Calendar" className="logo-icon" />
            <span>{t('app.name')}</span>
          </Link>
          <nav className="header-nav">
            <Link to="/about" className="nav-link">{t('nav.about')}</Link>
            <LanguageSelector />
            <div className="user-menu">
              <div className="user-menu-dropdown">
                <button
                  className="user-email-btn"
                  onClick={() => setShowAccountMenu(!showAccountMenu)}
                  aria-expanded={showAccountMenu}
                  aria-haspopup="menu"
                >
                  {user.email}
                  <span className="dropdown-icon" aria-hidden="true"></span>
                </button>
                {showAccountMenu && (
                  <div className="user-menu-list" role="menu">
                    <button
                      className="user-menu-item is-danger"
                      onClick={() => {
                        setShowDeleteAccount(true);
                        setShowAccountMenu(false);
                      }}
                      role="menuitem"
                    >
                      {t('dashboard.account.deleteCta')}
                    </button>
                  </div>
                )}
              </div>
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
                    <button
                      type="button"
                      className="calendar-card-edit-btn"
                      onClick={() => setEditCalendar(calendar)}
                      title={t('dashboard.card.editCalendar')}
                      aria-label={t('dashboard.card.editCalendar')}
                      disabled={deletingId !== null}
                    >
                      <span className="icon-settings" aria-hidden="true"></span>
                    </button>
                  </div>
                  {calendar.description && (
                    <p className="calendar-card-description">{calendar.description}</p>
                  )}
                  <div className="calendar-card-meta">
                    <span className="meta-item">
                      <span className="meta-icon date-range"></span>
                      {formatDisplayDate(calendar.startDate)} - {formatDisplayDate(calendar.endDate)}
                    </span>
                    <span className="meta-item">
                      <span className="meta-icon people"></span>
                      {(() => {
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
              <img src="/images/date_range_outline.svg" alt="" className="empty-icon" />
              <h3>{t('dashboard.empty.title')}</h3>
              <p>{t('dashboard.empty.desc')}</p>
              <button className="btn btn-primary" onClick={() => navigate('/create')}>
                {t('dashboard.empty.cta')}
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Edit Calendar Modal */}
      {editCalendar && (
        <EditCalendarModal
          calendar={editCalendar}
          getToken={getToken}
          onClose={() => setEditCalendar(null)}
          onSaved={handleCalendarSaved}
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

      {showDeleteAccount && (
        <DeleteAccountModal
          email={user.email}
          calendarCount={calendars.length}
          deleting={deletingAccount}
          onConfirm={performDeleteAccount}
          onClose={() => {
            if (deletingAccount) return;
            setShowDeleteAccount(false);
          }}
        />
      )}
    </div>
  );
}

interface DeleteAccountModalProps {
  email: string;
  calendarCount: number;
  deleting: boolean;
  onConfirm: () => Promise<void>;
  onClose: () => void;
}

// Erasure is irreversible and wipes other people's submissions too, so it is
// gated behind retyping the account email rather than a single click.
function DeleteAccountModal({ email, calendarCount, deleting, onConfirm, onClose }: DeleteAccountModalProps) {
  const { t } = useI18n();
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');

  const matches = confirmation.trim().toLowerCase() === email.trim().toLowerCase();

  const handleConfirm = async () => {
    if (!matches) {
      setError(t('dashboard.account.confirmMismatch'));
      return;
    }
    setError('');
    try {
      await onConfirm();
    } catch {
      setError(t('dashboard.account.deleteFailed'));
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="delete-account-title">
      <div className="modal-content confirm-modal-content" onClick={(e) => e.stopPropagation()}>
        <h2 id="delete-account-title">{t('dashboard.account.modalTitle')}</h2>
        <p>{t('dashboard.account.modalWarning', { count: calendarCount })}</p>

        <div className="form-group">
          <label htmlFor="delete-account-confirm">
            {t('dashboard.account.confirmPrompt')}
          </label>
          <input
            id="delete-account-confirm"
            type="email"
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            placeholder={email}
            autoComplete="off"
            disabled={deleting}
          />
        </div>

        {error && <p className="form-error">{error}</p>}

        <div className="modal-footer">
          <button className="btn btn-outline" onClick={onClose} disabled={deleting}>
            {t('common.cancel')}
          </button>
          <button className="btn btn-danger" onClick={handleConfirm} disabled={!matches || deleting}>
            {deleting ? t('dashboard.account.deleting') : t('dashboard.account.confirmLabel')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;

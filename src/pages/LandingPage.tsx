import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, setPendingAction, setPendingCalendarDraft, type PendingCalendarDraft } from '../context/AuthContext';
import { useI18n, RichText } from '../context/I18nContext';
import LanguageSelector from '../components/LanguageSelector';
import useDocumentTitle from '../hooks/useDocumentTitle';
import TagsInput from '../components/TagsInput';
import BlockedDatesInput from '../components/BlockedDatesInput';
import Footer from '../components/Footer';
import type { ParticipantsType } from '../types';

function LandingPage() {
  const { user, loading, login, signup, logout } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [showCreateDraftModal, setShowCreateDraftModal] = useState(false);

  const startCreateCalendar = () => {
    setShowCreateDraftModal(true);
  };

  const continueToSignup = (draft: PendingCalendarDraft) => {
    setPendingCalendarDraft(draft);
    setPendingAction('createCalendar');
    setShowCreateDraftModal(false);

    if (user) {
      navigate('/dashboard');
      return;
    }

    signup();
  };

  useDocumentTitle('Reverse Availability Trip Planner', true);

  useEffect(() => {
    if (user && !loading) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  return (
    <div className="landing-page">
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
            {loading ? null : user ? (
              <div className="user-menu">
                <Link to="/dashboard" className="btn btn-outline btn-small">Dashboard</Link>
                <button className="btn btn-outline btn-small" onClick={logout}>{t('nav.logout')}</button>
              </div>
            ) : (
              <div className="auth-buttons">
                <button className="btn btn-outline" onClick={login}>{t('nav.login')}</button>
                <button className="btn btn-primary" onClick={signup}>{t('nav.signup')}</button>
              </div>
            )}
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="hero">
        <div className="hero-content">
          <h1>{t('landing.hero.title')}</h1>
          <RichText as="p" className="hero-subtitle" k="landing.hero.subtitle" />
          <div className="hero-actions">
            <button className="btn btn-primary btn-large" onClick={startCreateCalendar}>{t('common.getStarted')}</button>
            <a href="#how-it-works" className="btn btn-outline btn-large">{t('landing.hero.ctaSecondary')}</a>
          </div>
        </div>
        <div className="hero-illustration">
          <div className="illustration-placeholder">
            <div className="demo-calendar">
              <div className="demo-header">Summer Trip 2026</div>
              <div className="demo-grid">
                {Array(15).fill(0).map((_, i) => (
                  <div
                    key={i}
                    className={`demo-day ${i === 3 || i === 4 || i === 10 ? 'unavailable' : ''} ${i === 7 ? 'selected' : ''}`}
                  >
                    {i + 1}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Background decorations */}
      <div className="hero-bg-decoration" aria-hidden="true">
        <div className="decoration-circle decoration-circle-1"></div>
        <div className="decoration-circle decoration-circle-2"></div>
        <div className="decoration-circle decoration-circle-3"></div>
      </div>

      {/* How It Works */}
      <section id="how-it-works" className="features-section">
        <h2>{t('landing.howItWorks.title')}</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon icon-calendar" aria-hidden="true"></div>
            <h3>{t('landing.howItWorks.step1.title')}</h3>
            <RichText as="p" k="landing.howItWorks.step1.desc" />
          </div>
          <div className="feature-card">
            <div className="feature-icon icon-unhappy" aria-hidden="true"></div>
            <h3>{t('landing.howItWorks.step2.title')}</h3>
            <RichText as="p" k="landing.howItWorks.step2.desc" />
          </div>
          <div className="feature-card">
            <div className="feature-icon icon-search" aria-hidden="true"></div>
            <h3>{t('landing.howItWorks.step3.title')}</h3>
            <RichText as="p" k="landing.howItWorks.step3.desc" />
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="benefits-section">
        <h2>{t('landing.benefits.title')}</h2>
        <div className="benefits-grid">
          <div className="benefit-card">
            <div className="benefit-icon icon-swap" aria-hidden="true"></div>
            <h3>{t('landing.benefits.reverse.title')}</h3>
            <RichText as="p" k="landing.benefits.reverse.desc" />
          </div>
          <div className="benefit-card">
            <div className="benefit-icon icon-happy" aria-hidden="true"></div>
            <h3>{t('landing.benefits.noAccount.title')}</h3>
            <RichText as="p" k="landing.benefits.noAccount.desc" />
          </div>
          <div className="benefit-card">
            <div className="benefit-icon icon-dot" aria-hidden="true"></div>
            <h3>{t('landing.benefits.heatmap.title')}</h3>
            <RichText as="p" k="landing.benefits.heatmap.desc" />
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="use-cases-section">
        <h2>{t('landing.useCases.title')}</h2>
        <div className="use-cases-grid">
          <div className="use-case">
            <span className="use-case-icon">✈️</span>
            <h3>{t('landing.useCases.trips.title')}</h3>
            <p>{t('landing.useCases.trips.desc')}</p>
          </div>
          <div className="use-case">
            <span className="use-case-icon">🎉</span>
            <h3>{t('landing.useCases.social.title')}</h3>
            <p>{t('landing.useCases.social.desc')}</p>
          </div>
          <div className="use-case">
            <span className="use-case-icon">💼</span>
            <h3>{t('landing.useCases.team.title')}</h3>
            <p>{t('landing.useCases.team.desc')}</p>
          </div>
          <div className="use-case">
            <span className="use-case-icon">🏃</span>
            <h3>{t('landing.useCases.sports.title')}</h3>
            <p>{t('landing.useCases.sports.desc')}</p>
          </div>
        </div>
      </section>

      <Footer />

      {showCreateDraftModal && (
        <CreateCalendarDraftModal
          onClose={() => setShowCreateDraftModal(false)}
          onContinue={continueToSignup}
        />
      )}
    </div>
  );
}

interface CreateCalendarDraftModalProps {
  onClose: () => void;
  onContinue: (draft: PendingCalendarDraft) => void;
}

function CreateCalendarDraftModal({ onClose, onContinue }: CreateCalendarDraftModalProps) {
  const { t } = useI18n();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: ''
  });
  const [participantsType, setParticipantsType] = useState<ParticipantsType>('defined');
  const [participants, setParticipants] = useState<string[]>([]);
  const [blockedDates, setBlockedDates] = useState<string[]>([]);
  const [requireEmailVerification, setRequireEmailVerification] = useState(false);
  const [error, setError] = useState('');
  const nameInputRef = useRef<HTMLInputElement>(null);

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

  const handleSubmit = (e: FormEvent) => {
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
    if (blockedDates.some(d => d < formData.startDate || d > formData.endDate)) {
      setError(t('dashboard.createModal.errorBlockedOutOfRange'));
      return;
    }

    onContinue({
      name: formData.name.trim(),
      description: formData.description.trim(),
      startDate: formData.startDate,
      endDate: formData.endDate,
      participantsType,
      participants: participantsType === 'defined' ? participants : [],
      requireEmailVerification: participantsType === 'open' ? requireEmailVerification : false,
      blockedDates
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="create-calendar-title">
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close dialog">&times;</button>

        <h2 id="create-calendar-title">{t('dashboard.createModal.title')}</h2>
        <p className="modal-subtitle">{t('dashboard.createModal.subtitle')}</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="landing-cal-name">{t('dashboard.createModal.nameLabel')}</label>
            <input
              ref={nameInputRef}
              id="landing-cal-name"
              type="text"
              value={formData.name}
              placeholder={t('dashboard.createModal.namePlaceholder')}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="landing-cal-desc">{t('dashboard.createModal.descLabel')}</label>
            <textarea
              id="landing-cal-desc"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder={t('dashboard.createModal.descPlaceholder')}
              rows={3}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="landing-cal-start">{t('dashboard.createModal.startDate')}</label>
              <input
                id="landing-cal-start"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label htmlFor="landing-cal-end">{t('dashboard.createModal.endDate')}</label>
              <input
                id="landing-cal-end"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="landing-cal-blocked-date">{t('dashboard.createModal.blockedDatesLabel')}</label>
            <BlockedDatesInput
              id="landing-cal-blocked-date"
              dates={blockedDates}
              onChange={setBlockedDates}
              min={formData.startDate}
              max={formData.endDate}
            />
            <p className="form-hint">{t('dashboard.createModal.blockedDatesHint')}</p>
          </div>

          <div className="form-group">
            <label>{t('dashboard.createModal.participantsLabel')}</label>
            <div className="radio-group">
              <label className="radio-option">
                <input
                  type="radio"
                  name="landing-participants-type"
                  value="defined"
                  checked={participantsType === 'defined'}
                  onChange={() => setParticipantsType('defined')}
                />
                <span>{t('dashboard.createModal.specificPeople')}</span>
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  name="landing-participants-type"
                  value="open"
                  checked={participantsType === 'open'}
                  onChange={() => setParticipantsType('open')}
                />
                <span>{t('dashboard.createModal.anyoneWithLink')}</span>
              </label>
            </div>
          </div>

          {participantsType === 'defined' ? (
            <div className="form-group">
              <label htmlFor="landing-cal-participants">{t('dashboard.createModal.participantsLabel')}</label>
              <TagsInput
                id="landing-cal-participants"
                tags={participants}
                onChange={setParticipants}
                placeholder={t('dashboard.createModal.participantsPlaceholder')}
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
                />
                <span>{t('dashboard.createModal.requireVerification')}</span>
              </label>
              <p className="form-hint">{t('dashboard.createModal.verificationHint')}</p>
            </div>
          )}

          {error && <div className="form-error">{error}</div>}

          <div className="form-actions">
            <button type="button" className="btn btn-outline" onClick={onClose}>
              {t('common.cancel')}
            </button>
            <button type="submit" className="btn btn-primary">
              {t('nav.signup')}
            </button>
          </div>
        </form>
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

export default LandingPage;

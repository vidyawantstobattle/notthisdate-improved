import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useI18n, RichText } from '../context/I18nContext';
import LanguageSelector from '../components/LanguageSelector';
import useDocumentTitle from '../hooks/useDocumentTitle';
import usePrefersReducedMotion from '../hooks/usePrefersReducedMotion';
import Footer from '../components/Footer';
import { getAvailabilityColor, getAvailabilityTextColor, getGraynessRatio } from '../core/availability';

const CATEGORIES = [
  { key: 'trips', iconClass: 'icon-airplane' },
  { key: 'social', iconClass: 'icon-party' },
  { key: 'team', iconClass: 'icon-meeting' },
  { key: 'sports', iconClass: 'icon-run' },
  { key: 'other', iconClass: 'icon-wildboar' }
] as const;

function LandingPage() {
  const { user, loading, login, signup, logout } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [redirecting, setRedirecting] = useState(false);

  const startCreateCalendar = (category?: string) => {
    navigate(category ? `/create?category=${encodeURIComponent(category)}` : '/create');
  };

  useDocumentTitle(t('landing.useCases.title'), true);

  const primaryCta = user
    ? { label: t('common.goToDashboard'), onClick: () => navigate('/dashboard') }
    : { label: t('common.getStarted'), onClick: () => startCreateCalendar() };

  // Redirect to dashboard after login
  useEffect(() => {
    if (user && !loading && !redirecting) {
      setRedirecting(true);
      navigate('/dashboard', { replace: true });
    }
  }, [user, loading, navigate, redirecting]);

  return (
    <div className="landing-page">
      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <Link to="/" className="logo">
            <img src="/images/date_range_outline.svg" alt="Calendar" className="logo-icon" />
            <span>{t('app.name')}</span>
          </Link>
          <nav className="header-nav">
            {user && <Link to="/dashboard" className="nav-link">{t('nav.dashboard')}</Link>}
            <Link to="/about" className="nav-link">{t('nav.about')}</Link>
            <LanguageSelector />
            {loading ? null : user ? (
              <div className="user-menu">
                <Link to="/dashboard" className="btn btn-outline btn-small">{t('nav.dashboard')}</Link>
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
        <div className="hero-bg-decoration" aria-hidden="true">
          <div className="decoration-circle decoration-circle-1"></div>
          <div className="decoration-circle decoration-circle-2"></div>
          <div className="decoration-circle decoration-circle-3"></div>
        </div>

        <div className="hero-inner">
          <h1>{t('landing.hero.title')}</h1>
          <RichText as="p" className="hero-subtitle" k="landing.hero.subtitle" />

          <div className="hero-categories">
            <h2 className="category-prompt">{t('landing.useCases.title')}</h2>
            <ul className="category-grid">
              {CATEGORIES.map(({ key, iconClass }) => (
                <li key={key}>
                  <button
                    type="button"
                    className="category-tile"
                    onClick={() => startCreateCalendar(key)}
                    title={t(`landing.useCases.${key}.desc`)}
                  >
                    <span className={`category-icon ${iconClass}`} aria-hidden="true"></span>
                    <span className="category-label">{t(`landing.useCases.${key}.title`)}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="hero-actions">
            <button className="btn btn-primary btn-large" onClick={primaryCta.onClick}>{primaryCta.label}</button>
            <a href="#how-it-works" className="btn btn-outline btn-large">{t('landing.hero.ctaSecondary')}</a>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="steps-section">
        <div className="steps-inner">
        <div className="steps-intro">
          <h2>{t('landing.howItWorks.title')}</h2>
        </div>

        <div className="steps-list">
          <article className="step-row">
            <div className="step-text">
              <div className="step-heading">
                <span className="step-badge" aria-hidden="true">1</span>
                <h3>{t('landing.howItWorks.step1.title')}</h3>
              </div>
              <RichText as="p" k="landing.howItWorks.step1.desc" />
            </div>
            <div className="step-visual">
              <DemoCreateForm title={t('landing.demo.title')} />
            </div>
          </article>

          <article className="step-row step-row-reversed">
            <div className="step-text">
              <div className="step-heading">
                <span className="step-badge" aria-hidden="true">2</span>
                <h3>{t('landing.howItWorks.step2.title')}</h3>
              </div>
              <RichText as="p" k="landing.howItWorks.step2.desc" />
            </div>
            <div className="step-visual">
              <DemoSubmitCalendar title={t('landing.demo.title')} />
            </div>
          </article>

          <article className="step-row">
            <div className="step-text">
              <div className="step-heading">
                <span className="step-badge" aria-hidden="true">3</span>
                <h3>{t('landing.howItWorks.step3.title')}</h3>
              </div>
              <RichText as="p" k="landing.howItWorks.step3.desc" />
            </div>
            <div className="step-visual">
              <DemoHeatmapCalendar title={t('landing.demo.title')} />
            </div>
          </article>
        </div>

        <div className="steps-cta">
          <button className="btn btn-primary btn-large" onClick={primaryCta.onClick}>{primaryCta.label}</button>
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

      <Footer />
    </div>
  );
}

// The three demos below are hand-built mock-ups rather than screenshots so they stay
// in sync with the theme variables and translate with the rest of the page.
const DEMO_WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const DEMO_DAYS_IN_MONTH = 31;
// July 2026 starts on a Wednesday, so two blanks lead the grid.
const DEMO_LEADING_BLANKS = 2;

const DEMO_PEOPLE = ['Vidya', 'Arjen', 'Vivian', 'Sahir'];
const DEMO_ALREADY_SUBMITTED = [11, 12, 13];
const DEMO_PICKS = [24, 25];
const DEMO_BEST_DAY = 15;
// One row per participant: the days they can't make. Step 3 folds these in one
// at a time, so the heatmap builds up instead of appearing fully formed.
const DEMO_SUBMISSIONS = [
  [3, 5, 6, 11, 12, 18, 19, 26, 27],
  [4, 5, 6, 11, 12, 13, 18, 19, 20, 24, 27],
  [5, 6, 11, 12, 18, 19, 20, 24, 26, 27, 31],
  [4, 5, 6, 10, 13, 17, 18, 19, 25, 26, 27, 31]
];

// Drives a looping demo timeline. Returns the current step, or null when the
// user prefers reduced motion, which callers read as "show the finished state".
function useDemoLoop(steps: number, intervalMs: number): number | null {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (prefersReducedMotion) return;
    const id = setInterval(() => setStep(current => (current + 1) % steps), intervalMs);
    return () => clearInterval(id);
  }, [prefersReducedMotion, steps, intervalMs]);

  return prefersReducedMotion ? null : step;
}

function DemoPanel({
  title,
  caption,
  legend,
  children
}: {
  title: string;
  caption?: string;
  legend?: { color: string; label: string; outlined?: boolean }[];
  children: React.ReactNode;
}) {
  return (
    <div className="demo-panel" aria-hidden="true">
      <div className="demo-panel-header">
        <span>{title}</span>
        {caption && <span className="demo-panel-caption">{caption}</span>}
      </div>
      <div className="demo-panel-body">{children}</div>
      {legend && (
        <div className="demo-panel-legend">
          {legend.map(({ color, label, outlined }) => (
            <span key={label} className="demo-legend-item">
              <span
                className={`demo-legend-swatch${outlined ? ' is-outlined' : ''}`}
                style={{ background: color }}
              ></span>
              {label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function DemoMonthGrid({ renderDay }: { renderDay: (day: number) => React.ReactNode }) {
  return (
    <div className="demo-month">
      {DEMO_WEEKDAYS.map((label, i) => (
        <span key={`wd-${i}`} className="demo-weekday">{label}</span>
      ))}
      {Array.from({ length: DEMO_LEADING_BLANKS }, (_, i) => (
        <span key={`blank-${i}`} className="demo-cell is-blank"></span>
      ))}
      {Array.from({ length: DEMO_DAYS_IN_MONTH }, (_, i) => renderDay(i + 1))}
    </div>
  );
}

function DemoCreateForm({ title }: { title: string }) {
  const { t } = useI18n();
  // Type the title a character at a time, hold the finished form, start over.
  const step = useDemoLoop(title.length + 14, 130);
  const typed = step === null ? title : title.slice(0, Math.min(step, title.length));

  return (
    <DemoPanel title={t('landing.demo.create.header')}>
      <div className="demo-field">
        <span className="demo-field-label">{t('landing.demo.create.titleLabel')}</span>
        <span className="demo-field-input is-typing">
          {typed}
          <span className="demo-caret"></span>
        </span>
      </div>

      <div className="demo-field-row">
        <div className="demo-field">
          <span className="demo-field-label">{t('landing.demo.create.fromLabel')}</span>
          <span className="demo-field-input">{t('landing.demo.create.fromValue')}</span>
        </div>
        <div className="demo-field">
          <span className="demo-field-label">{t('landing.demo.create.toLabel')}</span>
          <span className="demo-field-input">{t('landing.demo.create.toValue')}</span>
        </div>
      </div>

      <div className="demo-field">
        <span className="demo-field-label">{t('landing.demo.create.participantsLabel')}</span>
        <span className="demo-tag-row">
          {DEMO_PEOPLE.map(person => (
            <span key={person} className="demo-tag">
              {person}<span className="demo-tag-x">×</span>
            </span>
          ))}
        </span>
      </div>

      <span className="demo-cta">{t('landing.demo.create.cta')}</span>
    </DemoPanel>
  );
}

function DemoSubmitCalendar({ title }: { title: string }) {
  const { t } = useI18n();
  // Timeline: tap each date, flip the selection to a submitted answer, hold, loop.
  const step = useDemoLoop(DEMO_PICKS.length + 5, 620);
  const done = step === null;

  const pickedCount = done ? DEMO_PICKS.length : Math.min(step, DEMO_PICKS.length);
  const picked = DEMO_PICKS.slice(0, pickedCount);
  const confirmed = done || step > DEMO_PICKS.length;

  return (
    <DemoPanel
      title={title}
      legend={[
        { color: 'var(--danger-overlay-pending)', label: t('landing.demo.submit.pending'), outlined: true },
        { color: 'var(--danger-color)', label: t('landing.demo.submit.submitted') }
      ]}
    >
      <DemoMonthGrid
        renderDay={day => {
          let state = '';
          if (DEMO_ALREADY_SUBMITTED.includes(day)) {
            state = ' is-submitted';
          } else if (picked.includes(day)) {
            state = confirmed ? ' is-submitted' : ' is-pending';
          }
          // Only the newest pick pops, so the eye follows the selection.
          const isLatest = !confirmed && day === picked[picked.length - 1];
          return (
            <span key={day} className={`demo-cell${state}${isLatest ? ' is-just-picked' : ''}`}>
              {day}
            </span>
          );
        }}
      />
    </DemoPanel>
  );
}

function DemoHeatmapCalendar({ title }: { title: string }) {
  const { t } = useI18n();
  // Timeline: fold in one participant's answers per tick so the heatmap builds
  // up the way it does in real life, then hold the result.
  const step = useDemoLoop(DEMO_SUBMISSIONS.length + 1 + 4, 900);
  const done = step === null;

  const submittedCount = done
    ? DEMO_SUBMISSIONS.length
    : Math.min(step, DEMO_SUBMISSIONS.length);
  const complete = submittedCount === DEMO_SUBMISSIONS.length;

  const unavailableCounts: Record<number, number> = {};
  for (const days of DEMO_SUBMISSIONS.slice(0, submittedCount)) {
    for (const day of days) {
      unavailableCounts[day] = (unavailableCounts[day] || 0) + 1;
    }
  }

  return (
    <DemoPanel
      title={title}
      caption={t('landing.demo.heatmap.progress', {
        count: submittedCount,
        total: DEMO_SUBMISSIONS.length
      })}
      legend={[
        { color: getAvailabilityColor(0), label: t('landing.demo.heatmap.everyone') },
        { color: getAvailabilityColor(0.4), label: t('landing.demo.heatmap.some') },
        { color: getAvailabilityColor(1), label: t('landing.demo.heatmap.most') }
      ]}
    >
      <DemoMonthGrid
        renderDay={day => {
          const ratio = getGraynessRatio(unavailableCounts[day] || 0, DEMO_SUBMISSIONS.length);
          // The winning date is only worth calling out once everyone has answered.
          const isBest = complete && day === DEMO_BEST_DAY;
          return (
            <span
              key={day}
              className={`demo-cell is-heat${isBest ? ' is-best' : ''}`}
              style={{ background: getAvailabilityColor(ratio), color: getAvailabilityTextColor(ratio) }}
            >
              {day}
            </span>
          );
        }}
      />
    </DemoPanel>
  );
}

export default LandingPage;

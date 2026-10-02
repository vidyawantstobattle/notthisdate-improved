import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useI18n, RichText } from '../context/I18nContext';
import LanguageSelector from '../components/LanguageSelector';
import useDocumentTitle from '../hooks/useDocumentTitle';
import Footer from '../components/Footer';
import { getAvailabilityColor, getAvailabilityTextColor, getGraynessRatio } from '../core/availability';

const CATEGORIES = [
  { key: 'trips', icon: '✈️' },
  { key: 'social', icon: '🎉' },
  { key: 'team', icon: '💼' },
  { key: 'sports', icon: '🏃' },
  { key: 'other', icon: '📅' }
] as const;

function LandingPage() {
  const { user, loading, login, signup, logout } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();

  const startCreateCalendar = (category?: string) => {
    navigate(category ? `/create?category=${encodeURIComponent(category)}` : '/create');
  };

  useDocumentTitle(t('landing.useCases.title'), true);

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
            <span>{t('app.name')}</span>
          </Link>
          <nav className="header-nav">
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
              {CATEGORIES.map(({ key, icon }) => (
                <li key={key}>
                  <button
                    type="button"
                    className="category-tile"
                    onClick={() => startCreateCalendar(key)}
                    title={t(`landing.useCases.${key}.desc`)}
                  >
                    <span className="category-icon" aria-hidden="true">{icon}</span>
                    <span className="category-label">{t(`landing.useCases.${key}.title`)}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="hero-actions">
            <button className="btn btn-primary btn-large" onClick={() => startCreateCalendar()}>{t('common.getStarted')}</button>
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
          <button className="btn btn-primary btn-large" onClick={() => startCreateCalendar()}>{t('common.getStarted')}</button>
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

function DemoPanel({
  title,
  legend,
  children
}: {
  title: string;
  legend?: { color: string; label: string; outlined?: boolean }[];
  children: React.ReactNode;
}) {
  return (
    <div className="demo-panel" aria-hidden="true">
      <div className="demo-panel-header">{title}</div>
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

  return (
    <DemoPanel title={t('landing.demo.create.header')}>
      <div className="demo-field">
        <span className="demo-field-label">{t('landing.demo.create.titleLabel')}</span>
        <span className="demo-field-input is-typing">
          {title}
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
          {['Vidya', 'Arjen', 'Vivian', 'Sahir'].map(person => (
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
  const submitted = [11, 12, 13];
  const pending = [24, 25];

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
          const state = submitted.includes(day)
            ? ' is-submitted'
            : pending.includes(day)
              ? ' is-pending'
              : '';
          return <span key={day} className={`demo-cell${state}`}>{day}</span>;
        }}
      />
    </DemoPanel>
  );
}

function DemoHeatmapCalendar({ title }: { title: string }) {
  const { t } = useI18n();
  // How many of the 4 demo participants are unavailable on each day.
  const unavailableCounts: Record<number, number> = {
    3: 1, 4: 2, 5: 4, 6: 4, 10: 1, 11: 3, 12: 3, 13: 2,
    17: 1, 18: 4, 19: 4, 20: 2, 24: 2, 25: 1, 26: 3, 27: 4, 31: 2
  };
  const bestDay = 15;

  return (
    <DemoPanel
      title={title}
      legend={[
        { color: getAvailabilityColor(0), label: t('landing.demo.heatmap.everyone') },
        { color: getAvailabilityColor(0.4), label: t('landing.demo.heatmap.some') },
        { color: getAvailabilityColor(1), label: t('landing.demo.heatmap.most') }
      ]}
    >
      <DemoMonthGrid
        renderDay={day => {
          const ratio = getGraynessRatio(unavailableCounts[day] || 0, 4);
          return (
            <span
              key={day}
              className={`demo-cell is-heat${day === bestDay ? ' is-best' : ''}`}
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

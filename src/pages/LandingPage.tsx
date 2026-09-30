import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useI18n, RichText } from '../context/I18nContext';
import LanguageSelector from '../components/LanguageSelector';
import useDocumentTitle from '../hooks/useDocumentTitle';
import Footer from '../components/Footer';

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
              <div className="step-icon-panel icon-calendar" aria-hidden="true"></div>
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
              <DemoCalendar title={t('landing.demo.title')} unavailable={[3, 4, 10]} />
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
              <DemoCalendar title={t('landing.demo.title')} unavailable={[3, 4, 10]} selected={7} />
            </div>
          </article>
        </div>

        <div className="steps-cta">
          <button className="btn btn-primary btn-large" onClick={() => startCreateCalendar()}>{t('common.getStarted')}</button>
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

function DemoCalendar({
  title,
  unavailable = [],
  selected
}: {
  title: string;
  unavailable?: number[];
  selected?: number;
}) {
  return (
    <div className="demo-calendar">
      <div className="demo-header">{title}</div>
      <div className="demo-grid">
        {Array.from({ length: 15 }, (_, i) => (
          <div
            key={i}
            className={`demo-day${unavailable.includes(i) ? ' unavailable' : ''}${selected === i ? ' selected' : ''}`}
          >
            {i + 1}
          </div>
        ))}
      </div>
    </div>
  );
}


export default LandingPage;

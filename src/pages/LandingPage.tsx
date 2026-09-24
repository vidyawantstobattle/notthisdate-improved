import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, setPendingAction } from '../context/AuthContext';
import { useI18n, RichText } from '../context/I18nContext';
import LanguageSelector from '../components/LanguageSelector';
import useDocumentTitle from '../hooks/useDocumentTitle';
import Footer from '../components/Footer';

function LandingPage() {
  const { user, loading, login, signup, logout } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();

  const startCreateCalendar = () => {
    setPendingAction('createCalendar');
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
        <div className="features-editorial">
          <article className="feature-spotlight">
            <div className="feature-icon icon-calendar" aria-hidden="true"></div>
            <h3>{t('landing.howItWorks.step1.title')}</h3>
            <RichText as="p" k="landing.howItWorks.step1.desc" />
          </article>
          <div className="feature-rail" role="list">
            <article className="feature-rail-item" role="listitem">
              <div className="feature-icon icon-unhappy" aria-hidden="true"></div>
              <h3>{t('landing.howItWorks.step2.title')}</h3>
              <RichText as="p" k="landing.howItWorks.step2.desc" />
            </article>
            <article className="feature-rail-item" role="listitem">
              <div className="feature-icon icon-search" aria-hidden="true"></div>
              <h3>{t('landing.howItWorks.step3.title')}</h3>
              <RichText as="p" k="landing.howItWorks.step3.desc" />
            </article>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="benefits-section">
        <h2>{t('landing.benefits.title')}</h2>
        <div className="benefits-editorial">
          <article className="benefit-lead">
            <div className="benefit-icon icon-swap" aria-hidden="true"></div>
            <h3>{t('landing.benefits.reverse.title')}</h3>
            <RichText as="p" k="landing.benefits.reverse.desc" />
          </article>
          <div className="benefit-stack" role="list">
            <article className="benefit-card" role="listitem">
              <div className="benefit-icon icon-happy" aria-hidden="true"></div>
              <h3>{t('landing.benefits.noAccount.title')}</h3>
              <RichText as="p" k="landing.benefits.noAccount.desc" />
            </article>
            <article className="benefit-card" role="listitem">
              <div className="benefit-icon icon-dot" aria-hidden="true"></div>
              <h3>{t('landing.benefits.heatmap.title')}</h3>
              <RichText as="p" k="landing.benefits.heatmap.desc" />
            </article>
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
    </div>
  );
}

export default LandingPage;

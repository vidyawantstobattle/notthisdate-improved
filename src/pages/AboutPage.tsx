import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useI18n, RichText } from '../context/I18nContext';
import LanguageSelector from '../components/LanguageSelector';
import useDocumentTitle from '../hooks/useDocumentTitle';
import Footer from '../components/Footer';

function AboutPage() {
  const { user, loading, login, signup, logout } = useAuth();
  const { t } = useI18n();

  useDocumentTitle('About');

  return (
    <div className="about-page">
      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <Link to="/" className="logo">
            <span className="logo-icon">📅</span>
            <span>NotThisDate</span>
          </Link>
          <nav className="header-nav">
            <Link to="/about" className="nav-link active">{t('nav.about')}</Link>
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

      {/* Main Content */}
      <main className="about-main">
        <div className="about-container">
          <section className="about-hero">
            <h1>{t('about.title')}</h1>
            <p className="about-tagline">{t('about.subtitle')}</p>
          </section>

          <section className="about-section">
            <h2>{t('about.mission.title')}</h2>
            <RichText as="p" k="about.mission.p1" />
            <RichText as="p" k="about.mission.p2" />
          </section>

          <section className="about-section">
            <h2>{t('nav.howItWorks')}</h2>
            <div className="how-it-works-grid">
              <div className="how-it-works-item">
                <div className="step-number">1</div>
                <h3>{t('about.howItWorks.step1.title')}</h3>
                <p>{t('about.howItWorks.step1.desc')}</p>
              </div>
              <div className="how-it-works-item">
                <div className="step-number">2</div>
                <h3>{t('about.howItWorks.step2.title')}</h3>
                <p>{t('about.howItWorks.step2.desc')}</p>
              </div>
              <div className="how-it-works-item">
                <div className="step-number">3</div>
                <h3>{t('about.howItWorks.step3.title')}</h3>
                <p>{t('about.howItWorks.step3.desc')}</p>
              </div>
              <div className="how-it-works-item">
                <div className="step-number">4</div>
                <h3>{t('about.howItWorks.step4.title')}</h3>
                <p>{t('about.howItWorks.step4.desc')}</p>
              </div>
            </div>
          </section>

          <section className="about-section">
            <h2>{t('about.whyReverse.title')}</h2>
            <RichText as="p" k="about.whyReverse.p1" />
            <RichText as="p" k="about.whyReverse.p2" />
          </section>

          <section className="about-cta">
            <h2>{t('about.cta.title')}</h2>
            <p>{t('about.cta.desc')}</p>
            <div className="cta-buttons">
              {user ? (
                <Link to="/dashboard" className="btn btn-primary btn-large">
                  {t('about.cta.dashboard')}
                </Link>
              ) : (
                <>
                  <button className="btn btn-primary btn-large" onClick={signup}>
                    {t('common.getStarted')}
                  </button>
                  <button className="btn btn-outline btn-large" onClick={login}>
                    {t('nav.login')}
                  </button>
                </>
              )}
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default AboutPage;

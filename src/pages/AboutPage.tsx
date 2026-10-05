import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useI18n, RichText } from '../context/I18nContext';
import LanguageSelector from '../components/LanguageSelector';
import useDocumentTitle from '../hooks/useDocumentTitle';
import Footer from '../components/Footer';
import { statsApi } from '../api/stats.api';

interface AppStats {
  users: number;
  calendars: number;
  timestamp: string;
}

const STATS_CACHE_KEY = 'notthisdate_app_stats';
const STATS_CACHE_TTL = 3600000; // 1 hour in milliseconds

function AboutPage() {
  const { user, loading, login, signup, logout } = useAuth();
  const { t } = useI18n();
  const [stats, setStats] = useState<AppStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  useDocumentTitle('About');

  useEffect(() => {
    const fetchStats = async () => {
      setLoadingStats(true);
      try {
        // Check cache first
        const cached = localStorage.getItem(STATS_CACHE_KEY);
        if (cached) {
          const { data, timestamp } = JSON.parse(cached);
          const age = Date.now() - timestamp;
          
          if (age < STATS_CACHE_TTL) {
            console.log('Using cached stats:', data);
            setStats(data);
            setLoadingStats(false);
            return;
          }
        }

        // Fetch fresh stats
        console.log('Fetching fresh stats from API...');
        const freshStats = await statsApi.getStats();
        console.log('Fresh stats received:', freshStats);
        
        // Cache the stats with timestamp
        localStorage.setItem(STATS_CACHE_KEY, JSON.stringify({
          data: freshStats,
          timestamp: Date.now()
        }));

        setStats(freshStats);
      } catch (error) {
        console.error('Failed to fetch app statistics:', error);
        // Still use cached data even if fetch fails
        const cached = localStorage.getItem(STATS_CACHE_KEY);
        if (cached) {
          const { data } = JSON.parse(cached);
          console.log('Using stale cached stats due to fetch error:', data);
          setStats(data);
        } else {
          console.log('No cached stats available, stats will be null');
        }
      } finally {
        setLoadingStats(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="about-page">
      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <Link to="/" className="logo">
            <img src="/images/date_range_outline.svg" alt="Calendar" className="logo-icon" />
            <span>{t('app.name')}</span>
          </Link>
          <nav className="header-nav">
            <Link to="/about" className="nav-link active">{t('nav.about')}</Link>
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
              <div className="how-it-works-item">
                <div className="step-number">5</div>
                <h3>{t('about.howItWorks.step5.title')}</h3>
                <p>{t('about.howItWorks.step5.desc')}</p>
              </div>
              <div className="how-it-works-item">
                <div className="step-number">6</div>
                <h3>{t('about.howItWorks.step6.title')}</h3>
                <p>{t('about.howItWorks.step6.desc')}</p>
              </div>
            </div>
          </section>

          <section className="about-section">
            <h2>{t('about.whyReverse.title')}</h2>
            <RichText as="p" k="about.whyReverse.p1" />
            <RichText as="p" k="about.whyReverse.p2" />
          </section>

          <section className="about-section about-stats">
            <h2>{t('about.stats.title')}</h2>
            {loadingStats ? (
              <div className="stats-loading">{t('common.loading')}</div>
            ) : stats !== null ? (
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-number">{stats.users.toLocaleString()}</div>
                  <div className="stat-label">{t('about.stats.users')}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-number">{stats.calendars.toLocaleString()}</div>
                  <div className="stat-label">{t('about.stats.calendars')}</div>
                </div>
              </div>
            ) : (
              <div className="stats-error">{t('about.stats.unavailable')}</div>
            )}
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

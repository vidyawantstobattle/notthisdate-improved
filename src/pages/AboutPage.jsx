import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function AboutPage() {
  const { user, loading, login, signup, logout } = useAuth();

  // Set page title
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
            <Link to="/about" className="nav-link active">About</Link>
            {loading ? null : user ? (
              <div className="user-menu">
                <Link to="/dashboard" className="btn btn-outline btn-small">Dashboard</Link>
                <button className="btn btn-outline btn-small" onClick={logout}>Logout</button>
              </div>
            ) : (
              <div className="auth-buttons">
                <button className="btn btn-outline" onClick={login}>Login</button>
                <button className="btn btn-primary" onClick={signup}>Sign Up</button>
              </div>
            )}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="about-main">
        <div className="about-container">
          <section className="about-hero">
            <h1>About NotThisDate</h1>
            <p className="about-tagline">Simplifying group scheduling, one calendar at a time.</p>
          </section>

          <section className="about-section">
            <h2>Our Mission</h2>
            <p>
              We believe coordinating group availability should be simple, fast, and free.
              NotThisDate was born from frustration with complex scheduling tools that require
              signups, have premium paywalls, or simply take too long to use.
            </p>
            <p>
              Our approach is different: instead of asking everyone when they're available
              (which can be overwhelming), we ask when they're <strong>NOT</strong> available.
              It's faster, more intuitive, and gets you to the perfect date quicker.
            </p>
          </section>

          <section className="about-section">
            <h2>How It Works</h2>
            <div className="how-it-works-grid">
              <div className="how-it-works-item">
                <div className="step-number">1</div>
                <h3>Create a Calendar</h3>
                <p>Set up your event with a date range and invite your group.</p>
              </div>
              <div className="how-it-works-item">
                <div className="step-number">2</div>
                <h3>Share the Link</h3>
                <p>Send participants a simple link - no signup required for them.</p>
              </div>
              <div className="how-it-works-item">
                <div className="step-number">3</div>
                <h3>Mark Unavailability</h3>
                <p>Everyone marks when they CAN'T make it - quick and easy.</p>
              </div>
              <div className="how-it-works-item">
                <div className="step-number">4</div>
                <h3>Find the Best Date</h3>
                <p>See at a glance which dates work best for everyone.</p>
              </div>
            </div>
          </section>

          <section className="about-section">
            <h2>Why "Reverse" Availability?</h2>
            <p>
              Traditional scheduling polls ask you to mark every date you're available.
              But most of us have more free time than busy time - marking availability
              for a 3-month range is tedious!
            </p>
            <p>
              With NotThisDate, you only mark the dates you <em>can't</em> attend.
              For most people, that's just a handful of dates. It's faster, easier,
              and you're done in seconds instead of minutes.
            </p>
          </section>

          <section className="about-cta">
            <h2>Ready to Plan Your Next Event?</h2>
            <p>Get started for free - no credit card required.</p>
            <div className="cta-buttons">
              {user ? (
                <Link to="/dashboard" className="btn btn-primary btn-large">
                  Go to Dashboard
                </Link>
              ) : (
                <>
                  <button className="btn btn-primary btn-large" onClick={signup}>
                    Get Started Free
                  </button>
                  <button className="btn btn-outline btn-large" onClick={login}>
                    Sign In
                  </button>
                </>
              )}
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="app-footer simple">
        <p>© 2026 NotThisDate. Group trip planning made simple.</p>
      </footer>
    </div>
  );
}

export default AboutPage;


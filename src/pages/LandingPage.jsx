import React from 'react';
import { useAuth } from '../context/AuthContext';

function LandingPage() {
  const { user, loading, login, signup, logout } = useAuth();

  return (
    <div className="landing-page">
      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <a href="/" className="logo">
            <span className="logo-icon">📅</span>
            <span>NotThisDate</span>
          </a>
          <nav className="header-nav">
            {loading ? null : user ? (
              <div className="user-menu">
                <span className="user-name">{user.email}</span>
                <button className="btn btn-outline" onClick={logout}>Logout</button>
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

      {/* Hero */}
      <section className="hero">
        <div className="hero-content">
          <h1>Group trip planning,<br />simplified.</h1>
          <p className="hero-subtitle">
            Mark when you're <strong>NOT</strong> available, and we'll find the perfect dates for everyone.
            No more endless back-and-forth polls.
          </p>
          <div className="hero-actions">
            {user ? (
              <button className="btn btn-primary btn-large" onClick={() => alert('Dashboard coming soon!')}>
                Create Calendar
              </button>
            ) : (
              <>
                <button className="btn btn-primary btn-large" onClick={signup}>Get Started Free</button>
                <button className="btn btn-outline btn-large" onClick={login}>Sign In</button>
              </>
            )}
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

      {/* Features */}
      <section className="features-section">
        <h2>Why NotThisDate?</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🚫</div>
            <h3>Reverse Logic</h3>
            <p>Mark when you're NOT available instead of when you are. Faster and more intuitive.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Visual Results</h3>
            <p>See at a glance which dates work for everyone with color-coded availability.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🔗</div>
            <h3>Easy Sharing</h3>
            <p>Share a simple link. No signups required for participants to submit dates.</p>
          </div>
        </div>
      </section>

      {/* Dashboard (for logged in users) */}
      {user && (
        <section className="dashboard-section">
          <div className="dashboard-header">
            <h2>Your Calendars</h2>
            <button className="btn btn-primary">+ Create New</button>
          </div>
          <div className="empty-state">
            <div className="empty-icon">📅</div>
            <h3>No calendars yet</h3>
            <p>Create your first calendar to start planning!</p>
            <button className="btn btn-primary">Create Calendar</button>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="app-footer">
        <p>© 2026 NotThisDate. Group trip planning made simple.</p>
      </footer>
    </div>
  );
}

export default LandingPage;

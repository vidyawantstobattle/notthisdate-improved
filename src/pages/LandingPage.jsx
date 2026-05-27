import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

function LandingPage() {
  const { user, loading, login, signup, logout } = useAuth();
  const navigate = useNavigate();
  const [calendars, setCalendars] = useState([]);
  const [loadingCalendars, setLoadingCalendars] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Load calendars when user logs in
  useEffect(() => {
    if (user && !loading) {
      loadUserCalendars();
    }
  }, [user, loading]);

  const loadUserCalendars = async () => {
    try {
      setLoadingCalendars(true);
      const response = await fetch('/.netlify/functions/get-calendars');
      const data = await response.json();
      setCalendars(Array.isArray(data) ? data : data.calendars || []);
    } catch (err) {
      console.error('Failed to load calendars:', err);
      setCalendars([]);
    } finally {
      setLoadingCalendars(false);
    }
  };

  const handleDeleteCalendar = async (calendarId) => {
    if (!confirm('Are you sure you want to delete this calendar?')) return;

    try {
      const response = await fetch(`/.netlify/functions/delete-calendar?id=${calendarId}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        setCalendars(calendars.filter(c => c.id !== calendarId));
      }
    } catch (err) {
      console.error('Failed to delete calendar:', err);
    }
  };

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
            <a href="/about" className="nav-link">About</a>
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

      {/* Hero - only show when not logged in */}
      {!user && (
        <>
          <section className="hero">
            <div className="hero-content">
              <h1>Group trip planning,<br />simplified.</h1>
              <p className="hero-subtitle">
                Mark when you're <strong>NOT</strong> available, and we'll find the perfect dates for everyone.
                No more endless back-and-forth polls.
              </p>
              <div className="hero-actions">
                <button className="btn btn-primary btn-large" onClick={signup}>Get Started Free</button>
                <button className="btn btn-outline btn-large" onClick={login}>Sign In</button>
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
        </>
      )}

      {/* Dashboard - only show when logged in */}
      {user && (
        <section className="dashboard-section">
          <div className="dashboard-header">
            <h2>Your Calendars</h2>
            <button className="btn btn-primary" onClick={() => setShowCreateForm(true)}>+ Create New</button>
          </div>

          {loadingCalendars ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading your calendars...</p>
            </div>
          ) : calendars.length > 0 ? (
            <div className="calendars-grid">
              {calendars.map(calendar => (
                <div key={calendar.id} className="calendar-card">
                  <h3>{calendar.name}</h3>
                  {calendar.description && <p className="calendar-description">{calendar.description}</p>}
                  <p className="calendar-meta">
                    {calendar.startDate} to {calendar.endDate}
                  </p>
                  <div className="calendar-card-actions">
                    <button
                      className="btn btn-primary btn-small"
                      onClick={() => navigate(`/c/${calendar.id}`)}
                    >
                      View
                    </button>
                    <button
                      className="btn btn-outline btn-small"
                      onClick={() => {
                        const url = `${window.location.origin}/c/${calendar.id}`;
                        navigator.clipboard.writeText(url);
                        alert('Calendar link copied!');
                      }}
                    >
                      Share
                    </button>
                    <button
                      className="btn btn-outline btn-small"
                      onClick={() => handleDeleteCalendar(calendar.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">📅</div>
              <h3>No calendars yet</h3>
              <p>Create your first calendar to start planning!</p>
              <button className="btn btn-primary" onClick={() => setShowCreateForm(true)}>Create Calendar</button>
            </div>
          )}

          {showCreateForm && (
            <CreateCalendarModal
              onClose={() => setShowCreateForm(false)}
              onCalendarCreated={() => {
                setShowCreateForm(false);
                loadUserCalendars();
              }}
            />
          )}
        </section>
      )}

      {/* Footer */}
      <footer className="app-footer">
        <p>© 2026 NotThisDate. Group trip planning made simple.</p>
      </footer>
    </div>
  );
}

// Simple create calendar modal
function CreateCalendarModal({ onClose, onCalendarCreated }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.startDate || !formData.endDate) {
      setError('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/.netlify/functions/create-calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        onCalendarCreated();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to create calendar');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>&times;</button>
        <h3>Create New Calendar</h3>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="cal-name">Calendar Name *</label>
            <input
              id="cal-name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="e.g., Summer Trip 2026"
            />
          </div>

          <div className="form-group">
            <label htmlFor="cal-desc">Description</label>
            <textarea
              id="cal-desc"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Optional description"
              rows="3"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="cal-start">Start Date *</label>
              <input
                id="cal-start"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({...formData, startDate: e.target.value})}
              />
            </div>

            <div className="form-group">
              <label htmlFor="cal-end">End Date *</label>
              <input
                id="cal-end"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({...formData, endDate: e.target.value})}
              />
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="form-actions">
            <button type="button" className="btn btn-outline" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? 'Creating...' : 'Create Calendar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default LandingPage;

import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import useDocumentTitle from '../hooks/useDocumentTitle';
import { apiGet, apiPost, apiDelete } from '../utils/apiClient';
import ErrorMessage from '../components/ErrorMessage';

function DashboardPage() {
  const { user, loading, logout, getAuthHeaders } = useAuth();
  const navigate = useNavigate();
  const [calendars, setCalendars] = useState([]);
  const [loadingCalendars, setLoadingCalendars] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // Set page title
  useDocumentTitle('Dashboard');

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  // Load calendars when user is authenticated
  useEffect(() => {
    if (user && !loading) {
      loadUserCalendars();
    }
  }, [user, loading]);

  const loadUserCalendars = async () => {
    try {
      setLoadingCalendars(true);
      setError(null);
      const headers = await getAuthHeaders();
      const token = headers['Authorization']?.replace('Bearer ', '');
      const data = await apiGet('/.netlify/functions/get-calendars', token);
      setCalendars(Array.isArray(data) ? data : data.calendars || []);
    } catch (err) {
      console.error('Failed to load calendars:', err);
      setError(err);
      setCalendars([]);
    } finally {
      setLoadingCalendars(false);
    }
  };

  const handleDeleteCalendar = async (calendarId) => {
    if (!confirm('Are you sure you want to delete this calendar?')) return;

    try {
      setDeletingId(calendarId);
      const headers = await getAuthHeaders();
      const token = headers['Authorization']?.replace('Bearer ', '');
      await apiDelete(`/.netlify/functions/delete-calendar?id=${calendarId}`, token);
      setCalendars(calendars.filter(c => c.id !== calendarId));
    } catch (err) {
      console.error('Failed to delete calendar:', err);
      alert('Failed to delete calendar. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleShareCalendar = (calendarId) => {
    const url = `${window.location.origin}/c/${calendarId}`;
    navigator.clipboard.writeText(url);
    alert('Calendar link copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="dashboard-page">
      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <Link to="/" className="logo">
            <span className="logo-icon">📅</span>
            <span>NotThisDate</span>
          </Link>
          <nav className="header-nav">
            <Link to="/about" className="nav-link">About</Link>
            <div className="user-menu">
              <span className="user-email">{user.email}</span>
              <button className="btn btn-outline btn-small" onClick={logout}>Logout</button>
            </div>
          </nav>
        </div>
      </header>

      {/* Dashboard Content */}
      <main className="dashboard-main">
        <div className="dashboard-container">
          <div className="dashboard-header">
            <div className="dashboard-header-content">
              <h1>Your Calendars</h1>
              <p className="dashboard-subtitle">Manage your group planning calendars</p>
            </div>
            <div className="dashboard-actions">
              <button
                className="btn btn-primary"
                onClick={() => setShowCreateForm(true)}
              >
                + Create New Calendar
              </button>
            </div>
          </div>

          {error && (
            <ErrorMessage 
              error={error} 
              onRetry={loadUserCalendars}
              onDismiss={() => setError(null)}
            />
          )}

          {loadingCalendars ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading your calendars...</p>
            </div>
          ) : calendars.length > 0 ? (
            <div className="calendars-grid">
              {calendars.map(calendar => (
                <div key={calendar.id} className="calendar-card">
                  <div className="calendar-card-header">
                    <h3>{calendar.name}</h3>
                  </div>
                  {calendar.description && (
                    <p className="calendar-card-description">{calendar.description}</p>
                  )}
                  <div className="calendar-card-meta">
                    <span className="meta-item">
                      📅 {formatDate(calendar.startDate)} - {formatDate(calendar.endDate)}
                    </span>
                    <span className="meta-item">
                      👥 {calendar.participantsType === 'defined'
                        ? `${calendar.participants?.length || 0} participants`
                        : 'Open to anyone'}
                    </span>
                  </div>
                  <div className="calendar-card-actions">
                    <button
                      className="btn btn-primary btn-small"
                      onClick={() => navigate(`/c/${calendar.id}`)}
                      disabled={deletingId === calendar.id}
                    >
                      View
                    </button>
                    <button
                      className="btn btn-outline btn-small"
                      onClick={() => handleShareCalendar(calendar.id)}
                      disabled={deletingId === calendar.id}
                    >
                      Share
                    </button>
                    <button
                      className="btn btn-danger btn-small"
                      onClick={() => handleDeleteCalendar(calendar.id)}
                      disabled={deletingId !== null}
                    >
                      {deletingId === calendar.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">📅</div>
              <h3>No calendars yet</h3>
              <p>Create your first calendar to start coordinating with your group!</p>
              <button
                className="btn btn-primary"
                onClick={() => setShowCreateForm(true)}
              >
                Create Your First Calendar
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Create Calendar Modal */}
      {showCreateForm && (
        <CreateCalendarModal
          onClose={() => setShowCreateForm(false)}
          onCalendarCreated={async () => {
            setLoadingCalendars(true);
            setShowCreateForm(false);
            await loadUserCalendars();
            setLoadingCalendars(false);
          }}
          getAuthHeaders={getAuthHeaders}
        />
      )}
    </div>
  );
}

// Create Calendar Modal Component
function CreateCalendarModal({ onClose, onCalendarCreated, getAuthHeaders }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const nameInputRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('Please enter a calendar name');
      return;
    }
    if (!formData.startDate) {
      setError('Please select a start date');
      return;
    }
    if (!formData.endDate) {
      setError('Please select an end date');
      return;
    }
    if (formData.startDate > formData.endDate) {
      setError('End date must be after start date');
      return;
    }

    setSubmitting(true);
    try {
      const headers = await getAuthHeaders();
      const token = headers['Authorization']?.replace('Bearer ', '');
      await apiPost('/.netlify/functions/create-calendar', {
        name: formData.name.trim(),
        description: formData.description.trim(),
        startDate: formData.startDate,
        endDate: formData.endDate
      }, token);
      await onCalendarCreated();
    } catch (err) {
      setError(err.message || 'Failed to create calendar. Please try again.');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  // Set default dates (today + 3 months)
  useEffect(() => {
    const today = new Date();
    const threeMonthsLater = new Date();
    threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3);

    setFormData(prev => ({
      ...prev,
      startDate: formatDateInput(today),
      endDate: formatDateInput(threeMonthsLater)
    }));
    
    // Focus the first input when modal opens
    if (nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, []);

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="create-calendar-title">
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close dialog">&times;</button>

        <h2 id="create-calendar-title">Create New Calendar</h2>
        <p className="modal-subtitle">Set up a new group availability calendar</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="cal-name">Calendar Name *</label>
            <input
              ref={nameInputRef}
              id="cal-name"
              type="text"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              required
              disabled={submitting}
            />
          </div>

          <div className="form-group">
            <label htmlFor="cal-desc">Description</label>
            <textarea
              id="cal-desc"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="What's this calendar for?"
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

          {error && <div className="form-error">{error}</div>}

          <div className="form-actions">
            <button
              type="button"
              className="btn btn-outline"
              onClick={onClose}
              disabled={submitting}
            >
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

// Helper functions
function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr + 'T12:00:00');
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDateInput(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default DashboardPage;

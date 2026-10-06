import { Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import LandingPage from './pages/LandingPage';
import DashboardPage from './pages/DashboardPage';
import CalendarPage from './pages/CalendarPage';
import AboutPage from './pages/AboutPage';
import CreateCalendarPage from './pages/CreateCalendarPage';
import ErrorBoundary from './components/ErrorBoundary';
import { ToastProvider } from './context/ToastContext';
import { I18nProvider } from './context/I18nContext';
import useCanonicalUrl from './hooks/useCanonicalUrl';
import './styles/index.css';

// Client-side navigation keeps the previous scroll offset, so a link clicked from
// the footer would otherwise drop the user halfway down the next page.
function ScrollManager() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const target = document.getElementById(hash.slice(1));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);

  return null;
}

function App() {
  useCanonicalUrl();

  return (
    <ErrorBoundary>
      <I18nProvider>
        <ToastProvider>
          <div className="app">
            <ScrollManager />
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/create" element={<CreateCalendarPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/c/:calendarId" element={<CalendarPage />} />
            </Routes>
          </div>
        </ToastProvider>
      </I18nProvider>
    </ErrorBoundary>
  );
}

export default App;

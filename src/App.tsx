import { Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import DashboardPage from './pages/DashboardPage';
import CalendarPage from './pages/CalendarPage';
import AboutPage from './pages/AboutPage';
import ErrorBoundary from './components/ErrorBoundary';
import { ToastProvider } from './context/ToastContext';
import './styles/index.css';

function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <div className="app">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/c/:calendarId" element={<CalendarPage />} />
          </Routes>
        </div>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;

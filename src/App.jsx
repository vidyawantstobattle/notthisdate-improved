import React from 'react';
import { Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import DashboardPage from './pages/DashboardPage';
import CalendarPage from './pages/CalendarPage';
import AboutPage from './pages/AboutPage';
import ErrorBoundary from './components/ErrorBoundary';
import './styles/index.css';

function App() {
  return (
    <ErrorBoundary>
      <div className="app">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/c/:calendarId" element={<CalendarPage />} />
        </Routes>
      </div>
    </ErrorBoundary>
  );
}

export default App;

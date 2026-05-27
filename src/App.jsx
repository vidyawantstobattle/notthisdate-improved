import React from 'react';
import { Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import CalendarPage from './pages/CalendarPage';
import './styles/index.css';

function App() {
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/c/:calendarId" element={<CalendarPage />} />
      </Routes>
    </div>
  );
}

export default App;


import React, { useState } from 'react';

function ParticipantInput({ calendar, currentParticipant, onParticipantChange }) {
  const [nameInput, setNameInput] = useState('');
  const [nameConfirmed, setNameConfirmed] = useState(false);

  // Defined participants - show dropdown
  if (calendar?.participantsType === 'defined' && calendar?.participants?.length > 0) {
    return (
      <div className="participant-section">
        <label htmlFor="participant-select">Select your name:</label>
        <select
          id="participant-select"
          className="participant-select"
          value={currentParticipant}
          onChange={(e) => onParticipantChange(e.target.value)}
        >
          <option value="">Select your name...</option>
          {calendar.participants.map((name, idx) => (
            <option key={idx} value={name}>{name}</option>
          ))}
        </select>
        <p className="form-hint">Select your name from the list to submit your unavailable dates.</p>
      </div>
    );
  }

  // Open calendar - name entry
  if (!nameConfirmed) {
    return (
      <div className="participant-section">
        <label htmlFor="participant-name-input">Enter your name:</label>
        <div className="name-input-row">
          <input
            type="text"
            id="participant-name-input"
            className="name-input"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && nameInput.trim()) {
                onParticipantChange(nameInput.trim());
                setNameConfirmed(true);
              }
            }}
            placeholder="Your name"
          />
          <button
            className="btn btn-primary"
            disabled={!nameInput.trim()}
            onClick={() => {
              onParticipantChange(nameInput.trim());
              setNameConfirmed(true);
            }}
          >
            Continue
          </button>
        </div>
        <p className="form-hint">Enter your name to submit your unavailable dates.</p>
      </div>
    );
  }

  // Name confirmed - show with edit option
  return (
    <div className="participant-section">
      <div className="confirmed-participant">
        <span className="participant-label">Submitting as:</span>
        <span className="participant-name">{currentParticipant}</span>
        <button
          type="button"
          className="btn btn-outline btn-small change-name-btn"
          onClick={() => {
            setNameInput(currentParticipant);
            setNameConfirmed(false);
          }}
        >
          Change
        </button>
      </div>
    </div>
  );
}

export default ParticipantInput;


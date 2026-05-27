import React, { useState, useEffect } from 'react';

function ParticipantInput({
  calendar,
  currentParticipant,
  onParticipantChange,
  submittedDates = [],
  onReset,
  isResetting = false
}) {
  const [nameInput, setNameInput] = useState('');
  const [nameConfirmed, setNameConfirmed] = useState(false);

  // If currentParticipant is already set (e.g., from localStorage or parent), mark as confirmed
  useEffect(() => {
    if (currentParticipant && !nameConfirmed) {
      setNameConfirmed(true);
      setNameInput(currentParticipant);
    }
  }, [currentParticipant]);

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
        {currentParticipant && submittedDates.length > 0 && (
          <div className="submission-status">
            <p className="form-hint success">
              ✅ You have already submitted {submittedDates.length} unavailable date(s). You can add more below.
            </p>
            {onReset && (
              <button
                type="button"
                className="btn btn-outline btn-small btn-danger-outline"
                onClick={onReset}
                disabled={isResetting}
              >
                {isResetting ? 'Resetting...' : 'Reset My Dates'}
              </button>
            )}
          </div>
        )}
        {currentParticipant && submittedDates.length === 0 && (
          <p className="form-hint">
            Select dates below to mark when you're NOT available.
          </p>
        )}
        {!currentParticipant && (
          <p className="form-hint">Select your name from the list to submit your unavailable dates.</p>
        )}
      </div>
    );
  }

  // Open calendar - name entry
  if (!nameConfirmed || !currentParticipant) {
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

  // Name confirmed - show with status and edit option
  return (
    <div className="participant-section">
      <div className="confirmed-participant">
        <div className="participant-info">
          <span className="participant-label">Submitting as:</span>
          <span className="participant-name">{currentParticipant}</span>
        </div>
        <button
          type="button"
          className="btn btn-outline btn-small"
          onClick={() => {
            setNameInput(currentParticipant);
            setNameConfirmed(false);
            onParticipantChange('');
          }}
        >
          Change
        </button>
      </div>
      {submittedDates.length > 0 ? (
        <div className="submission-status">
          <p className="form-hint success">
            ✅ You have already submitted {submittedDates.length} unavailable date(s). You can add more below.
          </p>
          {onReset && (
            <button
              type="button"
              className="btn btn-outline btn-small btn-danger-outline"
              onClick={onReset}
              disabled={isResetting}
            >
              {isResetting ? 'Resetting...' : 'Reset My Dates'}
            </button>
          )}
        </div>
      ) : (
        <p className="form-hint">
          Select dates below to mark when you're NOT available.
        </p>
      )}
    </div>
  );
}

export default ParticipantInput;

import { useState, useEffect } from 'react';
import { useI18n } from '../context/I18nContext';
import type { Calendar } from '../types';

interface ParticipantInputProps {
  calendar: Calendar;
  currentParticipant: string;
  onParticipantChange: (name: string) => void;
  submittedDates?: string[];
  onReset?: () => void;
  isResetting?: boolean;
}

function ParticipantInput({
  calendar,
  currentParticipant,
  onParticipantChange,
  submittedDates = [],
  onReset,
  isResetting = false
}: ParticipantInputProps) {
  const { t } = useI18n();
  const [nameInput, setNameInput] = useState('');
  const [nameConfirmed, setNameConfirmed] = useState(false);

  // If currentParticipant is already set (e.g., from localStorage or parent), mark as confirmed
  useEffect(() => {
    if (currentParticipant && !nameConfirmed) {
      setNameConfirmed(true);
      setNameInput(currentParticipant);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentParticipant]);

  // Defined participants - show dropdown
  if (calendar?.participantsType === 'defined' && calendar?.participants?.length > 0) {
    return (
      <div className="participant-section">
        <label htmlFor="participant-select">{t('calendarSubmit.selectNameLabel')}</label>
        <select
          id="participant-select"
          className="participant-select"
          value={currentParticipant}
          onChange={(e) => onParticipantChange(e.target.value)}
        >
          <option value="">{t('calendarSubmit.selectNamePlaceholder')}</option>
          {calendar.participants.map((name, idx) => (
            <option key={idx} value={name}>{name}</option>
          ))}
        </select>
        {currentParticipant && submittedDates.length > 0 && (
          <div className="submission-status">
            <p className="form-hint info">
              {t('calendarSubmit.alreadySubmittedHint', { count: submittedDates.length })}
            </p>
            {onReset && (
              <button
                type="button"
                className="btn btn-outline btn-small btn-danger-outline"
                onClick={onReset}
                disabled={isResetting}
              >
                {isResetting ? t('common.resetting') : t('calendarSubmit.resetBtn')}
              </button>
            )}
          </div>
        )}
        {currentParticipant && submittedDates.length === 0 && (
          <p className="form-hint">{t('calendarSubmit.selectDatesBelowHint')}</p>
        )}
        {!currentParticipant && (
          <p className="form-hint">{t('calendarSubmit.selectNameHint')}</p>
        )}
      </div>
    );
  }

  // Open calendar - name entry
  if (!nameConfirmed || !currentParticipant) {
    return (
      <div className="participant-section">
        <label htmlFor="participant-name-input">{t('calendarSubmit.enterNameLabel')}</label>
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
            placeholder={t('calendarSubmit.namePlaceholder')}
          />
          <button
            className="btn btn-primary"
            disabled={!nameInput.trim()}
            onClick={() => {
              onParticipantChange(nameInput.trim());
              setNameConfirmed(true);
            }}
          >
            {t('calendarSubmit.welcome.continue')}
          </button>
        </div>
        <p className="form-hint">{t('calendarSubmit.welcome.desc')}</p>
      </div>
    );
  }

  // Name confirmed - show with status and edit option
  return (
    <div className="participant-section">
      <div className="confirmed-participant">
        <div className="participant-info">
          <span className="participant-label">{t('calendarSubmit.submittingAs')}</span>
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
          {t('calendarSubmit.changeBtn')}
        </button>
      </div>
      {submittedDates.length > 0 ? (
        <div className="submission-status">
          <p className="form-hint info">
            {t('calendarSubmit.alreadySubmittedHint', { count: submittedDates.length })}
          </p>
          {onReset && (
            <button
              type="button"
              className="btn btn-outline btn-small btn-danger-outline"
              onClick={onReset}
              disabled={isResetting}
            >
              {isResetting ? t('common.resetting') : t('calendarSubmit.resetBtn')}
            </button>
          )}
        </div>
      ) : (
        <p className="form-hint">{t('calendarSubmit.selectDatesBelowHint')}</p>
      )}
    </div>
  );
}

export default ParticipantInput;

import { useState, useEffect } from 'react';
import { useI18n } from '../context/I18nContext';
import type { Calendar } from '../types';

interface ParticipantInputProps {
  calendar: Calendar;
  currentParticipant: string;
  onParticipantChange: (name: string) => void;
  submittedDates?: string[];
  knownParticipants?: string[];
  isReturningVisitor?: boolean;
}

function ParticipantInput({
  calendar,
  currentParticipant,
  onParticipantChange,
  submittedDates = [],
  knownParticipants = [],
  isReturningVisitor = false
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

  const confirmName = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onParticipantChange(trimmed);
    setNameConfirmed(true);
  };

  const renderStatus = () => (
    submittedDates.length > 0 ? (
      <div className="submission-status">
        <p className="form-hint info">
          {t('calendarSubmit.alreadySubmittedHint', { count: submittedDates.length })}
        </p>
      </div>
    ) : (
      <p className="form-hint">{t('calendarSubmit.selectDatesBelowHint')}</p>
    )
  );

  // Defined participants - show dropdown
  if (calendar?.participantsType === 'defined' && calendar?.participants?.length > 0) {
    return (
      <div className="participant-section">
        <label htmlFor="participant-select">{t('calendarSubmit.selectNameLabel')}</label>
        <div className="participant-select-wrapper">
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
        </div>
        {currentParticipant
          ? renderStatus()
          : <p className="form-hint">{t('calendarSubmit.selectNameHint')}</p>}
      </div>
    );
  }

  // Open calendar - name entry
  if (!nameConfirmed || !currentParticipant) {
    return (
      <div className="participant-section">
        {knownParticipants.length > 0 && (
          <div className="returning-participant-picker">
            <label htmlFor="returning-participant-select">
              {t('calendarSubmit.returning.selectLabel')}
            </label>
            <div className="participant-select-wrapper">
              <select
                id="returning-participant-select"
                className="participant-select"
                value=""
                onChange={(e) => confirmName(e.target.value)}
              >
                <option value="">{t('calendarSubmit.returning.selectPlaceholder')}</option>
                {knownParticipants.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>
            <p className="form-hint">{t('calendarSubmit.returning.selectHint')}</p>
            <div className="participant-divider">
              <span>{t('calendarSubmit.returning.or')}</span>
            </div>
          </div>
        )}

        <label htmlFor="participant-name-input">
          {knownParticipants.length > 0
            ? t('calendarSubmit.returning.newNameLabel')
            : t('calendarSubmit.enterNameLabel')}
        </label>
        <div className="name-input-row">
          <input
            type="text"
            id="participant-name-input"
            className="name-input"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                confirmName(nameInput);
              }
            }}
            placeholder={t('calendarSubmit.namePlaceholder')}
            autoComplete="name"
          />
          <button
            className="btn btn-primary"
            disabled={!nameInput.trim()}
            onClick={() => confirmName(nameInput)}
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
          <span className="participant-label">
            {isReturningVisitor ? t('calendarSubmit.returning.welcomeBack') : t('calendarSubmit.submittingAs')}
          </span>
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
      {isReturningVisitor && submittedDates.length === 0 && (
        <p className="form-hint info">{t('calendarSubmit.returning.noDatesYetHint')}</p>
      )}
      {renderStatus()}
    </div>
  );
}

export default ParticipantInput;

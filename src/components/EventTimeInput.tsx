import { useI18n } from '../context/I18nContext';

interface EventTimeInputProps {
  startTime: string;
  endTime: string;
  onChange: (startTime: string, endTime: string) => void;
  disabled?: boolean;
}

// Both ends are required together, so clearing one clears the other.
function EventTimeInput({ startTime, endTime, onChange, disabled }: EventTimeInputProps) {
  const { t } = useI18n();

  const invalid = Boolean(startTime && endTime && endTime <= startTime);
  const incomplete = Boolean(startTime) !== Boolean(endTime);

  return (
    <div className="event-time-input">
      <span className="event-time-label">{t('create.dates.timeLabel')}</span>
      <p className="form-hint">{t('create.dates.timeHint')}</p>

      <div className="event-time-row">
        <input
          type="time"
          aria-label={t('create.dates.timeStartLabel')}
          value={startTime}
          disabled={disabled}
          onChange={e => onChange(e.target.value, endTime)}
        />
        <span className="event-time-sep">–</span>
        <input
          type="time"
          aria-label={t('create.dates.timeEndLabel')}
          value={endTime}
          disabled={disabled}
          onChange={e => onChange(startTime, e.target.value)}
        />
        {(startTime || endTime) && (
          <button
            type="button"
            className="event-time-clear"
            disabled={disabled}
            onClick={() => onChange('', '')}
          >
            {t('create.dates.timeClear')}
          </button>
        )}
      </div>

      {invalid && <p className="event-time-error" role="alert">{t('create.dates.timeErrorOrder')}</p>}
      {!invalid && incomplete && <p className="event-time-error" role="alert">{t('create.dates.timeErrorIncomplete')}</p>}
      <p className="form-tip">{t('create.dates.timeTip')}</p>
    </div>
  );
}

export default EventTimeInput;

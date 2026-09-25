import { useState } from 'react';
import { useI18n } from '../context/I18nContext';
import { formatDisplayDate } from '../core/dateRanges';

interface BlockedDatesInputProps {
  id?: string;
  dates: string[];
  onChange: (dates: string[]) => void;
  min?: string;
  max?: string;
  disabled?: boolean;
}

function BlockedDatesInput({ id, dates, onChange, min, max, disabled = false }: BlockedDatesInputProps) {
  const { t } = useI18n();
  const [pendingDate, setPendingDate] = useState('');

  const addDate = () => {
    if (!pendingDate || dates.includes(pendingDate)) {
      setPendingDate('');
      return;
    }
    onChange([...dates, pendingDate].sort());
    setPendingDate('');
  };

  const removeDate = (dateStr: string) => {
    onChange(dates.filter(d => d !== dateStr));
  };

  return (
    <>
      <div className="blocked-dates-input-row">
        <input
          id={id}
          type="date"
          value={pendingDate}
          min={min}
          max={max}
          onChange={(e) => setPendingDate(e.target.value)}
          // Enter would otherwise submit the surrounding create-calendar form.
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addDate();
            }
          }}
          disabled={disabled}
        />
        <button
          type="button"
          className="btn btn-outline btn-small"
          onClick={addDate}
          disabled={disabled || !pendingDate}
        >
          {t('dashboard.createModal.addBlockedDate')}
        </button>
      </div>
      <div className="blocked-dates-list">
        {dates.map(dateStr => (
          <span key={dateStr} className="blocked-date-tag">
            {formatDisplayDate(dateStr)}
            <button
              type="button"
              className="blocked-date-remove"
              onClick={() => removeDate(dateStr)}
              aria-label={t('dashboard.createModal.removeBlockedDate', { date: formatDisplayDate(dateStr) })}
              disabled={disabled}
            >
              &times;
            </button>
          </span>
        ))}
      </div>
    </>
  );
}

export default BlockedDatesInput;

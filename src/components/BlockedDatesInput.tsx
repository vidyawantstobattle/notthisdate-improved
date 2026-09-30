import { useState, type KeyboardEvent } from 'react';
import { useI18n } from '../context/I18nContext';
import { formatDisplayDate } from '../core/dateRanges';

const MAX_REASON_LENGTH = 100;

interface BlockedDatesInputProps {
  id?: string;
  dates: string[];
  onChange: (dates: string[]) => void;
  reasons?: Record<string, string>;
  onReasonsChange?: (reasons: Record<string, string>) => void;
  min?: string;
  max?: string;
  disabled?: boolean;
}

function BlockedDatesInput({
  id,
  dates,
  onChange,
  reasons = {},
  onReasonsChange,
  min,
  max,
  disabled = false
}: BlockedDatesInputProps) {
  const { t } = useI18n();
  const [pendingDate, setPendingDate] = useState('');
  const [pendingReason, setPendingReason] = useState('');

  const addDate = () => {
    if (!pendingDate || dates.includes(pendingDate)) {
      setPendingDate('');
      setPendingReason('');
      return;
    }
    onChange([...dates, pendingDate].sort());

    const reason = pendingReason.trim();
    if (reason && onReasonsChange) {
      onReasonsChange({ ...reasons, [pendingDate]: reason });
    }

    setPendingDate('');
    setPendingReason('');
  };

  const removeDate = (dateStr: string) => {
    onChange(dates.filter(d => d !== dateStr));

    if (onReasonsChange && reasons[dateStr]) {
      const next = { ...reasons };
      delete next[dateStr];
      onReasonsChange(next);
    }
  };

  // Enter would otherwise submit the surrounding create-calendar form.
  const addOnEnter = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addDate();
    }
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
          onKeyDown={addOnEnter}
          disabled={disabled}
        />
        {onReasonsChange && (
          <input
            type="text"
            className="blocked-date-reason-input"
            value={pendingReason}
            maxLength={MAX_REASON_LENGTH}
            placeholder={t('dashboard.createModal.blockedReasonPlaceholder')}
            aria-label={t('dashboard.createModal.blockedReasonPlaceholder')}
            onChange={(e) => setPendingReason(e.target.value)}
            onKeyDown={addOnEnter}
            disabled={disabled || !pendingDate}
          />
        )}
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
            {reasons[dateStr] && (
              <span className="blocked-date-reason">{reasons[dateStr]}</span>
            )}
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

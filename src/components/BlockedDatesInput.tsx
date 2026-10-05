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

  // Dates commit the moment they are picked, so a half-filled row can never be
  // silently dropped when the surrounding form is submitted.
  const addDate = (dateStr: string) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return;
    if (min && dateStr < min) return;
    if (max && dateStr > max) return;
    if (dates.includes(dateStr)) return;
    onChange([...dates, dateStr].sort());
  };

  const removeDate = (dateStr: string) => {
    onChange(dates.filter(d => d !== dateStr));

    if (onReasonsChange && reasons[dateStr]) {
      const next = { ...reasons };
      delete next[dateStr];
      onReasonsChange(next);
    }
  };

  const setReason = (dateStr: string, reason: string) => {
    if (!onReasonsChange) return;
    const next = { ...reasons };
    if (reason.trim()) next[dateStr] = reason;
    else delete next[dateStr];
    onReasonsChange(next);
  };

  return (
    <>
      <div className="blocked-dates-input-row">
        <input
          id={id}
          type="date"
          value=""
          min={min}
          max={max}
          onChange={(e) => addDate(e.target.value)}
          disabled={disabled}
        />
      </div>
      <div className="blocked-dates-list">
        {dates.map(dateStr => (
          <div key={dateStr} className="blocked-date-tag">
            <span className="blocked-date-label">{formatDisplayDate(dateStr)}</span>
            {onReasonsChange && (
              <input
                type="text"
                className="blocked-date-reason-input"
                value={reasons[dateStr] || ''}
                maxLength={MAX_REASON_LENGTH}
                placeholder={t('dashboard.createModal.blockedReasonPlaceholder')}
                aria-label={t('dashboard.createModal.blockedReasonAria', { date: formatDisplayDate(dateStr) })}
                onChange={(e) => setReason(dateStr, e.target.value)}
                disabled={disabled}
              />
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
          </div>
        ))}
      </div>
    </>
  );
}

export default BlockedDatesInput;

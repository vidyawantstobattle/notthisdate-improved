import { groupIntoRanges, formatDateDisplay } from '../core/dateRanges';
import { useI18n } from '../context/I18nContext';
import type { DateRange } from '../types';

interface DateRangeDisplayProps {
  dates: string[];
  onRemoveRange?: (range: DateRange) => void;
}

function DateRangeDisplay({ dates, onRemoveRange }: DateRangeDisplayProps) {
  const { t } = useI18n();

  if (!dates || dates.length === 0) {
    return <p className="empty-message">{t('calendarSubmit.noDatesSelected')}</p>;
  }

  const ranges = groupIntoRanges(dates);

  return (
    <div className="selected-dates-list">
      {ranges.map((range, index) => {
        const displayText = range.start === range.end
          ? formatDateDisplay(range.start)
          : `${formatDateDisplay(range.start)} - ${formatDateDisplay(range.end)}`;

        return (
          <span key={index} className="date-tag">
            {displayText}
            {onRemoveRange && (
              <button
                type="button"
                className="remove-btn"
                onClick={() => onRemoveRange(range)}
                title="Remove this date range"
                aria-label={`Remove ${displayText}`}
              >
                &times;
              </button>
            )}
          </span>
        );
      })}
    </div>
  );
}

export default DateRangeDisplay;

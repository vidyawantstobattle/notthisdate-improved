import { useI18n } from '../context/I18nContext';
import {
  buildIcs,
  buildIcsFileName,
  buildGoogleCalendarUrl,
  buildOutlookCalendarUrl,
  type CalendarEvent
} from '../core/calendarExport';

interface AddToCalendarProps {
  event: CalendarEvent;
  uidSeed: string;
}

// Apple Calendar and Outlook desktop both open .ics natively, so the download
// covers them; Google and Outlook Web get a prefilled compose link instead.
function AddToCalendar({ event, uidSeed }: AddToCalendarProps) {
  const { t } = useI18n();

  const downloadIcs = () => {
    const blob = new Blob([buildIcs(event, uidSeed)], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = buildIcsFileName(event.title);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="add-to-calendar">
      <span className="add-to-calendar-label">{t('calendarView.addToCalendar.label')}</span>
      <div className="add-to-calendar-actions">
        <a
          className="btn btn-outline btn-small"
          href={buildGoogleCalendarUrl(event)}
          target="_blank"
          rel="noopener noreferrer"
        >
          {t('calendarView.addToCalendar.google')}
        </a>
        <a
          className="btn btn-outline btn-small"
          href={buildOutlookCalendarUrl(event)}
          target="_blank"
          rel="noopener noreferrer"
        >
          {t('calendarView.addToCalendar.outlook')}
        </a>
        <button type="button" className="btn btn-outline btn-small" onClick={downloadIcs}>
          {t('calendarView.addToCalendar.apple')}
        </button>
      </div>
    </div>
  );
}

export default AddToCalendar;

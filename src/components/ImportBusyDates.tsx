import { useRef, useState } from 'react';
import { useI18n } from '../context/I18nContext';
import { parseIcsBusyDays, type ImportedBusyDay, type MeetingWindow } from '../core/calendarImport';
import { readTextEntries, looksLikeZip, ZipError } from '../core/zipReader';

interface ImportBusyDatesProps {
  rangeStart: string;
  rangeEnd: string;
  blockedDates?: string[];
  alreadyMarked: string[];
  meetingWindow?: MeetingWindow | null;
  onApply: (dates: string[]) => void;
}

// A zip holds the same data compressed, so it gets the same budget as the
// .ics it unpacks to; 5 MB covers a multi-year export comfortably.
const MAX_FILE_BYTES = 5 * 1024 * 1024;

function todayStr(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

function isIcsName(name: string): boolean {
  return name.toLowerCase().endsWith('.ics');
}

function ImportBusyDates({
  rangeStart,
  rangeEnd,
  blockedDates = [],
  alreadyMarked,
  meetingWindow,
  onApply
}: ImportBusyDatesProps) {
  const { t } = useI18n();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);
  const [declined, setDeclined] = useState(false);
  const [busyDays, setBusyDays] = useState<ImportedBusyDay[] | null>(null);
  const [error, setError] = useState('');
  const [parsing, setParsing] = useState(false);

  const reset = () => {
    setBusyDays(null);
    setError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError('');
    setBusyDays(null);

    if (file.size > MAX_FILE_BYTES) {
      setError(t('calendarSubmit.import.errorTooLarge'));
      return;
    }

    setParsing(true);
    try {
      const buffer = await file.arrayBuffer();
      const calendarTexts = looksLikeZip(buffer)
        ? await readIcsFromZip(buffer)
        : [new TextDecoder().decode(buffer)];

      const usable = calendarTexts.filter(text => /BEGIN:VCALENDAR/i.test(text));
      if (usable.length === 0) {
        setError(t('calendarSubmit.import.errorNotIcs'));
        return;
      }

      // An export can split across several .ics files inside one archive.
      const merged = new Map<string, Set<string>>();
      for (const text of usable) {
        const { busyDays: found } = parseIcsBusyDays(text, rangeStart, rangeEnd, meetingWindow);
        found.forEach(day => {
          const titles = merged.get(day.date) || new Set<string>();
          day.titles.forEach(title => titles.add(title));
          merged.set(day.date, titles);
        });
      }

      // Mirror the date picker, which refuses blocked and past days.
      const earliest = todayStr();
      const selectable = Array.from(merged.entries())
        .filter(([date]) => !blockedDates.includes(date) && date >= earliest)
        .map(([date, titles]) => ({ date, titles: Array.from(titles) }))
        .sort((a, b) => a.date.localeCompare(b.date));

      setBusyDays(selectable);
    } catch (err) {
      if (err instanceof ZipError) {
        setError(err.code === 'unsupported'
          ? t('calendarSubmit.import.errorZipUnsupported')
          : t('calendarSubmit.import.errorZipUnreadable'));
      } else if ((err as Error).message === 'no_ics_in_zip') {
        setError(t('calendarSubmit.import.errorZipNoIcs'));
      } else {
        setError(t('calendarSubmit.import.errorUnreadable'));
      }
    } finally {
      setParsing(false);
    }
  };

  // Google exports a zip; the guardrail is that it must actually contain an .ics.
  const readIcsFromZip = async (buffer: ArrayBuffer): Promise<string[]> => {
    const entries = await readTextEntries(buffer, isIcsName);
    if (entries.length === 0) throw new Error('no_ics_in_zip');
    return entries.map(entry => entry.text);
  };

  const newDates = (busyDays || []).map(d => d.date).filter(date => !alreadyMarked.includes(date));

  const applyImport = () => {
    onApply(newDates);
    setOpen(false);
    setDeclined(true);
    reset();
  };

  if (!open) {
    // Declining collapses to a single link so the date picker below stays the
    // focus of the page rather than this offer.
    if (declined) {
      return (
        <div className="import-busy">
          <button
            type="button"
            className="import-busy-reopen"
            onClick={() => { setDeclined(false); setOpen(true); }}
          >
            {t('calendarSubmit.import.reopenLink')}
          </button>
        </div>
      );
    }

    return (
      <div className="import-busy is-asking">
        <p className="import-busy-question">{t('calendarSubmit.import.question')}</p>
        <div className="import-busy-choices">
          <button type="button" className="btn btn-primary btn-small" onClick={() => setOpen(true)}>
            {t('common.yes')}
          </button>
          <button type="button" className="btn btn-outline btn-small" onClick={() => setDeclined(true)}>
            {t('common.no')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="import-busy is-open" role="region" aria-label={t('calendarSubmit.import.title')}>
      <div className="import-busy-header">
        <h4>{t('calendarSubmit.import.title')}</h4>
        <button
          type="button"
          className="import-busy-close"
          aria-label={t('common.closeDialog')}
          onClick={() => { setOpen(false); setDeclined(true); reset(); }}
        >
          &times;
        </button>
      </div>

      <p className="import-busy-desc">{t('calendarSubmit.import.desc')}</p>

      {meetingWindow ? (
        <p className="import-busy-window">
          {t('calendarSubmit.import.windowNote', {
            start: meetingWindow.startTime,
            end: meetingWindow.endTime
          })}
        </p>
      ) : (
        <p className="import-busy-window">{t('calendarSubmit.import.noWindowNote')}</p>
      )}

      <ol className="import-busy-steps">
        <li>{t('calendarSubmit.import.stepGoogle')}</li>
        <li>{t('calendarSubmit.import.stepOutlook')}</li>
        <li>{t('calendarSubmit.import.stepApple')}</li>
      </ol>

      <label className="import-busy-file">
        <span>{t('calendarSubmit.import.fileLabel')}</span>
        <input
          ref={fileInputRef}
          type="file"
          accept=".ics,.zip,text/calendar,application/zip"
          onChange={handleFile}
          disabled={parsing}
        />
      </label>

      <p className="import-busy-privacy">{t('calendarSubmit.import.privacy')}</p>

      {parsing && <p className="import-busy-status">{t('common.loading')}</p>}
      {error && <p className="import-busy-status is-error" role="alert">{error}</p>}

      {busyDays && !error && (
        busyDays.length === 0 ? (
          <p className="import-busy-status">{t('calendarSubmit.import.noneFound')}</p>
        ) : (
          <div className="import-busy-result">
            <p className="import-busy-status">
              {t('calendarSubmit.import.found', { count: busyDays.length, newCount: newDates.length })}
            </p>
            <ul className="import-busy-list">
              {busyDays.slice(0, 10).map(day => (
                <li key={day.date}>
                  <strong>{day.date}</strong>
                  {day.titles.length > 0 && <span> — {day.titles.slice(0, 2).join(', ')}</span>}
                </li>
              ))}
            </ul>
            {busyDays.length > 10 && (
              <p className="import-busy-more">
                {t('calendarSubmit.import.andMore', { count: busyDays.length - 10 })}
              </p>
            )}
            <button
              type="button"
              className="btn btn-primary btn-small"
              onClick={applyImport}
              disabled={newDates.length === 0}
            >
              {t('calendarSubmit.import.applyButton', { count: newDates.length })}
            </button>
          </div>
        )
      )}
    </div>
  );
}

export default ImportBusyDates;

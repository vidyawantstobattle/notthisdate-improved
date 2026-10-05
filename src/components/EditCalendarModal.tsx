import { useState } from 'react';
import { useI18n } from '../context/I18nContext';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { calendarsApi } from '../api/calendars.api';
import { type ApiErrorLike } from '../utils/errorHandling';
import type { Calendar } from '../types';
import BlockedDatesInput from './BlockedDatesInput';
import ErrorMessage from './ErrorMessage';

interface EditCalendarModalProps {
  calendar: Calendar;
  onClose: () => void;
  onSave: (calendar: Calendar) => void;
}

export default function EditCalendarModal({ calendar, onClose, onSave }: EditCalendarModalProps) {
  const { t } = useI18n();
  const { showToast } = useToast();
  const { user } = useAuth();
  const [name, setName] = useState(calendar.name);
  const [description, setDescription] = useState(calendar.description || '');
  const [blockedDates, setBlockedDates] = useState<string[]>(calendar.blockedDates || []);
  const [error, setError] = useState<ApiErrorLike | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      setError(new Error('Name is required'));
      return;
    }

    setError(null);
    setIsSaving(true);

    try {
      const updated: Calendar = {
        ...calendar,
        name: name.trim(),
        description: description.trim(),
        blockedDates
      };

      // Update calendar via API
      const token = user ? await user.jwt() : null;
      await calendarsApi.update(calendar.id, {
        name: updated.name,
        description: updated.description,
        blockedDates: updated.blockedDates
      }, token);

      showToast(t('dashboard.toast.updated') || 'Calendar updated successfully');
      onSave(updated);
      onClose();
    } catch (err) {
      console.error('Failed to update calendar:', err);
      setError(err as ApiErrorLike);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="edit-calendar-title">
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label={t('common.closeDialog')} disabled={isSaving}>&times;</button>

        <h2 id="edit-calendar-title">{t('dashboard.editCalendar.title')}</h2>
        <p className="modal-subtitle">{t('dashboard.editCalendar.desc')}</p>

        <div className="form-group">
          <label htmlFor="edit-calendar-name">{t('create.basics.nameLabel')}</label>
          <input
            id="edit-calendar-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isSaving}
            placeholder={t('create.basics.namePlaceholder')}
          />
        </div>

        <div className="form-group">
          <label htmlFor="edit-calendar-desc">{t('create.basics.descLabel')}</label>
          <textarea
            id="edit-calendar-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isSaving}
            placeholder={t('create.basics.descPlaceholder')}
            rows={3}
          />
        </div>

        <div className="form-group">
          <label htmlFor="edit-calendar-blocked">{t('create.review.blockedLabel')}</label>
          <BlockedDatesInput
            id="edit-calendar-blocked"
            dates={blockedDates}
            onChange={setBlockedDates}
            min={calendar.startDate}
            max={calendar.endDate}
            disabled={isSaving}
          />
          <p className="form-hint">{t('create.review.blockedHint')}</p>
        </div>

        {error && <ErrorMessage error={error} onDismiss={() => setError(null)} />}

        <div className="form-actions">
          <button type="button" className="btn btn-outline" onClick={onClose} disabled={isSaving}>
            {t('common.cancel')}
          </button>
          <button type="button" className="btn btn-primary" onClick={handleSave} disabled={isSaving || !name.trim()}>
            {isSaving ? t('common.saving') : t('common.save')}
          </button>
        </div>
      </div>
    </div>
  );
}

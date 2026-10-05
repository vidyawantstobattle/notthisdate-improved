import { useState } from 'react';
import { useI18n } from '../context/I18nContext';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { calendarsApi } from '../api/calendars.api';
import { getErrorMessage, type ApiErrorLike } from '../utils/errorHandling';
import type { Calendar } from '../types';
import BlockedDatesInput from './BlockedDatesInput';
import ErrorMessage from './ErrorMessage';

interface EditCalendarModalProps {
  calendar: Calendar;
  onClose: () => void;
  onSave: (calendar: Calendar) => void;
  saving?: boolean;
}

export default function EditCalendarModal({ calendar, onClose, onSave, saving = false }: EditCalendarModalProps) {
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
    <>
      <div className="modal-overlay" onClick={onClose}></div>
      <div className="modal" role="dialog" aria-label={t('dashboard.editCalendar.title')}>
        <div className="modal-header">
          <h2>{t('dashboard.editCalendar.title')}</h2>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close"
            disabled={isSaving}
          >
            ×
          </button>
        </div>

        <div className="modal-body">
          {error && <ErrorMessage error={error} onDismiss={() => setError(null)} />}

          <div className="form-group">
            <label htmlFor="edit-calendar-name">{t('create.nameLabel')}</label>
            <input
              id="edit-calendar-name"
              type="text"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSaving}
              placeholder={t('create.namePlaceholder')}
            />
          </div>

          <div className="form-group">
            <label htmlFor="edit-calendar-desc">{t('create.descriptionLabel')}</label>
            <textarea
              id="edit-calendar-desc"
              className="form-textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSaving}
              placeholder={t('create.descriptionPlaceholder')}
              rows={3}
            />
          </div>

          <div className="form-group">
            <label>{t('create.blockedDatesLabel')}</label>
            <BlockedDatesInput
              id="edit-calendar-blocked"
              dates={blockedDates}
              onChange={setBlockedDates}
              min={calendar.startDate}
              max={calendar.endDate}
              disabled={isSaving}
            />
          </div>
        </div>

        <div className="modal-footer">
          <button
            type="button"
            className="btn btn-outline"
            onClick={onClose}
            disabled={isSaving}
          >
            {t('common.cancel')}
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSave}
            disabled={isSaving || !name.trim()}
          >
            {isSaving ? t('common.loading') : t('common.save')}
          </button>
        </div>
      </div>
    </>
  );
}

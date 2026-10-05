import { useState } from 'react';
import { useI18n } from '../context/I18nContext';
import { calendarsApi } from '../api/calendars.api';
import { MAX_PARTICIPANTS } from '../config/site';
import type { Calendar, ParticipantsType } from '../types';
import BlockedDatesInput from './BlockedDatesInput';
import TagsInput from './TagsInput';

interface EditCalendarModalProps {
  calendar: Calendar;
  getToken: () => Promise<string | null>;
  onClose: () => void;
  onSaved: (calendar: Calendar, message: string) => void;
}

function EditCalendarModal({ calendar, getToken, onClose, onSaved }: EditCalendarModalProps) {
  const { t } = useI18n();
  const [name, setName] = useState(calendar.name);
  const [description, setDescription] = useState(calendar.description || '');
  const [blockedDates, setBlockedDates] = useState<string[]>(calendar.blockedDates || []);
  const [participants, setParticipants] = useState<string[]>([...(calendar.participants || [])]);
  const [participantsType, setParticipantsType] = useState<ParticipantsType>(calendar.participantsType);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // Once a calendar is link-based it cannot go back to a named list.
  const canEditParticipants = calendar.participantsType === 'defined';
  const makeOpen = participantsType === 'open';

  const handleSave = async () => {
    if (!name.trim()) {
      setError(t('dashboard.editCalendar.errorNameRequired'));
      return;
    }

    if (canEditParticipants && !makeOpen) {
      if (participants.length === 0) {
        setError(t('dashboard.editParticipants.errorEmpty'));
        return;
      }
      if (participants.length > MAX_PARTICIPANTS) {
        setError(t('dashboard.editParticipants.errorTooMany', { max: MAX_PARTICIPANTS }));
        return;
      }
    }

    setSaving(true);
    setError('');

    try {
      const token = await getToken();

      const { calendar: updated } = await calendarsApi.update(
        calendar.id,
        { name: name.trim(), description: description.trim(), blockedDates },
        token
      );

      let merged: Calendar = { ...calendar, ...updated };
      let message = t('dashboard.toast.updated');

      const participantsChanged =
        canEditParticipants &&
        (makeOpen || participants.join('\u0000') !== (calendar.participants || []).join('\u0000'));

      if (participantsChanged) {
        const result = await calendarsApi.updateParticipants(
          calendar.id,
          makeOpen ? { participantsType: 'open' } : { participants },
          token
        );
        merged = { ...merged, participants: result.participants, participantsType: result.participantsType };
        message = makeOpen ? t('dashboard.editParticipants.opened') : t('dashboard.editParticipants.saved');
      }

      onSaved(merged, message);
    } catch (err) {
      console.error('Failed to update calendar:', err);
      setError((err as Error).message || t('dashboard.card.updateFailed'));
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="edit-calendar-title">
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label={t('common.closeDialog')} disabled={saving}>&times;</button>

        <h2 id="edit-calendar-title">{t('dashboard.editCalendar.title')}</h2>
        <p className="modal-subtitle">{t('dashboard.editCalendar.desc')}</p>

        <div className="form-group">
          <label htmlFor="edit-calendar-name">{t('create.basics.nameLabel')}</label>
          <input
            id="edit-calendar-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('create.basics.namePlaceholder')}
            disabled={saving}
          />
        </div>

        <div className="form-group">
          <label htmlFor="edit-calendar-desc">{t('create.basics.descLabel')}</label>
          <textarea
            id="edit-calendar-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('create.basics.descPlaceholder')}
            rows={3}
            disabled={saving}
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
            disabled={saving}
          />
          <p className="form-hint">{t('create.review.blockedHint')}</p>
        </div>

        {canEditParticipants && (
          <>
            <div className="form-group">
              <label>{t('dashboard.editParticipants.whoLabel')}</label>
              <div className="create-choice-group">
                <label className={`create-choice${participantsType === 'defined' ? ' is-selected' : ''}`}>
                  <input
                    type="radio"
                    name="edit-participants-type"
                    checked={participantsType === 'defined'}
                    onChange={() => setParticipantsType('defined')}
                    disabled={saving}
                  />
                  <span className="create-choice-title">{t('dashboard.editParticipants.specificPeople')}</span>
                  <span className="create-choice-hint">{t('dashboard.editParticipants.specificPeopleHint')}</span>
                </label>
                <label className={`create-choice${participantsType === 'open' ? ' is-selected' : ''}`}>
                  <input
                    type="radio"
                    name="edit-participants-type"
                    checked={participantsType === 'open'}
                    onChange={() => setParticipantsType('open')}
                    disabled={saving}
                  />
                  <span className="create-choice-title">{t('dashboard.editParticipants.anyoneWithLink')}</span>
                  <span className="create-choice-hint">{t('dashboard.editParticipants.anyoneWithLinkHint')}</span>
                </label>
              </div>
            </div>

            {makeOpen ? (
              <p className="form-hint form-hint-warning">{t('dashboard.editParticipants.openWarning')}</p>
            ) : (
              <div className="form-group">
                <label htmlFor="edit-participants-tags">{t('dashboard.createModal.participantsLabel')}</label>
                <TagsInput
                  id="edit-participants-tags"
                  tags={participants}
                  onChange={setParticipants}
                  placeholder={t('dashboard.createModal.participantsPlaceholder')}
                  disabled={saving}
                />
                <p className="form-hint">{t('dashboard.editParticipants.warning')}</p>
              </div>
            )}
          </>
        )}

        {error && <div className="form-error">{error}</div>}

        <div className="form-actions">
          <button type="button" className="btn btn-outline" onClick={onClose} disabled={saving}>
            {t('common.cancel')}
          </button>
          <button type="button" className="btn btn-primary" onClick={handleSave} disabled={saving || !name.trim()}>
            {saving ? t('common.saving') : t('common.save')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default EditCalendarModal;

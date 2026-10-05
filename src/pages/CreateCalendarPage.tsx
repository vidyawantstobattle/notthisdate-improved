import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth, consumePendingCalendarDraft, setPendingAction, setPendingCalendarDraft } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';
import { useToast } from '../context/ToastContext';
import LanguageSelector from '../components/LanguageSelector';
import TagsInput from '../components/TagsInput';
import BlockedDatesInput from '../components/BlockedDatesInput';
import AdPlaceholder from '../components/AdPlaceholder';
import useDocumentTitle from '../hooks/useDocumentTitle';
import { calendarsApi } from '../api/calendars.api';
import { formatDisplayDate } from '../core/dateRanges';
import { MAX_PARTICIPANTS } from '../config/site';
import type { CreateCalendarInput, ParticipantsType } from '../types';

const BASE_STEPS = ['basics', 'dates', 'review'] as const;
type StepKey = (typeof BASE_STEPS)[number] | 'account';

// Categories the landing page can hand over; "other" deliberately has no prefill.
const CATEGORY_TITLE_KEYS: Record<string, string> = {
  trips: 'create.category.trips.title',
  social: 'create.category.social.title',
  team: 'create.category.team.title',
  sports: 'create.category.sports.title'
};

function formatDateInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addMonths(months: number): string {
  const date = new Date();
  date.setMonth(date.getMonth() + months);
  return formatDateInput(date);
}

function daysBetween(start: string, end: string): number {
  const startMs = new Date(`${start}T00:00:00`).getTime();
  const endMs = new Date(`${end}T00:00:00`).getTime();
  if (Number.isNaN(startMs) || Number.isNaN(endMs) || endMs < startMs) return 0;
  return Math.round((endMs - startMs) / 86400000) + 1;
}

function CreateCalendarPage() {
  const { user, loading, login, signup, getAuthHeaders } = useAuth();
  const { t } = useI18n();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [step, setStep] = useState(0);
  // Furthest step reached, so the user can jump back and forward freely without redoing work.
  const [maxStep, setMaxStep] = useState(0);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState(() => formatDateInput(new Date()));
  const [endDate, setEndDate] = useState(() => addMonths(3));
  const [participantsType, setParticipantsType] = useState<ParticipantsType>('defined');
  const [participants, setParticipants] = useState<string[]>([]);
  const [blockedDates, setBlockedDates] = useState<string[]>([]);
  const [blockedDateReasons, setBlockedDateReasons] = useState<Record<string, string>>({});
  const [requireEmailVerification, setRequireEmailVerification] = useState(false);
  const [selectedQuickPick, setSelectedQuickPick] = useState<'month' | 'threeMonths' | 'sixMonths' | null>(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [autoSubmit, setAutoSubmit] = useState(false);

  const draftRestored = useRef(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useDocumentTitle(t('create.docTitle'));

  // A guest who finished the wizard parked their draft before signing up; replay it.
  useEffect(() => {
    if (draftRestored.current) return;
    draftRestored.current = true;

    const draft = consumePendingCalendarDraft();
    if (!draft) return;

    setName(draft.name);
    setDescription(draft.description);
    setStartDate(draft.startDate);
    setEndDate(draft.endDate);
    setParticipantsType(draft.participantsType);
    setParticipants(draft.participants);
    setBlockedDates(draft.blockedDates);
    setBlockedDateReasons(draft.blockedDateReasons);
    setRequireEmailVerification(draft.requireEmailVerification);
    setStep(BASE_STEPS.length - 1);
    setMaxStep(BASE_STEPS.length - 1);
    setAutoSubmit(true);
  }, []);

  // Prefill the title from the category tile clicked on the landing page.
  useEffect(() => {
    if (draftRestored.current && autoSubmit) return;
    const category = searchParams.get('category');
    const titleKey = category ? CATEGORY_TITLE_KEYS[category] : undefined;
    if (titleKey) setName(t(titleKey));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    if (step === 0) nameInputRef.current?.focus();
  }, [step]);

  // Guests get an extra step explaining the account before the Identity widget opens.
  const needsAccountStep = !loading && !user;
  const steps: StepKey[] = needsAccountStep ? [...BASE_STEPS, 'account'] : [...BASE_STEPS];
  const lastIndex = steps.length - 1;

  useEffect(() => {
    if (step > lastIndex) setStep(lastIndex);
    setMaxStep(current => Math.min(current, lastIndex));
  }, [lastIndex, step]);

  const validateStep = (index: number): string => {
    if (index === 0) {
      if (!name.trim()) return t('create.error.missingName');
      if (participantsType === 'defined' && participants.length === 0) {
        return t('create.error.noParticipants');
      }
      if (participants.length > MAX_PARTICIPANTS) {
        return t('create.error.tooManyParticipants', { max: MAX_PARTICIPANTS });
      }
    }
    if (index === 1) {
      if (!startDate || !endDate) return t('create.error.missingDates');
      if (startDate > endDate) return t('create.error.endBeforeStart');
    }
    if (index === 2) {
      if (blockedDates.some(d => d < startDate || d > endDate)) {
        return t('create.error.blockedOutOfRange');
      }
    }
    return '';
  };

  const buildDraft = () => ({
    name: name.trim(),
    description: description.trim(),
    startDate,
    endDate,
    participantsType,
    participants: participantsType === 'defined' ? participants : [],
    requireEmailVerification: participantsType === 'open' ? requireEmailVerification : false,
    blockedDates,
    blockedDateReasons
  });

  const submit = async (authMode: 'signup' | 'login' = 'signup') => {
    for (let i = 0; i < BASE_STEPS.length; i++) {
      const message = validateStep(i);
      if (message) {
        setStep(i);
        setError(message);
        return;
      }
    }

    const draft = buildDraft();

    // Guests finish the journey after auth; the draft is replayed on return.
    if (!user) {
      setPendingCalendarDraft(draft);
      setPendingAction('createCalendar');
      if (authMode === 'login') login();
      else signup();
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const headers = await getAuthHeaders();
      const token = headers['Authorization']?.replace('Bearer ', '') || null;
      const input: CreateCalendarInput = { ...draft, dateRangeType: 'custom' };
      await calendarsApi.create(input, token);
      showToast(t('create.toast.created'));
      navigate('/dashboard');
    } catch (err) {
      setError(t('create.error.generic', { message: (err as Error).message || '' }));
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (autoSubmit && user && !loading && !submitting) {
      setAutoSubmit(false);
      submit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoSubmit, user, loading]);

  const goNext = () => {
    const message = validateStep(step);
    if (message) {
      setError(message);
      return;
    }
    setError('');
    if (step === lastIndex) {
      submit();
      return;
    }
    const next = step + 1;
    setStep(next);
    setMaxStep(current => Math.max(current, next));
  };

  // Going back is always free; going forward re-validates everything in between,
  // so edits made on an earlier step can't slip past.
  const goToStep = (target: number) => {
    if (target === step) return;
    if (target < step) {
      setError('');
      setStep(target);
      return;
    }
    for (let i = step; i < target; i++) {
      const message = validateStep(i);
      if (message) {
        setStep(i);
        setError(message);
        return;
      }
    }
    setError('');
    setStep(target);
  };

  const goBack = () => {
    setError('');
    if (step === 0) {
      navigate(user ? '/dashboard' : '/');
      return;
    }
    setStep(step - 1);
  };

  const rangeDays = daysBetween(startDate, endDate);

  const calendarSummary = (
    <div className="create-summary">
      <h2>{t('create.review.summaryTitle')}</h2>
      <dl>
        <div>
          <dt>{t('create.review.summaryName')}</dt>
          <dd>{name.trim() || t('create.review.summaryNone')}</dd>
        </div>
        <div>
          <dt>{t('create.review.summaryDates')}</dt>
          <dd>{formatDisplayDate(startDate)} – {formatDisplayDate(endDate)}</dd>
        </div>
        <div>
          <dt>{t('create.review.summaryWho')}</dt>
          <dd>
            {participantsType === 'open'
              ? t('create.review.summaryOpen')
              : participants.length === 1
                ? t('create.review.summaryPeopleOne')
                : t('create.review.summaryPeople', { count: participants.length })}
          </dd>
        </div>
        <div>
          <dt>{t('create.review.summaryBlocked')}</dt>
          <dd>{blockedDates.length > 0 ? blockedDates.length : t('create.review.summaryNone')}</dd>
        </div>
      </dl>
    </div>
  );

  return (
    <div className="create-page">
      <header className="app-header">
        <div className="header-content">
          <Link to="/" className="logo">
            <img src="/images/date_range_outline.svg" alt="Calendar" className="logo-icon" />
            <span>{t('app.name')}</span>
          </Link>
          <nav className="header-nav">
            <LanguageSelector />
          </nav>
        </div>
      </header>

      <ol className="create-progress" aria-label={t('create.progressLabel')}>
        {steps.map((key, index) => (
          <li
            key={key}
            className={`create-progress-step${index === step ? ' is-active' : ''}${index !== step && index <= maxStep ? ' is-done' : ''}`}
          >
            <button
              type="button"
              onClick={() => goToStep(index)}
              disabled={index > maxStep || submitting}
              aria-current={index === step ? 'step' : undefined}
            >
              <span className="create-progress-index">{index + 1}</span>
              <span className="create-progress-label">{t(`create.steps.${key}`)}</span>
            </button>
          </li>
        ))}
      </ol>

      <AdPlaceholder variant="banner" />

      <div className="create-layout">
        <div className="create-rail">
          <AdPlaceholder variant="rail" />
        </div>

        <main className="create-main">
          <p className="create-step-status">
            {t('create.stepStatus', { current: step + 1, total: steps.length })}
          </p>

          {step === 0 && (
            <section className="create-step">
              <h1>{t('create.basics.title')}</h1>
              <p className="create-step-subtitle">{t('create.basics.subtitle')}</p>

              <div className="form-group">
                <label htmlFor="create-name">{t('create.basics.nameLabel')}</label>
                <input
                  ref={nameInputRef}
                  id="create-name"
                  type="text"
                  className="input-large"
                  value={name}
                  placeholder={t('create.basics.namePlaceholder')}
                  onChange={e => setName(e.target.value)}
                  disabled={submitting}
                />
              </div>

              <div className="form-group">
                <label htmlFor="create-desc">{t('create.basics.descLabel')}</label>
                <textarea
                  id="create-desc"
                  value={description}
                  rows={3}
                  placeholder={t('create.basics.descPlaceholder')}
                  onChange={e => setDescription(e.target.value)}
                  disabled={submitting}
                />
              </div>

              <div className="form-group">
                <label>{t('create.basics.whoLabel')}</label>
                <div className="create-choice-group">
                  <label className={`create-choice${participantsType === 'defined' ? ' is-selected' : ''}`}>
                    <input
                      type="radio"
                      name="participants-type"
                      checked={participantsType === 'defined'}
                      onChange={() => setParticipantsType('defined')}
                      disabled={submitting}
                    />
                    <span className="create-choice-title">{t('create.basics.specificPeople')}</span>
                    <span className="create-choice-hint">{t('create.basics.specificPeopleHint')}</span>
                  </label>
                  <label className={`create-choice${participantsType === 'open' ? ' is-selected' : ''}`}>
                    <input
                      type="radio"
                      name="participants-type"
                      checked={participantsType === 'open'}
                      onChange={() => setParticipantsType('open')}
                      disabled={submitting}
                    />
                    <span className="create-choice-title">{t('create.basics.anyoneWithLink')}</span>
                    <span className="create-choice-hint">{t('create.basics.anyoneWithLinkHint')}</span>
                  </label>
                </div>
                <p className="form-hint">{t('create.basics.switchHint')}</p>
              </div>

              {participantsType === 'defined' && (
                <div className="form-group">
                  <label htmlFor="create-participants">{t('create.basics.participantsLabel')}</label>
                  <TagsInput
                    id="create-participants"
                    tags={participants}
                    onChange={setParticipants}
                    placeholder={t('create.basics.participantsPlaceholder')}
                    disabled={submitting}
                  />
                  <p className="form-hint">{t('create.basics.participantsHint')}</p>
                </div>
              )}
            </section>
          )}

          {step === 1 && (
            <section className="create-step">
              <h1>{t('create.dates.title')}</h1>
              <p className="create-step-subtitle">{t('create.dates.subtitle')}</p>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="create-start">{t('create.dates.startLabel')}</label>
                  <input
                    id="create-start"
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    disabled={submitting}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="create-end">{t('create.dates.endLabel')}</label>
                  <input
                    id="create-end"
                    type="date"
                    value={endDate}
                    min={startDate}
                    onChange={e => setEndDate(e.target.value)}
                    disabled={submitting}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>{t('create.dates.quickLabel')}</label>
                <div className="create-quick-picks">
                  <button
                    type="button"
                    className={`btn btn-outline btn-small ${selectedQuickPick === 'month' ? 'btn-selected' : ''}`}
                    onClick={() => { 
                      setSelectedQuickPick('month');
                      setStartDate(formatDateInput(new Date())); 
                      setEndDate(addMonths(1)); 
                    }}
                  >
                    {t('create.dates.quickMonth')}
                  </button>
                  <button
                    type="button"
                    className={`btn btn-outline btn-small ${selectedQuickPick === 'threeMonths' ? 'btn-selected' : ''}`}
                    onClick={() => { 
                      setSelectedQuickPick('threeMonths');
                      setStartDate(formatDateInput(new Date())); 
                      setEndDate(addMonths(3)); 
                    }}
                  >
                    {t('create.dates.quickThreeMonths')}
                  </button>
                  <button
                    type="button"
                    className={`btn btn-outline btn-small ${selectedQuickPick === 'sixMonths' ? 'btn-selected' : ''}`}
                    onClick={() => { 
                      setSelectedQuickPick('sixMonths');
                      setStartDate(formatDateInput(new Date())); 
                      setEndDate(addMonths(6)); 
                    }}
                  >
                    {t('create.dates.quickSixMonths')}
                  </button>
                </div>
              </div>

              {rangeDays > 0 && (
                <p className="create-range-summary">
                  {rangeDays === 1 ? t('create.dates.durationOne') : t('create.dates.duration', { count: rangeDays })}
                </p>
              )}
            </section>
          )}

          {step === 2 && (
            <section className="create-step">
              <h1>{t('create.review.title')}</h1>
              <p className="create-step-subtitle">{t('create.review.subtitle')}</p>

              <div className="form-group">
                <label htmlFor="create-blocked">{t('create.review.blockedLabel')}</label>
                <BlockedDatesInput
                  id="create-blocked"
                  dates={blockedDates}
                  onChange={setBlockedDates}
                  reasons={blockedDateReasons}
                  onReasonsChange={setBlockedDateReasons}
                  min={startDate}
                  max={endDate}
                  disabled={submitting}
                />
                <p className="form-hint">{t('create.review.blockedHint')} {t('create.review.blockedReasonHint')}</p>
              </div>

              {participantsType === 'open' && (
                <div className="form-group verification-options">
                  <label className="checkbox-option">
                    <input
                      type="checkbox"
                      checked={requireEmailVerification}
                      onChange={e => setRequireEmailVerification(e.target.checked)}
                      disabled={submitting}
                    />
                    <span>{t('create.review.verificationLabel')}</span>
                  </label>
                  <p className="form-hint">{t('create.review.verificationHint')}</p>
                  <p className="form-tip">{t('create.review.verificationTip')}</p>
                </div>
              )}

              {calendarSummary}

              {needsAccountStep && (
                <p className="create-signup-notice">{t('create.signupNotice')}</p>
              )}
            </section>
          )}

          {steps[step] === 'account' && (
            <section className="create-step">
              <h1>{t('create.account.title')}</h1>
              <p className="create-step-subtitle">{t('create.account.subtitle')}</p>

              <ul className="create-reassure">
                <li>{t('create.account.reassureSaved')}</li>
                <li>{t('create.account.reassureParticipants')}</li>
                <li>{t('create.account.reassureEditable')}</li>
              </ul>

              {calendarSummary}

              <p className="create-account-alt">
                {t('create.account.haveAccount')}{' '}
                <button type="button" className="link-button" onClick={() => submit('login')}>
                  {t('create.account.login')}
                </button>
              </p>
            </section>
          )}

          {error && <div className="form-error">{error}</div>}
        </main>

        <div className="create-rail">
          <AdPlaceholder variant="rail" />
        </div>
      </div>

      <div className="create-nav">
        <div className="create-nav-inner">
          <button type="button" className="btn btn-outline" onClick={goBack} disabled={submitting}>
            {step === 0 ? t('create.nav.cancel') : t('create.nav.back')}
          </button>
          <button type="button" className="btn btn-primary" onClick={goNext} disabled={submitting}>
            {submitting
              ? t('common.creating')
              : step !== lastIndex
                ? t('create.nav.next')
                : steps[step] === 'account'
                  ? t('create.nav.createAccount')
                  : t('create.nav.submit')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CreateCalendarPage;

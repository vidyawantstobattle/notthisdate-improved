import { getErrorMessage, type ApiErrorLike } from '../utils/errorHandling';
import { useI18n } from '../context/I18nContext';

interface ErrorMessageProps {
  error: ApiErrorLike | null;
  onRetry?: () => void;
  onDismiss?: () => void;
  context?: string;
}

function ErrorMessage({ error, onRetry, onDismiss, context = '' }: ErrorMessageProps) {
  const { t } = useI18n();
  if (!error) return null;

  const errorInfo = getErrorMessage(error, context);
  const description = errorInfo.messageOverride ?? t(errorInfo.messageKey);

  return (
    <div className="error-message" role="alert" aria-live="polite">
      <div className="error-content">
        <div className="error-icon">⚠️</div>
        <div className="error-text">
          <h3 className="error-title">{t(errorInfo.titleKey)}</h3>
          <p className="error-description">{description}</p>
        </div>
      </div>
      <div className="error-actions">
        {errorInfo.action === 'Retry' && onRetry && (
          <button className="btn btn-primary btn-small" onClick={onRetry} aria-label={t('error.retryAria')}>
            {t('common.retry')}
          </button>
        )}
        {onDismiss && (
          <button className="btn btn-outline btn-small" onClick={onDismiss} aria-label={t('error.dismissAria')}>
            {t('common.dismiss')}
          </button>
        )}
      </div>
    </div>
  );
}

export default ErrorMessage;

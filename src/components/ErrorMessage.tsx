import { getErrorMessage, type ApiErrorLike } from '../utils/errorHandling';

interface ErrorMessageProps {
  error: ApiErrorLike | null;
  onRetry?: () => void;
  onDismiss?: () => void;
  context?: string;
}

function ErrorMessage({ error, onRetry, onDismiss, context = '' }: ErrorMessageProps) {
  if (!error) return null;

  const errorInfo = getErrorMessage(error, context);

  return (
    <div className="error-message" role="alert" aria-live="polite">
      <div className="error-content">
        <div className="error-icon">⚠️</div>
        <div className="error-text">
          <h3 className="error-title">{errorInfo.title}</h3>
          <p className="error-description">{errorInfo.message}</p>
        </div>
      </div>
      <div className="error-actions">
        {errorInfo.action === 'Retry' && onRetry && (
          <button className="btn btn-primary btn-small" onClick={onRetry} aria-label="Retry the failed operation">
            {errorInfo.action}
          </button>
        )}
        {onDismiss && (
          <button className="btn btn-outline btn-small" onClick={onDismiss} aria-label="Dismiss this error message">
            Dismiss
          </button>
        )}
      </div>
    </div>
  );
}

export default ErrorMessage;

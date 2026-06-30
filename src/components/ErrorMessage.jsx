import React from 'react';
import { getErrorMessage } from '../utils/errorHandling';

function ErrorMessage({ error, onRetry, onDismiss, context = '' }) {
  const errorInfo = getErrorMessage(error, context);
  
  if (!error) return null;
  
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
          <button 
            className="btn btn-primary btn-small"
            onClick={onRetry}
            aria-label="Retry the failed operation"
          >
            {errorInfo.action}
          </button>
        )}
        {onDismiss && (
          <button 
            className="btn btn-outline btn-small"
            onClick={onDismiss}
            aria-label="Dismiss this error message"
          >
            Dismiss
          </button>
        )}
      </div>
    </div>
  );
}

export default ErrorMessage;

export const ErrorTypes = {
  NETWORK: 'NETWORK',
  TIMEOUT: 'TIMEOUT',
  SERVER: 'SERVER',
  CLIENT: 'CLIENT',
  UNKNOWN: 'UNKNOWN'
} as const;

export type ErrorType = (typeof ErrorTypes)[keyof typeof ErrorTypes];

export interface ApiErrorLike extends Error {
  status?: number;
}

export interface ErrorMessageInfo {
  titleKey: string;
  messageKey: string;
  /** Server-supplied detail, shown instead of messageKey when present. */
  messageOverride?: string;
  action: 'Retry' | 'OK';
}

export function getErrorType(error: ApiErrorLike): ErrorType {
  if (!navigator.onLine) {
    return ErrorTypes.NETWORK;
  }
  if (error.name === 'AbortError' || error.message?.includes('timeout')) {
    return ErrorTypes.TIMEOUT;
  }
  if (error.status && error.status >= 500) {
    return ErrorTypes.SERVER;
  }
  if (error.status && error.status >= 400 && error.status < 500) {
    return ErrorTypes.CLIENT;
  }
  return ErrorTypes.UNKNOWN;
}

export function getErrorMessage(error: ApiErrorLike, _context = ''): ErrorMessageInfo {
  const errorType = getErrorType(error);

  const messages: Record<ErrorType, ErrorMessageInfo> = {
    [ErrorTypes.NETWORK]: {
      titleKey: 'error.network.title',
      messageKey: 'error.network.message',
      action: 'Retry'
    },
    [ErrorTypes.TIMEOUT]: {
      titleKey: 'error.timeout.title',
      messageKey: 'error.timeout.message',
      action: 'Retry'
    },
    [ErrorTypes.SERVER]: {
      titleKey: 'error.server.title',
      messageKey: 'error.server.message',
      action: 'Retry'
    },
    [ErrorTypes.CLIENT]: {
      titleKey: 'error.client.title',
      messageKey: 'error.client.message',
      messageOverride: error.message || undefined,
      action: 'OK'
    },
    [ErrorTypes.UNKNOWN]: {
      titleKey: 'error.unknown.title',
      messageKey: 'error.unknown.message',
      action: 'Retry'
    }
  };

  return messages[errorType];
}

export function shouldRetry(error: ApiErrorLike, attemptNumber: number): boolean {
  if (attemptNumber >= 3) return false;

  const errorType = getErrorType(error);
  return ([ErrorTypes.NETWORK, ErrorTypes.TIMEOUT, ErrorTypes.SERVER] as ErrorType[]).includes(errorType);
}

export function getRetryDelay(attemptNumber: number): number {
  return Math.min(1000 * Math.pow(2, attemptNumber), 10000);
}

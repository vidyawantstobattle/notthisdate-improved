export const ErrorTypes = {
  NETWORK: 'NETWORK',
  TIMEOUT: 'TIMEOUT',
  SERVER: 'SERVER',
  CLIENT: 'CLIENT',
  UNKNOWN: 'UNKNOWN'
};

export function getErrorType(error) {
  if (!navigator.onLine) {
    return ErrorTypes.NETWORK;
  }
  if (error.name === 'AbortError' || error.message?.includes('timeout')) {
    return ErrorTypes.TIMEOUT;
  }
  if (error.status >= 500) {
    return ErrorTypes.SERVER;
  }
  if (error.status >= 400 && error.status < 500) {
    return ErrorTypes.CLIENT;
  }
  return ErrorTypes.UNKNOWN;
}

export function getErrorMessage(error, context = '') {
  const errorType = getErrorType(error);
  
  const messages = {
    [ErrorTypes.NETWORK]: {
      title: 'No Internet Connection',
      message: 'Please check your internet connection and try again.',
      action: 'Retry'
    },
    [ErrorTypes.TIMEOUT]: {
      title: 'Request Timed Out',
      message: 'The request took too long. Please try again.',
      action: 'Retry'
    },
    [ErrorTypes.SERVER]: {
      title: 'Server Error',
      message: 'Something went wrong on our end. Please try again in a moment.',
      action: 'Retry'
    },
    [ErrorTypes.CLIENT]: {
      title: 'Request Error',
      message: error.message || 'There was a problem with your request.',
      action: 'OK'
    },
    [ErrorTypes.UNKNOWN]: {
      title: 'Something Went Wrong',
      message: 'An unexpected error occurred. Please try again.',
      action: 'Retry'
    }
  };

  return messages[errorType];
}

export function shouldRetry(error, attemptNumber) {
  if (attemptNumber >= 3) return false;
  
  const errorType = getErrorType(error);
  return [ErrorTypes.NETWORK, ErrorTypes.TIMEOUT, ErrorTypes.SERVER].includes(errorType);
}

export function getRetryDelay(attemptNumber) {
  return Math.min(1000 * Math.pow(2, attemptNumber), 10000);
}

import { shouldRetry, getRetryDelay } from './errorHandling';

const API_TIMEOUT = 30000; // 30 seconds

async function fetchWithTimeout(url, options = {}, timeout = API_TIMEOUT) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      const timeoutError = new Error('Request timeout');
      timeoutError.name = 'AbortError';
      throw timeoutError;
    }
    throw error;
  }
}

async function retryableFetch(url, options = {}, attemptNumber = 0) {
  try {
    const response = await fetchWithTimeout(url, options);
    
    if (!response.ok) {
      const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
      error.status = response.status;
      error.response = response;
      throw error;
    }
    
    return response;
  } catch (error) {
    if (shouldRetry(error, attemptNumber)) {
      const delay = getRetryDelay(attemptNumber);
      await new Promise(resolve => setTimeout(resolve, delay));
      return retryableFetch(url, options, attemptNumber + 1);
    }
    throw error;
  }
}

export async function apiGet(url, token = null) {
  const headers = {
    'Content-Type': 'application/json'
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await retryableFetch(url, { method: 'GET', headers });
  return response.json();
}

export async function apiPost(url, data, token = null) {
  const headers = {
    'Content-Type': 'application/json'
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await retryableFetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(data)
  });
  
  return response.json();
}

export async function apiDelete(url, token = null) {
  const headers = {
    'Content-Type': 'application/json'
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await retryableFetch(url, { method: 'DELETE', headers });
  return response.json();
}

export function isOnline() {
  return navigator.onLine;
}

export function setupOfflineDetection(onOffline, onOnline) {
  window.addEventListener('offline', onOffline);
  window.addEventListener('online', onOnline);
  
  return () => {
    window.removeEventListener('offline', onOffline);
    window.removeEventListener('online', onOnline);
  };
}

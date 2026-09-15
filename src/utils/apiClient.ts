import { shouldRetry, getRetryDelay, type ApiErrorLike } from './errorHandling';

const API_TIMEOUT = 30000; // 30 seconds

interface FetchError extends Error {
  status?: number;
  response?: Response;
}

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeout = API_TIMEOUT): Promise<Response> {
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
    if ((error as Error).name === 'AbortError') {
      const timeoutError = new Error('Request timeout');
      timeoutError.name = 'AbortError';
      throw timeoutError;
    }
    throw error;
  }
}

async function retryableFetch(url: string, options: RequestInit = {}, attemptNumber = 0): Promise<Response> {
  try {
    const response = await fetchWithTimeout(url, options);

    if (!response.ok) {
      const error: FetchError = new Error(`HTTP ${response.status}: ${response.statusText}`);
      error.status = response.status;
      error.response = response;
      throw error;
    }

    return response;
  } catch (error) {
    if (shouldRetry(error as ApiErrorLike, attemptNumber)) {
      const delay = getRetryDelay(attemptNumber);
      await new Promise(resolve => setTimeout(resolve, delay));
      return retryableFetch(url, options, attemptNumber + 1);
    }
    throw error;
  }
}

export async function apiGet<T = any>(url: string, token: string | null = null): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await retryableFetch(url, { method: 'GET', headers });
  return response.json();
}

export async function apiPost<T = any>(url: string, data: unknown, token: string | null = null): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await retryableFetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(data)
  });

  return response.json();
}

export async function apiDelete<T = any>(url: string, token: string | null = null): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await retryableFetch(url, { method: 'DELETE', headers });
  return response.json();
}

export function isOnline(): boolean {
  return navigator.onLine;
}

export function setupOfflineDetection(onOffline: () => void, onOnline: () => void): () => void {
  window.addEventListener('offline', onOffline);
  window.addEventListener('online', onOnline);

  return () => {
    window.removeEventListener('offline', onOffline);
    window.removeEventListener('online', onOnline);
  };
}

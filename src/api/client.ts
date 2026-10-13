// ===== API CLIENT (backend adapter boundary) =====
// This is the ONLY module that should know the API base URL / path shape.
// Everything else in the app calls the typed functions in api/*.api.ts.
//
// To point this app at a different backend (Perl/PHP/Go/etc instead of Netlify
// Functions), set VITE_API_BASE_URL and, if the new backend's request/response
// shapes differ, adjust the small per-resource files in this folder; no
// changes needed anywhere else in the app.

import { apiGet, apiPost, apiDelete } from '../utils/apiClient';

const PROD_SITE_URL = 'https://reverse-date-picker.netlify.app';

// Port `netlify dev` is configured to serve on (see netlify.toml).
const NETLIFY_DEV_PORT = '9999';

// `vite dev` has no functions runtime, so it has to borrow the deployed ones.
// The request goes straight from the browser rather than through a Vite proxy so
// TLS is terminated by the browser, which matters on networks that intercept
// certificates — Node would reject those, Chrome accepts them.
//
// `netlify dev` does run the functions, including ones not deployed yet, and
// serves them same-origin. Reach for it when working on a new endpoint;
// against `vite dev` an undeployed function 404s, and because Netlify's 404
// page carries no CORS headers the browser reports it as a CORS failure.
function defaultBaseUrl(): string {
  if (typeof window === 'undefined') return '/.netlify/functions';

  const { hostname, port } = window.location;
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';

  if (!isLocalhost || port === NETLIFY_DEV_PORT) return '/.netlify/functions';
  return `${PROD_SITE_URL}/.netlify/functions`;
}

// Override via .env: VITE_API_BASE_URL=https://api.example.com/v1
const API_BASE_URL: string = (import.meta as any).env?.VITE_API_BASE_URL || defaultBaseUrl();

function endpoint(path: string): string {
  return `${API_BASE_URL}${path}`;
}

export const apiClient = {
  get: <T = any>(path: string, token?: string | null): Promise<T> => apiGet(endpoint(path), token),
  post: <T = any>(path: string, data: unknown, token?: string | null): Promise<T> => apiPost(endpoint(path), data, token),
  delete: <T = any>(path: string, token?: string | null): Promise<T> => apiDelete(endpoint(path), token)
};

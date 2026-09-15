// ===== API CLIENT (backend adapter boundary) =====
// This is the ONLY module that should know the API base URL / path shape.
// Everything else in the app calls the typed functions in api/*.api.ts.
//
// To point this app at a different backend (Perl/PHP/Go/etc instead of Netlify
// Functions), set VITE_API_BASE_URL and, if the new backend's request/response
// shapes differ, adjust the small per-resource files in this folder — no
// changes needed anywhere else in the app.

import { apiGet, apiPost, apiDelete } from '../utils/apiClient';

// Defaults to same-origin "/.netlify/functions" (current backend). Override via
// .env: VITE_API_BASE_URL=https://api.example.com/v1
const API_BASE_URL: string = (import.meta as any).env?.VITE_API_BASE_URL || '/.netlify/functions';

function endpoint(path: string): string {
  return `${API_BASE_URL}${path}`;
}

export const apiClient = {
  get: <T = any>(path: string, token?: string | null): Promise<T> => apiGet(endpoint(path), token),
  post: <T = any>(path: string, data: unknown, token?: string | null): Promise<T> => apiPost(endpoint(path), data, token),
  delete: <T = any>(path: string, token?: string | null): Promise<T> => apiDelete(endpoint(path), token)
};

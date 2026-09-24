// ===== AUTH ABSTRACTION =====
// Every component in the app talks to auth ONLY through useAuth() / AuthProvider.
// Netlify Identity is the current implementation, but it's fully contained in
// this one file — swapping to Auth0, Firebase Auth, or a custom JWT backend
// means rewriting this file only, with the AuthContextValue contract unchanged.

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { observeIdentityPasswordFields } from '../utils/identityPasswordUI';

export interface AuthUser {
  email: string;
  jwt: () => Promise<string>;
  user_metadata?: { full_name?: string };
}

export interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: () => void;
  signup: () => void;
  logout: () => void;
  getAuthHeaders: () => Promise<Record<string, string>>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// Guest-to-auth journey: a guest who clicks a CTA that requires an account has
// their intent parked here, then replayed once they land authenticated. Uses
// localStorage so it survives the full-page reload of email verification.
const PENDING_ACTION_KEY = 'ntd_pendingAction';

export type PendingAction = 'createCalendar';

export function setPendingAction(action: PendingAction): void {
  try {
    localStorage.setItem(PENDING_ACTION_KEY, action);
  } catch {
    // Private browsing / storage disabled: the journey degrades to a normal signup.
  }
}

export function consumePendingAction(): PendingAction | null {
  try {
    const action = localStorage.getItem(PENDING_ACTION_KEY);
    if (action) localStorage.removeItem(PENDING_ACTION_KEY);
    return action as PendingAction | null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [netlifyIdentity, setNetlifyIdentity] = useState<any>(null);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://identity.netlify.com/v1/netlify-identity-widget.js';
    script.async = true;
    document.head.appendChild(script);

    script.onload = () => {
      const identity = (window as any).netlifyIdentity;
      setNetlifyIdentity(identity);

      identity.on('init', (u: AuthUser) => {
        setUser(u);
        setLoading(false);
      });

      identity.on('login', (u: AuthUser) => {
        setUser(u);
        identity.close();
      });

      identity.on('logout', () => {
        setUser(null);
      });

      // Identity has no endpoint to talk to on localhost, so point it at the
      // deployed site (mirrors public/app.js). Without this the `init` event
      // never fires and the UI hangs in its loading state.
      const host = window.location.hostname;
      if (host === 'localhost' || host === '127.0.0.1') {
        identity.init({ APIUrl: 'https://reverse-date-picker.netlify.app/.netlify/identity' });
      } else {
        identity.init();
      }
    };

    // Don't strand the UI in a loading state if the widget is blocked.
    script.onerror = () => setLoading(false);

    const stopObservingPasswordFields = observeIdentityPasswordFields();

    return () => {
      stopObservingPasswordFields();
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  const login = () => {
    netlifyIdentity?.open('login');
  };

  const signup = () => {
    netlifyIdentity?.open('signup');
  };

  const logout = () => {
    netlifyIdentity?.logout();
  };

  const getAuthHeaders = async (): Promise<Record<string, string>> => {
    if (!user) return {};
    const token = await user.jwt();
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  };

  const value: AuthContextValue = { user, loading, login, signup, logout, getAuthHeaders };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

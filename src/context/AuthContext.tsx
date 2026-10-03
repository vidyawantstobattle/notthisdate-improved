// ===== AUTH ABSTRACTION =====
// Every component in the app talks to auth ONLY through useAuth() / AuthProvider.
// Netlify Identity is the current implementation, but it's fully contained in
// this one file, so swapping to Auth0, Firebase Auth, or a custom JWT backend
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
export interface PendingCalendarDraft {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  participantsType: 'defined' | 'open';
  participants: string[];
  requireEmailVerification: boolean;
  blockedDates: string[];
  blockedDateReasons: Record<string, string>;
}

const PENDING_CALENDAR_DRAFT_KEY = 'ntd_pendingCalendarDraft';

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

function sanitizeBlockedDateReasons(raw: unknown): Record<string, string> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const result: Record<string, string> = {};
  Object.entries(raw as Record<string, unknown>).forEach(([date, reason]) => {
    if (typeof reason === 'string' && reason.trim()) result[date] = reason.trim();
  });
  return result;
}

export function setPendingCalendarDraft(draft: PendingCalendarDraft): void {
  try {
    localStorage.setItem(PENDING_CALENDAR_DRAFT_KEY, JSON.stringify(draft));
  } catch {
    // Private browsing / storage disabled: the journey degrades to manual re-entry.
  }
}

export function consumePendingCalendarDraft(): PendingCalendarDraft | null {
  try {
    const rawDraft = localStorage.getItem(PENDING_CALENDAR_DRAFT_KEY);
    if (!rawDraft) return null;

    localStorage.removeItem(PENDING_CALENDAR_DRAFT_KEY);
    const parsed = JSON.parse(rawDraft) as Partial<PendingCalendarDraft>;

    if (
      typeof parsed.name !== 'string' ||
      typeof parsed.description !== 'string' ||
      typeof parsed.startDate !== 'string' ||
      typeof parsed.endDate !== 'string' ||
      (parsed.participantsType !== 'defined' && parsed.participantsType !== 'open') ||
      !Array.isArray(parsed.participants) ||
      typeof parsed.requireEmailVerification !== 'boolean'
    ) {
      return null;
    }

    return {
      name: parsed.name,
      description: parsed.description,
      startDate: parsed.startDate,
      endDate: parsed.endDate,
      participantsType: parsed.participantsType,
      participants: parsed.participants.filter(p => typeof p === 'string'),
      requireEmailVerification: parsed.requireEmailVerification,
      blockedDates: Array.isArray(parsed.blockedDates)
        ? parsed.blockedDates.filter(d => typeof d === 'string')
        : [],
      blockedDateReasons: sanitizeBlockedDateReasons(parsed.blockedDateReasons)
    };
  } catch {
    return null;
  }
}

// Tokens Netlify Identity hands back in the URL fragment (email confirmation,
// invites, password recovery). They must survive until the widget has consumed
// them, then be wiped so a reload can't replay the flow.
const IDENTITY_HASH_TOKEN = /\b(confirmation_token|invite_token|recovery_token|email_change_token|access_token)=/;

function clearIdentityHash(): void {
  if (IDENTITY_HASH_TOKEN.test(window.location.hash)) {
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
  }
}

// The widget lives in a full-screen fixed iframe that it only hides as part of
// its own close animation. A programmatic close (which is what happens right
// after the email-confirmation login) can leave that iframe on top of the page,
// where it silently swallows every click until the next full reload.
function setWidgetIframeHidden(hidden: boolean): void {
  const iframe = document.querySelector<HTMLElement>('#netlify-identity-widget');
  if (!iframe) return;
  iframe.style.visibility = hidden ? 'hidden' : '';
  iframe.style.pointerEvents = hidden ? 'none' : '';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [netlifyIdentity, setNetlifyIdentity] = useState<any>(null);

  useEffect(() => {
    const existing = (window as any).netlifyIdentity;
    let script: HTMLScriptElement | null = null;

    const wireUp = (identity: any) => {
      setNetlifyIdentity(identity);

      identity.on('init', (u: AuthUser | null) => {
        setUser(u);
        setLoading(false);
      });

      identity.on('login', (u: AuthUser) => {
        setUser(u);
        // Defer: closing synchronously from inside the event leaves the widget
        // mid-animation, which is how the dead full-screen iframe appears.
        setTimeout(() => {
          identity.close();
          setWidgetIframeHidden(true);
        }, 0);
        clearIdentityHash();
      });

      identity.on('logout', () => {
        setUser(null);
        setWidgetIframeHidden(true);
      });

      identity.on('open', () => setWidgetIframeHidden(false));
      identity.on('close', () => setWidgetIframeHidden(true));

      // Identity has no endpoint to talk to on localhost, so point it at the
      // deployed site. Without this the `init` event never fires and the UI
      // hangs in its loading state.
      const host = window.location.hostname;
      if (host === 'localhost' || host === '127.0.0.1') {
        identity.init({ APIUrl: 'https://reverse-date-picker.netlify.app/.netlify/identity' });
      } else {
        identity.init();
      }
    };

    if (existing) {
      wireUp(existing);
    } else {
      script = document.createElement('script');
      script.src = 'https://identity.netlify.com/v1/netlify-identity-widget.js';
      script.async = true;
      script.onload = () => wireUp((window as any).netlifyIdentity);
      // Don't strand the UI in a loading state if the widget is blocked.
      script.onerror = () => setLoading(false);
      document.head.appendChild(script);
    }

    const stopObservingPasswordFields = observeIdentityPasswordFields();

    return () => {
      stopObservingPasswordFields();
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

// ===== AUTH ABSTRACTION =====
// Every component in the app talks to auth ONLY through useAuth() / AuthProvider.
// Netlify Identity is the current implementation, but it's fully contained in
// this one file — swapping to Auth0, Firebase Auth, or a custom JWT backend
// means rewriting this file only, with the AuthContextValue contract unchanged.

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

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

      identity.init();
    };

    return () => {
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

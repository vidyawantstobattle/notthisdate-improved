import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [netlifyIdentity, setNetlifyIdentity] = useState(null);

  useEffect(() => {
    // Load Netlify Identity widget
    const script = document.createElement('script');
    script.src = 'https://identity.netlify.com/v1/netlify-identity-widget.js';
    script.async = true;
    document.head.appendChild(script);

    script.onload = () => {
      const identity = window.netlifyIdentity;
      setNetlifyIdentity(identity);

      identity.on('init', user => {
        setUser(user);
        setLoading(false);
      });

      identity.on('login', user => {
        setUser(user);
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

  const getAuthHeaders = async () => {
    if (!user) return {};
    const token = await user.jwt();
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  };

  const value = {
    user,
    loading,
    login,
    signup,
    logout,
    getAuthHeaders
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}


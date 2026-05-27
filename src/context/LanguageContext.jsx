import React, { createContext, useContext, useState } from 'react';
const LanguageContext = createContext(null);
const translations = {
  en: {
    appName: 'NotThisDate',
    tagline: 'Group trip planning made simple',
  },
};
export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState('en');
  const t = (key) => {
    return translations[language]?.[key] || key;
  };
  const value = {
    language,
    setLanguage,
    t
  };
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}
export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}

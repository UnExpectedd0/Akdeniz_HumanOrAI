import React, { createContext, useContext, useState } from 'react';
import en from '../locales/en.json';
import tr from '../locales/tr.json';

const translations = { en, tr };
const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'en');

  const toggleLang = () => {
    const next = lang === 'en' ? 'tr' : 'en';
    setLang(next);
    localStorage.setItem('lang', next);
  };

  const t = (key) => {
    const keys = key.split('.');
    let val = translations[lang];
    for (const k of keys) val = val?.[k];
    return val || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, toggleLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);

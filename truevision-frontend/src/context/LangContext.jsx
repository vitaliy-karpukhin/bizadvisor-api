import React, { createContext, useContext, useState } from 'react';

const LangContext = createContext();
export default LangContext;

export function LangProvider({ children }) {
  const [lang, setLang] = useState(localStorage.getItem('lang') || 'de');

  const switchLang = (newLang) => {
    setLang(newLang);
    localStorage.setItem('lang', newLang);
  };

  return (
    <LangContext.Provider value={{ lang, switchLang }}>
      {children}
    </LangContext.Provider>
  );
}

export const useLang = () => useContext(LangContext);

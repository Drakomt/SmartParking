import React, { createContext, useContext, useState, useEffect } from 'react';

const SettingsContext = createContext();

export const useSettings = () => {
  return useContext(SettingsContext);
};

export const SettingsProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('isDarkMode');
    return saved ? JSON.parse(saved) : false;
  });

  const [isLargeText, setIsLargeText] = useState(() => {
    const saved = localStorage.getItem('isLargeText');
    return saved ? JSON.parse(saved) : false;
  });

  const [isColorBlindMode, setIsColorBlindMode] = useState(() => {
    const saved = localStorage.getItem('isColorBlindMode');
    return saved ? JSON.parse(saved) : false;
  });

  const [themeColor, setThemeColor] = useState(() => {
    const saved = localStorage.getItem('themeColor');
    return saved ? JSON.parse(saved) : 'classic';
  });

  useEffect(() => {
    localStorage.setItem('isDarkMode', JSON.stringify(isDarkMode));
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    localStorage.setItem('isLargeText', JSON.stringify(isLargeText));
    if (isLargeText) {
      document.documentElement.classList.add('large-text');
    } else {
      document.documentElement.classList.remove('large-text');
    }
  }, [isLargeText]);

  useEffect(() => {
    localStorage.setItem('isColorBlindMode', JSON.stringify(isColorBlindMode));
    if (isColorBlindMode) {
      document.documentElement.classList.add('theme-colorblind');
    } else {
      document.documentElement.classList.remove('theme-colorblind');
    }
  }, [isColorBlindMode]);

  useEffect(() => {
    localStorage.setItem('themeColor', JSON.stringify(themeColor));
    document.documentElement.classList.remove('theme-ocean', 'theme-earth');
    if (themeColor === 'ocean') {
      document.documentElement.classList.add('theme-ocean');
    } else if (themeColor === 'earth') {
      document.documentElement.classList.add('theme-earth');
    }
  }, [themeColor]);

  const value = {
    isDarkMode,
    setIsDarkMode,
    isLargeText,
    setIsLargeText,
    isColorBlindMode,
    setIsColorBlindMode,
    themeColor,
    setThemeColor,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

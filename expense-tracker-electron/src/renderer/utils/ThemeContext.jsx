import React, { createContext, useState, useContext, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('light');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load theme from settings
    const loadTheme = async () => {
      try {
        if (window.electronAPI) {
          const result = await window.electronAPI.getSetting('theme');
          if (result.success && result.data) {
            setTheme(result.data);
            document.documentElement.setAttribute('data-theme', result.data);
          }
        }
      } catch (error) {
        console.error('Error loading theme:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTheme();
  }, []);

  const toggleTheme = async () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);

    // Save theme to settings
    if (window.electronAPI) {
      try {
        await window.electronAPI.setSetting({ key: 'theme', value: newTheme });
      } catch (error) {
        console.error('Error saving theme:', error);
      }
    }
  };

  const value = {
    theme,
    toggleTheme,
    isDark: theme === 'dark',
    isLoading
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

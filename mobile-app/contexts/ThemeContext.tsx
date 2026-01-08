import React, { createContext, useContext, useState } from 'react';

type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({ theme: 'light', toggleTheme: () => {} });

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setTheme] = useState<Theme>('light');

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

export const getColors = (theme: Theme) => ({
  background: theme === 'dark' ? '#000000' : '#ffffff',
  card: theme === 'dark' ? '#0a0a0a' : '#f9fafb',
  border: theme === 'dark' ? '#1a1a1a' : '#e5e7eb',
  text: theme === 'dark' ? '#ffffff' : '#000000',
  textSecondary: theme === 'dark' ? '#a3a3a3' : '#6b7280',
  textTertiary: theme === 'dark' ? '#737373' : '#9ca3af',
});

import React, { createContext, useContext, useMemo } from 'react';
import { socialColors, professionalColors, ColorPalette } from './colors';
import { typography } from './typography';
import { spacing, borderRadius } from './spacing';
import { useModeStore } from '../store/modeStore';

export interface Theme {
  colors: ColorPalette;
  typography: typeof typography;
  spacing: typeof spacing;
  borderRadius: typeof borderRadius;
}

const ThemeContext = createContext<Theme>({
  colors: socialColors,
  typography,
  spacing,
  borderRadius,
});

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const mode = useModeStore((state) => state.mode);

  const theme = useMemo<Theme>(
    () => ({
      colors: mode === 'social' ? socialColors : professionalColors,
      typography,
      spacing,
      borderRadius,
    }),
    [mode],
  );

  return (
    <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
  );
};

export const useTheme = (): Theme => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

import { ThemeProps } from '@rjsf/core';
import { FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { getDefaultRegistry } from '@rjsf/core';
import { generateTemplates } from '../templates';
import { generateWidgets } from '../widgets';
import React from 'react';

export function generateTheme<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(): ThemeProps<T, S, F> {
  const { fields } = getDefaultRegistry<T, S, F>();
  return {
    templates: generateTemplates<T, S, F>(),
    widgets: generateWidgets<T, S, F>(),
    fields,
  };
}

const Theme = generateTheme();

export default Theme;

interface ThemeContextType {
  theme: string;
  setTheme: (theme: string) => void;
}

export const ThemeContext = React.createContext<ThemeContextType>({
  theme: 'cupcake',
  setTheme: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = React.useState(() => {
    try {
      return localStorage.getItem('daisyui-theme') || 'cupcake';
    } catch {
      return 'cupcake';
    }
  });

  const handleSetTheme = React.useCallback((newTheme: string) => {
    try {
      localStorage.setItem('daisyui-theme', newTheme);
      setTheme(newTheme);
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  return <ThemeContext.Provider value={{ theme, setTheme: handleSetTheme }}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => React.useContext(ThemeContext);

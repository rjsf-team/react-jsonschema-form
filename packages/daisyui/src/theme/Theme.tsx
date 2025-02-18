import { ThemeProps } from '@rjsf/core';
import { FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { getDefaultRegistry } from '@rjsf/core';
import { generateTemplates } from '../templates/Templates';
import { generateWidgets } from '../widgets/Widgets';
import React from 'react';

export function generateTheme<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(): ThemeProps<T, S, F> {
  const { fields, widgets } = getDefaultRegistry<T, S, F>();
  const generatedWidgets = generateWidgets<T, S, F>();
  return {
    templates: generateTemplates<T, S, F>(),
    widgets: {
      ...generatedWidgets,
      boolean: generatedWidgets.toggle,
    },
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

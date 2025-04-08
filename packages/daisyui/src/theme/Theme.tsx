import { ThemeProps } from '@rjsf/core';
import { FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { getDefaultRegistry } from '@rjsf/core';
import { generateTemplates } from '../templates/Templates';
import { generateWidgets } from '../widgets/Widgets';
import React from 'react';

/** Generates a complete theme configuration for RJSF with DaisyUI styling
 *
 * Combines templates and widgets with default fields to create a complete theme
 * that can be used with react-jsonschema-form.
 *
 * @returns A ThemeProps object containing all necessary components for the theme
 */
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

/** Default theme export with pre-generated theme components */
const Theme = generateTheme();

export default Theme;

/** Interface for the theme context that manages and provides the current DaisyUI theme */
interface ThemeContextType {
  /** Current DaisyUI theme name */
  theme: string;
  /** Function to update the current theme */
  setTheme: (theme: string) => void;
}

/** React context for sharing theme information throughout the application */
export const ThemeContext = React.createContext<ThemeContextType>({
  theme: 'night',
  setTheme: () => {},
});

/** Props for the ThemeProvider component */
interface ThemeProviderProps {
  /** React components to be wrapped by the provider */
  children: React.ReactNode;
}

/** ThemeProvider component that manages DaisyUI theme state and persistence
 *
 * This provider:
 * - Loads the theme from localStorage
 * - Provides theme state via context
 * - Persists theme changes to localStorage
 *
 * @param props - The props for the component
 */
export function ThemeProvider({ children }: ThemeProviderProps) {
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
}

/** Custom hook for accessing the current theme and theme setter function
 *
 * @returns The current theme context with theme name and setter function
 */
export const useTheme = () => React.useContext(ThemeContext);

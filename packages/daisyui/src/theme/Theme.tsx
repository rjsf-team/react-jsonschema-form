import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ThemeProps } from '@rjsf/core';
import type { FormContextType, RJSFSchema, StrictRJSFSchema, ThemePresentation } from '@rjsf/utils';

import { createTemplates } from '../templates/Templates.tsx';
import { createWidgets } from '../widgets/Widgets.tsx';
import { readStoredTheme, storeTheme } from './storedTheme.ts';

/** Which parts of a field this theme's fields and widgets draw themselves, over `@rjsf/core`'s: the toggle draws its
 * own label and description and holds `false` unchecked, as the checkbox does
 */
function createPresentation(): ThemePresentation {
  return {
    widgets: {
      toggle: { label: 'self', description: 'self', uncheckedIsFalse: true },
    },
  };
}

function createTheme() {
  const widgets = createWidgets();
  return {
    templates: createTemplates(),
    widgets: { ...widgets, boolean: widgets.toggle },
    presentation: createPresentation(),
  };
}

/** Generates the DaisyUI theme: its templates and widgets, as overrides on the core defaults
 *
 * @returns A ThemeProps object containing all necessary components for the theme
 */
export function generateTheme<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(): ThemeProps<T, S, F> {
  return createTheme();
}

export default createTheme();

/** Interface for the theme context that manages and provides the current DaisyUI theme */
interface ThemeContextType {
  /** Current DaisyUI theme name */
  theme: string;
  /** Function to update the current theme */
  setTheme: (theme: string) => void;
}

/** React context for sharing theme information throughout the application */
export const ThemeContext = createContext<ThemeContextType>({
  theme: 'night',
  setTheme: () => {
    /* empty */
  },
});

/** Props for the ThemeProvider component */
interface ThemeProviderProps {
  /** React components to be wrapped by the provider */
  children: ReactNode;
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
  const [theme, setTheme] = useState(readStoredTheme);

  const handleSetTheme = useCallback((newTheme: string) => {
    try {
      storeTheme(newTheme);
      setTheme(newTheme);
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  const contextValue = useMemo(() => ({ theme, setTheme: handleSetTheme }), [theme, handleSetTheme]);
  return <ThemeContext.Provider value={contextValue}>{children}</ThemeContext.Provider>;
}

/** Custom hook for accessing the current theme and theme setter function
 *
 * @returns The current theme context with theme name and setter function
 */
export const useTheme = () => useContext(ThemeContext);

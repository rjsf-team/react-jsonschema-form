import type { ReactNode } from 'react';
import { useMemo, useSyncExternalStore } from 'react';
import type { ThemeProps } from '@rjsf/core';
import type { FormContextType, RJSFSchema, StrictRJSFSchema, ThemePresentation } from '@rjsf/utils';

import { createTemplates } from '../templates/Templates.tsx';
import { createWidgets } from '../widgets/Widgets.tsx';
import { DEFAULT_THEME, readStoredTheme, storeTheme, subscribeToStoredTheme } from './storedTheme.ts';

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

/** Props for the ThemeProvider component */
interface ThemeProviderProps {
  /** React components to be wrapped by the provider */
  children: ReactNode;
}

/** ThemeProvider component, kept for the apps that wrap their forms in it: `useTheme()` reads the stored theme itself,
 * so the provider holds no theme of its own and renders its children as they are
 *
 * @param props - The props for the component
 */
export function ThemeProvider({ children }: ThemeProviderProps) {
  return <>{children}</>;
}

/** Custom hook for accessing the current theme and theme setter function. The stored theme is the one source of truth,
 * read as an external store, so every caller, inside a `ThemeProvider` or not, names the theme a `DaisyUIFrameProvider`
 * shows, and follows one any of them, a provider or another tab stores. The server has no storage, so it renders the
 * default
 *
 * @returns The current theme name, and the setter that stores a theme, where a storage that refuses one leaves the
 *          theme as it was
 */
export function useTheme() {
  const theme = useSyncExternalStore(subscribeToStoredTheme, readStoredTheme, () => DEFAULT_THEME);
  return useMemo(() => ({ theme, setTheme: storeTheme }), [theme]);
}

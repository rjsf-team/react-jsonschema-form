import { createContext, useContext } from 'react';

export type Appearance = 'light' | 'dark' | 'system';

export const APPEARANCE_STORAGE_KEY = 'rjsf-playground-appearance';

export const AppearanceContext = createContext<{
  appearance: Appearance;
  setAppearance: (appearance: Appearance) => void;
} | null>(null);

export function useAppearanceContext() {
  const context = useContext(AppearanceContext);
  if (!context) {
    throw new Error('Appearance controls must be rendered inside Layout');
  }
  return context;
}

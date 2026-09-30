import { createContext } from 'react';

export type Appearance = 'light' | 'dark' | 'system';

export const APPEARANCE_STORAGE_KEY = 'rjsf-playground-appearance';

export const AppearanceContext = createContext<{
  appearance: Appearance;
  setAppearance: (appearance: Appearance) => void;
} | null>(null);

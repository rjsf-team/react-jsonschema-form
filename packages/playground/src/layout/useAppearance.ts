import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { createTheme } from '@mui/material';

import type { Appearance } from './AppearanceContext.ts';
import { APPEARANCE_STORAGE_KEY } from './AppearanceContext.ts';

function getStoredAppearance(): Appearance {
  try {
    const stored = window.localStorage.getItem(APPEARANCE_STORAGE_KEY);
    return stored === 'light' || stored === 'dark' ? stored : 'system';
  } catch {
    return 'system';
  }
}

export default function useAppearance() {
  const [appearance, setAppearance] = useState<Appearance>(getStoredAppearance);
  const media = useMemo(() => window.matchMedia('(prefers-color-scheme: dark)'), []);
  const subscribe = useCallback(
    (onChange: () => void) => {
      media.addEventListener('change', onChange);
      return () => media.removeEventListener('change', onChange);
    },
    [media],
  );
  const getSnapshot = useCallback(() => media.matches, [media]);
  const systemDark = useSyncExternalStore(subscribe, getSnapshot);
  const dark = appearance === 'dark' || (appearance === 'system' && systemDark);
  const theme = useMemo(() => createTheme({ palette: { mode: dark ? 'dark' : 'light' } }), [dark]);

  useEffect(() => {
    try {
      window.localStorage.setItem(APPEARANCE_STORAGE_KEY, appearance);
    } catch {
      // Appearance remains usable when browser storage is unavailable.
    }
  }, [appearance]);

  return useMemo(() => ({ appearance, setAppearance, dark, theme }), [appearance, dark, theme]);
}

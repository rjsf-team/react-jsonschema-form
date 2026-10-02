import type { PropsWithChildren } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { ThemeProvider, createTheme } from '@mui/material';

import type { Appearance } from './AppearanceContext.ts';
import { APPEARANCE_STORAGE_KEY, AppearanceContext } from './AppearanceContext.ts';
import Footer from './Footer.tsx';
import './playground.css';

function getStoredAppearance(): Appearance {
  // Keep preferences saved under the key used before the Appearance rename.
  const stored =
    window.localStorage.getItem(APPEARANCE_STORAGE_KEY) ??
    window.localStorage.getItem('rjsf-playground-color-preference');
  return stored === 'light' || stored === 'dark' ? stored : 'system';
}

export function Layout({ children }: PropsWithChildren) {
  const [appearance, setAppearance] = useState<Appearance>(getStoredAppearance);
  const [systemDark, setSystemDark] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches);
  const dark = appearance === 'dark' || (appearance === 'system' && systemDark);
  const theme = useMemo(() => createTheme({ palette: { mode: dark ? 'dark' : 'light' } }), [dark]);
  const appearanceContext = useMemo(() => ({ appearance, setAppearance }), [appearance]);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (event: MediaQueryListEvent) => setSystemDark(event.matches);
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  return (
    <AppearanceContext.Provider value={appearanceContext}>
      <ThemeProvider theme={theme}>
        <div className={`container-fluid playground-shell${dark ? ' playground-shell--dark' : ''}`}>
          {children}
          <Footer />
        </div>
      </ThemeProvider>
    </AppearanceContext.Provider>
  );
}

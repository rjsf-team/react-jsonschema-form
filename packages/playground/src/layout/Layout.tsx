import type { PropsWithChildren } from 'react';
import { ThemeProvider } from '@mui/material';

import { AppearanceContext } from './AppearanceContext.ts';
import Footer from './Footer.tsx';
import useAppearance from './useAppearance.ts';
import './playground.css';

export function Layout({ children }: PropsWithChildren) {
  const appearance = useAppearance();

  return (
    <AppearanceContext.Provider value={appearance}>
      <ThemeProvider theme={appearance.theme}>
        <div className={`container-fluid playground-shell${appearance.dark ? ' playground-shell--dark' : ''}`}>
          {children}
          <Footer />
        </div>
      </ThemeProvider>
    </AppearanceContext.Provider>
  );
}

import type { PropsWithChildren } from 'react';
import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider, createTheme } from '@mui/material/styles';

import Footer from './Footer.tsx';

export const APPEARANCE_STORAGE_KEY = 'rjsf-playground-appearance';

const theme = createTheme({ colorSchemes: { light: true, dark: true } });

export function Layout({ children }: PropsWithChildren) {
  return (
    <ThemeProvider theme={theme} defaultMode='system' modeStorageKey={APPEARANCE_STORAGE_KEY} noSsr>
      <CssBaseline enableColorScheme />
      <Box sx={{ px: 2 }}>
        {children}
        <Footer />
      </Box>
    </ThemeProvider>
  );
}

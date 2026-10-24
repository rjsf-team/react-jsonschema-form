import type { PropsWithChildren } from 'react';
import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';

import Footer from './Footer.tsx';

export function Layout({ children }: PropsWithChildren) {
  return (
    <Box sx={{ px: 2 }}>
      <CssBaseline />
      {children}
      <Footer />
    </Box>
  );
}

import type { PropsWithChildren } from 'react';

import Footer from './Footer.js';

export function Layout({ children }: PropsWithChildren) {
  return (
    <div className='container-fluid'>
      {children}
      <Footer />
    </div>
  );
}

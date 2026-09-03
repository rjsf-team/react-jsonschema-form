import type { PropsWithChildren } from 'react';

import Footer from './Footer.tsx';

export function Layout({ children }: PropsWithChildren) {
  return (
    <div className='container-fluid'>
      {children}
      <Footer />
    </div>
  );
}

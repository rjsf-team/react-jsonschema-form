import { PropsWithChildren } from 'react';

import Footer from './Footer';

export function Layout({ children }: PropsWithChildren) {
  return (
    <div className='container-fluid'>
      {children}
      <Footer />
    </div>
  );
}

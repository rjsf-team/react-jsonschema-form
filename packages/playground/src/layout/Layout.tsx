import { PropsWithChildren } from 'react';
import Footer from './Footer';

export const Layout: React.FC<PropsWithChildren> = ({ children }) => {
  return (
    <div className='container-fluid'>
      {children}
      <Footer />
    </div>
  );
};

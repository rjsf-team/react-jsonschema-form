import Footer from './Footer';

export const Layout: React.FC = ({ children }) => {
  return (
    <div className='container-fluid'>
      {children}
      <Footer />
    </div>
  );
};

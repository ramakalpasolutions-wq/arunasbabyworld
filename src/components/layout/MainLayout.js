import Header from './Header';
import Footer from './Footer';

export default function MainLayout({ children }) {
  return (
    <>
      <Header />
      <main style={{ minHeight: '70vh', paddingTop: 'var(--header-height)' }}>
        {children}
      </main>
      <Footer />
    </>
  );
}

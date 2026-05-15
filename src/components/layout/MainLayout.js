'use client';
import { usePathname } from 'next/navigation';
import Header from './Header';
import Footer from './Footer';
import SessionWrapper from './SessionWrapper';

export default function MainLayout({ children }) {
  const pathname    = usePathname();
  const isAdminPage = pathname?.startsWith('/admin');

  if (isAdminPage) {
    return <>{children}</>;
  }

  return (
    <SessionWrapper>
      <Header />
      <main style={{
        minHeight:  '70vh',
        paddingTop: 'var(--header-height, 130px)',
      }}>
        {children}
      </main>
      <Footer />
    </SessionWrapper>
  );
}
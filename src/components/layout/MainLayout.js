// src/components/layout/MainLayout.js
'use client';
import { usePathname } from 'next/navigation';
import Header from './Header';
import Footer from './Footer';

export default function MainLayout({ children }) {
  const pathname = usePathname();

  // Hide Header + Footer on all admin pages
  const isAdminPage = pathname?.startsWith('/admin');

  if (isAdminPage) {
    return <>{children}</>;
  }

  return (
    <>
      <Header />
      <main style={{
        minHeight: '70vh',
        paddingTop: 'var(--header-height, 130px)',
      }}>
        {children}
      </main>
      <Footer />
    </>
  );
}
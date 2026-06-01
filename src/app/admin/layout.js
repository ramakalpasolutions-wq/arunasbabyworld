// src/app/admin/layout.js
'use client';
import { usePathname } from 'next/navigation';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminGuard from '@/components/admin/AdminGuard';
import { CartProvider } from '@/context/CartContext';
import { WishlistProvider } from '@/context/WishlistContext';
import styles from './admin.module.css';

export default function AdminLayout({ children }) {
  const pathname = usePathname();

  // ✅ LOGIN PAGE → render plain, NO sidebar, NO guard
  if (pathname === '/admin/login') {
    return (
      <CartProvider>
        <WishlistProvider>
          {children}
        </WishlistProvider>
      </CartProvider>
    );
  }

  // ✅ ALL OTHER ADMIN PAGES → full layout with sidebar + guard
  return (
    <CartProvider>
      <WishlistProvider>
        <AdminGuard>
          <div className={styles.adminLayout}>
            <AdminSidebar />
            <main className={styles.adminMain}>
              {children}
            </main>
          </div>
        </AdminGuard>
      </WishlistProvider>
    </CartProvider>
  );
}
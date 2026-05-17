import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminGuard from '@/components/admin/AdminGuard';
import { CartProvider } from '@/context/CartContext';
import { WishlistProvider } from '@/context/WishlistContext';
import styles from './admin.module.css';

export const metadata = {
  title: { default: 'Admin Dashboard', template: '%s | Admin' },
};

export default function AdminLayout({ children }) {
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
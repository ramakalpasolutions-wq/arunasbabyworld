import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminGuard from '@/components/admin/AdminGuard';
import styles from './admin.module.css';

export const metadata = {
  title: { default: 'Admin Dashboard', template: '%s | Admin' }
};

export default function AdminLayout({ children }) {
  return (
    <AdminGuard>
      <div className={styles.adminLayout}>
        <AdminSidebar />
        <main className={styles.adminMain}>
          {children}
        </main>
      </div>
    </AdminGuard>
  );
}
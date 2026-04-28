'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import styles from './AdminSidebar.module.css';

const navItems = [
  { href: '/admin/dashboard', icon: '📊', label: 'Dashboard' },
  { href: '/admin/products', icon: '📦', label: 'Products' },
  { href: '/admin/categories', icon: '🗂️', label: 'Categories' },
  { href: '/admin/banners', icon: '🖼️', label: 'Banners' },
  { href: '/admin/orders', icon: '🛍️', label: 'Orders' },
  { href: '/admin/coupons', icon: '🎟️', label: 'Coupons' },
  { href: '/admin/users', icon: '👥', label: 'Users' },
  { href: '/admin/contacts', icon: '📩', label: 'Contact Messages' },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <span>🍼</span>
        <div>
          <div className={styles.logoText}>BabyBliss</div>
          <div className={styles.logoSub}>Admin Panel</div>
        </div>
      </div>

      <nav className={styles.nav}>
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`${styles.navItem} ${pathname === item.href ? styles.navActive : ''}`}
          >
            <span className={styles.navIcon}>{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className={styles.bottom}>
        <Link href="/" className={styles.storeLink}>🏠 View Store</Link>
        <button
          className={styles.logoutBtn}
          onClick={() => signOut({ callbackUrl: '/' })}
        >
          🚪 Logout
        </button>
      </div>
    </aside>
  );
}
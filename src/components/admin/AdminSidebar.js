'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import styles from './AdminSidebar.module.css';

const navItems = [
  { href: '/admin/dashboard',  icon: '📊', label: 'Dashboard' },
  { href: '/admin/products',   icon: '📦', label: 'Products' },
  { href: '/admin/categories', icon: '🗂️', label: 'Categories' },
  { href: '/admin/banners',    icon: '🖼️', label: 'Banners' },
  { href: '/admin/orders',     icon: '🛍️', label: 'Orders' },
  { href: '/admin/coupons',    icon: '🎟️', label: 'Coupons' },
  { href: '/admin/users',      icon: '👥', label: 'Users' },
  { href: '/admin/contacts',   icon: '📩', label: 'Messages' },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* ✅ Mobile top bar */}
      <div className={styles.mobileTopBar}>
        <button
          className={styles.menuToggle}
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          <span className={`${styles.menuLine} ${mobileOpen ? styles.menuLineOpen1 : ''}`} />
          <span className={`${styles.menuLine} ${mobileOpen ? styles.menuLineOpen2 : ''}`} />
          <span className={`${styles.menuLine} ${mobileOpen ? styles.menuLineOpen3 : ''}`} />
        </button>
        <div className={styles.mobileLogo}>
          <span>🍼</span>
          <span className={styles.mobileLogoText}>BabyBliss Admin</span>
        </div>
        <Link href="/" className={styles.mobileStoreLink}>🏠</Link>
      </div>

      {/* ✅ Overlay for mobile */}
      {mobileOpen && (
        <div
          className={styles.overlay}
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ✅ Sidebar */}
      <aside className={`${styles.sidebar} ${mobileOpen ? styles.sidebarOpen : ''}`}>
        {/* Logo */}
        <div className={styles.logo}>
          <span>🍼</span>
          <div>
            <div className={styles.logoText}>BabyBliss</div>
            <div className={styles.logoSub}>Admin Panel</div>
          </div>
          {/* Close button on mobile */}
          <button
            className={styles.closeBtn}
            onClick={() => setMobileOpen(false)}
          >
            ✕
          </button>
        </div>

        {/* Nav */}
        <nav className={styles.nav}>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.navItem} ${pathname === item.href ? styles.navActive : ''}`}
              onClick={() => setMobileOpen(false)}
            >
              <span className={styles.navIcon}>{item.icon}</span>
              <span>{item.label}</span>
              {pathname === item.href && (
                <span className={styles.activeIndicator} />
              )}
            </Link>
          ))}
        </nav>

        {/* Bottom */}
        <div className={styles.bottom}>
          <Link
            href="/"
            className={styles.storeLink}
            onClick={() => setMobileOpen(false)}
          >
            🏠 View Store
          </Link>
          <button
            className={styles.logoutBtn}
            onClick={() => signOut({ callbackUrl: '/' })}
          >
            🚪 Logout
          </button>
        </div>
      </aside>
    </>
  );
}
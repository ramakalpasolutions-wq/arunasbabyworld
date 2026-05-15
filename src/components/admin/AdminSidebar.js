'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import styles from './AdminSidebar.module.css';

const navItems = [
  { href: '/admin/dashboard',          icon: '📊', label: 'Dashboard'     },
  { href: '/admin/products',           icon: '📦', label: 'Products'      },
  { href: '/admin/categories',         icon: '🗂️', label: 'Categories'    },
  { href: '/admin/banners',            icon: '🖼️', label: 'Banners'       },
  { href: '/admin/banners/settings',   icon: '🎨', label: 'Section Names' }, // ✅ NEW
  { href: '/admin/orders',             icon: '🛍️', label: 'Orders'        },
  { href: '/admin/coupons',            icon: '🎟️', label: 'Coupons'       },
  { href: '/admin/users',              icon: '👥', label: 'Users'         },
  { href: '/admin/contacts',           icon: '📩', label: 'Messages'      },
];

export default function AdminSidebar() {
  const pathname    = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // ✅ Active check — also matches sub-routes
  const isActive = (href) => {
    if (href === '/admin/banners/settings') {
      return pathname === '/admin/banners/settings';
    }
    if (href === '/admin/banners') {
      return pathname === '/admin/banners';
    }
    return pathname === href || pathname.startsWith(href + '/');
  };

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

      {/* ✅ Overlay */}
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
          <button
            className={styles.closeBtn}
            onClick={() => setMobileOpen(false)}
          >
            ✕
          </button>
        </div>

        {/* Nav */}
        <nav className={styles.nav}>
          {navItems.map((item) => {

            // ✅ Section Names — shown as sub-item under Banners
            const isSubItem = item.href === '/admin/banners/settings';
            const active    = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.navItem} ${active ? styles.navActive : ''} ${isSubItem ? styles.navSubItem : ''}`}
                onClick={() => setMobileOpen(false)}
              >
                <span className={styles.navIcon}>{item.icon}</span>
                <span>{item.label}</span>
                {active && <span className={styles.activeIndicator} />}
              </Link>
            );
          })}
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
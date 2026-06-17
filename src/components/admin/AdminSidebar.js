'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import styles from './AdminSidebar.module.css';

const navItems = [
  { href: '/admin/dashboard',  icon: '📊', label: 'Dashboard'  },
  { href: '/admin/products',   icon: '📦', label: 'Products'   },
  { href: '/admin/categories', icon: '🗂️', label: 'Categories' },
  { href: '/admin/banners',    icon: '🖼️', label: 'Banners'    },
  { href: '/admin/orders',     icon: '🛍️', label: 'Orders'     },
  { href: '/admin/refunds',    icon: '💰', label: 'Refunds'    }, // ✅ NEW
  { href: '/admin/exchanges',  icon: '🔄', label: 'Exchanges'  }, // ✅ NEW
  { href: '/admin/coupons',    icon: '🎟️', label: 'Coupons'    },
  { href: '/admin/users',      icon: '👥', label: 'Users'      },
  { href: '/admin/contacts',   icon: '📩', label: 'Messages'   },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const isActive = (href) => pathname === href || pathname.startsWith(href + '/');

  return (
    <>
      {/* Mobile Top Bar */}
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
          <span className={styles.mobileLogoText}>Baby's World Admin</span>
        </div>
        <Link href="/" className={styles.mobileStoreLink}>🏠</Link>
      </div>

      {/* Overlay */}
      {mobileOpen && (
        <div className={styles.overlay} onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${mobileOpen ? styles.sidebarOpen : ''}`}>

        {/* Logo */}
        <div className={styles.logo}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px',
            background: 'linear-gradient(135deg, #FF6B35, #7B2FBE)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.2rem', flexShrink: 0,
          }}>🍼</div>
          <div>
            <div className={styles.logoText}>Baby's World</div>
            <div className={styles.logoSub}>Admin Panel</div>
          </div>
          <button className={styles.closeBtn} onClick={() => setMobileOpen(false)}>✕</button>
        </div>

        {/* Nav */}
        <nav className={styles.nav}>
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.navItem} ${active ? styles.navActive : ''}`}
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
          <Link href="/" className={styles.storeLink} onClick={() => setMobileOpen(false)}>
            🏠 View Store
          </Link>
          <button className={styles.logoutBtn} onClick={() => signOut({ callbackUrl: '/' })}>
            🚪 Logout
          </button>
        </div>
      </aside>
    </>
  );
}
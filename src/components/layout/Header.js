'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useRouter } from 'next/navigation';
import styles from './Header.module.css';
import Image from 'next/image';

const CATEGORY_ORDER = [
  'clothing', 'personal-care', 'health-care', 'walkers',
  'toys', 'cradles-cribs', 'electric-vehicles', 'food',
];

export default function Header() {
  const { data: session, status } = useSession();
  const { totalItems }            = useCart();
  const { items: wishlistItems }  = useWishlist();
  const router = useRouter();

  const [scrolled,      setScrolled]      = useState(false);
  const [searchQuery,   setSearchQuery]   = useState('');
  const [activeMega,    setActiveMega]    = useState(null);
  const [mobileOpen,    setMobileOpen]    = useState(false);
  const [cartBounce,    setCartBounce]    = useState(false);
  const [profileOpen,   setProfileOpen]   = useState(false);
  const [navCategories, setNavCategories] = useState([]);
  const [catLoading,    setCatLoading]    = useState(true);

  const prevItems  = useRef(totalItems);
  const profileRef = useRef(null);
  const searchRef  = useRef(null);

  // ✅ Fetch categories
  useEffect(() => {
    setCatLoading(true);
    fetch('/api/categories?all=true')
      .then(r => r.json())
      .then(d => {
        const allCats  = d.categories || [];
        const filtered = allCats.filter(cat => CATEGORY_ORDER.includes(cat.slug));
        filtered.sort((a, b) => CATEGORY_ORDER.indexOf(a.slug) - CATEGORY_ORDER.indexOf(b.slug));
        setNavCategories(filtered);
      })
      .catch(() => {})
      .finally(() => setCatLoading(false));
  }, []);

  // ✅ Scroll listener
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // ✅ Cart bounce animation
  useEffect(() => {
    if (totalItems > prevItems.current) {
      setCartBounce(true);
      setTimeout(() => setCartBounce(false), 600);
    }
    prevItems.current = totalItems;
  }, [totalItems]);

  // ✅ Close profile dropdown on outside click
  useEffect(() => {
    const handle = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  // ✅ Close mobile menu on route change
  useEffect(() => { setMobileOpen(false); }, [router]);

  // ✅ Lock body scroll when mobile menu open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  // ✅ ESC key to close mobile menu
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && mobileOpen) setMobileOpen(false);
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [mobileOpen]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push('/products?search=' + encodeURIComponent(searchQuery.trim()));
      setSearchQuery('');
      setMobileOpen(false);
    }
  };

  const closeMobile = () => setMobileOpen(false);

  // ✅ Session loading state
// ✅ Smarter session detection
const isLoadingSession = status === 'loading';
const isLoggedIn = status === 'authenticated' && session && session.user;

// ✅ DEBUG - Remove later
useEffect(() => {
  console.log('🔐 Session Status:', status);
  console.log('👤 Session Data:', session);
}, [status, session]);

  return (
    <header className={`${styles.header} ${scrolled ? styles.scrolled : ''}`}>

      {/* MAIN HEADER */}
      <div className={styles.mainHeader}>
        <div className={`container ${styles.mainContent}`}>

          {/* Logo */}
          <Link href="/" className={styles.logo} onClick={closeMobile}>
            <Image
              src="/logo.png"
              alt="Aruna's Baby World"
              width={200}
              height={60}
              priority
              className={styles.logoImg}
            />
          </Link>

          {/* Search */}
          <form onSubmit={handleSearch} className={styles.searchForm}>
            <div className={styles.searchBox}>
              <span className={styles.searchIcon}>🔍</span>
              <input
                type="text"
                placeholder="Search baby products..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className={styles.searchInput}
              />
              <button type="submit" className={styles.searchBtn}>Search</button>
            </div>
          </form>

          {/* Actions */}
          <div className={styles.actions}>

            {/* Wishlist */}
            <Link href="/wishlist" className={styles.actionBtn}>
              <span className={styles.actionIcon}>❤️</span>
              {wishlistItems.length > 0 && (
                <span className={styles.badge}>{wishlistItems.length}</span>
              )}
              <span className={styles.actionLabel}>Wishlist</span>
            </Link>

            {/* Cart */}
            <Link
              href="/cart"
              className={`${styles.actionBtn} ${cartBounce ? styles.cartBounce : ''}`}
            >
              <span className={styles.actionIcon}>🛒</span>
              {totalItems > 0 && (
                <span className={`${styles.badge} ${styles.badgePrimary}`}>
                  {totalItems}
                </span>
              )}
              <span className={styles.actionLabel}>Cart</span>
            </Link>

            {/* ✅ Profile / Login / Loading */}
            {isLoadingSession ? (
              // ✅ Loading skeleton (prevents flicker on refresh)
              <div className={styles.actionBtn} style={{ opacity: 0.6 }}>
                <div
                  className={styles.avatar}
                  style={{
                    background: 'linear-gradient(135deg, #E5E7EB, #D1D5DB)',
                    animation: 'pulse 1.5s ease-in-out infinite',
                  }}
                />
                <span className={styles.actionLabel}>Loading...</span>
              </div>
            ) : isLoggedIn ? (
              <div className={styles.profileWrap} ref={profileRef}>
                <button
                  className={styles.actionBtn}
                  onClick={() => setProfileOpen(p => !p)}
                >
                  <div className={styles.avatar}>
                    {session.user.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <span className={styles.actionLabel}>
                    {session.user.name?.split(' ')[0] || 'Me'}
                  </span>
                </button>

                {profileOpen && (
                  <div className={styles.profileDropdown}>
                    <div className={styles.profileHeader}>
                      <div className={styles.profileAvatar}>
                        {session.user.name?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <p className={styles.profileName}>{session.user.name}</p>
                        <p className={styles.profileEmail}>{session.user.email}</p>
                        {session.user.role === 'admin' && (
                          <span className={styles.adminBadge}>🛡️ Admin</span>
                        )}
                      </div>
                    </div>
                    <div className={styles.profileDivider} />
                    <Link
                      href="/profile"
                      className={styles.profileItem}
                      onClick={() => setProfileOpen(false)}
                    >
                      <span>👤</span> My Profile
                    </Link>
                    <Link
                      href="/profile?tab=orders"
                      className={styles.profileItem}
                      onClick={() => setProfileOpen(false)}
                    >
                      <span>📦</span> My Orders
                    </Link>
                    <Link
                      href="/wishlist"
                      className={styles.profileItem}
                      onClick={() => setProfileOpen(false)}
                    >
                      <span>❤️</span> Wishlist
                    </Link>
                    {session.user.role === 'admin' && (
                      <>
                        <div className={styles.profileDivider} />
                        <Link
                          href="/admin/dashboard"
                          className={`${styles.profileItem} ${styles.profileAdmin}`}
                          onClick={() => setProfileOpen(false)}
                        >
                          <span>⚙️</span> Admin Dashboard
                        </Link>
                      </>
                    )}
                    <div className={styles.profileDivider} />
                    <button
                      className={`${styles.profileItem} ${styles.profileLogout}`}
                      onClick={() => {
                        setProfileOpen(false);
                        signOut({ callbackUrl: '/' });
                      }}
                    >
                      <span>🚪</span> Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/login" className={styles.actionBtn}>
                <span className={styles.actionIcon}>👤</span>
                <span className={styles.actionLabel}>Login</span>
              </Link>
            )}

            {/* Hamburger */}
            <button
              className={styles.mobileMenuBtn}
              onClick={() => setMobileOpen(p => !p)}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            >
              <span style={mobileOpen ? { transform: 'translateY(7px) rotate(45deg)' } : {}} />
              <span style={mobileOpen ? { opacity: 0, transform: 'scaleX(0)' } : {}} />
              <span style={mobileOpen ? { transform: 'translateY(-7px) rotate(-45deg)' } : {}} />
            </button>
          </div>
        </div>
      </div>

      {/* DESKTOP CATEGORY NAV */}
      <nav className={styles.categoryNav}>
        <div className={`container ${styles.navContent}`}>
          {navCategories.map(cat => (
            <div
              key={cat.id}
              className={styles.navItem}
              onMouseEnter={() => setActiveMega(cat.id)}
              onMouseLeave={() => setActiveMega(null)}
            >
              <Link href={`/products?category=${cat.id}`} className={styles.navLink}>
                {cat.name}
              </Link>
              {activeMega === cat.id && (
                <div className={styles.megaMenu}>
                  <div className={styles.megaContent}>
                    <div className={styles.megaCategory}>
                      <h3>{cat.name}</h3>
                      <Link href={`/products?category=${cat.id}`} className={styles.viewAll}>
                        View All →
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}

          <div className={styles.navDivider} />

          <Link href="/products?featured=true" className={`${styles.navBtn} ${styles.navBtnFeatured}`}>
            <span className={styles.navBtnDot} />⭐ Featured
          </Link>
          <Link href="/products?sort=createdAt&order=desc" className={`${styles.navBtn} ${styles.navBtnNew}`}>
            <span className={styles.navBtnDot} />✨ New Arrivals
          </Link>
          <Link href="/products?trending=true" className={`${styles.navBtn} ${styles.navBtnTrending}`}>
            <span className={styles.navBtnPulse} />🔥 Trending
          </Link>
          <Link href="/contact" className={`${styles.navBtn} ${styles.navBtnContact}`}>
            <span className={styles.navBtnDot} />📞 Contact
          </Link>
        </div>
      </nav>

      {/* MOBILE OVERLAY */}
      {mobileOpen && (
        <div
          onClick={closeMobile}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.45)',
            zIndex: 998, backdropFilter: 'blur(2px)',
          }}
        />
      )}

      {/* MOBILE MENU */}
      {mobileOpen && (
        <div className={styles.mobileMenu}>

          {/* Top Bar with Back Button */}
          <div className={styles.mobileMenuTop}>
            <button
              className={styles.mobileBackBtn}
              onClick={closeMobile}
              aria-label="Close menu"
            >
              <span className={styles.backArrow}>←</span>
              <span>Back</span>
            </button>
            <span className={styles.mobileMenuTitle}>Menu</span>
            <button
              className={styles.mobileCloseBtn}
              onClick={closeMobile}
              aria-label="Close menu"
            >
              ✕
            </button>
          </div>

          {/* Mobile Search */}
          <div className={styles.mobileSearch}>
            <form onSubmit={handleSearch}>
              <div className={styles.searchBox}>
                <span className={styles.searchIcon}>🔍</span>
                <input
                  ref={searchRef}
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className={styles.searchInput}
                />
                <button type="submit" className={styles.searchBtn}>Go</button>
              </div>
            </form>
          </div>

          <div className={styles.mobileLinks}>

            {/* Categories */}
            <div className={styles.mobileCatSection}>
              <p className={styles.mobileCatTitle}>Shop by Category</p>
              {catLoading ? (
                <div className={styles.mobileCatList}>
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className={styles.mobileCatSkeleton} />
                  ))}
                </div>
              ) : (
                <div className={styles.mobileCatList}>
                  {navCategories.map((cat, i) => (
                    <Link
                      key={cat.id}
                      href={`/products?category=${cat.id}`}
                      className={styles.mobileCatItem}
                      onClick={closeMobile}
                      style={{ animationDelay: `${i * 40}ms` }}
                    >
                      <span className={styles.mobileCatItemName}>{cat.name}</span>
                      <span className={styles.mobileCatItemArrow}>›</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className={styles.mobileDivider} />

            {/* Quick Filters */}
            <div className={styles.mobileBtnGroup}>
              <Link
                href="/products?featured=true"
                className={styles.mobilePill}
                style={{ background: 'linear-gradient(135deg,#FF6B35,#FF8C5A)' }}
                onClick={closeMobile}
              >
                ⭐ Featured
              </Link>
              <Link
                href="/products?sort=createdAt&order=desc"
                className={styles.mobilePill}
                style={{ background: 'linear-gradient(135deg,#7B2FBE,#9B4FDE)' }}
                onClick={closeMobile}
              >
                ✨ New
              </Link>
              <Link
                href="/products?trending=true"
                className={styles.mobilePill}
                style={{ background: 'linear-gradient(135deg,#FF3366,#FF6B35)' }}
                onClick={closeMobile}
              >
                🔥 Trending
              </Link>
              <Link
                href="/contact"
                className={styles.mobilePill}
                style={{ background: 'linear-gradient(135deg,#0EA5E9,#7B2FBE)' }}
                onClick={closeMobile}
              >
                📞 Contact
              </Link>
            </div>

            <div className={styles.mobileDivider} />

            {/* Cart & Wishlist */}
            <Link href="/cart" className={styles.mobileLink} onClick={closeMobile}>
              🛒 Cart {totalItems > 0 && `(${totalItems})`}
            </Link>
            <Link href="/wishlist" className={styles.mobileLink} onClick={closeMobile}>
              ❤️ Wishlist {wishlistItems.length > 0 && `(${wishlistItems.length})`}
            </Link>

            <div className={styles.mobileDivider} />

            {/* ✅ Profile / Login Section (Mobile) */}
            {isLoadingSession ? (
              <div
                className={styles.mobileLink}
                style={{
                  opacity: 0.6,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #E5E7EB, #D1D5DB)',
                    animation: 'pulse 1.5s ease-in-out infinite',
                  }}
                />
                ⏳ Loading session...
              </div>
            ) : isLoggedIn ? (
              <>
                <div className={styles.mobileUserCard}>
                  <div className={styles.mobileUserAvatar}>
                    {session.user.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div className={styles.mobileUserInfo}>
                    <div className={styles.mobileUserName}>{session.user.name}</div>
                    <div className={styles.mobileUserEmail}>{session.user.email}</div>
                  </div>
                </div>

                <Link href="/profile" className={styles.mobileLink} onClick={closeMobile}>
                  👤 My Profile
                </Link>
                <Link href="/profile?tab=orders" className={styles.mobileLink} onClick={closeMobile}>
                  📦 My Orders
                </Link>

                {session.user.role === 'admin' && (
                  <Link
                    href="/admin/dashboard"
                    className={styles.mobileLink}
                    onClick={closeMobile}
                    style={{ color: '#7B2FBE', fontWeight: '800' }}
                  >
                    ⚙️ Admin Dashboard
                  </Link>
                )}

                <button
                  className={styles.mobileLink}
                  style={{ color: '#ef4444' }}
                  onClick={() => {
                    signOut({ callbackUrl: '/' });
                    closeMobile();
                  }}
                >
                  🚪 Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className={styles.mobileLink} onClick={closeMobile}>
                  🔑 Login
                </Link>
                <Link href="/register" className={styles.mobileLink} onClick={closeMobile}>
                  ✨ Create Account
                </Link>
              </>
            )}
          </div>
        </div>
      )}

      {/* ✅ Pulse animation for loading skeleton */}
      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </header>
  );
}
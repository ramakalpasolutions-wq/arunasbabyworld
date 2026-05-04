// src/components/layout/Header.js
'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useRouter } from 'next/navigation';
import styles from './Header.module.css';

const categories = [
  {
    name: 'Clothing', slug: 'clothing',
    sub: ['Newborn','Tops & T-Shirts','Bottoms','Dresses',
          'Ethnic Wear','Sleepwear','Winter Wear'],
  },
  {
    name: 'Toys & Games', slug: 'toys-games',
    sub: ['Educational Toys','Soft Toys','Action Figures',
          'Board Games','Outdoor Toys','Building Blocks'],
  },
  {
    name: 'Baby Gear', slug: 'baby-gear',
    sub: ['Strollers','Car Seats','Baby Carriers',
          'Swings','High Chairs','Play Gyms'],
  },
  {
    name: 'Feeding', slug: 'feeding',
    sub: ['Bottles','Breast Pumps','Baby Food',
          'Bibs','Bowls & Spoons','Sippy Cups'],
  },
];

export default function Header() {
  const { data: session }        = useSession();
  const { totalItems }           = useCart();
  const { items: wishlistItems } = useWishlist();
  const router = useRouter();

  const [scrolled, setScrolled]       = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMega, setActiveMega]   = useState(null);
  const [mobileOpen, setMobileOpen]   = useState(false);
  const [cartBounce, setCartBounce]   = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const prevItems  = useRef(totalItems);
  const profileRef = useRef(null);
  const searchRef  = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (totalItems > prevItems.current) {
      setCartBounce(true);
      setTimeout(() => setCartBounce(false), 600);
    }
    prevItems.current = totalItems;
  }, [totalItems]);

  useEffect(() => {
    const handle = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [router]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
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

  return (
    <header className={styles.header + (scrolled ? ' ' + styles.scrolled : '')}>

      {/* MAIN HEADER */}
      <div className={styles.mainHeader}>
        <div className={'container ' + styles.mainContent}>

          <Link href="/" className={styles.logo} onClick={closeMobile}>
            <div className={styles.logoIcon}>🍼</div>
            <div className={styles.logoText}>
              <span className={styles.logoMain}>BabyBliss</span>
              <span className={styles.logoSub}>Everything for little ones</span>
            </div>
          </Link>

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

          <div className={styles.actions}>

            <Link href="/wishlist" className={styles.actionBtn}>
              <span className={styles.actionIcon}>❤️</span>
              {wishlistItems.length > 0 && (
                <span className={styles.badge}>{wishlistItems.length}</span>
              )}
              <span className={styles.actionLabel}>Wishlist</span>
            </Link>

            <Link
              href="/cart"
              className={styles.actionBtn + (cartBounce ? ' ' + styles.cartBounce : '')}
            >
              <span className={styles.actionIcon}>🛒</span>
              {totalItems > 0 && (
                <span className={styles.badge + ' ' + styles.badgePrimary}>
                  {totalItems}
                </span>
              )}
              <span className={styles.actionLabel}>Cart</span>
            </Link>

            {session ? (
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
                    <Link href="/profile" className={styles.profileItem}
                      onClick={() => setProfileOpen(false)}>
                      <span>👤</span> My Profile
                    </Link>
                    <Link href="/orders" className={styles.profileItem}
                      onClick={() => setProfileOpen(false)}>
                      <span>📦</span> My Orders
                    </Link>
                    <Link href="/wishlist" className={styles.profileItem}
                      onClick={() => setProfileOpen(false)}>
                      <span>❤️</span> Wishlist
                    </Link>
                    <Link href="/track-order" className={styles.profileItem}
                      onClick={() => setProfileOpen(false)}>
                      <span>🔍</span> Track Order
                    </Link>
                    {session.user.role === 'admin' && (
                      <>
                        <div className={styles.profileDivider} />
                        <Link href="/admin/dashboard"
                          className={styles.profileItem + ' ' + styles.profileAdmin}
                          onClick={() => setProfileOpen(false)}>
                          <span>⚙️</span> Admin Dashboard
                        </Link>
                      </>
                    )}
                    <div className={styles.profileDivider} />
                    <button
                      className={styles.profileItem + ' ' + styles.profileLogout}
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

      {/* CATEGORY NAV — ALL buttons visible, scrollable */}
      <nav className={styles.categoryNav}>
        <div className={'container ' + styles.navContent}>

          {categories.map(cat => (
            <div
              key={cat.name}
              className={styles.navItem}
              onMouseEnter={() => setActiveMega(cat.name)}
              onMouseLeave={() => setActiveMega(null)}
            >
              <Link
                href={'/products?category=' + cat.slug}
                className={styles.navLink}
              >
                {cat.name}
              </Link>

              {activeMega === cat.name && (
                <div className={styles.megaMenu}>
                  <div className={styles.megaContent}>
                    <div className={styles.megaCategory}>
                      <h3>{cat.name}</h3>
                      <Link
                        href={'/products?category=' + cat.slug}
                        className={styles.viewAll}
                      >
                        View All →
                      </Link>
                    </div>
                    <ul className={styles.megaLinks}>
                      {cat.sub.map(sub => (
                        <li key={sub}>
                          <Link href={'/products?search=' + encodeURIComponent(sub.toLowerCase())}>
                            {sub}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          ))}

          <div className={styles.navDivider} />

          <Link
            href="/products?featured=true"
            className={styles.navBtn + ' ' + styles.navBtnFeatured}
          >
            <span className={styles.navBtnDot} />
            ⭐ Featured
          </Link>

          <Link
            href="/products?sort=createdAt&order=desc"
            className={styles.navBtn + ' ' + styles.navBtnNew}
          >
            <span className={styles.navBtnDot} />
            ✨ New Arrivals
          </Link>

          <Link
            href="/products?trending=true"
            className={styles.navBtn + ' ' + styles.navBtnTrending}
          >
            <span className={styles.navBtnPulse} />
            🔥 Trending
          </Link>

          <Link
            href="/contact"
            className={styles.navBtn + ' ' + styles.navBtnContact}
          >
            <span className={styles.navBtnDot} />
            📞 Contact
          </Link>

        </div>
      </nav>

      {/* MOBILE OVERLAY */}
      {mobileOpen && (
        <div
          onClick={closeMobile}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.45)',
            zIndex: 998,
          }}
        />
      )}

      {/* MOBILE MENU */}
      {mobileOpen && (
        <div className={styles.mobileMenu}>

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

            {categories.map(cat => (
              <Link
                key={cat.name}
                href={'/products?category=' + cat.slug}
                className={styles.mobileLink}
                onClick={closeMobile}
              >
                {cat.name}
              </Link>
            ))}

            <div className={styles.mobileBtnGroup}>
              <Link href="/products?featured=true" className={styles.mobilePill}
                style={{ background: 'linear-gradient(135deg,#FF6B35,#FF8C5A)' }}
                onClick={closeMobile}>
                ⭐ Featured
              </Link>
              <Link href="/products?sort=createdAt&order=desc" className={styles.mobilePill}
                style={{ background: 'linear-gradient(135deg,#7B2FBE,#9B4FDE)' }}
                onClick={closeMobile}>
                ✨ New
              </Link>
              <Link href="/products?trending=true" className={styles.mobilePill}
                style={{ background: 'linear-gradient(135deg,#FF3366,#FF6B35)' }}
                onClick={closeMobile}>
                🔥 Trending
              </Link>
              <Link href="/contact" className={styles.mobilePill}
                style={{ background: 'linear-gradient(135deg,#0EA5E9,#7B2FBE)' }}
                onClick={closeMobile}>
                📞 Contact
              </Link>
            </div>

            <Link href="/cart" className={styles.mobileLink} onClick={closeMobile}>
              🛒 Cart {totalItems > 0 && '(' + totalItems + ')'}
            </Link>
            <Link href="/wishlist" className={styles.mobileLink} onClick={closeMobile}>
              ❤️ Wishlist {wishlistItems.length > 0 && '(' + wishlistItems.length + ')'}
            </Link>

            {session ? (
              <>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '12px 20px',
                  background: 'linear-gradient(135deg,#FFF3EC,#F3E8FF)',
                  borderTop: '1px solid #EDD9FF',
                  borderBottom: '1px solid #EDD9FF',
                  margin: '6px 0',
                }}>
                  <div style={{
                    width: '38px', height: '38px', borderRadius: '50%',
                    background: 'linear-gradient(135deg,#FF6B35,#7B2FBE)',
                    color: 'white', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontWeight: '800', fontSize: '0.95rem',
                    flexShrink: 0,
                  }}>
                    {session.user.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{
                      fontWeight: '800', fontSize: '0.90rem', color: '#2D1A4A',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                      {session.user.name}
                    </div>
                    <div style={{
                      fontSize: '0.72rem', color: '#9585B0',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {session.user.email}
                    </div>
                  </div>
                </div>

                <Link href="/profile" className={styles.mobileLink} onClick={closeMobile}>
                  👤 My Profile
                </Link>
                <Link href="/orders" className={styles.mobileLink} onClick={closeMobile}>
                  📦 My Orders
                </Link>
                <Link href="/track-order" className={styles.mobileLink} onClick={closeMobile}>
                  🔍 Track Order
                </Link>
                {session.user.role === 'admin' && (
                  <Link href="/admin/dashboard" className={styles.mobileLink}
                    onClick={closeMobile} style={{ color: '#7B2FBE', fontWeight: '800' }}>
                    ⚙️ Admin Dashboard
                  </Link>
                )}
                <button className={styles.mobileLink}
                  style={{ color: '#ef4444' }}
                  onClick={() => { signOut({ callbackUrl: '/' }); closeMobile(); }}>
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

    </header>
  );
}
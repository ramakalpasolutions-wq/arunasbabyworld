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

const TRENDING_SEARCHES = [
  'Diapers', 'Baby food', 'Walker', 'Cradle',
  'Toys', 'Baby clothes', 'Feeding bottle', 'Stroller',
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

  // ✅ SEARCH STATES
  const [searchOpen,        setSearchOpen]        = useState(false);
  const [mobileSearchOpen,  setMobileSearchOpen]  = useState(false);
  const [searchResults,     setSearchResults]     = useState([]);
  const [searchLoading,     setSearchLoading]     = useState(false);
  const [recentSearches,    setRecentSearches]    = useState([]);
  const [selectedIndex,     setSelectedIndex]     = useState(-1);

  const prevItems   = useRef(totalItems);
  const profileRef  = useRef(null);
  const searchRef   = useRef(null);
  const searchInputRef = useRef(null);
  const mobileSearchInputRef = useRef(null);
  const debounceRef = useRef(null);

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

  // ✅ Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved).slice(0, 5));
      } catch {}
    }
  }, []);

  // ✅ Debounced live search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }

    setSearchLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/products?search=${encodeURIComponent(searchQuery.trim())}&limit=6`);
        const data = await res.json();
        setSearchResults(data.products || []);
      } catch (err) {
        console.error('Search error:', err);
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery]);

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

  // ✅ Close dropdowns on outside click
  useEffect(() => {
    const handle = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchOpen(false);
        setSelectedIndex(-1);
      }
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  // ✅ Close mobile menu on route change
  useEffect(() => { setMobileOpen(false); setMobileSearchOpen(false); }, [router]);

  // ✅ Lock body scroll (mobile menu OR mobile search)
  useEffect(() => {
    document.body.style.overflow = (mobileOpen || mobileSearchOpen) ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen, mobileSearchOpen]);

  // ✅ ESC key handling
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        if (mobileSearchOpen) {
          setMobileSearchOpen(false);
          setSearchQuery('');
        }
        if (searchOpen) {
          setSearchOpen(false);
          setSelectedIndex(-1);
          searchInputRef.current?.blur();
        }
        if (mobileOpen) setMobileOpen(false);
      }
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [mobileOpen, searchOpen, mobileSearchOpen]);

  // ✅ Focus mobile search input when opened
  useEffect(() => {
    if (mobileSearchOpen) {
      setTimeout(() => mobileSearchInputRef.current?.focus(), 100);
    }
  }, [mobileSearchOpen]);

  const saveRecentSearch = (query) => {
    if (!query.trim()) return;
    const updated = [
      query.trim(),
      ...recentSearches.filter(s => s !== query.trim()),
    ].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('recentSearches');
  };

  const handleSearch = (e, customQuery = null) => {
    if (e) e.preventDefault();
    const query = customQuery || searchQuery;

    if (query.trim()) {
      saveRecentSearch(query);
      router.push('/products?search=' + encodeURIComponent(query.trim()));
      setSearchQuery('');
      setSearchOpen(false);
      setMobileSearchOpen(false);
      setSelectedIndex(-1);
      setMobileOpen(false);
      searchInputRef.current?.blur();
      mobileSearchInputRef.current?.blur();
    }
  };

  const handleKeyDown = (e) => {
    const totalItems = searchResults.length + (searchResults.length === 0 && !searchQuery ? recentSearches.length + TRENDING_SEARCHES.length : 0);

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % Math.max(totalItems, 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + totalItems) % Math.max(totalItems, 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0) {
        if (searchResults[selectedIndex]) {
          const product = searchResults[selectedIndex];
          router.push(`/products/${product.slug || product.id}`);
          setSearchOpen(false);
          setSearchQuery('');
          setSelectedIndex(-1);
        }
      } else {
        handleSearch(e);
      }
    }
  };

  const closeMobile = () => setMobileOpen(false);
  const isLoadingSession = status === 'loading';
  const isLoggedIn = status === 'authenticated' && session && session.user;

  // ✅ Search Dropdown (Desktop)
  const SearchDropdown = () => (
    <div style={{
      position: 'absolute',
      top: 'calc(100% + 8px)',
      left: 0,
      right: 0,
      background: 'white',
      border: '1.5px solid #38BDF8',
      borderRadius: '16px',
      boxShadow: '0 12px 40px rgba(3, 105, 161, 0.15)',
      maxHeight: '70vh',
      overflowY: 'auto',
      zIndex: 999,
      animation: 'searchFadeIn 0.2s ease-out',
    }}>
      {searchLoading && (
        <div style={{
          padding: '20px', textAlign: 'center',
          color: '#0369A1', fontSize: '0.86rem', fontWeight: '600',
        }}>
          <div style={{
            display: 'inline-block',
            width: '24px', height: '24px',
            border: '3px solid #E0F2FE',
            borderTop: '3px solid #0369A1',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            marginBottom: '8px',
          }} />
          <p style={{ margin: 0 }}>Searching...</p>
        </div>
      )}

      {!searchLoading && searchQuery && searchResults.length > 0 && (
        <div>
          <div style={{
            padding: '10px 16px',
            background: 'linear-gradient(90deg, #F0F9FF, #E0F2FE)',
            borderBottom: '1px solid #BAE6FD',
            fontSize: '0.72rem', fontWeight: '800',
            color: '#0369A1', textTransform: 'uppercase', letterSpacing: '0.5px',
          }}>
            🎯 {searchResults.length} Products Found
          </div>
          {searchResults.map((product, i) => (
            <Link
              key={product.id}
              href={`/products/${product.slug || product.id}`}
              onClick={() => {
                saveRecentSearch(searchQuery);
                setSearchOpen(false);
                setSearchQuery('');
                setSelectedIndex(-1);
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '10px 14px', textDecoration: 'none', color: 'inherit',
                background: selectedIndex === i ? '#F0F9FF' : 'white',
                borderBottom: i < searchResults.length - 1 ? '1px solid #F1F5F9' : 'none',
                transition: 'background 0.15s',
              }}
              onMouseEnter={() => setSelectedIndex(i)}
              onMouseLeave={() => setSelectedIndex(-1)}
            >
              <img
                src={product.images?.[0]?.url || 'https://via.placeholder.com/48'}
                alt={product.name}
                style={{
                  width: '48px', height: '48px', borderRadius: '8px',
                  objectFit: 'cover', flexShrink: 0, border: '1px solid #E5E7EB',
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  margin: 0, fontSize: '0.86rem', fontWeight: '700', color: '#0F172A',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {product.name}
                </p>
                <p style={{ margin: '2px 0 0', fontSize: '0.74rem', color: '#64748B', fontWeight: '600' }}>
                  {product.brand || 'Baby Care'}
                </p>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <p style={{ margin: 0, fontSize: '0.90rem', fontWeight: '800', color: '#0369A1' }}>
                  ₹{Math.round(product.discountPrice || product.price)?.toLocaleString('en-IN')}
                </p>
                {product.discountPrice && product.discountPrice < product.price && (
                  <p style={{
                    margin: '2px 0 0', fontSize: '0.68rem', color: '#94A3B8',
                    textDecoration: 'line-through', fontWeight: '600',
                  }}>
                    ₹{Math.round(product.price)?.toLocaleString('en-IN')}
                  </p>
                )}
              </div>
            </Link>
          ))}

          <button
            onClick={() => handleSearch()}
            style={{
              width: '100%', padding: '12px 16px',
              background: 'linear-gradient(135deg, #38BDF8, #0369A1)',
              color: 'white', border: 'none',
              fontSize: '0.84rem', fontWeight: '800',
              cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              gap: '6px', borderRadius: '0 0 14px 14px',
            }}
          >
            🔍 View All Results for "{searchQuery}" →
          </button>
        </div>
      )}

      {!searchLoading && searchQuery.length >= 2 && searchResults.length === 0 && (
        <div style={{ padding: '30px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>🔍</div>
          <p style={{ margin: 0, fontSize: '0.90rem', fontWeight: '800', color: '#0F172A' }}>
            No products found
          </p>
          <p style={{ margin: '4px 0 12px', fontSize: '0.80rem', color: '#64748B' }}>
            Try different keywords or browse categories
          </p>
          <Link
            href="/products"
            onClick={() => { setSearchOpen(false); setSearchQuery(''); }}
            style={{
              display: 'inline-block', padding: '8px 20px',
              background: '#38BDF8', color: 'white',
              borderRadius: '8px', textDecoration: 'none',
              fontSize: '0.80rem', fontWeight: '700',
            }}
          >
            Browse All Products
          </Link>
        </div>
      )}

      {!searchQuery && (
        <div>
          {recentSearches.length > 0 && (
            <div>
              <div style={{
                padding: '12px 16px 8px', display: 'flex',
                alignItems: 'center', justifyContent: 'space-between',
              }}>
                <span style={{
                  fontSize: '0.72rem', fontWeight: '800', color: '#64748B',
                  textTransform: 'uppercase', letterSpacing: '0.5px',
                }}>
                  🕐 Recent Searches
                </span>
                <button
                  onClick={clearRecentSearches}
                  style={{
                    background: 'none', border: 'none',
                    color: '#EF4444', fontSize: '0.72rem',
                    fontWeight: '700', cursor: 'pointer',
                  }}
                >
                  Clear
                </button>
              </div>
              <div style={{ padding: '0 16px 12px' }}>
                {recentSearches.map((search, i) => (
                  <button
                    key={i}
                    onClick={() => handleSearch(null, search)}
                    style={{
                      width: '100%', padding: '9px 12px',
                      background: 'transparent', border: '1px solid #E5E7EB',
                      borderRadius: '8px', textAlign: 'left',
                      cursor: 'pointer', fontSize: '0.84rem',
                      color: '#334155', fontWeight: '600',
                      marginBottom: '5px', display: 'flex',
                      alignItems: 'center', gap: '10px',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = '#F0F9FF';
                      e.currentTarget.style.borderColor = '#38BDF8';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.borderColor = '#E5E7EB';
                    }}
                  >
                    <span style={{ color: '#94A3B8' }}>🕐</span>
                    {search}
                    <span style={{ marginLeft: 'auto', color: '#94A3B8', fontSize: '0.72rem' }}>↗</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div style={{
            padding: '12px 16px 8px',
            borderTop: recentSearches.length > 0 ? '1px solid #F1F5F9' : 'none',
          }}>
            <span style={{
              fontSize: '0.72rem', fontWeight: '800', color: '#0369A1',
              textTransform: 'uppercase', letterSpacing: '0.5px',
            }}>
              🔥 Trending Searches
            </span>
          </div>
          <div style={{
            padding: '0 16px 16px', display: 'flex',
            flexWrap: 'wrap', gap: '6px',
          }}>
            {TRENDING_SEARCHES.map((trend, i) => (
              <button
                key={i}
                onClick={() => handleSearch(null, trend)}
                style={{
                  padding: '6px 12px',
                  background: 'linear-gradient(135deg, #F0F9FF, #E0F2FE)',
                  border: '1px solid #BAE6FD', borderRadius: '999px',
                  cursor: 'pointer', fontSize: '0.78rem',
                  color: '#0369A1', fontWeight: '700', transition: 'all 0.15s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #38BDF8, #0369A1)';
                  e.currentTarget.style.color = 'white';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #F0F9FF, #E0F2FE)';
                  e.currentTarget.style.color = '#0369A1';
                }}
              >
                {trend}
              </button>
            ))}
          </div>

          <div style={{
            padding: '12px 16px', background: '#F8FAFC',
            borderTop: '1px solid #F1F5F9', borderRadius: '0 0 14px 14px',
          }}>
            <p style={{
              margin: '0 0 8px', fontSize: '0.72rem', fontWeight: '800',
              color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px',
            }}>
              🎯 Quick Categories
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {navCategories.slice(0, 6).map(cat => (
                <Link
                  key={cat.id}
                  href={`/products?category=${cat.id}`}
                  onClick={() => { setSearchOpen(false); setSearchQuery(''); }}
                  style={{
                    padding: '5px 10px', background: 'white',
                    border: '1px solid #E5E7EB', borderRadius: '6px',
                    fontSize: '0.74rem', color: '#334155',
                    fontWeight: '700', textDecoration: 'none',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#38BDF8'; e.currentTarget.style.color = '#0369A1'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.color = '#334155'; }}
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <header className={`${styles.header} ${scrolled ? styles.scrolled : ''}`}>

      {/* MAIN HEADER */}
      <div className={styles.mainHeader}>
        <div className={`container ${styles.mainContent}`}>

          {/* Logo */}
          <Link href="/" className={styles.logo} onClick={closeMobile}>
            <Image
              src="/logo.png"
              alt="Arunas Baby World"
              width={200}
              height={60}
              priority
              className={styles.logoImg}
            />
          </Link>

          {/* ✅ SMART SEARCH (Desktop only) */}
          <div ref={searchRef} className={styles.searchWrap}>
            <form onSubmit={handleSearch} className={styles.searchForm}>
              <div className={styles.searchBox}>
                <span className={styles.searchIcon}>🔍</span>
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search for products, brands, categories..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onFocus={() => setSearchOpen(true)}
                  onKeyDown={handleKeyDown}
                  className={styles.searchInput}
                  autoComplete="off"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      searchInputRef.current?.focus();
                    }}
                    style={{
                      background: 'transparent', border: 'none',
                      color: '#94A3B8', cursor: 'pointer',
                      fontSize: '1rem', padding: '0 8px',
                      display: 'flex', alignItems: 'center',
                    }}
                    aria-label="Clear search"
                  >
                    ✕
                  </button>
                )}
                <button type="submit" className={styles.searchBtn}>Search</button>
              </div>
            </form>

            {searchOpen && <SearchDropdown />}
          </div>

          {/* Actions */}
          <div className={styles.actions}>

            {/* ✅ Mobile Search Icon (only visible on mobile) */}
            <button
              className={styles.mobileSearchBtn}
              onClick={() => setMobileSearchOpen(true)}
              aria-label="Open search"
            >
              <span className={styles.actionIcon}>🔍</span>
            </button>

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

            {isLoadingSession ? (
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
                    <Link href="/profile" className={styles.profileItem} onClick={() => setProfileOpen(false)}>
                      <span>👤</span> My Profile
                    </Link>
                    <Link href="/profile?tab=orders" className={styles.profileItem} onClick={() => setProfileOpen(false)}>
                      <span>📦</span> My Orders
                    </Link>
                    <Link href="/wishlist" className={styles.profileItem} onClick={() => setProfileOpen(false)}>
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

      {/* ✅ MOBILE SEARCH FULLSCREEN OVERLAY */}
      {mobileSearchOpen && (
        <div className={styles.mobileSearchOverlay}>
          <div className={styles.mobileSearchTopbar}>
            <button
              onClick={() => {
                setMobileSearchOpen(false);
                setSearchQuery('');
              }}
              className={styles.mobileSearchBack}
              aria-label="Close search"
            >
              ←
            </button>

            <div className={styles.mobileSearchInputWrap}>
              <span className={styles.mobileSearchInputIcon}>🔍</span>
              <input
                ref={mobileSearchInputRef}
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && searchQuery.trim()) {
                    handleSearch(e);
                  }
                }}
                placeholder="Search products, brands..."
                className={styles.mobileSearchInput}
                autoComplete="off"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className={styles.mobileSearchClear}
                  aria-label="Clear"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          <div className={styles.mobileSearchContent}>
            {searchLoading && (
              <div className={styles.mobileSearchLoading}>
                <div className={styles.mobileSearchSpinner} />
                <p>Searching...</p>
              </div>
            )}

            {!searchLoading && searchQuery.length >= 2 && searchResults.length > 0 && (
              <div>
                <p className={styles.mobileSearchLabel}>
                  🎯 {searchResults.length} Products Found
                </p>
                <div className={styles.mobileResultsList}>
                  {searchResults.map(product => (
                    <Link
                      key={product.id}
                      href={`/products/${product.slug || product.id}`}
                      onClick={() => {
                        saveRecentSearch(searchQuery);
                        setMobileSearchOpen(false);
                        setSearchQuery('');
                      }}
                      className={styles.mobileResultItem}
                    >
                      <img
                        src={product.images?.[0]?.url || 'https://via.placeholder.com/50'}
                        alt={product.name}
                        className={styles.mobileResultImg}
                      />
                      <div className={styles.mobileResultInfo}>
                        <p className={styles.mobileResultName}>{product.name}</p>
                        <p className={styles.mobileResultPrice}>
                          ₹{Math.round(product.discountPrice || product.price)?.toLocaleString('en-IN')}
                          {product.discountPrice && product.discountPrice < product.price && (
                            <span className={styles.mobileResultOldPrice}>
                              ₹{Math.round(product.price)?.toLocaleString('en-IN')}
                            </span>
                          )}
                        </p>
                      </div>
                      <span className={styles.mobileResultArrow}>›</span>
                    </Link>
                  ))}
                </div>

                <button
                  onClick={() => handleSearch()}
                  className={styles.mobileViewAllBtn}
                >
                  🔍 View All Results
                </button>
              </div>
            )}

            {!searchLoading && searchQuery.length >= 2 && searchResults.length === 0 && (
              <div className={styles.mobileNoResults}>
                <div className={styles.mobileNoResultsIcon}>🔍</div>
                <p className={styles.mobileNoResultsTitle}>No products found</p>
                <p className={styles.mobileNoResultsSub}>Try different keywords</p>
                <Link
                  href="/products"
                  onClick={() => { setMobileSearchOpen(false); setSearchQuery(''); }}
                  className={styles.mobileNoResultsBtn}
                >
                  Browse All Products
                </Link>
              </div>
            )}

            {!searchQuery && (
              <div>
                {recentSearches.length > 0 && (
                  <div className={styles.mobileSearchSection}>
                    <div className={styles.mobileSearchSectionHead}>
                      <span className={styles.mobileSearchSectionLabel}>
                        🕐 Recent Searches
                      </span>
                      <button
                        onClick={clearRecentSearches}
                        className={styles.mobileSearchClearBtn}
                      >
                        Clear
                      </button>
                    </div>
                    <div className={styles.mobileRecentList}>
                      {recentSearches.map((search, i) => (
                        <button
                          key={i}
                          onClick={() => handleSearch(null, search)}
                          className={styles.mobileRecentItem}
                        >
                          <span className={styles.mobileRecentIcon}>🕐</span>
                          <span className={styles.mobileRecentText}>{search}</span>
                          <span className={styles.mobileRecentArrow}>↗</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className={styles.mobileSearchSection}>
                  <p className={styles.mobileSearchSectionLabel}>
                    🔥 Trending Searches
                  </p>
                  <div className={styles.mobileTrendingList}>
                    {TRENDING_SEARCHES.map((trend, i) => (
                      <button
                        key={i}
                        onClick={() => handleSearch(null, trend)}
                        className={styles.mobileTrendingItem}
                      >
                        {trend}
                      </button>
                    ))}
                  </div>
                </div>

                <div className={styles.mobileSearchSection}>
                  <p className={styles.mobileSearchSectionLabel}>
                    🎯 Shop by Category
                  </p>
                  <div className={styles.mobileCategoryGrid}>
                    {navCategories.slice(0, 8).map(cat => (
                      <Link
                        key={cat.id}
                        href={`/products?category=${cat.id}`}
                        onClick={() => { setMobileSearchOpen(false); setSearchQuery(''); }}
                        className={styles.mobileCategoryItem}
                      >
                        {cat.name}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MOBILE OVERLAY (for menu) */}
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

          <div className={styles.mobileLinks}>

            <Link href="/products" onClick={closeMobile} className={styles.mobileBrowseBtn}>
              <span className={styles.mobileBrowseBtnInner}>
                <span className={styles.mobileBrowseBtnIcon}>🛍️</span>
                <span>Browse All Products</span>
              </span>
              <span className={styles.mobileBrowseBtnArrow}>›</span>
            </Link>

            <p className={styles.mobileSectionLabel}>Quick Filters</p>

            <div className={styles.mobileBtnGroup}>
              <Link href="/products?featured=true" className={styles.mobilePill}
                style={{ background: 'linear-gradient(135deg,#FF6B35,#FF8C5A)' }}
                onClick={closeMobile}
              >
                ⭐ Featured
              </Link>
              <Link href="/products?sort=createdAt&order=desc" className={styles.mobilePill}
                style={{ background: 'linear-gradient(135deg,#7B2FBE,#9B4FDE)' }}
                onClick={closeMobile}
              >
                ✨ New
              </Link>
              <Link href="/products?trending=true" className={styles.mobilePill}
                style={{ background: 'linear-gradient(135deg,#FF3366,#FF6B35)' }}
                onClick={closeMobile}
              >
                🔥 Trending
              </Link>
              <Link href="/contact" className={styles.mobilePill}
                style={{ background: 'linear-gradient(135deg,#0EA5E9,#7B2FBE)' }}
                onClick={closeMobile}
              >
                📞 Contact
              </Link>
            </div>

            <div className={styles.mobileDivider} />

            <p className={styles.mobileSectionLabel}>Shopping</p>

            <Link href="/cart" className={styles.mobileLink} onClick={closeMobile}>
              <span className={styles.mobileLinkIcon}>🛒</span>
              <span className={styles.mobileLinkText}>Cart</span>
              {totalItems > 0 && (
                <span className={styles.mobileLinkCount}>{totalItems}</span>
              )}
            </Link>
            <Link href="/wishlist" className={styles.mobileLink} onClick={closeMobile}>
              <span className={styles.mobileLinkIcon}>❤️</span>
              <span className={styles.mobileLinkText}>Wishlist</span>
              {wishlistItems.length > 0 && (
                <span className={styles.mobileLinkCount}>{wishlistItems.length}</span>
              )}
            </Link>

            <div className={styles.mobileDivider} />

            {isLoadingSession ? (
              <div className={styles.mobileLink} style={{ opacity: 0.6 }}>
                <span className={styles.mobileLinkIcon}>⏳</span>
                <span className={styles.mobileLinkText}>Loading...</span>
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

                <p className={styles.mobileSectionLabel}>Account</p>

                <Link href="/profile" className={styles.mobileLink} onClick={closeMobile}>
                  <span className={styles.mobileLinkIcon}>👤</span>
                  <span className={styles.mobileLinkText}>My Profile</span>
                </Link>
                <Link href="/profile?tab=orders" className={styles.mobileLink} onClick={closeMobile}>
                  <span className={styles.mobileLinkIcon}>📦</span>
                  <span className={styles.mobileLinkText}>My Orders</span>
                </Link>

                {session.user.role === 'admin' && (
                  <Link href="/admin/dashboard"
                    className={`${styles.mobileLink} ${styles.mobileLinkAdmin}`}
                    onClick={closeMobile}
                  >
                    <span className={styles.mobileLinkIcon}>⚙️</span>
                    <span className={styles.mobileLinkText}>Admin Dashboard</span>
                  </Link>
                )}

                <div className={styles.mobileDivider} />

                <button
                  className={`${styles.mobileLink} ${styles.mobileLinkLogout}`}
                  onClick={() => {
                    signOut({ callbackUrl: '/' });
                    closeMobile();
                  }}
                >
                  <span className={styles.mobileLinkIcon}>🚪</span>
                  <span className={styles.mobileLinkText}>Logout</span>
                </button>
              </>
            ) : (
              <>
                <p className={styles.mobileSectionLabel}>Account</p>
                <Link href="/login" className={styles.mobileLink} onClick={closeMobile}>
                  <span className={styles.mobileLinkIcon}>🔑</span>
                  <span className={styles.mobileLinkText}>Login</span>
                </Link>
                <Link href="/register" className={styles.mobileLink} onClick={closeMobile}>
                  <span className={styles.mobileLinkIcon}>✨</span>
                  <span className={styles.mobileLinkText}>Create Account</span>
                </Link>
              </>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes searchFadeIn {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </header>
  );
}
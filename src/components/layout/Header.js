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
    name: 'Clothing',
    
    sub: ['Newborn', 'Tops & T-Shirts', 'Bottoms', 'Dresses', 'Ethnic Wear', 'Sleepwear', 'Winter Wear'],
  },
  {
    name: 'Toys & Games',
    
    sub: ['Educational Toys', 'Soft Toys', 'Action Figures', 'Board Games', 'Outdoor Toys', 'Building Blocks'],
  },
  {
    name: 'Baby Gear',
    
    sub: ['Strollers', 'Car Seats', 'Baby Carriers', 'Swings', 'High Chairs', 'Play Gyms'],
  },
  {
    name: 'Feeding',
    
    sub: ['Bottles', 'Breast Pumps', 'Baby Food', 'Bibs', 'Bowls & Spoons', 'Sippy Cups'],
  },
  {
    name: 'Health & Safety',
    
    sub: ['Baby Care', 'Health Monitors', 'Safety Gates', 'Medicine', 'Thermometers'],
  },
  {
    name: 'Nursery',
   
    sub: ['Cribs & Beds', 'Mattresses', 'Bedding Sets', 'Room Décor', 'Storage', 'Night Lights'],
  },
];

export default function Header() {
  const { data: session } = useSession();
  const { totalItems } = useCart();
  const { items: wishlistItems } = useWishlist();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMega, setActiveMega] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cartBounce, setCartBounce] = useState(false);
  const prevItems = useRef(totalItems);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (totalItems > prevItems.current) {
      setCartBounce(true);
      setTimeout(() => setCartBounce(false), 600);
    }
    prevItems.current = totalItems;
  }, [totalItems]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  return (
    <header className={`${styles.header} ${scrolled ? styles.scrolled : ''}`}>
      {/* Top strip */}
      <div className={styles.topStrip}>
        <div className={`container ${styles.topContent}`}>
          <div className={styles.topLinks}>
            <Link href="/track-order">📦 Track Order</Link>
            <Link href="/contact">📞 Contact Us</Link>
            <span>🚚 Free delivery over ₹499</span>
          </div>
          <div className={styles.topLinks}>
            {session ? (
              <>
                <span>Hello, {session.user.name?.split(' ')[0]}</span>
                {session.user.role === 'admin' && <Link href="/admin/dashboard">Admin Panel</Link>}
                <button onClick={() => signOut({ callbackUrl: '/' })} className={styles.stripBtn}>Logout</button>
              </>
            ) : (
              <>
                <Link href="/login">Login</Link>
                <Link href="/register">Register</Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className={styles.mainHeader}>
        <div className={`container ${styles.mainContent}`}>
          {/* Logo */}
          <Link href="/" className={styles.logo}>
            <div className={styles.logoIcon}>🍼</div>
            <div className={styles.logoText}>
              <span className={styles.logoMain}>BabyBliss</span>
              <span className={styles.logoSub}>Everything for little ones</span>
            </div>
          </Link>

          {/* Search */}
          <form onSubmit={handleSearch} className={styles.searchForm}>
            <div className={styles.searchBox}>
              <span className={styles.searchIcon}>🔍</span>
              <input
                type="text"
                placeholder="Search for baby products, toys, clothing..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.searchInput}
              />
              <button type="submit" className={styles.searchBtn}>Search</button>
            </div>
          </form>

          {/* Actions */}
          <div className={styles.actions}>
            <Link href="/wishlist" className={styles.actionBtn}>
              <span className={styles.actionIcon}>❤️</span>
              {wishlistItems.length > 0 && (
                <span className={styles.badge}>{wishlistItems.length}</span>
              )}
              <span className={styles.actionLabel}>Wishlist</span>
            </Link>

            <Link href="/cart" className={`${styles.actionBtn} ${cartBounce ? styles.cartBounce : ''}`}>
              <span className={styles.actionIcon}>🛒</span>
              {totalItems > 0 && (
                <span className={`${styles.badge} ${styles.badgePrimary}`}>{totalItems}</span>
              )}
              <span className={styles.actionLabel}>Cart</span>
            </Link>

            {session ? (
              <Link href="/profile" className={styles.actionBtn}>
                <div className={styles.avatar}>
                  {session.user.name?.[0]?.toUpperCase() || 'U'}
                </div>
                <span className={styles.actionLabel}>Profile</span>
              </Link>
            ) : (
              <Link href="/login" className={styles.actionBtn}>
                <span className={styles.actionIcon}>👤</span>
                <span className={styles.actionLabel}>Login</span>
              </Link>
            )}

            <button
              className={styles.mobileMenuBtn}
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Menu"
            >
              <span></span><span></span><span></span>
            </button>
          </div>
        </div>
      </div>

      {/* Category nav */}
      <nav className={styles.categoryNav}>
        <div className={`container ${styles.navContent}`}>
          {categories.map((cat) => (
            <div
              key={cat.name}
              className={styles.navItem}
              onMouseEnter={() => setActiveMega(cat.name)}
              onMouseLeave={() => setActiveMega(null)}
            >
              <Link href={`/products?category=${cat.name.toLowerCase()}`} className={styles.navLink}>
                <span>{cat.icon}</span> {cat.name}
              </Link>

              {activeMega === cat.name && (
                <div className={styles.megaMenu}>
                  <div className={styles.megaContent}>
                    <div className={styles.megaCategory}>
                      <h3>{cat.icon} {cat.name}</h3>
                      <Link href={`/products?category=${cat.name.toLowerCase()}`} className={styles.viewAll}>
                        View All →
                      </Link>
                    </div>
                    <ul className={styles.megaLinks}>
                      {cat.sub.map((sub) => (
                        <li key={sub}>
                          <Link href={`/products?search=${sub.toLowerCase()}`}>{sub}</Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          ))}

          
          <Link href="/products?trending=true" className={`${styles.navLink} ${styles.navTrending}`}>
             Trending
          </Link>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className={styles.mobileMenu}>
          <div className={styles.mobileLinks}>
            {categories.map((cat) => (
              <Link
                key={cat.name}
                href={`/products?category=${cat.name.toLowerCase()}`}
                className={styles.mobileLink}
                onClick={() => setMobileOpen(false)}
              >
                {cat.icon} {cat.name}
              </Link>
            ))}
            <Link href="/cart" className={styles.mobileLink} onClick={() => setMobileOpen(false)}>
              🛒 Cart {totalItems > 0 && `(${totalItems})`}
            </Link>
            <Link href="/wishlist" className={styles.mobileLink} onClick={() => setMobileOpen(false)}>
              ❤️ Wishlist
            </Link>
            {session ? (
              <button onClick={() => { signOut(); setMobileOpen(false); }} className={styles.mobileLink}>
                Logout
              </button>
            ) : (
              <Link href="/login" className={styles.mobileLink} onClick={() => setMobileOpen(false)}>
                👤 Login / Register
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

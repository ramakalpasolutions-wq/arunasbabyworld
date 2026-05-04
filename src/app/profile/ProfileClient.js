'use client';
import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import styles from './profile.module.css';

const STATUS_COLOR = {
  Pending:    '#f59e0b',
  Confirmed:  '#3b82f6',
  Processing: '#8b5cf6',
  Shipped:    '#06b6d4',
  Delivered:  '#10b981',
  Cancelled:  '#ef4444',
  Refunded:   '#6b7280',
};

const STATUS_EMOJI = {
  Pending:    '⏳',
  Confirmed:  '✅',
  Processing: '⚙️',
  Shipped:    '🚚',
  Delivered:  '🎉',
  Cancelled:  '❌',
  Refunded:   '↩️',
};

export default function ProfileClient() {
  const { data: session, status } = useSession();
  const router       = useRouter();
  const searchParams = useSearchParams();
  const defaultTab   = searchParams.get('tab') || 'profile';

  const [activeTab,      setActiveTab]      = useState(defaultTab);
  const [userData,       setUserData]       = useState({ name: '', email: '', phone: '' });
  const [orders,         setOrders]         = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [saving,         setSaving]         = useState(false);
  const [ordersLoading,  setOrdersLoading]  = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?redirect=/profile');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchProfile();
      fetchOrders();
    }
  }, [status]);

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/users/profile');
      if (res.ok) {
        const data = await res.json();
        setUserData({
          name:  data.user?.name  || session?.user?.name  || '',
          email: data.user?.email || session?.user?.email || '',
          phone: data.user?.phone || '',
        });
      }
    } catch (err) {
      console.error('Profile fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    setOrdersLoading(true);
    try {
      const res = await fetch('/api/orders?limit=20');
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch (err) {
      console.error('Orders fetch error:', err);
    } finally {
      setOrdersLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!userData.name) { toast.error('Name is required'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: userData.name, phone: userData.phone }),
      });
      if (res.ok) {
        toast.success('✅ Profile updated successfully!');
      } else {
        const data = await res.json();
        toast.error(data.error || 'Update failed');
      }
    } catch (err) {
      toast.error('Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className={styles.loadingWrap}>
        <div className={styles.spinner} />
        <p style={{ color: '#888' }}>Loading your profile...</p>
      </div>
    );
  }

  if (status === 'unauthenticated') return null;

  return (
    <div className={styles.profilePage}>

      {/* ── PROFILE HERO ── */}
      <div className={styles.profileHero}>
        <div className={styles.avatarBig}>
          {session?.user?.name?.[0]?.toUpperCase() || 'U'}
        </div>

        <div className={styles.heroInfo}>
          <h1>{session?.user?.name || 'Customer'}</h1>
          <p>{session?.user?.email}</p>
          {session?.user?.role === 'admin' && (
            <span className={styles.adminBadge}>⚙️ Admin</span>
          )}
        </div>

        {/* ✅ Action buttons top right */}
        <div className={styles.heroActions}>
          {session?.user?.role === 'admin' && (
            <Link href="/admin/dashboard" className={styles.adminLink}>
              ⚙️ Admin Panel
            </Link>
          )}
          {/* ✅ Logout button */}
          <button
            className={styles.logoutBtn}
            onClick={() => signOut({ callbackUrl: '/' })}
          >
            🚪 Logout
          </button>
        </div>
      </div>

      {/* ── QUICK STATS ── */}
      <div className={styles.quickStats}>
        <div className={styles.statCard}>
          <span className={styles.statNum}>{orders.length}</span>
          <span className={styles.statLabel}>Total Orders</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statNum}>
            {orders.filter(o => o.orderStatus === 'Delivered').length}
          </span>
          <span className={styles.statLabel}>Delivered</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statNum}>
            {orders.filter(o => o.orderStatus === 'Shipped').length}
          </span>
          <span className={styles.statLabel}>In Transit</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statNum}>
            {orders.filter(o => o.orderStatus === 'Pending' || o.orderStatus === 'Confirmed').length}
          </span>
          <span className={styles.statLabel}>Pending</span>
        </div>
      </div>

      {/* ── TABS ── */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'profile' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          👤 My Profile
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'orders' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          📦 My Orders
          {orders.length > 0 && (
            <span className={styles.tabBadge}>{orders.length}</span>
          )}
        </button>
      </div>

      {/* ── PROFILE TAB ── */}
      {activeTab === 'profile' && (
        <div className={styles.tabContent}>
          <div className={styles.formCard}>
            <h2>Personal Information</h2>
            <p className={styles.formSubtitle}>Update your profile details below</p>

            <form onSubmit={handleSave} className={styles.form}>

              {/* Full Name */}
              <div className={styles.formGroup}>
                <label>Full Name *</label>
                <div className={styles.inputWrap}>
                  <span className={styles.inputIcon}>👤</span>
                  <input
                    type="text"
                    value={userData.name}
                    onChange={e => setUserData(p => ({ ...p, name: e.target.value }))}
                    placeholder="Your full name"
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div className={styles.formGroup}>
                <label>Email Address</label>
                <div className={styles.inputWrap}>
                  <span className={styles.inputIcon}>✉️</span>
                  <input
                    type="email"
                    value={userData.email}
                    disabled
                    className={styles.disabledField}
                  />
                </div>
                <small className={styles.warningText}>
                  ⚠️ Email cannot be changed
                </small>
              </div>

              {/* Phone */}
              <div className={styles.formGroup}>
                <label>Phone Number</label>
                <div className={styles.inputWrap}>
                  <span className={styles.inputIcon}>📞</span>
                  <input
                    type="tel"
                    value={userData.phone}
                    onChange={e => setUserData(p => ({ ...p, phone: e.target.value }))}
                    placeholder="+91 XXXXX XXXXX"
                  />
                </div>
              </div>

              <button type="submit" className={styles.saveBtn} disabled={saving}>
                {saving ? '⏳ Saving...' : '💾 Save Changes'}
              </button>
            </form>
          </div>

          {/* Quick Links */}
          <div className={styles.quickLinks}>
            <Link href="/products" className={styles.quickLink}>
              <span>🛍️</span>
              <span>Shop Products</span>
            </Link>
            <Link href="/cart" className={styles.quickLink}>
              <span>🛒</span>
              <span>My Cart</span>
            </Link>
            <Link href="/wishlist" className={styles.quickLink}>
              <span>❤️</span>
              <span>Wishlist</span>
            </Link>
            <Link href="/contact" className={styles.quickLink}>
              <span>📞</span>
              <span>Contact Us</span>
            </Link>
          </div>

          {/* ✅ Logout card at bottom */}
          <div className={styles.logoutCard}>
            <div className={styles.logoutCardInfo}>
              <h4>Sign Out</h4>
              <p>Sign out from your BabyBliss account</p>
            </div>
            <button
              className={styles.logoutCardBtn}
              onClick={() => signOut({ callbackUrl: '/' })}
            >
              🚪 Logout
            </button>
          </div>
        </div>
      )}

      {/* ── ORDERS TAB ── */}
      {activeTab === 'orders' && (
        <div className={styles.tabContent}>
          {ordersLoading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
              ⏳ Loading orders...
            </div>
          ) : orders.length === 0 ? (
            <div className={styles.emptyOrders}>
              <span>📦</span>
              <h3>No orders yet!</h3>
              <p>You haven&apos;t placed any orders yet.</p>
              <Link href="/products" className={styles.shopNowBtn}>
                🛍️ Start Shopping
              </Link>
            </div>
          ) : (
            <div className={styles.ordersList}>
              {orders.map(order => (
                <div key={order.id} className={styles.orderCard}>

                  {/* Order Header */}
                  <div className={styles.orderTop}>
                    <div className={styles.orderIdWrap}>
                      <span className={styles.orderId}>
                        #{order.id?.slice(-8)?.toUpperCase()}
                      </span>
                      <span className={styles.orderDate}>
                        {new Date(order.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short', year: 'numeric',
                        })}
                      </span>
                    </div>
                    <span
                      className={styles.statusBadge}
                      style={{
                        background: `${STATUS_COLOR[order.orderStatus] || '#888'}20`,
                        color: STATUS_COLOR[order.orderStatus] || '#888',
                      }}
                    >
                      {STATUS_EMOJI[order.orderStatus]} {order.orderStatus}
                    </span>
                  </div>

                  {/* Order Items */}
                  <div className={styles.orderItems}>
                    {order.orderItems?.slice(0, 2).map((item, i) => (
                      <div key={i} className={styles.orderItemPreview}>
                        <img
                          src={item.image || 'https://via.placeholder.com/40'}
                          alt={item.name}
                          style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '8px' }}
                        />
                        <span style={{ fontSize: '13px', color: '#555' }}>
                          {item.name} x{item.quantity}
                        </span>
                      </div>
                    ))}
                    {order.orderItems?.length > 2 && (
                      <span style={{ fontSize: '12px', color: '#888' }}>
                        +{order.orderItems.length - 2} more items
                      </span>
                    )}
                  </div>

                  {/* Order Footer */}
                  <div className={styles.orderFooter}>
                    <div className={styles.orderMeta}>
                      <span>🛒 {order.orderItems?.length || 0} items</span>
                      <span style={{ fontWeight: '800', color: '#ff6b9d', fontSize: '16px' }}>
                        ₹{order.totalPrice?.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <Link href={`/orders/${order.id}`} className={styles.viewBtn}>
                      Track Order →
                    </Link>
                  </div>

                  {/* Mini Tracker */}
                  {order.orderStatus !== 'Cancelled' && order.orderStatus !== 'Refunded' && (
                    <div className={styles.miniTracker}>
                      {['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered'].map((step, i) => {
                        const currentIndex = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered'].indexOf(order.orderStatus);
                        return (
                          <div key={step} className={styles.miniStep}>
                            <div
                              className={styles.miniDot}
                              style={{ background: i <= currentIndex ? STATUS_COLOR[order.orderStatus] : '#e5e7eb' }}
                            />
                            {i < 4 && (
                              <div
                                className={styles.miniLine}
                                style={{ background: i < currentIndex ? STATUS_COLOR[order.orderStatus] : '#e5e7eb' }}
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
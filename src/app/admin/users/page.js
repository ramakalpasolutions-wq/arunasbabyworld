// C:\Users\user\arunasbabyworld\src\app\admin\users\page.js
'use client';
import { useState, useEffect } from 'react';
import styles from '../products/page.module.css';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [togglingId, setTogglingId] = useState(null);
  const [toast, setToast] = useState(null); // ✅ Toast notification

  useEffect(() => {
    fetch('/api/admin/users')
      .then(r => r.json())
      .then(d => { setUsers(d.users || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  // ✅ Show toast helper
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ✅ Toggle user active/inactive
  const handleToggle = async (userId, currentStatus, userName) => {
    setTogglingId(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}/toggle`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      const data = await res.json();

      if (res.ok) {
        setUsers(prev =>
          prev.map(u =>
            u.id === userId ? { ...u, isActive: !currentStatus } : u
          )
        );
        showToast(
          `${userName} has been ${!currentStatus ? 'activated ✅' : 'deactivated 🚫'}`,
          !currentStatus ? 'success' : 'error'
        );
      } else {
        showToast(data.error || 'Failed to update user', 'error');
      }
    } catch (err) {
      console.error('Toggle failed:', err);
      showToast('Something went wrong!', 'error');
    } finally {
      setTogglingId(null);
    }
  };

  // ✅ Filter users by search
  const filteredUsers = users.filter(u =>
    !search ||
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.phone?.toString().includes(search)
  );

  // ✅ Stats
  const activeCount = users.filter(u => u.isActive).length;
  const inactiveCount = users.filter(u => !u.isActive).length;

  return (
    <div className={styles.page}>

      {/* ✅ TOAST NOTIFICATION */}
      {toast && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 9999,
          background: toast.type === 'success'
            ? 'linear-gradient(135deg, #059669, #10b981)'
            : 'linear-gradient(135deg, #dc2626, #ef4444)',
          color: 'white',
          padding: '12px 20px',
          borderRadius: '12px',
          fontWeight: '700',
          fontSize: '0.85rem',
          fontFamily: 'Nunito, sans-serif',
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
          animation: 'slideIn 0.3s ease',
          maxWidth: '300px',
        }}>
          {toast.message}
        </div>
      )}

      {/* ── HEADER ── */}
      <div className={styles.header}>
        <div>
          <h1>Users 👥</h1>
          <p style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <span>{users.length} total</span>
            <span style={{ color: '#059669', fontWeight: '700' }}>
              ● {activeCount} active
            </span>
            <span style={{ color: '#dc2626', fontWeight: '700' }}>
              ○ {inactiveCount} inactive
            </span>
          </p>
        </div>

        {/* Search input */}
        <input
          type="text"
          placeholder="🔍 Search users..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            padding: '10px 14px',
            borderRadius: '10px',
            border: '1.5px solid #e5e7eb',
            fontSize: '0.88rem',
            outline: 'none',
            minWidth: '200px',
            fontFamily: 'Nunito, sans-serif',
            background: 'white',
            transition: 'all 0.2s',
          }}
          onFocus={e => e.target.style.borderColor = '#FF6B35'}
          onBlur={e => e.target.style.borderColor = '#e5e7eb'}
        />
      </div>

      {/* ── DESKTOP TABLE ── */}
      <div className={styles.table}>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Role</th>
              <th>Orders</th>
              <th>Joined</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className={styles.center}>
                ⏳ Loading users...
              </td></tr>
            ) : filteredUsers.length === 0 ? (
              <tr><td colSpan={8} className={styles.center}>
                {search ? '🔍 No users match your search' : '👥 No users found'}
              </td></tr>
            ) : filteredUsers.map(user => (
              <tr key={user.id}>

                {/* Name + Avatar */}
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '50%',
                      background: user.role === 'admin'
                        ? 'linear-gradient(135deg, #7c3aed, #ff6b9d)'
                        : user.isActive
                          ? 'linear-gradient(135deg, #FF6B35, #ff9a56)'
                          : 'linear-gradient(135deg, #e5e7eb, #d1d5db)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: user.isActive || user.role === 'admin' ? 'white' : '#9ca3af',
                      fontWeight: '800', fontSize: '0.85rem', flexShrink: 0,
                      opacity: user.isActive ? 1 : 0.7,
                    }}>
                      {user.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <strong style={{
                      color: user.isActive ? '#1a1a2e' : '#9ca3af',
                      textDecoration: user.isActive ? 'none' : 'line-through',
                    }}>
                      {user.name}
                    </strong>
                  </div>
                </td>

                {/* Email */}
                <td style={{ fontSize: '13px', color: user.isActive ? '#666' : '#bbb' }}>
                  {user.email}
                </td>

                {/* Phone */}
                <td style={{ fontSize: '13px', color: '#888' }}>
                  {user.phone || '—'}
                </td>

                {/* Role */}
                <td>
                  <span style={{
                    background: user.role === 'admin' ? '#f3e8ff' : '#f3f4f6',
                    color: user.role === 'admin' ? '#7B2FBE' : '#6b7280',
                    padding: '3px 10px',
                    borderRadius: '999px',
                    fontSize: '0.75rem', fontWeight: '700',
                    textTransform: 'capitalize', whiteSpace: 'nowrap',
                  }}>
                    {user.role === 'admin' ? '👑 Admin' : '👤 User'}
                  </span>
                </td>

                {/* Orders count */}
                <td style={{ fontSize: '13px', color: '#666', textAlign: 'center' }}>
                  <span style={{
                    background: '#fff7ed',
                    color: '#FF6B35',
                    padding: '2px 8px',
                    borderRadius: '999px',
                    fontSize: '0.75rem',
                    fontWeight: '700',
                  }}>
                    {user._count?.orders || 0}
                  </span>
                </td>

                {/* Joined */}
                <td style={{ fontSize: '12px', color: '#888', whiteSpace: 'nowrap' }}>
                  {new Date(user.createdAt).toLocaleDateString('en-IN')}
                </td>

                {/* Status */}
                <td>
                  <span className={user.isActive ? styles.active : styles.inactive}>
                    {user.isActive ? '● Active' : '○ Inactive'}
                  </span>
                </td>

                {/* ✅ ACTION BUTTON */}
                <td>
                  {user.role === 'admin' ? (
                    <span style={{
                      fontSize: '0.72rem',
                      color: '#9ca3af',
                      fontStyle: 'italic',
                      padding: '5px 10px',
                      display: 'inline-block',
                      background: '#f9fafb',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb',
                    }}>
                      🔒 Protected
                    </span>
                  ) : (
                    <button
                      onClick={() => handleToggle(user.id, user.isActive, user.name)}
                      disabled={togglingId === user.id}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '8px',
                        border: 'none',
                        cursor: togglingId === user.id ? 'not-allowed' : 'pointer',
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        fontFamily: 'Nunito, sans-serif',
                        transition: 'all 0.2s',
                        opacity: togglingId === user.id ? 0.6 : 1,
                        background: user.isActive
                          ? 'linear-gradient(135deg, #fee2e2, #fecaca)'
                          : 'linear-gradient(135deg, #d1fae5, #a7f3d0)',
                        color: user.isActive ? '#dc2626' : '#059669',
                        whiteSpace: 'nowrap',
                        boxShadow: user.isActive
                          ? '0 2px 8px rgba(220,38,38,0.15)'
                          : '0 2px 8px rgba(5,150,105,0.15)',
                      }}
                    >
                      {togglingId === user.id
                        ? '⏳ ...'
                        : user.isActive
                          ? '🚫 Deactivate'
                          : '✅ Activate'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── MOBILE CARDS ── */}
      <div className={styles.mobileCards}>
        {loading ? (
          <div style={{
            textAlign: 'center', padding: '40px 16px',
            color: '#9ca3af', fontWeight: '600',
            background: 'white', borderRadius: '14px',
          }}>
            ⏳ Loading...
          </div>
        ) : filteredUsers.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '40px 16px',
            color: '#9ca3af', fontWeight: '600',
            background: 'white', borderRadius: '14px',
          }}>
            {search ? '🔍 No users match' : '👥 No users found'}
          </div>
        ) : filteredUsers.map(user => (
          <div
            key={user.id}
            className={styles.mobileCard}
            style={{ opacity: user.isActive ? 1 : 0.75 }}
          >
            {/* Avatar */}
            <div style={{
              width: '44px', height: '44px', borderRadius: '50%',
              background: user.role === 'admin'
                ? 'linear-gradient(135deg, #7c3aed, #ff6b9d)'
                : user.isActive
                  ? 'linear-gradient(135deg, #FF6B35, #ff9a56)'
                  : 'linear-gradient(135deg, #e5e7eb, #d1d5db)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: user.isActive || user.role === 'admin' ? 'white' : '#9ca3af',
              fontWeight: '800', fontSize: '1rem', flexShrink: 0,
            }}>
              {user.name?.[0]?.toUpperCase() || 'U'}
            </div>

            <div className={styles.mobileCardBody}>
              {/* Name + Role */}
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', gap: '8px',
              }}>
                <div
                  className={styles.mobileCardName}
                  style={{
                    textDecoration: user.isActive ? 'none' : 'line-through',
                    color: user.isActive ? '#1a1a2e' : '#9ca3af',
                  }}
                >
                  {user.name}
                </div>
                <span style={{
                  background: user.role === 'admin' ? '#f3e8ff' : '#f3f4f6',
                  color: user.role === 'admin' ? '#7B2FBE' : '#6b7280',
                  padding: '2px 8px',
                  borderRadius: '999px',
                  fontSize: '0.68rem', fontWeight: '700',
                  textTransform: 'capitalize', whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}>
                  {user.role === 'admin' ? '👑 Admin' : '👤 User'}
                </span>
              </div>

              {/* Email */}
              <div style={{
                fontSize: '0.78rem',
                color: '#666',
                wordBreak: 'break-all',
                lineHeight: 1.4,
              }}>
                ✉️ {user.email}
              </div>

              {/* Phone */}
              {user.phone && (
                <div style={{ fontSize: '0.78rem', color: '#666', lineHeight: 1.4 }}>
                  📞 {user.phone}
                </div>
              )}

              {/* Orders */}
              <div style={{ fontSize: '0.78rem', color: '#FF6B35', fontWeight: '700' }}>
                🛍️ {user._count?.orders || 0} order{(user._count?.orders || 0) !== 1 ? 's' : ''}
              </div>

              {/* Date + Status + Action */}
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', gap: '8px',
                marginTop: '6px',
                paddingTop: '8px',
                borderTop: '1px solid #f3f4f7',
                flexWrap: 'wrap',
              }}>
                <span style={{ fontSize: '0.72rem', color: '#9ca3af', fontWeight: '600' }}>
                  📅 {new Date(user.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'short', year: 'numeric',
                  })}
                </span>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className={user.isActive ? styles.active : styles.inactive}>
                    {user.isActive ? '● Active' : '○ Inactive'}
                  </span>

                  {/* ✅ MOBILE ACTION BUTTON */}
                  {user.role !== 'admin' ? (
                    <button
                      onClick={() => handleToggle(user.id, user.isActive, user.name)}
                      disabled={togglingId === user.id}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '7px',
                        border: 'none',
                        cursor: togglingId === user.id ? 'not-allowed' : 'pointer',
                        fontSize: '0.68rem',
                        fontWeight: '700',
                        fontFamily: 'Nunito, sans-serif',
                        transition: 'all 0.2s',
                        opacity: togglingId === user.id ? 0.6 : 1,
                        background: user.isActive
                          ? 'linear-gradient(135deg, #fee2e2, #fecaca)'
                          : 'linear-gradient(135deg, #d1fae5, #a7f3d0)',
                        color: user.isActive ? '#dc2626' : '#059669',
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                      }}
                    >
                      {togglingId === user.id
                        ? '⏳'
                        : user.isActive
                          ? '🚫 Deactivate'
                          : '✅ Activate'}
                    </button>
                  ) : (
                    <span style={{
                      fontSize: '0.65rem',
                      color: '#9ca3af',
                      fontStyle: 'italic',
                    }}>
                      🔒 Protected
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
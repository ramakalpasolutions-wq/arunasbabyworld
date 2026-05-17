'use client';
import { useState, useEffect } from 'react';
import styles from '../products/page.module.css';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/admin/users')
      .then(r => r.json())
      .then(d => { setUsers(d.users || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  // ✅ Filter users by search
  const filteredUsers = users.filter(u =>
    !search ||
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.phone?.toString().includes(search)
  );

  return (
    <div className={styles.page}>

      {/* ── HEADER ── */}
      <div className={styles.header}>
        <div>
          <h1>Users 👥</h1>
          <p>{users.length} registered user{users.length !== 1 ? 's' : ''}</p>
        </div>

        {/* ✅ Search input */}
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
              <th>Joined</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className={styles.center}>
                ⏳ Loading users...
              </td></tr>
            ) : filteredUsers.length === 0 ? (
              <tr><td colSpan={6} className={styles.center}>
                {search ? '🔍 No users match your search' : '👥 No users found'}
              </td></tr>
            ) : filteredUsers.map(user => (
              <tr key={user.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '50%',
                      background: user.role === 'admin'
                        ? 'linear-gradient(135deg, #7c3aed, #ff6b9d)'
                        : 'linear-gradient(135deg, #e5e7eb, #d1d5db)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: user.role === 'admin' ? 'white' : '#6b7280',
                      fontWeight: '800', fontSize: '0.85rem', flexShrink: 0,
                    }}>
                      {user.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <strong style={{ color: '#1a1a2e' }}>{user.name}</strong>
                  </div>
                </td>
                <td style={{ fontSize: '13px', color: '#666' }}>
                  {user.email}
                </td>
                <td style={{ fontSize: '13px', color: '#888' }}>
                  {user.phone || '—'}
                </td>
                <td>
                  <span style={{
                    background: user.role === 'admin' ? '#f3e8ff' : '#f3f4f6',
                    color: user.role === 'admin' ? '#7B2FBE' : '#6b7280',
                    padding: '3px 10px',
                    borderRadius: '999px',
                    fontSize: '0.75rem', fontWeight: '700',
                    textTransform: 'capitalize', whiteSpace: 'nowrap',
                  }}>
                    {user.role}
                  </span>
                </td>
                <td style={{ fontSize: '12px', color: '#888', whiteSpace: 'nowrap' }}>
                  {new Date(user.createdAt).toLocaleDateString('en-IN')}
                </td>
                <td>
                  <span className={user.isActive ? styles.active : styles.inactive}>
                    {user.isActive ? '● Active' : '○ Inactive'}
                  </span>
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
          <div key={user.id} className={styles.mobileCard}>
            {/* Avatar */}
            <div style={{
              width: '44px', height: '44px', borderRadius: '50%',
              background: user.role === 'admin'
                ? 'linear-gradient(135deg, #7c3aed, #ff6b9d)'
                : 'linear-gradient(135deg, #e5e7eb, #d1d5db)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: user.role === 'admin' ? 'white' : '#6b7280',
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
                <div className={styles.mobileCardName}>{user.name}</div>
                <span style={{
                  background: user.role === 'admin' ? '#f3e8ff' : '#f3f4f6',
                  color: user.role === 'admin' ? '#7B2FBE' : '#6b7280',
                  padding: '2px 8px',
                  borderRadius: '999px',
                  fontSize: '0.68rem', fontWeight: '700',
                  textTransform: 'capitalize', whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}>
                  {user.role}
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
                <div style={{
                  fontSize: '0.78rem',
                  color: '#666',
                  lineHeight: 1.4,
                }}>
                  📞 {user.phone}
                </div>
              )}

              {/* Date + Status row */}
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', gap: '8px',
                marginTop: '6px',
                paddingTop: '8px',
                borderTop: '1px solid #f3f4f7',
              }}>
                <span style={{ fontSize: '0.72rem', color: '#9ca3af', fontWeight: '600' }}>
                  📅 {new Date(user.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'short', year: 'numeric',
                  })}
                </span>
                <span className={user.isActive ? styles.active : styles.inactive}>
                  {user.isActive ? '● Active' : '○ Inactive'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
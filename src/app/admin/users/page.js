// src/app/admin/users/page.js
'use client';
import { useState, useEffect } from 'react';
import styles from '../products/page.module.css';

export default function AdminUsers() {
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/users')
      .then(r => r.json())
      .then(d => { setUsers(d.users || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className={styles.page}>

      {/* ── HEADER ── */}
      <div className={styles.header}>
        <div>
          <h1>Users 👥</h1>
          <p>{users.length} registered users</p>
        </div>
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
            ) : users.length === 0 ? (
              <tr><td colSpan={6} className={styles.center}>
                No users found
              </td></tr>
            ) : users.map(user => (
              <tr key={user.id}>
                <td><strong>{user.name}</strong></td>
                <td style={{ fontSize: '13px', color: '#666' }}>
                  {user.email}
                </td>
                <td style={{ fontSize: '13px', color: '#888' }}>
                  {user.phone || '—'}
                </td>
                <td>
                  <span style={{
                    background: user.role === 'admin'
                      ? 'var(--secondary-light)' : 'var(--bg-secondary)',
                    color: user.role === 'admin'
                      ? 'var(--secondary)' : 'var(--text-muted)',
                    padding: '3px 10px',
                    borderRadius: 'var(--radius-full)',
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
          <div className={styles.center}>⏳ Loading...</div>
        ) : users.length === 0 ? (
          <div className={styles.center}>No users found</div>
        ) : users.map(user => (
          <div key={user.id} className={styles.mobileCard}>
            {/* Avatar */}
            <div style={{
              width: '46px', height: '46px', borderRadius: '50%',
              background: user.role === 'admin'
                ? 'linear-gradient(135deg, #7c3aed, #ff6b9d)'
                : 'linear-gradient(135deg, #e5e7eb, #d1d5db)',
              display: 'flex', alignItems: 'center',
              justifyContent: 'center',
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
                  background: user.role === 'admin'
                    ? 'var(--secondary-light)' : 'var(--bg-secondary)',
                  color: user.role === 'admin'
                    ? 'var(--secondary)' : 'var(--text-muted)',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.70rem', fontWeight: '700',
                  textTransform: 'capitalize', whiteSpace: 'nowrap',
                }}>
                  {user.role}
                </span>
              </div>

              {/* Email */}
              <div className={styles.mobileCardMeta}>
                <span style={{ fontSize: '0.78rem', color: '#666' }}>
                  {user.email}
                </span>
              </div>

              {/* Phone + Date + Status */}
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', gap: '8px', marginTop: '4px',
              }}>
                <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                  {user.phone || '—'} •{' '}
                  {new Date(user.createdAt).toLocaleDateString('en-IN')}
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
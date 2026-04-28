'use client';
import { useState, useEffect } from 'react';
import styles from '../products/page.module.css';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/users')
      .then(r => r.json())
      .then(d => {
        setUsers(d.users || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1>Users 👥</h1>
          <p>{users.length} registered users</p>
        </div>
      </div>
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
              <tr>
                <td colSpan={6} className={styles.center}>
                  Loading users...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={6} className={styles.center}>
                  No users found
                </td>
              </tr>
            ) : (
              users.map(user => (
                // ✅ Use user.id not user._id
                <tr key={user.id}>
                  <td><strong>{user.name}</strong></td>
                  <td>{user.email}</td>
                  <td>{user.phone || '—'}</td>
                  <td>
                    <span style={{
                      background: user.role === 'admin'
                        ? 'var(--secondary-light)'
                        : 'var(--bg-secondary)',
                      color: user.role === 'admin'
                        ? 'var(--secondary)'
                        : 'var(--text-muted)',
                      padding: '3px 10px',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '0.75rem',
                      fontWeight: '700',
                      textTransform: 'capitalize',
                    }}>
                      {user.role}
                    </span>
                  </td>
                  <td>
                    {new Date(user.createdAt).toLocaleDateString('en-IN')}
                  </td>
                  <td>
                    <span className={user.isActive ? styles.active : styles.inactive}>
                      {user.isActive ? '● Active' : '○ Inactive'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
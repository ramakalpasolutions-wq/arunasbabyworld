// src/app/admin/contacts/page.js
'use client';
import { useState, useEffect } from 'react';
import styles from '../products/page.module.css';

export default function AdminContacts() {
  const [contacts, setContacts] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    fetch('/api/contact')
      .then(r => r.json())
      .then(d => { setContacts(d.contacts || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const unread = contacts.filter(c => !c.isRead).length;

  return (
    <div className={styles.page}>

      {/* ── HEADER ── */}
      <div className={styles.header}>
        <div>
          <h1>Contact Messages 📩</h1>
          <p>
            {contacts.length} total messages
            {unread > 0 && (
              <span style={{
                marginLeft: '8px', background: '#ff6b9d',
                color: 'white', padding: '2px 10px',
                borderRadius: '20px', fontSize: '12px', fontWeight: '700',
              }}>
                {unread} unread
              </span>
            )}
          </p>
        </div>
      </div>

      {/* ── MESSAGE DETAIL MODAL ── */}
      {selected && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '16px',
        }}>
          <div style={{
            background: 'white', borderRadius: '20px',
            padding: '24px', maxWidth: '520px',
            width: '100%', maxHeight: '88vh',
            overflowY: 'auto',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', marginBottom: '20px',
            }}>
              <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800' }}>
                📩 Message Details
              </h2>
              <button onClick={() => setSelected(null)} style={{
                background: '#f3f4f6', border: 'none',
                borderRadius: '50%', width: '32px', height: '32px',
                cursor: 'pointer', fontSize: '16px',
              }}>✕</button>
            </div>

            <div style={{
              background: '#f9fafb', borderRadius: '12px',
              overflow: 'hidden', marginBottom: '16px',
            }}>
              {[
                { label: '👤 Name',    value: selected.name },
                { label: '✉️ Email',   value: selected.email },
                { label: '📞 Phone',   value: selected.phone || '—' },
                { label: '📋 Subject', value: selected.subject || '—' },
                { label: '📅 Date',
                  value: new Date(selected.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'long', year: 'numeric',
                  })
                },
              ].map(row => (
                <div key={row.label} style={{
                  display: 'flex', padding: '11px 14px',
                  borderBottom: '1px solid #f0f0f0',
                  flexWrap: 'wrap', gap: '4px',
                }}>
                  <span style={{
                    fontWeight: '700', color: '#666', fontSize: '13px',
                    width: '100px', flexShrink: 0,
                  }}>{row.label}</span>
                  <span style={{
                    fontSize: '13px', color: '#333',
                    flex: 1, wordBreak: 'break-word',
                  }}>{row.value}</span>
                </div>
              ))}
            </div>

            <div style={{
              background: '#fff8fb', border: '1px solid #ffd6e7',
              borderLeft: '4px solid #ff6b9d',
              padding: '14px', borderRadius: '10px', marginBottom: '18px',
            }}>
              <p style={{
                fontWeight: '700', color: '#ff6b9d',
                fontSize: '13px', margin: '0 0 6px',
              }}>💬 Message:</p>
              <p style={{
                margin: 0, lineHeight: '1.7', color: '#333',
                fontSize: '14px', wordBreak: 'break-word',
              }}>{selected.message}</p>
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <a
                href={`mailto:${selected.email}?subject=Re: ${selected.subject || 'Your inquiry'}`}
                style={{
                  flex: 1, minWidth: '140px',
                  background: 'linear-gradient(135deg, #ff6b9d, #7c3aed)',
                  color: 'white', padding: '12px',
                  borderRadius: '10px', textDecoration: 'none',
                  textAlign: 'center', fontWeight: '700', fontSize: '14px',
                }}
              >
                📧 Reply
              </a>
              <button onClick={() => setSelected(null)} style={{
                padding: '12px 20px', border: '1.5px solid #eee',
                borderRadius: '10px', cursor: 'pointer',
                background: 'white', fontWeight: '600', fontSize: '14px',
              }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── DESKTOP TABLE ── */}
      <div className={styles.table}>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Subject</th>
              <th>Message</th>
              <th>Date</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className={styles.center}>⏳ Loading...</td>
              </tr>
            ) : contacts.length === 0 ? (
              <tr>
                <td colSpan={6} className={styles.center}>
                  <div style={{ padding: '32px', color: '#999' }}>
                    <div style={{ fontSize: '40px', marginBottom: '8px' }}>📩</div>
                    <p>No messages yet</p>
                  </div>
                </td>
              </tr>
            ) : contacts.map(c => (
              <tr key={c.id} style={{ background: !c.isRead ? '#fff8fb' : 'white' }}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {!c.isRead && (
                      <span style={{
                        width: '7px', height: '7px', borderRadius: '50%',
                        background: '#ff6b9d', display: 'inline-block',
                        flexShrink: 0,
                      }} />
                    )}
                    <strong style={{ whiteSpace: 'nowrap' }}>{c.name}</strong>
                  </div>
                </td>
                <td style={{ color: '#666', fontSize: '13px' }}>
                  <a href={`mailto:${c.email}`}
                    style={{ color: '#7c3aed', textDecoration: 'none' }}>
                    {c.email}
                  </a>
                </td>
                <td>
                  <span style={{
                    background: '#f3f4f6', padding: '3px 8px',
                    borderRadius: '6px', fontSize: '12px',
                    fontWeight: '600', color: '#555', whiteSpace: 'nowrap',
                  }}>
                    {c.subject || 'General'}
                  </span>
                </td>
                <td style={{ fontSize: '13px', color: '#666' }}>
                  <span style={{
                    display: 'block', overflow: 'hidden',
                    textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    maxWidth: '180px',
                  }}>
                    {c.message}
                  </span>
                </td>
                <td style={{ fontSize: '12px', color: '#888', whiteSpace: 'nowrap' }}>
                  {new Date(c.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'short', year: 'numeric',
                  })}
                </td>
                <td>
                  <button onClick={() => setSelected(c)} style={{
                    background: '#ede9fe', color: '#7c3aed', border: 'none',
                    padding: '6px 12px', borderRadius: '8px',
                    fontSize: '12px', fontWeight: '700',
                    cursor: 'pointer', whiteSpace: 'nowrap',
                  }}>
                    👁️ View
                  </button>
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
        ) : contacts.length === 0 ? (
          <div className={styles.center}>No messages yet</div>
        ) : contacts.map(c => (
          <div key={c.id} className={styles.mobileCard}
            style={{ background: !c.isRead ? '#fff8fb' : 'white' }}>

            {/* Avatar */}
            <div style={{
              width: '44px', height: '44px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #ff6b9d, #7c3aed)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontWeight: '700', fontSize: '1rem',
              flexShrink: 0,
            }}>
              {c.name?.[0]?.toUpperCase()}
            </div>

            <div className={styles.mobileCardBody}>
              {/* Name + Date */}
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                alignItems: 'flex-start', gap: '8px',
              }}>
                <div className={styles.mobileCardName}>
                  {!c.isRead && (
                    <span style={{
                      width: '7px', height: '7px', borderRadius: '50%',
                      background: '#ff6b9d', display: 'inline-block',
                      marginRight: '5px',
                    }} />
                  )}
                  {c.name}
                </div>
                <span style={{
                  fontSize: '11px', color: '#9ca3af', whiteSpace: 'nowrap',
                }}>
                  {new Date(c.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'short',
                  })}
                </span>
              </div>

              {/* Email */}
              <div className={styles.mobileCardMeta}>
                <span style={{ color: '#7c3aed', fontSize: '0.75rem' }}>
                  {c.email}
                </span>
                <span style={{
                  background: '#f3f4f6', padding: '1px 6px',
                  borderRadius: '4px', fontSize: '11px',
                  fontWeight: '600', color: '#555',
                }}>
                  {c.subject || 'General'}
                </span>
              </div>

              {/* Message preview */}
              <div style={{
                fontSize: '12px', color: '#666', marginTop: '4px',
                overflow: 'hidden', textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {c.message}
              </div>

              {/* View Button */}
              <div className={styles.mobileCardActions}>
                <button onClick={() => setSelected(c)} style={{
                  background: '#ede9fe', color: '#7c3aed',
                  border: 'none', padding: '6px 12px',
                  borderRadius: '8px', fontSize: '12px',
                  fontWeight: '700', cursor: 'pointer',
                }}>
                  👁️ View Message
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
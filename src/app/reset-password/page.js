'use client';
import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import toast from 'react-hot-toast';
import '../login/login.css';

function ResetForm() {
  const router = useRouter();
  const token = useSearchParams().get('token') || '';
  const [status, setStatus] = useState('checking'); // checking | ready | invalid | done
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({ password: '', confirm: '' });
  const [show, setShow] = useState(false);
  const [focused, setFocused] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!token) {
      setStatus('invalid');
      setMessage('This reset link is incomplete. Please request a new one.');
      return;
    }
    fetch(`/api/users/reset-password?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        if (d.valid) setStatus('ready');
        else { setStatus('invalid'); setMessage(d.error); }
      })
      .catch(() => {
        if (!cancelled) { setStatus('invalid'); setMessage('We could not check this link. Please try again.'); }
      });
    return () => { cancelled = true; };
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (form.password !== form.confirm) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/users/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password: form.password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');
      setStatus('done');
      toast.success('Password updated! 🎉');
      setTimeout(() => router.push('/login'), 1800);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const titles = {
    checking: ['Checking your link…', 'One moment please.'],
    ready: ['Choose a new password', 'Make it at least 6 characters.'],
    invalid: ['Link not valid', message],
    done: ['Password updated', 'Taking you to the login page…'],
  };

  return (
    <div className="login-page">
      <div className="bg-shape bg-shape-1" />
      <div className="bg-shape bg-shape-2" />
      <div className="bg-shape bg-shape-3" />
      <div className="bg-shape bg-shape-4" />

      <Link href="/login" className="back-btn" aria-label="Back to login">
        <span className="back-arrow">←</span>
        <span className="back-text">Login</span>
      </Link>

      <div className="login-card">
        <div className="card-top-bar" />

        <div className="logo-area">
          <Link href="/" className="logo-link">
            <div className="logo-wrap">
              <Image
                src="/logo.png"
                alt="Arunas Baby World"
                width={180}
                height={180}
                className="logo-img"
                style={{ mixBlendMode: 'multiply', objectFit: 'contain' }}
                priority
              />
            </div>
          </Link>
          <h1 className="title">{titles[status][0]}</h1>
          <p className="subtitle">{titles[status][1]}</p>
        </div>

        {status === 'ready' && (
          <form onSubmit={handleSubmit} className="form">
            <div className="field">
              <label className="label" htmlFor="new-password">New Password</label>
              <div className={`input-box ${focused === 'password' ? 'active' : ''}`}>
                <span className="field-icon">🔒</span>
                <input
                  id="new-password"
                  type={show ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  placeholder="At least 6 characters"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  className="input"
                  onFocus={() => setFocused('password')}
                  onBlur={() => setFocused(null)}
                />
                <button
                  type="button"
                  className="eye-btn"
                  onClick={() => setShow(!show)}
                  aria-label={show ? 'Hide password' : 'Show password'}
                >
                  {show ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <div className="field">
              <label className="label" htmlFor="confirm-password">Confirm Password</label>
              <div className={`input-box ${focused === 'confirm' ? 'active' : ''}`}>
                <span className="field-icon">🔐</span>
                <input
                  id="confirm-password"
                  type={show ? 'text' : 'password'}
                  value={form.confirm}
                  onChange={(e) => setForm((f) => ({ ...f, confirm: e.target.value }))}
                  placeholder="Repeat your new password"
                  required
                  autoComplete="new-password"
                  className="input"
                  onFocus={() => setFocused('confirm')}
                  onBlur={() => setFocused(null)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`submit-btn ${loading ? 'is-loading' : ''}`}
            >
              {loading ? (
                <>
                  <span className="btn-spinner" />
                  Saving...
                </>
              ) : (
                <>Save new password <span className="arrow">→</span></>
              )}
            </button>
          </form>
        )}

        {status === 'invalid' && (
          <div className="form">
            <Link href="/forgot-password" className="submit-btn" style={{ textDecoration: 'none' }}>
              Request a new link <span className="arrow">→</span>
            </Link>
          </div>
        )}

        {status === 'checking' && (
          <div className="loader"><div className="loader-ring" /></div>
        )}

        <p className="footer-text">
          <Link href="/login" className="signup-link">Back to login</Link>
        </p>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="login-page">
          <div className="loader"><div className="loader-ring" /></div>
        </div>
      }
    >
      <ResetForm />
    </Suspense>
  );
}

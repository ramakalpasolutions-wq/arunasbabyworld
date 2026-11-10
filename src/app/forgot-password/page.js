'use client';
import { useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import toast from 'react-hot-toast';
import TurnstileWidget from '@/components/auth/TurnstileWidget';
import { normalizePhone } from '@/lib/phone';
import '../login/login.css';

export default function ForgotPasswordPage() {
  const [identifier, setIdentifier] = useState('');
  const [focused, setFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState('');
  const [sentTo, setSentTo] = useState(null);
  const captchaRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const typed = identifier.trim();
    if (!typed) {
      toast.error('Please enter your phone number');
      return;
    }
    if (!typed.includes('@') && !normalizePhone(typed)) {
      toast.error('Please enter a valid 10-digit mobile number');
      return;
    }
    if (!captchaToken) {
      toast.error('Please confirm you are human');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/users/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: typed, captchaToken }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');
      setSentTo(data.sentTo || []);
    } catch (err) {
      toast.error(err.message);
      captchaRef.current?.reset();
    } finally {
      setLoading(false);
    }
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

      <Link href="/" className="home-btn" aria-label="Go home">
        <span>🏠</span>
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
          <h1 className="title">{sentTo ? 'Check your email' : 'Forgot password?'}</h1>
          <p className="subtitle">
            {sentTo
              ? 'We have sent you a link to choose a new password.'
              : 'Enter your phone number and we will email you a reset link.'}
          </p>
        </div>

        {sentTo ? (
          <div className="form">
            <div
              role="status"
              style={{
                background: '#F1F8F1', border: '1.5px solid #43A047', borderRadius: '14px',
                padding: '14px 16px', fontSize: '0.9rem', lineHeight: 1.6, color: '#264653',
              }}
            >
              📧 Reset link sent to <strong>{sentTo.join(', ') || 'your email'}</strong>.
              <br />
              The link works once and expires in 30 minutes. If you cannot see it, check your spam folder.
            </div>
            <Link href="/login" className="submit-btn" style={{ textDecoration: 'none' }}>
              Back to login <span className="arrow">→</span>
            </Link>
            <button
              type="button"
              onClick={() => { setSentTo(null); setCaptchaToken(''); }}
              style={{
                background: 'none', border: 'none', color: '#264653', fontWeight: 800,
                fontSize: '0.86rem', cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'underline',
              }}
            >
              Send it again
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="form">
            <div className="field">
              <label className="label" htmlFor="identifier">Phone Number</label>
              <div className={`input-box ${focused ? 'active' : ''}`}>
                <span className="field-icon">📞</span>
                <input
                  id="identifier"
                  type="text"
                  inputMode="tel"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="10-digit mobile number"
                  required
                  autoComplete="tel"
                  className="input"
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                />
              </div>
              <p style={{ margin: '6px 2px 0', fontSize: '0.74rem', color: '#8A9BA3', lineHeight: 1.4 }}>
                You can also enter the email address on your account.
              </p>
            </div>

            <TurnstileWidget ref={captchaRef} onVerify={setCaptchaToken} />

            <button
              type="submit"
              disabled={loading}
              className={`submit-btn ${loading ? 'is-loading' : ''}`}
            >
              {loading ? (
                <>
                  <span className="btn-spinner" />
                  Sending...
                </>
              ) : (
                <>Email me a reset link <span className="arrow">→</span></>
              )}
            </button>
          </form>
        )}

        <p className="footer-text">
          Remembered it?{' '}
          <Link href="/login" className="signup-link">Back to login</Link>
        </p>
      </div>
    </div>
  );
}

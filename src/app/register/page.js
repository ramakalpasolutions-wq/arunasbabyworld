'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import TurnstileWidget from '@/components/auth/TurnstileWidget';
import { takePendingSignup } from '@/lib/pendingSignup';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '', confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [captchaToken, setCaptchaToken] = useState('');
  const [fromLogin, setFromLogin] = useState(false);
  const captchaRef = useRef(null);

  // Sent here from the login page: fill in what was already typed there
  useEffect(() => {
    const pending = takePendingSignup();
    if (pending?.email) {
      setForm(f => ({
        ...f,
        email: pending.email,
        password: pending.password || '',
        confirmPassword: pending.password || '',
      }));
      setFromLogin(true);
    }
  }, []);

  // ✅ Smart back navigation
  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) {
      toast.error('Please fill required fields');
      return;
    }
    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (!accepted) {
      toast.error('Please accept the Terms & Conditions and policies');
      return;
    }
    if (!captchaToken) {
      toast.error('Please confirm you are human');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          password: form.password,
          acceptedPolicies: accepted,
          captchaToken,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('Account created! Please login 🎉');
      const redirect = new URLSearchParams(window.location.search).get('redirect');
      router.push(redirect ? `/login?redirect=${encodeURIComponent(redirect)}` : '/login');
    } catch (err) {
      toast.error(err.message);
      // A verification token works only once
      captchaRef.current?.reset();
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    flex: 1, border: 'none', outline: 'none',
    padding: '11px 14px', fontSize: '0.9rem',
    color: '#1B3540', background: 'transparent',
    fontFamily: 'inherit',
  };

  const policyLinkStyle = { color: '#264653', fontWeight: '800', textDecoration: 'underline' };

  const iconBoxStyle = {
    padding: '11px 13px', fontSize: '1rem',
    background: '#f9fafb', borderRight: '2px solid #e5e7eb',
  };

  const fieldWrapStyle = {
    display: 'flex', alignItems: 'center',
    border: '2px solid #e5e7eb', borderRadius: '12px',
    overflow: 'hidden', background: 'white',
    transition: 'border-color 0.2s',
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #FFF5F4 0%, #EEF3F5 50%, #e0f2fe 100%)',
      padding: '20px',
      fontFamily: "'Nunito', sans-serif",
      position: 'relative',
    }}>

      {/* ✅ BACK BUTTON */}
      <button
        onClick={handleBack}
        style={{
          position: 'fixed',
          top: '20px',
          left: '20px',
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 18px',
          background: 'rgba(255, 255, 255, 0.85)',
          border: '1.5px solid rgba(229,57,53, 0.25)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderRadius: '999px',
          color: '#264653',
          fontSize: '0.86rem',
          fontWeight: '800',
          fontFamily: 'Nunito, sans-serif',
          cursor: 'pointer',
          transition: 'all 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
          boxShadow: '0 4px 16px rgba(38,70,83, 0.12)',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = 'linear-gradient(135deg, #3A6373, #264653)';
          e.currentTarget.style.color = '#fff';
          e.currentTarget.style.borderColor = 'transparent';
          e.currentTarget.style.transform = 'translateX(-4px)';
          e.currentTarget.style.boxShadow = '0 8px 24px rgba(38,70,83, 0.30)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.85)';
          e.currentTarget.style.color = '#264653';
          e.currentTarget.style.borderColor = 'rgba(229,57,53, 0.25)';
          e.currentTarget.style.transform = 'translateX(0)';
          e.currentTarget.style.boxShadow = '0 4px 16px rgba(38,70,83, 0.12)';
        }}
      >
        <span style={{ fontSize: '1.15rem', lineHeight: 1 }}>←</span>
        <span className="back-btn-text">Back</span>
      </button>

      {/* ✅ HOME BUTTON */}
      <Link
        href="/"
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '44px',
          height: '44px',
          background: 'rgba(255, 255, 255, 0.85)',
          border: '1.5px solid rgba(229,57,53, 0.25)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderRadius: '50%',
          textDecoration: 'none',
          fontSize: '1.15rem',
          cursor: 'pointer',
          transition: 'all 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
          boxShadow: '0 4px 16px rgba(38,70,83, 0.12)',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = 'linear-gradient(135deg, #3A6373, #264653)';
          e.currentTarget.style.transform = 'scale(1.10) rotate(-8deg)';
          e.currentTarget.style.boxShadow = '0 8px 24px rgba(38,70,83, 0.30)';
          e.currentTarget.style.borderColor = 'transparent';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.85)';
          e.currentTarget.style.transform = 'scale(1) rotate(0deg)';
          e.currentTarget.style.boxShadow = '0 4px 16px rgba(38,70,83, 0.12)';
          e.currentTarget.style.borderColor = 'rgba(229,57,53, 0.25)';
        }}
      >
        🏠
      </Link>

      <div style={{
        background: 'white',
        borderRadius: '24px',
        padding: '36px 40px',
        width: '100%',
        maxWidth: '460px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.12)',
        position: 'relative',
        zIndex: 1,
        marginTop: '40px',
      }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'none', marginBottom: '12px' }}>
            <span style={{ fontSize: '2rem' }}>🍼</span>
            <span style={{
              fontSize: '1.6rem', fontWeight: '900',
              background: 'linear-gradient(135deg, #3A6373, #264653)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>Arunas Baby World</span>
          </Link>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#1B3540', margin: '0 0 4px' }}>
            Create Account ✨
          </h1>
          <p style={{ color: '#888', fontSize: '0.88rem', margin: 0 }}>
            Join thousands of happy parents!
          </p>
        </div>

        {fromLogin && (
          <div role="status" style={{
            background: '#FFF6E5', border: '1.5px solid #F2B33D', borderRadius: '12px',
            padding: '10px 14px', marginBottom: '16px', fontSize: '0.86rem', fontWeight: '700', color: '#264653',
          }}>
            👋 We couldn&apos;t find an account for <strong>{form.email}</strong>. Add your name below to create one.
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

          {/* Name */}
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#444', marginBottom: '6px' }}>
              Full Name *
            </label>
            <div style={fieldWrapStyle}>
              <span style={{ ...iconBoxStyle, color: '#E53935' }}>👤</span>
              <input
                style={inputStyle}
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Your full name"
                required
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#444', marginBottom: '6px' }}>
              Email Address *
            </label>
            <div style={fieldWrapStyle}>
              <span style={{ ...iconBoxStyle, color: '#264653' }}>✉️</span>
              <input
                type="email"
                style={inputStyle}
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="your@email.com"
                required
              />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#444', marginBottom: '6px' }}>
              Phone Number
            </label>
            <div style={fieldWrapStyle}>
              <span style={{ ...iconBoxStyle, color: '#1E88E5' }}>📞</span>
              <input
                style={inputStyle}
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="+91 XXXXX XXXXX (optional)"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#444', marginBottom: '6px' }}>
              Password *
            </label>
            <div style={fieldWrapStyle}>
              <span style={{ ...iconBoxStyle, color: '#43A047' }}>🔒</span>
              <input
                type={showPassword ? 'text' : 'password'}
                style={inputStyle}
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder="At least 6 characters"
                required
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                style={{ padding: '11px 13px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', color: '#888' }}>
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#444', marginBottom: '6px' }}>
              Confirm Password *
            </label>
            <div style={fieldWrapStyle}>
              <span style={{ ...iconBoxStyle, color: '#F2B33D' }}>🔐</span>
              <input
                type="password"
                style={inputStyle}
                value={form.confirmPassword}
                onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))}
                placeholder="Repeat your password"
                required
              />
            </div>
          </div>

          {/* Accept policies */}
          <label style={{
            display: 'flex', alignItems: 'flex-start', gap: '10px',
            fontSize: '0.84rem', color: '#444', lineHeight: 1.5, cursor: 'pointer',
          }}>
            <input
              type="checkbox"
              checked={accepted}
              onChange={e => setAccepted(e.target.checked)}
              required
              style={{ width: '18px', height: '18px', marginTop: '2px', accentColor: '#264653', flexShrink: 0, cursor: 'pointer' }}
            />
            <span>
              I have read and accept the{' '}
              <Link href="/terms" target="_blank" style={policyLinkStyle}>Terms &amp; Conditions</Link>,{' '}
              <Link href="/privacy" target="_blank" style={policyLinkStyle}>Privacy Policy</Link>,{' '}
              <Link href="/refund-policy" target="_blank" style={policyLinkStyle}>Refund &amp; Returns Policy</Link> and{' '}
              <Link href="/shipping-policy" target="_blank" style={policyLinkStyle}>Shipping Policy</Link>. *
            </span>
          </label>

          {/* Human verification */}
          <TurnstileWidget ref={captchaRef} onVerify={setCaptchaToken} />

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              background: loading ? '#ddd' : 'linear-gradient(135deg, #3A6373, #264653)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '1rem',
              fontWeight: '800',
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: loading ? 'none' : '0 6px 20px rgba(229,57,53,0.35)',
              fontFamily: 'inherit',
              marginTop: '4px',
            }}
          >
            {loading ? '⏳ Creating...' : '✨ Create Account'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <p style={{ color: '#666', fontSize: '0.9rem', margin: 0 }}>
            Already have an account?{' '}
            <Link href="/login" style={{ color: '#E53935', fontWeight: '800', textDecoration: 'none' }}>
              Login →
            </Link>
          </p>
        </div>
      </div>

      {/* ✅ Mobile responsive style for back text */}
      <style>{`
        @media (max-width: 360px) {
          .back-btn-text { display: none; }
        }
      `}</style>
    </div>
  );
}
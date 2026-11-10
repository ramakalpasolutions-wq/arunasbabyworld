'use client';
import { useState, useRef, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import toast from 'react-hot-toast';
import TurnstileWidget from '@/components/auth/TurnstileWidget';
import { setPendingSignup } from '@/lib/pendingSignup';
import { normalizePhone } from '@/lib/phone';
import './login.css';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';
  const [form, setForm] = useState({ phone: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [rememberMe, setRememberMe] = useState(false);
  const [captchaToken, setCaptchaToken] = useState('');
  const captchaRef = useRef(null);

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.phone || !form.password) {
      toast.error('Please fill all fields');
      return;
    }
    if (!captchaToken) {
      toast.error('Please confirm you are human');
      return;
    }
    // Phone number is the login ID. Older accounts without a phone number can type their email instead.
    const typed = form.phone.trim();
    const isEmail = typed.includes('@');
    const phone = isEmail ? '' : normalizePhone(typed);
    if (!isEmail && !phone) {
      toast.error('Please enter a valid 10-digit mobile number');
      return;
    }
    setLoading(true);
    try {
      const result = await signIn('credentials', {
        phone: isEmail ? typed.toLowerCase() : phone,
        password: form.password,
        captchaToken,
        redirect: false,
      });

      if (result?.error === 'USER_NOT_FOUND') {
        // New shopper: carry what they typed over to the register page
        setPendingSignup({
          phone,
          email: isEmail ? typed.toLowerCase() : '',
          password: form.password,
        });
        toast('No account found with these details. Let\'s create one!', { icon: '👋' });
        const next = redirect && redirect !== '/' ? `?redirect=${encodeURIComponent(redirect)}` : '';
        router.push(`/register${next}`);
        return;
      }
      if (result?.error === 'CAPTCHA_FAILED') {
        throw new Error('Human verification failed. Please try again.');
      }
      if (result?.error === 'Account is deactivated') {
        throw new Error('This account is deactivated. Please contact us.');
      }
      if (result?.error === 'INVALID_PHONE') {
        throw new Error('Please enter a valid 10-digit mobile number');
      }
      if (result?.error) throw new Error('Invalid phone number or password');

      toast.success('Welcome back! 🎉');
      router.push(redirect);
      router.refresh();
    } catch (err) {
      toast.error(err.message);
      // A verification token works only once
      captchaRef.current?.reset();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Animated background shapes */}
      <div className="bg-shape bg-shape-1" />
      <div className="bg-shape bg-shape-2" />
      <div className="bg-shape bg-shape-3" />
      <div className="bg-shape bg-shape-4" />
      <div className="bg-shape bg-shape-5" />
      <div className="bg-shape bg-shape-6" />

      {/* BACK BUTTON */}
      <button onClick={handleBack} className="back-btn" aria-label="Go back">
        <span className="back-arrow">←</span>
        <span className="back-text">Back</span>
      </button>

      {/* HOME BUTTON */}
      <Link href="/" className="home-btn" aria-label="Go home">
        <span>🏠</span>
      </Link>

      {/* Card */}
      <div className="login-card">
        <div className="card-top-bar" />

        {/* Logo with Cream Background Removed */}
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
          <h2 className="brand-name">Aruna&apos;s Baby World</h2>
          <h1 className="title">Welcome Back</h1>
          <p className="subtitle">Sign in to continue shopping</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="form">
          {/* Phone number */}
          <div className="field">
            <label className="label" htmlFor="phone">Phone Number</label>
            <div className={`input-box ${focusedField === 'phone' ? 'active' : ''}`}>
              <span className="field-icon">📞</span>
              <input
                id="phone"
                type="tel"
                inputMode="tel"
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="10-digit mobile number"
                required
                autoComplete="tel"
                className="input"
                onFocus={() => setFocusedField('phone')}
                onBlur={() => setFocusedField(null)}
              />
            </div>
            <p style={{ margin: '6px 2px 0', fontSize: '0.74rem', color: '#8A9BA3', lineHeight: 1.4 }}>
              Registered earlier without a phone number? Enter your email here instead.
            </p>
          </div>

          {/* Password */}
          <div className="field">
            <label className="label" htmlFor="password">Password</label>
            <div className={`input-box ${focusedField === 'password' ? 'active' : ''}`}>
              <span className="field-icon">🔒</span>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className="input"
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
              />
              <button
                type="button"
                className="eye-btn"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {/* Options */}
          <div className="options-row">
            <label className="remember">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span className="custom-check" />
              <span>Remember me</span>
            </label>
            <Link href="/forgot-password" className="forgot">Forgot?</Link>
          </div>

          {/* Human verification */}
          <TurnstileWidget ref={captchaRef} onVerify={setCaptchaToken} />

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className={`submit-btn ${loading ? 'is-loading' : ''}`}
          >
            {loading ? (
              <>
                <span className="btn-spinner" />
                Signing in...
              </>
            ) : (
              <>Sign In <span className="arrow">→</span></>
            )}
          </button>
        </form>

        {/* Footer */}
        <p className="footer-text">
          New here?{' '}
          <Link href="/register" className="signup-link">Create account</Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="login-page">
        <div className="loader"><div className="loader-ring" /></div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
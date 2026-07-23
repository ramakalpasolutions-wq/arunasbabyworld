'use client';
import { useState, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import toast from 'react-hot-toast';
import './login.css';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [rememberMe, setRememberMe] = useState(false);

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      toast.error('Please fill all fields');
      return;
    }
    setLoading(true);
    try {
      const result = await signIn('credentials', {
        email: form.email.toLowerCase().trim(),
        password: form.password,
        redirect: false,
      });
      if (result?.error) throw new Error('Invalid email or password');
      toast.success('Welcome back! 🎉');
      router.push(redirect);
      router.refresh();
    } catch (err) {
      toast.error(err.message);
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

        {/* Logo */}
        <div className="logo-area">
          <Link href="/" className="logo-link">
            <div className="logo-wrap">
              <Image
                src="/logo.png"
                alt="Arunas Baby World"
                width={180}
                height={180}
                className="logo-img"
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
          {/* Email */}
          <div className="field">
            <label className="label" htmlFor="email">Email Address</label>
            <div className={`input-box ${focusedField === 'email' ? 'active' : ''}`}>
              <span className="field-icon">✉️</span>
              <input
                id="email"
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="you@example.com"
                required
                autoComplete="email"
                className="input"
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
              />
            </div>
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
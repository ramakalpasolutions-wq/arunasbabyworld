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
        email: form.email,
        password: form.password,
        redirect: false,
      });
      if (result?.error) throw new Error('Invalid email or password');
      toast.success('Welcome back!');
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
      {/* Soft pastel background shapes */}
      <div className="bg-shape bg-shape-1" />
      <div className="bg-shape bg-shape-2" />
      <div className="bg-shape bg-shape-3" />
      <div className="bg-shape bg-shape-4" />
      <div className="bg-dots" />

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
            <div className="logo-circle">
              <Image
                src="/logo.png"
                alt="Aruna's Baby World"
                width={130}
                height={130}
                className="logo-img"
                priority
              />
            </div>
          </Link>
          <h2 className="brand-name">Aruna&apos;s Baby World</h2>
          <h1 className="title">Welcome Back</h1>
          <p className="subtitle">Sign in to your Aruna&apos;s Baby World account</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="form">
          {/* Email */}
          <div className="field">
            <label className="label">Email Address</label>
            <div className={`input-box ${focusedField === 'email' ? 'active' : ''}`}>
              <span className="field-icon">✉️</span>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="you@example.com"
                required
                className="input"
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
              />
            </div>
          </div>

          {/* Password */}
          <div className="field">
            <label className="label">Password</label>
            <div className={`input-box ${focusedField === 'password' ? 'active' : ''}`}>
              <span className="field-icon">🔒</span>
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder="••••••••"
                required
                className="input"
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
              />
              <button
                type="button"
                className="eye-btn"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {/* Options */}
          <div className="options-row">
            <label className="remember">
              <input type="checkbox" />
              <span className="custom-check" />
              Remember me
            </label>
            <Link href="/forgot-password" className="forgot">Forgot?</Link>
          </div>

          {/* Submit */}
          <button type="submit" disabled={loading} className={`submit-btn ${loading ? 'is-loading' : ''}`}>
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

        {/* Demo */}
        <div className="demo-strip">
          <span>🔑 Demo: admin@firstcry.com / admin123</span>
          <button
            type="button"
            className="demo-btn"
            onClick={() => {
              setForm({ email: 'admin@firstcry.com', password: 'admin123' });
              toast.success('Credentials filled!');
            }}
          >
            Fill
          </button>
        </div>
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
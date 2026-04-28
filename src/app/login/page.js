'use client';
import { useState, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
      toast.success('Welcome back! 👋');
      router.push(redirect);
      router.refresh();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #fff0f5 0%, #f3e8ff 50%, #e0f2fe 100%)',
      padding: '20px',
      fontFamily: "'Nunito', sans-serif",
    }}>
      {/* Background decorations */}
      <div style={{
        position: 'fixed',
        top: '-100px',
        right: '-100px',
        width: '400px',
        height: '400px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #ff6b9d20, #7c3aed20)',
        zIndex: 0,
      }} />
      <div style={{
        position: 'fixed',
        bottom: '-100px',
        left: '-100px',
        width: '300px',
        height: '300px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #0ea5e920, #10b98120)',
        zIndex: 0,
      }} />

      {/* Card */}
      <div style={{
        background: 'white',
        borderRadius: '24px',
        padding: '40px',
        width: '100%',
        maxWidth: '440px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.12)',
        position: 'relative',
        zIndex: 1,
      }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <Link
            href="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              textDecoration: 'none',
              marginBottom: '16px',
            }}
          >
            <span style={{ fontSize: '2rem' }}>🍼</span>
            <span style={{
              fontSize: '1.6rem',
              fontWeight: '900',
              background: 'linear-gradient(135deg, #ff6b9d, #7c3aed)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              BabyBliss
            </span>
          </Link>
          <h1 style={{
            fontSize: '1.6rem',
            fontWeight: '800',
            color: '#1a1a2e',
            margin: '0 0 6px',
          }}>
            Welcome Back! 👋
          </h1>
          <p style={{ color: '#888', fontSize: '0.9rem', margin: 0 }}>
            Login to continue shopping for your little ones
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>

          {/* Email Field */}
          <div style={{ marginBottom: '18px' }}>
            <label style={{
              display: 'block',
              fontSize: '0.85rem',
              fontWeight: '700',
              color: '#444',
              marginBottom: '8px',
            }}>
              Email Address
            </label>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              border: '2px solid #e5e7eb',
              borderRadius: '12px',
              overflow: 'hidden',
              transition: 'border-color 0.2s',
              background: 'white',
            }}
              onFocus={() => {}}
            >
              <span style={{
                padding: '12px 14px',
                fontSize: '1.1rem',
                background: '#f9fafb',
                borderRight: '2px solid #e5e7eb',
                color: '#ff6b9d',
              }}>
                ✉️
              </span>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="your@email.com"
                required
                style={{
                  flex: 1,
                  border: 'none',
                  outline: 'none',
                  padding: '12px 16px',
                  fontSize: '0.95rem',
                  color: '#1a1a2e',
                  background: 'transparent',
                  fontFamily: 'inherit',
                }}
                onFocus={e => e.target.parentElement.style.borderColor = '#ff6b9d'}
                onBlur={e => e.target.parentElement.style.borderColor = '#e5e7eb'}
              />
            </div>
          </div>

          {/* Password Field */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              fontSize: '0.85rem',
              fontWeight: '700',
              color: '#444',
              marginBottom: '8px',
            }}>
              Password
            </label>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              border: '2px solid #e5e7eb',
              borderRadius: '12px',
              overflow: 'hidden',
              background: 'white',
            }}>
              <span style={{
                padding: '12px 14px',
                fontSize: '1.1rem',
                background: '#f9fafb',
                borderRight: '2px solid #e5e7eb',
                color: '#7c3aed',
              }}>
                🔒
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder="Your password"
                required
                style={{
                  flex: 1,
                  border: 'none',
                  outline: 'none',
                  padding: '12px 16px',
                  fontSize: '0.95rem',
                  color: '#1a1a2e',
                  background: 'transparent',
                  fontFamily: 'inherit',
                }}
                onFocus={e => e.target.parentElement.style.borderColor = '#7c3aed'}
                onBlur={e => e.target.parentElement.style.borderColor = '#e5e7eb'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  padding: '12px 14px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  color: '#888',
                }}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              background: loading
                ? '#ddd'
                : 'linear-gradient(135deg, #ff6b9d, #7c3aed)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '1rem',
              fontWeight: '800',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s',
              boxShadow: loading ? 'none' : '0 6px 20px rgba(255,107,157,0.35)',
              letterSpacing: '0.3px',
              fontFamily: 'inherit',
            }}
            onMouseEnter={e => !loading && (e.target.style.transform = 'translateY(-2px)')}
            onMouseLeave={e => (e.target.style.transform = 'translateY(0)')}
          >
            {loading ? '⏳ Logging in...' : '🔑 Login to BabyBliss'}
          </button>
        </form>

        {/* Divider */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          margin: '24px 0',
        }}>
          <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
          <span style={{ fontSize: '12px', color: '#aaa', fontWeight: '600' }}>OR</span>
          <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
        </div>

        {/* Register Link */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <p style={{ color: '#666', fontSize: '0.9rem', margin: 0 }}>
            Don&apos;t have an account?{' '}
            <Link
              href="/register"
              style={{
                color: '#ff6b9d',
                fontWeight: '800',
                textDecoration: 'none',
              }}
            >
              Create one →
            </Link>
          </p>
        </div>

        {/* Features */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '8px',
          marginBottom: '20px',
        }}>
          {[
            { icon: '🚚', text: 'Free Delivery ₹499+' },
            { icon: '↩️', text: '30-Day Returns' },
            { icon: '🔒', text: 'Secure Payment' },
            { icon: '🎁', text: '10% First Order' },
          ].map((f, i) => (
            <div key={i} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 10px',
              background: '#f9fafb',
              borderRadius: '8px',
              fontSize: '11px',
              color: '#555',
              fontWeight: '600',
            }}>
              <span>{f.icon}</span>
              <span>{f.text}</span>
            </div>
          ))}
        </div>

        {/* Demo credentials */}
        <div style={{
          background: 'linear-gradient(135deg, #fff8e1, #fef3c7)',
          border: '1px solid #fcd34d',
          borderRadius: '10px',
          padding: '12px 16px',
          textAlign: 'center',
        }}>
          <p style={{
            margin: 0,
            fontSize: '12px',
            color: '#92400e',
            fontWeight: '600',
          }}>
            🔑 <strong>Demo Admin:</strong> admin@firstcry.com / admin123
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #fff0f5, #f3e8ff)',
      }}>
        <div style={{
          width: '40px', height: '40px',
          border: '4px solid #fce4ec',
          borderTop: '4px solid #ff6b9d',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
'use client';
import { useState, useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function AdminLoginPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [form, setForm]               = useState({ email: '', password: '' });
  const [loading, setLoading]         = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [shake, setShake]             = useState(false);

  // ✅ Already admin — go straight to dashboard
  useEffect(() => {
    if (status === 'loading') return;
    if (session?.user?.role === 'admin') {
      router.replace('/admin/dashboard');
    }
  }, [session, status, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      toast.error('Please fill all fields');
      return;
    }
    setLoading(true);
    try {
      const result = await signIn('credentials', {
        email:    form.email,
        password: form.password,
        redirect: false,
      });

      if (result?.error) {
        setShake(true);
        setTimeout(() => setShake(false), 600);
        throw new Error('Invalid email or password');
      }

      toast.success('Welcome back, Admin! 🎉');
      router.replace('/admin/dashboard');

    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Loading screen
  if (status === 'loading') {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#06060f',
      }}>
        <div style={{
          width: '44px', height: '44px',
          border: '4px solid rgba(255,107,53,0.2)',
          borderTop: '4px solid #FF6B35',
          borderRadius: '50%',
          animation: 'spin 0.7s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#06060f',
      padding: '20px',
      fontFamily: "'Nunito', sans-serif",
      position: 'relative',
      overflow: 'hidden',
    }}>

      {/* ── All keyframe styles ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800;900&display=swap');

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes float1 {
          0%,100% { transform: translate(0,0) scale(1); }
          25%     { transform: translate(-20px,30px) scale(1.05); }
          50%     { transform: translate(15px,-20px) scale(0.95); }
          75%     { transform: translate(25px,10px) scale(1.03); }
        }
        @keyframes float2 {
          0%,100% { transform: translate(0,0) scale(1); }
          33%     { transform: translate(25px,-25px) scale(1.06); }
          66%     { transform: translate(-20px,20px) scale(0.96); }
        }
        @keyframes cardIn {
          from { opacity:0; transform: translateY(28px) scale(0.97); }
          to   { opacity:1; transform: translateY(0) scale(1); }
        }
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          20%     { transform: translateX(-10px); }
          40%     { transform: translateX(10px); }
          60%     { transform: translateX(-8px); }
          80%     { transform: translateX(8px); }
        }
        @keyframes rainbow {
          0%   { background-position: 0% 50%; }
          100% { background-position: 300% 50%; }
        }
        @keyframes dotPulse {
          0%,100% { opacity:0.5; transform:scale(1); }
          50%     { opacity:1;   transform:scale(1.4); }
        }
        input::placeholder {
          color: rgba(255,255,255,0.2);
        }
        input:-webkit-autofill {
          -webkit-box-shadow: 0 0 0 30px #0d0d20 inset !important;
          -webkit-text-fill-color: white !important;
        }
      `}</style>

      {/* ── Background orb 1 ── */}
      <div style={{
        position: 'fixed',
        width: '500px', height: '500px',
        top: '-150px', right: '-100px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,107,53,0.18) 0%, transparent 70%)',
        filter: 'blur(60px)',
        animation: 'float1 18s ease-in-out infinite',
        pointerEvents: 'none', zIndex: 0,
      }} />

      {/* ── Background orb 2 ── */}
      <div style={{
        position: 'fixed',
        width: '420px', height: '420px',
        bottom: '-100px', left: '-80px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(123,47,190,0.18) 0%, transparent 70%)',
        filter: 'blur(60px)',
        animation: 'float2 22s ease-in-out infinite',
        pointerEvents: 'none', zIndex: 0,
      }} />

      {/* ── Background orb 3 ── */}
      <div style={{
        position: 'fixed',
        width: '300px', height: '300px',
        top: '40%', left: '20%',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,107,53,0.06) 0%, transparent 70%)',
        filter: 'blur(80px)',
        animation: 'float1 14s ease-in-out infinite 3s',
        pointerEvents: 'none', zIndex: 0,
      }} />

      {/* ── Main Card ── */}
      <div style={{
        width: '100%',
        maxWidth: '440px',
        position: 'relative',
        zIndex: 1,
        animation: 'cardIn 0.6s cubic-bezier(0.16,1,0.3,1)',
      }}>

        {/* Rainbow top bar */}
        <div style={{
          height: '4px',
          background: 'linear-gradient(90deg, #FF6B35, #FFB347, #7B2FBE, #9B4FDE, #FF6B35)',
          backgroundSize: '300% 100%',
          animation: 'rainbow 4s linear infinite',
          borderRadius: '24px 24px 0 0',
        }} />

        {/* Glass card body */}
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          backdropFilter: 'blur(40px)',
          WebkitBackdropFilter: 'blur(40px)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderTop: 'none',
          borderRadius: '0 0 24px 24px',
          padding: '40px 36px 36px',
          animation: shake ? 'shake 0.6s ease' : 'none',
        }}>

          {/* ── Header ── */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>

            {/* Shield icon */}
            <div style={{
              width: '72px', height: '72px',
              borderRadius: '20px',
              background: 'linear-gradient(135deg, rgba(255,107,53,0.15), rgba(123,47,190,0.15))',
              border: '1px solid rgba(255,255,255,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 18px',
              fontSize: '2.2rem',
              boxShadow: '0 8px 32px rgba(255,107,53,0.12)',
            }}>
              🛡️
            </div>

            {/* Admin badge pill */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '7px',
              padding: '5px 18px',
              background: 'rgba(255,107,53,0.10)',
              border: '1px solid rgba(255,107,53,0.22)',
              borderRadius: '9999px',
              fontSize: '0.68rem', fontWeight: '800',
              color: '#FF6B35',
              textTransform: 'uppercase', letterSpacing: '1.5px',
              marginBottom: '18px',
            }}>
              <span style={{
                width: '6px', height: '6px',
                borderRadius: '50%',
                background: '#FF6B35',
                display: 'inline-block',
                animation: 'dotPulse 2s ease-in-out infinite',
              }} />
              Admin Access Only
            </div>

            <h1 style={{
              fontSize: '1.7rem', fontWeight: '900',
              color: 'white', margin: '0 0 8px',
              letterSpacing: '-0.5px',
            }}>
              Welcome Back
            </h1>
            <p style={{
              color: 'rgba(255,255,255,0.35)',
              fontSize: '0.88rem', margin: 0,
            }}>
              Sign in to your admin dashboard
            </p>
          </div>

          {/* ── Form ── */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

            {/* Email */}
            <div>
              <label style={{
                display: 'block', fontSize: '0.73rem',
                fontWeight: '800', color: 'rgba(255,255,255,0.45)',
                marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px',
              }}>
                Email Address
              </label>
              <div style={{
                display: 'flex', alignItems: 'center',
                border: `2px solid ${focusedField === 'email' ? '#FF6B35' : 'rgba(255,255,255,0.07)'}`,
                borderRadius: '14px', overflow: 'hidden',
                background: 'rgba(255,255,255,0.03)',
                transition: 'all 0.3s ease',
                boxShadow: focusedField === 'email' ? '0 0 0 4px rgba(255,107,53,0.10)' : 'none',
              }}>
                <span style={{
                  padding: '13px 14px', fontSize: '1rem',
                  background: 'rgba(255,255,255,0.03)',
                  borderRight: '1px solid rgba(255,255,255,0.06)',
                }}>
                  ✉️
                </span>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="admin@babybliss.com"
                  required
                  style={{
                    flex: 1, border: 'none', outline: 'none',
                    padding: '13px 16px', fontSize: '0.92rem',
                    color: 'white', background: 'transparent',
                    fontFamily: 'inherit', fontWeight: '500',
                  }}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label style={{
                display: 'block', fontSize: '0.73rem',
                fontWeight: '800', color: 'rgba(255,255,255,0.45)',
                marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px',
              }}>
                Password
              </label>
              <div style={{
                display: 'flex', alignItems: 'center',
                border: `2px solid ${focusedField === 'password' ? '#7B2FBE' : 'rgba(255,255,255,0.07)'}`,
                borderRadius: '14px', overflow: 'hidden',
                background: 'rgba(255,255,255,0.03)',
                transition: 'all 0.3s ease',
                boxShadow: focusedField === 'password' ? '0 0 0 4px rgba(123,47,190,0.10)' : 'none',
              }}>
                <span style={{
                  padding: '13px 14px', fontSize: '1rem',
                  background: 'rgba(255,255,255,0.03)',
                  borderRight: '1px solid rgba(255,255,255,0.06)',
                }}>
                  🔒
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="••••••••••"
                  required
                  style={{
                    flex: 1, border: 'none', outline: 'none',
                    padding: '13px 16px', fontSize: '0.92rem',
                    color: 'white', background: 'transparent',
                    fontFamily: 'inherit', fontWeight: '500',
                  }}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    padding: '13px 14px', background: 'none',
                    border: 'none', cursor: 'pointer',
                    fontSize: '1rem', opacity: 0.45,
                    transition: 'opacity 0.2s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '0.45'}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '15px',
                background: loading
                  ? 'rgba(255,255,255,0.05)'
                  : 'linear-gradient(135deg, #FF6B35, #7B2FBE)',
                color: loading ? 'rgba(255,255,255,0.25)' : 'white',
                border: 'none', borderRadius: '14px',
                fontSize: '0.96rem', fontWeight: '800',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
                display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: '8px',
                boxShadow: loading ? 'none' : '0 8px 32px rgba(255,107,53,0.28)',
                transition: 'all 0.3s ease',
                marginTop: '6px',
                letterSpacing: '0.3px',
              }}
              onMouseEnter={e => {
                if (!loading) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 14px 40px rgba(255,107,53,0.40)';
                }
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = loading ? 'none' : '0 8px 32px rgba(255,107,53,0.28)';
              }}
            >
              {loading ? (
                <>
                  <div style={{
                    width: '18px', height: '18px',
                    border: '2.5px solid rgba(255,255,255,0.15)',
                    borderTop: '2.5px solid rgba(255,255,255,0.6)',
                    borderRadius: '50%',
                    animation: 'spin 0.6s linear infinite',
                  }} />
                  Signing in...
                </>
              ) : (
                '🔑 Sign In to Dashboard'
              )}
            </button>
          </form>

          {/* Divider */}
          <div style={{
            display: 'flex', alignItems: 'center',
            gap: '14px', margin: '24px 0',
          }}>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.05)' }} />
            <span style={{
              fontSize: '0.68rem',
              color: 'rgba(255,255,255,0.20)',
              fontWeight: '600',
              textTransform: 'uppercase', letterSpacing: '1px',
            }}>
              or
            </span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.05)' }} />
          </div>

          {/* Back to store */}
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <Link
              href="/"
              style={{
                color: 'rgba(255,255,255,0.30)',
                fontSize: '0.84rem', fontWeight: '600',
                textDecoration: 'none',
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                transition: 'color 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.color = '#FF6B35'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.30)'}
            >
              ← Back to BabyBliss Store
            </Link>
          </div>

          {/* Security note */}
          <div style={{
            padding: '12px 16px',
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.04)',
            borderRadius: '12px',
            display: 'flex', alignItems: 'center', gap: '10px',
            marginBottom: '12px',
          }}>
            <span style={{ fontSize: '1rem', flexShrink: 0 }}>🔐</span>
            <p style={{
              margin: 0, fontSize: '0.70rem',
              color: 'rgba(255,255,255,0.20)',
              fontWeight: '500', lineHeight: 1.5,
            }}>
              Secured admin portal. Unauthorized access is strictly prohibited.
            </p>
          </div>

          {/* Demo credentials */}
          <div style={{
            padding: '12px 16px',
            background: 'rgba(255,107,53,0.04)',
            border: '1px solid rgba(255,107,53,0.10)',
            borderRadius: '12px',
            display: 'flex', alignItems: 'center', gap: '10px',
          }}>
            <span style={{ fontSize: '0.9rem', flexShrink: 0 }}>💡</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <span style={{
                fontSize: '0.65rem', color: '#FF6B35',
                fontWeight: '800', textTransform: 'uppercase',
                letterSpacing: '0.5px', display: 'block', marginBottom: '2px',
              }}>
                Demo Admin
              </span>
              <span style={{
                fontSize: '0.72rem',
                color: 'rgba(255,255,255,0.28)',
                fontWeight: '500',
              }}>
                admin@firstcry.com / admin123
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                setForm({ email: 'admin@firstcry.com', password: 'admin123' });
                toast.success('Credentials filled! 🎉');
              }}
              style={{
                padding: '5px 14px',
                background: 'rgba(255,107,53,0.12)',
                border: '1px solid rgba(255,107,53,0.20)',
                borderRadius: '8px', color: '#FF6B35',
                fontSize: '0.70rem', fontWeight: '800',
                cursor: 'pointer', fontFamily: 'inherit',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap', flexShrink: 0,
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,107,53,0.22)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,107,53,0.12)'}
            >
              Fill
            </button>
          </div>

        </div>

        {/* Footer copyright */}
        <p style={{
          textAlign: 'center', marginTop: '20px',
          fontSize: '0.72rem',
          color: 'rgba(255,255,255,0.15)',
          fontWeight: '500',
        }}>
          © 2024 BabyBliss Admin Portal. All rights reserved.
        </p>
      </div>
    </div>
  );
}
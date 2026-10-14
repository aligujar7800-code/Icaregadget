import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // OTP Verification state
  const [showOtp, setShowOtp] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpEmail, setOtpEmail] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const { login, register, loginWithGoogle, verifyAdminOtp, resendAdminOtp } = useStore();
  const navigate = useNavigate();

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (isLogin) {
        const result = await login(email, password);
        if (result?.requireOtp) {
          setShowOtp(true);
          setOtpEmail(result.email || email);
          setSuccessMsg(result.message || 'Verification code sent to your email.');
          setCountdown(60);
          setLoading(false);
          return;
        }

        if (result?.role === 'admin') {
          navigate('/admin');
          return;
        }

        if (result?.role === 'customer') {
          navigate('/');
          return;
        }

        if (result?.error) {
          setErrorMsg(result.error);
        }
      } else {
        await register(name, email, password);
        navigate('/');
      }
    } catch (err) {
      setErrorMsg('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!otp || otp.trim().length !== 6) {
      setErrorMsg('Please enter the complete 6-digit verification code.');
      return;
    }

    setLoading(true);
    try {
      const res = await verifyAdminOtp(otpEmail, otp.trim());
      if (res?.success) {
        navigate('/admin');
      } else {
        setErrorMsg(res?.error || 'Invalid or expired code. Please try again.');
      }
    } catch (err) {
      setErrorMsg('Network error verifying code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0) return;
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const res = await resendAdminOtp(otpEmail, 'ADMIN_LOGIN');
      if (res?.success) {
        setSuccessMsg('A new verification code was sent to your email.');
        setCountdown(60);
      } else {
        setErrorMsg(res?.error || 'Failed to resend code.');
      }
    } catch (err) {
      setErrorMsg('Failed to resend code.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    loginWithGoogle();
    navigate('/');
  };

  return (
    <main style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-8) var(--space-4)' }}>
      <div style={{ width: '100%', maxWidth: '420px', backgroundColor: 'var(--off-white)', padding: 'var(--space-6)', borderRadius: 'var(--radius-lg)', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        
        {/* ================= OTP VERIFICATION VIEW ================= */}
        {showOtp ? (
          <div>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
            </div>
            
            <h1 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '8px', textAlign: 'center', color: '#111827' }}>
              Admin Verification
            </h1>
            <p style={{ color: 'var(--muted)', textAlign: 'center', fontSize: '0.875rem', marginBottom: '20px', lineHeight: '1.5' }}>
              Enter the 6-digit security code sent to: <br/>
              <strong style={{ color: '#111827' }}>{otpEmail}</strong>
            </p>

            {errorMsg && (
              <div style={{ backgroundColor: '#fee2e2', color: '#b91c1c', padding: '10px 14px', borderRadius: '6px', fontSize: '0.875rem', marginBottom: '16px' }}>
                {errorMsg}
              </div>
            )}

            {successMsg && (
              <div style={{ backgroundColor: '#dcfce7', color: '#15803d', padding: '10px 14px', borderRadius: '6px', fontSize: '0.875rem', marginBottom: '16px' }}>
                {successMsg}
              </div>
            )}

            <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label htmlFor="otp" style={{ display: 'block', fontWeight: '600', fontSize: '0.875rem', marginBottom: '8px', textAlign: 'center' }}>
                  6-Digit Verification Code
                </label>
                <input 
                  type="text" 
                  id="otp" 
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                  style={{ 
                    width: '100%', 
                    padding: '12px', 
                    borderRadius: '8px', 
                    border: '2px solid var(--orange)', 
                    textAlign: 'center', 
                    fontSize: '1.75rem', 
                    fontWeight: '800', 
                    letterSpacing: '8px', 
                    fontFamily: 'monospace',
                    boxSizing: 'border-box'
                  }}
                  placeholder="------"
                  autoFocus
                  required
                />
              </div>

              <button 
                type="submit" 
                className="btn btn--primary" 
                disabled={loading}
                style={{ width: '100%', padding: '12px', fontSize: '1rem', fontWeight: '700' }}
              >
                {loading ? 'Verifying...' : 'Verify & Access Dashboard'}
              </button>
            </form>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', fontSize: '0.875rem' }}>
              <button
                type="button"
                onClick={() => { setShowOtp(false); setOtp(''); setErrorMsg(''); setSuccessMsg(''); }}
                style={{ border: 'none', background: 'none', color: '#6b7280', cursor: 'pointer', textDecoration: 'underline' }}
              >
                &larr; Back to Login
              </button>

              <button
                type="button"
                onClick={handleResendOtp}
                disabled={countdown > 0 || loading}
                style={{ 
                  border: 'none', 
                  background: 'none', 
                  color: countdown > 0 ? '#9ca3af' : 'var(--orange)', 
                  fontWeight: '600', 
                  cursor: countdown > 0 ? 'default' : 'pointer' 
                }}
              >
                {countdown > 0 ? `Resend code in ${countdown}s` : 'Resend code'}
              </button>
            </div>
          </div>
        ) : (
          /* ================= STANDARD LOGIN VIEW ================= */
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '800', marginBottom: 'var(--space-2)', textAlign: 'center' }}>
              {isLogin ? 'Welcome back' : 'Create an account'}
            </h1>
            <p style={{ color: 'var(--muted)', textAlign: 'center', marginBottom: 'var(--space-6)' }}>
              {isLogin ? 'Log in to your account' : 'Sign up for a new customer account'}
            </p>

            {errorMsg && (
              <div style={{ backgroundColor: '#fee2e2', color: '#b91c1c', padding: '10px 14px', borderRadius: '6px', fontSize: '0.875rem', marginBottom: '16px' }}>
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              {!isLogin && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label htmlFor="name" style={{ fontWeight: '600', fontSize: '0.875rem' }}>Full Name</label>
                  <input 
                    type="text" 
                    id="name" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={{ padding: '0.875rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--light-gray)', fontFamily: 'inherit' }}
                    placeholder="John Doe"
                    required
                  />
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label htmlFor="email" style={{ fontWeight: '600', fontSize: '0.875rem' }}>Email Address</label>
                <input 
                  type="text" 
                  id="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ padding: '0.875rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--light-gray)', fontFamily: 'inherit' }}
                  placeholder="admin@icaregadget.store"
                  required
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label htmlFor="password" style={{ fontWeight: '600', fontSize: '0.875rem' }}>Password</label>
                <input 
                  type="password" 
                  id="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ padding: '0.875rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--light-gray)', fontFamily: 'inherit' }}
                  placeholder="Enter your password"
                  required
                />
              </div>

              <button 
                type="submit" 
                className="btn btn--primary" 
                disabled={loading}
                style={{ marginTop: 'var(--space-2)', width: '100%' }}
              >
                {loading ? 'Please wait...' : (isLogin ? 'Log in' : 'Create Account')}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: 'var(--space-4)' }}>
              <button 
                type="button" 
                onClick={() => { setIsLogin(!isLogin); setErrorMsg(''); }} 
                style={{ border: 'none', background: 'none', color: 'var(--text)', fontWeight: '600', cursor: 'pointer', fontSize: '0.875rem', textDecoration: 'underline' }}
              >
                {isLogin ? "Don't have an account? Sign up" : "Already have an account? Log in"}
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', margin: 'var(--space-5) 0', color: 'var(--muted)' }}>
              <div style={{ flex: 1, height: '1px', backgroundColor: '#ddd' }}></div>
              <span style={{ padding: '0 12px', fontSize: '0.875rem' }}>OR</span>
              <div style={{ flex: 1, height: '1px', backgroundColor: '#ddd' }}></div>
            </div>

            <button 
              onClick={handleGoogleLogin}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '0.875rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid #ddd',
                backgroundColor: 'var(--white)',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'background-color 0.2s ease'
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>
          </div>
        )}

      </div>
    </main>
  );
}

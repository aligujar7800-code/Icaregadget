import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useStore } from '../context/StoreContext';

export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const [isLogin, setIsLogin] = useState(() => searchParams.get('tab') !== 'signup');
  
  // Registration & Login Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // OTP Verification state for Admin
  const [showOtp, setShowOtp] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpEmail, setOtpEmail] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const { user, logout, login, register, loginWithGoogle, verifyAdminOtp, resendAdminOtp } = useStore();
  const navigate = useNavigate();

  // If query param changes, update active tab
  useEffect(() => {
    if (searchParams.get('tab') === 'signup') {
      setIsLogin(false);
    }
  }, [searchParams]);

  // Countdown timer for resend OTP
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

    if (!isLogin) {
      // Validate registration
      if (!name.trim()) {
        setErrorMsg('Please enter your full name.');
        return;
      }
      if (!email.trim()) {
        setErrorMsg('Please enter a valid email address.');
        return;
      }
      if (password.length < 6) {
        setErrorMsg('Password must be at least 6 characters long.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg('Passwords do not match. Please verify both fields.');
        return;
      }
    }

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

        if (result?.error) {
          setErrorMsg(result.error);
          setLoading(false);
          return;
        }

        if (result?.role === 'admin') {
          navigate('/admin');
          return;
        }

        // Customer login -> Navigate to Customer Dashboard
        navigate('/account');
      } else {
        // Customer Registration
        const res = await register(name, email, password, phone, address, city);
        if (res?.error) {
          setErrorMsg(res.error);
          setLoading(false);
          return;
        }
        
        // Successfully created account -> Navigate to Customer Dashboard
        navigate('/account');
      }
    } catch (err) {
      setErrorMsg('Something went wrong. Please check your connection and try again.');
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

  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '832383192913-k0t8t3j2m1hjgmhpj5vbd50qcg0kpmtu.apps.googleusercontent.com';

  const handleGoogleCredentialResponse = async (response) => {
    if (!response?.credential) return;
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await loginWithGoogle({ credential: response.credential });
      if (res?.success) {
        navigate(res.role === 'admin' ? '/admin' : '/account');
      } else {
        setErrorMsg(res?.error || 'Failed to authenticate with Google.');
      }
    } catch (err) {
      setErrorMsg('Google login error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initGoogleGSI = () => {
      if (window.google?.accounts?.id) {
        try {
          window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleGoogleCredentialResponse,
            auto_select: false,
            cancel_on_tap_outside: true,
          });

          const container = document.getElementById('googleSignInBtnContainer');
          if (container) {
            container.innerHTML = '';
            window.google.accounts.id.renderButton(container, {
              theme: 'outline',
              size: 'large',
              type: 'standard',
              shape: 'rectangular',
              text: isLogin ? 'signin_with' : 'signup_with',
              width: 360,
              logo_alignment: 'left'
            });
          }
        } catch (e) {
          console.warn('Google GSI init warning:', e);
        }
      }
    };

    if (window.google?.accounts?.id) {
      initGoogleGSI();
    } else {
      const timer = setInterval(() => {
        if (window.google?.accounts?.id) {
          initGoogleGSI();
          clearInterval(timer);
        }
      }, 300);
      return () => clearInterval(timer);
    }
  }, [isLogin]);

  const handleGoogleLogin = () => {
    setErrorMsg('');
    setLoading(true);

    // 1. Try Google OAuth2 Token Client popup (works best for custom buttons)
    if (window.google?.accounts?.oauth2) {
      try {
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: 'email profile openid',
          callback: async (tokenResponse) => {
            if (tokenResponse.error) {
              setLoading(false);
              return;
            }
            try {
              const res = await loginWithGoogle({ access_token: tokenResponse.access_token });
              if (res?.success) {
                navigate(res.role === 'admin' ? '/admin' : '/account');
              } else {
                setErrorMsg(res?.error || 'Google login failed.');
              }
            } catch (err) {
              setErrorMsg('Error authenticating with Google.');
            } finally {
              setLoading(false);
            }
          }
        });
        client.requestAccessToken();
        return;
      } catch (err) {
        console.warn('OAuth2 client init failed, falling back to One Tap / prompt:', err);
      }
    }

    // 2. Fallback to GSI prompt
    if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          setLoading(false);
        }
      });
    } else {
      setLoading(false);
      setErrorMsg('Google Sign-In is initializing. Please try again in a few seconds.');
    }
  };

  return (
    <main style={{ minHeight: '82vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-8) var(--space-4)', backgroundColor: '#f9fafb' }}>
      <div style={{ 
        width: '100%', 
        maxWidth: isLogin ? '440px' : '520px', 
        backgroundColor: '#ffffff', 
        padding: '32px', 
        borderRadius: '16px', 
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)',
        border: '1px solid #e5e7eb',
        transition: 'max-width 0.3s ease'
      }}>
        
        {/* ================= OTP VERIFICATION VIEW (ADMIN 2FA) ================= */}
        {showOtp ? (
          <div>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
            </div>
            
            <h1 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '8px', textAlign: 'center', color: '#111827' }}>
              Admin Verification
            </h1>
            <p style={{ color: '#6b7280', textAlign: 'center', fontSize: '0.875rem', marginBottom: '20px', lineHeight: '1.5' }}>
              Enter the 6-digit security code sent to: <br/>
              <strong style={{ color: '#111827' }}>{otpEmail}</strong>
            </p>

            {errorMsg && (
              <div style={{ backgroundColor: '#fee2e2', color: '#b91c1c', padding: '10px 14px', borderRadius: '8px', fontSize: '0.875rem', marginBottom: '16px', border: '1px solid #fecaca' }}>
                {errorMsg}
              </div>
            )}

            {successMsg && (
              <div style={{ backgroundColor: '#dcfce7', color: '#15803d', padding: '10px 14px', borderRadius: '8px', fontSize: '0.875rem', marginBottom: '16px', border: '1px solid #bbf7d0' }}>
                {successMsg}
              </div>
            )}

            <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label htmlFor="otp" style={{ display: 'block', fontWeight: '600', fontSize: '0.875rem', marginBottom: '8px', textAlign: 'center', color: '#374151' }}>
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
                    boxSizing: 'border-box',
                    outline: 'none'
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
                style={{ width: '100%', padding: '12px', fontSize: '1rem', fontWeight: '700', borderRadius: '8px' }}
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
          /* ================= LOGIN & SIGNUP TAB VIEW ================= */
          <div>
            {/* If user is already logged in, show options to sign out or switch account */}
            {user && (
              <div style={{
                backgroundColor: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: '10px',
                padding: '14px',
                marginBottom: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <div style={{ fontSize: '0.875rem', color: '#1e40af' }}>
                  You are currently signed in as <strong>{user.name}</strong> ({user.email}).
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => { logout(); setIsLogin(false); setErrorMsg(''); }}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '6px',
                      border: 'none',
                      backgroundColor: '#ef4444',
                      color: 'white',
                      fontSize: '0.8rem',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    Sign Out to Create New Account
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate(user.role === 'admin' ? '/admin' : '/account')}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '6px',
                      border: '1px solid #93c5fd',
                      backgroundColor: '#ffffff',
                      color: '#1e40af',
                      fontSize: '0.8rem',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    Go to Dashboard &rarr;
                  </button>
                </div>
              </div>
            )}

            {/* Tab switch header */}
            <div style={{ display: 'flex', backgroundColor: '#f3f4f6', padding: '4px', borderRadius: '10px', marginBottom: '24px' }}>
              <button
                type="button"
                onClick={() => { setIsLogin(true); setErrorMsg(''); setSuccessMsg(''); }}
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: isLogin ? '#ffffff' : 'transparent',
                  color: isLogin ? '#111827' : '#6b7280',
                  fontWeight: '700',
                  fontSize: '0.925rem',
                  cursor: 'pointer',
                  boxShadow: isLogin ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setIsLogin(false); setErrorMsg(''); setSuccessMsg(''); }}
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: !isLogin ? '#ffffff' : 'transparent',
                  color: !isLogin ? '#111827' : '#6b7280',
                  fontWeight: '700',
                  fontSize: '0.925rem',
                  cursor: 'pointer',
                  boxShadow: !isLogin ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                Create Account
              </button>
            </div>

            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <h1 style={{ fontSize: '1.6rem', fontWeight: '800', color: '#111827', margin: '0 0 6px 0' }}>
                {isLogin ? 'Welcome Back!' : 'Create Customer Account'}
              </h1>
              <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: 0 }}>
                {isLogin 
                  ? 'Access your customer dashboard, orders and profile' 
                  : 'Sign up to track orders, manage addresses and get exclusive deals'}
              </p>
            </div>

            {errorMsg && (
              <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '10px 14px', borderRadius: '8px', fontSize: '0.875rem', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', padding: '10px 14px', borderRadius: '8px', fontSize: '0.875rem', marginBottom: '18px' }}>
                {successMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              {/* Full Name (Sign Up only) */}
              {!isLogin && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label htmlFor="name" style={{ fontWeight: '600', fontSize: '0.85rem', color: '#374151' }}>
                    Full Name <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input 
                    type="text" 
                    id="name" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={{ padding: '11px 14px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.95rem', outline: 'none' }}
                    placeholder="e.g. Muhammad Ali"
                    required
                  />
                </div>
              )}

              {/* Email Address */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label htmlFor="email" style={{ fontWeight: '600', fontSize: '0.85rem', color: '#374151' }}>
                  Email Address <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input 
                  type="email" 
                  id="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ padding: '11px 14px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.95rem', outline: 'none' }}
                  placeholder="name@example.com"
                  required
                />
              </div>

              {/* Phone & City (Sign Up only) */}
              {!isLogin && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label htmlFor="phone" style={{ fontWeight: '600', fontSize: '0.85rem', color: '#374151' }}>Phone Number</label>
                    <input 
                      type="tel" 
                      id="phone" 
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      style={{ padding: '11px 14px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.95rem', outline: 'none' }}
                      placeholder="+92 300 1234567"
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label htmlFor="city" style={{ fontWeight: '600', fontSize: '0.85rem', color: '#374151' }}>City</label>
                    <input 
                      type="text" 
                      id="city" 
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      style={{ padding: '11px 14px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.95rem', outline: 'none' }}
                      placeholder="e.g. Faisalabad"
                    />
                  </div>
                </div>
              )}

              {/* Shipping Address (Sign Up only) */}
              {!isLogin && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label htmlFor="address" style={{ fontWeight: '600', fontSize: '0.85rem', color: '#374151' }}>Shipping Address (Optional)</label>
                  <input 
                    type="text" 
                    id="address" 
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    style={{ padding: '11px 14px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.95rem', outline: 'none' }}
                    placeholder="House/Street, Area"
                  />
                </div>
              )}

              {/* Password */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label htmlFor="password" style={{ fontWeight: '600', fontSize: '0.85rem', color: '#374151' }}>
                    Password <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ background: 'none', border: 'none', color: 'var(--orange)', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer', padding: 0 }}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  id="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ padding: '11px 14px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.95rem', outline: 'none' }}
                  placeholder="At least 6 characters"
                  required
                />
              </div>

              {/* Confirm Password (Sign Up only) */}
              {!isLogin && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label htmlFor="confirmPassword" style={{ fontWeight: '600', fontSize: '0.85rem', color: '#374151' }}>
                    Confirm Password <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    id="confirmPassword" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    style={{ padding: '11px 14px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.95rem', outline: 'none' }}
                    placeholder="Repeat password"
                    required
                  />
                </div>
              )}

              <button 
                type="submit" 
                className="btn btn--primary" 
                disabled={loading}
                style={{ 
                  marginTop: '8px', 
                  width: '100%', 
                  padding: '13px', 
                  fontSize: '1rem', 
                  fontWeight: '700',
                  borderRadius: '8px'
                }}
              >
                {loading ? 'Please wait...' : (isLogin ? 'Sign In to Account' : 'Create My Account')}
              </button>
            </form>

            <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0', color: '#9ca3af' }}>
              <div style={{ flex: 1, height: '1px', backgroundColor: '#e5e7eb' }}></div>
              <span style={{ padding: '0 12px', fontSize: '0.8rem', fontWeight: '600', textTransform: 'uppercase' }}>or</span>
              <div style={{ flex: 1, height: '1px', backgroundColor: '#e5e7eb' }}></div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
              <div id="googleSignInBtnContainer" style={{ width: '100%', display: 'flex', justifyContent: 'center' }}></div>

              <button 
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  padding: '11px 16px',
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                  backgroundColor: '#ffffff',
                  color: '#374151',
                  fontWeight: '600',
                  fontSize: '0.925rem',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'background-color 0.2s ease',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
                }}
                onMouseEnter={(e) => { if (!loading) e.currentTarget.style.backgroundColor = '#f9fafb'; }}
                onMouseLeave={(e) => { if (!loading) e.currentTarget.style.backgroundColor = '#ffffff'; }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span>{loading ? 'Connecting Google...' : (isLogin ? 'Continue with Google' : 'Sign up with Google')}</span>
              </button>
            </div>

            <div style={{ textAlign: 'center', marginTop: '22px' }}>
              <button 
                type="button" 
                onClick={() => { setIsLogin(!isLogin); setErrorMsg(''); setSuccessMsg(''); }} 
                style={{ border: 'none', background: 'none', color: '#4b5563', fontWeight: '500', cursor: 'pointer', fontSize: '0.875rem' }}
              >
                {isLogin ? (
                  <span>Don't have an account yet? <strong style={{ color: 'var(--orange)', textDecoration: 'underline' }}>Sign up free</strong></span>
                ) : (
                  <span>Already have an account? <strong style={{ color: 'var(--orange)', textDecoration: 'underline' }}>Sign in here</strong></span>
                )}
              </button>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}

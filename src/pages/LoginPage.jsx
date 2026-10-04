import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, register, loginWithGoogle } = useStore();
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isLogin) {
      const role = login(email, password);
      if (role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } else {
      register(name, email, password);
      navigate('/');
    }
  };

  const handleGoogleLogin = () => {
    loginWithGoogle();
    navigate('/');
  };

  return (
    <main style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-8) var(--space-4)' }}>
      <div style={{ width: '100%', maxWidth: '400px', backgroundColor: 'var(--off-white)', padding: 'var(--space-6)', borderRadius: 'var(--radius-lg)' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: '800', marginBottom: 'var(--space-2)', textAlign: 'center' }}>
          {isLogin ? 'Welcome back' : 'Create an account'}
        </h1>
        <p style={{ color: 'var(--muted)', textAlign: 'center', marginBottom: 'var(--space-6)' }}>
          {isLogin ? 'Log in to your account' : 'Sign up for a new customer account'}
        </p>
        
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
            <label htmlFor="email" style={{ fontWeight: '600', fontSize: '0.875rem' }}>Email</label>
            <input 
              type="text" 
              id="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ padding: '0.875rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--light-gray)', fontFamily: 'inherit' }}
              placeholder={isLogin ? "your@email.com" : "your@email.com"}
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
              placeholder={isLogin ? "Enter your password" : "Create a password"}
              required
            />
          </div>

          <button type="submit" className="btn btn--primary" style={{ marginTop: 'var(--space-2)', width: '100%' }}>
            {isLogin ? 'Log in' : 'Create Account'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 'var(--space-4)' }}>
          <button 
            type="button" 
            onClick={() => setIsLogin(!isLogin)} 
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
    </main>
  );
}

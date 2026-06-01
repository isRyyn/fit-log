import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';
import '../styles/LoginPage.css';

export default function LoginPage() {
  const { login, loginAnonymously, loginWithEmail, registerWithEmail, loading } = useAuth();

  const [mode, setMode] = useState('options'); // 'options' | 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleGoogle = async () => {
    try { await login(); }
    catch (e) { setError(e.message); }
  };

  const handleAnonymous = async () => {
    try { await loginAnonymously(); }
    catch (e) { setError(e.message); }
  };

  const handleEmailSubmit = async () => {
    if (!email || !password) { setError('Enter email and password.'); return; }
    setError('');
    setSubmitting(true);
    try {
      if (mode === 'login') await loginWithEmail(email, password);
      else await registerWithEmail(email, password);
    } catch (e) {
      const msgs = {
        'auth/user-not-found': 'No account found with this email.',
        'auth/wrong-password': 'Incorrect password.',
        'auth/email-already-in-use': 'Email already in use. Try signing in.',
        'auth/weak-password': 'Password should be at least 6 characters.',
        'auth/invalid-email': 'Invalid email address.',
      };
      setError(msgs[e.code] || e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const back = () => { setMode('options'); setError(''); setEmail(''); setPassword(''); };

  return (
    <div className="login-page">
			<img src="/background.png" alt="Background" className="login-background" />
      <div className="login-container">
        <div className="login-header">
          <img src="/logo.png" alt="Fit Log" className="login-logo" />
          <p className="login-subtitle">Track your fitness journey</p>
        </div>

        {mode === 'options' && (
          <div className="login-options">
            <button className="gsi-material-button" onClick={handleGoogle} disabled={loading}>
							<div className="gsi-material-button-state"></div>
							<div className="gsi-material-button-content-wrapper">
									<div className="gsi-material-button-icon">
									<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
											<path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
											<path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
											<path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
											<path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
											<path fill="none" d="M0 0h48v48H0z"></path>
									</svg>
									</div>
									<span className="gsi-material-button-contents">{loading ? 'Signing in...' : 'Continue with Google'}</span>
							</div>
							</button>
            { false && <div>
								<button onClick={() => { setMode('login'); setError(''); }} className="login-btn login-btn--email">
									✉️ Continue with Email
								</button>

								<div className="login-divider"><span>or</span></div>
							</div>
						}

            <button onClick={handleAnonymous} disabled={loading} className="login-btn login-btn--anon">
              👤 Continue as Guest
            </button>
          </div>
        )}

        {(mode === 'login' || mode === 'register') && (
          <div className="login-email-form">
            <div className="login-email-tabs">
              <button className={`login-tab ${mode === 'login' ? 'login-tab--active' : ''}`} onClick={() => { setMode('login'); setError(''); }}>Sign In</button>
              <button className={`login-tab ${mode === 'register' ? 'login-tab--active' : ''}`} onClick={() => { setMode('register'); setError(''); }}>Register</button>
            </div>

            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="login-input"
              autoComplete="email"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="login-input"
              autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
              onKeyDown={e => e.key === 'Enter' && handleEmailSubmit()}
            />

            {error && <p className="login-error">{error}</p>}

            <button onClick={handleEmailSubmit} disabled={submitting} className="login-btn login-btn--primary">
              {submitting ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>

            <button onClick={back} className="login-back">← Back</button>
          </div>
        )}

        {mode === 'options' && error && <p className="login-error">{error}</p>}
      </div>
    </div>
  );
}

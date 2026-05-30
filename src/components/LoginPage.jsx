import React from 'react';
import { useAuth } from '../hooks/useAuth.jsx';
import '../styles/LoginPage.css';

export default function LoginPage() {
  const { login, loading } = useAuth();

  const handleGoogleLogin = async () => {
    try {
      await login();
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
      <div className="login-header">
        <img src="/logo.png" alt="Fit Log" className="login-logo" />
        <p className="login-subtitle">Track your fitness journey</p>
      </div>        <button 
          onClick={handleGoogleLogin} 
          disabled={loading}
          className="login-btn"
        >
          {loading ? 'Signing in...' : '🔐 Sign in with Google'}
        </button>
      </div>
    </div>
  );
}

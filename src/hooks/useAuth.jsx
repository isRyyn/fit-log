import { createContext, useContext, useState, useEffect } from 'react';
import { onUserChanged, signInWithGoogle, signOutUser, signInAnon, signUpWithEmail, signInWithEmail } from '../lib/firebase.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onUserChanged((currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const loginAnonymously = async () => {
    try {
      await signInAnon();
    } catch (error) {
      console.error('Anonymous login error:', error);
      throw error;
    }
  };

  const registerWithEmail = async (email, password) => {
    try {
      await signUpWithEmail(email, password);
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const loginWithEmail = async (email, password) => {
    try {
      await signInWithEmail(email, password);
    } catch (error) {
      console.error('Email login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOutUser();
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    login,
    loginAnonymously,
    loginWithEmail,
    registerWithEmail,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

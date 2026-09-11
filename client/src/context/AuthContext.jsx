import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('gas_adviser_token'));
  const [loading, setLoading] = useState(true);

  const isAuthenticated = !!user && !!token;

  // ── Set / clear axios default header ──────────────────────────────────────
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem('gas_adviser_token', token);
    } else {
      delete axios.defaults.headers.common['Authorization'];
      localStorage.removeItem('gas_adviser_token');
    }
  }, [token]);

  // ── Restore session on mount ──────────────────────────────────────────────
  useEffect(() => {
    const restoreSession = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await axios.get('/api/auth/me');
        setUser(res.data);
      } catch (err) {
        console.warn('[AuthContext] Session restore failed:', err?.response?.data?.error || err.message);
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    restoreSession();
  }, []);

  // ── Login ─────────────────────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    const res = await axios.post('/api/auth/login', { email, password });
    setToken(res.data.token);
    setUser(res.data.user);
    return res.data;
  }, []);

  // ── Register ──────────────────────────────────────────────────────────────
  const register = useCallback(async (fullName, email, password) => {
    const res = await axios.post('/api/auth/register', { fullName, email, password });
    setToken(res.data.token);
    setUser(res.data.user);
    return res.data;
  }, []);

  // ── Logout ────────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  // ── Update User ──────────────────────────────────────────────────────────
  const updateUser = useCallback((updatedUserData) => {
    setUser((prev) => (prev ? { ...prev, ...updatedUserData } : updatedUserData));
  }, []);

  const value = {
    user,
    token,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthContext;

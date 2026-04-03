import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../lib/api';

const AuthContext = createContext(null);

export const formatApiErrorDetail = (detail) => {
  if (detail == null) return "Something went wrong. Please try again.";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail))
    return detail.map((e) => (e && typeof e.msg === "string" ? e.msg : JSON.stringify(e))).filter(Boolean).join(" ");
  if (detail && typeof detail.msg === "string") return detail.msg;
  return String(detail);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const refreshAccessToken = async () => {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) throw new Error('No refresh token');
      const { data } = await api.post('/auth/refresh', {}, {
        headers: {
          Authorization: `Bearer ${refreshToken}`
        }
      });
      localStorage.setItem('access_token', data.access_token);
      return data.access_token;
    } catch (error) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      throw error;
    }
  };

  const checkAuth = async () => {
    try {
      const { data } = await api.get('/auth/me');
      setUser(data);
    } catch (error) {
      console.error('[AUTH] checkAuth failed:', {
        status: error.response?.status,
        detail: error.response?.data?.detail,
        message: error.message,
        url: '/auth/me'
      });
      if (error.response?.status === 401 && localStorage.getItem('refresh_token')) {
        try {
          await refreshAccessToken();
          // Retry /auth/me
          const { data } = await api.get('/auth/me');
          setUser(data);
        } catch (refreshError) {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  };



  const login = async (email, password) => {
    try {
      const { data } = await api.post('/auth/login', { email, password });
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      setUser(data);
      // Trigger cart update
      window.dispatchEvent(new Event('cart-update'));
      return { success: true, user: data };
    } catch (error) {
      return { success: false, error: formatApiErrorDetail(error.response?.data?.detail) || error.message };
    }
  };


  const register = async (email, password, name) => {
    try {
      const { data } = await api.post('/auth/register', { email, password, name });
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      setUser(data);
      // Trigger cart update
      window.dispatchEvent(new Event('cart-update'));
      return { success: true, user: data };
    } catch (error) {
      return { success: false, error: formatApiErrorDetail(error.response?.data?.detail) || error.message };
    }
  };


  const logout = async () => {
    try {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
    }
  };


  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

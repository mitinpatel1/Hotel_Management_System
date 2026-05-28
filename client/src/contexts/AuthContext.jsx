import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../utils/api.js';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const verifyToken = async () => {
      const token = localStorage.getItem('hms_token');
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const userData = await api('/auth/me');
        setUser(userData);
      } catch (err) {
        console.error('Session restore failed:', err);
        localStorage.removeItem('hms_token');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, []);

  const login = async (username, password) => {
    setError(null);
    try {
      const data = await api('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password })
      });
      
      localStorage.setItem('hms_token', data.token);
      setUser(data.user);
      return data.user;
    } catch (err) {
      setError(err.message || 'Login failed. Please check credentials.');
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('hms_token');
    setUser(null);
  };

  const isAdmin = user?.role === 'admin';
  const isReceptionist = user?.role === 'receptionist';
  const isHousekeeper = user?.role === 'housekeeper';

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    isAdmin,
    isReceptionist,
    isHousekeeper
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);

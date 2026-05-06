import { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';
import { normalizeDisplayNames } from '../utils/displayNames';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  // On mount: restore session from localStorage
  useEffect(() => {
    const token = localStorage.getItem('wp_token');
    const stored = localStorage.getItem('wp_user');
    if (token && stored) {
      const normalizedUser = normalizeDisplayNames(JSON.parse(stored));
      localStorage.setItem('wp_user', JSON.stringify(normalizedUser));
      setUser(normalizedUser);
    }
    setLoading(false);
  }, []);

  const login = async (email, password, role) => {
    const { data } = await api.post('/auth/login', { email, password, role });
    localStorage.setItem('wp_token', data.token);
    localStorage.setItem('wp_user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  const register = async (formData) => {
    const { data } = await api.post('/auth/register', formData);
    localStorage.setItem('wp_token', data.token);
    localStorage.setItem('wp_user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('wp_token');
    localStorage.removeItem('wp_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getMeApi, loginApi, registerApi } from '../api/auth.api.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('packflow_token');
    if (!token) {
      setLoading(false);
      return;
    }
    getMeApi()
      .then(({ data }) => setUser(data.user))
      .catch(() => localStorage.removeItem('packflow_token'))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const { data } = await loginApi({ email, password });
    localStorage.setItem('packflow_token', data.token);
    setUser(data.user);
    return data;
  }, []);

  const register = useCallback(async (payload) => {
    const { data } = await registerApi(payload);
    localStorage.setItem('packflow_token', data.token);
    setUser(data.user);
    return data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('packflow_token');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};

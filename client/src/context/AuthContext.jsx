import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { clearChats } from '../components/assistant/chatStorage.js';
import { getMeApi, loginApi, registerApi } from '../api/auth.api.js';
import i18next from 'i18next';

const syncLang = (lang) => {
  const l = lang || 'mk';
  i18next.changeLanguage(l);
  localStorage.setItem('packflow_lang', l);
};

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    const token = localStorage.getItem('packflow_token');
    if (!token) {
      setLoading(false);
      return;
    }
    getMeApi()
      .then(({ data }) => {
        setUser(data.user);
        syncLang(data.user.language);
      })
      .catch(() => localStorage.removeItem('packflow_token'))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const { data } = await loginApi({ email, password });
    clearChats(); // a fresh login never inherits a previous session's assistant chat
    localStorage.setItem('packflow_token', data.token);
    setUser(data.user);
    syncLang(data.user.language);
    return data;
  }, []);

  const register = useCallback(async (payload) => {
    const { data } = await registerApi(payload);
    localStorage.setItem('packflow_token', data.token);
    setUser(data.user);
    syncLang(data.user.language);
    return data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('packflow_token');
    setUser(null);
    clearChats();
    // Drop cached data so the next user never sees the previous user's answers.
    queryClient.clear();
  }, [queryClient]);

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

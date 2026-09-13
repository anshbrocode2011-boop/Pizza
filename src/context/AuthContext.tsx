import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, UserRole } from '../types';
import { apiRequest } from '../lib/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, phone?: string) => Promise<void>;
  logout: () => Promise<void>;
  demoLogin: (role: UserRole) => Promise<void>;
  isAuthModalOpen: boolean;
  authModalMode: 'login' | 'register';
  openAuthModal: (mode?: 'login' | 'register') => void;
  closeAuthModal: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('pizzatown_token'));
  const [loading, setLoading] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');

  const refreshUser = useCallback(async () => {
    const savedToken = localStorage.getItem('pizzatown_token');
    if (!savedToken) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const res = await apiRequest<{ user: User }>('/api/auth/me');
      setUser(res.user);
    } catch {
      localStorage.removeItem('pizzatown_token');
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    const res = await apiRequest<{ token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    localStorage.setItem('pizzatown_token', res.token);
    setToken(res.token);
    setUser(res.user);
    setIsAuthModalOpen(false);
  };

  const register = async (name: string, email: string, password: string, phone?: string) => {
    const res = await apiRequest<{ token: string; user: User }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, phone }),
    });
    localStorage.setItem('pizzatown_token', res.token);
    setToken(res.token);
    setUser(res.user);
    setIsAuthModalOpen(false);
  };

  const demoLogin = async (role: UserRole) => {
    if (role === 'admin') {
      await login('admin@pizzatown.com', 'admin123');
    } else {
      await login('alex@example.com', 'password123');
    }
  };

  const logout = async () => {
    try {
      await apiRequest('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    }
    localStorage.removeItem('pizzatown_token');
    setToken(null);
    setUser(null);
  };

  const openAuthModal = (mode: 'login' | 'register' = 'login') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAdmin: user?.role === 'admin',
        login,
        register,
        logout,
        demoLogin,
        isAuthModalOpen,
        authModalMode,
        openAuthModal,
        closeAuthModal,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

// 預設的管理員帳號密碼 (生產環境建議使用環境變數)
const ADMIN_CREDENTIALS = {
  username: 'bitlog-admin',
  password: process.env.REACT_APP_ADMIN_PASSWORD || 'CHANGE_ME'
};

const AUTH_STORAGE_KEY = 'blogsys_auth';

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 檢查是否已登入
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        const { token, expiry } = JSON.parse(stored);
        if (token && expiry && new Date(expiry) > new Date()) {
          setIsAuthenticated(true);
        } else {
          localStorage.removeItem(AUTH_STORAGE_KEY);
        }
      }
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = (username, password) => {
    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
      // 設定 24 小時後過期
      const expiry = new Date();
      expiry.setHours(expiry.getHours() + 24);
      
      const authData = {
        token: btoa(`${username}:${Date.now()}`),
        expiry: expiry.toISOString()
      };
      
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData));
      setIsAuthenticated(true);
      return { success: true };
    }
    return { success: false, error: '帳號或密碼錯誤' };
  };

  const logout = () => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { login as apiLogin } from '../api/auth.service';
import type { LoginRequest } from '../types/api.types';

interface AuthContextValue {
  token: string | null;
  isAuthenticated: boolean;
  login: (data: LoginRequest) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('jwtToken'));

  const login = useCallback(async (data: LoginRequest) => {
    const res = await apiLogin(data);
    localStorage.setItem('jwtToken', res.token);
    setToken(res.token);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('jwtToken');
    setToken(null);
  }, []);

  return (
    <AuthContext.Provider value={{ token, isAuthenticated: !!token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

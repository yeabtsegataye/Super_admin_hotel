/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { AuthCredentials, SignupCredentials, SuperAdminUser } from '../types';
import { login as loginRequest, signup as signupRequest } from '../services/authService';

type AuthContextType = {
  user: SuperAdminUser | null;
  isAuthenticated: boolean;
  login: (payload: AuthCredentials) => Promise<SuperAdminUser>;
  signup: (payload: SignupCredentials) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SuperAdminUser | null>(() => {
    const stored = localStorage.getItem('super_admin_user');
    return stored ? JSON.parse(stored) : null;
  });

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return Boolean(localStorage.getItem('super_admin_token'));
  });

  const login = async (payload: AuthCredentials) => {
    const response = await loginRequest(payload);
    const { accessToken, payload: userPayload } = response.data;
    localStorage.setItem('super_admin_token', accessToken);
    localStorage.setItem('super_admin_user', JSON.stringify(userPayload));
    setUser(userPayload);
    setIsAuthenticated(true);
    return userPayload;
  };

  const signup = async (payload: SignupCredentials) => {
    await signupRequest(payload);
  };

  const logout = () => {
    localStorage.removeItem('super_admin_token');
    localStorage.removeItem('super_admin_user');
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

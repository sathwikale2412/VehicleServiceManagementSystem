import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { get, getStatus, send, setCsrfToken, type AuthResponse } from './api';
import type { AppStatus, User } from './types';

export type AuthContextValue = {
  user: User | null;
  status: AppStatus | null;
  loading: boolean;
  authError: string | null;
  signIn(email: string, password: string): Promise<void>;
  register(name: string, email: string, password: string): Promise<void>;
  signOut(): Promise<void>;
  refreshUser(): Promise<void>;
  refreshStatus(): Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AppStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const refreshStatus = useCallback(async () => {
    try {
      setStatus(await getStatus());
    } catch {
      setStatus(null);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const result = await get<{ user: User }>('/auth/me');
      setUser(result.user);
      setAuthError(null);
    } catch (error: any) {
      setUser(null);
      if (error?.status && error.status !== 401) setAuthError(error.message);
    }
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const appStatus = await getStatus();
        if (active) setStatus(appStatus);
      } catch {
        if (active) setAuthError('Could not connect to the application service.');
      }
      try {
        const result = await get<{ user: User }>('/auth/me');
        if (active) setUser(result.user);
      } catch (error: any) {
        if (active && error?.status && error.status !== 401) setAuthError(error.message);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    setAuthError(null);
    const result = await send<AuthResponse>('/auth/login', { email, password });
    setCsrfToken(result.csrfToken ?? null);
    setUser(result.user);
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    setAuthError(null);
    const result = await send<AuthResponse>('/auth/register', { name, email, password });
    setCsrfToken(result.csrfToken ?? null);
    setUser(result.user);
  }, []);

  const signOut = useCallback(async () => {
    try { await send('/auth/logout'); } finally {
      setCsrfToken(null);
      setUser(null);
    }
  }, []);

  const value = useMemo(() => ({ user, status, loading, authError, signIn, register, signOut, refreshUser, refreshStatus }), [
    user, status, loading, authError, signIn, register, signOut, refreshUser, refreshStatus,
  ]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

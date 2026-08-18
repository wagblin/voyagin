import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import * as authApi from '../lib/authApi';
import type { AuthUser, LoginInput, RegisterInput } from '../lib/authApi';
import { clearToken, getStoredUser, getToken, setStoredUser, setToken } from '../lib/authStorage';
import { onUnauthorized } from '../lib/apiClient';

export interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function restoreSession() {
      const [token, storedUser] = await Promise.all([getToken(), getStoredUser()]);
      if (token !== null && storedUser !== null) {
        setUser(storedUser);
      }
      setIsLoading(false);
    }
    void restoreSession();
  }, []);

  useEffect(() => {
    return onUnauthorized(() => {
      void clearToken();
      setUser(null);
    });
  }, []);

  const persistSession = useCallback(async (result: { token: string; user: AuthUser }) => {
    await Promise.all([setToken(result.token), setStoredUser(result.user)]);
    setUser(result.user);
  }, []);

  const login = useCallback(
    async (input: LoginInput) => {
      const result = await authApi.login(input);
      await persistSession(result);
    },
    [persistSession],
  );

  const register = useCallback(
    async (input: RegisterInput) => {
      const result = await authApi.register(input);
      await persistSession(result);
    },
    [persistSession],
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore network/logout errors — the local session is cleared regardless.
    } finally {
      await clearToken();
      setUser(null);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      isLoading,
      login,
      register,
      logout,
    }),
    [user, isLoading, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

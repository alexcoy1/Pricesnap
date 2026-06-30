import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { User } from '../types';
import * as authStore from '../services/authStore';
import { initUserStore } from '../services/localStore';

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (email: string, password: string, displayName: string, businessName?: string) => Promise<boolean>;
  logout: () => void;
  updateUser: (patch: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => authStore.getSession());

  const login = useCallback(async (email: string, password: string) => {
    const ok = authStore.login(email, password);
    if (ok) setUser(authStore.getSession());
    return ok;
  }, []);

  const signup = useCallback(
    async (email: string, password: string, displayName: string, businessName?: string) => {
      const ok = authStore.signup(email, password, displayName, businessName);
      if (ok) {
        const session = authStore.getSession();
        if (session) initUserStore(session.businessName);
        setUser(session);
      }
      return ok;
    },
    []
  );

  const logout = useCallback(() => {
    authStore.clearSession();
    setUser(null);
  }, []);

  const updateUser = useCallback((patch: Partial<User>) => {
    const updated = authStore.updateSession(patch);
    if (updated) setUser(updated);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      login,
      signup,
      logout,
      updateUser,
    }),
    [user, login, signup, logout, updateUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

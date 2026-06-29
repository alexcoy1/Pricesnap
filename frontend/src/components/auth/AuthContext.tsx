import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { User } from '../../types';

interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (email: string, password: string, displayName: string) => Promise<boolean>;
  logout: () => void;
  updateProfileInAuthContext: (data: Partial<User>) => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('pricesnap_user');
    return saved ? JSON.parse(saved) : null;
  });

  const login = useCallback(async (email: string, password: string) => {
    const users = JSON.parse(localStorage.getItem('pricesnap_users') || '[]');
    const userMatch = users.find((u: { email: string; password: string }) => u.email === email && u.password === password);

    if (userMatch) {
      const user: User = { id: userMatch.id, email: userMatch.email, displayName: userMatch.displayName };
      setCurrentUser(user);
      localStorage.setItem('pricesnap_user', JSON.stringify(user));
      return true;
    }
    return false;
  }, []);

  const signup = useCallback(async (email: string, password: string, displayName: string) => {
    const users = JSON.parse(localStorage.getItem('pricesnap_users') || '[]');
    if (users.some((u: { email: string }) => u.email === email)) return false;
    const newUser = { id: Date.now().toString(), email, password, displayName };
    users.push(newUser);
    localStorage.setItem('pricesnap_users', JSON.stringify(users));
    const user: User = { id: newUser.id, email, displayName };
    setCurrentUser(user);
    localStorage.setItem('pricesnap_user', JSON.stringify(user));
    return true;
  }, []);

  const logout = useCallback(() => {
    setCurrentUser(null);
    localStorage.removeItem('pricesnap_user');
  }, []);

  const updateProfileInAuthContext = useCallback((data: Partial<User>) => {
    setCurrentUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...data };
      localStorage.setItem('pricesnap_user', JSON.stringify(updated));
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: !!currentUser,
        login,
        signup,
        logout,
        updateProfileInAuthContext,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

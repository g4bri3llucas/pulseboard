import { useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { authService } from '../services/auth.service';
import { setUnauthorizedHandler } from '../services/api';
import { AuthContext } from './auth-context';
import type { User } from './auth-context';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });
  const [sessionExpired, setSessionExpired] = useState(false);

  async function login(email: string, password: string) {
    const { token, user } = await authService.login(email, password);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setSessionExpired(false);
    setUser(user);
  }

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      logout();
      setSessionExpired(true);
    });

    return () => setUnauthorizedHandler(null);
  }, [logout]);

  return (
    <AuthContext.Provider value={{ user, sessionExpired, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

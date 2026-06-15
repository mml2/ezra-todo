import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { User, LoginRequest } from '../types/auth';
import {
  login as loginService,
  getStoredUsername,
  clearAuthStorage,
} from '../services/auth';

export interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }): React.ReactElement {
  // Initialize user from stored username (allows session persistence on page refresh)
  const storedUsername = getStoredUsername();
  const [user, setUser] = useState<User | null>(
    storedUsername ? { username: storedUsername } : null
  );

  const login = useCallback(async (credentials: LoginRequest): Promise<void> => {
    const authResponse = await loginService(credentials);
    setUser({ username: authResponse.username });
  }, []);

  const logout = useCallback((): void => {
    clearAuthStorage();
    setUser(null);
  }, []);

  const isAuthenticated = user !== null;

  const value: AuthContextValue = {
    user,
    isAuthenticated,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to access auth context
 * @throws Error if used outside AuthProvider
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

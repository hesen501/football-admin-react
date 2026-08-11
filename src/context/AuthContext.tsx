import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { LoginRequest } from '../types/auth';
import { User } from '../types/user';
import { loginAdminApi, logoutAdminApi, fetchCurrentAdminApi } from '../api/auth';
import { getStoredToken, setStoredToken, removeStoredToken } from '../utils/storage';

export interface AuthContextType {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
  updateUser: (user: User) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const clearSession = useCallback(() => {
    removeStoredToken();
    setToken(null);
    setUser(null);
  }, []);

  // Sanctum tokens are opaque bearer strings, not JWTs — there's nothing to
  // decode locally, so a stored token is only trusted once GET /me confirms
  // it's still valid and returns the current admin/manager profile.
  useEffect(() => {
    const existingToken = getStoredToken();
    if (!existingToken) {
      setIsLoading(false);
      return;
    }

    setToken(existingToken);
    fetchCurrentAdminApi()
      .then(setUser)
      .catch(() => clearSession())
      .finally(() => setIsLoading(false));
  }, [clearSession]);

  const handleLogin = async (credentials: LoginRequest) => {
    const { token: newToken, user: newUser } = await loginAdminApi(credentials);
    setStoredToken(newToken);
    setToken(newToken);
    setUser(newUser);
  };

  const handleLogout = () => {
    logoutAdminApi().catch(() => {
      // Token may already be invalid/expired server-side — clear local
      // session regardless so the user isn't stuck unable to log out.
    });
    clearSession();
  };

  const isAuthenticated = Boolean(token && user);

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isAuthenticated,
        isLoading,
        login: handleLogin,
        logout: handleLogout,
        updateUser: setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

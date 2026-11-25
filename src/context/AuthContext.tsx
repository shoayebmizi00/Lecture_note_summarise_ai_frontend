import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { authService } from "../services/rest";
import { apiError } from "../services/api";
import type { User, UserSettings } from "../types";
import { useTheme } from "./ThemeContext";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<User>;
  register: (username: string, email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  updateSettings: (patch: Partial<UserSettings>) => Promise<void>;
  deleteAccount: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { setTheme } = useTheme();

  const refresh = useCallback(async () => {
    try {
      const next = await authService.me();
      setUser(next);
      if (next.settings?.theme) setTheme(next.settings.theme);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [setTheme]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const handler = () => setUser(null);
    window.addEventListener("lnai:unauthorized", handler);
    return () => window.removeEventListener("lnai:unauthorized", handler);
  }, []);

  const login = useCallback(
    async (identifier: string, password: string) => {
      const next = await authService.login({ identifier, password });
      setUser(next);
      if (next.settings?.theme) setTheme(next.settings.theme);
      return next;
    },
    [setTheme],
  );

  const register = useCallback(
    async (username: string, email: string, password: string) => {
      const next = await authService.register({ username, email, password });
      setUser(next);
      if (next.settings?.theme) setTheme(next.settings.theme);
      return next;
    },
    [setTheme],
  );

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch (error) {
      // Still clear the local session even if the request failed.
      console.warn(apiError(error));
    }
    setUser(null);
  }, []);

  const updateSettings = useCallback(async (patch: Partial<UserSettings>) => {
    const next = await authService.updateSettings(patch);
    setUser(next);
    if (next.settings?.theme) setTheme(next.settings.theme);
  }, [setTheme]);

  const deleteAccount = useCallback(async () => {
    await authService.deleteAccount();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, register, logout, updateSettings, deleteAccount, refresh }),
    [user, loading, login, register, logout, updateSettings, deleteAccount, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}

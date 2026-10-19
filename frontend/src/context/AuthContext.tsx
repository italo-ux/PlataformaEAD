import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { User } from "../data/userMock";
import { AUTH_CHANGED_EVENT } from "../services/api";
import {
  clearAuthenticatedUser,
  getAuthenticatedUser,
  refreshAuthenticatedUser,
} from "../services/userService";
import { AuthContext, type AuthContextValue } from "./auth-context";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(() => Boolean(localStorage.getItem("token")));

  const refresh = useCallback(async () => {
    if (!localStorage.getItem("token")) {
      setUser(null);
      setLoading(false);
      return null;
    }
    try {
      const current = await refreshAuthenticatedUser();
      setUser(current);
      return current;
    } catch {
      clearAuthenticatedUser();
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    clearAuthenticatedUser();
    setUser(null);
  }, []);

  useEffect(() => {
    void refresh();
    const sync = (event: Event) => {
      const current =
        event instanceof CustomEvent && event.detail
          ? (event.detail as User)
          : getAuthenticatedUser();
      setUser(current);
    };
    window.addEventListener(AUTH_CHANGED_EVENT, sync);
    return () => window.removeEventListener(AUTH_CHANGED_EVENT, sync);
  }, [refresh]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      refresh,
      logout,
    }),
    [loading, logout, refresh, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

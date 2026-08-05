import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { getMe, login as apiLogin, logout as apiLogout, refreshCsrf, register as apiRegister } from "../api";
import type { User } from "../types";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (payload: { name: string; email: string; password: string; confirm_password: string }) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      await refreshCsrf();
      try { setUser(await getMe()); } catch { setUser(null); }
      setLoading(false);
    })().catch(() => { setUser(null); setLoading(false); });
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    loading,
    signIn: async (email, password) => {
      const result = await apiLogin({ email, password });
      setUser(result.user);
    },
    signUp: async (payload) => {
      const result = await apiRegister(payload);
      setUser(result.user);
    },
    signOut: async () => {
      await apiLogout();
      setUser(null);
    },
  }), [loading, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}

"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  getUserData,
  refreshToken as refreshApi,
  logout as logoutApi,
} from "@/lib/auth-client";

type UserData = ReturnType<typeof getUserData>;

type AuthContextShape = {
  user: UserData | null;
  isAuthenticated: boolean;
  refresh: () => Promise<boolean>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextShape>({
  user: null,
  isAuthenticated: false,
  refresh: async () => false,
  logout: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserData | null>(typeof window === "undefined" ? null : getUserData());

  useEffect(() => {
    let mounted = true;

    const doRefresh = async () => {
      try {
        await refreshApi();
      } catch (e) {
        // ignore - refresh may fail if no refresh token
      } finally {
        if (mounted) setUser(getUserData());
      }
    };

    // Try silent refresh on mount
    doRefresh();

    // Periodic background refresh (every 15 minutes)
    const id = setInterval(doRefresh, 1000 * 60 * 15);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, []);

  const refresh = async () => {
    const ok = await refreshApi();
    setUser(getUserData());
    return ok;
  };

  const logout = async () => {
    try {
      await logoutApi();
    } catch (e) {
      console.error("Logout error:", e);
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, refresh, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export default AuthProvider;

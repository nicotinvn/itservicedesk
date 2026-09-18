"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import {
  AUTH_COOKIE_KEY,
  AUTH_ROLE_COOKIE_KEY,
  AUTH_STORAGE_KEY,
  PRESET_USERS,
  type AuthUser,
  findAuthUserByUsername,
} from "@/lib/auth-preset";

const AUTH_SESSION_DATA_KEY = `${AUTH_STORAGE_KEY}_data`;
import {
  canAccessRoute,
  hasPermissionForRole,
  type PermissionAction,
} from "@/lib/permissions";

export { AUTH_COOKIE_KEY, AUTH_ROLE_COOKIE_KEY, AUTH_STORAGE_KEY, PRESET_USERS, type AuthUser } from "@/lib/auth-preset";

interface AuthContextType {
  currentUser: AuthUser | null;
  setCurrentUser: (user: AuthUser | null) => void;
  switchUser: (username: string) => void;
  login: (username: string, password?: string) => Promise<boolean>;
  logout: () => void;
  hasPermission: (action: PermissionAction) => boolean;
  canAccessRoute: (route: string) => boolean;
  isAuthenticated: boolean;
  isManager: boolean;
  isTechnician: boolean;
  isDepartmentUser: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(AUTH_SESSION_DATA_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as AuthUser | null;
        if (parsed?.username) {
          setCurrentUser(parsed);
          return;
        }
      }

      const saved = localStorage.getItem(AUTH_STORAGE_KEY);
      const found = findAuthUserByUsername(saved);
      if (found) {
        setCurrentUser(found);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsReady(true);
    }
  }, []);

  const persistUser = (user: AuthUser | null) => {
    setCurrentUser(user);

    if (typeof document !== "undefined") {
      if (user) {
        const username = user.username;
        localStorage.setItem(AUTH_STORAGE_KEY, username);
        localStorage.setItem(AUTH_SESSION_DATA_KEY, JSON.stringify(user));
        document.cookie = `${AUTH_COOKIE_KEY}=${encodeURIComponent(username)}; path=/; max-age=86400; sameSite=Lax`;
        document.cookie = `${AUTH_ROLE_COOKIE_KEY}=${encodeURIComponent(user.role)}; path=/; max-age=86400; sameSite=Lax`;
      } else {
        localStorage.removeItem(AUTH_STORAGE_KEY);
        localStorage.removeItem(AUTH_SESSION_DATA_KEY);
        document.cookie = `${AUTH_COOKIE_KEY}=; path=/; max-age=0; sameSite=Lax`;
        document.cookie = `${AUTH_ROLE_COOKIE_KEY}=; path=/; max-age=0; sameSite=Lax`;
      }
    }
  };

  const switchUser = (username: string) => {
    if (process.env.NEXT_PUBLIC_DEMO_MODE === "false") return;
    const found = findAuthUserByUsername(username);
    if (found) {
      persistUser(found);
    }
  };

  const login = async (username: string, password?: string) => {
    const trimmedUsername = username.trim();
    const trimmedPassword = (password ?? "").trim();

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: trimmedUsername, password: trimmedPassword }),
      });

      if (!res.ok) {
        return false;
      }

      const data = (await res.json()) as AuthUser & { error?: string };
      if (!data?.username) {
        return false;
      }

      persistUser({
        id: data.id,
        username: data.username,
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        role: data.role,
        departmentId: data.departmentId,
        departmentName: data.departmentName,
        specialty: data.specialty,
        avatar: data.avatar,
      });
      return true;
    } catch (error) {
      console.error("Login error:", error);
      return false;
    }
  };

  const logout = () => {
    persistUser(null);
    void fetch("/api/auth/logout", { method: "POST" }).catch(() => undefined);
    if (typeof window !== "undefined") {
      window.location.replace("/");
    }
  };

  const isAuthenticated = !!currentUser;
  const isManager = currentUser?.role === "MANAGER";
  const isTechnician = currentUser?.role === "TECHNICIAN";
  const isDepartmentUser = currentUser?.role === "DEPARTMENT_USER";
  const isAdmin = currentUser?.role === "ADMIN";

  const hasPermission = (action: PermissionAction) => hasPermissionForRole(currentUser?.role, action);
  const canAccessRouteForCurrentUser = (route: string) => canAccessRoute(route, currentUser?.role);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        setCurrentUser: persistUser,
        switchUser,
        login,
        logout,
        hasPermission,
        canAccessRoute: canAccessRouteForCurrentUser,
        isAuthenticated,
        isManager,
        isTechnician,
        isDepartmentUser,
        isAdmin,
      }}
    >
      {isReady ? children : null}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

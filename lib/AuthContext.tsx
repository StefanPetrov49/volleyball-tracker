"use client";
import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

type AuthContextType = {
  username: string | null;
  login: (username: string, password: string) => Promise<string | null>;
  register: (username: string, password: string) => Promise<string | null>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("vt_user");
    if (stored) setUsername(stored);
  }, []);

  const login = async (username: string, password: string): Promise<string | null> => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) {
      const { error } = await res.json() as { error: string };
      return error;
    }
    localStorage.setItem("vt_user", username);
    setUsername(username);
    return null;
  };

  const register = async (username: string, password: string): Promise<string | null> => {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) {
      const { error } = await res.json() as { error: string };
      return error;
    }
    localStorage.setItem("vt_user", username);
    setUsername(username);
    return null;
  };

  const logout = () => {
    localStorage.removeItem("vt_user");
    setUsername(null);
  };

  return (
    <AuthContext.Provider value={{ username, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

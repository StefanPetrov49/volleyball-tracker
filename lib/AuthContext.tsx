"use client";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "./auth-client";

export function AuthProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function useAuth() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  const login = async (username: string, password: string): Promise<string | null> => {
  const { error } = await authClient.signIn.username({
    username: username.trim().toLowerCase(),
    password,
  });

  if (error) return "Грешно потребителско име или парола.";

  router.refresh();
  return null;
};

  const logout = async () => {
    await authClient.signOut();
    router.refresh();
  };

  return {
    isPending,
    userId: session?.user.id ?? null,
    username: session?.user.name ?? null,
    isAdmin: session?.user.role === "admin",
    mustChangePassword: !!session?.user.mustChangePassword,
    login,
    logout,
  };
}
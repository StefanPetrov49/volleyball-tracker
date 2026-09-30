import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "Яките пичове",
  description: "Волейболен отбор – мачове и календар",
  icons: { icon: "/logo.svg", shortcut: "/logo.svg", apple: "/logo.svg" },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="bg">
      <body>{children}</body>
    </html>
  );
}
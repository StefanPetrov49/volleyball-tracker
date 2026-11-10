import "./globals.css";
import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import { AuthProvider } from "@/lib/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const siteUrl = "https://volleyball-tracker-two.vercel.app";
const title = "Яките пичове – волейболен отбор";
const description =
  "Програма на мачовете, обратно броене до следващия мач и календар на волейболен отбор Яките пичове. Следвайте ни в Instagram @yakite.pichove.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: title,
    template: "%s | Яките пичове",
  },
  description,
  applicationName: "Яките пичове",
  keywords: ["волейбол", "Яките пичове", "волейболен отбор", "мачове", "програма", "София"],
  alternates: { canonical: "/" },
  icons: { icon: "/logo.svg", shortcut: "/logo.svg", apple: "/apple-icon" },
  appleWebApp: { capable: true, title: "Яките пичове", statusBarStyle: "default" },
    openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "Яките пичове",
    title,
    description,
    locale: "bg_BG",
    images: [{ url: "/thumbnail.png", width: 1200, height: 630, alt: "Отборът Яките пичове" }],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/thumbnail.png"],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#f55e1e",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="bg">
      <body>
        <AuthProvider>
          <Navbar />
          {children}
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
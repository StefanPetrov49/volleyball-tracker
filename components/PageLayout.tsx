import type { ReactNode } from "react";

type PageLayoutProps = {
  children: ReactNode;
  className?: string;
};

export default function PageLayout({
  children,
  className = "",
}: PageLayoutProps) {
  return (
    <main className={`page-layout ${className}`.trim()}>
      <div className="page-container">{children}</div>
    </main>
  );
}
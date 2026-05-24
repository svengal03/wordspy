import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Mind Field – PlayHub",
  description: "Two-team word deduction. Spymasters hint, agents guess. Don't hit the bomb.",
  icons: { icon: "/favicons/favicon-mindfield.svg" },
};

export const viewport: Viewport = {
  themeColor: "#CC785C",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <div style={{ maxWidth: 480, margin: "0 auto", minHeight: "100dvh" }}>{children}</div>;
}

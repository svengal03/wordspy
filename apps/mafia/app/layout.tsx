import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mafia — Playhub",
  description: "Social deduction game. Coming soon.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300..800;1,9..40,300..800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ margin: 0, padding: 0, background: "#FAFAF8", fontFamily: "'DM Sans', sans-serif" }}>
        {children}
      </body>
    </html>
  );
}

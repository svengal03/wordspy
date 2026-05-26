import type { Metadata, Viewport } from "next";
import { GAME_BY_SLUG } from "@playhub/config";

const game = GAME_BY_SLUG["wordspy"];

export const metadata: Metadata = {
  title: `${game.name} – PlayHub`,
  description: game.description,
  icons: { icon: "/favicons/favicon-wordspy.svg" },
};

export const viewport: Viewport = {
  themeColor: game.themeColor,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <div style={{ maxWidth: 480, margin: "0 auto", minHeight: "100dvh" }}>{children}</div>;
}

import type { ReactNode } from "react";
import "@gameagent/ui/tokens.css";
import "./studio.css";

export const metadata = { title: "Game Agent Network — Studio" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

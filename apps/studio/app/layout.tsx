import type { ReactNode } from "react";
import "@gameagent/ui/tokens.css";

export const metadata = { title: "Game Agent Network — Foundation" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

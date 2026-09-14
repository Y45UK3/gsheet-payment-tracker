import type { Metadata } from "next";
import "./globals.css";
import { FAVICON_URL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "IGE Invoice Platform",
  description: "Centralized InGame Esports invoice management platform",
  icons: {
    icon: FAVICON_URL,
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

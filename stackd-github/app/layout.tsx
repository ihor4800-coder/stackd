import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { display, mono, sans } from "@/lib/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "STACKD — Build Your Crypto Stack",
  description: "Turn your crypto ideas into something you can see. Build, balance and visualize a portfolio as a 3D stack of blocks. No wallet, no signup.",
};

export const viewport: Viewport = {
  themeColor: "#050711",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}

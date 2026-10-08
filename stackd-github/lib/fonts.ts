import { JetBrains_Mono, Onest, Unbounded } from "next/font/google";

export const display = Unbounded({ subsets: ["latin"], variable: "--font-display", display: "swap" });
export const sans = Onest({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
export const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });

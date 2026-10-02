import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Manrope, Space_Grotesk, Unbounded } from "next/font/google";
import "./globals.css";

// The display font is Latin only, so localized headings fall back to the body font or, for
// Chinese and Japanese, to the system font, glyph by glyph.
const body = Manrope({ variable: "--font-body", subsets: ["latin", "latin-ext", "cyrillic"] });
const display = Space_Grotesk({ variable: "--font-display-latin", subsets: ["latin", "latin-ext"] });
const mono = JetBrains_Mono({ variable: "--font-mono-code", subsets: ["latin", "latin-ext", "cyrillic"] });
// Wide display face for the wordmark only.
const wordmark = Unbounded({ variable: "--font-wordmark-latin", subsets: ["latin"], weight: ["800"] });

export const metadata: Metadata = {
  title: "Dalil: your arrival guide to Abu Dhabi",
  description:
    "Photograph your admission letter and get a personal, source-linked arrival plan for Abu Dhabi, in your own language.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#f5e8d9" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${body.variable} ${display.variable} ${mono.variable} ${wordmark.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Manrope, Space_Grotesk } from "next/font/google";
import { MobileBars, Rail } from "@/components/Nav";
import "./globals.css";

// Body font carries Cyrillic (Russian) and Latin Extended (Turkmen). The display font is
// Latin only, so localized headings fall back to the body font glyph by glyph.
const body = Manrope({ variable: "--font-body", subsets: ["latin", "latin-ext", "cyrillic"] });
const display = Space_Grotesk({ variable: "--font-display-latin", subsets: ["latin", "latin-ext"] });
const mono = JetBrains_Mono({ variable: "--font-mono-code", subsets: ["latin", "latin-ext", "cyrillic"] });

export const metadata: Metadata = {
  title: "Dalil: your arrival guide to Abu Dhabi",
  description:
    "Photograph your admission letter and get a personal, source-linked arrival plan for Abu Dhabi, in your own language.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#efe6d2" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${body.variable} ${display.variable} ${mono.variable} h-full antialiased`}>
      <body className="min-h-full">
        <div className="min-h-dvh lg:grid lg:grid-cols-[232px_minmax(0,1fr)]">
          <Rail />
          <div className="min-w-0 overflow-x-clip">
            <MobileBars />
            <main className="mx-auto w-full max-w-[1500px] px-5 pt-5 pb-24 lg:px-9 lg:pt-8 lg:pb-12">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}

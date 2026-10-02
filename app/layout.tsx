import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import Link from "next/link";
import Nav from "@/components/Nav";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin", "latin-ext", "cyrillic"],
});

export const metadata: Metadata = {
  title: "Dalil: your arrival guide to Abu Dhabi",
  description:
    "Photograph your admission letter and get a personal, source-linked arrival plan for Abu Dhabi, in your own language.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#f6f1e7" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${manrope.variable} h-full antialiased`}>
      <body className="min-h-full">
        <div className="mx-auto flex min-h-dvh w-full max-w-[440px] flex-col bg-paper shadow-[0_0_0_1px_var(--line)]">
          <header className="flex items-center justify-between px-5 pt-5 pb-3">
            <Link href="/" className="flex items-baseline gap-2">
              <span className="text-[22px] font-extrabold tracking-tight text-teal">Dalil</span>
              <span className="text-[18px] text-gold" lang="ar" dir="rtl">
                دليل
              </span>
            </Link>
            <span className="rounded-full border border-line px-2.5 py-1 text-[11px] font-semibold text-muted">
              Abu Dhabi arrival guide
            </span>
          </header>
          <main className="flex-1 px-5 pb-28">{children}</main>
          <Nav />
        </div>
      </body>
    </html>
  );
}

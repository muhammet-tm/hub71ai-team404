"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/Logo";
import { KB } from "@/lib/kb";
import { DALIL_EVENT, store } from "@/lib/storage";

const ITEMS = [
  { href: "/", label: "Start", code: "01" },
  { href: "/plan", label: "My plan", code: "02" },
  { href: "/ask", label: "Ask", code: "03" },
  { href: "/about", label: "Sources", code: "04" },
];

function useProgress() {
  const [state, setState] = useState<{ done: number; name: string } | null>(null);
  useEffect(() => {
    const read = () => {
      const done = store.getDone();
      const profile = store.getProfile();
      setState(profile ? { done: KB.entries.filter((e) => done[e.id]).length, name: profile.fullName.trim().split(/\s+/)[0] || "" } : null);
    };
    read();
    window.addEventListener(DALIL_EVENT, read);
    return () => window.removeEventListener(DALIL_EVENT, read);
  }, []);
  return state;
}

/** Desktop: a fixed ink rail. */
export function Rail() {
  const path = usePathname();
  const progress = useProgress();
  return (
    <aside className="sticky top-0 hidden h-dvh flex-col bg-ink px-5 py-7 text-card lg:flex">
      <Link href="/" aria-label="Dalil, start">
        <Logo onDark />
      </Link>
      <nav className="mt-9 grid gap-1.5" aria-label="Main">
        {ITEMS.map((i) => {
          const active = path === i.href;
          return (
            <Link
              key={i.href}
              href={i.href}
              aria-current={active ? "page" : undefined}
              className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-[14px] font-bold transition-colors duration-150 ${
                active ? "bg-paper text-ink" : "text-[#c9c2ad] hover:bg-ink-soft hover:text-card"
              }`}
            >
              {i.label}
              <span className="font-mono text-[11px] opacity-70">{i.code}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-3">
        {progress ? (
          <div className="rounded-xl border-[1.5px] border-dashed border-[#5a658a] p-3.5">
            <p className="font-mono text-[22px] leading-none font-bold text-gold-bright">
              {progress.done} / {KB.entries.length}
            </p>
            <p className="mt-1.5 text-[12px] text-[#c9c2ad]">{progress.name ? `${progress.name}'s steps stamped` : "steps stamped"}</p>
            <div className="mt-2.5 h-1.5 rounded-full bg-ink-soft">
              <div
                className="h-1.5 rounded-full bg-gold-bright transition-[width] duration-500"
                style={{ width: `${(progress.done / KB.entries.length) * 100}%` }}
              />
            </div>
          </div>
        ) : null}
        <p className="text-[10.5px] leading-snug text-[#9aa3bd]">
          AI-generated guidance. Not legal advice. Sample documents are synthetic.
        </p>
      </div>
    </aside>
  );
}

/** Phone and tablet: a top bar and a bottom tab bar. */
export function MobileBars() {
  const path = usePathname();
  return (
    <>
      <header className="flex items-center justify-between border-b-[1.5px] border-ink bg-card px-5 py-3 lg:hidden">
        <Link href="/" aria-label="Dalil, start">
          <Logo size={28} />
        </Link>
        <span className="font-mono text-[10px] font-bold tracking-widest text-muted uppercase">Abu Dhabi</span>
      </header>
      <nav
        className="fixed inset-x-0 bottom-0 z-20 border-t-[1.5px] border-ink bg-card lg:hidden"
        aria-label="Main"
      >
        <ul className="mx-auto grid max-w-[560px] grid-cols-4">
          {ITEMS.map((i) => {
            const active = path === i.href;
            return (
              <li key={i.href}>
                <Link
                  href={i.href}
                  aria-current={active ? "page" : undefined}
                  className={`block py-3 text-center text-[13px] font-extrabold ${active ? "bg-ink text-card" : "text-ink"}`}
                >
                  {i.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/", label: "Start" },
  { href: "/plan", label: "My plan" },
  { href: "/ask", label: "Ask" },
  { href: "/about", label: "Sources" },
];

export default function Nav() {
  const path = usePathname();
  return (
    <nav className="fixed bottom-0 left-1/2 z-20 w-full max-w-[440px] -translate-x-1/2 border-t border-line bg-paper/95 backdrop-blur">
      <ul className="grid grid-cols-4">
        {ITEMS.map((i) => {
          const active = path === i.href;
          return (
            <li key={i.href}>
              <Link
                href={i.href}
                aria-current={active ? "page" : undefined}
                className={`block py-3.5 text-center text-[13px] font-bold ${active ? "text-teal" : "text-muted"}`}
              >
                <span className={`mx-auto mb-1 block h-1 w-6 rounded-full ${active ? "bg-teal" : "bg-transparent"}`} />
                {i.label}
              </Link>
            </li>
          );
        })}
      </ul>
      <p className="pb-2 text-center text-[10px] text-muted">AI-generated guidance. Not legal advice. Sample documents are synthetic.</p>
    </nav>
  );
}

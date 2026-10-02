import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import PrintButton from "@/components/PrintButton";
import { PHASES } from "@/lib/config";
import { REJECTED } from "@/lib/dataset";
import { HANDOFFS } from "@/lib/handoffs";
import { KB, entriesByPhase } from "@/lib/kb";
import type { KbStatus } from "@/lib/types";

export const metadata: Metadata = { title: "Dalil arrival dataset" };

const STATUS: Record<KbStatus, string> = {
  confirmed: "Confirmed",
  partially_confirmed: "Partly confirmed",
  dated_2018: "Dated 2018",
};

/** A print-friendly view of the whole dataset. The browser's print dialog saves it as a PDF. */
export default function DatasetPrintPage() {
  return (
    <div className="mx-auto max-w-[980px] bg-white px-6 py-8 text-ink print:max-w-none print:px-0 print:py-0">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-ink pb-4">
        <Logo size={40} />
        <div className="flex items-center gap-3 print:hidden">
          <Link href="/about" className="text-[13px] font-bold underline decoration-ink/40 underline-offset-4">
            Back to Sources
          </Link>
          <PrintButton />
        </div>
      </header>

      <h1 className="mt-6 font-display text-[28px] leading-tight font-bold">Arrival dataset for international students in Abu Dhabi</h1>
      <p className="mt-2 text-[13px] leading-relaxed text-ink/80">
        {KB.entries.length} arrival steps, each drafted from an official page and then checked by an independent fact-check that
        re-opened the source on 2 October 2026. Version {KB.version}. Dalil is a hackathon prototype and a guide, not an authority:
        confirm every step with the source before you act.
      </p>

      {([1, 2, 3, 4] as const).map((phase) => (
        <section key={phase} className="mt-6">
          <h2 className="border-b border-ink pb-1 font-mono text-[12px] font-bold tracking-[0.16em] uppercase">
            {phase}. {PHASES[phase]}
          </h2>
          {entriesByPhase(phase).map((e) => (
            <article key={e.id} className="break-inside-avoid border-b border-dashed border-ink/30 py-3">
              <div className="flex items-baseline justify-between gap-4">
                <h3 className="text-[14px] font-extrabold">
                  <span className="mr-2 font-mono text-[12px]">{e.id}</span>
                  {e.title}
                </h3>
                <span className="shrink-0 font-mono text-[10px] font-bold tracking-wider uppercase">{STATUS[e.status]}</span>
              </div>
              <p className="mt-1 text-[12.5px] leading-snug">{e.fact}</p>
              {e.fee ? (
                <p className="mt-1 text-[12.5px]">
                  <span className="font-bold">Fee:</span> {e.fee}
                </p>
              ) : null}
              {e.deadlineText ? (
                <p className="mt-1 text-[12.5px]">
                  <span className="font-bold">Deadline:</span> {e.deadlineText}
                </p>
              ) : null}
              {e.caveat ? <p className="mt-1 text-[12px] leading-snug text-ink/70">Note: {e.caveat}</p> : null}
              <p className="mt-1.5 text-[11.5px] leading-snug text-ink/70">
                {e.handoff !== "none" ? <>Handled by: {HANDOFFS[e.handoff].label}. </> : null}
                Source: {e.sourceName},{" "}
                <a href={e.sourceUrl} className="break-all underline">
                  {e.sourceUrl}
                </a>
              </p>
            </article>
          ))}
        </section>
      ))}

      <section className="mt-6 break-inside-avoid">
        <h2 className="border-b border-ink pb-1 font-mono text-[12px] font-bold tracking-[0.16em] uppercase">Claims the fact-check rejected</h2>
        <ul className="mt-2 space-y-1.5">
          {REJECTED.map((r) => (
            <li key={r.topic} className="text-[12.5px] leading-snug">
              <span className="font-bold">{r.topic}.</span> {r.reason}
            </li>
          ))}
        </ul>
      </section>

      <footer className="mt-6 border-t border-ink pt-3 text-[11px] text-ink/70">
        Dalil, Team 404, Hub71+ AI Hackathon supported by OpenAI, Abu Dhabi, 2 October 2026. dalil-abudhabi.vercel.app
      </footer>
    </div>
  );
}

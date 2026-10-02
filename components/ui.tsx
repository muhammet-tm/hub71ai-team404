import { HANDOFFS } from "@/lib/handoffs";
import type { CheckFlag, Handoff, KbEntry, KbStatus } from "@/lib/types";

const STATUS_STYLE: Record<KbStatus, { label: string; cls: string }> = {
  confirmed: { label: "Confirmed", cls: "bg-green-soft text-green" },
  partially_confirmed: { label: "Partially confirmed", cls: "bg-gold-soft text-gold" },
  dated_2018: { label: "Dated 2018", cls: "bg-gold-soft text-gold" },
};

export function StatusBadge({ status }: { status: KbStatus }) {
  const s = STATUS_STYLE[status];
  return <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${s.cls}`}>{s.label}</span>;
}

/** The official source of an entry: name, verification status, link to the official page. */
export function SourceChip({ entry }: { entry: KbEntry }) {
  return (
    <a
      href={entry.sourceUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-line bg-paper px-2.5 py-1 text-[11px] font-semibold text-ink hover:border-teal"
    >
      <span className="text-teal">↗</span>
      <span className="truncate">{entry.sourceName}</span>
      <StatusBadge status={entry.status} />
    </a>
  );
}

export function HandoffLink({ handoff }: { handoff: Handoff | string }) {
  if (handoff === "none" || !(handoff in HANDOFFS)) return null;
  const h = HANDOFFS[handoff as Exclude<Handoff, "none">];
  const inner = (
    <>
      <span className="text-[10px] font-bold tracking-wide text-muted uppercase">Who handles this</span>
      <span className="block text-[12.5px] font-semibold text-ink">
        {h.label}
        {h.url ? <span className="text-teal"> ↗</span> : null}
      </span>
      {h.note ? <span className="block text-[11px] text-muted">{h.note}</span> : null}
    </>
  );
  return h.url ? (
    <a href={h.url} target="_blank" rel="noopener noreferrer" className="block rounded-xl border border-line px-3 py-2 hover:border-teal">
      {inner}
    </a>
  ) : (
    <div className="rounded-xl border border-line px-3 py-2">{inner}</div>
  );
}

/** Honest state label: tells the viewer whether output is live, standard, saved, or offline. */
export function StateLabel({ kind }: { kind: "live" | "standard_plan" | "saved_example" | "offline" | "sample" | "working" }) {
  const map = {
    live: { text: "Live AI output", cls: "bg-teal-soft text-teal" },
    standard_plan: { text: "Standard plan (no AI call)", cls: "bg-gold-soft text-gold" },
    saved_example: { text: "Saved example", cls: "bg-gold-soft text-gold" },
    offline: { text: "Offline answer from verified sources", cls: "bg-gold-soft text-gold" },
    sample: { text: "Sample data", cls: "bg-gold-soft text-gold" },
    working: { text: "Working", cls: "bg-teal-soft text-teal" },
  } as const;
  const m = map[kind];
  return <span className={`inline-block rounded-full px-2.5 py-1 text-[11px] font-bold ${m.cls}`}>{m.text}</span>;
}

export function Dots() {
  return (
    <span className="inline-flex gap-1 align-middle" aria-hidden>
      <span className="dot h-1.5 w-1.5 rounded-full bg-teal" />
      <span className="dot h-1.5 w-1.5 rounded-full bg-teal [animation-delay:0.2s]" />
      <span className="dot h-1.5 w-1.5 rounded-full bg-teal [animation-delay:0.4s]" />
    </span>
  );
}

const FLAG_STYLE: Record<CheckFlag["level"], string> = {
  red: "border-red bg-red-soft text-red",
  amber: "border-gold bg-gold-soft text-gold",
  info: "border-teal bg-teal-soft text-teal",
  green: "border-green bg-green-soft text-green",
};

export function Flag({ flag }: { flag: CheckFlag }) {
  const icon = flag.level === "red" ? "!" : flag.level === "green" ? "✓" : "i";
  return (
    <div className={`rise flex gap-2.5 rounded-xl border px-3 py-2.5 text-[12.5px] font-semibold ${FLAG_STYLE[flag.level]}`} role="status">
      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-current text-[11px] font-extrabold">
        {icon}
      </span>
      <span>{flag.message}</span>
    </div>
  );
}

/** The English fact of an entry exactly as the knowledge base file states it. */
export function FactCard({ entry }: { entry: KbEntry }) {
  return (
    <div className="rounded-xl border border-line bg-sand/60 p-3">
      <p className="text-[11px] font-bold text-muted">
        {entry.id} · {entry.title}
      </p>
      <p className="mt-1 text-[12.5px] leading-snug text-ink">{entry.fact}</p>
      {entry.fee ? <p className="mt-1 text-[12.5px] font-bold text-ink">Fee: {entry.fee}</p> : null}
      {entry.caveat ? <p className="mt-1 text-[11.5px] leading-snug text-muted">Note: {entry.caveat}</p> : null}
      <div className="mt-2">
        <SourceChip entry={entry} />
      </div>
    </div>
  );
}

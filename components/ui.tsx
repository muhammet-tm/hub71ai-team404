import { ArrowUpRight, CheckCircle, Info, WarningCircle } from "@phosphor-icons/react/dist/ssr";
import { HANDOFFS } from "@/lib/handoffs";
import type { CheckFlag, Handoff, KbEntry, KbStatus } from "@/lib/types";

const STATUS: Record<KbStatus, { label: string; cls: string; r: string }> = {
  confirmed: { label: "Confirmed", cls: "text-ok", r: "-5deg" },
  partially_confirmed: { label: "Partly confirmed", cls: "text-gold", r: "4deg" },
  dated_2018: { label: "Dated 2018", cls: "text-stamp", r: "5deg" },
};

/** The fact-check status of an entry, pressed on as a rubber stamp. */
export function StatusStamp({ status, animate = false, index = 0 }: { status: KbStatus; animate?: boolean; index?: number }) {
  const s = STATUS[status];
  return (
    <span
      className={`rubber ${s.cls} ${animate ? "stamp-in" : ""}`}
      style={{ "--r": s.r, "--i": index } as React.CSSProperties}
      title="Result of the independent fact-check of this entry"
    >
      {s.label}
    </span>
  );
}

/** Link to the official page an entry comes from. */
export function SourceLink({ entry }: { entry: KbEntry }) {
  return (
    <a
      href={entry.sourceUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group inline-flex min-w-0 items-center gap-1 font-mono text-[10.5px] font-bold tracking-wide text-muted uppercase hover:text-ink"
    >
      <span className="truncate underline decoration-line underline-offset-2 group-hover:decoration-ink">{entry.sourceName}</span>
      <ArrowUpRight size={12} weight="bold" className="shrink-0" />
    </a>
  );
}

export function HandoffLink({ handoff }: { handoff: Handoff | string }) {
  if (handoff === "none" || !(handoff in HANDOFFS)) return null;
  const h = HANDOFFS[handoff as Exclude<Handoff, "none">];
  const inner = (
    <>
      <span className="font-mono text-[9.5px] font-bold tracking-widest text-muted uppercase">Who handles this</span>
      <span className="mt-0.5 flex items-start gap-1 text-[12.5px] leading-snug font-bold text-ink">
        {h.label}
        {h.url ? <ArrowUpRight size={13} weight="bold" className="mt-0.5 shrink-0" /> : null}
      </span>
      {h.note ? <span className="block text-[11px] text-muted">{h.note}</span> : null}
    </>
  );
  const cls = "block rounded-lg border border-dashed border-ink/40 px-3 py-2";
  return h.url ? (
    <a href={h.url} target="_blank" rel="noopener noreferrer" className={`${cls} transition-colors duration-150 hover:border-ink hover:bg-paper/60`}>
      {inner}
    </a>
  ) : (
    <div className={cls}>{inner}</div>
  );
}

/** Honest state label: tells the viewer whether output is live, standard, saved, or offline. */
export function StateLabel({ kind }: { kind: "live" | "standard_plan" | "saved_example" | "offline" | "sample" }) {
  const map = {
    live: { text: "Live AI output", cls: "border-ok bg-ok-soft text-ok" },
    standard_plan: { text: "Standard plan, no AI call", cls: "border-gold bg-gold-soft text-gold" },
    saved_example: { text: "Saved example", cls: "border-gold bg-gold-soft text-gold" },
    offline: { text: "Offline answer from verified sources", cls: "border-gold bg-gold-soft text-gold" },
    sample: { text: "Sample data", cls: "border-gold bg-gold-soft text-gold" },
  } as const;
  const m = map[kind];
  return (
    <span className={`inline-block rounded-md border px-2 py-1 font-mono text-[10px] font-bold tracking-wide uppercase ${m.cls}`}>
      {m.text}
    </span>
  );
}

export function Dots() {
  return (
    <span className="inline-flex gap-1 align-middle" aria-hidden>
      <span className="dot h-1.5 w-1.5 rounded-full bg-stamp" />
      <span className="dot h-1.5 w-1.5 rounded-full bg-stamp [animation-delay:0.2s]" />
      <span className="dot h-1.5 w-1.5 rounded-full bg-stamp [animation-delay:0.4s]" />
    </span>
  );
}

const FLAG_STYLE: Record<CheckFlag["level"], string> = {
  red: "border-stamp bg-stamp-soft text-stamp",
  amber: "border-gold bg-gold-soft text-gold",
  info: "border-ink bg-card text-ink",
  green: "border-ok bg-ok-soft text-ok",
};

export function Flag({ flag }: { flag: CheckFlag }) {
  const Icon = flag.level === "red" ? WarningCircle : flag.level === "green" ? CheckCircle : Info;
  return (
    <div className={`rise flex gap-2.5 rounded-lg border-[1.5px] px-3 py-2.5 text-[12.5px] leading-snug font-bold ${FLAG_STYLE[flag.level]}`} role="status">
      <Icon size={18} weight="fill" className="mt-px shrink-0" />
      <span>{flag.message}</span>
    </div>
  );
}

/** The English fact of an entry exactly as the knowledge base file states it. */
export function FactCard({ entry }: { entry: KbEntry }) {
  return (
    <div className="ticket flex">
      <div className="flex w-12 shrink-0 items-center justify-center font-mono text-[12px] font-bold">{entry.id}</div>
      <div className="perforation min-w-0 flex-1 px-3 py-2.5">
        <p className="text-[12.5px] leading-snug font-bold">{entry.title}</p>
        <p className="mt-1 text-[12.5px] leading-snug text-ink/85">{entry.fact}</p>
        {entry.fee ? <p className="mt-1 text-[12.5px] font-extrabold">Fee: {entry.fee}</p> : null}
        {entry.caveat ? <p className="mt-1 text-[11.5px] leading-snug text-muted">Note: {entry.caveat}</p> : null}
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <SourceLink entry={entry} />
          <StatusStamp status={entry.status} />
        </div>
      </div>
    </div>
  );
}

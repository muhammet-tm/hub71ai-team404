"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpRight, ArrowsClockwise, ChatsCircle } from "@phosphor-icons/react";
import AskPanel from "@/components/AskPanel";
import { PlaneMark } from "@/components/Logo";
import PassportCheck from "@/components/PassportCheck";
import { Dots, HandoffLink, SourceLink, StateLabel, StatusStamp } from "@/components/ui";
import { matchBuddy } from "@/lib/buddies";
import { suggestedDate } from "@/lib/checks";
import { countryCode } from "@/lib/codes";
import { LANG_LABELS, PHASES, PLAN_TIMEOUT_MS } from "@/lib/config";
import { KB, entriesByPhase } from "@/lib/kb";
import { store } from "@/lib/storage";
import type { KbEntry, PlanResult, PlanStep, Profile } from "@/lib/types";

async function loadPlan(profile: Profile): Promise<PlanResult> {
  try {
    const res = await fetch("/api/plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profile }),
      signal: AbortSignal.timeout(PLAN_TIMEOUT_MS),
    });
    if (!res.ok) throw new Error("plan failed");
    return (await res.json()) as PlanResult;
  } catch {
    // Honest fallback: the English entries straight from the knowledge base, labeled "Standard plan".
    return { source: "standard_plan", language: profile.language, greeting: "", steps: [], warnings: [] };
  }
}

export default function PlanPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [plan, setPlan] = useState<PlanResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const p = store.getProfile();
    if (!p) {
      router.replace("/start");
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProfile(p);
    setDone(store.getDone());
    const saved = store.getPlan();
    if (saved && saved.language === p.language) {
      setPlan(saved);
      return;
    }
    setLoading(true);
    loadPlan(p).then((r) => {
      setPlan(r);
      if (r.source === "live") store.setPlan(r);
      setLoading(false);
    });
  }, [router]);

  const stepsById = useMemo(() => new Map<string, PlanStep>((plan?.steps || []).map((s) => [s.kb_id, s])), [plan]);
  const doneCount = KB.entries.filter((e) => done[e.id]).length;

  function toggle(id: string) {
    const next = { ...done, [id]: !done[id] };
    setDone(next);
    store.setDone(next);
  }

  function regenerate() {
    if (!profile) return;
    store.clearPlan();
    setPlan(null);
    setLoading(true);
    loadPlan(profile).then((r) => {
      setPlan(r);
      if (r.source === "live") store.setPlan(r);
      setLoading(false);
    });
  }

  if (!profile) return null;
  const buddy = matchBuddy(profile.country);
  const givenName = profile.fullName.trim().split(/\s+/)[0] || "";

  return (
    <div className="xl:grid xl:grid-cols-[minmax(0,1fr)_390px] xl:gap-8">
      <div className="min-w-0 space-y-7">
        {/* The boarding pass: who, from where, when. */}
        <section className="pass rise overflow-hidden">
          <div className="flex flex-col md:flex-row">
            <div className="flex flex-1 items-center gap-4 px-5 py-4 sm:gap-6">
              <div>
                <p className="font-mono text-[9.5px] font-bold tracking-widest text-muted uppercase">From</p>
                <p className="font-mono text-[34px] leading-none font-bold tracking-tight sm:text-[44px]">{countryCode(profile.country)}</p>
                <p className="mt-1 max-w-[9rem] truncate font-mono text-[10px] font-bold tracking-wider text-muted uppercase">{profile.country}</p>
              </div>
              <div className="relative flex-1" aria-hidden>
                <div className="route" />
                <div className="fly absolute inset-x-0 -top-4 flex justify-end">
                  <span className="bg-card px-1.5">
                    <PlaneMark size={30} trail={false} />
                  </span>
                </div>
              </div>
              <div>
                <p className="font-mono text-[9.5px] font-bold tracking-widest text-muted uppercase">To</p>
                <p className="font-mono text-[34px] leading-none font-bold tracking-tight sm:text-[44px]">AUH</p>
                <p className="mt-1 font-mono text-[10px] font-bold tracking-wider text-muted uppercase">Abu Dhabi</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 border-t-2 border-dashed border-ink px-5 py-4 md:w-[270px] md:grid-cols-1 md:border-t-0 md:border-l-2">
              <div>
                <p className="font-mono text-[9.5px] font-bold tracking-widest text-muted uppercase">Passenger</p>
                <p className="truncate font-mono text-[14px] font-bold uppercase">{profile.fullName || "Student"}</p>
              </div>
              <div>
                <p className="font-mono text-[9.5px] font-bold tracking-widest text-muted uppercase">Arrival</p>
                <p className="font-mono text-[14px] font-bold uppercase">{suggestedDate(profile.arrivalDate, 0)}</p>
              </div>
              <div className="col-span-2 md:col-span-1">
                <p className="font-mono text-[9.5px] font-bold tracking-widest text-muted uppercase">University</p>
                <p className="truncate text-[12.5px] font-bold">{profile.university}</p>
              </div>
            </div>
          </div>

          <div className="border-t-[1.5px] border-ink bg-white/60 px-5 py-3.5" aria-live="polite">
            {loading ? (
              <p className="text-[14px] font-extrabold">
                Personalizing in {LANG_LABELS[profile.language]} <Dots />
                <span className="mt-0.5 block text-[12px] font-medium text-muted">
                  The official steps below are already complete. The AI adds your language and a personal note.
                </span>
              </p>
            ) : plan ? (
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                  <StateLabel kind={plan.source} />
                  {plan.source === "live" && plan.ms ? (
                    <span className="font-mono text-[10.5px] text-muted">
                      {plan.model || "OpenAI"}, {(plan.ms / 1000).toFixed(1)} s
                    </span>
                  ) : null}
                  <button onClick={regenerate} className="inline-flex items-center gap-1 text-[12px] font-bold underline decoration-ink/40 underline-offset-2 hover:decoration-ink">
                    <ArrowsClockwise size={12} weight="bold" />
                    Regenerate
                  </button>
                  <Link href="/start" className="text-[12px] font-bold underline decoration-ink/40 underline-offset-2 hover:decoration-ink">
                    Edit details
                  </Link>
                </div>
                {plan.greeting ? <p className="text-[15px] leading-snug font-bold">{plan.greeting}</p> : null}
                {plan.source === "standard_plan" ? (
                  <p className="text-[12.5px] text-muted">
                    The AI service did not answer in time, so this is the standard plan in English from the verified sources.
                  </p>
                ) : null}
              </div>
            ) : null}
            <div className="mt-3 flex items-center gap-3">
              <div className="h-2 flex-1 rounded-full border border-ink bg-card">
                <div className="h-full rounded-full bg-ink transition-[width] duration-500" style={{ width: `${(doneCount / KB.entries.length) * 100}%` }} />
              </div>
              <span className="font-mono text-[11px] font-bold whitespace-nowrap">
                {doneCount} / {KB.entries.length} stamped
              </span>
            </div>
          </div>
        </section>

        <h1 className="sr-only">{givenName ? `${givenName}, your arrival plan` : "Your arrival plan"}</h1>

        {([1, 2, 3, 4] as const).map((phase) => (
          <section key={phase}>
            <h2 className="mb-3 flex items-center gap-3 font-mono text-[12.5px] font-bold tracking-[0.18em] uppercase">
              <span className="rounded bg-ink px-1.5 py-0.5 text-card">0{phase}</span>
              {PHASES[phase]}
              <span className="h-[1.5px] flex-1 bg-ink/25" />
            </h2>
            <ol className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {withSpans(entriesByPhase(phase)).map(({ entry: e, wide }, i) => (
                <StepTicket
                  key={e.id}
                  index={i}
                  wide={wide}
                  entry={e}
                  step={stepsById.get(e.id)}
                  checked={!!done[e.id]}
                  onToggle={() => toggle(e.id)}
                  arrivalDate={profile.arrivalDate}
                />
              ))}
            </ol>
          </section>
        ))}

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="ticket p-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-[17px] font-bold">Your buddy</h2>
              <StateLabel kind="sample" />
            </div>
            <div className="mt-3 flex gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border-[1.5px] border-ink bg-gold-soft font-display text-[18px] font-bold">
                {buddy.name[0]}
              </div>
              <div className="min-w-0">
                <p className="text-[14px] font-extrabold">
                  {buddy.name}, {buddy.country}
                </p>
                <p className="text-[12px] text-muted">
                  {buddy.program}, {buddy.university}
                </p>
                <p className="text-[12px] text-muted">Speaks {buddy.languages.join(", ")}</p>
                <p className="mt-1 text-[12.5px] leading-snug">{buddy.note}</p>
              </div>
            </div>
            <p className="mt-2.5 text-[11px] text-muted">This buddy is fictional. In a pilot, matches would come from a university&apos;s student clubs.</p>
          </div>

          <div className="rounded-xl bg-ink p-4 text-card">
            <p className="font-mono text-[10px] font-bold tracking-widest text-gold-bright uppercase">Next stop</p>
            <p className="mt-1.5 font-display text-[17px] leading-snug font-bold">
              Once you hold your Emirates ID, continue in TAMM for Abu Dhabi government services.
            </p>
            <a
              href="https://apps.apple.com/us/app/tamm-abu-dhabi-government/id1435485576"
              target="_blank"
              rel="noopener noreferrer"
              className="btn mt-3 border-card bg-card px-4 py-2 text-[12.5px] text-ink hover:shadow-[3px_3px_0_var(--gold-bright)]"
            >
              Open TAMM
              <ArrowUpRight size={14} weight="bold" />
            </a>
          </div>
        </section>

        <Link href="/ask" className="btn btn-primary w-full px-4 py-4 text-[15px] xl:hidden">
          <ChatsCircle size={20} weight="bold" />
          Ask Dalil a question
        </Link>
      </div>

      {/* Wide screens: the assistant stays beside the plan. */}
      <aside className="hidden xl:block">
        <div className="sticky top-8 h-[calc(100dvh-4rem)]">
          <AskPanel variant="dock" />
        </div>
      </aside>
    </div>
  );
}

/** Two-column rows with no holes: K03 takes a full row, and so does any ticket left alone in one. */
function withSpans(entries: KbEntry[]): { entry: KbEntry; wide: boolean }[] {
  const out = entries.map((entry) => ({ entry, wide: entry.id === "K03" }));
  let col = 0;
  out.forEach((item, i) => {
    if (item.wide) {
      if (col === 1) out[i - 1].wide = true;
      col = 0;
    } else col = (col + 1) % 2;
  });
  if (col === 1) out[out.length - 1].wide = true;
  return out;
}

function StepTicket({
  entry,
  step,
  checked,
  onToggle,
  arrivalDate,
  index,
  wide,
}: {
  wide: boolean;
  entry: KbEntry;
  step?: PlanStep;
  checked: boolean;
  onToggle: () => void;
  arrivalDate: string;
  index: number;
}) {
  const title = step?.title || entry.title;
  return (
    <li
      className={`ticket rise relative flex min-w-0 transition-[background-color,box-shadow] duration-200 ${wide ? "md:col-span-2" : ""} ${checked ? "bg-paper/60" : "hover:shadow-[3px_3px_0_var(--ink)]"}`}
      style={{ "--i": index } as React.CSSProperties}
    >
      <div className="flex w-[58px] shrink-0 flex-col items-center gap-2 pt-4">
        <span className="font-mono text-[13px] font-bold">{entry.id}</span>
        <input
          type="checkbox"
          checked={checked}
          onChange={onToggle}
          aria-label={`Mark "${entry.title}" as done`}
          className="h-5 w-5 cursor-pointer accent-[var(--ink)]"
        />
        {checked ? (
          <span key="done" className="rubber stamp-in mt-1 text-[9px] text-ok" style={{ "--r": "-12deg", "--i": 0 } as React.CSSProperties}>
            Done
          </span>
        ) : null}
      </div>

      <div className="perforation min-w-0 flex-1 px-4 py-3.5">
        <div className="flex items-start justify-between gap-2">
          <h3 className={`text-[15.5px] leading-snug font-extrabold ${checked ? "text-muted line-through" : ""}`}>{title}</h3>
          {step ? (
            <span className="shrink-0 rounded bg-ink px-1.5 py-0.5 font-mono text-[9.5px] font-bold tracking-wide text-card uppercase">For you</span>
          ) : null}
        </div>

        <p className="mt-1 font-mono text-[10.5px] font-bold tracking-wide uppercase">
          {entry.timingBasis === "sourced_deadline" ? (
            <span className="text-stamp">Sourced deadline: {entry.deadlineText}</span>
          ) : entry.offsetDays !== null && arrivalDate ? (
            <span className="text-muted">Around {suggestedDate(arrivalDate, entry.offsetDays)}, suggested order</span>
          ) : (
            <span className="text-muted">Suggested order, no official deadline</span>
          )}
        </p>

        {step?.why_for_you ? (
          <p className="rise mt-2.5 rounded-md bg-ok-soft px-3 py-2 text-[13px] leading-snug">
            {step.why_for_you}
            <span className="ml-1.5 align-middle font-mono text-[9px] font-bold tracking-wide text-ok uppercase">AI-written</span>
          </p>
        ) : null}

        <p className="mt-2.5 text-[12.5px] leading-snug text-ink/90">
          <span className="font-mono text-[9.5px] font-bold tracking-widest text-muted uppercase">Official fact </span>
          {entry.fact}
        </p>
        {entry.fee ? <p className="mt-1 text-[12.5px] font-extrabold">Fee: {entry.fee}</p> : null}
        {entry.caveat ? <p className="mt-1 text-[11.5px] leading-snug text-muted">Note: {entry.caveat}</p> : null}

        <div className="mt-3">
          <HandoffLink handoff={entry.handoff} />
        </div>

        {entry.id === "K03" ? <PassportCheck arrivalDate={arrivalDate} /> : null}

        <div className="mt-3 flex items-center justify-between gap-3 border-t border-dashed border-ink/30 pt-2.5">
          <SourceLink entry={entry} />
          <StatusStamp status={entry.status} animate index={index} />
        </div>
      </div>
    </li>
  );
}

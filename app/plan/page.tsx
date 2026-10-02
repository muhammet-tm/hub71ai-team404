"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PassportCheck from "@/components/PassportCheck";
import { Dots, HandoffLink, SourceChip, StateLabel } from "@/components/ui";
import { matchBuddy } from "@/lib/buddies";
import { suggestedDate } from "@/lib/checks";
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
      router.replace("/");
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
    <div className="space-y-5">
      <section className="rise pt-2">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[12px] font-bold text-muted">
            {profile.country} → {profile.university} · arriving {suggestedDate(profile.arrivalDate, 0)}
          </p>
          <Link href="/" className="text-[12px] font-bold text-teal underline underline-offset-2">
            Edit
          </Link>
        </div>
        <h1 className="mt-1 text-[24px] leading-tight font-extrabold tracking-tight">
          {givenName ? `${givenName}, your arrival plan` : "Your arrival plan"}
        </h1>
        <div className="mt-2 min-h-[44px]" aria-live="polite">
          {loading ? (
            <p className="text-[13.5px] font-bold text-teal">
              Personalizing in {LANG_LABELS[profile.language]} <Dots />
              <span className="mt-0.5 block text-[12px] font-medium text-muted">
                The official steps below are already complete. The AI adds your language and a personal note.
              </span>
            </p>
          ) : plan ? (
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <StateLabel kind={plan.source} />
                {plan.source === "live" && plan.ms ? (
                  <span className="text-[11px] text-muted">gpt-6.1-sol · {(plan.ms / 1000).toFixed(1)} s</span>
                ) : null}
                <button onClick={regenerate} className="text-[11px] font-bold text-teal underline underline-offset-2">
                  Regenerate
                </button>
              </div>
              {plan.greeting ? <p className="text-[14.5px] leading-snug font-semibold">{plan.greeting}</p> : null}
              {plan.source === "standard_plan" ? (
                <p className="text-[12px] text-muted">
                  The AI service did not answer in time, so this is the standard plan in English from the verified sources.
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
        <div className="mt-3">
          <div className="flex items-center justify-between text-[11.5px] font-bold text-muted">
            <span>
              {doneCount} of {KB.entries.length} steps done
            </span>
            <span>Every fact below comes from an official source</span>
          </div>
          <div className="mt-1 h-1.5 rounded-full bg-line">
            <div className="h-1.5 rounded-full bg-teal transition-all" style={{ width: `${(doneCount / KB.entries.length) * 100}%` }} />
          </div>
        </div>
      </section>

      {([1, 2, 3, 4] as const).map((phase) => (
        <section key={phase}>
          <h2 className="sticky top-0 z-10 -mx-5 border-y border-line bg-sand px-5 py-2 text-[12px] font-extrabold tracking-widest text-teal uppercase">
            {phase}. {PHASES[phase]}
          </h2>
          <ol className="mt-3 space-y-3">
            {entriesByPhase(phase).map((e) => (
              <StepCard
                key={e.id}
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

      <section className="rounded-2xl border border-line p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-extrabold">Your buddy</h2>
          <StateLabel kind="sample" />
        </div>
        <div className="mt-2 flex gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-teal text-[16px] font-extrabold text-white">
            {buddy.name[0]}
          </div>
          <div>
            <p className="text-[14px] font-extrabold">
              {buddy.name} · {buddy.country}
            </p>
            <p className="text-[12px] text-muted">
              {buddy.program}, {buddy.university}
            </p>
            <p className="text-[12px] text-muted">Speaks {buddy.languages.join(", ")}</p>
            <p className="mt-1 text-[12.5px] leading-snug">{buddy.note}</p>
          </div>
        </div>
        <p className="mt-2 text-[10.5px] text-muted">
          This buddy is fictional. In a pilot, matches would come from a university&apos;s student clubs.
        </p>
      </section>

      <section className="rounded-2xl bg-ink p-4 text-white">
        <p className="text-[11px] font-bold tracking-widest text-white/60 uppercase">Next stop</p>
        <p className="mt-1 text-[15px] leading-snug font-extrabold">
          Once you hold your Emirates ID, continue in TAMM for Abu Dhabi government services.
        </p>
        <a
          href="https://apps.apple.com/us/app/tamm-abu-dhabi-government/id1435485576"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-block rounded-full bg-white px-4 py-2 text-[12.5px] font-extrabold text-ink"
        >
          Open TAMM ↗
        </a>
      </section>

      <Link href="/ask" className="block rounded-2xl bg-teal px-4 py-4 text-center text-[15px] font-extrabold text-white">
        Ask Dalil a question
      </Link>
    </div>
  );
}

function StepCard({
  entry,
  step,
  checked,
  onToggle,
  arrivalDate,
}: {
  entry: KbEntry;
  step?: PlanStep;
  checked: boolean;
  onToggle: () => void;
  arrivalDate: string;
}) {
  const title = step?.title || entry.title;
  return (
    <li className={`rounded-2xl border p-4 transition ${checked ? "border-line bg-sand/40 opacity-75" : "border-line bg-paper"}`}>
      <div className="flex gap-3">
        <input
          type="checkbox"
          checked={checked}
          onChange={onToggle}
          aria-label={`Mark "${entry.title}" as done`}
          className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--teal)]"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className={`text-[15px] leading-snug font-extrabold ${checked ? "line-through" : ""}`}>{title}</h3>
            {step ? <span className="shrink-0 rounded-full bg-teal px-2 py-0.5 text-[10px] font-extrabold text-white">For you</span> : null}
          </div>

          <p className="mt-1 text-[11px] font-bold">
            {entry.timingBasis === "sourced_deadline" ? (
              <span className="text-red">Sourced deadline: {entry.deadlineText}</span>
            ) : entry.offsetDays !== null && arrivalDate ? (
              <span className="text-muted">
                Around {suggestedDate(arrivalDate, entry.offsetDays)} · suggested order, no official deadline
              </span>
            ) : (
              <span className="text-muted">Suggested order, no official deadline</span>
            )}
          </p>

          {step?.why_for_you ? (
            <p className="rise mt-2 rounded-xl bg-teal-soft/60 px-3 py-2 text-[13px] leading-snug">
              {step.why_for_you}
              <span className="ml-1.5 align-middle text-[9.5px] font-extrabold tracking-wide text-teal uppercase">AI-written</span>
            </p>
          ) : null}

          <p className="mt-2 text-[12.5px] leading-snug text-ink">
            <span className="text-[10px] font-extrabold tracking-wide text-muted uppercase">Official fact · </span>
            {entry.fact}
          </p>
          {entry.fee ? <p className="mt-1 text-[12.5px] font-extrabold">Fee: {entry.fee}</p> : null}
          {entry.caveat ? <p className="mt-1 text-[11.5px] leading-snug text-muted">Note: {entry.caveat}</p> : null}

          <div className="mt-2.5 space-y-2">
            <SourceChip entry={entry} />
            <HandoffLink handoff={entry.handoff} />
          </div>

          {entry.id === "K03" ? <PassportCheck arrivalDate={arrivalDate} /> : null}
        </div>
      </div>
    </li>
  );
}

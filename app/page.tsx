"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Dots, Flag, StateLabel } from "@/components/ui";
import { computeFlags } from "@/lib/checks";
import { DalilError, SAMPLES, extractFromFile, extractSample } from "@/lib/client";
import { LANG_LABELS } from "@/lib/config";
import { store } from "@/lib/storage";
import type { CheckFlag, Confidence, ExtractResponse, Lang, Profile } from "@/lib/types";

const EMPTY: Profile = { fullName: "", country: "", university: "", program: "", arrivalDate: "", language: "ru" };

function minusDays(iso: string, days: number): string {
  const d = new Date(iso + "T00:00:00Z");
  if (Number.isNaN(d.getTime())) return "";
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

export default function StartPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ExtractResponse | null>(null);
  const [flags, setFlags] = useState<CheckFlag[]>([]);
  const [form, setForm] = useState<Profile | null>(null);
  const [conf, setConf] = useState<Partial<Record<keyof Profile, Confidence>>>({});
  const [usedSample, setUsedSample] = useState(false);

  useEffect(() => {
    // Restore an earlier session from this device (localStorage is unavailable during server render).
    const c = store.getConsent();
    const p = store.getProfile();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (c?.accepted) setConsent(true);
    if (p) setForm(p);
    // Warm the plan route with a fictional profile (no user data), because the first call after
    // idle was measured at 29 to 52 s and later calls at 5 to 7 s.
    fetch("/api/plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profile: { fullName: "Sample", country: "Sample", university: "Sample", program: "Sample", arrivalDate: "2026-10-23", language: "ru" } }),
    }).catch(() => {});
  }, []);

  function applyExtraction(r: ExtractResponse) {
    const ex = r.extraction;
    const arrival = ex.start_date ? minusDays(ex.start_date, 3) : "";
    setResult(r);
    setFlags(computeFlags(ex, "admission_letter", arrival));
    setConf({
      fullName: ex.confidence.full_name,
      country: ex.confidence.nationality,
      university: ex.confidence.university,
      program: ex.confidence.program,
      arrivalDate: ex.confidence.start_date,
    });
    setForm({
      fullName: ex.full_name,
      country: ex.nationality,
      university: ex.university,
      program: ex.program,
      arrivalDate: arrival,
      language: form?.language || "ru",
    });
  }

  async function run(job: () => Promise<ExtractResponse>, sample: boolean) {
    setBusy(true);
    setError("");
    setResult(null);
    setFlags([]);
    setUsedSample(sample);
    store.setConsent();
    try {
      applyExtraction(await job());
    } catch (e) {
      setError(e instanceof DalilError ? e.message : "The letter could not be read. Type the details below.");
      setConf({});
      setForm((f) => f || EMPTY);
    } finally {
      setBusy(false);
    }
  }

  function createPlan() {
    if (!form) return;
    store.setProfile(form);
    store.clearPlan();
    router.push("/plan");
  }

  const ready = form && form.country.trim() && form.arrivalDate && form.university.trim();
  const low = (k: keyof Profile) => conf[k] === "low" || conf[k] === "not_found" || conf[k] === "medium";

  return (
    <div className="space-y-5">
      <section className="rise pt-2">
        <h1 className="text-[27px] leading-[1.15] font-extrabold tracking-tight">
          From admission letter to settled in Abu Dhabi.
        </h1>
        <p className="mt-2 text-[14.5px] leading-relaxed text-muted">
          Photograph your admission letter. Dalil reads it and builds your personal arrival plan, in your language, with the
          official source on every step.
        </p>
      </section>

      <section className="rounded-2xl border border-line bg-sand/50 p-4">
        <label className="flex cursor-pointer gap-3">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-1 h-5 w-5 shrink-0 accent-[var(--teal)]"
          />
          <span className="text-[12px] leading-snug text-ink">
            I agree that Dalil sends the document photo I choose to OpenAI, a service outside the United Arab Emirates, so that it
            can be read. Dalil&apos;s server does not store the photo. OpenAI may keep abuse-monitoring logs for up to 30 days. I
            can withdraw this consent at any time on the Sources page, which deletes my data from this device. Withdrawal cannot
            recall logs that OpenAI already holds.
          </span>
        </label>
      </section>

      <section className="space-y-2.5">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (f) run(() => extractFromFile(f, "admission_letter"), false);
          }}
        />
        <button
          disabled={!consent || busy}
          onClick={() => fileRef.current?.click()}
          className="w-full rounded-2xl bg-teal px-4 py-4 text-[15px] font-extrabold text-white shadow-sm transition active:scale-[0.99] disabled:opacity-40"
        >
          Scan my admission letter
        </button>
        <button
          disabled={!consent || busy}
          onClick={() => run(() => extractSample("admission_letter"), true)}
          className="w-full rounded-2xl border-2 border-teal px-4 py-3.5 text-[15px] font-extrabold text-teal transition active:scale-[0.99] disabled:opacity-40"
        >
          Use the sample letter
        </button>
        {!consent ? <p className="text-center text-[12px] text-muted">Tick the box above to continue.</p> : null}
        <button
          disabled={busy}
          onClick={() => {
            setResult(null);
            setFlags([]);
            setConf({});
            setForm(form || EMPTY);
          }}
          className="w-full py-1 text-center text-[12.5px] font-semibold text-muted underline underline-offset-2"
        >
          Or type my details without a photo
        </button>
      </section>

      {busy ? (
        <section className="rise rounded-2xl border border-line p-4" aria-live="polite">
          {usedSample ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={SAMPLES.admission_letter.image} alt="Synthetic sample admission letter" className="mb-3 w-full rounded-lg border border-line" />
          ) : null}
          <p className="text-[13.5px] font-bold">
            Reading the letter with OpenAI vision <Dots />
          </p>
          <p className="mt-1 text-[12px] text-muted">The photo is read in memory and is not stored on our server.</p>
        </section>
      ) : null}

      {error ? <Flag flag={{ id: "unreadable", level: "amber", message: error }} /> : null}

      {form && !busy ? (
        <section className="rise space-y-3 rounded-2xl border border-line p-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-[16px] font-extrabold">Check your details</h2>
            {result ? <StateLabel kind={result.source === "live" ? "live" : "saved_example"} /> : null}
          </div>
          {result?.source === "live" ? (
            <p className="text-[12px] text-muted">
              Read by {result.model} in {(result.ms / 1000).toFixed(1)} s. Fields the model was less sure about are outlined. Edit
              anything that is wrong.
            </p>
          ) : result ? (
            <p className="text-[12px] text-muted">
              The AI service did not answer, so these are the saved details of the synthetic sample letter. Edit anything that is
              wrong.
            </p>
          ) : (
            <p className="text-[12px] text-muted">Type your details. Only your first name is sent to the AI model.</p>
          )}
          {flags.map((f) => (
            <Flag key={f.id} flag={f} />
          ))}

          <Field label="Full name" low={low("fullName")}>
            <input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className={inputCls(low("fullName"))} />
          </Field>
          <Field label="Country you are coming from" low={low("country")}>
            <input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} className={inputCls(low("country"))} />
          </Field>
          <Field label="University" low={low("university")}>
            <input value={form.university} onChange={(e) => setForm({ ...form, university: e.target.value })} className={inputCls(low("university"))} />
          </Field>
          <Field label="Program" low={low("program")}>
            <input value={form.program} onChange={(e) => setForm({ ...form, program: e.target.value })} className={inputCls(low("program"))} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Arrival date"
              low={low("arrivalDate")}
              hint={result?.extraction.start_date ? `Suggested: 3 days before your start date (${result.extraction.start_date})` : undefined}
            >
              <input
                type="date"
                value={form.arrivalDate}
                onChange={(e) => setForm({ ...form, arrivalDate: e.target.value })}
                className={inputCls(low("arrivalDate"))}
              />
            </Field>
            <Field label="Your language">
              <select value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value as Lang })} className={inputCls(false)}>
                {(Object.keys(LANG_LABELS) as Lang[]).map((l) => (
                  <option key={l} value={l}>
                    {LANG_LABELS[l]}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <button
            disabled={!ready}
            onClick={createPlan}
            className="w-full rounded-2xl bg-ink px-4 py-4 text-[15px] font-extrabold text-white transition active:scale-[0.99] disabled:opacity-40"
          >
            Create my arrival plan
          </button>
        </section>
      ) : null}
    </div>
  );
}

function inputCls(low: boolean) {
  return `w-full rounded-xl border bg-paper px-3 py-2.5 text-[14px] font-semibold outline-none focus:border-teal ${
    low ? "border-gold ring-2 ring-gold-soft" : "border-line"
  }`;
}

function Field({ label, low, hint, children }: { label: string; low?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 flex items-center justify-between text-[11.5px] font-bold text-muted">
        {label}
        {low ? <span className="text-gold">Please check</span> : null}
      </span>
      {children}
      {hint ? <span className="mt-1 block text-[10.5px] text-muted">{hint}</span> : null}
    </label>
  );
}

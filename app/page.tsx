"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Camera, FileText } from "@phosphor-icons/react";
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
  const [preview, setPreview] = useState<string>(SAMPLES.admission_letter.image);

  useEffect(() => {
    // Restore an earlier session from this device (localStorage is unavailable during server render).
    const c = store.getConsent();
    const p = store.getProfile();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (c?.accepted) setConsent(true);
    if (p) setForm(p);
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

  async function run(job: () => Promise<ExtractResponse>, image: string) {
    setBusy(true);
    setError("");
    setResult(null);
    setFlags([]);
    setPreview(image);
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
  const showForm = form && !busy;

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,540px)] lg:gap-12 xl:gap-16">
      {/* Left: the promise, the consent, the two actions */}
      <div className="space-y-6 lg:pt-6">
        <section className="rise">
          <h1 className="font-display text-[34px] leading-[1.05] font-bold tracking-tight sm:text-[44px] xl:text-[56px]">
            From admission letter to settled in Abu Dhabi.
          </h1>
          <p className="mt-4 max-w-[52ch] text-[15.5px] leading-relaxed text-ink/80">
            Photograph your admission letter. Dalil builds your arrival plan in your language, with the official source on every
            step.
          </p>
        </section>

        <section className="ticket p-4">
          <label className="flex cursor-pointer gap-3">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--ink)]"
            />
            <span className="text-[12px] leading-snug text-ink/85">
              I agree that Dalil sends the document photo I choose to OpenAI, a service outside the United Arab Emirates, so that
              it can be read. Dalil&apos;s server does not store the photo. OpenAI may keep abuse-monitoring logs for up to 30
              days. I can withdraw this consent at any time on the Sources page, which deletes my data from this device.
              Withdrawal cannot recall logs that OpenAI already holds.
            </span>
          </label>
        </section>

        <section className="space-y-3">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (f) run(() => extractFromFile(f, "admission_letter"), URL.createObjectURL(f));
            }}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <button disabled={!consent || busy} onClick={() => fileRef.current?.click()} className="btn btn-primary px-4 py-4 text-[15px]">
              <Camera size={20} weight="bold" />
              Scan my admission letter
            </button>
            <button
              disabled={!consent || busy}
              onClick={() => run(() => extractSample("admission_letter"), SAMPLES.admission_letter.image)}
              className="btn btn-ghost px-4 py-4 text-[15px]"
            >
              <FileText size={20} weight="bold" />
              Use the sample letter
            </button>
          </div>
          {!consent ? <p className="text-[12.5px] font-semibold text-muted">Tick the box above to continue.</p> : null}
          <button
            disabled={busy}
            onClick={() => {
              setResult(null);
              setFlags([]);
              setConf({});
              setForm(form || EMPTY);
            }}
            className="text-[13px] font-bold text-ink underline decoration-ink/40 underline-offset-4 hover:decoration-ink"
          >
            Or type my details without a photo
          </button>
        </section>
      </div>

      {/* Right: the document stage. Idle shows the sample, busy shows the scan, then the form. */}
      <div className="lg:pt-2">
        {error ? (
          <div className="mb-3">
            <Flag flag={{ id: "unreadable", level: "amber", message: error }} />
          </div>
        ) : null}

        {showForm ? (
          <section className="pass rise p-5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-display text-[20px] font-bold">Check your details</h2>
              {result ? <StateLabel kind={result.source === "live" ? "live" : "saved_example"} /> : null}
            </div>
            {result?.source === "live" ? (
              <p className="mt-1 text-[12.5px] text-muted">
                Read by {result.model} in {(result.ms / 1000).toFixed(1)} s. Fields the model was less sure about are highlighted.
                Edit anything that is wrong.
              </p>
            ) : result ? (
              <p className="mt-1 text-[12.5px] text-muted">
                The AI service did not answer, so these are the saved details of the synthetic sample letter. Edit anything that
                is wrong.
              </p>
            ) : (
              <p className="mt-1 text-[12.5px] text-muted">Type your details. Only your first name is sent to the AI model.</p>
            )}

            <div className="mt-3 space-y-2">
              {flags.map((f) => (
                <Flag key={f.id} flag={f} />
              ))}
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
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
            <button disabled={!ready} onClick={createPlan} className="btn btn-stamp mt-4 w-full px-4 py-4 text-[15px]">
              Create my arrival plan
              <ArrowRight size={18} weight="bold" />
            </button>
            {result ? (
              <figure className="mt-4 border-t border-dashed border-ink/30 pt-3">
                <figcaption className="mb-2 font-mono text-[9.5px] font-bold tracking-widest text-muted uppercase">The document Dalil read</figcaption>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview} alt="The document that was read" className="max-h-52 w-full rounded-md border border-ink/30 object-cover object-top" />
              </figure>
            ) : null}
          </section>
        ) : (
          <section className="rise" aria-live="polite">
            <div className={`ticket overflow-hidden p-2 ${busy ? "" : "lg:rotate-[1.2deg]"}`}>
              <div className={busy ? "scan" : ""}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={preview}
                  alt={busy ? "The document being read" : "Synthetic sample admission letter"}
                  className={`max-h-[62dvh] w-full rounded-md object-cover object-top ${busy ? "" : "opacity-90"}`}
                />
              </div>
            </div>
            {busy ? (
              <p className="mt-3 text-[14px] font-extrabold">
                Reading the letter with OpenAI vision <Dots />
                <span className="mt-0.5 block text-[12px] font-medium text-muted">The photo is read in memory and is not stored on our server.</span>
              </p>
            ) : (
              <p className="mt-3 text-[12.5px] text-muted">
                A synthetic sample letter. Tick the consent box and use it to try Dalil without your own document.
              </p>
            )}
          </section>
        )}
      </div>
    </div>
  );
}

function inputCls(low: boolean) {
  return `field ${low ? "field-check" : ""}`;
}

function Field({ label, low, hint, children }: { label: string; low?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 flex items-center justify-between font-mono text-[10px] font-bold tracking-wider text-muted uppercase">
        {label}
        {low ? <span className="text-gold">Please check</span> : null}
      </span>
      {children}
      {hint ? <span className="mt-1 block text-[11px] text-muted">{hint}</span> : null}
    </label>
  );
}

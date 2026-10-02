"use client";

import { useRef, useState } from "react";
import { Dots, Flag, StateLabel } from "@/components/ui";
import { computeFlags } from "@/lib/checks";
import { DalilError, SAMPLES, extractFromFile, extractSample } from "@/lib/client";
import type { CheckFlag, ExtractResponse } from "@/lib/types";

/** Passport check inside step K03. The model reads the expiry date; the rule is applied in code. */
export default function PassportCheck({ arrivalDate }: { arrivalDate: string }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [sample, setSample] = useState(false);
  const [result, setResult] = useState<ExtractResponse | null>(null);
  const [flags, setFlags] = useState<CheckFlag[]>([]);
  const [error, setError] = useState("");

  async function run(job: () => Promise<ExtractResponse>, isSample: boolean) {
    setBusy(true);
    setSample(isSample);
    setError("");
    setResult(null);
    setFlags([]);
    try {
      const r = await job();
      setResult(r);
      setFlags(computeFlags(r.extraction, "passport", arrivalDate));
    } catch (e) {
      setError(e instanceof DalilError ? e.message : "The passport could not be read. Check the expiry date yourself.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-3 space-y-2.5 rounded-xl border border-dashed border-teal bg-teal-soft/40 p-3">
      <p className="text-[12.5px] font-extrabold text-teal">Check your passport against this rule</p>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (f) run(() => extractFromFile(f, "passport"), false);
        }}
      />
      <div className="grid grid-cols-2 gap-2">
        <button
          disabled={busy}
          onClick={() => fileRef.current?.click()}
          className="rounded-xl bg-teal px-2 py-2.5 text-[12.5px] font-extrabold text-white disabled:opacity-40"
        >
          Scan passport
        </button>
        <button
          disabled={busy}
          onClick={() => run(() => extractSample("passport"), true)}
          className="rounded-xl border-2 border-teal px-2 py-2.5 text-[12.5px] font-extrabold text-teal disabled:opacity-40"
        >
          Use sample passport
        </button>
      </div>
      {busy ? (
        <div aria-live="polite">
          {sample ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={SAMPLES.passport.image} alt="Synthetic sample passport" className="mb-2 w-full rounded-lg border border-line" />
          ) : null}
          <p className="text-[12.5px] font-bold">
            Reading the expiry date <Dots />
          </p>
        </div>
      ) : null}
      {error ? <Flag flag={{ id: "unreadable", level: "amber", message: error }} /> : null}
      {result ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[11.5px] text-muted">
              Expiry read: <strong className="text-ink">{result.extraction.passport_expiry || "not found"}</strong>
            </p>
            <StateLabel kind={result.source === "live" ? "live" : "saved_example"} />
          </div>
          {flags.map((f) => (
            <Flag key={f.id} flag={f} />
          ))}
          <p className="text-[10.5px] leading-snug text-muted">
            Dalil reads no passport number and no date of birth. The date rule is applied in code, not by the AI model.
          </p>
        </div>
      ) : null}
    </div>
  );
}

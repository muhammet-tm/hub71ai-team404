"use client";

import { useRef, useState } from "react";
import { Camera, IdentificationCard } from "@phosphor-icons/react";
import { Dots, Flag, StateLabel } from "@/components/ui";
import { computeFlags } from "@/lib/checks";
import { DalilError, SAMPLES, extractFromFile, extractSample } from "@/lib/client";
import type { CheckFlag, ExtractResponse } from "@/lib/types";

/** Passport check inside step K03. The model reads the expiry date; the rule is applied in code. */
export default function PassportCheck({ arrivalDate }: { arrivalDate: string }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState("");
  const [result, setResult] = useState<ExtractResponse | null>(null);
  const [flags, setFlags] = useState<CheckFlag[]>([]);
  const [error, setError] = useState("");

  async function run(job: () => Promise<ExtractResponse>, image: string) {
    setBusy(true);
    setPreview(image);
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
    <div className="mt-3 space-y-2.5 rounded-lg border-[1.5px] border-dashed border-ink bg-paper/70 p-3">
      <p className="text-[12.5px] font-extrabold">Check your passport against this rule</p>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (f) run(() => extractFromFile(f, "passport"), URL.createObjectURL(f));
        }}
      />
      <div className="grid gap-2 sm:grid-cols-2 sm:max-w-md">
        <button disabled={busy} onClick={() => fileRef.current?.click()} className="btn btn-primary px-2 py-2.5 text-[12.5px]">
          <Camera size={15} weight="bold" />
          Scan passport
        </button>
        <button disabled={busy} onClick={() => run(() => extractSample("passport"), SAMPLES.passport.image)} className="btn btn-ghost px-2 py-2.5 text-[12.5px]">
          <IdentificationCard size={15} weight="bold" />
          Use sample passport
        </button>
      </div>
      {busy ? (
        <div aria-live="polite">
          <div className="scan rounded-md border border-ink/30 sm:max-w-md">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="The passport being read" className="max-h-44 w-full object-cover object-top sm:max-w-md" />
          </div>
          <p className="mt-2 text-[12.5px] font-bold">
            Reading the expiry date <Dots />
          </p>
        </div>
      ) : null}
      {error ? <Flag flag={{ id: "unreadable", level: "amber", message: error }} /> : null}
      {result ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[12px] text-muted">
              Expiry read: <strong className="font-mono text-ink">{result.extraction.passport_expiry || "not found"}</strong>
            </p>
            <StateLabel kind={result.source === "live" ? "live" : "saved_example"} />
          </div>
          {flags.map((f) => (
            <Flag key={f.id} flag={f} />
          ))}
          <p className="text-[11px] leading-snug text-muted">
            Dalil reads no passport number and no date of birth. The date rule is applied in code, not by the AI model.
          </p>
        </div>
      ) : null}
    </div>
  );
}

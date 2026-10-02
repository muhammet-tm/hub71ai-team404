"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { StatusBadge } from "@/components/ui";
import { REJECTED } from "@/lib/dataset";
import { KB } from "@/lib/kb";
import { store } from "@/lib/storage";

type Info = { text: string; vision: string; moderation: string; transcribe: string; speech: string };

function modelRows(i: Info | null): [string, string][] {
  const text = i?.text || "OpenAI text model";
  return [
    ["Reads the admission letter and the passport", `${i?.vision || "OpenAI vision model"} · vision`],
    ["Personalizes and translates the plan", `${text} · structured`],
    ["Answers questions from the verified sources", `${text} · streaming`],
    ["Screens every question", i?.moderation || "omni-moderation-latest"],
    ["Turns speech into text", i?.transcribe || "gpt-transcribe"],
    ["Reads answers aloud", i?.speech || "gpt-4o-mini-tts"],
  ];
}

export default function AboutPage() {
  const router = useRouter();
  const [info, setInfo] = useState<Info | null>(null);
  useEffect(() => {
    fetch("/api/info")
      .then((r) => (r.ok ? r.json() : null))
      .then(setInfo)
      .catch(() => {});
  }, []);
  return (
    <div className="space-y-6">
      <section className="rise pt-2">
        <h1 className="text-[24px] leading-tight font-extrabold tracking-tight">Sources, dataset, and privacy</h1>
        <p className="mt-1 text-[13px] leading-snug text-muted">
          Dalil is a hackathon prototype built on 2 October 2026. It is a guide, not an authority. It submits no application and
          gives no legal advice.
        </p>
      </section>

      <section>
        <h2 className="text-[15px] font-extrabold">How Dalil stays accurate</h2>
        <ul className="mt-2 space-y-1.5 text-[13px] leading-snug">
          <li>The AI model selects steps and writes in your language. It never writes a fee, a deadline, or a link.</li>
          <li>Every fact, fee, and link on screen comes from the {KB.entries.length} entries listed below.</li>
          <li>When no entry covers a question, Dalil says so and names the office to ask.</li>
          <li>Dates on the plan are a suggested order unless a card says &quot;Sourced deadline&quot;.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-[15px] font-extrabold">The dataset: {KB.entries.length} verified arrival steps</h2>
        <p className="mt-1 text-[12px] leading-snug text-muted">
          Each status comes from an independent fact-check of the team&apos;s research against the cited page on 2 October 2026.
          Several official pages could not be opened on that day, and facts from Abu Dhabi University come from a form dated 2018.
        </p>
        <div className="mt-3 grid grid-cols-4 gap-2 text-center">
          {(
            [
              [KB.entries.length, "entries"],
              [KB.entries.filter((e) => e.status === "confirmed").length, "confirmed"],
              [KB.entries.filter((e) => e.status === "partially_confirmed").length, "partly"],
              [KB.entries.filter((e) => e.status === "dated_2018").length, "dated 2018"],
            ] as [number, string][]
          ).map(([n, label]) => (
            <div key={label} className="rounded-xl border border-line bg-sand/50 px-1 py-2">
              <p className="text-[20px] leading-none font-extrabold text-teal">{n}</p>
              <p className="mt-1 text-[10.5px] font-bold text-muted">{label}</p>
            </div>
          ))}
        </div>
        <a
          href="/api/dataset"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 block rounded-xl border-2 border-teal px-3 py-2.5 text-center text-[13px] font-extrabold text-teal"
        >
          Open the full dataset (JSON) ↗
        </a>
        <ul className="mt-3 divide-y divide-line rounded-2xl border border-line">
          {KB.entries.map((e) => (
            <li key={e.id} className="px-3 py-2.5">
              <div className="flex items-start justify-between gap-2">
                <p className="text-[12.5px] font-bold">
                  {e.id} · {e.title}
                </p>
                <StatusBadge status={e.status} />
              </div>
              <a href={e.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-[11.5px] font-semibold text-teal underline underline-offset-2">
                {e.sourceName} ↗
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-gold bg-gold-soft/60 p-4">
        <h2 className="text-[15px] font-extrabold">What the fact-check rejected</h2>
        <p className="mt-1 text-[12px] leading-snug text-muted">
          Building this dataset exposed a problem of its own: some official pages a new student needs could not be opened, and the
          university&apos;s public visa form dates from 2018. These {REJECTED.length} claims were kept out of Dalil.
        </p>
        <ul className="mt-2 space-y-2">
          {REJECTED.map((r) => (
            <li key={r.topic} className="text-[12.5px] leading-snug">
              <span className="font-bold">{r.topic}.</span> <span className="text-muted">{r.reason}</span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-[15px] font-extrabold">What Dalil does not cover</h2>
        <ul className="mt-2 space-y-1.5 text-[13px] leading-snug">
          <li>Bank accounts, current university fees, and the entry permit procedure. No official page that the team could open confirms them.</li>
          <li>Government fees for the student visa, the medical test, and the Emirates ID.</li>
          <li>Whether a document is genuine, and whether you are eligible for a visa.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-[15px] font-extrabold">OpenAI models at work</h2>
        <ul className="mt-2 divide-y divide-line rounded-2xl border border-line">
          {modelRows(info).map(([what, model]) => (
            <li key={what} className="flex items-center justify-between gap-3 px-3 py-2.5 text-[12.5px]">
              <span>{what}</span>
              <code className="shrink-0 rounded bg-sand px-1.5 py-0.5 text-[11px] font-bold">{model}</code>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-[15px] font-extrabold">Your data</h2>
        <ul className="mt-2 space-y-1.5 text-[13px] leading-snug">
          <li>Our server stores no documents, no profiles, and no conversations.</li>
          <li>Your profile, plan, and chat stay in this browser on this device.</li>
          <li>Dalil reads no passport number and no date of birth, and sends only your first name to the AI model.</li>
          <li>Photos and questions are sent to OpenAI, outside the UAE, to be processed. OpenAI may keep abuse-monitoring logs for up to 30 days.</li>
        </ul>
        <button
          onClick={() => {
            store.deleteAll();
            router.push("/");
          }}
          className="mt-3 w-full rounded-2xl border-2 border-red px-4 py-3 text-[14px] font-extrabold text-red"
        >
          Delete my data from this device
        </button>
      </section>

      <section className="text-[12px] text-muted">
        Found a wrong or outdated step? Tell the Dalil team or your university&apos;s international office, and always confirm
        with the official source linked on the step.
      </section>

      <section className="rounded-2xl bg-ink p-4 text-white">
        <p className="text-[11px] font-bold tracking-widest text-white/60 uppercase">Built by</p>
        <p className="mt-1 text-[18px] font-extrabold">Team 404</p>
        <p className="text-[12.5px] font-semibold text-white/80">International students building for the next ones to arrive</p>
        <p className="mt-2 text-[13.5px] font-bold">Muhammet Yalkapov · Sulaymon Sadullo</p>
        <p className="mt-1 text-[11.5px] text-white/60">Hub71+ AI Hackathon supported by OpenAI, Abu Dhabi, 2 October 2026</p>
      </section>
    </div>
  );
}

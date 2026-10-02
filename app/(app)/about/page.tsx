"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Trash } from "@phosphor-icons/react";
import { StatusStamp } from "@/components/ui";
import { REJECTED } from "@/lib/dataset";
import { KB } from "@/lib/kb";
import { store } from "@/lib/storage";

type Info = { text: string; vision: string; moderation: string; transcribe: string; speech: string };

function modelRows(i: Info | null): [string, string][] {
  const text = i?.text || "OpenAI text model";
  return [
    ["Reads the admission letter and the passport", `${i?.vision || "OpenAI vision model"}, vision`],
    ["Personalizes and translates the plan", `${text}, structured`],
    ["Answers questions from the verified sources", `${text}, streaming`],
    ["Screens every question", i?.moderation || "omni-moderation-latest"],
    ["Turns speech into text", i?.transcribe || "gpt-4o-transcribe"],
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

  const count = (s: string) => KB.entries.filter((e) => e.status === s).length;
  const stats: [number, string][] = [
    [KB.entries.length, "entries"],
    [count("confirmed"), "confirmed"],
    [count("partially_confirmed"), "partly confirmed"],
    [count("dated_2018"), "dated 2018"],
  ];

  return (
    <div className="space-y-7">
      <section className="rise">
        <h1 className="font-display text-[30px] leading-tight font-bold tracking-tight lg:text-[40px]">Sources, dataset, and privacy</h1>
        <p className="mt-2 max-w-[70ch] text-[14px] leading-relaxed text-ink/80">
          Dalil is a hackathon prototype built on 2 October 2026. It is a guide, not an authority. It submits no application and
          gives no legal advice.
        </p>
      </section>

      <div className="grid grid-cols-1 gap-7 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
        {/* The dataset */}
        <section className="pass p-5">
          <h2 className="font-display text-[20px] font-bold">The dataset: {KB.entries.length} verified arrival steps</h2>
          <p className="mt-1 text-[12.5px] leading-snug text-muted">
            Each status comes from an independent fact-check of the team&apos;s research against the cited page on 2 October
            2026. Several official pages could not be opened on that day, and facts from Abu Dhabi University come from a form
            dated 2018.
          </p>
          <div className="mt-4 grid grid-cols-4 gap-2.5 text-center">
            {stats.map(([n, label], i) => (
              <div key={label} className="rise rounded-lg border-[1.5px] border-ink bg-white px-1 py-2.5" style={{ "--i": i } as React.CSSProperties}>
                <p className="font-mono text-[26px] leading-none font-bold">{n}</p>
                <p className="mt-1.5 font-mono text-[9.5px] font-bold tracking-wide text-muted uppercase">{label}</p>
              </div>
            ))}
          </div>
          <a href="/api/dataset" target="_blank" rel="noopener noreferrer" className="btn btn-ghost mt-4 w-full px-3 py-3 text-[13.5px]">
            Open the full dataset (JSON)
            <ArrowUpRight size={15} weight="bold" />
          </a>
          <ul className="mt-4 divide-y divide-dashed divide-ink/30">
            {KB.entries.map((e) => (
              <li key={e.id} className="flex items-center gap-3 py-2.5">
                <span className="w-9 shrink-0 font-mono text-[12px] font-bold">{e.id}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] leading-snug font-bold">{e.title}</p>
                  <a
                    href={e.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-muted underline decoration-line underline-offset-2 hover:text-ink"
                  >
                    {e.sourceName}
                    <ArrowUpRight size={11} weight="bold" />
                  </a>
                </div>
                <StatusStamp status={e.status} />
              </li>
            ))}
          </ul>
        </section>

        <div className="space-y-5">
          <section className="ticket p-4">
            <h2 className="font-display text-[17px] font-bold">How Dalil stays accurate</h2>
            <ul className="mt-2 space-y-1.5 text-[13px] leading-snug">
              <li>The AI model selects steps and writes in your language. It never writes a fee, a deadline, or a link.</li>
              <li>Every fact, fee, and link on screen comes from the {KB.entries.length} entries in the dataset.</li>
              <li>When no entry covers a question, Dalil gives general guidance, labels it as unverified, and names the office to confirm it.</li>
              <li>Dates on the plan are a suggested order unless a card says &quot;Sourced deadline&quot;.</li>
            </ul>
          </section>

          <section className="rounded-xl border-[1.5px] border-stamp bg-stamp-soft/60 p-4">
            <h2 className="font-display text-[17px] font-bold">What the fact-check rejected</h2>
            <p className="mt-1 text-[12.5px] leading-snug text-ink/75">
              Building this dataset exposed a problem of its own: some official pages a new student needs could not be opened,
              and the university&apos;s public visa form dates from 2018. These {REJECTED.length} claims were kept out of Dalil.
            </p>
            <ul className="mt-2.5 space-y-2">
              {REJECTED.map((r) => (
                <li key={r.topic} className="text-[12.5px] leading-snug">
                  <span className="font-extrabold">{r.topic}.</span> <span className="text-ink/75">{r.reason}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="ticket p-4">
            <h2 className="font-display text-[17px] font-bold">What Dalil does not cover</h2>
            <ul className="mt-2 space-y-1.5 text-[13px] leading-snug">
              <li>How to open a bank account, current university fees, and the entry permit procedure.</li>
              <li>Government fees for the student visa, the medical test, and the Emirates ID.</li>
              <li>Whether a document is genuine, and whether you are eligible for a visa.</li>
            </ul>
          </section>

          <section className="ticket p-4">
            <h2 className="font-display text-[17px] font-bold">OpenAI models at work</h2>
            <ul className="mt-2 divide-y divide-dashed divide-ink/30">
              {modelRows(info).map(([what, model]) => (
                <li key={what} className="flex items-center justify-between gap-3 py-2 text-[12.5px]">
                  <span>{what}</span>
                  <code className="shrink-0 rounded border border-ink/30 bg-white px-1.5 py-0.5 font-mono text-[10.5px] font-bold">{model}</code>
                </li>
              ))}
            </ul>
          </section>

          <section className="ticket p-4">
            <h2 className="font-display text-[17px] font-bold">Your data</h2>
            <ul className="mt-2 space-y-1.5 text-[13px] leading-snug">
              <li>Our server stores no documents, no profiles, and no conversations.</li>
              <li>Your profile, plan, and chat stay in this browser on this device.</li>
              <li>Dalil reads no passport number and no date of birth, and sends only your first name to the AI model.</li>
              <li>
                Photos and questions are sent to OpenAI, outside the UAE, to be processed. OpenAI may keep abuse-monitoring logs
                for up to 30 days.
              </li>
            </ul>
            <button
              onClick={() => {
                store.deleteAll();
                router.push("/start");
              }}
              className="btn mt-3 w-full border-stamp bg-white px-4 py-3 text-[13.5px] text-stamp hover:shadow-[3px_3px_0_var(--stamp)]"
            >
              <Trash size={16} weight="bold" />
              Delete my data from this device
            </button>
          </section>

          <section className="rounded-xl bg-ink p-4 text-card">
            <p className="font-mono text-[10px] font-bold tracking-widest text-gold-bright uppercase">Built by</p>
            <p className="mt-1 font-display text-[20px] font-bold">Team 404</p>
            <p className="text-[12.5px] font-semibold text-card/80">International students building for the next ones to arrive</p>
            <p className="mt-2 text-[13.5px] font-bold">Muhammet Yalkapov and Sulaymon Sadullo</p>
            <p className="mt-1 text-[11.5px] text-card/60">Hub71+ AI Hackathon supported by OpenAI, Abu Dhabi, 2 October 2026</p>
          </section>
        </div>
      </div>
    </div>
  );
}

import Link from "next/link";
import { ArrowRight, Camera, ChatsCircle, Ticket } from "@phosphor-icons/react/dist/ssr";
import { Logo, PlaneMark } from "@/components/Logo";
import { REJECTED } from "@/lib/dataset";
import { KB } from "@/lib/kb";
import { LANG_LABELS } from "@/lib/config";

const STEPS = [
  { code: "01", icon: Camera, title: "Scan your letter", text: "Photograph your admission letter. OpenAI vision reads it, and you confirm every field." },
  { code: "02", icon: Ticket, title: "Get your plan", text: "Every step from visa to Emirates ID, in order, each stamped with its official source." },
  { code: "03", icon: ChatsCircle, title: "Ask anything", text: "Answers come from verified sources only. When none exists, Dalil says so." },
];

export default function LandingPage() {
  return (
    <div className="overflow-x-clip">
      <header className="mx-auto flex w-full max-w-[1360px] items-center justify-between px-6 py-5 lg:px-12">
        <Logo size={44} />
        <nav className="flex items-center gap-2 sm:gap-4" aria-label="Main">
          <Link href="/about" className="hidden px-2 py-2 text-[14px] font-bold underline decoration-ink/30 underline-offset-4 hover:decoration-ink sm:block">
            Sources and dataset
          </Link>
          <Link href="/start" className="btn btn-primary px-4 py-2.5 text-[14px]">
            Open Dalil
          </Link>
        </nav>
      </header>

      {/* Hero: fills the first screen */}
      <section className="mx-auto grid min-h-[calc(100dvh-92px)] w-full max-w-[1360px] grid-cols-1 items-center gap-10 px-6 pt-4 pb-14 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-6 lg:px-12">
        <div className="rise">
          <h1 className="font-display text-[48px] leading-[0.96] font-bold tracking-tight sm:text-[72px] xl:text-[96px]">
            Arrive in
            <br />
            Abu Dhabi
            <br />
            <span className="text-stamp">with a plan.</span>
          </h1>
          <p className="mt-6 max-w-[46ch] text-[17px] leading-relaxed text-ink/80 xl:text-[19px]">
            Photograph your admission letter. Dalil turns it into a personal arrival plan, with the official source on every step.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="/start" className="btn btn-stamp px-6 py-4 text-[16px]">
              Start with my letter
              <ArrowRight size={19} weight="bold" />
            </Link>
            <Link href="/about" className="btn btn-ghost px-6 py-4 text-[16px]">
              See the dataset
            </Link>
          </div>
        </div>

        {/* A boarding pass and the paper plane: the product's own objects, at scale */}
        <div className="relative mx-auto w-full max-w-[560px] pt-36 pb-6 sm:pt-52" aria-hidden>
          <div className="absolute top-0 right-0 z-10 origin-top-right scale-[0.68] text-ink sm:right-4 sm:scale-100">
            <div className="fly-in">
              <PlaneMark size={240} />
            </div>
          </div>
          <div className="pass rise overflow-hidden lg:-rotate-2" style={{ "--i": 2 } as React.CSSProperties}>
            <div className="flex items-center gap-4 px-5 py-5 sm:gap-6 sm:px-7">
              <div>
                <p className="font-mono text-[10px] font-bold tracking-widest text-muted uppercase">From</p>
                <p className="font-mono text-[40px] leading-none font-bold tracking-tight sm:text-[54px]">HOME</p>
              </div>
              <div className="route flex-1" />
              <div>
                <p className="font-mono text-[10px] font-bold tracking-widest text-muted uppercase">To</p>
                <p className="font-mono text-[40px] leading-none font-bold tracking-tight sm:text-[54px]">AUH</p>
              </div>
            </div>
            <div className="grid grid-cols-3 border-t-2 border-dashed border-ink">
              {[
                ["Before you fly", "Visa, documents"],
                ["First week", "Medical, Emirates ID"],
                ["Build a future", "Golden Visa"],
              ].map(([a, b], i) => (
                <div key={a} className={`px-4 py-3.5 sm:px-5 ${i ? "border-l-2 border-dashed border-ink" : ""}`}>
                  <p className="font-mono text-[9.5px] font-bold tracking-widest text-muted uppercase">{a}</p>
                  <p className="mt-0.5 text-[12.5px] leading-snug font-bold">{b}</p>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-3 border-t-[1.5px] border-ink bg-white/60 px-5 py-4 sm:px-7">
              <span className="rubber stamp-in text-ok" style={{ "--r": "-5deg", "--i": 6 } as React.CSSProperties}>
                Confirmed
              </span>
              <span className="rubber stamp-in text-stamp" style={{ "--r": "4deg", "--i": 9 } as React.CSSProperties}>
                Dated 2018
              </span>
              <span className="text-[12px] font-semibold text-muted">Every step shows how well its source checked out.</span>
            </div>
          </div>
        </div>
      </section>

      {/* How it works: three tickets */}
      <section className="mx-auto w-full max-w-[1360px] px-6 pb-14 lg:px-12">
        <ol className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {STEPS.map((s) => (
            <li key={s.code} className="ticket flex">
              <div className="flex w-[64px] shrink-0 flex-col items-center justify-center gap-2 py-5">
                <span className="font-mono text-[13px] font-bold">{s.code}</span>
                <s.icon size={24} weight="bold" className="text-flame" />
              </div>
              <div className="perforation flex-1 px-5 py-5">
                <h2 className="font-display text-[21px] font-bold">{s.title}</h2>
                <p className="mt-1.5 text-[14px] leading-relaxed text-ink/80">{s.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* The dataset, in three numbers */}
      <section className="bg-ink text-card">
        <div className="mx-auto grid w-full max-w-[1360px] grid-cols-1 gap-8 px-6 py-12 sm:grid-cols-3 lg:px-12">
          {[
            [String(KB.entries.length), "arrival steps, each traced to an official page and fact-checked"],
            [String(REJECTED.length), "claims rejected, because the official page could not be opened"],
            [String(Object.keys(LANG_LABELS).length), "languages for the plan and the answers"],
          ].map(([n, label]) => (
            <div key={label}>
              <p className="font-mono text-[56px] leading-none font-bold text-flame">{n}</p>
              <p className="mt-2 max-w-[30ch] text-[14.5px] leading-snug text-card/80">{label}</p>
            </div>
          ))}
        </div>
        <div className="mx-auto flex w-full max-w-[1360px] flex-wrap items-center justify-between gap-3 border-t border-card/15 px-6 py-5 text-[12px] text-card/60 lg:px-12">
          <span>Team 404, Hub71+ AI Hackathon supported by OpenAI, Abu Dhabi, 2 October 2026</span>
          <span>AI-generated guidance. Not legal advice. Sample documents are synthetic.</span>
        </div>
      </section>
    </div>
  );
}

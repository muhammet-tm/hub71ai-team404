"use client";

import { useEffect, useRef, useState } from "react";
import { Microphone, PaperPlaneRight, Play, Stop } from "@phosphor-icons/react";
import { Dots, FactCard, HandoffLink, StateLabel } from "@/components/ui";
import { errorMessage } from "@/lib/client";
import { ASK_FIRST_TOKEN_TIMEOUT_MS, HISTORY_TURNS, LANG_LABELS, QUESTION_CAP, RECORDING_CAP_MS, SPEECH_LANGS, SPEECH_TEXT_CAP } from "@/lib/config";
import { byId, keywordMatch } from "@/lib/kb";
import { parseAnswer, speechText } from "@/lib/markers";
import { store } from "@/lib/storage";
import type { ChatTurn, KbEntry, Lang, Profile } from "@/lib/types";

type Message = {
  role: "user" | "assistant";
  raw: string; // assistant text with markers, or the user's question
  state?: "streaming" | "done" | "offline" | "blocked";
  offline?: KbEntry[];
  audioUrl?: string;
  audioState?: "loading" | "ready" | "failed";
};

const SUGGESTIONS: Record<Lang, string[]> = {
  en: ["Do I need an Emirates ID, and where do I apply?", "How do I get from the airport to the city?", "How do I open a bank account?"],
  ru: ["Нужен ли мне Emirates ID и где его оформить?", "Как добраться из аэропорта в город?", "Как открыть банковский счёт?"],
  es: ["¿Necesito una Emirates ID y dónde la solicito?", "¿Cómo llego del aeropuerto a la ciudad?", "¿Cómo abro una cuenta bancaria?"],
  pt: ["Preciso de uma Emirates ID e onde a solicito?", "Como vou do aeroporto para a cidade?", "Como abro uma conta bancária?"],
  zh: ["我需要办理 Emirates ID 吗？在哪里申请？", "从机场怎么去市区？", "怎么开银行账户？"],
  ja: ["Emirates ID は必要ですか。どこで申請しますか。", "空港から市内へはどう行きますか。", "銀行口座はどう開設しますか。"],
};

/**
 * The grounded assistant. "page" fills the Ask screen; "dock" sits beside the plan on wide screens
 * and scrolls inside its own panel.
 */
export default function AskPanel({ variant }: { variant: "page" | "dock" }) {
  const dock = variant === "dock";
  const [profile, setProfile] = useState<Profile | null>(null);
  const [lang, setLang] = useState<Lang>("en");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [notice, setNotice] = useState("");
  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const stopTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const p = store.getProfile();
    // Restore this device's session after mount (localStorage is unavailable during server render).
    if (p) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setProfile(p);
      setLang(p.language);
    }
    setMessages(store.getChat().map((t) => ({ role: t.role, raw: t.content, state: "done" })));
  }, []);

  useEffect(() => {
    if (!messages.length) return;
    if (dock) listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
    else endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages, dock]);

  function patchLast(patch: Partial<Message>) {
    setMessages((m) => (m.length ? [...m.slice(0, -1), { ...m[m.length - 1], ...patch }] : m));
  }

  async function ask(question: string) {
    const q = question.trim();
    if (!q || busy) return;
    setNotice("");
    setInput("");
    setBusy(true);
    const history: ChatTurn[] = messages
      .filter((m) => m.state === "done" || m.role === "user")
      .slice(-HISTORY_TURNS)
      .map((m) => ({ role: m.role, content: m.role === "assistant" ? parseAnswer(m.raw, true).text : m.raw }));
    setMessages((m) => [...m, { role: "user", raw: q }, { role: "assistant", raw: "", state: "streaming" }]);

    const controller = new AbortController();
    const firstToken = setTimeout(() => controller.abort(), ASK_FIRST_TOKEN_TIMEOUT_MS);
    let raw = "";
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: q,
          language: lang,
          profile: profile ? { country: profile.country, university: profile.university, arrivalDate: profile.arrivalDate } : undefined,
          history,
        }),
        signal: controller.signal,
      });
      if (res.status === 422) {
        clearTimeout(firstToken);
        patchLast({ state: "blocked", raw: await errorMessage(res) });
        return;
      }
      if (!res.ok || !res.body) throw new Error("ask failed");

      if (res.headers.get("Content-Type")?.includes("application/json")) {
        // Non-streamed mode (ASK_STREAM=0): rebuild the same markers from the structured answer.
        clearTimeout(firstToken);
        const j = (await res.json()) as { answer: string; kb_ids: string[]; handoff: string };
        raw = j.answer + j.kb_ids.map((k) => ` [${k}]`).join("") + (j.handoff && j.handoff !== "none" ? ` [H:${j.handoff}]` : "");
      } else {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          clearTimeout(firstToken);
          raw += decoder.decode(value, { stream: true });
          patchLast({ raw });
        }
      }
      clearTimeout(firstToken);
      if (raw.includes("[ERROR]") || !raw.trim()) throw new Error("stream failed");
      patchLast({ raw, state: "done" });
      store.setChat([...history, { role: "user", content: q }, { role: "assistant", content: raw }]);
    } catch {
      clearTimeout(firstToken);
      // Honest fallback: keyword matches from the verified file, labeled as offline.
      patchLast({ state: "offline", offline: keywordMatch(q), raw: "" });
    } finally {
      setBusy(false);
    }
  }

  async function listen(index: number) {
    const msg = messages[index];
    if (!msg || msg.audioState === "loading") return;
    setMessages((m) => m.map((x, i) => (i === index ? { ...x, audioState: "loading" } : x)));
    try {
      const res = await fetch("/api/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: speechText(msg.raw, SPEECH_TEXT_CAP), language: lang }),
      });
      if (!res.ok) throw new Error("speak failed");
      const url = URL.createObjectURL(await res.blob());
      setMessages((m) => m.map((x, i) => (i === index ? { ...x, audioUrl: url, audioState: "ready" } : x)));
    } catch {
      setMessages((m) => m.map((x, i) => (i === index ? { ...x, audioState: "failed" } : x)));
    }
  }

  async function startRecording() {
    setNotice("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      chunks.current = [];
      rec.ondataavailable = (e) => e.data.size && chunks.current.push(e.data);
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        setRecording(false);
        setTranscribing(true);
        try {
          const blob = new Blob(chunks.current, { type: rec.mimeType || "audio/webm" });
          const form = new FormData();
          form.append("audio", blob, "question");
          const res = await fetch("/api/transcribe", { method: "POST", body: form });
          if (!res.ok) throw new Error(await errorMessage(res));
          const j = (await res.json()) as { text: string };
          // The transcript lands in the editable box first; the student reads it and sends it.
          setInput(j.text.slice(0, QUESTION_CAP));
        } catch {
          setNotice("The recording could not be transcribed. Type your question instead.");
        } finally {
          setTranscribing(false);
        }
      };
      recorder.current = rec;
      rec.start();
      setRecording(true);
      stopTimer.current = setTimeout(() => rec.state === "recording" && rec.stop(), RECORDING_CAP_MS);
    } catch {
      setNotice("The microphone is not available. Allow microphone access or type your question.");
    }
  }

  function stopRecording() {
    if (stopTimer.current) clearTimeout(stopTimer.current);
    if (recorder.current?.state === "recording") recorder.current.stop();
  }

  const canVoice = SPEECH_LANGS.includes(lang);

  return (
    <div className={dock ? "pass flex h-full min-h-0 flex-col overflow-hidden" : "mx-auto flex max-w-[860px] flex-col"}>
      <div className={dock ? "border-b-[1.5px] border-ink px-4 py-3.5" : "rise"}>
        <div className="flex items-end justify-between gap-2">
          <h2 className={`font-display font-bold tracking-tight ${dock ? "text-[20px]" : "text-[30px] lg:text-[40px]"}`}>Ask Dalil</h2>
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value as Lang)}
            aria-label="Answer language"
            className="rounded-lg border-[1.5px] border-ink bg-white px-2.5 py-1.5 text-[12.5px] font-bold"
          >
            {(Object.keys(LANG_LABELS) as Lang[]).map((l) => (
              <option key={l} value={l}>
                {LANG_LABELS[l]}
              </option>
            ))}
          </select>
        </div>
        <p className={`mt-1 leading-snug text-muted ${dock ? "text-[12px]" : "max-w-[60ch] text-[14px]"}`}>
          Dalil answers from verified sources first. Anything beyond them is labeled as general guidance, with the office to confirm it.
        </p>
      </div>

      <div ref={listRef} className={dock ? "min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4" : "mt-5 space-y-3 pb-6"} aria-live="polite">
        {messages.length === 0 ? (
          <div className="space-y-2">
            {SUGGESTIONS[lang].map((s, i) => (
              <button
                key={s}
                onClick={() => ask(s)}
                style={{ "--i": i } as React.CSSProperties}
                className="rise block w-full rounded-lg border-[1.5px] border-ink bg-card px-3.5 py-3 text-left text-[13.5px] font-bold transition-transform duration-150 hover:-translate-y-0.5 hover:shadow-[3px_3px_0_var(--ink)]"
              >
                {s}
              </button>
            ))}
          </div>
        ) : null}

        {messages.map((m, i) =>
          m.role === "user" ? (
            <div key={i} className="ml-8 rounded-xl rounded-br-sm bg-ink px-4 py-3 text-[14px] leading-snug font-semibold text-card">
              {m.raw}
            </div>
          ) : (
            <Answer key={i} msg={m} canVoice={canVoice} onListen={() => listen(i)} />
          ),
        )}

        {messages.length > 0 ? (
          <button
            onClick={() => {
              setMessages([]);
              store.setChat([]);
            }}
            className="text-[12px] font-bold text-muted underline underline-offset-2 hover:text-ink"
          >
            Clear this conversation
          </button>
        ) : null}
        <div ref={endRef} />
      </div>

      <div className={dock ? "border-t-[1.5px] border-ink bg-card p-3" : "sticky bottom-[56px] z-10 mt-2 bg-paper pt-2 pb-3 lg:bottom-0 lg:pb-5"}>
        {notice ? <p className="mb-2 rounded-lg border border-gold bg-gold-soft px-3 py-2 text-[12.5px] font-bold text-gold">{notice}</p> : null}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            ask(input);
          }}
          className={dock ? "" : "pass p-2.5"}
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value.slice(0, QUESTION_CAP))}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                ask(input);
              }
            }}
            rows={2}
            aria-label="Your question"
            placeholder={transcribing ? "Transcribing your question…" : recording ? "Listening. Press Stop when you finish." : "Type your question, or use the microphone"}
            className="w-full resize-none rounded-lg border-[1.5px] border-ink bg-white px-3 py-2 text-[14px] font-semibold outline-none placeholder:font-medium placeholder:text-muted focus:shadow-[3px_3px_0_var(--ink)]"
          />
          <div className="mt-2 flex items-center justify-between gap-2">
            {canVoice ? (
              <button
                type="button"
                onClick={recording ? stopRecording : startRecording}
                disabled={busy || transcribing}
                className={`btn px-3.5 py-2 text-[12.5px] ${recording ? "btn-stamp" : "btn-ghost"}`}
              >
                {recording ? <Stop size={15} weight="fill" /> : <Microphone size={15} weight="bold" />}
                {recording ? "Stop" : transcribing ? "Transcribing…" : "Speak"}
              </button>
            ) : (
              <span className="text-[11px] text-muted">Voice works in English and Russian</span>
            )}
            <span className="font-mono text-[10.5px] text-muted">
              {input.length}/{QUESTION_CAP}
            </span>
            <button type="submit" disabled={busy || !input.trim()} className="btn btn-primary px-4 py-2 text-[12.5px]">
              Send
              <PaperPlaneRight size={14} weight="fill" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Answer({ msg, canVoice, onListen }: { msg: Message; canVoice: boolean; onListen: () => void }) {
  if (msg.state === "blocked")
    return <div className="mr-6 rounded-xl rounded-bl-sm border-[1.5px] border-gold bg-gold-soft px-4 py-3 text-[13.5px] font-bold text-gold">{msg.raw}</div>;

  if (msg.state === "offline") {
    return (
      <div className="mr-2 space-y-2 rounded-xl rounded-bl-sm border-[1.5px] border-ink bg-white px-4 py-3">
        <StateLabel kind="offline" />
        {msg.offline?.length ? (
          <>
            <p className="text-[12.5px] text-muted">The AI service did not answer. These verified entries match your question:</p>
            {msg.offline.map((e) => (
              <FactCard key={e.id} entry={e} />
            ))}
          </>
        ) : (
          <p className="text-[13px]">The AI service did not answer, and no verified entry matches. Ask your university office.</p>
        )}
      </div>
    );
  }

  const streaming = msg.state === "streaming";
  const parsed = parseAnswer(msg.raw, !streaming);
  const cited = parsed.kbIds.map((id) => byId(id)).filter((e): e is KbEntry => !!e);
  const unverified = !streaming && cited.length === 0 && parsed.handoffs.length === 0 && !parsed.general;

  return (
    <div className="mr-2 space-y-2.5 rounded-xl rounded-bl-sm border-[1.5px] border-ink bg-white px-4 py-3">
      {parsed.text ? (
        <p className="text-[14px] leading-relaxed whitespace-pre-wrap">{parsed.text}</p>
      ) : (
        <p className="text-[13px] font-bold">
          Checking verified sources <Dots />
        </p>
      )}

      {unverified ? (
        <p className="rounded-lg border border-gold bg-gold-soft px-3 py-2 text-[12px] font-bold text-gold">
          Not verified against a source. Check with your university office.
        </p>
      ) : null}

      {!streaming && (parsed.general || (parsed.handoffs.length > 0 && cited.length === 0)) ? (
        <p className="rounded-lg border border-gold bg-gold-soft px-3 py-2 text-[12px] font-bold text-gold">
          {cited.length > 0
            ? "Part of this answer is general guidance, not from a verified source. Confirm it before you act."
            : "General guidance. No verified source covers this question, so confirm it before you act."}
        </p>
      ) : null}

      {parsed.handoffs.map((h) => (
        <HandoffLink key={h} handoff={h} />
      ))}

      {cited.length > 0 ? (
        <div className="space-y-2">
          <p className="font-mono text-[9.5px] font-bold tracking-widest text-muted uppercase">Official facts behind this answer</p>
          {cited.map((e) => (
            <FactCard key={e.id} entry={e} />
          ))}
        </div>
      ) : null}

      {!streaming ? (
        <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
          <span className="text-[10.5px] text-muted">AI-generated. Not legal advice.</span>
          {canVoice && parsed.text ? (
            msg.audioUrl ? (
              <div className="w-full">
                <audio src={msg.audioUrl} controls autoPlay className="h-9 w-full" />
                <span className="font-mono text-[10px] font-bold tracking-wide text-muted uppercase">AI-generated voice</span>
              </div>
            ) : (
              <button onClick={onListen} disabled={msg.audioState === "loading"} className="btn btn-ghost px-3 py-1.5 text-[12px]">
                <Play size={12} weight="fill" />
                {msg.audioState === "loading" ? "Preparing voice…" : msg.audioState === "failed" ? "Voice unavailable, retry" : "Listen (AI voice)"}
              </button>
            )
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

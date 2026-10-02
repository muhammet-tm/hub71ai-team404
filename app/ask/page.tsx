"use client";

import { useEffect, useRef, useState } from "react";
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
  ru: ["Нужен ли мне Emirates ID и где его оформить?", "Как добраться из аэропорта в город?", "Как открыть банковский счёт?"],
  en: ["Do I need an Emirates ID, and where do I apply?", "How do I get from the airport to the city?", "How do I open a bank account?"],
  tk: ["Emirates ID gerekmi we nirede almaly?", "Howa menzilinden şähere nädip barmaly?", "Bank hasabyny nädip açmaly?"],
};

export default function AskPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [lang, setLang] = useState<Lang>("ru");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [notice, setNotice] = useState("");
  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const stopTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const p = store.getProfile();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (p) {
      setProfile(p);
      setLang(p.language);
    }
    setMessages(store.getChat().map((t) => ({ role: t.role, raw: t.content, state: "done" })));
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

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

    const offline = () => patchLast({ state: "offline", offline: keywordMatch(q), raw: "" });
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
        setBusy(false);
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
      offline();
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
          // The transcript is shown in the editable box first; the student sends it.
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
    <div className="space-y-4">
      <section className="rise pt-2">
        <div className="flex items-end justify-between gap-2">
          <h1 className="text-[24px] leading-tight font-extrabold tracking-tight">Ask Dalil</h1>
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value as Lang)}
            aria-label="Answer language"
            className="rounded-full border border-line bg-paper px-3 py-1.5 text-[12.5px] font-bold"
          >
            {(Object.keys(LANG_LABELS) as Lang[]).map((l) => (
              <option key={l} value={l}>
                {LANG_LABELS[l]}
              </option>
            ))}
          </select>
        </div>
        <p className="mt-1 text-[13px] leading-snug text-muted">
          Answers come only from verified official sources. When no source covers a question, Dalil says so and points you to the
          right office.
        </p>
      </section>

      {messages.length === 0 ? (
        <section className="space-y-2">
          {SUGGESTIONS[lang].map((s) => (
            <button
              key={s}
              onClick={() => ask(s)}
              className="block w-full rounded-2xl border border-line px-4 py-3 text-left text-[13.5px] font-semibold hover:border-teal"
            >
              {s}
            </button>
          ))}
        </section>
      ) : null}

      <section className="space-y-3" aria-live="polite">
        {messages.map((m, i) =>
          m.role === "user" ? (
            <div key={i} className="ml-8 rounded-2xl rounded-br-md bg-ink px-4 py-3 text-[14px] leading-snug font-semibold text-white">
              {m.raw}
            </div>
          ) : (
            <Answer key={i} msg={m} canVoice={canVoice} onListen={() => listen(i)} />
          ),
        )}
        <div ref={endRef} />
      </section>

      {messages.length > 0 ? (
        <button
          onClick={() => {
            setMessages([]);
            store.setChat([]);
          }}
          className="text-[12px] font-bold text-muted underline underline-offset-2"
        >
          Clear this conversation
        </button>
      ) : null}

      {notice ? <p className="rounded-xl bg-gold-soft px-3 py-2 text-[12.5px] font-semibold text-gold">{notice}</p> : null}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask(input);
        }}
        className="sticky bottom-[92px] z-10 rounded-2xl border border-line bg-paper p-2 shadow-[0_6px_24px_rgba(22,32,46,0.12)]"
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
          placeholder={transcribing ? "Transcribing your question…" : recording ? "Listening… tap Stop when you finish" : "Type your question, or use the microphone"}
          className="w-full resize-none bg-transparent px-2 py-1.5 text-[14px] font-semibold outline-none placeholder:font-medium placeholder:text-muted"
        />
        <div className="flex items-center justify-between gap-2">
          {canVoice ? (
            <button
              type="button"
              onClick={recording ? stopRecording : startRecording}
              disabled={busy || transcribing}
              className={`rounded-full px-4 py-2 text-[12.5px] font-extrabold disabled:opacity-40 ${
                recording ? "bg-red text-white" : "border-2 border-teal text-teal"
              }`}
            >
              {recording ? "■ Stop" : transcribing ? "Transcribing…" : "● Speak"}
            </button>
          ) : (
            <span className="px-2 text-[11px] text-muted">Voice is available in English and Russian</span>
          )}
          <span className="text-[10.5px] text-muted">
            {input.length}/{QUESTION_CAP}
          </span>
          <button type="submit" disabled={busy || !input.trim()} className="rounded-full bg-teal px-5 py-2 text-[12.5px] font-extrabold text-white disabled:opacity-40">
            Send
          </button>
        </div>
      </form>
    </div>
  );
}

function Answer({ msg, canVoice, onListen }: { msg: Message; canVoice: boolean; onListen: () => void }) {
  if (msg.state === "blocked")
    return <div className="mr-8 rounded-2xl rounded-bl-md border border-gold bg-gold-soft px-4 py-3 text-[13.5px] font-semibold text-gold">{msg.raw}</div>;

  if (msg.state === "offline") {
    return (
      <div className="mr-4 space-y-2 rounded-2xl rounded-bl-md border border-line px-4 py-3">
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
  const unverified = !streaming && cited.length === 0 && parsed.handoffs.length === 0;

  return (
    <div className="mr-4 space-y-2.5 rounded-2xl rounded-bl-md border border-line bg-paper px-4 py-3">
      {parsed.text ? (
        <p className="text-[14px] leading-relaxed whitespace-pre-wrap">{parsed.text}</p>
      ) : (
        <p className="text-[13px] font-bold text-teal">
          Checking verified sources <Dots />
        </p>
      )}

      {unverified ? (
        <p className="rounded-xl bg-gold-soft px-3 py-2 text-[12px] font-bold text-gold">
          Not verified against a source. Check with your university office.
        </p>
      ) : null}

      {!streaming && parsed.handoffs.length > 0 && cited.length === 0 ? (
        <p className="rounded-xl bg-gold-soft px-3 py-2 text-[12px] font-bold text-gold">
          No verified source covers this question, so Dalil did not guess.
        </p>
      ) : null}

      {parsed.handoffs.map((h) => (
        <HandoffLink key={h} handoff={h} />
      ))}

      {cited.length > 0 ? (
        <div className="space-y-2">
          <p className="text-[10px] font-extrabold tracking-wide text-muted uppercase">Official facts behind this answer</p>
          {cited.map((e) => (
            <FactCard key={e.id} entry={e} />
          ))}
        </div>
      ) : null}

      {!streaming ? (
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <span className="text-[10.5px] text-muted">AI-generated. Not legal advice.</span>
          {canVoice && parsed.text ? (
            msg.audioUrl ? (
              <div className="w-full">
                <audio src={msg.audioUrl} controls autoPlay className="h-9 w-full" />
                <span className="text-[10.5px] font-bold text-muted">AI-generated voice</span>
              </div>
            ) : (
              <button onClick={onListen} disabled={msg.audioState === "loading"} className="rounded-full border-2 border-teal px-3 py-1 text-[12px] font-extrabold text-teal disabled:opacity-50">
                {msg.audioState === "loading" ? "Preparing voice…" : msg.audioState === "failed" ? "Voice unavailable, retry" : "▶ Listen (AI voice)"}
              </button>
            )
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

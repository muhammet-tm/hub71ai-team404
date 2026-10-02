import raw from "@/data/arrival_kb.json";
import type { KbEntry, KbFile } from "./types";

export const KB = raw as KbFile;
export const KB_IDS: string[] = KB.entries.map((e) => e.id);

const index = new Map(KB.entries.map((e) => [e.id, e]));

export function byId(id: string): KbEntry | undefined {
  return index.get(id);
}

export function entriesByPhase(phase: 1 | 2 | 3 | 4): KbEntry[] {
  return KB.entries.filter((e) => e.phase === phase).sort((a, b) => a.order - b.order);
}

/** Offline fallback: rank entries by keyword overlap with the question. No model call. */
export function keywordMatch(question: string, limit = 3): KbEntry[] {
  const q = question.toLowerCase();
  const scored = KB.entries
    .map((e) => {
      let score = 0;
      for (const k of e.keywords) if (q.includes(k.toLowerCase())) score += k.length > 4 ? 2 : 1;
      for (const w of e.title.toLowerCase().split(/\W+/)) if (w.length > 4 && q.includes(w)) score += 1;
      return { e, score };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((s) => s.e);
}

/** The knowledge base as compact text for the prompt. Same bytes the interface renders. */
export function kbForPrompt(): string {
  return KB.entries
    .map(
      (e) =>
        `[${e.id}] ${e.title}\nFact: ${e.fact}` +
        (e.fee ? `\nFee: ${e.fee}` : "") +
        (e.deadlineText ? `\nDeadline: ${e.deadlineText}` : "") +
        (e.caveat ? `\nCaveat: ${e.caveat}` : "") +
        `\nSource: ${e.sourceName} (${e.status})\nHandoff: ${e.handoff}`,
    )
    .join("\n\n");
}

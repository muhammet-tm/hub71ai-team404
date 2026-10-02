import { KB_IDS } from "./kb";
import { HANDOFF_VALUES } from "./handoffs";

// Tolerant of a stray space inside a marker, which the model sometimes writes ("[H: icp]").
const COMPLETE = /\[\s*(K\d{2})\s*\]|\[\s*H:\s*([a-z_]+)\s*\]|\[\s*(G)\s*\]/g;
const PARTIAL_TAIL = /\[\s*(?:K\d{0,2}|H:?\s*[a-z_]*|G)?\s*$/;

export type ParsedAnswer = { text: string; kbIds: string[]; handoffs: string[]; general: boolean };

/**
 * Turns streamed text with [Kxx], [H:value], and [G] markers into clean text plus the cited ids.
 * [G] marks a sentence of general guidance that does not come from a verified entry.
 * A marker split across two chunks is held back until it completes (the trailing partial is hidden).
 * Unknown ids and unknown handoff values are removed.
 */
export function parseAnswer(raw: string, final: boolean): ParsedAnswer {
  const kbIds: string[] = [];
  const handoffs: string[] = [];
  let general = false;
  let text = raw.replace(COMPLETE, (_m, k: string | undefined, h: string | undefined, g: string | undefined) => {
    if (g) general = true;
    if (k && KB_IDS.includes(k) && !kbIds.includes(k)) kbIds.push(k);
    if (h && HANDOFF_VALUES.includes(h) && !handoffs.includes(h)) handoffs.push(h);
    return "";
  });
  if (!final) text = text.replace(PARTIAL_TAIL, "");
  text = text.replace(/[ \t]+([.,;:!?])/g, "$1").replace(/[ \t]{2,}/g, " ").trim();
  return { text, kbIds, handoffs, general };
}

/** Text for speech: markers removed, capped. */
export function speechText(raw: string, cap: number): string {
  return parseAnswer(raw, true).text.slice(0, cap);
}

import { KB_IDS } from "./kb";
import { HANDOFF_VALUES } from "./handoffs";

const COMPLETE = /\[(K\d{2})\]|\[H:([a-z_]+)\]/g;
const PARTIAL_TAIL = /\[(?:K\d{0,2}|H:?[a-z_]*)?$/;

export type ParsedAnswer = { text: string; kbIds: string[]; handoffs: string[] };

/**
 * Turns streamed text with [Kxx] and [H:value] markers into clean text plus the cited ids.
 * A marker split across two chunks is held back until it completes (the trailing partial is hidden).
 * Unknown ids and unknown handoff values are removed.
 */
export function parseAnswer(raw: string, final: boolean): ParsedAnswer {
  const kbIds: string[] = [];
  const handoffs: string[] = [];
  let text = raw.replace(COMPLETE, (_m, k: string | undefined, h: string | undefined) => {
    if (k && KB_IDS.includes(k) && !kbIds.includes(k)) kbIds.push(k);
    if (h && HANDOFF_VALUES.includes(h) && !handoffs.includes(h)) handoffs.push(h);
    return "";
  });
  if (!final) text = text.replace(PARTIAL_TAIL, "");
  text = text.replace(/[ \t]+([.,;:!?])/g, "$1").replace(/[ \t]{2,}/g, " ").trim();
  return { text, kbIds, handoffs };
}

/** Text for speech: markers removed, capped. */
export function speechText(raw: string, cap: number): string {
  return parseAnswer(raw, true).text.slice(0, cap);
}

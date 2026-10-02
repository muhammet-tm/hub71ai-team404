// Team design parameters (docs/03, section 5.3). Not sourced facts; tuned from measurements.
import type { Lang } from "./types";

export const LANG_NAMES: Record<Lang, string> = { en: "English", es: "Spanish", pt: "Portuguese", zh: "Simplified Chinese", ja: "Japanese" };
export const LANG_LABELS: Record<Lang, string> = { en: "English", es: "Español", pt: "Português", zh: "中文", ja: "日本語" };
export const SPEECH_LANGS: Lang[] = ["en"]; // voice was tested end to end in English only

export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024; // below the 4.5 MB Vercel function body limit
export const IMAGE_LONG_EDGE = 1600;
export const JPEG_QUALITY = 0.8;
export const RECORDING_CAP_MS = 30_000;
export const QUESTION_CAP = 500;
export const SPEECH_TEXT_CAP = 600;
export const HISTORY_TURNS = 4;

export const EXTRACT_TIMEOUT_MS = 40_000;
export const PLAN_TIMEOUT_MS = 75_000;
export const PLAN_HEDGE_MS = 9_000; // start a second plan request if the first has not answered by then
export const ASK_FIRST_TOKEN_TIMEOUT_MS = 15_000;

export const PHASES: Record<1 | 2 | 3 | 4, string> = {
  1: "Before you fly",
  2: "First week",
  3: "First month",
  4: "Build a future",
};

export const SAMPLE_ARRIVAL_DATE = "2026-10-23";

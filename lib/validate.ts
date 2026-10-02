import { KB_IDS } from "./kb";
import type { Lang, PlanStep, PlanWarning } from "./types";

export function isLang(v: unknown): v is Lang {
  return v === "en" || v === "ru" || v === "tk";
}

export function isIsoDate(v: unknown): v is string {
  return typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v));
}

export function clip(v: unknown, max: number): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

const URL_RE = /(https?:\/\/|www\.|\b[a-z0-9-]+\.(com|ae|org|net|gov)\b)/i;
const MONEY_RE = /(\d[\d.,]*\s*(AED|дирхам|USD|\$))|((AED|USD|\$)\s*\d)|(\bGPA\b[^.]{0,12}\d)/i;

/**
 * Second layer behind the schema enum: the model may only select and localize.
 * Unknown and duplicate ids are dropped; URLs are removed; money-like numerals are recorded.
 */
export function validatePlanSteps(steps: PlanStep[]): { steps: PlanStep[]; warnings: PlanWarning[] } {
  const seen = new Set<string>();
  const out: PlanStep[] = [];
  const warnings: PlanWarning[] = [];
  for (const s of steps) {
    if (!KB_IDS.includes(s.kb_id)) {
      warnings.push({ kb_id: String(s.kb_id), kind: "unknown_id" });
      continue;
    }
    if (seen.has(s.kb_id)) {
      warnings.push({ kb_id: s.kb_id, kind: "duplicate_id" });
      continue;
    }
    seen.add(s.kb_id);
    let title = clip(s.title, 120);
    let why = clip(s.why_for_you, 300);
    if (URL_RE.test(title)) {
      title = "";
      warnings.push({ kb_id: s.kb_id, kind: "url_removed" });
    }
    if (URL_RE.test(why)) {
      why = "";
      warnings.push({ kb_id: s.kb_id, kind: "url_removed" });
    }
    if (MONEY_RE.test(title) || MONEY_RE.test(why)) warnings.push({ kb_id: s.kb_id, kind: "numeral_found" });
    out.push({ kb_id: s.kb_id, title, why_for_you: why });
  }
  return { steps: out, warnings };
}

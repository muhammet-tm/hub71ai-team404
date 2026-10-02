import type { CheckFlag, Extraction } from "./types";

function addMonths(iso: string, months: number): Date {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCMonth(d.getUTCMonth() + months);
  return d;
}

/**
 * Flags are computed in code, never by the model. The six-month rule is confirmed only on the
 * 2018 ADU visa form, so the flag always shows its source and its age.
 */
export function computeFlags(ex: Extraction, expected: "admission_letter" | "passport", arrivalDate: string): CheckFlag[] {
  const flags: CheckFlag[] = [];
  if (ex.embedded_instructions)
    flags.push({ id: "embedded_instructions", level: "info", message: "This document contains text addressed to an AI system. Dalil ignored it." });
  if (!ex.readable) flags.push({ id: "unreadable", level: "amber", message: "Dalil could not read this photo well. Retake the photo or type the fields." });
  if (ex.document_type !== expected)
    flags.push({ id: "wrong_document", level: "amber", message: "This does not look like the expected document." });

  if (expected === "passport" && ex.passport_expiry && arrivalDate) {
    const expiry = new Date(ex.passport_expiry + "T00:00:00Z");
    if (!Number.isNaN(expiry.getTime())) {
      if (expiry < addMonths(arrivalDate, 6))
        flags.push({
          id: "passport_validity",
          level: "red",
          kbId: "K03",
          message: `This passport expires on ${ex.passport_expiry}, less than six months after your arrival on ${arrivalDate}. Rule from the 2018 ADU visa form. Confirm with ADU.`,
        });
      else
        flags.push({
          id: "passport_ok",
          level: "green",
          kbId: "K03",
          message: `This passport is valid for more than six months after your arrival (expires ${ex.passport_expiry}). Rule from the 2018 ADU visa form. Confirm with ADU.`,
        });
    }
  }
  if (expected === "admission_letter" && ex.document_type === "admission_letter" && !ex.duration_of_study)
    flags.push({
      id: "duration_missing",
      level: "amber",
      kbId: "K02",
      message:
        "The official u.ae page requires a university certificate that states the duration of study. This letter shows none; ask your university for the certificate.",
    });
  return flags;
}

export function suggestedDate(arrivalDate: string, offsetDays: number): string {
  const d = new Date(arrivalDate + "T00:00:00Z");
  if (Number.isNaN(d.getTime())) return "";
  d.setUTCDate(d.getUTCDate() + offsetDays);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

// The Dalil dataset as a spreadsheet: one row per verified entry.
import { PHASES } from "@/lib/config";
import { HANDOFFS } from "@/lib/handoffs";
import { KB } from "@/lib/kb";

export const dynamic = "force-static";

function cell(value: string | undefined): string {
  const v = value ?? "";
  return /[",\r\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

// The byte order mark makes Excel read the file as UTF-8.
const BOM = String.fromCharCode(0xfeff);

export async function GET() {
  const header = ["id", "phase", "step", "official_fact", "fee", "deadline", "note", "who_handles_it", "source", "source_url", "fact_check_status"];
  const rows = KB.entries.map((e) => [
    e.id,
    PHASES[e.phase],
    e.title,
    e.fact,
    e.fee,
    e.deadlineText,
    e.caveat,
    e.handoff === "none" ? "" : HANDOFFS[e.handoff].label,
    e.sourceName,
    e.sourceUrl,
    e.status,
  ]);
  const csv = BOM + [header, ...rows].map((r) => r.map(cell).join(",")).join("\r\n") + "\r\n";
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="dalil-arrival-dataset.csv"',
    },
  });
}

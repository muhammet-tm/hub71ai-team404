// The Dalil dataset as one downloadable file: every verified entry with its source and
// fact-check status, plus the claims that were rejected and why.
import { KB } from "@/lib/kb";
import { REJECTED } from "@/lib/dataset";

export const dynamic = "force-static";

export async function GET() {
  const body = {
    name: "Dalil arrival dataset for international students in Abu Dhabi",
    version: KB.version,
    compiled: "2026-10-02",
    method:
      "Each entry was drafted from an official page and then checked by an independent fact-checker that re-opened the source. Status values: confirmed, partially_confirmed, dated_2018.",
    entries: KB.entries.map(({ keywords, ...rest }) => { void keywords; return rest; }),
    rejected_claims: REJECTED,
  };
  return new Response(JSON.stringify(body, null, 2), {
    headers: { "Content-Type": "application/json; charset=utf-8", "Content-Disposition": 'inline; filename="dalil-arrival-dataset.json"' },
  });
}

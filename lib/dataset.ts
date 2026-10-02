// What the fact-check kept out of the knowledge base, and why. Taken from docs/evidence/rejected_claims.md.
export const REJECTED: { topic: string; reason: string }[] = [
  {
    topic: "Current Abu Dhabi University visa fees and conditions",
    reason: "The live ADU visa page returned empty content. The figures appeared only in a search snippet and conflict with the 2018 form.",
  },
  {
    topic: "Who must provide a student's health insurance",
    reason: "The u.ae page returned HTTP 404, and no page that could be opened states the duty.",
  },
  {
    topic: "TAMM lease registration fee, documents, and processing time",
    reason: "The TAMM page failed to load. Only third-party blogs repeat the figures.",
  },
  {
    topic: "Documents for opening a bank account",
    reason: "The u.ae page returned HTTP 404, and no official bank or regulator page was opened.",
  },
];

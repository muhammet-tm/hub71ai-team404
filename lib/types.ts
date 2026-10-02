export type Lang = "en" | "ru" | "tk";

export type Profile = {
  fullName: string; // stays on the device; only the given name is sent to the model
  country: string;
  university: string;
  program: string;
  arrivalDate: string; // ISO date, yyyy-mm-dd
  language: Lang;
};

export type Handoff =
  | "university_office"
  | "icp"
  | "tamm"
  | "uae_pass"
  | "mohre"
  | "mofa"
  | "adro"
  | "emergency_services"
  | "none";

export type KbStatus = "confirmed" | "partially_confirmed" | "dated_2018";

export type KbEntry = {
  id: string;
  phase: 1 | 2 | 3 | 4;
  order: number;
  offsetDays: number | null; // days from arrivalDate; null means no date is shown
  timingBasis: "sourced_deadline" | "suggested_order";
  deadlineText?: string;
  title: string;
  fact: string;
  fee?: string;
  sourceName: string;
  sourceUrl: string;
  status: KbStatus;
  caveat?: string;
  handoff: Handoff;
  keywords: string[];
  evidenceRef: string;
};

export type KbFile = {
  version: string;
  generatedFrom: string[];
  reviewedBy: string | null;
  entries: KbEntry[];
};

export type Confidence = "high" | "medium" | "low" | "not_found";

export type Extraction = {
  document_type: "admission_letter" | "passport" | "other";
  readable: boolean;
  full_name: string;
  nationality: string;
  university: string;
  program: string;
  start_date: string;
  duration_of_study: string;
  passport_expiry: string;
  confidence: {
    full_name: Confidence;
    nationality: Confidence;
    university: Confidence;
    program: Confidence;
    start_date: Confidence;
    duration_of_study: Confidence;
    passport_expiry: Confidence;
  };
  issues: string[];
  embedded_instructions: boolean;
};

export type ExtractResponse = {
  source: "live" | "saved_example";
  model: string;
  ms: number;
  extraction: Extraction;
};

export type CheckFlag = {
  id: "passport_validity" | "passport_ok" | "duration_missing" | "unreadable" | "embedded_instructions" | "wrong_document";
  level: "red" | "amber" | "info" | "green";
  message: string; // English, fixed text from lib/checks.ts
  kbId?: string;
};

export type PlanStep = { kb_id: string; title: string; why_for_you: string };

export type PlanWarning = {
  kb_id: string;
  kind: "unknown_id" | "duplicate_id" | "url_removed" | "numeral_found";
};

export type PlanResult = {
  source: "live" | "standard_plan" | "saved_example";
  language: Lang;
  greeting: string;
  steps: PlanStep[];
  warnings: PlanWarning[];
  ms?: number;
};

export type ChatTurn = { role: "user" | "assistant"; content: string };

export type Buddy = {
  name: string;
  country: string;
  languages: string[];
  university: string;
  program: string;
  note: string;
};

export type ApiErrorCode =
  | "bad_request"
  | "consent_required"
  | "unsupported_media"
  | "payload_too_large"
  | "unsupported_language"
  | "moderation_blocked"
  | "rate_limited"
  | "upstream_error"
  | "timeout";

export type ApiFallback = "manual_entry" | "standard_plan" | "kb_matches" | "typed_input" | "text_only" | "none";

export type ApiError = {
  error: { code: ApiErrorCode; message: string; fallback: ApiFallback; retryable: boolean };
};

import { KB_IDS } from "./kb";
import { HANDOFF_VALUES } from "./handoffs";

const CONF = { type: "string", enum: ["high", "medium", "low", "not_found"] };
const CONF_FIELDS = ["full_name", "nationality", "university", "program", "start_date", "duration_of_study", "passport_expiry"];

// Strict mode: every object sets additionalProperties false and lists every field in required.
// No field exists for a passport number or a date of birth (purpose limitation).
export const EXTRACTION_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "document_type", "readable", "full_name", "nationality", "university", "program",
    "start_date", "duration_of_study", "passport_expiry", "confidence", "issues", "embedded_instructions",
  ],
  properties: {
    document_type: { type: "string", enum: ["admission_letter", "passport", "other"] },
    readable: { type: "boolean" },
    full_name: { type: "string" },
    nationality: { type: "string" },
    university: { type: "string" },
    program: { type: "string" },
    start_date: { type: "string" },
    duration_of_study: { type: "string" },
    passport_expiry: { type: "string" },
    confidence: {
      type: "object",
      additionalProperties: false,
      required: CONF_FIELDS,
      properties: Object.fromEntries(CONF_FIELDS.map((f) => [f, CONF])),
    },
    issues: { type: "array", items: { type: "string" } },
    embedded_instructions: { type: "boolean" },
  },
};

// The id enum is generated from the knowledge base file, so an invented step has no id to attach to.
export const PLAN_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["language", "greeting", "steps"],
  properties: {
    language: { type: "string", enum: ["en", "ru", "tk"] },
    greeting: { type: "string" },
    steps: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["kb_id", "title", "why_for_you"],
        properties: {
          kb_id: { type: "string", enum: KB_IDS },
          title: { type: "string" },
          why_for_you: { type: "string" },
        },
      },
    },
  },
};

// Used only when ASK_STREAM is "0".
export const ASK_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["answer", "kb_ids", "handoff"],
  properties: {
    answer: { type: "string" },
    kb_ids: { type: "array", items: { type: "string", enum: KB_IDS } },
    handoff: { type: "string", enum: [...HANDOFF_VALUES, "none"] },
  },
};

import { apiError, upstreamError } from "@/lib/errors";
import { LANG_NAMES } from "@/lib/config";
import { base, MODEL, openai } from "@/lib/openai";
import { planPrompt } from "@/lib/prompts";
import { PLAN_SCHEMA } from "@/lib/schemas";
import { clip, isIsoDate, isLang, validatePlanSteps } from "@/lib/validate";
import type { PlanResult, PlanStep } from "@/lib/types";

export const maxDuration = 60;

export async function POST(request: Request) {
  let body: { profile?: Record<string, unknown> };
  try {
    body = await request.json();
  } catch {
    return apiError("bad_request", "The request could not be read.", "standard_plan");
  }
  const p = body.profile || {};
  if (!isLang(p.language) || !isIsoDate(p.arrivalDate))
    return apiError("bad_request", "The profile needs a language and an arrival date.", "standard_plan");

  // Data minimization: only the given name reaches the model.
  const profile = {
    given_name: clip(p.fullName, 120).split(/\s+/)[0] || "",
    country: clip(p.country, 120),
    university: clip(p.university, 120),
    program: clip(p.program, 120),
    arrival_date: p.arrivalDate,
    language: LANG_NAMES[p.language],
  };

  const started = Date.now();
  try {
    const res = await openai().responses.create({
      model: MODEL,
      ...base(MODEL),
      instructions: planPrompt(),
      input: `STUDENT PROFILE\n${JSON.stringify(profile, null, 1)}\n\nReturn "language" as "${p.language}".`,
      text: { format: { type: "json_schema", name: "dalil_plan", schema: PLAN_SCHEMA, strict: true } },
      max_output_tokens: 6000,
    });
    const parsed = JSON.parse(res.output_text) as { greeting: string; steps: PlanStep[] };
    const { steps, warnings } = validatePlanSteps(parsed.steps || []);
    const result: PlanResult = {
      source: "live",
      language: p.language,
      greeting: clip(parsed.greeting, 300),
      steps,
      warnings,
      ms: Date.now() - started,
      model: MODEL,
    };
    return Response.json(result);
  } catch (err) {
    return upstreamError(err, "standard_plan");
  }
}

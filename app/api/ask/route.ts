import { apiError, upstreamError } from "@/lib/errors";
import { HISTORY_TURNS, QUESTION_CAP } from "@/lib/config";
import { base, MODEL, MODERATION_MODEL, openai } from "@/lib/openai";
import { askPrompt } from "@/lib/prompts";
import { ASK_SCHEMA } from "@/lib/schemas";
import { clip, isLang } from "@/lib/validate";
import type { ChatTurn } from "@/lib/types";

export const maxDuration = 60;

export async function POST(request: Request) {
  let body: { question?: unknown; language?: unknown; profile?: Record<string, unknown>; history?: unknown };
  try {
    body = await request.json();
  } catch {
    return apiError("bad_request", "The request could not be read.", "kb_matches");
  }
  if (typeof body.question !== "string" || !body.question.trim())
    return apiError("bad_request", "Type a question first.", "kb_matches");
  if (body.question.length > QUESTION_CAP)
    return apiError("payload_too_large", `Keep the question under ${QUESTION_CAP} characters.`, "kb_matches");
  if (!isLang(body.language)) return apiError("bad_request", "Unknown language.", "kb_matches");
  const question = body.question.trim();
  const language = body.language;

  const history: ChatTurn[] = Array.isArray(body.history)
    ? (body.history as ChatTurn[])
        .filter((t) => t && (t.role === "user" || t.role === "assistant") && typeof t.content === "string")
        .slice(-HISTORY_TURNS)
        .map((t) => ({ role: t.role, content: t.content.slice(0, 800) }))
    : [];
  const context = body.profile
    ? `Student context: from ${clip(body.profile.country, 80) || "unknown"}, studying at ${clip(body.profile.university, 80) || "unknown"}, arriving ${clip(body.profile.arrivalDate, 10) || "unknown"}.`
    : "";

  try {
    const mod = await openai().moderations.create({ model: MODERATION_MODEL, input: question });
    if (mod.results[0]?.flagged)
      return apiError("moderation_blocked", "Dalil cannot answer this message. Ask about arriving and settling in Abu Dhabi.", "none");
  } catch (err) {
    return upstreamError(err, "kb_matches");
  }

  const input = [...history, { role: "user" as const, content: context ? `${context}\n\nQuestion: ${question}` : question }];

  if (process.env.ASK_STREAM === "0") {
    const started = Date.now();
    try {
      const res = await openai().responses.create({
        model: MODEL,
        ...base(MODEL),
        instructions: askPrompt(language) + "\n\nReturn the answer text without markers; list the cited ids in kb_ids and the handoff value in handoff.",
        input,
        text: { format: { type: "json_schema", name: "dalil_answer", schema: ASK_SCHEMA, strict: true } },
        max_output_tokens: 3000,
      });
      return Response.json({ source: "live", ms: Date.now() - started, ...JSON.parse(res.output_text) });
    } catch (err) {
      return upstreamError(err, "kb_matches");
    }
  }

  let events;
  try {
    events = await openai().responses.create({
      model: MODEL,
      ...base(MODEL),
      instructions: askPrompt(language),
      input,
      max_output_tokens: 3000,
      stream: true,
    });
  } catch (err) {
    return upstreamError(err, "kb_matches");
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const event of events) {
          if (event.type === "response.output_text.delta") controller.enqueue(encoder.encode(event.delta));
        }
      } catch {
        controller.enqueue(encoder.encode("\n[ERROR]"));
      }
      controller.close();
    },
  });
  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store", "X-Dalil-Source": "live" },
  });
}

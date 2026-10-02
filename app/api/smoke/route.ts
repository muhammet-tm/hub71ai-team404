// Temporary diagnostic route. Deleted before the final deploy.
import { upstreamError } from "@/lib/errors";
import { base, MODEL, openai } from "@/lib/openai";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function GET() {
  const started = Date.now();
  try {
    const res = await openai().responses.create({ model: MODEL, ...base(MODEL), input: "Reply with the single word: ok", max_output_tokens: 500 });
    return Response.json({ ok: true, model: MODEL, ms: Date.now() - started, text: res.output_text.slice(0, 20) });
  } catch (err) {
    return upstreamError(err, "none");
  }
}

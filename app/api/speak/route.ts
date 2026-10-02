import { apiError, upstreamError } from "@/lib/errors";
import { SPEECH_LANGS, SPEECH_TEXT_CAP } from "@/lib/config";
import { SPEECH_MODEL, SPEECH_VOICE, openai } from "@/lib/openai";
import type { Lang } from "@/lib/types";

export const maxDuration = 60;

export async function POST(request: Request) {
  let body: { text?: unknown; language?: unknown };
  try {
    body = await request.json();
  } catch {
    return apiError("bad_request", "The request could not be read.", "text_only");
  }
  if (typeof body.text !== "string" || !body.text.trim()) return apiError("bad_request", "No text to read.", "text_only");
  if (body.text.length > SPEECH_TEXT_CAP) return apiError("payload_too_large", "The text is too long to read aloud.", "text_only");
  if (!SPEECH_LANGS.includes(body.language as Lang))
    return apiError("unsupported_language", "Speech is available in English and Russian only.", "text_only");

  try {
    const res = await openai().audio.speech.create({
      model: SPEECH_MODEL,
      voice: SPEECH_VOICE,
      input: body.text,
      response_format: "mp3",
    });
    return new Response(await res.arrayBuffer(), { headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-store" } });
  } catch (err) {
    return upstreamError(err, "text_only");
  }
}

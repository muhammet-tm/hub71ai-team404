import { apiError, upstreamError } from "@/lib/errors";
import { MAX_UPLOAD_BYTES } from "@/lib/config";
import { TRANSCRIBE_MODEL, openai } from "@/lib/openai";

export const maxDuration = 60;

const ALLOWED = ["mp3", "mp4", "mpeg", "mpga", "m4a", "wav", "webm"];

export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return apiError("bad_request", "The recording could not be read.", "typed_input");
  }
  const audio = form.get("audio");
  if (!(audio instanceof File)) return apiError("bad_request", "No recording was sent.", "typed_input");
  const subtype = (audio.type.split("/")[1] || "").split(";")[0];
  if (!audio.type.startsWith("audio/") && !audio.type.startsWith("video/"))
    return apiError("unsupported_media", "This recording format is not supported. Type your question instead.", "typed_input");
  if (audio.size > MAX_UPLOAD_BYTES)
    return apiError("payload_too_large", "The recording is too long. Keep it under 30 seconds.", "typed_input");

  const ext = ALLOWED.includes(subtype) ? subtype : subtype === "x-m4a" || subtype === "aac" ? "m4a" : "webm";
  const file = new File([await audio.arrayBuffer()], `question.${ext}`, { type: audio.type });
  const started = Date.now();
  try {
    const res = await openai().audio.transcriptions.create({ file, model: TRANSCRIBE_MODEL });
    return Response.json({ text: res.text, ms: Date.now() - started });
  } catch (err) {
    return upstreamError(err, "typed_input");
  }
}

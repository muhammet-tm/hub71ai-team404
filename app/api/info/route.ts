// Tells the interface which models are configured, so labels on screen are always true.
import { MODEL, MODERATION_MODEL, SPEECH_MODEL, TRANSCRIBE_MODEL, VISION_MODEL } from "@/lib/openai";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({ text: MODEL, vision: VISION_MODEL, moderation: MODERATION_MODEL, transcribe: TRANSCRIBE_MODEL, speech: SPEECH_MODEL });
}

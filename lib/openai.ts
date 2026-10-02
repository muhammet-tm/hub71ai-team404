// Server only. The single file that reads the key. Imported only by files under app/api.
import OpenAI from "openai";

let client: OpenAI | null = null;

export function openai(): OpenAI {
  if (!client) client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY?.trim(), timeout: 45_000, maxRetries: 1 });
  return client;
}

export const MODEL = process.env.OPENAI_MODEL || "gpt-6.1-sol";
export const VISION_MODEL = process.env.OPENAI_VISION_MODEL || "gpt-6.1-sol";
export const VISION_RETRY_MODEL = "gpt-6-astra";
export const MODERATION_MODEL = "omni-moderation-latest";
// gpt-4o-transcribe answered in about 1.6 s in testing; gpt-transcribe took about 32 s for the same clip.
export const TRANSCRIBE_MODEL = process.env.OPENAI_TRANSCRIBE_MODEL || "gpt-4o-transcribe";
export const SPEECH_MODEL = "gpt-4o-mini-tts";
export const SPEECH_VOICE = "alloy";

/**
 * Options shared by every Responses call: nothing stored, and the lowest reasoning effort the
 * model accepts (Luna accepts "none"; Sol and Astra start at "low").
 */
export function base(model: string) {
  const effort = model.includes("luna") ? ("none" as const) : ("low" as const);
  return { store: false, reasoning: { effort } };
}

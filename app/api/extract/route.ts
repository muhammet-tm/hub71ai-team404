import { apiError, upstreamError } from "@/lib/errors";
import { MAX_UPLOAD_BYTES } from "@/lib/config";
import { BASE, VISION_MODEL, VISION_RETRY_MODEL, openai } from "@/lib/openai";
import { EXTRACT_PROMPT } from "@/lib/prompts";
import { EXTRACTION_SCHEMA } from "@/lib/schemas";
import type { Extraction, ExtractResponse } from "@/lib/types";

export const maxDuration = 60;

const ALLOWED = ["image/jpeg", "image/png", "image/webp"];

async function readDocument(model: string, dataUrl: string, expected: string): Promise<Extraction> {
  // No tools are exposed: text inside the image can never trigger an action.
  const res = await openai().responses.create({
    model,
    ...BASE,
    instructions: EXTRACT_PROMPT,
    input: [
      {
        role: "user",
        content: [
          { type: "input_text", text: `Expected document type: ${expected}. Extract the fields.` },
          { type: "input_image", image_url: dataUrl, detail: "high" },
        ],
      },
    ],
    text: { format: { type: "json_schema", name: "dalil_extraction", schema: EXTRACTION_SCHEMA, strict: true } },
    max_output_tokens: 4000,
  });
  return JSON.parse(res.output_text) as Extraction;
}

export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return apiError("bad_request", "The upload could not be read.", "manual_entry");
  }
  if (form.get("consent") !== "true")
    return apiError("consent_required", "Tick the consent box before uploading a document.", "manual_entry");
  const expected = form.get("expected");
  if (expected !== "admission_letter" && expected !== "passport")
    return apiError("bad_request", "Unknown document type.", "manual_entry");
  const image = form.get("image");
  if (!(image instanceof File)) return apiError("bad_request", "No image was sent.", "manual_entry");
  if (!ALLOWED.includes(image.type))
    return apiError("unsupported_media", "Use a JPEG, PNG, or WEBP photo.", "manual_entry");
  if (image.size > MAX_UPLOAD_BYTES)
    return apiError("payload_too_large", "The photo is larger than 4 MB.", "manual_entry");

  // The image is held in memory only. Nothing is written to disk or logged.
  const dataUrl = `data:${image.type};base64,${Buffer.from(await image.arrayBuffer()).toString("base64")}`;
  const started = Date.now();
  let model = VISION_MODEL;
  let extraction: Extraction;
  try {
    extraction = await readDocument(model, dataUrl, expected);
  } catch (first) {
    try {
      model = VISION_RETRY_MODEL;
      extraction = await readDocument(model, dataUrl, expected);
    } catch {
      return upstreamError(first, "manual_entry");
    }
  }
  const body: ExtractResponse = { source: "live", model, ms: Date.now() - started, extraction };
  return Response.json(body);
}

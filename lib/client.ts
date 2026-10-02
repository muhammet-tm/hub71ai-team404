// Browser only. Calls to our own routes, each with a timeout and a labeled fallback.
import { EXTRACT_TIMEOUT_MS, MAX_UPLOAD_BYTES } from "./config";
import { downscaleToJpeg } from "./image";
import type { ApiError, ExtractResponse } from "./types";

export const SAMPLES = {
  admission_letter: { image: "/demo/sample-admission-letter.jpg", saved: "/demo/saved/extract-letter.json" },
  passport: { image: "/demo/sample-passport.jpg", saved: "/demo/saved/extract-passport.json" },
} as const;

export class DalilError extends Error {
  constructor(message: string) {
    super(message);
  }
}

export async function errorMessage(res: Response): Promise<string> {
  try {
    const j = (await res.json()) as ApiError;
    return j.error?.message || "Something went wrong.";
  } catch {
    return "Something went wrong.";
  }
}

async function postExtract(image: Blob, expected: "admission_letter" | "passport"): Promise<ExtractResponse> {
  const form = new FormData();
  form.append("image", image, "document.jpg");
  form.append("expected", expected);
  form.append("consent", "true");
  const res = await fetch("/api/extract", { method: "POST", body: form, signal: AbortSignal.timeout(EXTRACT_TIMEOUT_MS) });
  if (!res.ok) throw new DalilError(await errorMessage(res));
  return (await res.json()) as ExtractResponse;
}

/** A photo chosen by the student. Downscaled on the device first. */
export async function extractFromFile(file: File, expected: "admission_letter" | "passport"): Promise<ExtractResponse> {
  if (!["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"].includes(file.type) && !file.type.startsWith("image/"))
    throw new DalilError("Use a photo (JPEG, PNG, or WEBP). PDF files are not supported yet.");
  let blob: Blob;
  try {
    blob = await downscaleToJpeg(file);
  } catch {
    throw new DalilError("This photo could not be opened. Try another photo or type the details.");
  }
  if (blob.size > MAX_UPLOAD_BYTES) throw new DalilError("The photo is larger than 4 MB after resizing.");
  return postExtract(blob, expected);
}

/**
 * The synthetic sample document. The live call runs first; the saved example loads only if the
 * live call fails, and the caller labels it "Saved example".
 */
export async function extractSample(expected: "admission_letter" | "passport"): Promise<ExtractResponse> {
  const s = SAMPLES[expected];
  try {
    const img = await (await fetch(s.image)).blob();
    return await postExtract(img, expected);
  } catch {
    const saved = await fetch(s.saved);
    if (!saved.ok) throw new DalilError("The sample could not be read right now. Type the details instead.");
    return { ...((await saved.json()) as ExtractResponse), source: "saved_example" };
  }
}

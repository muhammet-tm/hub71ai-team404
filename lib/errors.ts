import type { ApiError, ApiErrorCode, ApiFallback } from "./types";

const STATUS: Record<ApiErrorCode, number> = {
  bad_request: 400,
  consent_required: 400,
  unsupported_language: 400,
  payload_too_large: 413,
  unsupported_media: 415,
  moderation_blocked: 422,
  rate_limited: 429,
  upstream_error: 502,
  timeout: 504,
};

export function apiError(code: ApiErrorCode, message: string, fallback: ApiFallback, retryable = false): Response {
  const body: ApiError = { error: { code, message, fallback, retryable } };
  return Response.json(body, { status: STATUS[code] });
}

/** Map an OpenAI SDK error to our error shape. Never includes the key, a stack trace, or the request body. */
export function upstreamError(err: unknown, fallback: ApiFallback): Response {
  const status = typeof err === "object" && err !== null && "status" in err ? Number((err as { status: unknown }).status) : 0;
  if (status === 429) return apiError("rate_limited", "The AI service is busy. Try again in a moment.", fallback, true);
  const name = err instanceof Error ? err.name : "";
  if (name === "APIConnectionTimeoutError" || name === "AbortError")
    return apiError("timeout", "The AI service took too long to respond.", fallback, true);
  console.error("[dalil] upstream error", status || "", name);
  return apiError("upstream_error", "The AI service did not respond.", fallback, true);
}

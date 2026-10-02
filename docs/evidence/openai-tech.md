# OpenAI platform capabilities as of today

Status: VERIFIED by an independent fact-checker

## Summary

## OpenAI platform capabilities, checked 2 October 2026

Every item below was re-opened and checked against its source page today. Of 34 claims, 30 were confirmed as worded and 4 were corrected ([13], [15], [21], [33]); none were dropped. Prices come from the developer docs pricing page and the per-model pages.

### Models and API surface

The models page recommends three text and vision models: `gpt-6-astra` (flagship), `gpt-6.1-sol` ("Near-Astra performance for complex work at a lower cost"), and `gpt-6-luna` (efficient, high-volume) [1]. All three accept text and image input, return text, and have a 1,050,000-token context window (922,000 maximum input) with 128,000 maximum output tokens [2][3][4]. Knowledge cutoffs are 30 April 2026 for Astra and Sol and 18 May 2026 for Luna [2][3][4]. Prices per 1M tokens (input / cached input / output) are 10.00 / 1.00 / 50.00 USD for Astra, 2.00 / 0.10 / 10.00 USD for Sol, and 0.10 / 0.01 / 0.50 USD for Luna [5]. Sol is therefore 5 times cheaper than Astra, and Luna is 20 times cheaper than Sol, on input and output list prices. Reasoning effort options are low, medium (default), high, xhigh, and max on Sol; Luna additionally accepts none [2][3].

The Responses API is the primary API and is "recommended for all new projects"; Chat Completions remains supported [6][7]. The `openai` Node package installs with `npm install openai` and requires Node.js 22 or later [6]. The Assistants API was sunset on 26 August 2026, so no code should target it [8].

### Vision for the document check

Images are sent as an `input_image` content part whose `image_url` is either a URL or a `data:image/jpeg;base64,...` string, with `detail` set to `low`, `high`, `original`, or `auto` [9]. Accepted types are PNG, JPEG, WEBP, and non-animated GIF, with up to 512 MB total payload and 1,500 images per request [10]. PDFs go in as `input_file` (file ID, URL, or base64 `file_data` with filename); each file must be under 50 MB and the combined limit per request is 50 MB, and vision-capable models receive both extracted text and page images [11]. One documented limitation matters for us: the model "may not perform optimally" on images with text in non-Latin alphabets (the page names Japanese and Korean as examples) and may misread rotated or upside-down text [12]. The page does not name Arabic or Cyrillic specifically, so treating them as affected is our inference; a human-confirmation step in the user interface remains the prudent design.

### Structured Outputs, tools, and agents

Structured Outputs use `text.format` with `type: "json_schema"`, a `name`, a `schema`, and `strict: true`; every example sets `additionalProperties: false` and lists every field in `required`, and the function-calling guide states both as explicit strict-mode rules [13][14]. A zod helper exists (`responses.parse` with `zodTextFormat` from `openai/helpers/zod`), and refusals arrive as a separate `refusal` content item [13]. Function tools use `type: "function"` with `name`, `description`, `parameters`, and `strict: true`; results return as `function_call_output` keyed by `call_id`; `tool_choice` accepts auto, required, none, a forced function, or allowed_tools [14]. Built-in tools include `web_search`, `file_search`, `mcp`, `tool_search`, `code_interpreter`, and `computer`; all three recommended model pages list web_search, file_search, code_interpreter, computer_use, and mcp as supported [15][2][3]. The guides do not label these tools as GA or preview, so the report should not state an availability status [15]. Web search supports an `allowed_domains` filter of up to 100 domains, a `user_location` option, and returns `url_citation` annotations with url and title, which suits our source-tracing rule; it costs 10.00 USD per 1,000 calls plus content tokens [16]. File search needs a vector store (`files.create` with purpose "assistants", `vectorStores.create`, `vectorStores.files.create`) and `vector_store_ids`; it costs 2.50 USD per 1,000 calls and 0.10 USD per GB per day with 1 GB free [17]. Code interpreter containers expire after 20 minutes idle and cost 0.03 to 1.92 USD per session depending on memory tier [18]. The Agents SDK installs with `npm install @openai/agents zod`, requires Node.js 22 or later (Deno and Bun are also supported), and provides agents, handoffs, guardrails, sessions, tracing, and realtime voice agents over WebRTC in the browser [19].

### Voice

Speech-to-text uses `gpt-transcribe` (files up to 25 MB; mp3, mp4, mpeg, mpga, m4a, wav, webm; streaming with `stream=true`) at 0.0045 USD per minute [20][21]. For comparison, gpt-4o-transcribe and Whisper cost 0.006 USD per minute, gpt-4o-mini-transcribe costs 0.003 USD per minute, and live transcription (gpt-live-transcribe or gpt-realtime-whisper) costs 0.017 USD per minute [21]. The translations endpoint (whisper-1) outputs English only [20]. Text-to-speech uses `gpt-4o-mini-tts` with 13 voices, MP3 as the default output format, an `instructions` parameter for tone, a 2,000-token input cap, and a mandatory disclosure that the voice is AI-generated [22][23]. It costs 0.60 USD per 1M text input tokens and 12.00 USD per 1M audio output tokens, with a Tier 1 limit of 500 RPM and 50,000 TPM [23]. The Realtime API is generally available with `gpt-realtime-2.1`; browsers connect over WebRTC with an ephemeral secret minted server-side at `POST /v1/realtime/client_secrets` [24]. Realtime audio costs 32.00 USD input and 64.00 USD output per 1M tokens, with a 128,000-token context window and a Tier 1 limit of 200 RPM and 40,000 TPM [25].

### Languages

The TTS guide lists Russian, Arabic, Urdu, Hindi, and Tagalog (also Kazakh, Persian, Turkish, Tamil, Kannada, and Marathi). Uzbek, Turkmen, and Malayalam are absent from that list, and so is Bengali [26]. The transcription guide gives code formats only for `gpt-transcribe`, with no language-name list, and states that Whisper supports 98 languages with accuracy varying by language [27]. No page opened documents per-language quality for the text models.

### Safety, data, and limits

`omni-moderation-latest` is free and accepts text and images, not audio [28]. API data is not used for training unless the customer opts in; abuse-monitoring logs are kept up to 30 days; Zero Data Retention and Modified Abuse Monitoring require prior approval from OpenAI [29]. `/v1/responses` and `/v1/chat/completions` are ZDR-eligible with limitations, whereas `/v1/files`, `/v1/vector_stores`, `/v1/conversations`, and `/v1/batches` are not; stored responses are retained at least 30 days [30]. The United Arab Emirates is a listed data residency region; the eligibility conditions for using it were not checked, so the report should not claim the prototype stores data in the UAE [31]. Tier 1 requires 5 USD paid (100 USD monthly usage limit); rate-limited requests return HTTP 429 with `x-ratelimit-*` headers [32]. Tier 1 gives Astra, Sol, and Luna 500 requests per minute and 500,000 tokens per minute; the model pages list Tier 1 to Tier 5 only and show no Free-tier row, so the supplied API key should be at least Tier 1 [33].

### Recommended model per feature

- Timeline generation: `gpt-6.1-sol` with a strict JSON schema, because checklist accuracy matters more than cost at demo volume.
- Document vision check: `gpt-6.1-sol` with `detail: "high"` and Structured Outputs; escalate to `gpt-6-astra` only if field extraction fails.
- Multilingual chat: `gpt-6.1-sol`, streamed; `gpt-6-luna` for cheap side tasks such as buddy-match ranking.
- Voice: `gpt-transcribe` then Sol then `gpt-4o-mini-tts`, because it reuses the chat route; `gpt-realtime-2.1` is a stretch goal. Fall back to text for Uzbek, Turkmen, Malayalam, and Bengali, which are absent from the documented TTS language list [26].

### Gaps

- The explicit rule text for `additionalProperties: false` and all-fields-required was found on the function-calling guide, not on the Structured Outputs guide itself, where only the examples show it [13].
- GA or preview status for individual tools is not stated on the tools or computer-use guides [15].
- Free-tier availability of the three models is not stated on the model pages [33].
- Arabic and Cyrillic are not named in the vision limitation; only "non-Latin alphabets, such as Japanese or Korean" [12].

### Code (adapted from the official examples [9][13][34])

```js
import OpenAI from "openai";
const client = new OpenAI(); // reads OPENAI_API_KEY; server-side only

export async function checkDocument(base64Jpeg) {
  const r = await client.responses.create({
    model: "gpt-6.1-sol",
    input: [{ role: "user", content: [
      { type: "input_text", text: "Identify this document and list missing or unclear fields." },
      { type: "input_image", image_url: `data:image/jpeg;base64,${base64Jpeg}`, detail: "high" },
    ]}],
    text: { format: { type: "json_schema", name: "doc_check", strict: true, schema: {
      type: "object",
      properties: {
        document_type: { type: "string" },
        readable: { type: "boolean" },
        issues: { type: "array", items: { type: "string" } },
        next_steps: { type: "array", items: { type: "string" } },
      },
      required: ["document_type", "readable", "issues", "next_steps"],
      additionalProperties: false,
    }}},
  });
  return JSON.parse(r.output_text);
}

export async function* streamReply(messages) {
  const stream = await client.responses.create({
    model: "gpt-6.1-sol", input: messages, stream: true,
  });
  for await (const event of stream) {
    if (event.type === "response.output_text.delta") yield event.delta;
  }
}
```

The streaming pattern (`stream: true`, `for await`, `response.output_text.delta` with the text in `delta`) matches the streaming guide [34].

## Claims with sources

- [1] (confirmed) The OpenAI models page recommends gpt-6-astra (flagship, "Our most capable model for the most demanding work"), gpt-6.1-sol ("Near-Astra performance for complex work at a lower cost"), and gpt-6-luna ("Our most efficient model for focused, high-volume tasks") as starting points. Source: Models - OpenAI API docs <https://developers.openai.com/api/docs/models>
- [2] (confirmed) gpt-6.1-sol: text and image input, text output, 1,050,000-token context window (922,000 max input), 128,000 max output tokens, knowledge cutoff 30 April 2026; supports Responses, Chat Completions, Batch; supports streaming, structured outputs, function calling; tools include web_search, file_search, code_interpreter, computer_use, mcp. Reasoning effort options are low, medium (default), high, xhigh, max (no "none"). Source: GPT-6.1 Sol model page <https://developers.openai.com/api/docs/models/gpt-6.1-sol>
- [3] (confirmed) gpt-6-luna: text and image input, text output, 1,050,000-token context window (922,000 max input), 128,000 max output tokens, knowledge cutoff 18 May 2026; supports Responses, Chat Completions, Batch; reasoning effort options none, low, medium (default), high, xhigh, max. Source: GPT-6 Luna model page <https://developers.openai.com/api/docs/models/gpt-6-luna>
- [4] (confirmed) gpt-6-astra: text and image input, text output, 1,050,000-token context window (922,000 max input), 128,000 max output tokens, knowledge cutoff 30 April 2026. Source: GPT-6 Astra model page <https://developers.openai.com/api/docs/models/gpt-6-astra>
- [5] (confirmed) Prices per 1M tokens (input / cached input / output): gpt-6-astra 10.00 / 1.00 / 50.00 USD; gpt-6.1-sol 2.00 / 0.10 / 10.00 USD; gpt-6-luna 0.10 / 0.01 / 0.50 USD. The same figures appear on each model page. Source: Pricing - OpenAI API docs <https://developers.openai.com/api/docs/pricing>
- [6] (confirmed) The openai-node README describes the Responses API as the primary API and Chat Completions as the previous standard, supported indefinitely. Install with `npm install openai`; minimum Node.js 22. Source: openai-node README <https://raw.githubusercontent.com/openai/openai-node/master/README.md>
- [7] (confirmed) The migration guide states that Responses is recommended for all new projects while Chat Completions remains supported. Source: Migrate to the Responses API <https://developers.openai.com/api/docs/guides/migrate-to-responses>
- [8] (confirmed) The Assistants API was sunset on 26 August 2026 and is no longer available. Source: Migrate to the Responses API <https://developers.openai.com/api/docs/guides/migrate-to-responses>
- [9] (confirmed) Base64 images are sent to the Responses API as a content part {type: "input_image", image_url: `data:image/jpeg;base64,...`, detail} alongside {type: "input_text"}; detail options are low, high, original, auto. Source: Images and vision guide <https://developers.openai.com/api/docs/guides/images-vision>
- [10] (confirmed) Image input accepts PNG, JPEG, WEBP, and non-animated GIF; up to 512 MB total payload per request and up to 1,500 images per request. Source: Images and vision guide <https://developers.openai.com/api/docs/guides/images-vision>
- [11] (confirmed) PDFs are sent as an `input_file` content part by file ID, file URL, or base64 `file_data` with filename; each file must be under 50 MB and the combined limit across all files in a request is 50 MB; vision-capable models receive both extracted text and page images, which increases token usage. Source: File inputs (PDF) guide <https://developers.openai.com/api/docs/guides/pdf-files>
- [12] (confirmed) Documented vision limitations: reduced performance on images with text in non-Latin alphabets (the page gives Japanese and Korean as examples), possible misreading of rotated or upside-down text, weak precise spatial localization, approximate object counts. Source: Images and vision guide <https://developers.openai.com/api/docs/guides/images-vision>
- [13] (partially_confirmed) Structured Outputs in the Responses API use text.format with type "json_schema", a name, a schema, and strict: true; every example schema on the guide sets additionalProperties: false and lists all fields in required, and the function-calling guide states these two rules explicitly for strict mode; a zod helper exists (responses.parse with zodTextFormat from openai/helpers/zod); refusals arrive as a separate content item of type "refusal". Source: Structured Outputs guide <https://developers.openai.com/api/docs/guides/structured-outputs>
- [14] (confirmed) Function tools are defined as {type: "function", name, description, parameters, strict: true}; results are returned as {type: "function_call_output", call_id, output}; parallel_tool_calls can be set false; tool_choice accepts auto, required, a forced function, none, or allowed_tools. Source: Function calling guide <https://developers.openai.com/api/docs/guides/function-calling>
- [15] (partially_confirmed) Built-in Responses API tools on the tools guide include web_search, file_search, function, mcp, and tool_search (tool_search requires gpt-5.4 or later models). Computer use uses tool type "computer" (replacing the older computer-use-preview integration), is shown with gpt-6.1-sol in the guide's examples, and computer_use appears in the supported-tools list on the gpt-6-astra, gpt-6.1-sol, and gpt-6-luna model pages; for GPT-6 Astra the guide recommends code execution. Source: Using tools guide (plus tools-computer-use guide) <https://developers.openai.com/api/docs/guides/tools>
- [16] (confirmed) The web_search tool supports filters.allowed_domains (up to 100 domains, and likewise up to 100 blocked_domains), a user_location option (country, city, region, timezone), and returns url_citation annotations with url, title, start_index, and end_index; price is 10.00 USD per 1,000 calls plus search content tokens at model rates. Source: Web search tool guide <https://developers.openai.com/api/docs/guides/tools-web-search>
- [17] (confirmed) File search requires a vector store: upload with files.create (purpose "assistants"), create with vectorStores.create, attach with vectorStores.files.create, wait for processing, then pass {type: "file_search", vector_store_ids: [...], max_num_results}. Pricing: 2.50 USD per 1,000 calls and 0.10 USD per GB per day storage with 1 GB free. Source: File search tool guide <https://developers.openai.com/api/docs/guides/tools-file-search>
- [18] (confirmed) Code interpreter uses tool type "code_interpreter" with container {type: "auto"} (optional memory_limit of 1g default, 4g, 16g, or 64g); a container expires after 20 minutes without use; billed per 20-minute session at 0.03 USD (1 GB), 0.12 USD (4 GB), 0.48 USD (16 GB), or 1.92 USD (64 GB). Source: Code interpreter tool guide <https://developers.openai.com/api/docs/guides/tools-code-interpreter>
- [19] (confirmed) The Agents SDK for TypeScript installs with `npm install @openai/agents zod`, supports Node.js 22 or later, Deno, and Bun (Cloudflare Workers with nodejs_compat is experimental), and provides Agent/run, handoffs, guardrails, sessions, tracing, human-in-the-loop, and RealtimeAgent/RealtimeSession from @openai/agents/realtime (WebRTC in the browser). Source: openai-agents-js README <https://raw.githubusercontent.com/openai/openai-agents-js/main/README.md>
- [20] (confirmed) Speech-to-text models: gpt-transcribe (recommended for transcribing recorded speech), gpt-4o-transcribe-diarize, whisper-1 (the guide also names gpt-4o-transcribe, gpt-4o-mini-transcribe, and gpt-live-transcribe); files up to 25 MB; formats mp3, mp4, mpeg, mpga, m4a, wav, webm; streaming with stream=true on gpt-transcribe; the translations endpoint (whisper-1) outputs English only. Source: Speech to text guide <https://developers.openai.com/api/docs/guides/speech-to-text>
- [21] (partially_confirmed) Transcription prices per minute: gpt-transcribe 0.0045 USD; gpt-4o-transcribe 0.006 USD; gpt-4o-mini-transcribe 0.003 USD; Whisper 0.006 USD. Live transcription with gpt-live-transcribe or gpt-realtime-whisper costs 0.017 USD per minute, and live translation with gpt-realtime-translate costs 0.034 USD per minute. Source: Pricing - OpenAI API docs <https://developers.openai.com/api/docs/pricing>
- [22] (confirmed) Text-to-speech models are gpt-4o-mini-tts, tts-1, and tts-1-hd; 13 built-in voices (alloy, ash, ballad, coral, echo, fable, nova, onyx, sage, shimmer, verse, marin, cedar); output formats MP3 (default), Opus, AAC, FLAC, WAV, PCM; an `instructions` parameter controls tone; usage policies require a clear disclosure to end users that the voice is AI-generated. Source: Text to speech guide <https://developers.openai.com/api/docs/guides/text-to-speech>
- [23] (confirmed) gpt-4o-mini-tts costs 0.60 USD per 1M text input tokens and 12.00 USD per 1M audio output tokens; maximum input is 2,000 tokens; Tier 1 limit is 500 RPM and 50,000 TPM. Source: gpt-4o-mini-tts model page <https://developers.openai.com/api/docs/models/gpt-4o-mini-tts>
- [24] (confirmed) The Realtime API is generally available (the guide documents a beta-to-GA migration); the guide's example model is gpt-realtime-2.1; browsers connect by WebRTC and servers by WebSocket; browser and mobile clients use ephemeral client secrets created server-side via POST /v1/realtime/client_secrets; the guide starts with the Agents SDK for a browser application. Source: Realtime API guide <https://developers.openai.com/api/docs/guides/realtime>
- [25] (confirmed) gpt-realtime-2.1 prices per 1M tokens: audio 32.00 USD input, 0.40 cached, 64.00 output; text 4.00 input, 0.40 cached, 24.00 output; image input 5.00 USD (0.50 cached). Context window 128,000 tokens with 32,000 max output tokens; Tier 1 limit 200 RPM and 40,000 TPM. Source: gpt-realtime-2.1 model page and pricing page <https://developers.openai.com/api/docs/models/gpt-realtime-2.1>
- [26] (confirmed) The TTS guide's supported-language list (which follows Whisper) includes Arabic, Hindi, Russian, Tagalog, and Urdu (also Kazakh, Persian, Turkish, Tamil, Kannada, Marathi). Uzbek, Turkmen, Malayalam, and Bengali do not appear in the list. Source: Text to speech guide <https://developers.openai.com/api/docs/guides/text-to-speech>
- [27] (confirmed) The speech-to-text guide gives no list of language names for gpt-transcribe; it documents a `languages` parameter taking ISO 639-1 codes, selected ISO 639-3 codes, and regional zh locale codes, and states that the API rejects unsupported or incorrectly formatted codes; for whisper-1 (which uses the singular `language` parameter) it states 98 languages with accuracy varying by language. Source: Speech to text guide <https://developers.openai.com/api/docs/guides/speech-to-text>
- [28] (confirmed) The moderation endpoint uses model omni-moderation-latest, is free, and accepts text and image inputs (not audio); image files can be up to 20 MB. Source: Moderation guide <https://developers.openai.com/api/docs/guides/moderation>
- [29] (confirmed) API data is not used to train OpenAI models unless the customer explicitly opts in; abuse monitoring logs are retained for up to 30 days (longer if required by law or needed to protect the services); Zero Data Retention and Modified Abuse Monitoring require prior approval by OpenAI. Source: Data controls in the OpenAI platform <https://developers.openai.com/api/docs/guides/your-data>
- [30] (confirmed) ZDR-eligible endpoints include /v1/responses and /v1/chat/completions (both with limitations), /v1/audio/transcriptions, /v1/audio/speech, /v1/moderations, and /v1/realtime; /v1/files, /v1/vector_stores, /v1/conversations, and /v1/batches are not ZDR-eligible. Stored responses are retained at least 30 days; with ZDR, store is always treated as false. Source: Data controls in the OpenAI platform <https://developers.openai.com/api/docs/guides/your-data>
- [31] (confirmed) The United Arab Emirates is listed among OpenAI API data residency regions, alongside the US, Europe, Australia, Canada, Japan, India, Singapore, South Korea, and the UK. Source: Data controls in the OpenAI platform <https://developers.openai.com/api/docs/guides/your-data>
- [32] (confirmed) Usage tiers: Tier 1 requires 5 USD paid (100 USD monthly usage limit), Tier 2 50 USD paid (500 USD), Tier 3 100 USD (1,000 USD), Tier 4 250 USD (5,000 USD), Tier 5 1,000 USD (200,000 USD). Rate-limited requests return HTTP 429; limits are reported in x-ratelimit-* headers. Source: Rate limits guide <https://developers.openai.com/api/docs/guides/rate-limits>
- [33] (partially_confirmed) Tier 1 rate limits are 500 RPM and 500,000 TPM for gpt-6-astra, gpt-6.1-sol, and gpt-6-luna. The model pages list Tier 1 to Tier 5 only and show no Free-tier row. Source: GPT-6 Astra, Sol, and Luna model pages <https://developers.openai.com/api/docs/models/gpt-6-astra>
- [34] (confirmed) Streaming with the Responses API: pass stream: true to client.responses.create and iterate with for await; text arrives in events of type response.output_text.delta in the `delta` field; other lifecycle events are response.created, response.completed, and error. Source: Streaming API responses guide <https://developers.openai.com/api/docs/guides/streaming-responses>

## Open gaps

- All pages were read through a fetch tool that converts the page and summarizes it with a small model, so quoted numbers should be spot-checked against the live page before they go into the report or deck. Model IDs and the three headline prices were consistent across the models page, the pricing page, and each model page.
- openai.com/api/pricing returned HTTP 403; prices were taken from developers.openai.com/api/docs/pricing and the per-model pages instead.
- Whether gpt-6.1-sol and gpt-6-luna are usable on the Free tier (no payment) was not shown; only that gpt-6-astra is not. If the supplied API key belongs to an unpaid account, calls may fail. Confirm the key's tier, or whether OpenAI staff at the event are issuing credits.
- No official page documents text-model quality per language. Support for Russian, Arabic, Urdu, Hindi, Uzbek, Turkmen, Tagalog, and Malayalam in chat is therefore unverified by documentation and should be tested by hand (Muhammet can judge Russian and Turkmen).
- gpt-transcribe has no published language-name list on the guide page; coverage for Uzbek, Turkmen, and Malayalam speech input is unconfirmed. The Whisper language list on GitHub was referenced by the docs but not opened.
- An earlier summary pass claimed Malayalam was in the TTS language list; the verbatim list retrieved afterwards does not contain Malayalam, Uzbek, or Turkmen. I reported the verbatim list.
- The pricing page lists a gpt-realtime-2.1-mini (audio 10.00 / 20.00 USD per 1M tokens) while the gpt-realtime-2.1 model page mentions no mini variant. The mini model ID is unconfirmed; do not use it without checking.
- The models page also lists gpt-live-1, gpt-live-transcribe, gpt-realtime-whisper, and gpt-realtime-translate; I did not open their pages, so capabilities and prices for these are unconfirmed.
- The rate-limits page summary gave the 429 error code as 'slow_down' and the Free tier monthly limit as 100 USD; both look unusual and were not cross-checked. Treat only 'HTTP 429' as confirmed.
- Per-image size limit, the exact image token formula for the GPT-6 family, and PDF page limits were not stated on the pages opened.
- The zod version required by openai/helpers/zod and by @openai/agents was not stated; the code snippet uses a raw JSON schema to avoid that dependency.
- The Agents SDK docs site (openai.github.io/openai-agents-js) returned only navigation content; SDK facts come from the GitHub README. The default model of the Agents SDK was not found.
- The code snippets are adapted from the official examples (model ID changed to gpt-6.1-sol, image input combined with text.format) and have not been executed; run them once with the real key before building on them.
- Embedding model IDs and prices were not researched (not needed unless file search is replaced with a custom retrieval layer).
- Terms of the ChatGPT Enterprise workspace given to participants were not checked; a ChatGPT Enterprise seat does not by itself provide API credits, so the API key and billing remain a separate item only the user can supply.

# Fastest reliable stack and deployment

Status: NOT YET FACT-CHECKED: treat every claim as provisional

## Summary

## Recommendation

Build one Next.js 16 App Router project and deploy it to Vercel Hobby with the CLI. Use the official `openai` Node SDK inside route handlers. Every limit below was read from the linked doc page today (2 October 2026); package versions come from the npm registry (`npm view`), also today.

**Blocking items only Muhammet can do:** (1) run `npx vercel login` in his own browser, and (2) paste the OpenAI key himself at the `vercel env add` prompt and into `.env.local`. The key must never be committed or given a `NEXT_PUBLIC_` prefix.

## Stack (exact versions)

- Next.js **16.3.8** (current stable; the docs are versioned 16.3.8), minimum Node 20.9, so Node 24.8 is fine [1][2]. React 19.3.0 [3].
- `openai` **7.27.0** [4]. One dependency, and the code matches the OpenAI docs line for line, which helps when OpenAI staff are in the room.
- Vercel CLI **62.1.0** through `npx vercel` [5]. Vercel builds new projects on Node 24.x by default, which matches the build machine [6].
- Model: the docs' vision and streaming examples use `gpt-6-astra` [7][8]. The models page lists `gpt-6.1-sol` ($2 in / $10 out per million tokens) as the balanced option and `gpt-6-luna` ($0.1 / $0.5) as the cheapest, versus Astra at $10 / $50 [9]. Put the model ID in an `OPENAI_MODEL` environment variable so it can be switched without a code change.

## Commands

```
cd "D:\Hub71 Hackathon"
npx create-next-app@latest arrival-kit --yes
cd arrival-kit
npm i openai
# create .env.local with OPENAI_API_KEY=...   (user pastes the key)
npm run dev
npx vercel login
npx vercel                       # first deploy of a new project is production
npx vercel env add OPENAI_API_KEY production   # user pastes the key
npx vercel --prod                # redeploy so the variable takes effect
```

`--yes` gives TypeScript, Tailwind CSS, ESLint, App Router, and Turbopack with the `@/*` alias [10]. The first deployment of a new project is always production even without `--prod` [11]. Environment variable changes apply only to new deployments, so the redeploy is mandatory [12]. `vercel env add [name] [environment]` is the documented syntax, and production values default to "sensitive" (not readable afterwards) [13].

## Keeping the key server-side

Next.js states that variables without the `NEXT_PUBLIC_` prefix are available only on the server, and `create-next-app` adds `.env*` files to `.gitignore` [14]. Call OpenAI only from `app/api/*/route.ts`. Route handlers support `POST`, `request.json()`, `request.formData()`, and returning a `ReadableStream` in a `Response` [15]. The default runtime is `nodejs`; `edge` is marked deprecated in the route segment config, so do not set it [16].

## OpenAI SDK versus Vercel AI SDK

The official SDK is simpler today for this project. Streaming is `client.responses.create({ model, input, stream: true })` with a `for await` loop over events such as `response.output_text.delta` [8]. Image input is a content part `{ type: "input_image", image_url: "data:image/jpeg;base64,...", detail: "auto" }` [7]. The AI SDK (`ai` 7.0.127) is workable but adds friction: its Next.js quickstart defaults to the Vercel AI Gateway and an `AI_GATEWAY_API_KEY`, so you must also install `@ai-sdk/openai` to use `OPENAI_API_KEY` directly [17][18]. Its image syntax differs (`type: 'file', mediaType: 'image'`) [19]. The streaming example still shown in the Next.js route docs (`StreamingTextResponse`, `toAIStream`) does not match the current AI SDK quickstart (`createUIMessageStreamResponse`, `toUIMessageStream`), so copying it is a trap [15][17].

## Vercel Hobby limits

- Function duration: 300 s default and maximum [20].
- Request or response body: 4.5 MB, otherwise `413 FUNCTION_PAYLOAD_TOO_LARGE` [21]. Streaming responses are the documented way around the response limit [22].
- Memory 2 GB / 1 vCPU [20]; 100 deployments per day; 1,000,000 function invocations; 4 CPU-hours active CPU; runtime logs kept 1 hour [23].
- Environment variables: 64 KB total per deployment [12].
- Hobby is restricted to non-commercial, personal use [23].

## Camera, compression, and PWA

Use `<input type="file" accept="image/*" capture="environment">`; on desktop it falls back to a normal file picker, which suits the judges' laptops [24]. Compress before upload with a canvas and `toBlob(cb, "image/jpeg", quality)` (quality is 0 to 1) [25], or `browser-image-compression` 2.0.2 [26]. Base64 adds roughly one third, so a 4.5 MB JSON body carries about 3.3 MB of image (my arithmetic; Netlify's docs cite about 30% overhead) [27]. OpenAI itself accepts PNG, JPEG, WEBP, and non-animated GIF up to 512 MB per request, so Vercel is the binding limit [7]. For installability, Next.js requires only a valid manifest (`app/manifest.ts`) and HTTPS; iOS users install through Share, then Add to Home Screen [28]. `getUserMedia` (microphone) works only on HTTPS or localhost [29].

## Realtime voice on serverless

It works. The audio travels browser to OpenAI over WebRTC, so the function only handles a short setup call. Either mint an ephemeral key server-side with `POST https://api.openai.com/v1/realtime/client_secrets`, or use the "unified interface" where the route forwards the browser's SDP to `POST /v1/realtime/calls`; OpenAI recommends the unified interface for simpler setup [30]. The documented model is `gpt-realtime-2.1` [30]. A lower-risk voice path is record, transcribe with `gpt-transcribe` (files up to 25 MB, but still 4.5 MB through Vercel), then answer in text [31].

## Top pitfalls

1. Sharing the wrong URL: Standard Protection puts Vercel login on every URL except production domains. Give judges the production domain [32].
2. Forgetting to redeploy after adding the key [12].
3. Uncompressed phone photos exceeding 4.5 MB [21].
4. Setting `runtime = 'edge'` (deprecated; 25 s to first byte) [16][20].
5. `NEXT_PUBLIC_` on the key inlines it into the browser bundle [14].
6. Git import requires being the repository Owner on a personal repo, so Sulaymon cannot import Muhammet's repo [33].

## Alternatives and fallback

Netlify: 60 s synchronous limit, 6 MB buffered payload (4.5 MB effective for binary) [27]. Cloudflare Workers Free: 10 ms CPU per request, 100,000 requests per day [34]. Render free: spins down after 15 minutes idle and takes about one minute to wake, which is risky in a live demo [35]. Railway: one-time $5 trial credit [36]. None beats Vercel for a Next.js app today.

Fallback order if `npx vercel` fails: (a) import the GitHub repo in the Vercel dashboard, which deploys every push [33]; (b) Netlify; (c) Render with a warm-up request before judging; (d) demo from `npm run dev` on localhost, which still satisfies camera and microphone secure-context rules [29], though it does not meet the "deployed" requirement.

## Claims with sources

- [1] (unverified, researcher confidence high) Next.js current stable is 16.3.8 (npm dist-tag latest = 16.3.8; docs pages are versioned 16.3.8). Source: Next.js Docs: Installation <https://nextjs.org/docs/app/getting-started/installation> Quote: "version: 16.3.8"
- [2] (unverified, researcher confidence high) Next.js minimum Node.js version is 20.9, so Node 24.8 on the build machine is supported. Source: Next.js Docs: Installation <https://nextjs.org/docs/app/getting-started/installation> Quote: "Minimum Node.js version: 20.9"
- [3] (unverified, researcher confidence high) React latest on npm is 19.3.0 (npm view react version, run 2 Oct 2026). Source: npm registry: react <https://www.npmjs.com/package/react>
- [4] (unverified, researcher confidence high) The official openai Node SDK latest version on npm is 7.27.0 (npm view openai version, run 2 Oct 2026). Source: npm registry: openai <https://www.npmjs.com/package/openai>
- [5] (unverified, researcher confidence high) Vercel CLI latest on npm is 62.1.0; `vercel` with no subcommand deploys, and `--yes` skips the new-project setup questions. Source: Vercel Docs: vercel deploy <https://vercel.com/docs/cli/deploy> Quote: "The `--yes` option can be used to skip questions you are asked when setting up a new Vercel project."
- [6] (unverified, researcher confidence high) Vercel offers Node.js 24.x (default), 22.x, and 20.x; new projects use the latest LTS by default. Source: Vercel Docs: Supported Node.js versions <https://vercel.com/docs/functions/runtimes/node-js/node-js-versions> Quote: "24.x (default)"
- [7] (unverified, researcher confidence high) OpenAI Responses API image input uses a content part {type: 'input_image', image_url: <URL or base64 data URL>, detail}; supported types are PNG, JPEG, WEBP, non-animated GIF; up to 512 MB total payload and 1,500 images per request; docs example model is gpt-6-astra. Source: OpenAI API Docs: Images and vision <https://developers.openai.com/api/docs/guides/images-vision> Quote: "Up to 512 MB total payload per request"
- [8] (unverified, researcher confidence high) Streaming with the openai Node SDK is client.responses.create({model, input, stream: true}) iterated with for await; events include response.created, response.output_text.delta, response.completed. Source: OpenAI API Docs: Streaming API responses <https://developers.openai.com/api/docs/guides/streaming-responses> Quote: "const stream = await client.responses.create({ model: "gpt-6-astra", ... stream: true });"
- [9] (unverified, researcher confidence high) OpenAI models page lists gpt-6-astra ($10 input / $50 output per MTok), gpt-6.1-sol ($2 / $10), and gpt-6-luna ($0.1 / $0.5), each with a 1.05M context window and 128K max output. Source: OpenAI API Docs: Models <https://developers.openai.com/api/docs/models> Quote: "choose GPT-6.1 Sol to balance intelligence and cost, or use GPT-6 Luna for cost-sensitive, high-volume workloads"
- [10] (unverified, researcher confidence high) `npx create-next-app@latest my-app --yes` scaffolds with TypeScript, Tailwind CSS, ESLint, App Router, and Turbopack, import alias @/*, plus AGENTS.md and a CLAUDE.md that references it. Source: Next.js Docs: Installation <https://nextjs.org/docs/app/getting-started/installation> Quote: "The default setup enables TypeScript, Tailwind CSS, ESLint, App Router, and Turbopack, with import alias `@/*`"
- [11] (unverified, researcher confidence high) The first Vercel deployment of a new project is always a production deployment even without --prod; later production deploys need `vercel --prod`. Source: Vercel Docs: vercel deploy <https://vercel.com/docs/cli/deploy> Quote: "The first deployment of a new project is always a production deployment, even when you omit `--prod`."
- [12] (unverified, researcher confidence high) Vercel environment variable changes apply only to new deployments (redeploy required); total env var size limit is 64 KB per deployment, and 5 KB per variable on the edge runtime. Source: Vercel Docs: Environment variables <https://vercel.com/docs/environment-variables> Quote: "Any change you make to environment variables are not applied to previous deployments, they only apply to new deployments."
- [13] (unverified, researcher confidence high) `vercel env add [name] [environment]` adds a variable; production and preview values default to 'sensitive' and cannot be viewed later; piping the value with echo saves it in shell history and is not recommended for secrets. Source: Vercel Docs: vercel env <https://vercel.com/docs/cli/env> Quote: "Vercel defaults to `sensitive` for production, preview, and custom environments."
- [14] (unverified, researcher confidence high) In Next.js, environment variables without the NEXT_PUBLIC_ prefix are only available on the server; NEXT_PUBLIC_ variables are inlined into the browser bundle at build time; create-next-app adds .env files to .gitignore. Source: Next.js Docs: Environment variables <https://nextjs.org/docs/app/guides/environment-variables> Quote: "By default, environment variables are only available on the server."
- [15] (unverified, researcher confidence high) Next.js route handlers (route.ts) support GET/POST/PUT/PATCH/DELETE/HEAD/OPTIONS, request.json(), request.formData(), and streaming via a ReadableStream Response; the page's AI SDK streaming example still uses StreamingTextResponse and toAIStream. Source: Next.js Docs: route.js <https://nextjs.org/docs/app/api-reference/file-conventions/route> Quote: "return new StreamingTextResponse(result.toAIStream())"
- [16] (unverified, researcher confidence high) Route segment config: runtime defaults to 'nodejs' and 'edge' is marked deprecated; maxDuration default is set by the deployment platform. Source: Next.js Docs: Route Segment Config <https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config> Quote: "`'nodejs' | 'edge' (deprecated)`"
- [17] (unverified, researcher confidence high) The AI SDK Next.js App Router quickstart defaults to the Vercel AI Gateway provider (AI_GATEWAY_API_KEY, model string like 'anthropic/claude-sonnet-5.5') and returns createUIMessageStreamResponse({stream: toUIMessageStream({stream: result.stream})}); client uses useChat from @ai-sdk/react. Source: AI SDK Docs: Next.js App Router quickstart <https://ai-sdk.dev/docs/getting-started/nextjs-app-router> Quote: "return createUIMessageStreamResponse({ stream: toUIMessageStream({ stream: result.stream }), });"
- [18] (unverified, researcher confidence high) AI SDK package versions on npm today: ai 7.0.127, @ai-sdk/openai 4.0.83, @ai-sdk/react 4.0.130; the OpenAI provider reads OPENAI_API_KEY by default and uses the Responses API by default. Source: AI SDK Docs: OpenAI provider <https://ai-sdk.dev/providers/ai-sdk-providers/openai> Quote: "It defaults to the OPENAI_API_KEY environment variable."
- [19] (unverified, researcher confidence high) In the AI SDK OpenAI provider, images are passed as a message content part {type: 'file', mediaType: 'image', data: ...} where data may be bytes, a URL, or an OpenAI file ID. Source: AI SDK Docs: OpenAI provider <https://ai-sdk.dev/providers/ai-sdk-providers/openai> Quote: "You can pass Image files as part of the message content using the file type with an image media type"
- [20] (unverified, researcher confidence high) Vercel Functions on Hobby: maximum duration 300 s (default and maximum), memory 2 GB / 1 vCPU; Edge runtime functions must begin responding within 25 s and can stream up to 300 s; default region is iad1. Source: Vercel Docs: Vercel Functions Limits <https://vercel.com/docs/functions/limitations> Quote: "Hobby: 300s default and maximum."
- [21] (unverified, researcher confidence high) Vercel Functions request or response body limit is 4.5 MB; exceeding it returns 413 FUNCTION_PAYLOAD_TOO_LARGE. Source: Vercel Docs: Vercel Functions Limits <https://vercel.com/docs/functions/limitations> Quote: "The maximum payload size for the request body or the response body of a Vercel Function is 4.5 MB."
- [22] (unverified, researcher confidence medium) Vercel's documented workarounds for the 4.5 MB limit are direct client uploads to storage (for requests) and streaming function responses (for responses). Source: Vercel KB: How to bypass the 4.5MB body size limit <https://vercel.com/kb/guide/how-to-bypass-vercel-body-size-limit-serverless-functions> Quote: "consider streaming your function responses"
- [23] (unverified, researcher confidence high) Vercel Hobby plan: free, non-commercial personal use only, 100 deployments per day, first 1,000,000 function invocations, 4 CPU-hours active CPU, 360 GB-hours provisioned memory, 100 GB fast data transfer, 200 projects, 1 hour of runtime logs. Source: Vercel Docs: Hobby Plan <https://vercel.com/docs/plans/hobby> Quote: "the Hobby plan restricts users to non-commercial, personal use only"
- [24] (unverified, researcher confidence high) The HTML capture attribute on input type=file (values user, environment) requests a camera capture on mobile; on desktop it typically shows a normal file picker; MDN marks it as not Baseline. Source: MDN: HTML attribute capture <https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/capture> Quote: "if your device is a desktop computer, you'll likely get a typical file picker"
- [25] (unverified, researcher confidence high) HTMLCanvasElement.toBlob(callback, type, quality) takes a quality number between 0 and 1 for image/jpeg or image/webp; default type is image/png. Source: MDN: HTMLCanvasElement.toBlob() <https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob> Quote: "The default type is `image/png`"
- [26] (unverified, researcher confidence high) browser-image-compression latest version on npm is 2.0.2 (npm view, run 2 Oct 2026). Source: npm registry: browser-image-compression <https://www.npmjs.com/package/browser-image-compression>
- [27] (unverified, researcher confidence medium) Netlify Functions defaults: 60 s synchronous execution limit, 15 min background limit, 1024 MB default memory, 6 MB buffered request/response payload (about 4.5 MB effective for binary because Base64 adds about 30%), 20 MB streamed response. Source: Netlify Docs: Functions configuration <https://docs.netlify.com/build/functions/configuration/>
- [28] (unverified, researcher confidence high) Next.js PWA guide: create app/manifest.ts (name, short_name, start_url, display: 'standalone', 192x192 and 512x512 icons); installability needs a valid web app manifest and HTTPS; iOS install is Share then Add to Home Screen; beforeinstallprompt does not work on Safari iOS. Source: Next.js Docs: Progressive Web Apps <https://nextjs.org/docs/app/guides/progressive-web-apps> Quote: "you must have: 1. A valid web app manifest (created in step 1) 2. The website served over HTTPS"
- [29] (unverified, researcher confidence high) getUserMedia is available only in secure contexts (HTTPS, or localhost); in insecure contexts navigator.mediaDevices is undefined. Source: MDN: MediaDevices.getUserMedia() <https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia> Quote: "in insecure contexts, `navigator.mediaDevices` is `undefined`"
- [30] (unverified, researcher confidence high) OpenAI Realtime API can be used from the browser over WebRTC in two ways: a server mints an ephemeral key via POST https://api.openai.com/v1/realtime/client_secrets and the browser posts its SDP to /v1/realtime/calls with that key, or (unified interface, recommended for simpler setup) the server forwards the browser SDP plus session config to /v1/realtime/calls with the standard key. Example model is gpt-realtime-2.1 with voice 'marin'; the server request should include an OpenAI-Safety-Identifier header. Source: OpenAI API Docs: Realtime API with WebRTC <https://developers.openai.com/api/docs/guides/realtime-webrtc> Quote: "Use the unified interface for simpler setup and faster connections."
- [31] (unverified, researcher confidence high) OpenAI speech-to-text: recommended model gpt-transcribe via /v1/audio/transcriptions; files up to 25 MB; formats mp3, mp4, mpeg, mpga, m4a, wav, webm. Text-to-speech docs reference gpt-4o-mini-tts. Source: OpenAI API Docs: Speech to text <https://developers.openai.com/api/docs/guides/speech-to-text> Quote: "Files can be up to 25 MB."
- [32] (unverified, researcher confidence high) Vercel Standard Protection protects all deployment URLs except production domains (generated deployment URLs require Vercel login); Password Protection is not available on Hobby; settings are under Project Settings > Deployment Protection. Source: Vercel Docs: Deployment Protection <https://vercel.com/docs/deployment-protection> Quote: "Standard Protection: Protects all deployments except production domains"
- [33] (unverified, researcher confidence high) Vercel for GitHub deploys every push by default; to import a repository owned by a personal GitHub account you must be the repository Owner (a Collaborator cannot create the Vercel project). Source: Vercel Docs: Deploying GitHub Projects with Vercel <https://vercel.com/docs/git/vercel-for-github> Quote: "Vercel for GitHub will deploy every push by default."
- [34] (unverified, researcher confidence medium) Cloudflare Workers Free plan: 100,000 requests per day, 10 ms CPU time per request, 50 subrequests per request, 128 MB memory, 100 MB request body on the Free Cloudflare plan. Source: Cloudflare Docs: Workers limits <https://developers.cloudflare.com/workers/platform/limits/>
- [35] (unverified, researcher confidence medium) Render free web services spin down after 15 minutes without inbound traffic, take about one minute to spin up, and each workspace gets 750 free instance hours per month. Source: Render Docs: Deploy for Free <https://render.com/docs/free> Quote: "Render spins down a Free web service that goes 15 minutes without receiving any inbound traffic."
- [36] (unverified, researcher confidence medium) Railway offers a trial with a one-time $5 grant and a Hobby plan at $5 per month including $5 of usage. Source: Railway Docs: Pricing plans <https://docs.railway.com/reference/pricing/plans>

## Open gaps

- Nothing was scaffolded, built, or deployed in this research pass. The command sequence is assembled from the docs and has not been run on this machine; the first real `npx vercel` run may surface account, login, or scope prompts not covered here.
- Whether Vercel Authentication / Standard Protection is switched ON by default for a brand-new Hobby project is not stated explicitly on the pages I opened. Check Project Settings > Deployment Protection after the first deploy and open the production URL in a private window before judging.
- I did not confirm that gpt-6.1-sol and gpt-6-luna accept image input; the vision guide only shows gpt-6-astra in its examples. Test the cheaper model with one document photo before relying on it, or stay on gpt-6-astra.
- Ephemeral Realtime client secret lifetime (expiry) was not found on the WebRTC guide page; I could not state how long a minted token stays valid.
- Realtime pricing and per-minute audio cost were not checked. The models page also lists gpt-realtime-2.1-mini and gpt-realtime-mini, which I did not evaluate.
- Whether the event's ChatGPT Enterprise workspace includes API credits or an API key is unknown; the user said he will supply the key. API rate limits and usage tier for that key were not checked.
- The Vercel Hobby plan is documented as non-commercial, personal use only. A hackathon prototype appears to fit, but I did not find wording that addresses hackathons specifically.
- The base64 overhead figure for Vercel (about 3.3 MB of image inside a 4.5 MB JSON body) is my own arithmetic from the 4.5 MB limit; Vercel's page does not state it. The roughly 30% figure is from Netlify's docs. Sending the image as multipart FormData avoids the overhead.
- Recommended compression settings (for example a maximum long edge and JPEG quality value) are not sourced from any doc; pick values by testing with a real document photo and confirming the text stays legible to the model.
- Netlify, Cloudflare, Render, and Railway figures were read through a summarizing fetch rather than raw page text, so they carry medium confidence. I did not check how well Next.js 16 runs on Netlify or Cloudflare (adapter support) today.
- Vercel function region defaults to iad1 (US East); latency from Abu Dhabi was not measured, and whether Hobby can change the default region was not confirmed.
- Mobile browser specifics for the capture attribute (which iOS and Android browsers honor it) were not checked beyond MDN's note that it is not Baseline.
- The exact AI SDK major version label for the docs page was not shown on the page; the version numbers quoted are npm registry values only.

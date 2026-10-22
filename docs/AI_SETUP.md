# AI tutor setup (for the next maintainer)

This guide covers how to get the math assistant running. Code lives in `assets/js/assistant.js`, `assets/js/assistant-config.js`, `assets/css/assistant.css`, and the server function `api/assistant.js`.

## How it picks a provider
`assistant-config.js` chooses by hostname:
- `localhost` / `127.0.0.1` -> **Ollama** (`qwen3:4b`, browser talks to `http://127.0.0.1:11434`).
- Any other host (Vercel) -> **Gemini** through the same-origin `/api/assistant` function. The key never reaches the browser.

## Go live (Vercel + Gemini)
1. Create a key at <https://aistudio.google.com/apikey>. One key, owned by the deployment owner.
2. Vercel -> Project -> Settings -> Environment Variables, for Production and Preview:
   - `GEMINI_API_KEY` (secret, required)
   - `GEMINI_MODEL` (optional; default `gemini-3.5-flash-lite`, the stable Flash-Lite id listed at <https://ai.google.dev/gemini-api/docs/models>)
3. Check the key and model before deploying: `GEMINI_API_KEY=... npm run ai:check` prints PASS/FAIL (never the key). Without a key it lists what is missing.
4. Redeploy (env changes apply to new deployments only).
5. Test the route end to end locally: copy `.env.example` to `.env.local`, run `npx vercel dev`, then
   ```
   curl -s localhost:3000/api/assistant -H 'content-type: application/json' \
     -d '{"messages":[{"role":"system","content":"Tutor."},{"role":"user","content":"What is 15% of 80?"}]}'
   ```
   Expect `{"message":{"content":"..."}}`. Without a key you get HTTP 503 `{"error":"...","code":"not_configured"}`, which the chat shows as a friendly message with a Retry button.
6. Vercel -> Firewall -> add a rate-limit rule on `/api/assistant` (e.g. 20 requests/minute per IP). The in-function limiter is per-instance and best effort.

Errors are always `{error, code}`: `not_configured` 503, `bad_origin` 403, `bad_request` 400, `too_large` 413, `rate_limited` / `upstream_rate_limited` 429, `blocked` 422 (safety), `timeout` 504, `upstream_error` / `unreachable` / `empty` / `truncated` 502. Server logs contain status codes only, never questions or the key. Requests are same-origin only (Origin must match the request host, so custom domains, `*.vercel.app` previews and `vercel dev` all work).

Do not send student names or grades; the free tier may use content to improve Google products.

## Local development
- Site only (uses Ollama): `ollama pull qwen3:4b && ollama serve`, then `npm run dev`.
- Test the Gemini route locally: copy `.env.example` to `.env.local`, add `GEMINI_API_KEY`, run `npx vercel dev`. `npm run dev` does not run Vercel Functions.

## Tests
- `npm test` mocks Gemini; no key or network needed (`tests/assistant-api-mock.test.js` covers no key, bad origin/body, 429, 500, timeout, blocked, success, key never leaked).
- `npm run test:ollama` is the live evaluation; needs Ollama running.

## Knowledge base
Answers are grounded in `data/knowledge/` (topics + examples). After editing those JSON files run `npm run knowledge:build` (tests fail on a stale `manifest.json`). Authoring rules: `.github/instructions/knowledge-authoring.instructions.md`.

## Known limits (not fixed on purpose)
- CSP in `vercel.json` has `connect-src 'self'`, so local Ollama is blocked in production by design.
- KaTeX, marked and DOMPurify are self-hosted in `public/vendor/` (copied from npm/jsdelivr: katex 0.16.22, marked 15.0.7, dompurify 3.2.6). To upgrade KaTeX, re-copy `katex.min.css/js`, `contrib/auto-render.min.js` and `fonts/*.woff2` from `node_modules/katex/dist`.

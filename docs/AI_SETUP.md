# AI tutor setup (for the next maintainer)

The math assistant is deliberately left unchanged by the cleanup. This guide only covers how to get it running. Code lives in `assets/js/assistant.js`, `assets/js/assistant-config.js`, `assets/css/assistant.css`, and the server function `api/assistant.js`.

## How it picks a provider
`assistant-config.js` chooses by hostname:
- `localhost` / `127.0.0.1` -> **Ollama** (`qwen3:4b`, browser talks to `http://127.0.0.1:11434`).
- Any other host (Vercel) -> **Gemini** through the same-origin `/api/assistant` function. The key never reaches the browser.

## Production (Vercel + Gemini)
1. Create a key at <https://aistudio.google.com/apikey>. One key, owned by the deployment owner. Do not rotate multiple keys to dodge quota.
2. Vercel -> Project -> Settings -> Environment Variables:
   - `GEMINI_API_KEY` (secret, required)
   - `GEMINI_MODEL` (optional, default `gemini-3.5-flash-lite`)
   Set for Production and Preview, then redeploy.
3. Vercel -> Firewall: add a rate-limit rule on `/api/assistant`. The in-function limiter is per-instance only.
4. Verify: open the site, ask "What is 15% of 80?" The tutor should answer. A missing key returns a clean error, not a crash. Check `Runtime Logs` in Vercel if not.

Do not send student names or grades; the free tier may use content to improve Google products.

## Local development
- Site only (uses Ollama): `ollama pull qwen3:4b && ollama serve`, then `npm run dev`.
- Test the Gemini route locally: copy `.env.example` to `.env.local`, add `GEMINI_API_KEY`, run `npx vercel dev`. `npm run dev` does not run Vercel Functions.

## Tests
- `npm test` mocks Gemini; no key or network needed.
- `npm run test:ollama` is the live evaluation; needs Ollama running.

## Knowledge base
Answers are grounded in `data/knowledge/` (topics + examples). After editing those JSON files run `npm run knowledge:build` (tests fail on a stale `manifest.json`). Authoring rules: `.github/instructions/knowledge-authoring.instructions.md`.

## Known limits (not fixed on purpose)
- CSP in `vercel.json` has `connect-src 'self'`, so local Ollama is blocked in production by design.
- The assistant loads KaTeX/marked/DOMPurify from `cdn.jsdelivr.net` (allowed by the CSP); the first try is `node_modules/katex/...`, which 404s harmlessly on a deployed site before falling back to the CDN.
- No loading/error CSS states yet (`.is-loading`, `.is-error` were prototyped and reverted).

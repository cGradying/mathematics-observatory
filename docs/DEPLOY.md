# Deploying to Vercel

`vercel.json` sets the build (`npm run build` -> `dist`), clean URLs, security headers (CSP, nosniff, frame deny) and cache headers. `api/assistant.js` deploys as a Vercel Function automatically.

## Checklist
1. Push to GitHub and import the repo in Vercel. Framework preset: Other. Settings come from `vercel.json`.
2. Project -> Settings -> Environment Variables: `GEMINI_API_KEY` (secret), optional `GEMINI_MODEL`. Set for Preview and Production, then redeploy.
3. Set `SITE_URL` (e.g. `https://example.com`) for the build so the sitemap and robots.txt use your domain. See [AI_SETUP.md](AI_SETUP.md) for the assistant.
4. Firewall -> add a rate-limit rule for `/api/assistant` (the in-function limiter is per-instance only).
5. After deploy: `curl -I https://<site>/` shows the CSP header; `/nonexistent` shows `404.html`; the assistant answers a question; Solid Geometry (Three.js) renders.

## Known follow-ups
- Fonts are self-hosted (`public/fonts`); the CSP no longer needs `fonts.googleapis.com`.
- `public/sitemap.xml` is generated at build with the domain from the `SITE_URL` env var; set it for Production. Add `canonical` / `og:url` tags once the domain is known.
- CSP `style-src` keeps `'unsafe-inline'` (inline `style=` attributes in explore/proofs/laboratory).
- `legacy/` (old `lab/` and `visualizers/` prototypes) is not built or linked; delete when no longer needed as reference.
- Local Ollama (`127.0.0.1:11434`) is blocked by the production CSP by design.

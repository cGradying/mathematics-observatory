# The Mathematics Observatory

Static multi-page Grade 11 General Mathematics site: curriculum notes, formula practice, worked examples, proofs, visualizers, challenges, and an AI tutor (Gemini via a Vercel Function, or local Ollama).

## Quick start

Node.js 20.19+ (or 22.12+).

```sh
npm install
npm run dev      # http://127.0.0.1:5173 (do not open HTML via file://)
```

| Script | Purpose |
| --- | --- |
| `npm run dev` / `build` / `preview` | Vite dev server, production build to `dist/`, preview of `dist/` |
| `npm test` | Builds, validates the knowledge index, runs the offline test suite |
| `npm run knowledge:build` / `knowledge:check` | Regenerate / verify `data/knowledge/manifest.json` |
| `npm run test:ollama` | Optional live evaluation against a local Ollama |

## Structure

```text
*.html                 Root pages (Vite MPA; every root .html is a build entry)
src/                   React Learn page (App.tsx, learn-main.tsx)
assets/css, assets/js  Page styles/scripts, calculators, tutor, visualizers
  progress.js          Student progress store (window.Progress)
  dashboard.js         Home dashboard: goal, Continue, mastery, next step
  topic-chip.js        "Topic: X" chip from ?topic=<slug>
api/assistant.js       Vercel Function: server-side Gemini proxy
data/knowledge/        Topic + example JSON and generated manifest
public/                Self-hosted fonts, 404, robots.txt, sitemap.xml
docs/                  Deploy, AI setup, roadmap, knowledge-base guide, source material
scripts/               Knowledge-index build/validation
tests/                 Offline tests (node --test)
legacy/                Unlinked, unbuilt prototypes (lab/, visualizers/); kept as reference only
```

## Progress and privacy

`assets/js/progress.js` exposes `window.Progress` (also `module.exports` for tests). It stores the learner's goal, recent answers per topic (last 10 count toward mastery), topics read, and the last activity in `localStorage` under the key `observatory-progress-v1`. It offers export/import (`importJSON`) and `reset()`. There are no accounts and no analytics: progress never leaves the browser (clearing site data or using private mode loses it; if storage is blocked it falls back to memory). The only data sent to a server is tutor chat, when Gemini is selected.

## Testing

`npm test` runs `vite build` then `node --test` over `tests/` (tutor behaviour, Gemini proxy with a mocked upstream, math, visualizer interactions, progress, dist links, headers, accessibility checks). No API key, Ollama, or network is needed.

## Deploy (Vercel) and environment

See [docs/DEPLOY.md](docs/DEPLOY.md) and [docs/AI_SETUP.md](docs/AI_SETUP.md). Build is `npm run build` -> `dist`; `vercel.json` sets headers and clean URLs.

| Variable | Where | Meaning |
| --- | --- | --- |
| `GEMINI_API_KEY` | runtime (secret) | Gemini key for `/api/assistant`; never commit it |
| `GEMINI_MODEL` | runtime, optional | Default `gemini-3.5-flash-lite` |
| `SITE_URL` | build time | Public origin used for the generated sitemap |

Copy `.env.example` to `.env.local` for `npx vercel dev`. `npm run dev` serves the front end only (Ollama works locally; Vercel Functions do not run).

## Curriculum data

Each topic is a pair `data/knowledge/topics/<slug>.json` + `data/knowledge/examples/<slug>.json` (templates in `data/templates/`). Run `npm run knowledge:build`; never edit the manifest by hand. Field rules: [docs/KNOWLEDGE_BASE.md](docs/KNOWLEDGE_BASE.md). Source material is in `docs/references/`. Open work: [docs/CODE_REVIEW_AND_ROADMAP.md](docs/CODE_REVIEW_AND_ROADMAP.md).

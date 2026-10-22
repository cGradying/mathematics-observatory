# The Mathematics Observatory

A static, multi-page Grade 11 General Mathematics learning site with curriculum notes, formula practice, worked examples, mathematical reasoning content, and an AI tutor that can use Gemini through Vercel or a local Ollama service.

## Features

- **Learn:** Grade 11 topic overview and suggested study path.
- **Explore:** searchable formulas, generated practice examples, worked solutions, and answer checking.
- **History:** mathematics timeline and mathematician profiles.
- **Why It Works:** intuitive explanations, derivations, and proofs.
- **Math Assistant:** curriculum retrieval, deterministic calculator/answer checks, KaTeX, Gemini API through a server-side Vercel Function, or local Ollama.
- **Curriculum library:** paired topic-reference and worked-example JSON modules.

The site has eight root-level page entry points: Home, Learn, Explore, History, Why It Works, Visualize, Laboratory, and Challenges. Vite serves the local development site and builds all root HTML pages as a multi-page application. Most pages use the existing HTML/CSS/JavaScript structure; Learn uses React, and History and the solid-geometry study use Three.js. Gemini is provided by one small Vercel serverless API function, not a long-running application server.

## Architecture

```text
.
├── index.html, learn.html, explore.html, history.html, proofs.html,
│   visualize.html, laboratory.html, challenges.html  # Vite MPA entries
├── src/                                  # React Learn app; unused History scene prototype
├── assets/
│   ├── css/                              # Shared and page stylesheets
│   ├── js/                               # Shared/page scripts, calculators, tutor, visualizers
│   └── images/                           # Page illustrations
├── visualizers/                          # Standalone prototypes/reference implementations
├── api/assistant.js                      # Vercel Gemini proxy (server-only secret)
├── data/knowledge/                       # Curriculum JSON and generated manifest
├── docs/                                 # Guides, roadmap, curriculum sources
├── scripts/                              # Knowledge-index build/validation
├── tests/                                # Offline, API, structure, and visualizer tests
├── vite.config.mjs                       # Discovers all root HTML pages for dev/build
└── package.json                          # Dependencies and project commands
```

Root HTML files are the stable page URLs. Vite discovers every root-level `.html` file for local development and production builds, so adding a page does not require maintaining a second page list. The production `dist/` folder contains the built pages plus browser assets and curriculum JSON; the server-only `api/` directory remains at the repository root for Vercel Functions and is not copied into the public build. `node_modules/` and `dist/` are generated and ignored by Git.

Learn is the only page currently mounted from `src/` (`src/learn-main.tsx` and `src/App.tsx`). The live History page is implemented by `assets/js/history-figma.js` and `assets/js/history-data.js`; `src/main.js`, `src/scene.js`, `src/scroll.js`, and `src/styles.css` are an earlier scene prototype and are not part of the build. The standalone files under `visualizers/` are references; the live Visualize page uses `assets/js/visualize.js` and its geometry modules.

### How data reaches the tutor

1. The contributor maintains one topic JSON and one example JSON for each lowercase kebab-case topic slug.
2. `npm run knowledge:build` validates all file pairs and generates `data/knowledge/manifest.json` in sorted order. Contributors do not edit the manifest by hand.
3. `assets/js/curriculum-data.js` fetches the manifest and each paired file over HTTP, validates the pair, and exposes the loaded data to the browser.
4. `assets/js/assistant.js` retrieves relevant subtopics and examples by keywords, then uses calculator results when a supported deterministic operation is detected.

An AI author can work on a topic by reading the authoring guide, the two templates, and only the relevant pair—not the whole knowledge library. The shared contributor instructions are in `.github/instructions/knowledge-authoring.instructions.md`.

## Add or update curriculum data

For a new topic, choose a slug such as `quadratic-functions` and create these two files:

- `data/knowledge/topics/quadratic-functions.json`
- `data/knowledge/examples/quadratic-functions.json`

Copy their structures from `data/templates/topic.template.json` and `data/templates/examples.template.json`. Use the same `topicName` in both modules. Then run:

```sh
npm run knowledge:build
npm test
```

The build discovers pairs from the filenames, validates their required schema and duplicate example IDs, and updates the manifest. Adding content to an existing topic only requires changing that topic's pair; the manifest is unchanged. See [docs/KNOWLEDGE_BASE.md](docs/KNOWLEDGE_BASE.md) for field definitions, AI-specific rules, quality checks, and the retrieval flow.

## Run locally

Use Node.js 20.19+ (or 22.12+) and npm. Install project dependencies:

```sh
npm install
```

Start Vite for local development (do not open an HTML file using `file://`, because browser security blocks curriculum JSON fetches and module imports):

```sh
npm run dev
```

Open the loopback URL printed by Vite, usually <http://127.0.0.1:5173/>. To create the production site, run `npm run build`; preview that output with `npm run preview`. Deploy the contents of `dist/` to a static host. A root-level Vercel deployment can also use the `api/assistant.js` function alongside the built output. A plain static host does not provide the Gemini API route; hosted tutoring needs the Vercel function (or an equivalent server-side proxy).

Run the offline tests and verify the generated index:

```sh
npm test
```

Regenerate the knowledge index after adding/renaming topic pairs:

```sh
npm run knowledge:build
```

Check that the committed generated manifest is current without rewriting it:

```sh
npm run knowledge:check
```

## AI tutor providers

### Gemini on Vercel (recommended for hosted use)

The deployed site defaults to the same-origin `/api/assistant` Vercel Function. The function calls Gemini server-side, keeps the API key out of browser JavaScript, fixes the model on the server, limits request size, validates chat messages, rejects cross-origin browser calls, and applies a best-effort per-IP burst limit. It returns the same response shape as Ollama, so the tutoring, curriculum retrieval, and deterministic calculator/answer verification stay shared between providers.

The default model is `gemini-3.5-flash-lite`: a fast, lower-cost/free-tier Flash-Lite model suitable for short Grade 11 tutoring. The local deterministic calculator remains responsible for supported exact arithmetic; the model is used for explanations and unsupported conceptual reasoning. Do not switch to a Pro/reasoning-heavy model unless measured answer quality shows Flash-Lite is insufficient. Model availability, free quota, terms, and limits can change; review Google's current [model list](https://ai.google.dev/gemini-api/docs/models) and [pricing/free-tier details](https://ai.google.dev/gemini-api/docs/pricing). Google's free tier is limited and may use submitted content to improve products; do not send student names, grades, or other identifying information.

**Do not add or rotate ten Gemini API keys.** Keys are credentials, not extra free student seats; cycling keys to bypass rate limits or quotas is not supported. Use one API key owned by the deployment owner, protect it as a server secret, respect its quota, and request legitimate quota/billing increases if needed. Never place the key in HTML, browser JavaScript, Git, a prompt, or a public `.env` file.

#### Deploy on Vercel

1. Push this repository to GitHub and import it into Vercel. Use `npm run build` as the build command and `dist` as the output directory. Keep `api/assistant.js` at the repository root so Vercel discovers it as a serverless function. For local Vercel development, use `npx vercel dev`.
2. Create a Gemini API key in [Google AI Studio](https://aistudio.google.com/apikey).
3. In Vercel **Project → Settings → Environment Variables**, add `GEMINI_API_KEY` (secret) and optionally `GEMINI_MODEL` (default `gemini-3.5-flash-lite`). Add them to the Preview/Production environments you will use, then redeploy.
4. Copy [.env.example](.env.example) to `.env.local`, add your own key there, and run `npx vercel dev` when testing the Gemini route locally. `.env.local` is gitignored. Vite's `npm run dev` serves the front end and local Ollama workflow; it does not execute Vercel Functions.
5. Deploy from the Vercel dashboard or run `npx vercel --prod` after environment variables are set. Configure a Vercel Firewall/rate-limit rule for `/api/assistant` appropriate to your student audience. The function's in-memory throttle is only a best-effort burst guard: serverless instances do not share memory, so it is not a distributed quota system or a substitute for platform-level rate limiting/authentication.

The Gemini browser client sends only the current conversation and response schema to your same-origin function. The function uses `GEMINI_API_KEY` and `GEMINI_MODEL`; neither is exposed as a `NEXT_PUBLIC_` or frontend variable.

### Local Ollama (no cloud API key)

To use the local model with the Vite website, install Ollama and pull the model once:

```sh
ollama pull qwen3:4b
```

Then, in separate terminals, start Ollama if its desktop app has not already started it, and start the site:

```sh
ollama serve
npm run dev
```

Open the loopback URL printed by Vite. On loopback pages, the tutor calls `http://127.0.0.1:11434/api/chat` directly, so `vercel dev` is not needed for local Ollama. The browser must be allowed by Ollama's CORS settings; Ollama permits `localhost` and `127.0.0.1` origins by default. Do not expose an unauthenticated Ollama endpoint to an untrusted network.

The optional live evaluation needs the service and model running:

```sh
npm run test:ollama
```

`MATHEMATICS_AI_ENDPOINT` and `MATHEMATICS_AI_MODEL` environment variables can override the live test defaults. The regular `npm test` suite tests the Gemini proxy with a mocked upstream and does not need a Gemini key, Ollama, or internet access.

## Visual design workflow (Impeccable)

The reusable agent prompt is [.github/prompts/unsloppify-with-impeccable.prompt.md](.github/prompts/unsloppify-with-impeccable.prompt.md). To use it, install Impeccable in the project with `npx impeccable install`, follow its setup prompts, and reload the coding agent so its commands/instructions are discovered. Then ask the agent to run `/impeccable document`, `/impeccable critique`, and `/impeccable polish` using that prompt. It directs the agent to preserve learning content, routes, assistant behavior, accessibility, and the existing design direction while refining the UI. Impeccable is a separate agent skill, not a runtime dependency of this website.

## Deployment and source material

The learning pages and deterministic calculator can be hosted as static files, for example with GitHub Pages. Gemini requires the Vercel Function (or an equivalent private server-side proxy); a plain GitHub Pages deployment cannot run `api/assistant.js`. Ollama requires a separately accessible local service.

See [docs/CODE_REVIEW_AND_ROADMAP.md](docs/CODE_REVIEW_AND_ROADMAP.md) for reviewed security/reliability limitations and the prioritized follow-up features. In particular, configure and verify Vercel-level rate limiting before exposing the Gemini route publicly.

Original curriculum source material is retained in `docs/references/`. The running app fetches structured JSON from `data/knowledge/`; it does not parse the PDF or text reference at runtime.

## History page implementation

The live History page is rendered by `assets/js/history-figma.js` from
`assets/js/history-data.js`, with its layout in `assets/css/history.css`. The
`src/main.js`, `src/scene.js`, `src/scroll.js`, and `src/styles.css` files are an
unused earlier Three.js prototype; they are not loaded by `history.html` or the
production build. Keep edits to the active `assets/` implementation unless the
prototype is deliberately reactivated and connected to the page.

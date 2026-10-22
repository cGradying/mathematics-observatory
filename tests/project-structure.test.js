const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { pathToFileURL } = require('node:url');
const vm = require('node:vm');
const { buildManifest } = require('../scripts/build-knowledge-index');

const root = path.resolve(__dirname, '..');
const htmlFiles = fs.readdirSync(root).filter(file => file.endsWith('.html'));
const manifestPath = path.join(root, 'data', 'knowledge', 'manifest.json');

test('local HTML assets and page links resolve to files in the project', () => {
    assert.ok(htmlFiles.length > 0, 'HTML entry pages are present');

    const brokenReferences = [];
    for (const htmlFile of htmlFiles) {
        const source = fs.readFileSync(path.join(root, htmlFile), 'utf8');
        const references = source.matchAll(/\b(?:href|src)\s*=\s*["']([^"']+)["']/gi);

        for (const [, reference] of references) {
            if (!reference || reference.startsWith('#') || reference.startsWith('//') || /^[a-z][a-z\d+.-]*:/i.test(reference)) continue;

            const localPath = decodeURIComponent(reference.split(/[?#]/, 1)[0]).replace(/^\/+/, '');
            if (!localPath) continue;

            const target = path.resolve(root, localPath);
            if (!target.startsWith(`${root}${path.sep}`) && target !== root) {
                brokenReferences.push(`${htmlFile}: reference escapes project root: ${reference}`);
            } else if (!fs.existsSync(target) && !fs.existsSync(path.resolve(root, 'public', localPath))) {
                brokenReferences.push(`${htmlFile}: missing ${reference}`);
            }
        }
    }

    assert.deepEqual(brokenReferences, [], brokenReferences.join('\n'));
});

test('local CSS url() references resolve relative to their stylesheet', () => {
    const cssRoot = path.join(root, 'assets', 'css');
    const cssFiles = fs.readdirSync(cssRoot).filter(file => file.endsWith('.css'));
    const missingReferences = [];

    for (const cssFile of cssFiles) {
        const source = fs.readFileSync(path.join(cssRoot, cssFile), 'utf8');
        for (const [, reference] of source.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/gi)) {
            if (!reference || reference.startsWith('#') || /^[a-z][a-z\d+.-]*:/i.test(reference)) continue;
            const target = path.resolve(cssRoot, decodeURIComponent(reference.split(/[?#]/, 1)[0]));
            if (!target.startsWith(`${root}${path.sep}`) || !fs.existsSync(target)) {
                missingReferences.push(`${cssFile}: ${reference}`);
            }
        }
    }

    assert.deepEqual(missingReferences, [], missingReferences.join('\n'));
});

test('Vite includes every root HTML page in its multi-page build', async () => {
    const { default: config } = await import(pathToFileURL(path.join(root, 'vite.config.mjs')));
    const input = config.build.rolldownOptions.input;
    const configuredPages = Object.keys(input).filter(name => !name.includes('/')).map(name => `${name}.html`).sort();

    assert.deepEqual(configuredPages, [...htmlFiles].sort());
    assert.ok(!Object.hasOwn(input, 'api'), 'server functions are not client page entries');
});

test('assistant provider is shared across every page and matches the host environment', () => {
    const configPath = path.join(root, 'assets', 'js', 'assistant-config.js');
    const configSource = fs.readFileSync(configPath, 'utf8');

    for (const page of htmlFiles) {
        const html = fs.readFileSync(path.join(root, page), 'utf8');
        assert.match(html, /assets\/js\/assistant-config\.js/, `${page} loads the shared provider config`);
    }

    for (const [hostname, provider, model] of [
        ['127.0.0.1', 'ollama', 'qwen3:4b'],
        ['localhost', 'ollama', 'qwen3:4b'],
        ['math.example.com', 'gemini', 'gemini-3.5-flash-lite'],
    ]) {
        const window = { location: { hostname } };
        vm.runInNewContext(configSource, { window }, { filename: 'assistant-config.js' });
        assert.equal(window.MATHEMATICS_AI_PROVIDER, provider, `${hostname} selects its appropriate provider`);
        assert.equal(window.MATHEMATICS_AI_MODEL, model, `${hostname} selects the matching model`);
        assert.equal(window.MATHEMATICS_AI_ENDPOINT, '/api/assistant');
    }
});

test('generated knowledge manifest matches topic and example files', () => {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    assert.deepEqual(manifest, buildManifest(), 'run npm run knowledge:build after adding or renaming a topic');
});

test('browser knowledge loader resolves manifest modules and exposes topic lookups', async () => {
    const window = {};
    const scriptUrl = new URL('assets/js/curriculum-data.js', 'http://archive.test/index.html');
    const document = { currentScript: { src: scriptUrl.href } };
    const fetch = async resource => {
        const url = new URL(resource);
        const localPath = path.join(root, decodeURIComponent(url.pathname.replace(/^\//, '')));
        if (!fs.existsSync(localPath)) return { ok: false, status: 404 };
        return { ok: true, json: async () => JSON.parse(fs.readFileSync(localPath, 'utf8')) };
    };
    const context = { window, document, fetch, console, URL };
    const source = fs.readFileSync(path.join(root, 'assets', 'js', 'curriculum-data.js'), 'utf8');
    vm.runInNewContext(source, context, { filename: 'curriculum-data.js' });

    const data = await window.GRADE_11_MATH_DATA_READY;
    assert.equal(data.topics.length, buildManifest().topics.length);
    assert.equal(data.examples.length, data.topics.length);
    assert.equal(window.Grade11MathKnowledgeBase.getTopic('functions').topicName, 'Functions');
    assert.equal(window.Grade11MathKnowledgeBase.getExamples('Functions').topicName, 'Functions');
});

test('page assets and knowledge sources follow the organized folder layout', () => {
    for (const requiredDirectory of [
        'assets/css',
        'assets/js',
        'assets/images',
        'api',
        'data/knowledge/topics',
        'data/knowledge/examples',
        'data/templates',
        'docs/references'
    ]) {
        assert.ok(fs.statSync(path.join(root, requiredDirectory)).isDirectory(), `${requiredDirectory} exists`);
    }

    assert.equal(fs.existsSync(path.join(root, 'knowledge')), false, 'the old top-level knowledge folder is retired');
    assert.equal(fs.existsSync(path.join(root, 'assistant.js')), false, 'runtime scripts live under assets/js');
    assert.equal(fs.existsSync(path.join(root, 'styles.css')), false, 'stylesheets live under assets/css');
    assert.ok(fs.existsSync(path.join(root, 'api', 'assistant.js')), 'Vercel Gemini function exists');
    assert.ok(fs.existsSync(path.join(root, '.env.example')), 'safe environment-variable names are documented');
});

test('Gemini credentials are only read by the server function', () => {
    const browserJsRoot = path.join(root, 'assets', 'js');
    const browserFiles = fs.readdirSync(browserJsRoot).filter(file => file.endsWith('.js'));
    for (const browserFile of browserFiles) {
        const source = fs.readFileSync(path.join(browserJsRoot, browserFile), 'utf8');
        assert.doesNotMatch(source, /GEMINI_API_KEY|AIza[\w-]{30,}/, `${browserFile} must not contain a Gemini credential`);
    }

    const serverSource = fs.readFileSync(path.join(root, 'api', 'assistant.js'), 'utf8');
    assert.match(serverSource, /process\.env\.GEMINI_API_KEY/, 'the proxy reads credentials only from the server environment');
});

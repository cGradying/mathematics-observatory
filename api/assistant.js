const DEFAULT_MODEL = 'gemini-3.5-flash-lite'; // stable Flash-Lite per ai.google.dev/gemini-api/docs/models
const UPSTREAM_TIMEOUT_MS = 45_000;
const MAX_BODY_BYTES = 48_000;
const MAX_MESSAGES = 8;
const MAX_MESSAGE_CHARACTERS = 16_000;
const MAX_REQUESTS_PER_MINUTE = 30;
const MAX_RATE_BUCKETS = 5_000;
const RATE_WINDOW_MS = 60_000;
// Best-effort protection only: serverless instances do not share this in-memory map.
const rateBuckets = new Map();

function sendJson(response, status, body) {
    response.setHeader('Content-Type', 'application/json; charset=utf-8');
    response.setHeader('Cache-Control', 'no-store');
    return response.status(status).json(body);
}

function fail(response, status, code, error) {
    return sendJson(response, status, { error, code });
}

function parseBody(body) {
    if (typeof body === 'string') return JSON.parse(body);
    if (Buffer.isBuffer(body)) return JSON.parse(body.toString('utf8'));
    return body;
}

function validateRequest(body) {
    if (!body || !Array.isArray(body.messages) || body.messages.length < 2 || body.messages.length > MAX_MESSAGES) {
        return 'A request must contain 2 to 8 conversation messages.';
    }

    let characterCount = 0;
    for (const message of body.messages) {
        if (!message || !['system', 'user', 'assistant'].includes(message.role)
            || typeof message.content !== 'string' || !message.content.trim()) {
            return 'Each conversation message needs a supported role and non-empty text.';
        }
        characterCount += message.content.length;
    }
    if (characterCount > MAX_MESSAGE_CHARACTERS) return 'The conversation is too large.';
    return '';
}

function mapSchema(schema, depth = 0) {
    if (!schema || typeof schema !== 'object' || Array.isArray(schema) || depth > 8) return undefined;
    const mapped = {};
    if (typeof schema.type === 'string') mapped.type = schema.type.toUpperCase();
    if (Array.isArray(schema.required)) mapped.required = schema.required.filter(item => typeof item === 'string').slice(0, 64);
    if (Array.isArray(schema.enum)) mapped.enum = schema.enum.slice(0, 100);
    if (typeof schema.description === 'string') mapped.description = schema.description;
    if (schema.properties && typeof schema.properties === 'object') {
        mapped.properties = Object.fromEntries(
            Object.entries(schema.properties).slice(0, 64).map(([key, value]) => [key, mapSchema(value, depth + 1)])
        );
    }
    if (schema.items) mapped.items = mapSchema(schema.items, depth + 1);
    return mapped;
}

function allowRequest(ip, now = Date.now()) {
    if (!ip) return true;
    for (const [key, bucket] of rateBuckets) {
        if (now - bucket.startedAt >= RATE_WINDOW_MS) rateBuckets.delete(key);
    }
    if (rateBuckets.size >= MAX_RATE_BUCKETS && !rateBuckets.has(ip)) {
        const oldestKey = rateBuckets.keys().next().value;
        if (oldestKey) rateBuckets.delete(oldestKey);
    }

    const bucket = rateBuckets.get(ip);
    if (!bucket || now - bucket.startedAt >= RATE_WINDOW_MS) {
        rateBuckets.set(ip, { startedAt: now, count: 1 });
        return true;
    }
    if (bucket.count >= MAX_REQUESTS_PER_MINUTE) return false;
    bucket.count += 1;
    return true;
}

async function assistant(request, response) {
    if (request.method === 'OPTIONS') {
        // No CORS headers are sent: the endpoint is same-origin only.
        response.setHeader('Allow', 'POST, OPTIONS');
        return response.status(204).end();
    }
    if (request.method !== 'POST') {
        response.setHeader('Allow', 'POST, OPTIONS');
        return fail(response, 405, 'method_not_allowed', 'Use POST to send an assistant question.');
    }

    // Same-origin only. Works for custom domains, *.vercel.app previews and `vercel dev`
    // because the browser Origin must match the host the request arrived on.
    const requestHost = String(request.headers?.['x-forwarded-host'] || request.headers?.host || '')
        .split(',')[0].trim().toLowerCase();
    const origin = request.headers?.origin;
    if (origin && requestHost) {
        try {
            if (new URL(origin).host.toLowerCase() !== requestHost) {
                return fail(response, 403, 'bad_origin', 'Cross-origin assistant requests are not allowed.');
            }
        } catch {
            return fail(response, 403, 'bad_origin', 'Invalid request origin.');
        }
    }

    let body;
    try {
        body = parseBody(request.body);
    } catch {
        return fail(response, 400, 'bad_request', 'Request body must be valid JSON.');
    }
    let bodySize;
    try {
        bodySize = Buffer.byteLength(JSON.stringify(body ?? null), 'utf8');
    } catch {
        return fail(response, 400, 'bad_request', 'Request body must be JSON data.');
    }
    if (bodySize > MAX_BODY_BYTES) return fail(response, 413, 'too_large', 'The request is too large.');

    const validationError = validateRequest(body);
    if (validationError) return fail(response, 400, 'bad_request', validationError);

    const forwardedFor = request.headers?.['x-forwarded-for'];
    const clientIp = String(forwardedFor || request.socket?.remoteAddress || '').split(',')[0].trim();
    if (!allowRequest(clientIp)) {
        return fail(response, 429, 'rate_limited', 'Too many questions. Please wait a minute and try again.');
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return fail(response, 503, 'not_configured', 'The AI tutor is not configured yet. Please try again later.');

    const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;
    if (!/^[a-zA-Z0-9._-]+$/.test(model)) return fail(response, 500, 'bad_model', 'The configured Gemini model name is invalid.');

    const systemMessage = body.messages.find(message => message.role === 'system');
    const contents = body.messages
        .filter(message => message.role !== 'system')
        .map(message => ({
            role: message.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: message.content }]
        }));
    if (!contents.length || contents[contents.length - 1].role !== 'user') {
        return fail(response, 400, 'bad_request', 'The final conversation message must be a user question.');
    }

    const generationConfig = { temperature: 0.2, maxOutputTokens: 768 };
    const responseSchema = mapSchema(body.format);
    if (responseSchema) {
        generationConfig.responseMimeType = 'application/json';
        generationConfig.responseSchema = responseSchema;
    }

    try {
        const upstream = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
                body: JSON.stringify({
                    systemInstruction: systemMessage ? { parts: [{ text: systemMessage.content }] } : undefined,
                    contents,
                    generationConfig
                }),
                signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS)
            }
        );

        if (!upstream.ok) {
            // Log status only: never the request body, the response body or the key.
            console.error(`assistant: Gemini HTTP ${upstream.status}`);
            if (upstream.status === 429) return fail(response, 429, 'upstream_rate_limited', 'The AI tutor is busy right now. Please wait a moment and try again.');
            if (upstream.status === 401 || upstream.status === 403) return fail(response, 503, 'upstream_auth', 'The AI tutor is not available right now. Please try again later.');
            if (upstream.status === 404) return fail(response, 503, 'upstream_model', 'The AI tutor is not available right now. Please try again later.');
            return fail(response, 502, 'upstream_error', 'The AI tutor could not answer just now. Please try again.');
        }

        const result = await upstream.json();
        const blockReason = result.promptFeedback?.blockReason;
        const candidate = result.candidates?.[0];
        if (blockReason || ['SAFETY', 'PROHIBITED_CONTENT', 'BLOCKLIST', 'SPII', 'RECITATION'].includes(candidate?.finishReason)) {
            return fail(response, 422, 'blocked', 'That question could not be answered. Try rewording it as a Grade 11 maths question.');
        }
        const content = (candidate?.content?.parts || []).map(part => part.text || '').join('').trim();
        if (!content) return fail(response, 502, 'empty', 'The AI tutor returned an empty answer. Please try again.');
        if (candidate.finishReason === 'MAX_TOKENS' && responseSchema) {
            try { JSON.parse(content); } catch {
                return fail(response, 502, 'truncated', 'That answer was too long to finish. Please ask a shorter or more specific question.');
            }
        }

        // Keep the Ollama response shape so the existing tutor formatter remains provider-independent.
        return sendJson(response, 200, { message: { content } });
    } catch (error) {
        const timedOut = error?.name === 'TimeoutError' || error?.name === 'AbortError';
        console.error(`assistant: upstream ${timedOut ? 'timeout' : 'network error'}`);
        return timedOut
            ? fail(response, 504, 'timeout', 'The AI tutor took too long. Please try again.')
            : fail(response, 502, 'unreachable', 'The AI tutor could not be reached. Please try again.');
    }
}

module.exports = assistant;
module.exports.mapSchema = mapSchema;
module.exports.validateRequest = validateRequest;
module.exports.DEFAULT_MODEL = DEFAULT_MODEL;

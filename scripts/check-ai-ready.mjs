// Usage: GEMINI_API_KEY=... npm run ai:check   (optional GEMINI_MODEL)
// Calls Gemini once with a tiny prompt and prints PASS/FAIL. Never prints the key.
const key = process.env.GEMINI_API_KEY;
const model = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
if (!key) {
    console.log('FAIL: GEMINI_API_KEY is not set.');
    console.log('  Set it in Vercel -> Settings -> Environment Variables (Production + Preview), or locally in .env.local:');
    console.log(`  GEMINI_API_KEY=<key from https://aistudio.google.com/apikey>\n  GEMINI_MODEL=${model} (optional)`);
    process.exit(1);
}
try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
        body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: 'What is 15% of 80? Reply as JSON.' }] }],
            generationConfig: { temperature: 0, maxOutputTokens: 64, responseMimeType: 'application/json',
                responseSchema: { type: 'OBJECT', properties: { answer: { type: 'STRING' } }, required: ['answer'] } }
        }),
        signal: AbortSignal.timeout(20_000)
    });
    const json = await r.json().catch(() => ({}));
    const text = json.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('').trim();
    if (r.ok && text) { console.log(`PASS: ${model} answered (${text.slice(0, 60)})`); process.exit(0); }
    console.log(`FAIL: ${model} -> HTTP ${r.status} ${String(json.error?.message || 'empty reply').replaceAll(key, '***').slice(0, 200)}`);
} catch (e) {
    console.log(`FAIL: ${e?.name || 'Error'} reaching Gemini`);
}
process.exit(1);

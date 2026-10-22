(() => {
    const localHosts = new Set(['localhost', '127.0.0.1', '::1', '[::1]']);
    const isLocalDevelopment = localHosts.has(window.location?.hostname);

    // Use the learner's own Ollama only on loopback. Hosted pages use the
    // server-side Gemini proxy so provider credentials stay off the client.
    window.MATHEMATICS_AI_ENDPOINT = '/api/assistant';
    window.MATHEMATICS_AI_PROVIDER = isLocalDevelopment ? 'ollama' : 'gemini';
    window.MATHEMATICS_AI_MODEL = isLocalDevelopment ? 'qwen3:4b' : 'gemini-3.5-flash-lite';
})();

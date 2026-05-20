/**
 * groq.js
 * Lightweight client for the Groq Inference API.
 * Uses the OpenAI-compatible chat completions endpoint.
 *
 * Model: llama-3.1-8b-instant
 *   - Groq's fastest free-tier model
 *   - Excellent at structured JSON output
 *   - ~750 tokens/sec — effectively instant for announcement copy
 *
 * Free tier: 30 req/min, 14,400 req/day — far more generous than Gemini.
 *
 * Proxied through /api/groq → api.groq.com to avoid browser CORS.
 * (see vite.config.js Groq proxy block)
 *
 * Used by: src/lib/prompts/composer.js (Announcement module only)
 */

const GROQ_API_KEY = 
  (typeof process !== 'undefined' && process.env?.VITE_GROQ_API_KEY) ||
  (import.meta.env?.VITE_GROQ_API_KEY);
const MODEL        = 'llama-3.1-8b-instant';
const ENDPOINT     = '/api/groq/openai/v1/chat/completions';

/**
 * Sends a single-turn prompt to Groq and returns the text response.
 * Drop-in replacement for callGemini() — same signature.
 *
 * @param {string} prompt                  - The complete prompt (system + user rules).
 * @param {object} [opts]
 * @param {number} [opts.temperature=0.5]  - Sampling temperature (0 = deterministic).
 * @param {number} [opts.maxTokens=400]    - Maximum tokens to generate.
 * @param {object} [opts.responseFormat]   - Optional response format parameter (e.g. { type: 'json_object' }).
 * @returns {Promise<string>}              - Raw text from the model.
 * @throws {Error}                         - On network failure or non-OK API response.
 */
export async function callGroq(prompt, { temperature = 0.5, maxTokens = 400, responseFormat = null } = {}) {
  if (!GROQ_API_KEY || GROQ_API_KEY === 'your_groq_api_key_here') {
    throw new Error('VITE_GROQ_API_KEY is not set. Add it to your .env file.');
  }

  const body = {
    model: MODEL,
    messages: [
      {
        role:    'user',
        content: prompt,
      },
    ],
    max_tokens:  maxTokens,
    temperature: temperature,
    stream:      false,
  };

  if (responseFormat) {
    body.response_format = responseFormat;
  }

  const res = await fetch(ENDPOINT, {
    method:  'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_API_KEY}`,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => '');
    if (res.status === 429) {
      throw new Error(
        'Groq rate limit reached. Please wait a moment and try again.'
      );
    }
    throw new Error(`Groq API error ${res.status}: ${err.substring(0, 300)}`);
  }

  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error('Groq returned an empty response.');
  return text.trim();
}

/**
 * huggingfaceText.js
 * Text-generation client using the HuggingFace standard Inference API.
 *
 * Endpoint: https://api-inference.huggingface.co/models/{model}
 * Format:   POST { "inputs": "...", "parameters": { ... } }
 * Response: [{ "generated_text": "..." }]
 *
 * Model: mistralai/Mistral-7B-Instruct-v0.3
 *   - Free tier on HuggingFace standard Inference API
 *   - Uses <s>[INST]...[/INST] instruction wrapping for reliable output
 *   - Shares the existing VITE_HF_API_KEY — no new key needed
 *
 * Proxied through /api/hf-text → api-inference.huggingface.co
 * (see vite.config.js HF-Text proxy block)
 *
 * Used by: src/lib/prompts/composer.js (Announcement module only)
 * NOT used by: huggingface.js (image generation via FLUX)
 */

import { getHFKey } from './config';
const MODEL      = 'mistralai/Mistral-7B-Instruct-v0.3';
const ENDPOINT   = `/api/hf-text/models/${MODEL}`;

/**
 * Sends a prompt to Mistral-7B-Instruct via HuggingFace standard Inference API.
 *
 * Drop-in replacement for callGemini() in the Announcement composer.
 * Wraps the prompt in Mistral's [INST] instruction format for reliable JSON output.
 *
 * @param {string} prompt                  - The complete prompt (system + user).
 * @param {object} [opts]
 * @param {number} [opts.temperature=0.5]  - Sampling temperature (0 = deterministic).
 * @param {number} [opts.maxTokens=400]    - Maximum tokens to generate.
 * @returns {Promise<string>}              - Raw generated text from the model.
 * @throws {Error}                         - On network failure or non-OK API response.
 */
export async function callHFText(prompt, { temperature = 0.5, maxTokens = 400 } = {}) {
  const apiKey = getHFKey();
  if (!apiKey) {
    throw new Error('VITE_HF_API_KEY is not set. Add it to your .env file or Settings.');
  }

  // Mistral-7B-Instruct requires [INST]...[/INST] wrapping for instruction following.
  // return_full_text: false ensures only the generated response is returned,
  // not the original prompt echoed back.
  const body = {
    inputs: `<s>[INST] ${prompt} [/INST]`,
    parameters: {
      max_new_tokens:   maxTokens,
      temperature:      Math.max(temperature, 0.01), // HF rejects 0.0 exactly
      return_full_text: false,
      do_sample:        temperature > 0.01,
    },
  };

  const res = await fetch(ENDPOINT, {
    method:  'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => '');
    throw new Error(`HuggingFace text API error ${res.status}: ${err.substring(0, 300)}`);
  }

  const data = await res.json();

  // Standard Inference API returns an array: [{ "generated_text": "..." }]
  const text = Array.isArray(data) ? data[0]?.generated_text : data?.generated_text;
  if (!text) throw new Error('HuggingFace returned an empty response.');
  return text.trim();
}

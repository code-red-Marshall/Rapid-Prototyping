/**
 * gemini.js
 * Lightweight client for Google Gemini API (gemini-2.0-flash).
 * Routed through the Vite proxy (/api/gemini) to avoid browser CORS restrictions.
 *
 * Used by the Announcement module to generate announcement copy.
 * Does NOT handle image generation — that remains in huggingface.js.
 */

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const MODEL          = 'gemini-2.0-flash';
const ENDPOINT       = `/api/gemini/v1beta/models/${MODEL}:generateContent`;

// ─────────────────────────────────────────────────────────────────────────────
// CORE CALLER
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Sends a single-turn prompt to Gemini and returns the text response.
 *
 * @param {string} prompt - The complete prompt to send.
 * @param {object} [opts]
 * @param {number} [opts.temperature=0.7]
 * @param {number} [opts.maxTokens=512]
 * @returns {Promise<string>} Generated text from Gemini.
 */
export async function callGemini(prompt, { temperature = 0.7, maxTokens = 512 } = {}) {
  if (!GEMINI_API_KEY || GEMINI_API_KEY === 'your_gemini_api_key_here') {
    throw new Error('VITE_GEMINI_API_KEY is not set. Add it to your .env file.');
  }

  const url = `${ENDPOINT}?key=${GEMINI_API_KEY}`;

  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature,
      maxOutputTokens: maxTokens,
    },
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => '');
    if (res.status === 429) {
      throw new Error(
        'Gemini API quota exceeded. Your free tier limit has been reached. ' +
        'Please wait a few minutes and try again, or check your quota at ai.google.dev/gemini-api/docs/rate-limits'
      );
    }
    throw new Error(`Gemini API error ${res.status}: ${err.substring(0, 300)}`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Gemini returned an empty response.');
  return text.trim();
}

// ─────────────────────────────────────────────────────────────────────────────
// ANNOUNCEMENT GENERATION FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generates announcement copy for a given type and context.
 *
 * Returns a structured object with all generated fields so the caller
 * can pre-fill multiple form inputs from a single API call.
 *
 * @param {object} params
 * @param {'award'|'badge'|'birthday'|'work_anni'|'onboarding'|'custom'} params.type
 * @param {string}  params.recipientName   - e.g. "Sarah Johnson"
 * @param {string}  params.awardOrBadge    - e.g. "Customer Champion Award"
 * @param {string}  params.companyName     - e.g. "Acme Corp"
 * @param {string}  params.extraContext    - Optional free-text context from the user
 * @param {'formal'|'friendly'|'celebratory'} [params.tone='friendly']
 * @returns {Promise<{ title: string, feedMessage: string, emailSubject: string, emailBody: string }>}
 */
export async function generateAnnouncementCopy({
  type,
  recipientName  = '{{recipient_name}}',
  awardOrBadge   = '{{award_name}}',
  companyName    = '{{company_name}}',
  extraContext   = '',
  tone           = 'friendly',
}) {
  const typeDescriptions = {
    award:       'a formal award recognition',
    badge:       'a peer-to-peer badge recognition',
    birthday:    'a birthday greeting',
    work_anni:   'a work anniversary milestone celebration',
    onboarding:  'a new employee welcome announcement',
    custom:      'a general company announcement',
  };

  const toneGuide = {
    formal:       'professional, polished, corporate — no emojis',
    friendly:     'warm, personable, conversational — 1–2 emojis OK',
    celebratory:  'enthusiastic, upbeat, exciting — emojis encouraged',
  };

  const prompt = `
You are an internal communications specialist at a company called "${companyName}".
Your task is to write announcement copy for ${typeDescriptions[type] || 'a recognition event'}.

CONTEXT:
- Recipient: ${recipientName}
- Recognition: ${awardOrBadge}
- Tone: ${tone} — ${toneGuide[tone] || toneGuide.friendly}
${extraContext ? `- Extra context: ${extraContext}` : ''}

OUTPUT FORMAT (return EXACTLY this JSON, no markdown fences, no extra text):
{
  "title": "<short catchy announcement title, max 12 words>",
  "feedMessage": "<activity feed post body, 2–3 sentences, uses {{recipient_name}} and {{award_name}} as placeholders>",
  "emailSubject": "<email subject line, max 10 words, use {{recipient_name}}>",
  "emailBody": "<email body, 3–4 sentences, formal closing, use {{recipient_name}}, {{award_name}}, {{company_name}}>"
}

Write only the JSON object. Do NOT include any explanation or markdown.
`.trim();

  const raw = await callGemini(prompt, { temperature: 0.75, maxTokens: 600 });

  // Safely parse — strip any accidental markdown fences Gemini might add
  const cleaned = raw.replace(/^```json?\s*/i, '').replace(/\s*```$/i, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    // Fallback: return the raw text in feedMessage so the user gets something useful
    console.warn('[Gemini] JSON parse failed — returning raw text as feedMessage');
    return {
      title:        '',
      feedMessage:  raw,
      emailSubject: '',
      emailBody:    '',
    };
  }
}

/**
 * tones/friendly.js
 * Tone descriptor for FRIENDLY workplace announcements.
 *
 * Scope: voice, title behaviour, opening rules, closing rules, guardrails.
 * Out of scope: output format, JSON rules, hallucination prevention, domain restriction.
 *   Those concerns are owned by basePrompt.js.
 */

export const friendlyTone = {
  id: 'friendly',
  label: 'Friendly',

  /** ── VOICE & STYLE ─────────────────────────────────────────────────────────
   */
  voice: `
- Write in a warm, approachable register that feels human and collegial.
- Use conversational but professional language — the tone of a trusted colleague, not a close friend.
- Contractions are acceptable ("we're", "you'll", "it's").
- One or two emojis are acceptable if they reinforce the message, not distract from it.
- Avoid corporate jargon and bureaucratic phrasing.
`.trim(),

  /** ── TITLE BEHAVIOUR ───────────────────────────────────────────────────────
   */
  titleBehavior: `
- The title should feel inviting and human.
- May use a friendly greeting pattern (e.g. "A Heads-Up on Upcoming Leave Policy Changes").
- An exclamation mark is acceptable if the event is genuinely positive.
- Capitalise the first word and proper nouns only (sentence case).
`.trim(),

  /** ── OPENING RULES ─────────────────────────────────────────────────────────
   */
  openingRules: `
- Open with a short, human statement that orients the reader quickly.
- Example pattern: "We wanted to share a quick update about [topic]."
- A brief, relevant greeting is acceptable (e.g. "Hi everyone,").
- Do not open with dense institutional language.
`.trim(),

  /** ── CLOSING RULES ─────────────────────────────────────────────────────────
   */
  closingRules: `
- Close with an encouraging or connecting statement.
- Example: "As always, reach out if you have any questions — we're happy to help."
- A light sign-off is acceptable ("Thanks!", "Cheers,").
- Do not end abruptly with only a factual statement and no acknowledgement of the reader.
`.trim(),

  /** ── TONE GUARDRAILS ────────────────────────────────────────────────────────
   */
  guardrails: `
- Friendly does not mean casual to the point of unprofessionalism.
- Do not use slang, memes, or hyperbolic praise.
- Do not manufacture warmth where the announcement topic is serious (e.g. policy enforcement).
- Keep factual accuracy — warmth must not soften or distort key details.
`.trim(),
};

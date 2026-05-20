/**
 * tones/corporate.js
 * Tone descriptor for CORPORATE workplace announcements.
 *
 * Scope: voice, title behaviour, opening rules, closing rules, guardrails.
 * Out of scope: output format, JSON rules, hallucination prevention, domain restriction.
 *   Those concerns are owned by basePrompt.js.
 */

export const corporateTone = {
  /**
   * ID used by the composer to look up this tone object.
   * Must match the value stored in TONE_MAP in composer.js.
   */
  id: 'corporate',

  /** Display label shown in the UI tone selector. */
  label: 'Corporate',

  /** ── VOICE & STYLE ─────────────────────────────────────────────────────────
   * Defines the overall register and language conventions for this tone.
   */
  voice: `
- Write in a formal, professional register consistent with executive-level internal communication.
- Use complete sentences with precise, unambiguous language.
- Prefer the active voice. Avoid passive constructions unless they strengthen formality.
- Use institutional vocabulary (e.g. "announce", "inform", "effective", "pursuant to").
- No contractions (use "do not" not "don't"), colloquialisms, or slang.
- No emojis.
`.trim(),

  /** ── TITLE BEHAVIOUR ───────────────────────────────────────────────────────
   * Rules specific to how the title should be formed in this tone.
   */
  titleBehavior: `
- The title must be declarative and institutional in nature.
- Begin with an action verb or the subject of the announcement (e.g. "Annual Performance Review Cycle Opens", "Policy Update: Remote Work Guidelines").
- Do not use exclamation marks or informal phrasing in the title.
- Capitalise all principal words (Title Case).
`.trim(),

  /** ── OPENING RULES ─────────────────────────────────────────────────────────
   * How the first sentence of the description should be structured.
   */
  openingRules: `
- Open with a formal statement of purpose: who is communicating, what is being communicated.
- Example pattern: "We are writing to inform all [audience] of [topic]."
- Do not open with a question, an anecdote, or an emoji.
- Do not address the reader by first name in the opening line.
`.trim(),

  /** ── CLOSING RULES ─────────────────────────────────────────────────────────
   * How the final sentence or call-to-action should be structured.
   */
  closingRules: `
- Close with a clear action item or acknowledgement statement.
- If no action is required, end with an institutional sign-off such as "Thank you for your continued commitment."
- Do not use phrases like "Stay tuned!" or "Exciting things ahead!"
`.trim(),

  /** ── TONE GUARDRAILS ────────────────────────────────────────────────────────
   * Boundaries the tone must not cross, regardless of user input.
   */
  guardrails: `
- Do not introduce warmth, humour, or celebratory language.
- Do not speculate or editorialize; report facts only.
- If the event is positive (e.g. a promotion), acknowledge it with measured formality, not enthusiasm.
- Avoid superlatives ("incredible", "amazing", "best").
`.trim(),
};

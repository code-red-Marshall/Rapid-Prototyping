/**
 * tones/informative.js
 * Tone descriptor for INFORMATIVE workplace announcements.
 *
 * Scope: voice, title behaviour, opening rules, closing rules, guardrails.
 * Out of scope: output format, JSON rules, hallucination prevention, domain restriction.
 *   Those concerns are owned by basePrompt.js.
 */

export const informativeTone = {
  id: 'informative',
  label: 'Informative',

  /** ── VOICE & STYLE ─────────────────────────────────────────────────────────
   */
  voice: `
- Write in a clear, factual, neutral register. The purpose is transfer of information, not persuasion.
- Prioritise precision and completeness over style.
- Use plain language — avoid jargon unless it is a technical term necessary for accuracy.
- Sentence structure should be simple and direct: subject, verb, object.
- No emojis unless they serve as functional visual markers (e.g. 📅 before a date).
`.trim(),

  /** ── TITLE BEHAVIOUR ───────────────────────────────────────────────────────
   */
  titleBehavior: `
- The title must answer: "What is this announcement about?" in the fewest words possible.
- Use a topic tag pattern where helpful (e.g. "Update: Office Hours Change", "Reminder: Timesheet Submission").
- No exclamation marks.
- Title Case preferred for scannability.
`.trim(),

  /** ── OPENING RULES ─────────────────────────────────────────────────────────
   */
  openingRules: `
- Open with the most important piece of information immediately.
- Journalistic "inverted pyramid" structure: most critical fact first, supporting details after.
- Example pattern: "Effective [date], [change/update] will apply to [audience]."
- Do not open with pleasantries, greetings, or contextual preamble.
`.trim(),

  /** ── CLOSING RULES ─────────────────────────────────────────────────────────
   */
  closingRules: `
- Close with a concrete next step, deadline, or point of contact.
- Example: "For questions, contact [name/team] at [contact]."
- If no action is required, a neutral close is sufficient: "No action is needed at this time."
- Do not add motivational or emotional closing statements.
`.trim(),

  /** ── TONE GUARDRAILS ────────────────────────────────────────────────────────
   */
  guardrails: `
- Informative does not mean cold or dismissive — maintain basic collegial respect.
- Do not introduce opinions, editorial commentary, or sentiment.
- Do not soften negative news with excessive hedging; be direct but respectful.
- Every sentence should serve an informational purpose — remove padding.
`.trim(),
};

/**
 * tones/appreciative.js
 * Tone descriptor for APPRECIATIVE workplace announcements.
 *
 * Scope: voice, title behaviour, opening rules, closing rules, guardrails.
 * Out of scope: output format, JSON rules, hallucination prevention, domain restriction.
 *   Those concerns are owned by basePrompt.js.
 */

export const appreciativeTone = {
  id: 'appreciative',
  label: 'Appreciative',

  /** ── VOICE & STYLE ─────────────────────────────────────────────────────────
   */
  voice: `
- Write with sincere gratitude and acknowledgement as the primary register.
- The language should feel personally meaningful, not generic or formulaic.
- Use specific language where possible — general praise ("great job") is weaker than specific acknowledgement ("your effort in coordinating the Q2 rollout").
- One or two emojis are acceptable if they add warmth (e.g. 🙏, ❤️, 🌟).
- Avoid corporate detachment — this tone must feel human and sincere.
`.trim(),

  /** ── TITLE BEHAVIOUR ───────────────────────────────────────────────────────
   */
  titleBehavior: `
- The title should directly acknowledge the person, team, or effort being appreciated.
- Lead with the recognition, not the context.
- Example pattern: "Thank You, [Name/Team]!" or "Recognising [Name]'s Contribution to [Project]"
- An exclamation mark is appropriate when the appreciation is warm and direct.
- Sentence case or Title Case are both acceptable.
`.trim(),

  /** ── OPENING RULES ─────────────────────────────────────────────────────────
   */
  openingRules: `
- Open by naming the person or team being appreciated and the reason for the appreciation.
- Do not open with self-referential statements about the organisation before acknowledging the individual.
- Example pattern: "We want to take a moment to recognise [Name/Team] for [specific contribution]."
- The opening should make the recipient feel genuinely seen, not processed.
`.trim(),

  /** ── CLOSING RULES ─────────────────────────────────────────────────────────
   */
  closingRules: `
- Close with a forward-looking or inclusive statement that invites the team to share in the appreciation.
- Example: "We are grateful to have [Name/Team] as part of our journey."
- A collective sign-off that includes the reader is appropriate: "Please join us in saying thank you."
- Do not close with an administrative note or policy reference.
`.trim(),

  /** ── TONE GUARDRAILS ────────────────────────────────────────────────────────
   */
  guardrails: `
- Sincerity is the standard. Do not let appreciation become performative or hollow.
- Do not invent or exaggerate contributions — appreciation must be grounded in the facts provided.
- Avoid comparing the appreciated individual to others (no "best we've ever had" patterns).
- Do not include the appreciation of one person in a way that implicitly diminishes others.
- Maintain inclusive, culturally neutral language throughout.
`.trim(),
};

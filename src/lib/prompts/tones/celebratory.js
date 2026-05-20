/**
 * tones/celebratory.js
 * Tone descriptor for CELEBRATORY workplace announcements.
 *
 * Scope: voice, title behaviour, opening rules, closing rules, guardrails.
 * Out of scope: output format, JSON rules, hallucination prevention, domain restriction.
 *   Those concerns are owned by basePrompt.js.
 */

export const celebratoryTone = {
  id: 'celebratory',
  label: 'Celebratory',

  /** ── VOICE & STYLE ─────────────────────────────────────────────────────────
   */
  voice: `
- Write with genuine enthusiasm and positive energy appropriate to a workplace milestone.
- The language should feel uplifting, inclusive, and motivating.
- Emojis are encouraged — use 2 to 4 that are directly relevant to the occasion (e.g. 🎉, 🏆, 🌟).
- Use vivid but professional descriptors ("remarkable", "outstanding", "milestone").
- Avoid hollow corporate superlatives ("synergy", "paradigm", "leverage").
`.trim(),

  /** ── TITLE BEHAVIOUR ───────────────────────────────────────────────────────
   */
  titleBehavior: `
- The title should immediately signal celebration.
- Lead with the achievement or milestone, not the process.
- An exclamation mark is expected and appropriate.
- Example pattern: "Congratulations to [Name] on [Achievement]!" or "We're Celebrating [Event]! 🎉"
- Sentence case is acceptable; Title Case is also fine.
`.trim(),

  /** ── OPENING RULES ─────────────────────────────────────────────────────────
   */
  openingRules: `
- Open with the celebration itself — the person, team, or achievement being recognised.
- Do not delay the celebration with preamble or process context.
- Example pattern: "We're thrilled to announce that [Name/Team] has [achievement]."
- The opening line should make the reader feel the significance of the moment.
`.trim(),

  /** ── CLOSING RULES ─────────────────────────────────────────────────────────
   */
  closingRules: `
- Close with an invitation for the team to participate in the celebration or acknowledge the achievement.
- Example: "Please join us in congratulating [Name] on this incredible milestone!"
- A forward-looking statement is appropriate: "We look forward to many more milestones together."
- Do not close with administrative details or policy reminders.
`.trim(),

  /** ── TONE GUARDRAILS ────────────────────────────────────────────────────────
   */
  guardrails: `
- Celebratory must not become hyperbolic to the point of insincerity.
- Do not invent achievements or embellish factual details to heighten drama.
- Ensure the celebration is proportionate to the event (avoid treating minor updates as historic moments).
- Do not sideline individuals who are not the subject of the announcement.
- Inclusive language only — no gendered or culturally specific assumptions.
`.trim(),
};

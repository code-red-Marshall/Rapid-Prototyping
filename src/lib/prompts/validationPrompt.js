/**
 * validationPrompt.js
 * Builds the domain validation prompt.
 *
 * Purpose: Gate all three flows (Generate, Rewrite, Evaluate).
 *   Runs FIRST before any other prompt is constructed.
 *   If validation fails, no LLM call for generation/rewriting/evaluation is made.
 *
 * Accepted: HR announcements, office communication, reminders, celebrations, policy updates.
 * Rejected: songs, poems, coding requests, essays, random/spam text.
 *
 * Returns JSON: { "valid": true|false, "reason": "..." }
 */

/**
 * Builds the validation prompt string.
 *
 * @param {string} userInput - The raw text submitted by the user to be validated.
 * @returns {string} A complete, self-contained prompt ready to send to the LLM.
 */
export function buildValidationPrompt(userInput) {
  return `
You are a strict domain validator for an internal HR communications tool.

Your ONLY task is to determine whether the following user input is a legitimate request for a workplace announcement.

ACCEPTED inputs:
- HR announcements (promotions, hiring, departures)
- Office or facility communication (closures, schedule changes, events)
- Reminders (deadlines, submissions, meetings)
- Celebrations (milestones, awards, recognition, birthdays, work anniversaries)
- Policy updates (leave, remote work, conduct, compliance)

REJECTED inputs:

- Coding, technical, or data requests
- Academic essays or research writing
- Random, meaningless, or spam text (e.g. "asdfghjkl", "test test test")
- Requests unrelated to a workplace or HR context
- Inputs that are extremely short AND lack workplace intent
- Inputs that are entirely gibberish or contain no coherent intent
- Songs, rap lyrics, poetry, or fictional storytelling
- Requests for jokes or entertainment
- Generic AI questions unrelated to workplace communication
- Social media captions or marketing copy
- Songs, rap lyrics, poetry, or fictional storytelling
- Requests for jokes or entertainment

SCORING CRITERIA (apply in order, stop at first match):
1. If the input is gibberish, spam, or lacks coherent workplace announcement intent → reject.
2. If the input clearly requests non-workplace content (poem, code, essay) → reject.
3. If the input has a discernible workplace announcement intent → accept.
4. If uncertain, default to rejection with a clear reason.

USER INPUT:
"""
${userInput.trim()}
"""

Respond ONLY with valid JSON. No explanation outside the JSON. No markdown.

Output format:
{
  "valid": true,
  "reason": "Input describes a workplace announcement about [topic]."
}

or

{
  "valid": false,
  "reason": "Input [specific reason — e.g. appears to be a poem request / contains no workplace context / is too short to evaluate]."
}
`.trim();
}

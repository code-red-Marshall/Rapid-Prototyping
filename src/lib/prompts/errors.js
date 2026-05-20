/**
 * errors.js
 * Static error messages for all AI failure modes in the Announcement module.
 * Import these constants wherever error states are surfaced to the user.
 * Do NOT derive these strings dynamically — they must be deterministic.
 */

export const AI_ERRORS = {
  /** Fired when the domain validator rejects a non-HR input. */
  INVALID_DOMAIN:
    'This AI assistant only supports workplace announcements.',

  /** Fired when the input is too short, spammy, or semantically empty. */
  LOW_QUALITY_INPUT:
    'Please enter a valid workplace announcement description.',

  /** Fired when the Gemini API call fails (network, quota, timeout). */
  GENERATION_FAILED:
    'Unable to generate announcement right now. Please try again.',

  /** Fired when the LLM output fails JSON parsing or schema validation. */
  INVALID_OUTPUT:
    'Generated content failed validation. Please try again.',

  /** Fired when the evaluation output does not match the expected score schema. */
  INVALID_SCORE:
    'Evaluation result could not be processed. Please try again.',
    
  INVALID_REWRITE:
      'Unable to improve the announcement right now. Please try again.',
};

/**
 * composer.js
 * Orchestrates the three AI flows for the Announcement module.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * FLOWS
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * GENERATE FLOW
 *   User Prompt → Validation → Base Prompt + Tone (structured injection) → LLM → Output Validator → Result
 *
 * REWRITE FLOW
 *   Manual User Content → Validation → Rewrite Prompt → LLM → Output Validator → Result
 *
 * EVALUATION FLOW
 *   Announcement Text → Validation → Evaluation Prompt → LLM → Score Validator → Result
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * DESIGN PRINCIPLES
 * ─────────────────────────────────────────────────────────────────────────────
 * 1. Each flow is an explicit, named function. No generic "run prompt" wrapper.
 * 2. Tone data is a structured object injected into the base prompt's named slots.
 *    It is NOT appended as a raw string block after the base prompt text.
 * 3. Validation runs on EVERY flow. No LLM call proceeds without a passing validation.
 * 4. Output validation is a pure function — no LLM involved. It checks shape + sentinels.
 * 5. All errors map to static AI_ERRORS constants. No dynamic error string construction.
 */

import { callGroq } from '../groq.js';
import { buildValidationPrompt } from './validationPrompt.js';
import { buildBasePrompt } from './basePrompt.js';
import { buildRewritePrompt } from './rewritePrompt.js';
import { buildEvaluationPrompt } from './evaluationPrompt.js';
import { AI_ERRORS } from './errors.js';

// ── Tone registry ─────────────────────────────────────────────────────────────
// Import all tone descriptors and register them by ID.
// The UI passes a tone ID string; the composer resolves it to the full object.
import { corporateTone }    from './tones/corporate.js';
import { friendlyTone }     from './tones/friendly.js';
import { celebratoryTone }  from './tones/celebratory.js';
import { informativeTone }  from './tones/informative.js';
import { appreciativeTone } from './tones/appreciative.js';

/** @type {Record<string, object>} */
const TONE_MAP = {
  corporate:    corporateTone,
  friendly:     friendlyTone,
  celebratory:  celebratoryTone,
  informative:  informativeTone,
  appreciative: appreciativeTone,
};

/** Fallback tone used when no tone is selected or an unknown ID is passed. */
const DEFAULT_TONE_ID = 'informative';

// ── Shared LLM config ─────────────────────────────────────────────────────────
const VALIDATION_CONFIG  = { temperature: 0.0, maxTokens: 150, responseFormat: { type: 'json_object' } };
const GENERATION_CONFIG  = { temperature: 0.5, maxTokens: 600, responseFormat: { type: 'json_object' } };
const REWRITE_CONFIG     = { temperature: 0.4, maxTokens: 600, responseFormat: { type: 'json_object' } };
const EVALUATION_CONFIG  = { temperature: 0.0, maxTokens: 250, responseFormat: { type: 'json_object' } };


// ─────────────────────────────────────────────────────────────────────────────
// INTERNAL: Shared validation step
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Runs domain + quality validation against user input.
 * Throws the appropriate AI_ERRORS constant if validation fails.
 *
 * @param {string} input - Raw user text to validate.
 * @returns {Promise<void>} Resolves silently if valid.
 * @throws {Error} With message set to the relevant AI_ERRORS constant.
 */
async function runValidation(input) {
  const validationPrompt = buildValidationPrompt(input);
  const raw = await callGroq(validationPrompt, VALIDATION_CONFIG);
  const result = parseJson(raw);

  if (!result) throw new Error(AI_ERRORS.GENERATION_FAILED);

  if (result.valid === false) {
    // Distinguish low-quality from off-domain based on the reason string
    const reason = (result.reason || '').toLowerCase();
    const isLowQuality =
      reason.includes('too short') ||
      reason.includes('gibberish') ||
      reason.includes('spam') ||
      reason.includes('meaningful words');

    throw new Error(
      isLowQuality ? AI_ERRORS.LOW_QUALITY_INPUT : AI_ERRORS.INVALID_DOMAIN,
    );
  }
}


// ─────────────────────────────────────────────────────────────────────────────
// INTERNAL: Output validators (pure functions, no LLM)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Validates the output of the generation flow.
 * Checks shape, sentinel values, and basic content sanity.
 *
 * @param {object|null} parsed - The parsed JSON from the LLM.
 * @returns {{ title: string, description: string }}
 * @throws {Error} AI_ERRORS.INVALID_OUTPUT if output is malformed or sentinel.
 */
function validateGenerationOutput(parsed) {
  if (
    !parsed ||
    typeof parsed.title !== 'string' ||
    typeof parsed.description !== 'string'
  ) {
    throw new Error(AI_ERRORS.INVALID_OUTPUT);
  }

  // Sentinel values set by the base prompt when generation fails internally
  if (
    parsed.description === 'DOMAIN_REJECTED' ||
    parsed.description === 'GENERATION_FAILED' ||
    parsed.title.trim() === ''
  ) {
    throw new Error(AI_ERRORS.INVALID_OUTPUT);
  }

  return {
    title:       parsed.title.trim(),
    description: parsed.description.trim(),
  };
}

/**
 * Validates the output of the rewrite flow.
 *
 * @param {object|null} parsed - The parsed JSON from the LLM.
 * @returns {{ message: string }}
 * @throws {Error} AI_ERRORS.INVALID_OUTPUT if output is malformed or sentinel.
 */
function validateRewriteOutput(parsed) {
  if (!parsed || typeof parsed.message !== 'string') {
    throw new Error(AI_ERRORS.INVALID_OUTPUT);
  }

  if (parsed.message === 'REWRITE_FAILED' || parsed.message.trim() === '') {
    throw new Error(AI_ERRORS.INVALID_OUTPUT);
  }

  return { message: parsed.message.trim() };
}

/**
 * Validates the output of the evaluation flow.
 * Enforces score schema: all fields present, all integers 1–5, overall 1–5.
 *
 * @param {object|null} parsed - The parsed JSON from the LLM.
 * @returns {object} The validated score object.
 * @throws {Error} AI_ERRORS.INVALID_SCORE if shape or values are invalid.
 */
function validateEvaluationOutput(parsed) {
  if (!parsed) throw new Error(AI_ERRORS.INVALID_SCORE);

  // Handle LLM-level domain rejection from the evaluation prompt
  if (parsed.valid === false) {
    throw new Error(AI_ERRORS.INVALID_DOMAIN);
  }

  const { scores, overall } = parsed;

  if (!scores || typeof overall !== 'number') {
    throw new Error(AI_ERRORS.INVALID_SCORE);
  }

  const REQUIRED_SCORE_KEYS = [
    'clarity',
    'logisticsCompleteness',
    'engagementTone',
    'accuracy',
    'readability',
  ];

  for (const key of REQUIRED_SCORE_KEYS) {
    const val = scores[key];
    if (!Number.isInteger(val) || val < 1 || val > 5) {
      throw new Error(AI_ERRORS.INVALID_SCORE);
    }
  }

  if (overall < 1 || overall > 5) {
    throw new Error(AI_ERRORS.INVALID_SCORE);
  }

  return { valid: true, scores, overall };
}


// ─────────────────────────────────────────────────────────────────────────────
// INTERNAL: JSON parser (safe, no throws on bad LLM output)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Safely parses a JSON string from LLM output.
 * Strips conversational wrapping and markdown fences.
 *
 * @param {string} raw - Raw text from the LLM.
 * @returns {object|null} Parsed object, or null on failure.
 */
function parseJson(raw) {
  try {
    let cleaned = raw.trim();
    // Try finding the first '{' and last '}' to extract raw JSON block
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    } else {
      // Fallback: strip markdown fences
      cleaned = cleaned
        .replace(/^```json?\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();
    }
    // Remove trailing commas before closing braces/brackets to avoid parsing errors
    cleaned = cleaned.replace(/,\s*([}\]])/g, '$1');
    return JSON.parse(cleaned);
  } catch (e) {
    console.error('[composer.js] parseJson failed. Raw output:', raw, 'Error:', e);
    return null;
  }
}


// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC: GENERATE FLOW
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GENERATE FLOW
 * User Prompt → Validation → Base Prompt + Tone (structured injection) → LLM → Output Validator → Result
 *
 * Generates a new announcement title and description from a user description.
 * Tone data is injected into the base prompt's named slots — not concatenated.
 *
 * @param {object} params
 * @param {string}  params.userInput    - The validated description of what to announce.
 * @param {string}  [params.toneId]     - Tone ID from TONE_MAP. Defaults to 'informative'.
 * @param {object}  [params.placeholders] - Optional factual context key/value pairs.
 *
 * @returns {Promise<{ title: string, description: string }>}
 * @throws {Error} With message set to an AI_ERRORS constant.
 */
export async function generateAnnouncement({ userInput, toneId = DEFAULT_TONE_ID, placeholders = {} }) {
  // Step 1: Validate input before any generation prompt is built
  await runValidation(userInput);

  // Step 2: Resolve tone object — fall back to default if unknown ID passed
  const tone = TONE_MAP[toneId] ?? TONE_MAP[DEFAULT_TONE_ID];

  // Step 3: Build the composed prompt — tone data injected into named slots
  const prompt = buildBasePrompt({ userInput, tone, placeholders });

  // Step 4: Call LLM
  let raw;
  try {
    raw = await callGroq(prompt, GENERATION_CONFIG);
  } catch {
    throw new Error(AI_ERRORS.GENERATION_FAILED);
  }

  // Step 5: Parse + validate output (pure function, no LLM)
  const parsed = parseJson(raw);
  return validateGenerationOutput(parsed);
}


// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC: REWRITE FLOW
// ─────────────────────────────────────────────────────────────────────────────

/**
 * REWRITE FLOW
 * Manual User Content → Validation → Rewrite Prompt → LLM → Output Validator → Result
 *
 * Improves user-authored announcement text using the CRAFT framework.
 * Only active when the user has typed content manually (gate enforced in UI).
 *
 * @param {object} params
 * @param {string}  params.existingText - The user-authored text to improve.
 * @param {string}  [params.toneId]    - Optional tone ID. If omitted, neutral improvement only.
 *
 * @returns {Promise<{ message: string }>}
 * @throws {Error} With message set to an AI_ERRORS constant.
 */
export async function rewriteAnnouncement({ existingText, toneId = null, originalDraftText = null }) {
  // Step 1: Validate the existing text before rewriting
  await runValidation(existingText);

  // Step 2: Resolve tone object (optional — null means no tone alignment applied)
  const tone = toneId ? (TONE_MAP[toneId] ?? null) : null;

  // Step 3: Build the rewrite prompt
  const prompt = buildRewritePrompt({ existingText, tone, originalDraftText });

  // Step 4: Call LLM
  let raw;
  try {
    raw = await callGroq(prompt, REWRITE_CONFIG);
  } catch {
    throw new Error(AI_ERRORS.GENERATION_FAILED);
  }

  // Step 5: Parse + validate output
  const parsed = parseJson(raw);
  return validateRewriteOutput(parsed);
}


// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC: EVALUATION FLOW
// ─────────────────────────────────────────────────────────────────────────────

/**
 * EVALUATION FLOW
 * Announcement Text → Validation → Evaluation Prompt → LLM → Score Validator → Result
 *
 * Scores an announcement using the CLEAR framework.
 * Returns a deterministic score object with per-dimension scores and an overall.
 *
 * @param {object} params
 * @param {string} params.announcementText - The full announcement text to evaluate.
 *   Typically title + description concatenated, or description alone.
 *
 * @returns {Promise<{ valid: true, scores: object, overall: number }>}
 * @throws {Error} With message set to an AI_ERRORS constant.
 */
export async function evaluateAnnouncement({ announcementText }) {
  // Step 1: Validate the text before evaluation
  await runValidation(announcementText);

  // Step 2: Build the evaluation prompt
  const prompt = buildEvaluationPrompt(announcementText);

  // Step 3: Call LLM
  let raw;
  try {
    raw = await callGroq(prompt, EVALUATION_CONFIG);
  } catch {
    throw new Error(AI_ERRORS.GENERATION_FAILED);
  }

  // Step 4: Parse + validate score output
  const parsed = parseJson(raw);
  return validateEvaluationOutput(parsed);
}


// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC: Tone registry accessor
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns the list of available tones for the UI tone selector.
 * Each entry has an id and a display label.
 *
 * @returns {{ id: string, label: string }[]}
 */
export function getAvailableTones() {
  return Object.values(TONE_MAP).map(({ id, label }) => ({ id, label }));
}

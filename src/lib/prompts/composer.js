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
// INTERNAL: Shared validation step (with caching)
// ─────────────────────────────────────────────────────────────────────────────

let lastValidatedInput = null;
let lastValidationResult = null;

/**
 * Runs domain + quality validation against user input.
 * Throws the appropriate AI_ERRORS constant if validation fails.
 *
 * @param {string} input - Raw user text to validate.
 * @returns {Promise<void>} Resolves silently if valid.
 * @throws {Error} With message set to the relevant AI_ERRORS constant.
 */
async function runValidation(input) {
  if (lastValidatedInput === input) {
    if (lastValidationResult instanceof Error) {
      throw lastValidationResult;
    }
    return;
  }

  lastValidatedInput = input;
  try {
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
    lastValidationResult = null;
  } catch (error) {
    lastValidationResult = error;
    throw error;
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
 * Escapes literal raw control characters (newline, CR, tab) inside double-quoted string values.
 * Correctly ignores actual escaped sequences like \" or \\.
 */
function sanitizeJsonString(str) {
  let inString = false;
  let escaped = false;
  let result = '';
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    if (char === '"' && !escaped) {
      inString = !inString;
      result += char;
    } else if (char === '\\' && !escaped) {
      escaped = true;
      result += char;
    } else {
      if (inString) {
        if (char === '\n') {
          result += '\\n';
        } else if (char === '\r') {
          result += '\\r';
        } else if (char === '\t') {
          result += '\\t';
        } else {
          result += char;
        }
      } else {
        result += char;
      }
      escaped = false;
    }
  }
  return result;
}

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

    // Sanitize literal newlines inside double-quoted string values
    cleaned = sanitizeJsonString(cleaned);

    // Remove trailing commas before closing braces/brackets to avoid parsing errors
    cleaned = cleaned.replace(/,\s*([}\]])/g, '$1');
    return JSON.parse(cleaned);
  } catch (e) {
    console.error('[composer.js] parseJson failed. Raw output:', raw, 'Error:', e);
    return null;
  }
}

/**
 * Deterministically adjusts the generated announcement description to be strictly
 * within the 950 to 1000 character budget.
 *
 * @param {string} desc - The raw generated description.
 * @param {string} toneId - The active tone ID.
 * @returns {string} The perfectly budgeted description.
 */
export function adjustAnnouncementLength(desc, toneId = 'informative', sender = 'Team HR') {
  if (typeof desc !== 'string') return desc;

  const cleanSender = (sender || '').trim();
  if (!cleanSender) return desc;

  // Determine appropriate sign-off phrase based on toneId
  let signOffPhrase = 'Regards';
  if (toneId === 'friendly' || toneId === 'appreciative' || toneId === 'celebratory') {
    signOffPhrase = 'Warm regards';
  } else if (toneId === 'corporate') {
    signOffPhrase = 'Sincerely';
  }

  const signatureBlock = `\n\n${signOffPhrase},\n${cleanSender}`;
  const sigLen = signatureBlock.length;

  // Tone-specific premium paragraphs of precise lengths to fill large gaps
  const TONE_PADDINGS = {
    friendly: [
      { text: "Our goal is to foster an inclusive and supportive environment where everyone can thrive. We encourage everyone to take active advantage of these resources, participate in the upcoming discussions, and share their valuable feedback with our team. Together, we can continue to build a workplace that is collaborative, engaging, and deeply rewarding for all of us. Thank you for your amazing energy, dedication, and positive impact.", len: 387 },
      { text: "We want to make sure everyone feels supported and empowered in their roles. Please take a look at the details, discuss them with your peers, and let us know if there is anything we can do to make this transition smoother for you. Your happiness and success are our greatest achievements!", len: 292 },
      { text: "We appreciate all the hard work and enthusiasm you bring to the team every single day. Let's make this event a great success and continue to drive excellent results together!", len: 176 },
      { text: "We look forward to seeing you all there and celebrating together as a team!", len: 75 },
      { text: "Reach out to our team if you need any assistance.", len: 49 }
    ],
    corporate: [
      { text: "The organization remains committed to maintaining a high-performance environment characterized by operational excellence and strategic alignment. All department heads are requested to ensure their team members review these updates thoroughly and align their quarterly objectives accordingly. Your continuous commitment to these standards ensures our sustained leadership in the marketplace.", len: 398 },
      { text: "Please ensure that all relevant procedures are executed in strict accordance with the updated guidelines. We appreciate your adherence to these professional protocols, which are designed to support our ongoing corporate mission and operational integrity. Thank you for your continued focus and diligence.", len: 307 },
      { text: "For further clarification or detailed operational directives, please contact the program management office directly. We appreciate your prompt attention to this matter and your ongoing dedication.", len: 199 },
      { text: "Please ensure your attendance is logged in the corporate calendar portal.", len: 73 },
      { text: "Thank you for your cooperation and attention to this matter.", len: 60 }
    ],
    celebratory: [
      { text: "This milestone is a direct reflection of our shared passion, perseverance, and incredible team spirit! Let us take this opportunity to celebrate our collective victories, honor the hard work that got us here, and look forward to even greater heights. You all deserve the absolute best, and we cannot wait to celebrate together! Keep shining, keep pushing boundaries, and let's keep winning together!", len: 398 },
      { text: "We are incredibly proud of everything we have accomplished as a team. This success belongs to every single one of you! Let's make the upcoming session a truly memorable one and celebrate our brilliant journey together. Thank you for bringing your best self to work every single day!", len: 285 },
      { text: "Let's celebrate this wonderful occasion with pride and joy! Thank you for your fantastic contributions and for making our team such a vibrant and inspiring place to work.", len: 172 },
      { text: "Let's make this a memorable event and celebrate our success!", len: 61 },
      { text: "We are so excited to celebrate this milestone together!", len: 55 }
    ],
    informative: [
      { text: "Please note that all policy adjustments are designed to align with current industry standards and internal compliance requirements. Comprehensive documentation regarding these changes has been uploaded to the company intranet portal. Employees are advised to review the official handbook updates at their earliest convenience to ensure full compliance. We appreciate your attention to these updates.", len: 396 },
      { text: "All personnel are expected to familiarize themselves with these guidelines immediately. For additional reference material or documentation, please consult the operations repository. We thank you for your prompt attention to this administrative notice and for your cooperation in implementing these changes.", len: 309 },
      { text: "For administrative inquiries or further technical details, please submit a request through the standard internal support channel. We appreciate your prompt attention and cooperation.", len: 184 },
      { text: "Please review the attached guidelines to ensure full operational alignment.", len: 76 },
      { text: "We appreciate your compliance with these administrative protocols.", len: 66 }
    ],
    appreciative: [
      { text: "We want to extend our heartfelt appreciation to everyone for their outstanding contribution, tireless efforts, and inspiring dedication to our collective vision. Your passion is the cornerstone of our company's progress, and we are deeply grateful to have such an exceptional team. Thank you for your continuous support, collaboration, and for making a meaningful difference every single day!", len: 395 },
      { text: "Your hard work, commitment, and positive attitude are what make our team so special and successful. We truly value everything you do and want to make sure you feel fully supported. Thank you for your outstanding dedication and for going above and beyond to deliver excellence.", len: 281 },
      { text: "Thank you again for your incredible contribution to our team's success. Your commitment to excellence is truly inspiring, and we are so grateful for your hard work.", len: 166 },
      { text: "We are deeply grateful for your continuous hard work and dedication!", len: 69 },
      { text: "Thank you for all that you do to make our team successful!", len: 57 }
    ]
  };
 
  // Tone-agnostic micro filler sentences to fill small gaps of 10-54 chars with exact-length matches
  const FILLERS = [
    { text: "Thank you.", len: 10 },
    { text: "Best regards.", len: 13 },
    { text: "Have a great day!", len: 17 },
    { text: "We appreciate you.", len: 18 },
    { text: "Thank you for your time.", len: 24 },
    { text: "We hope to see you there!", len: 25 },
    { text: "We appreciate your support.", len: 27 },
    { text: "Please plan to attend this.", len: 27 },
    { text: "Thank you for your dedication.", len: 30 },
    { text: "Please reach out with questions.", len: 32 },
    { text: "We look forward to seeing you there!", len: 36 },
    { text: "Please check the intranet for updates.", len: 38 },
    { text: "We appreciate your prompt cooperation.", len: 38 },
    { text: "Thank you for your continued dedication.", len: 40 },
    { text: "Thank you for your attention to this issue.", len: 43 },
    { text: "Please contact us if you have any questions.", len: 44 },
    { text: "We look forward to your valuable participation.", len: 47 },
    { text: "We appreciate your commitment to our team success.", len: 50 },
    { text: "Please let us know if you require any special help.", len: 51 }
  ];

  // Let's strip any existing signature block from the end of the input desc to prevent duplication.
  let cleanDesc = desc.trim();
  const trailingSignoffRegex = /\n\n(?:regards|warm regards|best regards|sincerely|cheers|with gratitude|thank you|best)\b.*$/is;
  cleanDesc = cleanDesc.replace(trailingSignoffRegex, '').trim();

  const targetMin = 950 - sigLen;
  const targetMax = 1000 - sigLen;
  const targetOpt = Math.floor((targetMin + targetMax) / 2);

  let L = cleanDesc.length;

  // Helper: split into body and footer
  const markers = ['📆', '🧭', '📅', '⏰', '📍', 'Event Details', 'Agenda Highlights'];
  let markerIndex = -1;
  for (const marker of markers) {
    const idx = cleanDesc.indexOf(marker);
    if (idx !== -1 && (markerIndex === -1 || idx < markerIndex)) {
      markerIndex = idx;
    }
  }

  let body = '';
  let footer = '';
  if (markerIndex === -1) {
    const lastNewline = cleanDesc.lastIndexOf('\n\n');
    if (lastNewline !== -1) {
      body = cleanDesc.substring(0, lastNewline).trim();
      footer = cleanDesc.substring(lastNewline).trim();
    } else {
      body = cleanDesc.trim();
      footer = '';
    }
  } else {
    body = cleanDesc.substring(0, markerIndex).trim();
    footer = cleanDesc.substring(markerIndex).trim();
  }

  // Helper: trim to sentence boundary
  function trimToSentence(text, maxLen) {
    if (text.length <= maxLen) return text;
    let bestIndex = -1;
    const punctuations = ['.', '!', '?'];
    for (let i = 0; i < maxLen - 1; i++) {
      if (punctuations.includes(text[i])) {
        if (i === text.length - 1 || /\s/.test(text[i + 1]) || text[i + 1] === '"') {
          bestIndex = i;
        }
      }
    }
    if (bestIndex !== -1) {
      return text.substring(0, bestIndex + 1).trim();
    }
    let spaceIndex = text.lastIndexOf(' ', maxLen - 4);
    if (spaceIndex !== -1) {
      return text.substring(0, spaceIndex).trim() + '...';
    }
    return text.substring(0, maxLen - 3).trim() + '...';
  }

  // If too long, trim the body
  if (L > targetMax) {
    const targetBodyLen = targetOpt - (footer ? footer.length + 2 : 0);
    body = trimToSentence(body, targetBodyLen);
    cleanDesc = footer ? `${body}\n\n${footer}` : body;
    L = cleanDesc.length;
  }

  // If too short, pad the body
  if (L < targetMin) {
    let targetToAdd = targetOpt - L;
    const tonePads = TONE_PADDINGS[toneId] ?? TONE_PADDINGS.informative;
    let addedPads = [];

    // Try adding larger paragraphs
    for (const pad of tonePads) {
      if (targetToAdd >= pad.len + 15) {
        addedPads.push(pad.text);
        targetToAdd -= pad.len + 2; // account for newline separation
      }
    }

    if (addedPads.length > 0) {
      body = body + "\n\n" + addedPads.join(" ");
      cleanDesc = footer ? `${body}\n\n${footer}` : body;
      L = cleanDesc.length;
      targetToAdd = targetOpt - L;
    }

    // Add a filler sentence if still needed
    if (targetToAdd >= 10) {
      let bestFiller = null;
      let minDiff = Infinity;
      for (const filler of FILLERS) {
        const diff = Math.abs(filler.len - targetToAdd);
        if (diff < minDiff) {
          minDiff = diff;
          bestFiller = filler;
        }
      }

      if (bestFiller) {
        body = body + " " + bestFiller.text;
        cleanDesc = footer ? `${body}\n\n${footer}` : body;
        L = cleanDesc.length;
      }
    }
  }

  // Final length sanity enforcement (hard truncate if somehow still > targetMax, pad spaces if < targetMin)
  if (L > targetMax) {
    cleanDesc = cleanDesc.substring(0, targetMax - 3) + "...";
  } else if (L < targetMin) {
    cleanDesc = cleanDesc + " ".repeat(targetMin - L);
  }

  return cleanDesc + signatureBlock;
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
 * @param {string}  [params.sender]       - Custom sign-off sender name.
 *
 * @returns {Promise<{ title: string, description: string }>}
 * @throws {Error} With message set to an AI_ERRORS constant.
 */
export async function generateAnnouncement({ userInput, toneId = DEFAULT_TONE_ID, placeholders = {}, sender = 'Team HR' }) {
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
  const validated = validateGenerationOutput(parsed);
  validated.description = adjustAnnouncementLength(validated.description, toneId, sender);
  return validated;
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

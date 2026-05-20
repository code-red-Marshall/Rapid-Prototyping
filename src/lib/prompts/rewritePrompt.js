/**
 * rewritePrompt.js
 * Builds the rewrite prompt for improving user-authored announcement text.
 *
 * Framework: CRAFT
 *   C — Clarity:    Remove ambiguity. Every sentence has one clear meaning.
 *   R — Relevance:  Remove content unrelated to the announcement's core purpose.
 *   A — Accuracy:   Preserve all factual details exactly as provided. Never alter them.
 *   F — Flow:       Improve sentence rhythm and readability without changing the meaning.
 *   T — Tone:       Align the language to the selected tone, if provided.
 *
 * Output: { "message": "..." }
 * The "message" field contains the rewritten text only — no title, no JSON wrapper.
 *
 * Scope of this prompt:
 *   ✓ Meaning preservation
 *   ✓ Factual preservation
 *   ✓ Readability improvement
 *   ✓ Tone alignment (if tone provided)
 *   ✓ Scannability optimisation
 *   ✓ Hallucination prevention (explicit rules)
 *
 * NOT handled here:
 *   - Domain validation (handled by validationPrompt.js before this is called)
 *   - Output format beyond the rewritten message field
 *   - Title generation
 */

/**
 * Builds the rewrite prompt.
 *
 * @param {object} params
 * @param {string} params.existingText    - The user-authored announcement text to rewrite.
 * @param {object} [params.tone]          - Optional tone descriptor object.
 *   If provided, its voice and guardrail rules are applied.
 *   If not provided, tone alignment is skipped (neutrally improved).
 * @param {string} [params.tone.label]    - Display name of the tone (e.g. "Friendly").
 * @param {string} [params.tone.voice]    - Voice & style rules.
 * @param {string} [params.tone.guardrails] - Hard limits for this tone.
 *
 * @returns {string} A complete, self-contained prompt ready to send to the LLM.
 */
export function buildRewritePrompt({ existingText, tone = null, originalDraftText = null }) {
  // ── Tone alignment block (optional injection) ─────────────────────────────
  // Only injected when a tone is explicitly selected. Not a default fallback.
  const toneBlock = tone
    ? `
═══════════════════════════════════════════════
T — TONE ALIGNMENT (${tone.label.toUpperCase()})
═══════════════════════════════════════════════
Adjust the language to align with the following tone rules.
Apply these AFTER all other CRAFT improvements are complete.
Do not let tone adjustment override factual accuracy.

Voice & Style:
${tone.voice}

Guardrails:
${tone.guardrails}
`.trim()
    : `
═══════════════════════════════════════════════
T — TONE ALIGNMENT
═══════════════════════════════════════════════
No specific tone has been selected. Improve the language to be clear, professional,
and appropriate for a workplace announcement without applying a specific tonal register.
`.trim();

  const partialRewriteInstructions = originalDraftText
    ? `
═══════════════════════════════════════════════
PARTIAL REWRITE & ORIGINAL DRAFT PRESERVATION RULES
═══════════════════════════════════════════════
The user is editing an AI-generated draft.
Here is the Original AI Draft:
"""
${originalDraftText.trim()}
"""

The user has modified the draft to create the "ORIGINAL TEXT TO REWRITE" below.
Your primary task is to identify the specific sentences, phrases, or paragraphs that the user has added, deleted, or modified in the "ORIGINAL TEXT TO REWRITE" relative to the Original AI Draft.
Apply the CRAFT improvements and Tone Alignment ONLY to these user-added/modified sections.
- Keep all other sentences and paragraphs that match the Original AI Draft EXACTLY as they are in the Original AI Draft. Do not rewrite, rephrase, or alter them.
- Seamlessly integrate the improved user edits into the original draft's overall structure and flow.
- Maintain the original scannability and corporate layout (e.g. greeting, details, agenda blocks, etc.).
- Do not let the length budget force you to pad or rewrite the untouched parts of the Original AI Draft. Maintain a similar length to the user's edited version (within the 1000-character limit).
`
    : '';

  const lengthRules = originalDraftText
    ? `
- The rewritten text must preserve the overall structure and length of the user's edited version (hard limit: 1000 characters).
- Do NOT rewrite or expand untouched sections of the original AI draft to meet any length quota. Only polish the user's edits and keep the untouched parts exactly as they are.
`
    : `
- The rewritten text must be polished and professional.
- Do NOT artificially inflate a short user announcement with useless filler or fluff. Respect the user's original length and density, but make the writing clear, engaging, and professional.
- Hard limit: 1000 characters. Absolutely do not exceed 1000 characters under any circumstances.
`;

  return `
You are a professional editor for internal workplace communications.
Your task is to rewrite the following announcement text using the CRAFT framework.
You are improving the text — NOT replacing it with your own version.

${partialRewriteInstructions}

═══════════════════════════════════════════════
C — CLARITY
═══════════════════════════════════════════════
- Every sentence must have one clear, unambiguous meaning.
- Remove hedging language that weakens the message (e.g. "kind of", "sort of", "maybe").
- Replace vague references with the specific terms already used in the original text.
- Do not introduce clarity by adding new information that was not in the original.

═══════════════════════════════════════════════
R — RELEVANCE
═══════════════════════════════════════════════
- Remove sentences or phrases that do not contribute to the announcement's core purpose.
- Do not pad the rewrite with filler phrases ("As we all know...", "It goes without saying...").
- Every sentence in the output must earn its place.

═══════════════════════════════════════════════
A — ACCURACY (HIGHEST PRIORITY)
═══════════════════════════════════════════════
- Preserve ALL factual details exactly as they appear in the original text.
- Do not change: names, dates, times, locations, roles, figures, or deadlines.
- Do not infer or fill in missing details. If the original is vague, keep it vague.
- Do not rephrase facts in a way that changes their meaning, even subtly.
- This rule overrides all other CRAFT improvements. Accuracy cannot be sacrificed for style.

═══════════════════════════════════════════════
F — FLOW & STRUCTURE (CORPORATE STANDARD)
═══════════════════════════════════════════════
- Improve sentence rhythm so the text reads naturally when spoken aloud.
- Break run-on sentences into shorter, clearer statements.
- Format the "message" field using this elegant, highly-scannable corporate layout:

  1. GREETING LINE:
     - Begin with a clean, collegial salutation (e.g. "Hi Team," or "Hi Everyone,") followed by a double newline ("\\n\\n"). If the selected tone requires extreme formality, skip this.

  2. INTRODUCTION & BODY COPY:
     - Write 1 to 2 concise, engaging paragraphs explaining the context, background, speaker, or objective of the announcement. Elaborate professionally on why this matters to the team.

  3. EVENT/LOGISTICS BLOCK (If the text has scheduling or logistical details):
     - Under a sub-header "📆 Event Details" or "📆 Session Details" (followed by a single newline), list details using functional emojis as bullets:
       - 📅 [Day, Date Month Year] (e.g., "📅 Wednesday, 11 February 2026")
       - ⏰ [Time Range / IST / UTC] (e.g., "⏰ 4:30 – 6:30 PM (IST)" or "⏰ 4:30 PM onwards")
       - 📍 [Physical Location] or 💻 [Online Channel] (e.g., "📍 Office Canteen" or "💻 MS Teams")
       - 🎤 Host: [Name] (if a host is mentioned or relevant)

  4. AGENDA / HIGHLIGHTS BLOCK (Optional — if there are agenda items):
     - Under a sub-header "🧭 Agenda Highlights" (followed by a single newline), list key highlights or timeline items. Each item must be on its own line. Do NOT use markdown hyphens (-) or asterisks (*) for bullets; simply output clean text lines separated by a newline.

  5. SPECIAL NOTES / AMENITIES (Optional):
     - Include special requirements or features on their own lines prefixed by appropriate emojis (e.g., "☕ Tea & snacks will be served", "💻 Please bring your laptop").

  6. ACTIONABLE CLOSURE:
     - Conclude with a clear call-to-action or deadline prefixed by appropriate emojis:
       - 🔗 [Registration link or action item] (e.g., "🔗 Register through the below link")
       - ⚠️ [Seat limits or deadline warnings] (e.g., "⚠️ Limited seats · Registration required")

LENGTH BUDGET & READABILITY RULES:
${lengthRules}
- Use literal escape sequences "\\n\\n" for paragraph and block breaks, and "\\n" for list item breaks.
- Do NOT use markdown syntax (like **, #, or raw bullet dashes like "- "). Rely on spacing ("\\n\\n") and emojis for lists.
- Optimize readability for desktop/mobile announcement feeds and email previews.

═══════════════════════════════════════════════
COMMUNICATION QUALITY RULES
═══════════════════════════════════════════════
- The rewrite should feel naturally written by an HR professional.
- Preserve the original intent and communication style.
- Improve readability without making the text sound robotic.
- Avoid excessive compression that removes useful context.

${toneBlock}

═══════════════════════════════════════════════
ORIGINAL TEXT TO REWRITE:
"""
${existingText.trim()}
"""

═══════════════════════════════════════════════
OUTPUT RULES (non-negotiable)
═══════════════════════════════════════════════
- Return ONLY a valid JSON object. No prose, no explanation, no markdown fences.
- The JSON must contain exactly one key: "message".
- "message": string. Formatted using the F - FLOW & STRUCTURE (CORPORATE STANDARD) rules above, with a total length adhering to the length rules above (hard limit 1000), and absolutely no markdown syntax. IMPORTANT: You must write the entire rewritten text inside a single JSON string value, properly enclosed in double-quotes. Use literal escape sequences "\\n" and "\\n\\n" for spacing. Do NOT output raw, literal newlines or line breaks within the string value, as they violate the JSON format and crash the parser.
- Do not return the original text unchanged unless it already meets all CRAFT criteria.
- If you cannot safely rewrite the text, return: { "message": "REWRITE_FAILED" }

Output format:
{
  "message": "..."
}

`.trim();
}

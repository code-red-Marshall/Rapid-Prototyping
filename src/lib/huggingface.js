/**
 * huggingface.js
 * Client for FLUX.1-schnell image generation via Hugging Face Inference API.
 * Routed through the Vite proxy (/api/huggingface) to bypass CORS.
 *
 * ICON PHILOSOPHY:
 *   FLUX generates a COMPLETE, SOLID badge design — the badge has its own
 *   internal coloured background (like the reference: an orange circle with
 *   3D content inside). Only the OUTER area around the badge shape is white,
 *   which we then remove to produce a clean badge on transparent surround.
 *
 *   The badge is then displayed over a separate page background (color or image).
 *
 * All prompts are deterministic — no LLM involvement.
 */

import { getHFKey } from './config';

// ─────────────────────────────────────────────────────────────────────────────
// ICON STYLE CONFIGS
// Each variation generates a SOLID, COMPLETE badge with its OWN internal
// coloured background. The outer background is white (removed post-generation).
// ─────────────────────────────────────────────────────────────────────────────

const STYLE_CONFIGS = {
  Auto: {
    variations: [
      {
        visual: 'premium circular award badge with rich warm orange internal background, photorealistic 3D rendered golden trophy cup centered inside, ornate gold metallic border ring',
        form: 'perfect circle shape occupying 72% of frame, thick decorative gold border, 3D trophy centered in circular colored interior',
        finish: 'photorealistic 3D CGI quality, vivid saturated orange interior, bright gold accents, premium corporate award feel',
      },
      {
        visual: 'prestigious circular badge with deep royal navy blue internal background, 3D rendered gold laurel wreath crown icon, heraldic style emblem',
        form: 'round badge shape, ornate concentric ring border, crown and laurel crest centered inside the navy interior',
        finish: 'premium 3D rendered, jewel-like deep blue interior, bright gold metallic details, luxury recognition award quality',
      },
      {
        visual: 'championship circular medallion badge with rich emerald green internal background, 3D gold star burst trophy pedestal centered',
        form: 'round medal shape with raised interior, star burst rays from center, decorative outer ring, 3D trophy on pedestal inside',
        finish: 'polished enamel quality, vivid green interior, gleaming gold star, high-end award ceremony aesthetic',
      },
    ],
  },
  Minimal: {
    variations: [
      {
        visual: 'circular badge with clean soft white-grey gradient internal fill, single bold dark minimalist geometric star icon centered',
        form: 'perfect circle with fine hairline border ring, minimal clean interior, single large geometric symbol at 55% badge size',
        finish: 'premium flat vector quality, high contrast dark icon on light background, Swiss design precision, studio quality',
      },
      {
        visual: 'hexagonal badge with pale cream off-white interior, single bold navy blue outline trophy icon centered, ultra clean',
        form: 'regular hexagon shape, uniform thin border, single bold outlined icon centered, maximum negative space',
        finish: 'editorial minimal quality, Helvetica-era precision, two-tone design, premium print quality',
      },
      {
        visual: 'circular badge with soft lavender-white gradient interior, single bold dark checkmark inside a circle, ultra minimal',
        form: 'perfect circle, hairline border, bold circle-check icon centered at 50% of badge diameter',
        finish: 'modern premium minimal, high contrast, studio photography quality, clean and decisive',
      },
    ],
  },
  Professional: {
    variations: [
      {
        visual: 'official circular seal badge with dark midnight navy interior, photorealistic 3D gold eagle emblem center, concentric decorative ring borders, engraved pattern',
        form: 'government seal circle, scalloped outer edge, multiple gold ring borders, 3D eagle centered in dark interior',
        finish: 'engraved metal quality, deep navy and bright gold, executive official aesthetic, high authority presence',
      },
      {
        visual: 'rectangular portrait badge with deep charcoal slate interior, gold filigree corner accents, 3D platinum star emblem centered',
        form: 'portrait rectangle with rounded corners, gold decorative border with classical column details, large 3D star at center',
        finish: 'boardroom plaque quality, dark charcoal interior, gold and platinum accents, Fortune 500 corporate premium',
      },
      {
        visual: 'diamond shaped badge with midnight blue interior, silver geometric lattice pattern, 3D platinum center shield emblem',
        form: 'rotated square diamond, geometric silver grid inside, large 3D shield crest centered',
        finish: 'corporate executive premium, platinum and midnight blue, precision-crafted award quality',
      },
    ],
  },
  Fun: {
    variations: [
      {
        visual: 'star burst badge with vivid bright yellow internal background, 3D cartoon trophy character with happy face, thick bold black outline border',
        form: 'irregular star burst 12-point shape, thick cartoon outline, cheerful 3D trophy mascot centered inside yellow interior',
        finish: 'glossy sticker quality, saturated bright yellow, pop art cartoon style, bold and joyful, high energy',
      },
      {
        visual: 'rounded square badge with hot neon pink internal background, retro pixel art style lightning bolt 3D render, electric glow effect',
        form: 'rounded rectangle with pixel-grid border, large 3D lightning bolt centered in neon pink interior, glow lines',
        finish: 'retro 80s synthwave quality, electric pink and cyan neon, glossy sticker look, high energy visual',
      },
      {
        visual: 'circular badge with pastel rainbow gradient internal background, cute 3D kawaii star trophy character with big eyes and smile',
        form: 'soft circle with bubbly cloud-edge border, kawaii trophy character centered inside rainbow gradient, sparkle accents',
        finish: 'kawaii cute 3D illustration quality, soft pastels, pink and lavender, cheerful and celebratory',
      },
    ],
  },
};

/**
 * Background style configs for Award AI — 3 per style.
 * Full-bleed richly-colored background that complements the paired icon.
 */
const BG_STYLE_CONFIGS = {
  Auto: [
    'rich sky blue to royal blue gradient, abstract soft geometric light rays, elegant award ceremony background',
    'deep burgundy to warm gold gradient, subtle radial glow, prestigious gala event background texture',
    'dark forest green to teal gradient, abstract soft bokeh light, professional recognition ceremony',
  ],
  Minimal: [
    'clean pearl white to light silver gradient wash, barely-there geometric grid lines, ultra minimal background',
    'soft warm cream to light beige gradient, understated subtle texture, refined elegant award background',
    'cool pale blue-grey to white gradient, minimal Scandinavian design background, airy and clean',
  ],
  Professional: [
    'deep navy blue to charcoal gradient with subtle diagonal crosshatch texture, executive corporate background',
    'dark slate grey to gunmetal gradient, fine grain texture, formal boardroom quality background',
    'midnight blue to deep purple gradient, subtle geometric pattern overlay, premium corporate event',
  ],
  Fun: [
    'bright electric blue to sky blue gradient with confetti dots scattered, celebration party background',
    'vibrant coral to golden yellow gradient, energetic celebration background with star shapes',
    'rainbow gradient wash, soft pastel colors blending smoothly, cheerful award celebration background',
  ],
};

/**
 * Guardrail for ICON prompts.
 * The badge MUST have its own internal colored background.
 * Only the outer surround is white (for removal).
 */
const ICON_GUARDRAIL = `
ABSOLUTE REQUIREMENTS:
- The badge/award shape MUST have its own RICH INTERNAL BACKGROUND COLOR — never white or transparent inside
- ONLY the area OUTSIDE the badge shape boundary should be pure white (#FFFFFF)
- The interior of the badge must be a vivid, saturated, or deep color (orange, blue, green, gold, etc.)
- NO text, NO letters, NO numbers, NO words anywhere in the image
- Badge shape must occupy 65–80% of the total image frame, centered
- Content inside the badge must be HIGH DETAIL, premium quality — 3D rendered or premium flat vector
- NO blurry, low-detail, or generic clipart quality
- The badge must look like a professional award suitable for a corporate recognition program
- White outer background only — for background removal processing
`;

/**
 * Guardrail for BACKGROUND prompts (Award module).
 */
const BG_GUARDRAIL = `
STRICT REQUIREMENTS:
- Full-bleed gradient or textured background — NO centered focal element
- NO text, NO letters, NO people, NO faces, NO badge shapes
- Rich, deep, or vivid color — NOT white, NOT grey, NOT neutral
- Smooth gradient or subtle texture — suitable as backdrop behind an award badge
- High visual quality, print-ready
`;

// ─────────────────────────────────────────────────────────────────────────────
// SEMANTIC ENRICHMENT — deterministic keyword mapping (no LLM)
// ─────────────────────────────────────────────────────────────────────────────

function semanticEnrich(name, description) {
  const text = `${name} ${description}`.toLowerCase();

  let theme = 'excellence and achievement';
  if (text.match(/sales|revenue|quota|deal|pipeline/))      theme = 'sales performance and revenue growth';
  if (text.match(/team|collaborat|partner|together|crew/))  theme = 'teamwork and collective success';
  if (text.match(/innovat|creat|idea|inventor|pioneer/))    theme = 'innovation and creative thinking';
  if (text.match(/lead|manag|director|captain|head/))       theme = 'leadership and strategic vision';
  if (text.match(/customer|client|service|support|care/))   theme = 'customer excellence and service quality';
  if (text.match(/safety|secure|protect|compliance/))       theme = 'safety, security and responsibility';
  if (text.match(/learn|train|certif|skill|growth/))        theme = 'continuous learning and skill development';
  if (text.match(/new|fresh|junior|onboard|welcome/))       theme = 'new beginnings and potential';
  if (text.match(/top|best|champion|winner|#1|number one/)) theme = 'top performance and championship';
  if (text.match(/month|week|quarter|year|annual/))         theme = 'consistent periodic high performance';
  if (text.match(/mileston|anniversary|tenure|loyal/))      theme = 'loyalty, longevity and milestone achievement';

  let motif = '3D trophy cup on a pedestal';
  if (text.match(/sales|revenue/))      motif = '3D gold bar chart rising arrow with coin stack';
  if (text.match(/team|collaborat/))    motif = '3D group of figures with arms raised, united star';
  if (text.match(/innovat|idea|creat/)) motif = '3D glowing lightbulb with golden spark rays';
  if (text.match(/lead|manage/))        motif = '3D crown with compass rose, mountain peak behind';
  if (text.match(/customer|service/))   motif = '3D gold star with heart center, handshake below';
  if (text.match(/safety|secure/))      motif = '3D metallic shield with checkmark, strong and bold';
  if (text.match(/learn|skill|train/))  motif = '3D open book with graduation cap, growing plant';
  if (text.match(/speed|fast|quick/))   motif = '3D golden lightning bolt, speedometer dial';
  if (text.match(/champion|winner|top/))motif = '3D number one gold trophy with laurel wreath';
  if (text.match(/global|world|intern/))motif = '3D globe with golden meridian lines, world map';

  const context = [
    name        ? `Award name: "${name}"` : '',
    description ? `Purpose: ${description}` : '',
    `Theme: ${theme}`,
  ].filter(Boolean).join('. ');

  return { theme, motif, context };
}

// ─────────────────────────────────────────────────────────────────────────────
// PROMPT BUILDERS
// ─────────────────────────────────────────────────────────────────────────────

function buildIconPrompt(name, description, style, slot) {
  const config = STYLE_CONFIGS[style] ?? STYLE_CONFIGS.Auto;
  const variation = config.variations[slot] ?? config.variations[0];
  const { theme, motif, context } = semanticEnrich(name, description);

  return `
BADGE DESIGN: ${variation.visual}.
SHAPE & COMPOSITION: ${variation.form}.
STYLE & FINISH: ${variation.finish}.
VISUAL MOTIF: The badge interior features ${motif} — representing ${theme}.
CONTEXT: ${context}.
${ICON_GUARDRAIL}
`.trim();
}

function buildBackgroundPrompt(name, description, style, slot) {
  const bgVariations = BG_STYLE_CONFIGS[style] ?? BG_STYLE_CONFIGS.Auto;
  const visual = bgVariations[slot] ?? bgVariations[0];
  const { theme } = semanticEnrich(name, description);
  return `
BACKGROUND DESIGN: ${visual}.
THEMATIC PALETTE: Colours evoking ${theme}.
${BG_GUARDRAIL}
`.trim();
}

// ─────────────────────────────────────────────────────────────────────────────
// SEED GENERATION
// ─────────────────────────────────────────────────────────────────────────────

function generateSeed(slot) {
  const base = Math.floor(Math.random() * 100000);
  return base + [0, 333333, 666666][slot];
}

// ─────────────────────────────────────────────────────────────────────────────
// FLUX CALLER
// ─────────────────────────────────────────────────────────────────────────────

async function callFlux(prompt, seed) {
  const apiKey = getHFKey();
  if (!apiKey) {
    throw new Error('VITE_HF_API_KEY is not set. Add it to your .env file or Settings.');
  }

  const primaryUrl = '/api/hf-text/models/black-forest-labs/FLUX.1-schnell';
  const fallbackUrl = '/api/huggingface/models/black-forest-labs/FLUX.1-schnell';

  const makeRequest = async (url) => {
    console.log('[HF] Seed:', seed, '| Url:', url, '| Prompt:', prompt.substring(0, 100) + '...');
    return fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: { width: 512, height: 512, num_inference_steps: 8, guidance_scale: 3.5, seed },
      }),
    });
  };

  let response;
  try {
    response = await makeRequest(primaryUrl);
    if (!response.ok) {
      console.warn(`[HF] Primary endpoint returned status ${response.status}. Trying fallback...`);
      response = await makeRequest(fallbackUrl);
    }
  } catch (err) {
    console.error(`[HF] Primary endpoint fetch failed:`, err.message, 'Trying fallback...');
    response = await makeRequest(fallbackUrl);
  }

  if (!response.ok) {
    const err = await response.text().catch(() => '');
    console.error('[HF] Error:', response.status, err.substring(0, 300));
    throw new Error(`HF API error ${response.status}: ${err}`);
  }
  const blob = await response.blob();
  console.log('[HF] ✅ Size:', blob.size, 'bytes');
  return URL.createObjectURL(blob);
}

// ─────────────────────────────────────────────────────────────────────────────
// WHITE BACKGROUND REMOVAL
// Removes the OUTER white surround, leaving the solid colored badge intact.
// Threshold 245 to preserve lighter elements inside the badge.
// ─────────────────────────────────────────────────────────────────────────────

async function removeWhiteBackground(blobUrl, threshold = 245) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const d = ctx.getImageData(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < d.data.length; i += 4) {
        if (d.data[i] > threshold && d.data[i+1] > threshold && d.data[i+2] > threshold) {
          d.data[i+3] = 0;
        }
      }
      ctx.putImageData(d, 0, 0);
      canvas.toBlob(
        (b) => b ? resolve(URL.createObjectURL(b)) : reject(new Error('Canvas blob failed')),
        'image/png'
      );
    };
    img.onerror = reject;
    img.src = blobUrl;
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// DOMINANT COLOR EXTRACTION → COMPLEMENTARY BACKGROUND COLOR
// Since the badge now has its own internal color, we extract that color and
// map it to a visually complementary page background (not the same hue).
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Extracts the dominant color from a solid badge icon and returns a
 * complementary/contrasting hex color suitable as the PAGE background.
 *
 * @param {string} blobUrl - The processed badge PNG (transparent outer surround)
 * @returns {Promise<string>} hex string for page background
 */
export async function extractDominantColor(blobUrl) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const size = 64;
      const canvas = document.createElement('canvas');
      canvas.width = size; canvas.height = size;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, size, size);
      const data = ctx.getImageData(0, 0, size, size).data;

      let rSum = 0, gSum = 0, bSum = 0, count = 0;
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i], g = data[i+1], b = data[i+2], a = data[i+3];
        if (a < 128) continue;           // skip transparent outer surround
        if (r > 240 && g > 240 && b > 240) continue; // skip near-white
        rSum += r; gSum += g; bSum += b; count++;
      }

      if (count === 0) { resolve('#DBEAFE'); return; }

      const rAvg = rSum / count;
      const gAvg = gSum / count;
      const bAvg = bSum / count;

      // Map dominant hue to a complementary page background
      // (opposite or contrasting so badge stands out)
      const max = Math.max(rAvg, gAvg, bAvg);

      let bgHex = '#DBEAFE'; // default: light blue
      if (max === rAvg && rAvg > 120) {
        // Red/orange dominant badge → cool blue or teal background
        bgHex = gAvg > 80 ? '#DBEAFE' : '#CCF0F0'; // orange→blue, red→teal
      } else if (max === gAvg && gAvg > 120) {
        // Green dominant badge → warm peach or lavender background
        bgHex = rAvg > 80 ? '#FDE8D8' : '#EDE7F6'; // yellow-green→peach, pure green→lavender
      } else if (max === bAvg && bAvg > 120) {
        // Blue dominant badge → warm cream or yellow background
        bgHex = '#FEF9C3';
      } else if (rAvg > 120 && gAvg > 100 && bAvg < 80) {
        // Gold/yellow dominant → royal blue background
        bgHex = '#1E3A8A22'; // fallback to light blue
        bgHex = '#DBEAFE';
      }

      resolve(bgHex);
    };
    img.onerror = () => resolve('#DBEAFE');
    img.src = blobUrl;
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generates a single complete badge icon (solid, coloured internally).
 * White outer surround is removed post-generation.
 */
export async function generateBadgeIcon(name, description, style, slot = 0) {
  const prompt = buildIconPrompt(name, description, style, slot);
  const seed = generateSeed(slot);
  const rawUrl = await callFlux(prompt, seed);
  try {
    return await removeWhiteBackground(rawUrl, 245);
  } catch (err) {
    console.warn('[HF] White BG removal failed:', err.message);
    return rawUrl;
  }
}

/**
 * Generates a full-bleed award background image.
 */
export async function generateAwardBackground(name, description, style, slot = 0) {
  const prompt = buildBackgroundPrompt(name, description, style, slot);
  const seed = generateSeed(slot) + 999999;
  return callFlux(prompt, seed);
}

/**
 * Fallback hex suggestion when color extraction is unavailable.
 */
export function getRecommendedHex(name, description) {
  const text = (name + description).toLowerCase();
  if (text.match(/sales|revenue/))    return '#DBEAFE';
  if (text.match(/team|collaborat/))  return '#DCFCE7';
  if (text.match(/innovat|creat/))    return '#EDE7F6';
  if (text.match(/lead|manage/))      return '#FEF9C3';
  return '#DBEAFE';
}

/**
 * Generates three icon + metadata suggestions in parallel.
 *
 * BADGE:  returns [{ id, iconUrl, suggestedColor, style }]
 *   suggestedColor = complementary page background extracted from the badge
 *
 * AWARD:  returns [{ id, iconUrl, backgroundUrl, style }]
 *   6 FLUX calls in parallel (3 icons + 3 backgrounds)
 *
 * SESSION-ONLY — callers MUST NOT persist these to localStorage.
 */
export async function generateThreeSuggestions(name, description, style, type) {
  const slots = [0, 1, 2];

  if (type === 'badge') {
    const icons = await Promise.all(
      slots.map((slot) => generateBadgeIcon(name, description, style, slot))
    );
    const colors = await Promise.all(icons.map((url) => extractDominantColor(url)));
    return icons.map((iconUrl, i) => ({
      id: `sess-${Date.now()}-${i}`,
      iconUrl,
      suggestedColor: colors[i],
      style,
    }));
  }

  if (type === 'award') {
    const [icons, backgrounds] = await Promise.all([
      Promise.all(slots.map((slot) => generateBadgeIcon(name, description, style, slot))),
      Promise.all(slots.map((slot) => generateAwardBackground(name, description, style, slot))),
    ]);
    return icons.map((iconUrl, i) => ({
      id: `sess-${Date.now()}-${i}`,
      iconUrl,
      backgroundUrl: backgrounds[i],
      style,
    }));
  }

  throw new Error(`Unknown type: ${type}`);
}

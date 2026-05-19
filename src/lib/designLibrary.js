/**
 * designLibrary.js
 * Unified persistent library for all badge and award icons (AI-generated + manually uploaded).
 * Used by both Badge and Award modules. Stored in localStorage.
 */

const LIBRARY_KEY = 'vc_design_library';

/**
 * Returns all items in the unified design library, newest first.
 * @returns {Array<{id: string, url: string, label: string, source: 'ai'|'manual', module: 'badge'|'award'|'shared', savedAt: number}>}
 */
export function getDesignLibrary() {
  try {
    const stored = localStorage.getItem(LIBRARY_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Adds an image URL to the unified library. Deduplicates by URL.
 * @param {string} url - The image URL (blob or remote).
 * @param {string} label - Human-readable label.
 * @param {'ai'|'manual'} source - How it was created.
 * @param {'badge'|'award'|'shared'} module - Which module created it.
 * @returns {Array} Updated library.
 */
export function addToDesignLibrary(url, label = '', source = 'ai', module = 'shared') {
  const library = getDesignLibrary();
  const entry = {
    id: `lib-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    url,
    label,
    source,
    module,
    savedAt: Date.now(),
  };
  // Deduplicate by URL
  const filtered = library.filter((i) => i.url !== url);
  const updated = [entry, ...filtered];
  try {
    localStorage.setItem(LIBRARY_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('[Library] Could not persist to localStorage:', e.message);
  }
  return updated;
}

/**
 * Removes an item from the library by id.
 * @param {string} id
 * @returns {Array} Updated library.
 */
export function removeFromDesignLibrary(id) {
  const updated = getDesignLibrary().filter((i) => i.id !== id);
  try {
    localStorage.setItem(LIBRARY_KEY, JSON.stringify(updated));
  } catch {
    // silent
  }
  return updated;
}

/**
 * Clears the entire design library.
 */
export function clearDesignLibrary() {
  localStorage.removeItem(LIBRARY_KEY);
}

// ─────────────────────────────────────────────────────────────────────────────
// BACKGROUND LIBRARY — stores AI-generated award backgrounds (Award module only)
// ─────────────────────────────────────────────────────────────────────────────

const BG_LIBRARY_KEY = 'vc_background_library';

/**
 * Returns all saved award backgrounds, newest first.
 * @returns {Array<{id: string, url: string, label: string, module: string, savedAt: number}>}
 */
export function getBackgroundLibrary() {
  try {
    const stored = localStorage.getItem(BG_LIBRARY_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Saves an award background image URL to the background library.
 * Deduplicates by URL.
 * @param {string} url - The blob or remote image URL.
 * @param {string} [label=''] - Human-readable label.
 * @param {'award'|'badge'} [module='award'] - Which module generated it.
 * @returns {Array} Updated background library.
 */
export function addToBackgroundLibrary(url, label = '', module = 'award') {
  const library = getBackgroundLibrary();
  const entry = {
    id: `bg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    url,
    label,
    module,
    savedAt: Date.now(),
  };
  const filtered = library.filter((i) => i.url !== url);
  const updated = [entry, ...filtered];
  try {
    localStorage.setItem(BG_LIBRARY_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('[BG Library] Could not persist:', e.message);
  }
  return updated;
}

/**
 * Clears the entire background library.
 */
export function clearBackgroundLibrary() {
  localStorage.removeItem(BG_LIBRARY_KEY);
}


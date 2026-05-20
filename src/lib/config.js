/**
 * config.js
 * Centralized API key configuration manager.
 * Supports loading keys dynamically from localStorage in production,
 * falling back to import.meta.env build-time variables.
 */

export function getHFKey() {
  const localKey = localStorage.getItem('VITE_HF_API_KEY');
  if (localKey && localKey.trim() !== '') {
    return localKey.trim();
  }
  return import.meta.env.VITE_HF_API_KEY || '';
}

export function getGeminiKey() {
  const localKey = localStorage.getItem('VITE_GEMINI_API_KEY');
  if (localKey && localKey.trim() !== '') {
    return localKey.trim();
  }
  return import.meta.env.VITE_GEMINI_API_KEY || '';
}

export function getGroqKey() {
  const localKey = localStorage.getItem('VITE_GROQ_API_KEY');
  if (localKey && localKey.trim() !== '') {
    return localKey.trim();
  }
  return import.meta.env.VITE_GROQ_API_KEY || '';
}

export function getKeys() {
  return {
    hfKey: getHFKey(),
    geminiKey: getGeminiKey(),
    groqKey: getGroqKey(),
    isHFLocal: !!localStorage.getItem('VITE_HF_API_KEY'),
    isGeminiLocal: !!localStorage.getItem('VITE_GEMINI_API_KEY'),
    isGroqLocal: !!localStorage.getItem('VITE_GROQ_API_KEY'),
  };
}

export function saveKeys({ hfKey, geminiKey, groqKey }) {
  if (hfKey !== undefined) {
    if (hfKey.trim() === '') {
      localStorage.removeItem('VITE_HF_API_KEY');
    } else {
      localStorage.setItem('VITE_HF_API_KEY', hfKey.trim());
    }
  }
  if (geminiKey !== undefined) {
    if (geminiKey.trim() === '') {
      localStorage.removeItem('VITE_GEMINI_API_KEY');
    } else {
      localStorage.setItem('VITE_GEMINI_API_KEY', geminiKey.trim());
    }
  }
  if (groqKey !== undefined) {
    if (groqKey.trim() === '') {
      localStorage.removeItem('VITE_GROQ_API_KEY');
    } else {
      localStorage.setItem('VITE_GROQ_API_KEY', groqKey.trim());
    }
  }
  // Dispatch a custom event to let components react to key changes
  window.dispatchEvent(new Event('api-keys-updated'));
}

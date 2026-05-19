const ICON_LIBRARY_KEY = "vc_icon_library";
const BG_LIBRARY_KEY = "vc_bg_library";

export function getIconLibrary() {
  const stored = localStorage.getItem(ICON_LIBRARY_KEY);
  return stored ? JSON.parse(stored) : getDefaultIcons();
}

export function addToIconLibrary(imageUrl, label = "") {
  const library = getIconLibrary();
  const entry = { url: imageUrl, label, usedAt: Date.now() };
  const filtered = library.filter(i => i.url !== imageUrl);
  const updated = [entry, ...filtered];
  localStorage.setItem(ICON_LIBRARY_KEY, JSON.stringify(updated));
  return updated;
}

export function getBackgroundLibrary() {
  const stored = localStorage.getItem(BG_LIBRARY_KEY);
  return stored ? JSON.parse(stored) : [];
}

export function addToBackgroundLibrary(imageUrl, label = "") {
  const library = getBackgroundLibrary();
  const entry = { url: imageUrl, label, usedAt: Date.now() };
  const filtered = library.filter(i => i.url !== imageUrl);
  const updated = [entry, ...filtered];
  localStorage.setItem(BG_LIBRARY_KEY, JSON.stringify(updated));
  return updated;
}

function getDefaultIcons() {
  return [
    { url: "trophy", label: "Trophy", usedAt: 0 },
    { url: "star", label: "Star", usedAt: 0 },
    { url: "medal", label: "Medal", usedAt: 0 },
    { url: "crown", label: "Crown", usedAt: 0 },
    { url: "rocket", label: "Rocket", usedAt: 0 },
    { url: "target", label: "Target", usedAt: 0 },
    { url: "checkmark", label: "Checkmark", usedAt: 0 },
    { url: "heart", label: "Heart", usedAt: 0 },
    { url: "lightbulb", label: "Lightbulb", usedAt: 0 },
    { url: "flame", label: "Flame", usedAt: 0 },
    { url: "diamond", label: "Diamond", usedAt: 0 },
    { url: "gear", label: "Gear", usedAt: 0 },
    { url: "leaf", label: "Leaf", usedAt: 0 },
    { url: "mountain", label: "Mountain", usedAt: 0 },
    { url: "zap", label: "Zap", usedAt: 0 }
  ];
}

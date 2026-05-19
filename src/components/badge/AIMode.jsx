import { useState } from 'react';
import { generateThreeSuggestions } from '../../lib/huggingface';

const STYLES = [
  { id: 'Auto',         label: 'Auto',         icon: 'ph-sparkle',   badge: 'Recommended' },
  { id: 'Minimal',      label: 'Minimal',       icon: 'ph-diamond' },
  { id: 'Professional', label: 'Professional',  icon: 'ph-briefcase' },
  { id: 'Fun',          label: 'Fun',           icon: 'ph-smiley' },
];

// Default Phosphor icons — always visible (same as Manual mode)
const DEFAULT_ICONS = [
  { id: 'd1',  type: 'ph', value: 'ph-trophy' },
  { id: 'd2',  type: 'ph', value: 'ph-star' },
  { id: 'd3',  type: 'ph', value: 'ph-medal' },
  { id: 'd4',  type: 'ph', value: 'ph-crown' },
  { id: 'd5',  type: 'ph', value: 'ph-rocket-launch' },
  { id: 'd6',  type: 'ph', value: 'ph-target' },
  { id: 'd7',  type: 'ph', value: 'ph-check-circle' },
  { id: 'd8',  type: 'ph', value: 'ph-heart' },
  { id: 'd9',  type: 'ph', value: 'ph-lightbulb' },
  { id: 'd10', type: 'ph', value: 'ph-fire' },
  { id: 'd11', type: 'ph', value: 'ph-diamond' },
  { id: 'd12', type: 'ph', value: 'ph-gear' },
  { id: 'd13', type: 'ph', value: 'ph-leaf' },
  { id: 'd14', type: 'ph', value: 'ph-mountains' },
  { id: 'd15', type: 'ph', value: 'ph-lightning' },
];

const CHECKER_BG = {
  backgroundImage: 'linear-gradient(45deg,#ccc 25%,transparent 25%),linear-gradient(-45deg,#ccc 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#ccc 75%),linear-gradient(-45deg,transparent 75%,#ccc 75%)',
  backgroundSize: '10px 10px',
  backgroundPosition: '0 0,0 5px,5px -5px,-5px 0px',
};

/**
 * AIMode — Badge Design Screen right panel, AI Beta active.
 *
 * Session-only suggestions: generated results live in React state only.
 * They vanish on page refresh. Only items explicitly saved via "Save & Proceed"
 * are written to the persistent design library.
 *
 * When the user selects an AI-generated icon, the background color picker
 * is automatically pre-filled with the dominant color extracted from that icon.
 */
export default function AIMode({
  selectedIcon, setSelectedIcon,
  selectedBackground, setSelectedBackground,
  badgeData = {},
  isGenerating, setIsGenerating,
}) {
  const [activeTab,     setActiveTab]     = useState('icon');
  const [activeStyle,   setActiveStyle]   = useState('Auto');
  const [error,         setError]         = useState(null);

  // Session-only — cleared when the component unmounts / page refreshes
  const [sessionSuggestions, setSessionSuggestions] = useState([]);

  // Background color state
  const initColor = selectedBackground?.type === 'color' ? selectedBackground.value : '#EDE7F6';
  const [bgColor, setBgColor] = useState(initColor);

  // ── Generation ────────────────────────────────────────────────────────────

  const runGeneration = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const results = await generateThreeSuggestions(
        badgeData.name        || 'Badge',
        badgeData.description || '',
        activeStyle,
        'badge'
      );
      // Store in session state only — NOT persisted to localStorage
      setSessionSuggestions(results);

      // Auto-select first result + pre-fill its suggested background color
      if (results[0]) {
        setSelectedIcon({ id: results[0].id, type: 'img', value: results[0].iconUrl });
        applyBgColor(results[0].suggestedColor);
      }
    } catch (err) {
      console.error(err);
      setError('Generation failed. Check your API key and try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // ── Helpers ───────────────────────────────────────────────────────────────

  const applyBgColor = (color) => {
    setBgColor(color);
    setSelectedBackground({ id: `color-${color}`, type: 'color', value: color });
  };

  const handleBgChange = (color) => applyBgColor(color);

  const handleSelectSuggestion = (item) => {
    setSelectedIcon({ id: item.id, type: 'img', value: item.iconUrl });
    applyBgColor(item.suggestedColor);
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full overflow-hidden text-slate-800">

      {/* Icon | Background sub-tabs */}
      <div className="flex border-b border-slate-200 mb-3 shrink-0">
        {['icon', 'background'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 pb-2 text-xs font-semibold capitalize transition-colors ${
              activeTab === tab
                ? 'text-[#5C2D91] border-b-2 border-[#5C2D91]'
                : 'text-slate-400 hover:text-slate-600 border-b-2 border-transparent'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* ── ICON TAB ── */}
      {activeTab === 'icon' && (
        <div className="flex flex-col flex-1 min-h-0 overflow-hidden">

          {/* Style Selector */}
          <div className="flex gap-1.5 mb-3 shrink-0">
            {STYLES.map((style) => {
              const isActive = activeStyle === style.id;
              return (
                <button
                  key={style.id}
                  onClick={() => setActiveStyle(style.id)}
                  className={`relative flex-1 py-1.5 px-0.5 border rounded-lg flex flex-col items-center gap-0.5 transition-all ${
                    isActive ? 'border-[#5C2D91] bg-purple-50' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <i className={`ph ${style.icon} text-sm ${isActive ? 'text-[#5C2D91]' : 'text-slate-400'}`} />
                  <span className={`text-[10px] font-medium leading-none ${isActive ? 'text-[#5C2D91]' : 'text-slate-500'}`}>
                    {style.label}
                  </span>
                  {style.badge && (
                    <span className="absolute -bottom-1.5 bg-white text-[8px] font-bold text-slate-500 px-0.5 border border-slate-200 rounded leading-none py-0.5">
                      {style.badge}
                    </span>
                  )}
                  {isActive && (
                    <div className="absolute -top-1 -right-1 bg-white rounded-full">
                      <i className="ph-fill ph-check-circle text-[#5C2D91] text-xs" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Generate Button */}
          <div className="mb-3 shrink-0">
            <button
              onClick={runGeneration}
              disabled={isGenerating}
              className="w-full flex items-center justify-center gap-1.5 bg-[#5C2D91] text-white px-3 py-2 rounded-lg text-xs font-semibold hover:bg-[#4a2475] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <i className={`ph ph-arrows-clockwise text-sm ${isGenerating ? 'animate-spin' : ''}`} />
              {isGenerating ? 'Generating...' : 'Generate'}
            </button>
            {error && (
              <p className="mt-1.5 text-[11px] text-red-500 bg-red-50 border border-red-100 rounded px-2 py-1">{error}</p>
            )}
          </div>

          <div className="border-t border-slate-100 mb-3 shrink-0" />

          {/* Suggestions + Icons */}
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden">

            {/* Section header */}
            <div className="flex items-center justify-between mb-2 shrink-0">
              <div className="flex items-center gap-1.5">
                <i className="ph ph-sparkle text-[#5C2D91] text-sm" />
                <span className="text-xs font-semibold text-slate-700">AI Suggestions</span>
              </div>
              {sessionSuggestions.length > 0 && (
                <span className="text-[10px] text-slate-400 italic">session only</span>
              )}
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto pr-1 scrollbar-hide">

              {/* Generating skeleton */}
              {isGenerating && (
                <div className="grid grid-cols-3 gap-1.5 mb-3">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="aspect-square rounded-lg bg-slate-100 animate-pulse" />
                  ))}
                </div>
              )}

              {/* Session suggestions — each card shows icon + suggested bg color swatch */}
              {!isGenerating && sessionSuggestions.length > 0 && (
                <>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Generated</p>
                  <div className="grid grid-cols-3 gap-1.5 mb-4">
                    {sessionSuggestions.map((item) => {
                      const isSelected = selectedIcon?.id === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleSelectSuggestion(item)}
                          title="Select icon — background color will be pre-filled"
                          className={`relative aspect-square rounded-lg flex flex-col overflow-hidden transition-all ${
                            isSelected ? 'border-2 border-[#5C2D91] shadow-sm' : 'border border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          {/* Icon area — checkered bg */}
                          <div className="relative flex-1 flex items-center justify-center">
                            <div className="absolute inset-0 opacity-10" style={CHECKER_BG} />
                            <div className="relative z-10 w-full h-full flex items-center justify-center p-1">
                              <img src={item.iconUrl} alt="AI icon" className="w-full h-full object-contain mix-blend-multiply" />
                            </div>
                          </div>
                          {/* Suggested color swatch strip */}
                          <div
                            className="h-2.5 w-full shrink-0"
                            style={{ backgroundColor: item.suggestedColor }}
                            title={`Suggested bg: ${item.suggestedColor}`}
                          />
                          {isSelected && (
                            <div className="absolute top-0.5 right-0.5 bg-white rounded-full shadow z-20">
                              <i className="ph-fill ph-check-circle text-[#5C2D91] text-sm" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}

              {/* Empty state */}
              {!isGenerating && sessionSuggestions.length === 0 && (
                <p className="text-[10px] text-slate-400 italic mb-4">
                  Click Generate to create AI icons. Results appear here for this session only.
                </p>
              )}

              {/* Default Phosphor icons — always shown */}
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Icons</p>
              <div className="grid grid-cols-3 gap-1.5">
                {DEFAULT_ICONS.map((icon) => {
                  const isSelected = selectedIcon?.id === icon.id;
                  return (
                    <button
                      key={icon.id}
                      onClick={() => setSelectedIcon(icon)}
                      className={`relative aspect-square rounded-lg flex items-center justify-center overflow-hidden transition-all ${
                        isSelected ? 'border-2 border-[#5C2D91] shadow-sm' : 'border border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="absolute inset-0 opacity-10" style={CHECKER_BG} />
                      <div className="relative z-10 flex items-center justify-center">
                        <i className={`ph-fill ${icon.value} text-3xl text-slate-700`} />
                      </div>
                      {isSelected && (
                        <div className="absolute top-0.5 right-0.5 bg-white rounded-full shadow z-20">
                          <i className="ph-fill ph-check-circle text-[#5C2D91] text-sm" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── BACKGROUND TAB (Badge = color picker only) ── */}
      {activeTab === 'background' && (
        <div className="flex flex-col gap-3">
          <p className="text-xs font-semibold text-slate-700">Background Color</p>
          <p className="text-[10px] text-slate-400 -mt-2">
            Auto-filled from your selected icon. Adjust freely below.
          </p>

          <div className="flex items-center gap-2">
            <div className="relative h-9 flex-1 rounded-lg border border-slate-200 overflow-hidden flex items-center px-2.5 cursor-pointer group hover:border-[#5C2D91] transition-colors">
              <div
                className="w-5 h-5 rounded-full border border-black/10 mr-2 shadow-inner shrink-0"
                style={{ backgroundColor: bgColor }}
              />
              <span className="text-xs text-slate-500 flex-1">Pick Color</span>
              <i className="ph ph-palette text-slate-400 group-hover:text-[#5C2D91] text-sm" />
              <input
                type="color"
                value={/^#[0-9A-Fa-f]{6}$/.test(bgColor) ? bgColor : '#EDE7F6'}
                onChange={(e) => handleBgChange(e.target.value)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
            <input
              type="text"
              value={bgColor}
              onChange={(e) => {
                const v = e.target.value;
                setBgColor(v);
                if (/^#[0-9A-Fa-f]{6}$/.test(v)) handleBgChange(v);
              }}
              placeholder="#HEX"
              maxLength={7}
              className="w-20 h-9 px-2.5 rounded-lg border border-slate-200 font-mono text-xs uppercase text-slate-800 focus:outline-none focus:border-[#5C2D91] transition-colors"
            />
          </div>

          {/* Preview strip */}
          <div
            className="h-8 w-full rounded-lg border border-slate-200 transition-colors"
            style={{ backgroundColor: bgColor }}
          />
        </div>
      )}

    </div>
  );
}

import { useState, useRef, useEffect } from 'react';
import { generateThreeSuggestions } from '../../lib/huggingface';
import { getBackgroundLibrary } from '../../lib/designLibrary';

const STYLES = [
  { id: 'Auto',         label: 'Auto',         icon: 'ph-sparkle',   badge: 'Recommended' },
  { id: 'Minimal',      label: 'Minimal',       icon: 'ph-diamond' },
  { id: 'Professional', label: 'Professional',  icon: 'ph-briefcase' },
  { id: 'Fun',          label: 'Fun',           icon: 'ph-smiley' },
];

/** Curated color background templates — always visible fallback option */
const BG_TEMPLATES = [
  { id: 't1', label: 'Sky Blue',       color: '#2E86DE' },
  { id: 't2', label: 'Navy Gold',      color: '#1B2A4A' },
  { id: 't3', label: 'Forest Green',   color: '#1B3A2A' },
  { id: 't4', label: 'Royal Purple',   color: '#4A2475' },
  { id: 't5', label: 'Charcoal',       color: '#2A2A2A' },
  { id: 't6', label: 'Crimson',        color: '#8B1A1A' },
  { id: 't7', label: 'Teal',           color: '#1A5E6A' },
  { id: 't8', label: 'Midnight',       color: '#1B1B3A' },
];

/** Default Phosphor icons — always visible */
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
 * AwardAIMode — Award Design Screen right panel, AI Beta active.
 *
 * Session-only suggestions: generated results live in React state only.
 * They vanish on page refresh. Only items explicitly saved via "Save & Proceed"
 * are written to the persistent design/background libraries.
 *
 * Each AI session suggestion is a paired { iconUrl, backgroundUrl }.
 * Selecting a card sets BOTH selectedIcon and selectedBackground simultaneously.
 *
 * BACKGROUND TAB layout:
 *   1. Upload custom background
 *   2. AI-generated backgrounds saved in previous sessions (from localStorage)
 *   3. Curated color templates (always available)
 */
export default function AwardAIMode({
  selectedIcon, setSelectedIcon,
  selectedBackground, setSelectedBackground,
  awardData = {},
  isGenerating, setIsGenerating,
}) {
  const [activeTab,          setActiveTab]          = useState('icon');
  const [activeStyle,        setActiveStyle]         = useState('Auto');
  const [error,              setError]              = useState(null);
  const [sessionSuggestions, setSessionSuggestions] = useState([]);
  const [savedBgLibrary,     setSavedBgLibrary]     = useState([]);

  const fileInputRef = useRef(null);

  // Load saved background library on mount and on focus
  useEffect(() => {
    const load = () => setSavedBgLibrary(getBackgroundLibrary());
    load();
    window.addEventListener('focus', load);
    window.addEventListener('vc-bg-library-updated', load);
    return () => {
      window.removeEventListener('focus', load);
      window.removeEventListener('vc-bg-library-updated', load);
    };
  }, []);

  // ── Generation ────────────────────────────────────────────────────────────

  const runGeneration = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const results = await generateThreeSuggestions(
        awardData.name        || 'Award',
        awardData.description || '',
        activeStyle,
        'award',
        awardData.values      || ''
      );
      setSessionSuggestions(results);
      if (results[0]) {
        setSelectedIcon({ id: results[0].id, type: 'img', value: results[0].iconUrl });
        setSelectedBackground({ id: `bg-${results[0].id}`, type: 'img', value: results[0].backgroundUrl });
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Generation failed. Check your API key and try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // ── Helpers ───────────────────────────────────────────────────────────────

  const handleSelectPair = (item) => {
    setSelectedIcon({ id: item.id, type: 'img', value: item.iconUrl });
    setSelectedBackground({ id: `bg-${item.id}`, type: 'img', value: item.backgroundUrl });
  };

  const handleSelectBgTemplate = (t) => {
    setSelectedBackground({ id: t.id, type: 'color', value: t.color });
  };

  const handleSelectSavedBg = (item) => {
    setSelectedBackground({ id: item.id, type: 'img', value: item.url, label: item.label });
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file && (file.type === 'image/png' || file.type === 'image/jpeg')) {
      const url = URL.createObjectURL(file);
      setSelectedBackground({ id: `upload-${Date.now()}`, type: 'img', value: url, label: 'Custom' });
    }
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

          {/* Style Selector Container */}
          <div className="bg-slate-50/70 border border-slate-200/50 rounded-2xl p-3.5 mb-4 shrink-0 shadow-sm">
            <div className="flex gap-2 justify-around items-start">
              {STYLES.map((style) => {
                const isActive = activeStyle === style.id;
                
                // Premium style-specific backgrounds
                let circleBgClass = '';
                let iconColorClass = '';
                
                if (style.id === 'Auto') {
                  circleBgClass = isActive
                    ? 'bg-gradient-to-tr from-violet-600 to-indigo-700 text-white shadow-md ring-2 ring-indigo-500 ring-offset-1 border-transparent'
                    : 'bg-gradient-to-tr from-violet-50 via-indigo-50 to-purple-100 text-indigo-700 border-indigo-200/70 hover:from-violet-100 hover:to-indigo-200 hover:border-indigo-300';
                  iconColorClass = isActive ? 'text-white' : 'text-indigo-600';
                } else if (style.id === 'Minimal') {
                  circleBgClass = isActive
                    ? 'bg-gradient-to-tr from-slate-700 to-slate-800 text-white shadow-md ring-2 ring-slate-400 ring-offset-1 border-transparent'
                    : 'bg-[#FAF7F2] text-slate-700 border-[#EAE3D2] hover:bg-[#F3EFE7] hover:border-[#DFD5C0]';
                  iconColorClass = isActive ? 'text-white' : 'text-slate-600';
                } else if (style.id === 'Professional') {
                  circleBgClass = isActive
                    ? 'bg-gradient-to-tr from-slate-900 via-[#1E3A8A] to-slate-800 text-white shadow-md ring-2 ring-blue-500 ring-offset-1 border-transparent'
                    : 'bg-gradient-to-tr from-slate-900 via-[#1e294b] to-slate-900 text-slate-200 border-[#334155] hover:brightness-110';
                  iconColorClass = isActive ? 'text-white' : 'text-blue-300';
                } else if (style.id === 'Fun') {
                  circleBgClass = isActive
                    ? 'bg-gradient-to-tr from-pink-500 via-rose-500 to-amber-500 text-white shadow-md ring-2 ring-pink-500 ring-offset-1 border-transparent'
                    : 'bg-gradient-to-tr from-amber-50 via-rose-50 to-pink-100 text-pink-700 border-amber-200/70 hover:from-amber-100 hover:to-rose-100 hover:border-amber-300';
                  iconColorClass = isActive ? 'text-white' : 'text-pink-600';
                }

                return (
                  <div key={style.id} className="flex flex-col items-center flex-1">
                    <div className="relative">
                      <button
                        onClick={() => setActiveStyle(style.id)}
                        className={`w-12 h-12 rounded-full border flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 ${circleBgClass}`}
                      >
                        <i className={`ph ${style.icon} text-lg ${iconColorClass} transition-colors duration-300`} />
                      </button>
                      
                      {isActive && (
                        <div className="absolute -top-0.5 -right-0.5 bg-[#5C2D91] text-white rounded-full shadow-md w-4 h-4 flex items-center justify-center z-20 border border-white">
                          <i className="ph-bold ph-check text-[9px]" />
                        </div>
                      )}
                    </div>
                    
                    <span className={`text-[10px] font-bold mt-2.5 transition-colors leading-none ${isActive ? 'text-[#5C2D91]' : 'text-slate-500'}`}>
                      {style.label}
                    </span>
                    
                    {style.badge && (
                      <span className="mt-1.5 bg-violet-100 text-[#5C2D91] text-[6.5px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 border border-violet-200/60 rounded-full leading-none shadow-sm whitespace-nowrap">
                        {style.badge}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Generate Button */}
          <div className="mb-3 shrink-0">
            <button
              onClick={runGeneration}
              disabled={isGenerating}
              className="w-full flex items-center justify-center gap-1.5 bg-[#5C2D91] text-white px-3 py-2 rounded-lg text-xs font-semibold hover:bg-[#4a2475] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <i className={`ph ph-arrows-clockwise text-sm ${isGenerating ? 'animate-spin' : ''}`} />
              {isGenerating ? 'Generating icon + background...' : 'Generate'}
            </button>
            {error && (
              <p className="mt-1.5 text-[11px] text-red-500 bg-red-50 border border-red-100 rounded px-2 py-1">{error}</p>
            )}
          </div>

          <div className="border-t border-slate-100 mb-3 shrink-0" />

          {/* AI Suggestions + Icons */}
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
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
                  {[0,1,2].map((i) => (
                    <div key={i} className="aspect-square rounded-lg bg-slate-100 animate-pulse" />
                  ))}
                </div>
              )}

              {/* Session suggestions — icon layered over background */}
              {!isGenerating && sessionSuggestions.length > 0 && (
                <>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                    Generated — icon + background
                  </p>
                  <div className="grid grid-cols-3 gap-1.5 mb-4">
                    {sessionSuggestions.map((item) => {
                      const isSelected = selectedIcon?.id === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleSelectPair(item)}
                          title="Select this icon + background pair"
                          className={`relative aspect-square rounded-lg overflow-hidden transition-all ${
                            isSelected ? 'border-2 border-[#5C2D91] shadow-sm' : 'border border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <img src={item.backgroundUrl} alt="bg" className="absolute inset-0 w-full h-full object-cover" />
                          <div className="absolute inset-0 flex items-center justify-center p-2 z-10">
                            <img src={item.iconUrl} alt="icon" className="w-full h-full object-contain drop-shadow-lg" />
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
                </>
              )}

              {/* Empty state */}
              {!isGenerating && sessionSuggestions.length === 0 && (
                <p className="text-[10px] text-slate-400 italic mb-4">
                  Click Generate to create paired icon + background suggestions.
                </p>
              )}

              {/* Default Phosphor icons */}
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

      {/* ── BACKGROUND TAB ── */}
      {activeTab === 'background' && (
        <div className="flex flex-col gap-3 flex-1 min-h-0 overflow-hidden">

          {/* Upload */}
          <div className="shrink-0">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-2 bg-slate-900 text-white rounded-lg flex items-center justify-center gap-1.5 hover:bg-slate-800 transition-colors text-xs font-medium"
            >
              <i className="ph ph-upload-simple text-sm" />
              Upload Custom Background
            </button>
            <p className="text-[10px] text-center text-slate-400 mt-1">PNG or JPG format</p>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/png, image/jpeg"
              className="hidden"
            />
          </div>

          {/* Scrollable area for libraries */}
          <div className="flex-1 min-h-0 overflow-y-auto pr-1 scrollbar-hide flex flex-col gap-4">

            {/* Saved AI Backgrounds library (from previous sessions) */}
            {savedBgLibrary.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <i className="ph ph-bookmark text-[#5C2D91] text-sm" />
                  <p className="text-xs font-semibold text-slate-700">Saved Backgrounds</p>
                  <span className="ml-auto text-[10px] text-slate-400">{savedBgLibrary.length} saved</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {savedBgLibrary.map((item) => {
                    const isSel = selectedBackground?.id === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleSelectSavedBg(item)}
                        className={`relative aspect-video rounded-lg overflow-hidden flex items-end p-1.5 border-2 transition-all ${
                          isSel ? 'border-[#5C2D91] shadow-md' : 'border-transparent hover:border-slate-300'
                        }`}
                      >
                        <img src={item.url} alt={item.label} className="absolute inset-0 w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                        <span className="relative z-10 text-white text-[9px] font-semibold drop-shadow truncate">
                          {item.label || 'Saved'}
                        </span>
                        {isSel && (
                          <div className="absolute top-1 right-1 bg-white rounded-full">
                            <i className="ph-fill ph-check-circle text-[#5C2D91] text-xs" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Color Templates */}
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <i className="ph ph-palette text-slate-500 text-sm" />
                <p className="text-xs font-semibold text-slate-700">Color Templates</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {BG_TEMPLATES.map((t) => {
                  const isSel = selectedBackground?.id === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => handleSelectBgTemplate(t)}
                      className={`relative aspect-video rounded-lg overflow-hidden flex items-end p-1.5 border-2 transition-all ${
                        isSel ? 'border-[#5C2D91] shadow-md' : 'border-transparent hover:border-slate-300'
                      }`}
                      style={{ backgroundColor: t.color }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                      <span className="relative z-10 text-white text-[10px] font-semibold drop-shadow">{t.label}</span>
                      {isSel && (
                        <div className="absolute top-1 right-1 bg-white rounded-full">
                          <i className="ph-fill ph-check-circle text-[#5C2D91] text-xs" />
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

    </div>
  );
}

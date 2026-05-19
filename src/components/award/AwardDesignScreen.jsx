import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { compositeImages } from '../../lib/imageCompositor';
import { addToDesignLibrary, addToBackgroundLibrary } from '../../lib/designLibrary';
import ModeToggle from '../shared/ModeToggle';
import AwardManualMode from './AwardManualMode';
import AwardAIMode from './AwardAIMode';

/**
 * AwardDesignScreen
 * Live preview uses HTML/CSS layering:
 *  - Background (color or image) fills the entire preview container.
 *  - Icon (transparent PNG or Phosphor) floats centered above it.
 * Canvas compositing is only used on final save.
 */
export default function AwardDesignScreen() {
  const location = useLocation();
  const awardData = location.state?.awardData || { name: 'Untitled Award' };

  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const [mode, setMode] = useState('manual');

  const [selectedIcon, setSelectedIcon] = useState(null);
  const [selectedBackground, setSelectedBackground] = useState({ id: 'color-#FFFFFF', type: 'color', value: '#FFFFFF' });

  const handleSaveAndProceed = async () => {
    setIsSaving(true);

    // 1. Save selected icon to the universal icon library
    if (selectedIcon?.type === 'img') {
      addToDesignLibrary(
        selectedIcon.value,
        awardData.name || 'Award Icon',
        'ai',
        'award'
      );
      window.dispatchEvent(new Event('vc-library-updated'));
    }

    // 2. Save AI-generated background to the background library
    if (selectedBackground?.type === 'img') {
      addToBackgroundLibrary(
        selectedBackground.value,
        awardData.name || 'Award Background',
        'award'
      );
      window.dispatchEvent(new Event('vc-bg-library-updated'));
    }

    // 2. Composite the final image at 600x600
    const iconUrl = selectedIcon?.type === 'img' ? selectedIcon.value : null;
    const bgUrl   = selectedBackground?.type === 'img' ? selectedBackground.value : null;
    const bgColor = selectedBackground?.type === 'color' ? selectedBackground.value : null;

    const compositedDataUrl = await compositeImages(iconUrl, bgUrl, bgColor, 600);
    setIsSaving(false);

    navigate('/success', {
      state: {
        name: awardData.name || 'Untitled Award',
        type: 'award',
        finalImage: compositedDataUrl,
      },
    });
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="mb-6 shrink-0">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Design your award</h1>
        <p className="text-slate-500 mt-1">Create an award with AI or upload your own icon and background.</p>
      </div>

      {/* Main Two-Panel Layout */}
      <div className="flex-1 flex gap-6 min-h-0">

        {/* Left Panel - Preview (60%) */}
        <div className="w-[60%] bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col p-6">

          {/* Preview Area — background fills this container */}
          <div
            className="flex-1 rounded-xl flex items-center justify-center relative overflow-hidden transition-all"
            style={{
              backgroundColor: selectedBackground?.type === 'color' ? selectedBackground.value : '#1B2A4A',
              backgroundImage: selectedBackground?.type === 'img' ? `url(${selectedBackground.value})` : 'none',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            {/* Award name overlay */}
            <div className="absolute top-10 w-full px-6 flex justify-center z-20">
              <h2 className="text-xl font-bold text-white drop-shadow text-center">
                {awardData.name || 'Untitled Award'}
              </h2>
            </div>

            {/* Icon floating above background */}
            <div className="relative z-10 w-[300px] h-[300px] flex items-center justify-center">
              {isGenerating ? (
                <div className="w-full h-full rounded-full bg-white/10 animate-pulse" />
              ) : (
                <>
                  {selectedIcon?.type === 'img' && (
                    <img
                      src={selectedIcon.value}
                      alt="Award Icon"
                      className="w-[95%] h-[95%] object-contain drop-shadow-2xl"
                    />
                  )}
                  {selectedIcon?.type === 'ph' && (
                    <i className={`ph-fill ${selectedIcon.value} text-[140px] text-white drop-shadow-xl`} />
                  )}
                </>
              )}
            </div>
          </div>

          {/* Footer Info */}
          <div className="mt-6 flex flex-col items-center gap-2">
            <p className="text-sm text-slate-500 flex items-center gap-1.5">
              <i className="ph ph-info" />
              <span>This is how your award will appear</span>
            </p>
            <button className="text-sm font-medium text-[#5C2D91] flex items-center gap-1.5 hover:underline">
              <i className="ph ph-eye" />
              <span>Preview in use</span>
            </button>
          </div>
        </div>

        {/* Right Panel - Controls (40%) */}
        <div className="w-[40%] bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col min-h-0">
          <ModeToggle mode={mode} setMode={setMode} />

          <div className="flex-1 min-h-0 pt-2">
            {mode === 'manual' ? (
              <AwardManualMode
                selectedIcon={selectedIcon}
                setSelectedIcon={setSelectedIcon}
                selectedBackground={selectedBackground}
                setSelectedBackground={setSelectedBackground}
              />
            ) : (
              <AwardAIMode
                selectedIcon={selectedIcon}
                setSelectedIcon={setSelectedIcon}
                selectedBackground={selectedBackground}
                setSelectedBackground={setSelectedBackground}
                awardData={awardData}
                isGenerating={isGenerating}
                setIsGenerating={setIsGenerating}
              />
            )}
          </div>
        </div>

      </div>

      {/* Footer Buttons */}
      <div className="mt-6 flex justify-between items-center shrink-0">
        <button
          onClick={() => navigate('/award')}
          className="text-slate-500 font-medium px-4 py-2 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-2"
        >
          <i className="ph ph-arrow-left" />
          Back
        </button>

        <button
          onClick={handleSaveAndProceed}
          disabled={isSaving}
          className="bg-[#5C2D91] text-white px-8 py-2.5 rounded-lg font-semibold hover:bg-[#4a2475] transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isSaving && <i className="ph ph-spinner animate-spin" />}
          Save and Proceed
        </button>
      </div>
    </div>
  );
}

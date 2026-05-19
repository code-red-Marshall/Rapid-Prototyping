import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { compositeImages } from '../../lib/imageCompositor';
import { addToDesignLibrary } from '../../lib/designLibrary';
import ModeToggle from '../shared/ModeToggle';
import ManualMode from './ManualMode';
import AIMode from './AIMode';

export default function BadgeDesignScreen() {
  const location = useLocation();
  const badgeData = location.state?.badgeData || { name: 'Untitled Badge' };
  
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // App Mode State (default to AI for Section 5 testing)
  const [mode, setMode] = useState('manual');

  // Badge Display State
  const [selectedIcon, setSelectedIcon] = useState(null);
  const [selectedBackground, setSelectedBackground] = useState({ id: 'color-#FFFFFF', type: 'color', value: '#FFFFFF' });

  // We no longer need the live canvas composite.
  // We'll use HTML/CSS for live preview, and only call compositeImages on save.

  const handleSaveAndProceed = async () => {
    setIsSaving(true);

    // 1. Save the selected icon to the UNIVERSAL design library
    if (selectedIcon?.type === 'img') {
      addToDesignLibrary(
        selectedIcon.value,
        badgeData.name || 'Badge Icon',
        'manual',
        'badge'
      );
      // Notify any listening AI-mode panels to refresh
      window.dispatchEvent(new Event('vc-library-updated'));
    }

    // 2. Composite the final image at 600x600
    const iconUrl = selectedIcon?.type === 'img' ? selectedIcon.value : null;
    const bgUrl   = selectedBackground?.type === 'img' ? selectedBackground.value : null;
    const bgColor = selectedBackground?.type === 'color' ? selectedBackground.value : null;

    const compositedDataUrl = await compositeImages(iconUrl, bgUrl, bgColor, 600);
    setIsSaving(false);

    // 3. Navigate to success
    navigate('/success', {
      state: {
        name: badgeData.name || 'Untitled Badge',
        type: 'badge',
        finalImage: compositedDataUrl,
      },
    });
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="mb-6 shrink-0">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Design your badge</h1>
        <p className="text-slate-500 mt-1">Create a badge with AI or upload your own icon and background.</p>
      </div>

      {/* Main Two-Panel Layout */}
      <div className="flex-1 flex gap-6 min-h-0">
        
        {/* Left Panel - Preview (60%) */}
        <div className="w-[60%] bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col p-6">
          
          {/* Lavender Preview Area (Background) */}
          <div 
            className="flex-1 rounded-xl flex items-center justify-center relative overflow-hidden transition-colors"
            style={{ 
              backgroundColor: selectedBackground?.type === 'color' ? selectedBackground.value : '#F3EEF9',
              backgroundImage: selectedBackground?.type === 'img' ? `url(${selectedBackground.value})` : 'none',
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          >
            {/* Badge Title overlay */}
            <div className="absolute top-10 w-full px-6 flex justify-center z-20">
              <h2 className="text-xl font-bold text-slate-800 drop-shadow-sm text-center">
                {badgeData.name || 'Untitled Badge'}
              </h2>
            </div>

            {/* Icon Compositor (Floating in center) */}
            <div className="relative z-10 w-[300px] h-[300px] flex items-center justify-center">
              {isGenerating ? (
                // Skeleton state for left panel
                <div className="w-full h-full rounded-full bg-black/10 animate-pulse"></div>
              ) : (
                <>
                  {selectedIcon?.type === 'img' && (
                    <img 
                      src={selectedIcon.value} 
                      alt="Badge Icon" 
                      className="w-[95%] h-[95%] object-contain drop-shadow-2xl" 
                    />
                  )}
                  {selectedIcon?.type === 'ph' && (
                    <i className={`ph-fill ${selectedIcon.value} text-[140px] text-slate-800 drop-shadow-xl`}></i>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Footer Info */}
          <div className="mt-6 flex flex-col items-center gap-2">
            <p className="text-sm text-slate-500 flex items-center gap-1.5">
              <i className="ph ph-info"></i>
              <span>This is how your badge will appear</span>
            </p>
            <button className="text-sm font-medium text-[#5C2D91] flex items-center gap-1.5 hover:underline">
              <i className="ph ph-eye"></i>
              <span>Preview in use</span>
            </button>
          </div>
        </div>

        {/* Right Panel - Controls (40%) */}
        <div className="w-[40%] bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col min-h-0">
          <ModeToggle mode={mode} setMode={setMode} />
          
          <div className="flex-1 min-h-0 pt-2">
            {mode === 'manual' ? (
              <ManualMode 
                selectedIcon={selectedIcon}
                setSelectedIcon={setSelectedIcon}
                selectedBackground={selectedBackground}
                setSelectedBackground={setSelectedBackground}
              />
            ) : (
              <AIMode 
                selectedIcon={selectedIcon}
                setSelectedIcon={setSelectedIcon}
                selectedBackground={selectedBackground}
                setSelectedBackground={setSelectedBackground}
                badgeData={badgeData}
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
          onClick={() => navigate('/badge')}
          className="text-slate-500 font-medium px-4 py-2 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-2"
        >
          <i className="ph ph-arrow-left"></i>
          Back
        </button>

        <button 
          onClick={handleSaveAndProceed}
          disabled={isSaving}
          className="bg-[#5C2D91] text-white px-8 py-2.5 rounded-lg font-semibold hover:bg-[#4a2475] transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isSaving && <i className="ph ph-spinner animate-spin"></i>}
          Save and Proceed
        </button>
      </div>

    </div>
  );
}

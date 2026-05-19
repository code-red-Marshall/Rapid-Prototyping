import { useState, useRef } from 'react';

const DEFAULT_ICONS = [
  { id: '1', type: 'ph', value: 'ph-trophy' },
  { id: '2', type: 'ph', value: 'ph-star' },
  { id: '3', type: 'ph', value: 'ph-medal' },
  { id: '4', type: 'ph', value: 'ph-crown' },
  { id: '5', type: 'ph', value: 'ph-rocket-launch' },
  { id: '6', type: 'ph', value: 'ph-target' },
  { id: '7', type: 'ph', value: 'ph-check-circle' },
  { id: '8', type: 'ph', value: 'ph-heart' },
  { id: '9', type: 'ph', value: 'ph-lightbulb' },
  { id: '10', type: 'ph', value: 'ph-fire' },
  { id: '11', type: 'ph', value: 'ph-diamond' },
  { id: '12', type: 'ph', value: 'ph-gear' },
  { id: '13', type: 'ph', value: 'ph-leaf' },
  { id: '14', type: 'ph', value: 'ph-mountains' },
  { id: '15', type: 'ph', value: 'ph-lightning' },
];

export default function IconLibrary({ selectedIcon, setSelectedIcon }) {
  const [icons, setIcons] = useState(DEFAULT_ICONS);
  const fileInputRef = useRef(null);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'image/png') {
      const url = URL.createObjectURL(file);
      const newIcon = { id: `upload-${Date.now()}`, type: 'img', value: url };
      setIcons([newIcon, ...icons]);
      setSelectedIcon(newIcon);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Upload Button */}
      <div className="mb-6">
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="w-full py-3 bg-slate-900 text-white rounded-lg flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors shadow-sm font-medium"
        >
          <i className="ph ph-upload-simple text-lg"></i>
          <span>Upload Image</span>
        </button>
        <p className="text-xs text-center text-slate-500 mt-2">Upload image in PNG format</p>
        <input 
          type="file" 
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept="image/png"
          className="hidden"
        />
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto pr-2 pb-4 scrollbar-hide">
        <div className="grid grid-cols-3 gap-2">
          {icons.map((icon) => {
            const isSelected = selectedIcon?.id === icon.id;
            return (
              <button
                key={icon.id}
                onClick={() => setSelectedIcon(icon)}
                className={`relative aspect-square rounded-lg flex items-center justify-center overflow-hidden transition-all ${
                  isSelected ? 'border-2 border-[#5C2D91] shadow-sm' : 'border border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Checkered pattern background */}
                <div 
                  className="absolute inset-0 z-0 opacity-10"
                  style={{
                    backgroundImage: 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)',
                    backgroundSize: '10px 10px',
                    backgroundPosition: '0 0, 0 5px, 5px -5px, -5px 0px'
                  }}
                />
                
                {/* Content */}
                <div className="relative z-10 w-full h-full flex items-center justify-center">
                  {icon.type === 'ph' ? (
                    <i className={`ph-fill ${icon.value} text-4xl text-slate-700`}></i>
                  ) : (
                    <img src={icon.value} alt="Uploaded Icon" className="w-12 h-12 object-contain" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {selectedIcon && (
          <div className="mt-6 flex justify-center">
            <button 
              onClick={() => setSelectedIcon(null)}
              className="text-sm font-medium text-[#5C2D91] hover:underline"
            >
              Remove Image
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

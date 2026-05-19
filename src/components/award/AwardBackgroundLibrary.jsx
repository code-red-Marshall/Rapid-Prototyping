import { useRef } from 'react';

const AWARD_TEMPLATES = [
  { id: 't1', label: 'Navy Gold', color: '#1B2A4A' },
  { id: 't2', label: 'Forest Green', color: '#1B3A2A' },
  { id: 't3', label: 'Prestige Burgundy', color: '#3A1B2A' },
  { id: 't4', label: 'Charcoal Neutral', color: '#2A2A2A' },
  { id: 't5', label: 'Royal Purple', color: '#2A1B3A' },
  { id: 't6', label: 'Midnight Blue', color: '#1B1B3A' },
];

export default function AwardBackgroundLibrary({ selectedBackground, setSelectedBackground }) {
  const fileInputRef = useRef(null);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file && (file.type === 'image/png' || file.type === 'image/jpeg')) {
      const url = URL.createObjectURL(file);
      const newBg = { id: `upload-${Date.now()}`, type: 'img', value: url, label: 'Custom' };
      setSelectedBackground(newBg);
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
          accept="image/png, image/jpeg"
          className="hidden"
        />
      </div>

      <div className="flex-1 overflow-y-auto pr-2 pb-4 scrollbar-hide">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Templates</h3>
        <div className="grid grid-cols-2 gap-3">
          {AWARD_TEMPLATES.map((template) => {
            const isSelected = selectedBackground?.id === template.id;
            
            return (
              <button
                key={template.id}
                onClick={() => setSelectedBackground({ id: template.id, type: 'color', value: template.color })}
                className={`relative aspect-video rounded-lg overflow-hidden transition-all flex items-end p-2 ${
                  isSelected ? 'border-2 border-[#5C2D91] shadow-md ring-2 ring-[#5C2D91] ring-offset-1' : 'border border-slate-200 hover:border-slate-300 hover:shadow-sm'
                }`}
                style={{ backgroundColor: template.color }}
              >
                {/* Overlay gradient for text readability if needed */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                
                <span className="relative z-10 text-white text-xs font-semibold drop-shadow-md">
                  {template.label}
                </span>

                {isSelected && (
                  <div className="absolute top-2 right-2 bg-white rounded-full flex items-center justify-center z-10">
                    <i className="ph-fill ph-check-circle text-[#5C2D91] text-base"></i>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

import React from 'react';

export default function ModeToggle({ mode, setMode }) {
  return (
    <div className="flex p-1 bg-slate-100 rounded-lg mb-6">
      <button
        onClick={() => setMode('manual')}
        className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${
          mode === 'manual'
            ? 'bg-white text-[#5C2D91] shadow-sm border border-[#5C2D91]'
            : 'text-slate-500 hover:text-slate-700'
        }`}
      >
        Manual
      </button>
      <button
        onClick={() => setMode('ai')}
        className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-semibold rounded-md transition-all ${
          mode === 'ai'
            ? 'bg-white text-[#5C2D91] shadow-sm border border-[#5C2D91]'
            : 'text-slate-500 hover:text-slate-700'
        }`}
      >
        <span>AI Beta</span>
        <i className="ph-fill ph-sparkle text-xs"></i>
      </button>
    </div>
  );
}

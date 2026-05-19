import { useState } from 'react';
import IconLibrary from '../badge/IconLibrary';
import AwardBackgroundLibrary from './AwardBackgroundLibrary';

export default function AwardManualMode({ 
  selectedIcon, setSelectedIcon, 
  selectedBackground, setSelectedBackground 
}) {
  const [activeTab, setActiveTab] = useState('icon');

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-slate-200 mb-6 shrink-0">
        <button
          onClick={() => setActiveTab('icon')}
          className={`flex-1 pb-3 text-sm font-semibold transition-colors ${
            activeTab === 'icon' 
              ? 'text-[#5C2D91] border-b-2 border-[#5C2D91]' 
              : 'text-slate-500 hover:text-slate-700 border-b-2 border-transparent'
          }`}
        >
          Icon
        </button>
        <button
          onClick={() => setActiveTab('background')}
          className={`flex-1 pb-3 text-sm font-semibold transition-colors ${
            activeTab === 'background' 
              ? 'text-[#5C2D91] border-b-2 border-[#5C2D91]' 
              : 'text-slate-500 hover:text-slate-700 border-b-2 border-transparent'
          }`}
        >
          Background
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {activeTab === 'icon' ? (
          <IconLibrary selectedIcon={selectedIcon} setSelectedIcon={setSelectedIcon} />
        ) : (
          <AwardBackgroundLibrary selectedBackground={selectedBackground} setSelectedBackground={setSelectedBackground} />
        )}
      </div>
    </div>
  );
}

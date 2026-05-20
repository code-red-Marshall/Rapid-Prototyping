import { useState, useEffect } from 'react';
import { getKeys, saveKeys } from '../../lib/config';

export default function ApiKeysModal({ onClose }) {
  const [keys, setKeys] = useState({
    hfKey: '',
    geminiKey: '',
    groqKey: '',
  });

  const [status, setStatus] = useState({
    isHFLocal: false,
    isGeminiLocal: false,
    isGroqLocal: false,
  });

  const [showKeys, setShowKeys] = useState({
    hfKey: false,
    geminiKey: false,
    groqKey: false,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    const loaded = getKeys();
    setKeys({
      hfKey: loaded.hfKey,
      geminiKey: loaded.geminiKey,
      groqKey: loaded.groqKey,
    });
    setStatus({
      isHFLocal: loaded.isHFLocal,
      isGeminiLocal: loaded.isGeminiLocal,
      isGroqLocal: loaded.isGroqLocal,
    });
  }, []);

  const handleSave = () => {
    setIsSaving(true);
    setSuccessMsg('');
    setTimeout(() => {
      saveKeys({
        hfKey: keys.hfKey,
        geminiKey: keys.geminiKey,
        groqKey: keys.groqKey,
      });
      setIsSaving(false);
      setSuccessMsg('Settings saved successfully!');
      
      const loaded = getKeys();
      setStatus({
        isHFLocal: loaded.isHFLocal,
        isGeminiLocal: loaded.isGeminiLocal,
        isGroqLocal: loaded.isGroqLocal,
      });

      // Close modal after a short delay
      setTimeout(() => {
        onClose();
      }, 1000);
    }, 600);
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to clear your custom API keys? The app will revert to the default server-side environment variables.')) {
      saveKeys({ hfKey: '', geminiKey: '', groqKey: '' });
      const loaded = getKeys();
      setKeys({
        hfKey: loaded.hfKey,
        geminiKey: loaded.geminiKey,
        groqKey: loaded.groqKey,
      });
      setStatus({
        isHFLocal: loaded.isHFLocal,
        isGeminiLocal: loaded.isGeminiLocal,
        isGroqLocal: loaded.isGroqLocal,
      });
      setSuccessMsg('Keys reset to environment defaults!');
      setTimeout(() => setSuccessMsg(''), 2000);
    }
  };

  const toggleShow = (field) => {
    setShowKeys(prev => ({ ...prev, [field]: !prev[field] }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-[3px] transition-opacity" 
        onClick={onClose}
      />

      {/* Modal Box */}
      <div className="relative bg-white rounded-2xl border border-slate-100 shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-[#5C2D91]">
              <i className="ph ph-key text-lg"></i>
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-slate-800">AI Connection Settings</h2>
              <p className="text-[11px] text-slate-500 font-medium">Configure credentials for live AI generation</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
          >
            <i className="ph ph-x text-sm"></i>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 scrollbar-hide">
          
          <div className="bg-amber-50/70 border border-amber-100 rounded-xl p-3.5 flex items-start gap-3">
            <i className="ph ph-info text-amber-600 text-lg mt-0.5"></i>
            <div className="text-xs text-amber-800 leading-normal">
              <span className="font-bold">Active in Production:</span> Storing new keys here overrides default credentials instantly in the browser. They are persisted strictly to <span className="font-semibold">local browser storage</span> — zero backend storage.
            </div>
          </div>

          {/* Hugging Face Key */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <span>Hugging Face Access Token</span>
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
                  status.isHFLocal 
                    ? 'bg-purple-100 text-[#5C2D91]' 
                    : 'bg-slate-100 text-slate-500'
                }`}>
                  {status.isHFLocal ? 'Customized Token' : 'System Default'}
                </span>
              </label>
              <a 
                href="https://huggingface.co/settings/tokens" 
                target="_blank" 
                rel="noreferrer" 
                className="text-[10px] text-purple-600 hover:underline flex items-center gap-0.5 font-medium"
              >
                <span>Get Token</span>
                <i className="ph ph-arrow-square-out text-[9px]"></i>
              </a>
            </div>
            
            <div className="relative rounded-lg shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <i className="ph ph-image-square text-base"></i>
              </div>
              <input
                type={showKeys.hfKey ? 'text' : 'password'}
                value={keys.hfKey}
                onChange={(e) => setKeys(prev => ({ ...prev, hfKey: e.target.value }))}
                placeholder="hf_..."
                className="block w-full pl-9 pr-10 py-2 border border-slate-200 rounded-lg text-xs font-mono text-slate-800 focus:outline-none focus:border-[#5C2D91] transition-all bg-slate-50/20"
              />
              <button
                type="button"
                onClick={() => toggleShow('hfKey')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
              >
                <i className={`ph ${showKeys.hfKey ? 'ph-eye-slash' : 'ph-eye'} text-sm`}></i>
              </button>
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
              Used for FLUX image badge/award generation and Mistral announcement text generation. Requires standard 'Read' permission.
            </p>
          </div>

          {/* Gemini Key */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <span>Gemini API Key</span>
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
                  status.isGeminiLocal 
                    ? 'bg-purple-100 text-[#5C2D91]' 
                    : 'bg-slate-100 text-slate-500'
                }`}>
                  {status.isGeminiLocal ? 'Customized Key' : 'System Default'}
                </span>
              </label>
              <a 
                href="https://aistudio.google.com/" 
                target="_blank" 
                rel="noreferrer" 
                className="text-[10px] text-purple-600 hover:underline flex items-center gap-0.5 font-medium"
              >
                <span>Get Key</span>
                <i className="ph ph-arrow-square-out text-[9px]"></i>
              </a>
            </div>
            
            <div className="relative rounded-lg shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <i className="ph ph-sparkle text-base"></i>
              </div>
              <input
                type={showKeys.geminiKey ? 'text' : 'password'}
                value={keys.geminiKey}
                onChange={(e) => setKeys(prev => ({ ...prev, geminiKey: e.target.value }))}
                placeholder="AIzaSy..."
                className="block w-full pl-9 pr-10 py-2 border border-slate-200 rounded-lg text-xs font-mono text-slate-800 focus:outline-none focus:border-[#5C2D91] transition-all bg-slate-50/20"
              />
              <button
                type="button"
                onClick={() => toggleShow('geminiKey')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
              >
                <i className={`ph ${showKeys.geminiKey ? 'ph-eye-slash' : 'ph-eye'} text-sm`}></i>
              </button>
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
              Powers Gemini-2.0-Flash to compose high-quality announcement copy and perform strict tone evaluations.
            </p>
          </div>

          {/* Groq Key */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <span>Groq API Key</span>
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
                  status.isGroqLocal 
                    ? 'bg-purple-100 text-[#5C2D91]' 
                    : 'bg-slate-100 text-slate-500'
                }`}>
                  {status.isGroqLocal ? 'Customized Key' : 'System Default'}
                </span>
              </label>
              <a 
                href="https://console.groq.com/keys" 
                target="_blank" 
                rel="noreferrer" 
                className="text-[10px] text-purple-600 hover:underline flex items-center gap-0.5 font-medium"
              >
                <span>Get Key</span>
                <i className="ph ph-arrow-square-out text-[9px]"></i>
              </a>
            </div>
            
            <div className="relative rounded-lg shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <i className="ph ph-rocket text-base"></i>
              </div>
              <input
                type={showKeys.groqKey ? 'text' : 'password'}
                value={keys.groqKey}
                onChange={(e) => setKeys(prev => ({ ...prev, groqKey: e.target.value }))}
                placeholder="gsk_..."
                className="block w-full pl-9 pr-10 py-2 border border-slate-200 rounded-lg text-xs font-mono text-slate-800 focus:outline-none focus:border-[#5C2D91] transition-all bg-slate-50/20"
              />
              <button
                type="button"
                onClick={() => toggleShow('groqKey')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
              >
                <i className={`ph ${showKeys.groqKey ? 'ph-eye-slash' : 'ph-eye'} text-sm`}></i>
              </button>
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
              High-speed fallback writer for creative tones and fast copy curation using Llama-3.1-8B-Instant.
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between shrink-0">
          <div className="flex-1">
            {successMsg && (
              <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1 animate-pulse">
                <i className="ph-fill ph-check-circle text-sm"></i>
                {successMsg}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Reset Defaults
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-1.5 rounded-lg bg-[#5C2D91] text-white text-xs font-semibold hover:bg-[#4a2475] transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-60"
            >
              {isSaving ? (
                <>
                  <i className="ph ph-circle-notch animate-spin text-sm"></i>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <i className="ph ph-floppy-disk text-sm"></i>
                  <span>Save Settings</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

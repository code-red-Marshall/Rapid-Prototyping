import { useState, useRef, useEffect } from 'react';
import {
  generateAnnouncement,
  rewriteAnnouncement,
  getAvailableTones,
} from '../../lib/prompts/composer';

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

// Tone options sourced from the composer's registry — single source of truth.
const TONE_OPTIONS = [
  { value: '', label: 'Select tone' },
  ...getAvailableTones().map(t => ({ value: t.id, label: t.label })),
];

const CITY_OPTIONS    = ['All Cities', 'New York', 'London', 'Bangalore', 'Singapore', 'Dubai', 'Toronto', 'Sydney'];
const COUNTRY_OPTIONS = ['All Countries', 'United States', 'United Kingdom', 'India', 'Singapore', 'UAE', 'Canada', 'Australia'];
const DEPT_OPTIONS    = ['All Departments', 'Engineering', 'Sales', 'Marketing', 'HR', 'Finance', 'Operations', 'Product'];
const POST_VIA_OPTIONS = ['Select', 'Activity Feed', 'Email', 'Slack', 'MS Teams', 'All Channels'];

const DESC_MAX = 1000;

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * AnnouncementPage — Anno_2 design.
 * Single-column form: AI Composer → Title → Description → Audience & Delivery → Post.
 * Groq API powers "Generate Draft" and "Improve Writing".
 */
export default function AnnouncementPage() {
  // Form state
  const [aiPrompt,      setAiPrompt]      = useState('');
  const [tone,          setTone]          = useState('corporate');
  const [title,         setTitle]         = useState('');
  const [description,   setDescription]   = useState('');
  const [city,          setCity]          = useState('');
  const [country,       setCountry]       = useState('');
  const [department,    setDepartment]    = useState('');
  const [postVia,       setPostVia]       = useState('');
  const [audienceOpen,  setAudienceOpen]  = useState(true);

  // AI state
  const [aiLoading,      setAiLoading]      = useState(false);
  const [aiError,        setAiError]        = useState('');
  const [improveLoading, setImproveLoading] = useState(false);
  const [improveError,   setImproveError]   = useState('');

  // Tracks whether the description was typed by the user (true) or
  // auto-filled by "Generate Draft" (false). Improve Writing is only
  // actionable when the user has typed content themselves.
  const [isDescTyped, setIsDescTyped] = useState(false);

  // Tracks the original AI-generated draft to enable partial improvements on user edits.
  const [originalAiDraft, setOriginalAiDraft] = useState('');

  // Description action history (Undo / Redo)
  const [descHistory, setDescHistory] = useState(['']);
  const [historyIndex, setHistoryIndex] = useState(0);
  const typingTimeoutRef = useRef(null);

  const pushToHistory = (newVal) => {
    if (newVal === descHistory[historyIndex]) return;
    const newHist = descHistory.slice(0, historyIndex + 1);
    newHist.push(newVal);
    if (newHist.length > 50) {
      newHist.shift();
    }
    setDescHistory(newHist);
    setHistoryIndex(newHist.length - 1);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      setHistoryIndex(prevIndex);
      const prevVal = descHistory[prevIndex];
      setDescription(prevVal);
      setIsDescTyped(true);
    }
  };

  const handleRedo = () => {
    if (historyIndex < descHistory.length - 1) {
      const nextIndex = historyIndex + 1;
      setHistoryIndex(nextIndex);
      const nextVal = descHistory[nextIndex];
      setDescription(nextVal);
      setIsDescTyped(true);
    }
  };

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, []);

  // Tips panel
  const [tipsOpen, setTipsOpen] = useState(false);

  const descRef = useRef(null);

  // ── AI: Generate Draft ────────────────────────────────────────────────────

  /**
   * Calls Groq with the user's prompt to generate a full announcement draft.
   * Populates title + description fields.
   */
  const handleGenerateDraft = async () => {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    setAiError('');
    try {
      // GENERATE FLOW: validation → base + tone (structured injection) → LLM → output validator
      const result = await generateAnnouncement({
        userInput:    aiPrompt,
        toneId:       tone || 'informative',
        placeholders: {}, // extend with form context if needed in future
      });
      if (result.title)       setTitle(result.title);
      if (result.description) {
        const generated = result.description.substring(0, DESC_MAX);
        setDescription(generated);
        setOriginalAiDraft(generated); // Track the original draft
        setIsDescTyped(false); // AI filled it — Improve Writing stays locked

        // Push directly to history and clear manual typing debounce
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        const newHist = descHistory.slice(0, historyIndex + 1);
        newHist.push(generated);
        setDescHistory(newHist);
        setHistoryIndex(newHist.length - 1);
      }
    } catch (err) {
      setAiError(err.message || 'Generation failed. Check your API key and try again.');
    } finally {
      setAiLoading(false);
    }
  };

  // ── AI: Improve Writing ───────────────────────────────────────────────────

  /**
   * Calls Groq to improve the existing description text in-place.
   */
  const handleImproveWriting = async () => {
    if (!description.trim() || !isDescTyped) return;
    setImproveLoading(true);
    setImproveError('');
    try {
      // Clear manual typing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }

      // REWRITE FLOW: validation → rewrite prompt (CRAFT) → LLM → output validator
      const result = await rewriteAnnouncement({
        existingText: description,
        toneId:       tone || null,
        originalDraftText: originalAiDraft || null,
      });
      const improved = result.message.substring(0, DESC_MAX);
      setDescription(improved);
      setOriginalAiDraft(improved); // Update original AI draft to the improved text for subsequent edits
      // After rewrite, isDescTyped stays true — user can re-improve if needed

      // Construct history: push pre-improved text first if it differs from current history point
      let newHist = descHistory.slice(0, historyIndex + 1);
      if (description !== newHist[newHist.length - 1]) {
        newHist.push(description);
      }
      newHist.push(improved);
      setDescHistory(newHist);
      setHistoryIndex(newHist.length - 1);
    } catch (err) {
      setImproveError(err.message || 'Improvement failed. Try again.');
    } finally {
      setImproveLoading(false);
    }
  };

  // ── Submit ────────────────────────────────────────────────────────────────

  /** Handles the Post button — placeholder for save/publish logic. */
  const handlePost = () => {
    // TODO: wire to API / state management
    alert('Announcement posted! (prototype — no backend connected)');
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-full bg-[#FAFAFA]">
      <div className="px-8 py-7 max-w-[900px]">

        {/* ── Page Header ─────────────────────────────────────────────── */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-[24px] font-bold text-[#1A1A1A] leading-tight">
              Create Announcement
            </h1>
            <p className="text-[14px] text-[#6B7280] mt-1">
              Compose a compelling announcement with the help of AI.
            </p>
          </div>
          <button
            id="tips-examples-btn"
            onClick={() => setTipsOpen(v => !v)}
            className="flex items-center gap-1.5 text-[13px] text-[#5C2D91] font-medium hover:text-[#4a2475] transition-colors mt-1"
          >
            <i className="ph ph-lightbulb text-base" />
            Tips &amp; Examples
          </button>
        </div>

        {/* Tips panel */}
        {tipsOpen && (
          <div className="mb-5 bg-[#F3EEF9] border border-[#D4B8F0] rounded-[10px] p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[13px] font-semibold text-[#5C2D91]">Tips for great announcements</p>
              <button onClick={() => setTipsOpen(false)} className="text-[#9E9E9E] hover:text-[#5C2D91]">
                <i className="ph ph-x text-sm" />
              </button>
            </div>
            <ul className="space-y-1.5 text-[12px] text-[#424242]">
              <li className="flex gap-2"><i className="ph ph-check-circle text-[#5C2D91] mt-0.5 flex-shrink-0" /> Keep the title short and action-oriented (e.g. "Diwali Celebration – Join Us!")</li>
              <li className="flex gap-2"><i className="ph ph-check-circle text-[#5C2D91] mt-0.5 flex-shrink-0" /> Include key details: date, time, location or link.</li>
              <li className="flex gap-2"><i className="ph ph-check-circle text-[#5C2D91] mt-0.5 flex-shrink-0" /> Use AI to draft — then personalise for your team.</li>
              <li className="flex gap-2"><i className="ph ph-check-circle text-[#5C2D91] mt-0.5 flex-shrink-0" /> Example: <span className="italic text-[#757575]">"Diwali celebration at office with ethnic dress code from 6 PM to 9 PM"</span></li>
            </ul>
          </div>
        )}

        {/* ── AI Announcement Composer ─────────────────────────────────── */}
        <div className="bg-white border border-[#E5E7EB] rounded-[12px] p-5 mb-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          {/* Composer header row */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-[8px] bg-[#F3EEF9] flex items-center justify-center flex-shrink-0">
                <i className="ph-fill ph-sparkle text-[#5C2D91] text-[15px]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[14px] font-semibold text-[#1A1A1A]">AI Announcement Composer</span>
                  <span className="text-[10px] font-semibold text-[#5C2D91] bg-[#EDE7F6] px-1.5 py-0.5 rounded-[4px] uppercase tracking-wide">Beta</span>
                </div>
                <p className="text-[12px] text-[#6B7280] mt-0.5">
                  Describe what you want to announce and AI will draft it for you.
                </p>
              </div>
            </div>

            {/* Tone dropdown */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <label htmlFor="tone-select" className="text-[13px] font-medium text-[#374151] flex items-center gap-1">
                <i className="ph ph-smiley text-base text-[#5C2D91]" />
                Tone
              </label>
              <div className="relative">
                <select
                  id="tone-select"
                  value={tone}
                  onChange={e => setTone(e.target.value)}
                  className="appearance-none pl-3 pr-8 py-2 border border-[#D1D5DB] rounded-[8px] text-[13px] text-[#374151] bg-white focus:outline-none focus:ring-2 focus:ring-[#5C2D91]/30 focus:border-[#5C2D91] cursor-pointer min-w-[140px]"
                >
                  {TONE_OPTIONS.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
                <i className="ph ph-caret-down absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] text-sm pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Prompt input + Generate button row */}
          <div className="flex gap-3 items-start">
            <div className="flex-1">
              <textarea
                id="ai-prompt-input"
                value={aiPrompt}
                onChange={e => setAiPrompt(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleGenerateDraft(); }}
                placeholder="Describe what you'd like to announce..."
                rows={2}
                className="w-full px-3 py-2.5 border border-[#E5E7EB] rounded-[8px] text-[13px] text-[#1A1A1A] placeholder:text-[#9CA3AF] bg-[#FAFAFA] focus:outline-none focus:ring-2 focus:ring-[#5C2D91]/20 focus:border-[#5C2D91] resize-none transition-colors"
              />
              <p className="text-[11px] text-[#9CA3AF] mt-1 pl-0.5">
                Example: Diwali celebration at office with ethnic dress code from 6 PM to 9 PM
              </p>
            </div>
            <button
              id="generate-draft-btn"
              onClick={handleGenerateDraft}
              disabled={aiLoading || !aiPrompt.trim()}
              className="flex items-center gap-2 bg-[#5C2D91] text-white px-4 py-2.5 rounded-[8px] text-[13px] font-semibold hover:bg-[#4a2475] active:bg-[#3d1f60] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm flex-shrink-0 whitespace-nowrap mt-0"
            >
              <i className={`ph-fill ph-sparkle text-sm ${aiLoading ? 'animate-pulse' : ''}`} />
              {aiLoading ? 'Generating…' : 'Generate Draft'}
            </button>
          </div>

          {/* AI error */}
          {aiError && (
            <p className="mt-2.5 text-[12px] text-[#DC2626] bg-[#FEF2F2] border border-[#FECACA] rounded-[6px] px-3 py-2">
              {aiError}
            </p>
          )}
        </div>

        {/* ── Announcement Title ───────────────────────────────────────── */}
        <div className="bg-white border border-[#E5E7EB] rounded-[12px] p-5 mb-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          <label htmlFor="ann-title" className="block text-[14px] font-semibold text-[#1A1A1A] mb-3">
            Announcement Title <span className="text-[#DC2626]">*</span>
          </label>
          <input
            id="ann-title"
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Enter announcement title..."
            className="w-full px-3 py-2.5 border border-[#E5E7EB] rounded-[8px] text-[14px] text-[#1A1A1A] placeholder:text-[#9CA3AF] bg-white focus:outline-none focus:ring-2 focus:ring-[#5C2D91]/20 focus:border-[#5C2D91] transition-colors"
          />
        </div>

        {/* ── Announcement Description ─────────────────────────────────── */}
        <div className="bg-white border border-[#E5E7EB] rounded-[12px] p-5 mb-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          <div className="flex items-center justify-between mb-3">
            <label htmlFor="ann-desc" className="block text-[14px] font-semibold text-[#1A1A1A]">
              Announcement Description <span className="text-[#DC2626]">*</span>
            </label>
            <button
              id="improve-writing-btn"
              onClick={handleImproveWriting}
              disabled={improveLoading || !isDescTyped || !description.trim()}
              title={!isDescTyped ? 'Type in the description field first to enable Improve Writing' : ''}
              className="flex items-center gap-1.5 text-[12px] font-medium text-[#5C2D91] hover:text-[#4a2475] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <i className={`ph-fill ph-sparkle text-sm ${improveLoading ? 'animate-pulse' : ''}`} />
              {improveLoading ? 'Improving…' : 'Improve Writing'}
            </button>
          </div>

          {/* Rich text area */}
          <textarea
            id="ann-desc"
            ref={descRef}
            value={description}
            onChange={e => {
              const val = e.target.value.substring(0, DESC_MAX);
              setDescription(val);
              setIsDescTyped(true);
              if (!val.trim()) {
                setOriginalAiDraft('');
              }
              // Debounce pushing manual edits to history (e.g. 800ms)
              if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
              typingTimeoutRef.current = setTimeout(() => {
                pushToHistory(val);
              }, 800);
            }}
            placeholder="Enter announcement description..."
            rows={14}
            className="w-full px-3 py-2.5 border border-[#E5E7EB] rounded-[8px] text-[14px] text-[#1A1A1A] placeholder:text-[#9CA3AF] bg-white focus:outline-none focus:ring-2 focus:ring-[#5C2D91]/20 focus:border-[#5C2D91] resize-none transition-colors leading-relaxed"
          />

          {/* Toolbar + counter row */}
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#F3F4F6]">
            {/* Inline toolbar icons */}
            <div className="flex items-center gap-0.5">
              <ToolbarBtn icon="ph-image" title="Insert image" />
              <ToolbarBtn icon="ph-link" title="Insert link" />
              <ToolbarBtn icon="ph-file-text" title="Attach file" />
            </div>
            {/* History actions + character counter */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleUndo}
                disabled={historyIndex <= 0}
                title="Undo"
                className="w-7 h-7 flex items-center justify-center rounded-[5px] text-[#6B7280] hover:text-[#5C2D91] hover:bg-[#F3EEF9] disabled:opacity-30 disabled:hover:text-[#6B7280] disabled:hover:bg-transparent transition-all cursor-pointer disabled:cursor-not-allowed"
              >
                <i className="ph ph-arrow-counter-clockwise text-[15px]" />
              </button>
              <button
                type="button"
                onClick={handleRedo}
                disabled={historyIndex >= descHistory.length - 1}
                title="Redo"
                className="w-7 h-7 flex items-center justify-center rounded-[5px] text-[#6B7280] hover:text-[#5C2D91] hover:bg-[#F3EEF9] disabled:opacity-30 disabled:hover:text-[#6B7280] disabled:hover:bg-transparent transition-all cursor-pointer disabled:cursor-not-allowed"
              >
                <i className="ph ph-arrow-clockwise text-[15px]" />
              </button>
              <div className="w-[1px] h-3 bg-[#E5E7EB] mx-1.5" />
              <span className={`text-[12px] font-medium ${description.length >= DESC_MAX ? 'text-[#DC2626]' : 'text-[#9CA3AF]'}`}>
                {description.length}/{DESC_MAX}
              </span>
            </div>
          </div>

          {/* Improve error */}
          {improveError && (
            <p className="mt-2 text-[12px] text-[#DC2626] bg-[#FEF2F2] border border-[#FECACA] rounded-[6px] px-3 py-2">
              {improveError}
            </p>
          )}
        </div>

        {/* ── Audience & Delivery ──────────────────────────────────────── */}
        <div className="bg-white border border-[#E5E7EB] rounded-[12px] mb-7 shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
          {/* Section header */}
          <button
            id="audience-toggle-btn"
            type="button"
            onClick={() => setAudienceOpen(v => !v)}
            className="w-full flex items-center gap-2 px-5 py-4 text-left hover:bg-[#FAFAFA] transition-colors"
          >
            <span className="text-[14px] font-semibold text-[#1A1A1A] flex-1">Audience &amp; Delivery</span>
            <i className={`ph ph-caret-${audienceOpen ? 'up' : 'down'} text-[#6B7280] text-sm transition-transform`} />
          </button>

          {audienceOpen && (
            <div className="px-5 pb-5 border-t border-[#F3F4F6]">
              <p className="text-[12px] text-[#6B7280] mt-3 mb-4">
                Choose where and how you want to post this announcement.
              </p>

              <div className="grid grid-cols-2 gap-4">
                {/* City */}
                <div>
                  <label htmlFor="select-city" className="block text-[13px] font-medium text-[#374151] mb-1.5">
                    Select City(s) <span className="text-[#DC2626]">*</span>
                  </label>
                  <SelectField
                    id="select-city"
                    value={city}
                    onChange={setCity}
                    options={CITY_OPTIONS}
                    placeholder="Select"
                  />
                </div>

                {/* Country */}
                <div>
                  <label htmlFor="select-country" className="block text-[13px] font-medium text-[#374151] mb-1.5">
                    Select Country(s) <span className="text-[#DC2626]">*</span>
                  </label>
                  <SelectField
                    id="select-country"
                    value={country}
                    onChange={setCountry}
                    options={COUNTRY_OPTIONS}
                    placeholder="Select"
                  />
                </div>

                {/* Department */}
                <div>
                  <label htmlFor="select-dept" className="block text-[13px] font-medium text-[#374151] mb-1.5">
                    Select Department(s) <span className="text-[#DC2626]">*</span>
                  </label>
                  <SelectField
                    id="select-dept"
                    value={department}
                    onChange={setDepartment}
                    options={DEPT_OPTIONS}
                    placeholder="Select"
                  />
                </div>

                {/* Post via */}
                <div>
                  <label htmlFor="post-via" className="block text-[13px] font-medium text-[#374151] mb-1.5">
                    Post this announcement via <span className="text-[#DC2626]">*</span>
                  </label>
                  <SelectField
                    id="post-via"
                    value={postVia}
                    onChange={setPostVia}
                    options={POST_VIA_OPTIONS}
                    placeholder="Select"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Post Button ──────────────────────────────────────────────── */}
        <div>
          <button
            id="post-announcement-btn"
            onClick={handlePost}
            className="px-8 py-2.5 bg-[#5C2D91] text-white text-[14px] font-semibold rounded-[8px] hover:bg-[#4a2475] active:bg-[#3d1f60] transition-colors shadow-sm"
          >
            Post
          </button>
        </div>

      </div>
    </div>
  );
}


// ─────────────────────────────────────────────────────────────────────────────
// SHARED UI PRIMITIVES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * ToolbarBtn — small icon button for the description toolbar.
 * @param {object} props
 * @param {string} props.icon  - Phosphor icon class (without 'ph-' prefix on the wrapping element)
 * @param {string} props.title - Accessible tooltip
 */
function ToolbarBtn({ icon, title }) {
  return (
    <button
      type="button"
      title={title}
      className="w-7 h-7 flex items-center justify-center rounded-[5px] text-[#6B7280] hover:text-[#5C2D91] hover:bg-[#F3EEF9] transition-all"
    >
      <i className={`ph ${icon} text-[15px]`} />
    </button>
  );
}

/**
 * SelectField — styled native select with a custom caret.
 * @param {object}   props
 * @param {string}   props.id
 * @param {string}   props.value
 * @param {function} props.onChange
 * @param {string[]} props.options
 * @param {string}   props.placeholder
 */
function SelectField({ id, value, onChange, options, placeholder }) {
  return (
    <div className="relative">
      <select
        id={id}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full appearance-none pl-3 pr-8 py-2.5 border border-[#E5E7EB] rounded-[8px] text-[13px] bg-white focus:outline-none focus:ring-2 focus:ring-[#5C2D91]/20 focus:border-[#5C2D91] cursor-pointer text-[#374151] transition-colors"
      >
        <option value="">{placeholder}</option>
        {options.map(opt => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
      <i className="ph ph-caret-down absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] text-sm pointer-events-none" />
    </div>
  );
}

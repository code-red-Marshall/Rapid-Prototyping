import { useState } from 'react';

/**
 * BackgroundLibrary — Badge module only.
 * Renders a single compact color picker (native picker + HEX input + live preview).
 * No image upload, no templates, no solid color swatches.
 * Those options live exclusively in the Award module.
 *
 * @param {object} props
 * @param {object} props.selectedBackground - Currently selected background.
 * @param {Function} props.setSelectedBackground - Setter for selectedBackground.
 */
export default function BackgroundLibrary({ selectedBackground, setSelectedBackground }) {
  const initColor =
    selectedBackground?.type === 'color' ? selectedBackground.value : '#EDE7F6';

  const [customColor, setCustomColor] = useState(initColor);

  const handleChange = (color) => {
    setCustomColor(color);
    setSelectedBackground({ id: `color-${color}`, type: 'color', value: color });
  };

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-sm font-semibold text-slate-700">Background Color</h3>

      {/* Color picker row */}
      <div className="flex items-center gap-3">
        {/* Native color swatch trigger */}
        <div className="relative h-11 flex-1 rounded-lg border border-slate-200 overflow-hidden flex items-center px-3 cursor-pointer group hover:border-[#5C2D91] transition-colors">
          <div
            className="w-6 h-6 rounded-full border border-black/10 mr-3 shadow-inner shrink-0"
            style={{ backgroundColor: customColor }}
          />
          <span className="text-sm text-slate-500 flex-1">Pick Color</span>
          <i className="ph ph-palette text-slate-400 group-hover:text-[#5C2D91] transition-colors text-lg"></i>
          <input
            type="color"
            value={/^#[0-9A-Fa-f]{6}$/.test(customColor) ? customColor : '#EDE7F6'}
            onChange={(e) => handleChange(e.target.value)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        </div>

        {/* HEX text input */}
        <input
          type="text"
          value={customColor}
          onChange={(e) => {
            const v = e.target.value;
            setCustomColor(v);
            if (/^#[0-9A-Fa-f]{6}$/.test(v)) {
              setSelectedBackground({ id: `color-${v}`, type: 'color', value: v });
            }
          }}
          placeholder="#HEX"
          maxLength={7}
          className="w-24 h-11 px-3 rounded-lg border border-slate-200 font-mono text-sm uppercase text-slate-800 focus:outline-none focus:border-[#5C2D91] transition-colors"
        />
      </div>

      {/* Live preview strip */}
      <div
        className="h-10 w-full rounded-lg border border-slate-200 transition-colors"
        style={{ backgroundColor: customColor }}
      />
    </div>
  );
}

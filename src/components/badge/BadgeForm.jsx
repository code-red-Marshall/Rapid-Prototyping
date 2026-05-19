import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function BadgeForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    countryType: 'all',
    description: '',
    values: '',
    gradeGroups: '',
    appreciators: '',
    addCampaign: false,
    advancedFilters: false,
    includeCertificate: false,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.name.trim() === '') return;
    navigate('/badge/design', { state: { badgeData: formData } });
  };

  return (
    <div className="w-full pt-4 pb-12">
      <h2 className="text-[22px] font-semibold text-[#212121] mb-8">Create Badge</h2>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-[700px]">
        
        {/* Badge Name */}
        <div>
          <label htmlFor="name" className="block text-[13px] font-medium text-[#212121] mb-1.5">
            Badge name <span className="text-[#D32F2F]">*</span>
          </label>
          <input
            type="text"
            id="name"
            required
            maxLength={150}
            className="w-full px-3 py-2 border border-[#E0E0E0] rounded-[6px] text-[13px] focus:ring-1 focus:ring-[#5C2D91] focus:border-[#5C2D91] outline-none transition-colors placeholder:text-[#BDBDBD] bg-white"
            placeholder="e.g. Top Performer"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <div className="text-right text-[11px] text-[#757575] mt-1">
            {formData.name.length}/150
          </div>
        </div>

        {/* Country Selection */}
        <div>
          <label className="block text-[13px] font-medium text-[#212121] mb-2">
            Select country(s) for the badge <span className="text-[#D32F2F]">*</span>
          </label>
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer text-[13px] text-[#212121]">
              <input 
                type="radio" 
                name="countryType" 
                value="all"
                checked={formData.countryType === 'all'}
                onChange={(e) => setFormData({ ...formData, countryType: e.target.value })}
                className="w-4 h-4 text-[#5C2D91] border-[#BDBDBD] focus:ring-[#5C2D91]"
              />
              <span>All countries</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-[13px] text-[#212121]">
              <input 
                type="radio" 
                name="countryType" 
                value="specific"
                checked={formData.countryType === 'specific'}
                onChange={(e) => setFormData({ ...formData, countryType: e.target.value })}
                className="w-4 h-4 text-[#5C2D91] border-[#BDBDBD] focus:ring-[#5C2D91]"
              />
              <span>Select specific country(s)</span>
            </label>
          </div>
        </div>

        {/* Badge Description */}
        <div>
          <label htmlFor="description" className="block text-[13px] font-medium text-[#212121] mb-1.5">
            Badge description
          </label>
          <textarea
            id="description"
            rows={4}
            maxLength={250}
            className="w-full px-3 py-2 border border-[#E0E0E0] rounded-[6px] text-[13px] focus:ring-1 focus:ring-[#5C2D91] focus:border-[#5C2D91] outline-none transition-colors resize-none placeholder:text-[#BDBDBD] bg-white"
            placeholder="Describe what this badge represents"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
          <div className="text-right text-[11px] text-[#757575] mt-1">
            {formData.description.length}/250
          </div>
        </div>

        {/* Organisation Values */}
        <div>
          <label htmlFor="values" className="block text-[13px] font-medium text-[#212121] mb-1.5">
            Organisation values
          </label>
          <input
            type="text"
            id="values"
            className="w-full px-3 py-2 border border-[#E0E0E0] rounded-[6px] text-[13px] focus:ring-1 focus:ring-[#5C2D91] focus:border-[#5C2D91] outline-none transition-colors placeholder:text-[#BDBDBD] bg-white"
            placeholder="e.g. Teamwork, Trust"
            value={formData.values}
            onChange={(e) => setFormData({ ...formData, values: e.target.value })}
          />
          <p className="text-[11px] text-[#9E9E9E] mt-1.5">
            The organisation values will appear on the feed as #Teamwork #Trust
          </p>
        </div>

        {/* Grade Groups */}
        <div>
          <label htmlFor="gradeGroups" className="block text-[13px] font-medium text-[#212121] mb-1.5">
            Specify grade group(s) of the appreciator of the badge
          </label>
          <input
            type="text"
            id="gradeGroups"
            className="w-full px-3 py-2 border border-[#E0E0E0] rounded-[6px] text-[13px] focus:ring-1 focus:ring-[#5C2D91] focus:border-[#5C2D91] outline-none transition-colors placeholder:text-[#BDBDBD] bg-white"
            placeholder="Search or select grade group(s)"
            value={formData.gradeGroups}
            onChange={(e) => setFormData({ ...formData, gradeGroups: e.target.value })}
          />
        </div>

        {/* Assign Appreciators */}
        <div>
          <label htmlFor="appreciators" className="block text-[13px] font-medium text-[#212121] mb-1.5">
            Assign appreciators
          </label>
          <input
            type="text"
            id="appreciators"
            className="w-full px-3 py-2 border border-[#E0E0E0] rounded-[6px] text-[13px] focus:ring-1 focus:ring-[#5C2D91] focus:border-[#5C2D91] outline-none transition-colors placeholder:text-[#BDBDBD] bg-white"
            placeholder="Search by appreciator's name or email"
            value={formData.appreciators}
            onChange={(e) => setFormData({ ...formData, appreciators: e.target.value })}
          />
        </div>

        {/* Checkboxes & Toggles */}
        <div className="space-y-4 pt-2">
          
          <label className="flex items-center gap-3 cursor-pointer">
            <input 
              type="checkbox" 
              checked={formData.addCampaign}
              onChange={(e) => setFormData({ ...formData, addCampaign: e.target.checked })}
              className="w-4 h-4 rounded-[4px] border-[#E0E0E0] text-[#5C2D91] focus:ring-[#5C2D91] bg-white"
            />
            <span className="text-[13px] text-[#212121] font-medium">Add this badge to campaign</span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            {/* Custom Toggle Switch */}
            <div className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus-within:ring-2 focus-within:ring-[#5C2D91] focus-within:ring-offset-2" style={{ backgroundColor: formData.advancedFilters ? '#5C2D91' : '#E0E0E0' }}>
              <input
                type="checkbox"
                className="sr-only"
                checked={formData.advancedFilters}
                onChange={(e) => setFormData({ ...formData, advancedFilters: e.target.checked })}
              />
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  formData.advancedFilters ? 'translate-x-4' : 'translate-x-1'
                }`}
              />
            </div>
            <span className="text-[13px] text-[#212121] font-medium">Advanced filters</span>
          </label>

          <div>
            <label className="flex items-start gap-3 cursor-pointer">
              <input 
                type="checkbox" 
                checked={formData.includeCertificate}
                onChange={(e) => setFormData({ ...formData, includeCertificate: e.target.checked })}
                className="w-4 h-4 mt-[3px] rounded-[4px] border-[#E0E0E0] text-[#5C2D91] focus:ring-[#5C2D91] bg-white"
              />
              <div>
                <div className="text-[13px] text-[#212121] font-medium">Include a certificate</div>
                <div className="text-[11px] text-[#9E9E9E] mt-0.5">You can select the certificate later in the configuration process</div>
              </div>
            </label>
          </div>

        </div>

        {/* Footer Button */}
        <div className="pt-10">
          <button
            type="submit"
            className="px-5 py-2 bg-[#2D2F45] text-white text-[13px] font-medium rounded-[6px] hover:bg-[#1f2030] transition-colors flex items-center gap-2"
          >
            <span>Save & Proceed</span>
            <i className="ph ph-arrow-right font-bold"></i>
          </button>
        </div>
      </form>
    </div>
  );
}

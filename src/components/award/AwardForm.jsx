import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AwardForm() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1
    awardType: 'standard',
    name: '',
    description: '',
    values: '',
    awardGroup: '',
    certificateRequired: false,
    
    // Step 2
    approvalRequired: 'auto',
    denominations: '',
    countryType: 'all',
    advanceFiltering: false,
    minEligibility: '0',
    visibilityShared: true,
    visibilityRestricted: true,
    visibilityPrivate: true,
    nominators: '',
    selfNomination: true,
  });

  const handleNextStep = (e) => {
    e.preventDefault();
    if (formData.name.trim() === '') return;
    setStep(2);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    navigate('/award/design', { state: { awardData: formData } });
  };

  return (
    <div className="w-full pt-4 pb-12">
      <h2 className="text-[22px] font-semibold text-[#212121] mb-8">Create Award</h2>

      {step === 1 ? (
        <form onSubmit={handleNextStep} className="space-y-6 max-w-[700px]">
          
          {/* Award Type Cards */}
          <div>
            <label className="block text-[13px] font-medium text-[#212121] mb-3">
              What kind of monetary award type do you want to create?
            </label>
            <div className="grid grid-cols-3 gap-4">
              
              {/* Standard Award */}
              <label 
                className={`cursor-pointer rounded-[8px] border p-4 flex gap-3 transition-colors ${
                  formData.awardType === 'standard' 
                    ? 'border-[#5C2D91] bg-white' 
                    : 'border-[#E0E0E0] bg-white hover:border-[#BDBDBD]'
                }`}
              >
                <input 
                  type="radio" 
                  name="awardType"
                  value="standard"
                  checked={formData.awardType === 'standard'}
                  onChange={(e) => setFormData({ ...formData, awardType: e.target.value })}
                  className="w-4 h-4 mt-0.5 text-[#5C2D91] border-gray-300 focus:ring-[#5C2D91]"
                />
                <div>
                  <div className="text-[13px] font-semibold text-[#212121]">Standard award</div>
                  <div className="text-[11px] text-[#757575] mt-0.5">Can have approval levels</div>
                </div>
              </label>

              {/* Panel Award */}
              <label 
                className={`cursor-pointer rounded-[8px] border p-4 flex gap-3 transition-colors ${
                  formData.awardType === 'panel' 
                    ? 'border-[#5C2D91] bg-white' 
                    : 'border-[#E0E0E0] bg-white hover:border-[#BDBDBD]'
                }`}
              >
                <input 
                  type="radio" 
                  name="awardType"
                  value="panel"
                  checked={formData.awardType === 'panel'}
                  onChange={(e) => setFormData({ ...formData, awardType: e.target.value })}
                  className="w-4 h-4 mt-0.5 text-[#5C2D91] border-gray-300 focus:ring-[#5C2D91]"
                />
                <div>
                  <div className="text-[13px] font-semibold text-[#212121]">Panel award</div>
                  <div className="text-[11px] text-[#757575] mt-0.5">Panelist votes decide winner</div>
                </div>
              </label>

              {/* CSV Award */}
              <label 
                className={`cursor-pointer rounded-[8px] border p-4 flex gap-3 transition-colors ${
                  formData.awardType === 'csv' 
                    ? 'border-[#5C2D91] bg-white' 
                    : 'border-[#E0E0E0] bg-white hover:border-[#BDBDBD]'
                }`}
              >
                <input 
                  type="radio" 
                  name="awardType"
                  value="csv"
                  checked={formData.awardType === 'csv'}
                  onChange={(e) => setFormData({ ...formData, awardType: e.target.value })}
                  className="w-4 h-4 mt-0.5 text-[#5C2D91] border-gray-300 focus:ring-[#5C2D91]"
                />
                <div>
                  <div className="text-[13px] font-semibold text-[#212121]">CSV award</div>
                  <div className="text-[11px] text-[#757575] mt-0.5">Done by uploading CSV file</div>
                </div>
              </label>

            </div>
          </div>

          {/* Award Name */}
          <div>
            <label htmlFor="name" className="block text-[13px] font-medium text-[#212121] mb-1.5">
              Award name <span className="text-[#D32F2F]">*</span>
            </label>
            <input
              type="text"
              id="name"
              required
              maxLength={150}
              className="w-full px-3 py-2 border border-[#E0E0E0] rounded-[6px] text-[13px] focus:ring-1 focus:ring-[#5C2D91] focus:border-[#5C2D91] outline-none transition-colors placeholder:text-[#BDBDBD] bg-white"
              placeholder="e.g., Standout Performer"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <div className="text-right text-[11px] text-[#757575] mt-1">
              {formData.name.length}/150
            </div>
          </div>

          {/* Award Description */}
          <div>
            <label htmlFor="description" className="block text-[13px] font-medium text-[#212121] mb-1.5">
              Award description
            </label>
            <textarea
              id="description"
              rows={4}
              maxLength={800}
              className="w-full px-3 py-2 border border-[#E0E0E0] rounded-[6px] text-[13px] focus:ring-1 focus:ring-[#5C2D91] focus:border-[#5C2D91] outline-none transition-colors resize-none placeholder:text-[#BDBDBD] bg-white"
              placeholder="Type here..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
            <div className="text-right text-[11px] text-[#757575] mt-1">
              {formData.description.length}/800
            </div>
          </div>

          {/* Organization Values */}
          <div>
            <label htmlFor="values" className="block text-[13px] font-medium text-[#212121] mb-1.5">
              Organization values
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
              The organization values will appear on the feed as #Teamwork #Trust
            </p>
          </div>

          {/* Award Group Name */}
          <div>
            <label htmlFor="awardGroup" className="block text-[13px] font-medium text-[#212121] mb-1.5">
              Award group name
            </label>
            <input
              type="text"
              id="awardGroup"
              className="w-full px-3 py-2 border border-[#E0E0E0] rounded-[6px] text-[13px] focus:ring-1 focus:ring-[#5C2D91] focus:border-[#5C2D91] outline-none transition-colors bg-white"
              value={formData.awardGroup}
              onChange={(e) => setFormData({ ...formData, awardGroup: e.target.value })}
            />
          </div>

          {/* Certificate Toggle */}
          <div className="pt-2">
            <label className="flex items-center gap-3 cursor-pointer w-fit">
              <div className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus-within:ring-2 focus-within:ring-[#5C2D91] focus-within:ring-offset-2" style={{ backgroundColor: formData.certificateRequired ? '#5C2D91' : '#E0E0E0' }}>
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={formData.certificateRequired}
                  onChange={(e) => setFormData({ ...formData, certificateRequired: e.target.checked })}
                />
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    formData.certificateRequired ? 'translate-x-4' : 'translate-x-1'
                  }`}
                />
              </div>
              <span className="text-[13px] text-[#212121] font-medium">Certificate required</span>
            </label>
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
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6 max-w-[700px]">
          
          {/* Approval Requirement */}
          <div>
            <label className="block text-[13px] font-medium text-[#212121] mb-2">
              Select approvals required for the award <span className="text-[#D32F2F]">*</span>
            </label>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer text-[13px] text-[#212121]">
                <input 
                  type="radio" 
                  name="approvalRequired" 
                  value="auto"
                  checked={formData.approvalRequired === 'auto'}
                  onChange={(e) => setFormData({ ...formData, approvalRequired: e.target.value })}
                  className="w-4 h-4 text-[#5C2D91] border-[#BDBDBD] focus:ring-[#5C2D91]"
                />
                <span>Auto approval</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-[13px] text-[#212121]">
                <input 
                  type="radio" 
                  name="approvalRequired" 
                  value="first"
                  checked={formData.approvalRequired === 'first'}
                  onChange={(e) => setFormData({ ...formData, approvalRequired: e.target.value })}
                  className="w-4 h-4 text-[#5C2D91] border-[#BDBDBD] focus:ring-[#5C2D91]"
                />
                <span>First level approval</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-[13px] text-[#212121]">
                <input 
                  type="radio" 
                  name="approvalRequired" 
                  value="second"
                  checked={formData.approvalRequired === 'second'}
                  onChange={(e) => setFormData({ ...formData, approvalRequired: e.target.value })}
                  className="w-4 h-4 text-[#5C2D91] border-[#BDBDBD] focus:ring-[#5C2D91]"
                />
                <span>Second level approval</span>
              </label>
            </div>
            <p className="text-[11px] italic text-[#9E9E9E] mt-2">
              Note: Auto approved awards are system approved
            </p>
          </div>

          {/* Denominations */}
          <div>
            <label htmlFor="denominations" className="block text-[13px] font-medium text-[#212121] mb-1.5">
              Select denomination(s) for the award <span className="text-[#D32F2F]">*</span>
            </label>
            <input
              type="text"
              id="denominations"
              className="w-full px-3 py-2 border border-[#E0E0E0] rounded-[6px] text-[13px] focus:ring-1 focus:ring-[#5C2D91] focus:border-[#5C2D91] outline-none transition-colors placeholder:text-[#BDBDBD] bg-white"
              placeholder="Denomination(s)"
              value={formData.denominations}
              onChange={(e) => setFormData({ ...formData, denominations: e.target.value })}
              required
            />
          </div>

          {/* Country Selection */}
          <div>
            <label className="block text-[13px] font-medium text-[#212121] mb-2">
              Select country(s) for the award <span className="text-[#D32F2F]">*</span>
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

          {/* Advance Filtering Toggle */}
          <div className="pt-1">
            <label className="flex items-center gap-3 cursor-pointer w-fit">
              <div className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus-within:ring-2 focus-within:ring-[#5C2D91] focus-within:ring-offset-2" style={{ backgroundColor: formData.advanceFiltering ? '#5C2D91' : '#E0E0E0' }}>
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={formData.advanceFiltering}
                  onChange={(e) => setFormData({ ...formData, advanceFiltering: e.target.checked })}
                />
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    formData.advanceFiltering ? 'translate-x-4' : 'translate-x-1'
                  }`}
                />
              </div>
              <span className="text-[13px] text-[#212121] font-medium">Advance filtering</span>
            </label>
          </div>

          {/* Minimum Eligibility */}
          <div>
            <label htmlFor="minEligibility" className="block text-[13px] font-medium text-[#212121] mb-1.5">
              The receiver of this award should have a minimum eligibility
            </label>
            <input
              type="text"
              id="minEligibility"
              className="w-full px-3 py-2 border border-[#E0E0E0] rounded-[6px] text-[13px] focus:ring-1 focus:ring-[#5C2D91] focus:border-[#5C2D91] outline-none transition-colors bg-white"
              value={formData.minEligibility}
              onChange={(e) => setFormData({ ...formData, minEligibility: e.target.value })}
            />
          </div>

          {/* Award Visibility */}
          <div>
            <label className="block text-[13px] font-medium text-[#212121] mb-2">
              Award visibility <span className="text-[#D32F2F]">*</span>
            </label>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer text-[13px] text-[#212121]">
                <input 
                  type="checkbox" 
                  checked={formData.visibilityShared}
                  onChange={(e) => setFormData({ ...formData, visibilityShared: e.target.checked })}
                  className="w-4 h-4 rounded-[4px] border-[#BDBDBD] text-[#5C2D91] focus:ring-[#5C2D91] bg-white"
                />
                <span>Shared</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-[13px] text-[#212121]">
                <input 
                  type="checkbox" 
                  checked={formData.visibilityRestricted}
                  onChange={(e) => setFormData({ ...formData, visibilityRestricted: e.target.checked })}
                  className="w-4 h-4 rounded-[4px] border-[#BDBDBD] text-[#5C2D91] focus:ring-[#5C2D91] bg-white"
                />
                <span>Restricted</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-[13px] text-[#212121]">
                <input 
                  type="checkbox" 
                  checked={formData.visibilityPrivate}
                  onChange={(e) => setFormData({ ...formData, visibilityPrivate: e.target.checked })}
                  className="w-4 h-4 rounded-[4px] border-[#BDBDBD] text-[#5C2D91] focus:ring-[#5C2D91] bg-white"
                />
                <span>Private</span>
              </label>
            </div>
          </div>

          {/* Assign Nominators */}
          <div>
            <label htmlFor="nominators" className="block text-[13px] font-medium text-[#212121] mb-1.5">
              Assign nominators
            </label>
            <input
              type="text"
              id="nominators"
              className="w-full px-3 py-2 border border-[#E0E0E0] rounded-[6px] text-[13px] focus:ring-1 focus:ring-[#5C2D91] focus:border-[#5C2D91] outline-none transition-colors placeholder:text-[#BDBDBD] bg-white"
              placeholder="Search and select"
              value={formData.nominators}
              onChange={(e) => setFormData({ ...formData, nominators: e.target.value })}
            />
          </div>

          {/* Self Nomination Toggle (Green) */}
          <div className="pt-2">
            <label className="flex items-center gap-3 cursor-pointer w-fit">
              <div className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus-within:ring-2 focus-within:ring-[#0CAF60] focus-within:ring-offset-2" style={{ backgroundColor: formData.selfNomination ? '#0CAF60' : '#E0E0E0' }}>
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={formData.selfNomination}
                  onChange={(e) => setFormData({ ...formData, selfNomination: e.target.checked })}
                />
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    formData.selfNomination ? 'translate-x-4' : 'translate-x-1'
                  }`}
                />
              </div>
              <span className="text-[13px] text-[#212121] font-medium">Self nomination</span>
            </label>
          </div>

          {/* Footer Buttons */}
          <div className="pt-10 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-5 py-2 bg-[#F5F5F5] text-[#212121] text-[13px] font-medium rounded-[6px] hover:bg-[#E0E0E0] transition-colors flex items-center gap-2"
            >
              <i className="ph ph-arrow-left font-bold"></i>
              <span>Back</span>
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#2D2F45] text-white text-[13px] font-medium rounded-[6px] hover:bg-[#1f2030] transition-colors flex items-center gap-2"
            >
              <span>Save & Proceed</span>
              <i className="ph ph-arrow-right font-bold"></i>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

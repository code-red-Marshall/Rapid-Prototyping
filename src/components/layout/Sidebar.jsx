import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

/**
 * Sidebar — Left navigation panel matching the Vantage Circle production UI.
 * Features expandable Configuration section with active route highlighting.
 */
export default function Sidebar() {
  const location = useLocation();
  const [expandedSections, setExpandedSections] = useState({
    configuration: true,
    boost: false,
    budgetAutomation: false,
  });

  const toggleSection = (key) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  /**
   * Checks if a path is the active route.
   * @param {string} path
   */
  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <div className="w-[220px] h-full bg-white border-r border-[#E0E0E0] flex flex-col flex-shrink-0">
      {/* Header with Logo */}
      <div className="h-[46px] flex items-center px-4 border-b border-[#E8E8E8] flex-shrink-0">
        <img 
          src="/logo.png" 
          alt="Vantage Circle" 
          className="h-[22px] object-contain ml-1"
        />
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 overflow-y-auto pt-4 pb-2 px-3 scrollbar-hide">
        
        {/* Overview */}
        <NavItem icon="ph-squares-four" label="Overview" />
        
        {/* Insights */}
        <NavItem icon="ph-chart-line-up" label="Insights" />
        
        {/* Configuration — Expandable */}
        <div className="mb-0.5">
          <button 
            onClick={() => toggleSection('configuration')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-[13px] font-medium transition-colors ${
              isActive('/badge') || isActive('/award') || isActive('/announcement')
                ? 'text-[#5C2D91]' 
                : 'text-[#212121] hover:bg-[#F5F5F5]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <i className="ph ph-gear text-[16px]"></i>
              <span>Configuration</span>
            </div>
            <i className={`ph ph-caret-${expandedSections.configuration ? 'up' : 'down'} text-[10px] text-[#757575]`}></i>
          </button>
          
          {expandedSections.configuration && (
            <div className="ml-[30px] mt-0.5 space-y-0.5 border-l-2 border-[#F5F5F5]">
              <SubNavItem label="Question & Category" path="/question-category" isActive={isActive('/question-category')} />
              <SubNavItem label="Badge" path="/badge" isActive={isActive('/badge')} />
              <SubNavItem label="Award" path="/award" isActive={isActive('/award')} />
              <SubNavItem label="Greetings" path="/greetings" isActive={false} />
              <SubNavItem label="Gift" path="/gift" isActive={false} />
              <SubNavItem label="Advanced Filter" path="/advanced-filter" isActive={false} />
              <SubNavItem label="Announcement" path="/announcement" isActive={isActive('/announcement')} />
              <SubNavItem label="Certificate" path="/certificate" isActive={false} />
              <SubNavItem label="Uploader/Approver" path="/uploader-approver" isActive={false} />
              <SubNavItem label="Department" path="/department" isActive={false} />
              <SubNavItem label="Email" path="/email" isActive={false} />
              <SubNavItem label="Quota Configuration" path="/quota-configuration" isActive={false} />
              <SubNavItem label="Quota Allocation" path="/quota-allocation" isActive={false} />
            </div>
          )}
        </div>
        
        {/* Campaign */}
        <NavItem icon="ph-flag-pennant" label="Campaign" />
        
        {/* Boost — Expandable */}
        <div className="mb-0.5">
          <button 
            onClick={() => toggleSection('boost')}
            className="w-full flex items-center justify-between px-3 py-2 rounded-md text-[13px] font-medium text-[#212121] hover:bg-[#F5F5F5] transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <i className="ph ph-rocket-launch text-[16px]"></i>
              <span>Boost</span>
            </div>
            <i className={`ph ph-caret-${expandedSections.boost ? 'up' : 'down'} text-[10px] text-[#757575]`}></i>
          </button>
          {expandedSections.boost && (
            <div className="ml-[30px] mt-0.5 space-y-0.5 border-l-2 border-[#F5F5F5]">
              <SubNavItem label="Configuration" path="/boost-config" isActive={false} />
            </div>
          )}
        </div>
        
        {/* Budget Automation — Expandable */}
        <div className="mb-0.5">
          <button 
            onClick={() => toggleSection('budgetAutomation')}
            className="w-full flex items-center justify-between px-3 py-2 rounded-md text-[13px] font-medium text-[#212121] hover:bg-[#F5F5F5] transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <i className="ph ph-currency-circle-dollar text-[16px]"></i>
              <span>Budget Automation</span>
            </div>
            <i className={`ph ph-caret-${expandedSections.budgetAutomation ? 'up' : 'down'} text-[10px] text-[#757575]`}></i>
          </button>
        </div>
        
        {/* Budget */}
        <NavItem icon="ph-wallet" label="Budget" />
        
        {/* Reports */}
        <NavItem icon="ph-file-text" label="Reports" />
        
        {/* Ask AI */}
        <NavItem icon="ph-sparkle" label="Ask AI" highlight />

      </nav>
    </div>
  );
}

/**
 * NavItem — A single top-level navigation item.
 * @param {object} props
 * @param {string} props.icon - Phosphor icon class
 * @param {string} props.label - Display label
 * @param {boolean} props.highlight - Whether to show accent color
 */
function NavItem({ icon, label, highlight = false }) {
  return (
    <div className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] font-medium cursor-pointer transition-colors mb-0.5 ${
      highlight 
        ? 'text-[#5C2D91] hover:bg-[#F3EEF9]' 
        : 'text-[#212121] hover:bg-[#F5F5F5]'
    }`}>
      <i className={`ph ${icon} text-[16px]`}></i>
      <span>{label}</span>
    </div>
  );
}

/**
 * SubNavItem — A child navigation link inside an expandable section.
 * @param {object} props
 * @param {string} props.label - Display label
 * @param {string} props.path - Route path
 * @param {boolean} props.isActive - Whether this is the current route
 */
function SubNavItem({ label, path, isActive }) {
  return (
    <Link
      to={path || '#'}
      className={`block pl-4 pr-3 py-1.5 text-[13px] rounded-r-md transition-colors ${
        isActive 
          ? 'text-[#5C2D91] font-semibold border-l-2 border-[#5C2D91] -ml-[2px] bg-[#F3EEF9]' 
          : 'text-[#757575] hover:text-[#212121] hover:bg-[#F5F5F5]'
      }`}
    >
      {label}
    </Link>
  );
}

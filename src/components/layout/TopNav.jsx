/**
 * TopNav — Horizontal top navigation bar, pixel-perfect clone of Vantage Circle production UI.
 * Single logo instance. Layout: Logo | Grid Icon | [Vantage Recognition ▾] | 👥 Add Employees | ...spacer... | 🔗 | 👤
 */
export default function TopNav() {
  return (
    <header className="h-[46px] bg-white border-b border-[#E8E8E8] flex items-center px-4 flex-shrink-0">
      
      {/* Left cluster — Logo + Grid + Nav items */}
      <div className="flex items-center">
        {/* Grid / Apps icon — small bordered square */}
        <button className="w-6 h-6 flex items-center justify-center rounded border border-[#D0D0D0] text-[#757575] hover:bg-[#F5F5F5] transition-colors mr-3">
          <i className="ph ph-squares-four text-[12px]"></i>
        </button>

        {/* Vantage Recognition — Dark pill */}
        <button className="flex items-center gap-1.5 bg-[#2D2F45] text-white pl-3.5 pr-2.5 py-[5px] rounded-full text-[12px] font-medium hover:bg-[#3a3c55] transition-colors mr-4">
          <span>Vantage Recognition</span>
          <i className="ph-bold ph-caret-down text-[8px] opacity-70"></i>
        </button>

        {/* Add Employees — Ghost link */}
        <button className="flex items-center gap-1.5 text-[#2D2F45] text-[12px] font-medium hover:text-[#5C2D91] transition-colors">
          <i className="ph ph-users-three text-[14px]"></i>
          <span>Add Employees</span>
        </button>
      </div>

      {/* Spacer */}
      <div className="flex-1"></div>

      {/* Right cluster — External link + Avatar */}
      <div className="flex items-center gap-3">
        {/* External link icon */}
        <button className="text-[#757575] hover:text-[#212121] transition-colors">
          <i className="ph ph-arrow-square-out text-[16px]"></i>
        </button>

        {/* Profile avatar */}
        <div className="w-[28px] h-[28px] rounded-full overflow-hidden border border-[#D0D0D0] cursor-pointer hover:ring-2 hover:ring-[#5C2D91] hover:ring-offset-1 transition-all">
          <img 
            src="https://i.pravatar.cc/150?u=admin" 
            alt="Admin" 
            className="w-full h-full object-cover" 
          />
        </div>
      </div>
    </header>
  );
}

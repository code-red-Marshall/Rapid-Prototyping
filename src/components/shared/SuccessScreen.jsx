import { useLocation, useNavigate } from 'react-router-dom';

export default function SuccessScreen() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const { name, type, finalImage } = location.state || { name: 'Your Design', type: 'badge' };

  return (
    <div className="h-full flex flex-col items-center justify-center p-6 bg-[#F5F5F5]">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 flex flex-col items-center max-w-md w-full text-center">
        
        {/* Large Purple Checkmark */}
        <div className="w-20 h-20 bg-purple-50 rounded-full flex items-center justify-center mb-6">
          <i className="ph-fill ph-check-circle text-[#5C2D91] text-5xl"></i>
        </div>

        {/* Optional: Show the generated image if we passed it */}
        {finalImage && (
          <div className="mb-6">
            <img src={finalImage} alt={name} className="w-32 h-32 object-contain drop-shadow-md" />
          </div>
        )}

        {/* Title & Message */}
        <h2 className="text-2xl font-bold text-slate-900 mb-2">{name}</h2>
        <p className="text-slate-500 mb-8 text-sm">Created successfully. Your {type} is ready to use.</p>

        {/* Create Another Button */}
        <button
          onClick={() => navigate(`/${type}`)}
          className="bg-[#5C2D91] text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-[#4a2475] transition-colors w-full"
        >
          Create Another
        </button>
        
      </div>
    </div>
  );
}

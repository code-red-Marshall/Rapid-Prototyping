import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import TopNav from './components/layout/TopNav';
import BadgeForm from './components/badge/BadgeForm';
import BadgeDesignScreen from './components/badge/BadgeDesignScreen';
import AwardForm from './components/award/AwardForm';
import AwardDesignScreen from './components/award/AwardDesignScreen';
import SuccessScreen from './components/shared/SuccessScreen';
import AnnouncementPage from './components/announcement/AnnouncementPage';

function App() {
  return (
    <BrowserRouter>
      <div className="flex h-screen bg-slate-50 font-sans">
        {/* Sidebar */}
        <Sidebar />
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-white">
          <TopNav />
          
          <main className="flex-1 overflow-auto p-6">
            <Routes>
              <Route path="/" element={<Navigate to="/badge" replace />} />
              <Route path="/badge" element={<BadgeForm />} />
              <Route path="/badge/design" element={<BadgeDesignScreen />} />
              <Route path="/award" element={<AwardForm />} />
              <Route path="/award/design" element={<AwardDesignScreen />} />
              <Route path="/announcement" element={<AnnouncementPage />} />
              <Route path="/success" element={<SuccessScreen />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;

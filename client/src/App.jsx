import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import NodalLogin from './components/NodalLogin';
import Dashboard from './components/Dashboard';
import AnganwadiForm from './components/forms/AnganwadiForm';
import SchoolForm from './components/forms/SchoolForm';
import HostelForm from './components/forms/HostelForm';
import PdsForm from './components/forms/PdsForm';
import GramChaupalForm from './components/forms/GramChaupalForm';
import HealthForm from './components/forms/HealthForm';
import AwasForm from './components/forms/AwasForm';
import GoswaraReports from './components/GoswaraReports';
import AdminComplianceReport from './components/AdminComplianceReport';
import AdminOfficerManagement from './components/AdminOfficerManagement';
import InspectionDetailModal from './components/InspectionDetailModal';
import { Home, FileSpreadsheet, PlusCircle, UserCheck, Shield, ClipboardCheck, Users, LogOut } from 'lucide-react';
import { API } from './api';

export default function App() {
  const [officer, setOfficer] = useState(() => API.getCurrentOfficer());
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedInspection, setSelectedInspection] = useState(null);

  useEffect(() => {
    // If officer state changes in storage
    const current = API.getCurrentOfficer();
    if (current && (!officer || officer.id !== current.id)) {
      setOfficer(current);
    }
    // Automatically sync any pending drafts to Supabase cloud
    API.syncOfflineDrafts().catch(() => {});
  }, []);

  const handleLogout = () => {
    API.logout();
    setOfficer(null);
    setActiveTab('dashboard');
  };

  const handleLoginSuccess = (officerData) => {
    setOfficer(officerData);
    setActiveTab('dashboard');
  };

  const handleSelectModule = (moduleKey) => {
    if (officer?.role === 'admin') {
      alert('एडमिन स्तर पर निरीक्षण फॉर्म प्रविष्टि की अनुमति नहीं है। यह सुविधा केवल क्षेत्रीय नोडल अधिकारियों हेतु उपलब्ध है।');
      return;
    }
    setActiveTab(`form_${moduleKey}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFormBack = () => {
    setActiveTab('dashboard');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFormSuccess = () => {
    setActiveTab('goswara');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isAdmin = officer?.role === 'admin' || officer?.id === 'admin';

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col selection:bg-blue-600 selection:text-white pb-16 sm:pb-6">
      
      {/* Top Navbar */}
      <Navbar
        officer={officer}
        onLogout={handleLogout}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5">
        {!officer ? (
          <NodalLogin onLoginSuccess={handleLoginSuccess} />
        ) : (
          <>
            {/* 1. Dashboard View */}
            {activeTab === 'dashboard' && (
              <Dashboard
                officer={officer}
                onSelectModule={handleSelectModule}
                onViewGoswara={() => setActiveTab('goswara')}
                onViewCompliance={() => setActiveTab('compliance')}
                onViewOfficers={() => setActiveTab('officers')}
                onViewDetail={data => setSelectedInspection(data)}
              />
            )}

            {/* 2. Inspection Forms (Accessible only to non-admin nodal officers) */}
            {!isAdmin && (
              <>
                {activeTab === 'form_anganwadi' && (
                  <AnganwadiForm
                    officer={officer}
                    onBack={handleFormBack}
                    onSuccess={handleFormSuccess}
                  />
                )}

                {activeTab === 'form_school' && (
                  <SchoolForm
                    officer={officer}
                    onBack={handleFormBack}
                    onSuccess={handleFormSuccess}
                  />
                )}

                {activeTab === 'form_hostel' && (
                  <HostelForm
                    officer={officer}
                    onBack={handleFormBack}
                    onSuccess={handleFormSuccess}
                  />
                )}

                {activeTab === 'form_pds' && (
                  <PdsForm
                    officer={officer}
                    onBack={handleFormBack}
                    onSuccess={handleFormSuccess}
                  />
                )}

                {activeTab === 'form_chaupal' && (
                  <GramChaupalForm
                    officer={officer}
                    onBack={handleFormBack}
                    onSuccess={handleFormSuccess}
                  />
                )}

                {activeTab === 'form_health' && (
                  <HealthForm
                    officer={officer}
                    onBack={handleFormBack}
                    onSuccess={handleFormSuccess}
                  />
                )}

                {activeTab === 'form_awas' && (
                  <AwasForm
                    officer={officer}
                    onBack={handleFormBack}
                    onSuccess={handleFormSuccess}
                  />
                )}
              </>
            )}

            {/* 3. Goswara Report View */}
            {activeTab === 'goswara' && (
              <GoswaraReports
                officer={officer}
                onBack={() => setActiveTab('dashboard')}
                onSelectInspection={data => setSelectedInspection(data)}
              />
            )}

            {/* 4. Admin Monthly Compliance Review View */}
            {activeTab === 'compliance' && (
              <AdminComplianceReport
                officer={officer}
                onBack={() => setActiveTab('dashboard')}
              />
            )}

            {/* 5. Admin Nodal Officer Management View */}
            {activeTab === 'officers' && isAdmin && (
              <AdminOfficerManagement
                officer={officer}
                onBack={() => setActiveTab('dashboard')}
              />
            )}
          </>
        )}
      </main>

      {/* Mobile Bottom Navigation Bar (Visible only on mobile screens and when logged in) */}
      {officer && (
        <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-2 flex items-center justify-around z-40 shadow-lg no-print">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center gap-0.5 text-[10px] font-bold ${
              activeTab === 'dashboard' ? 'text-blue-700' : 'text-slate-500'
            }`}
          >
            <Home className="w-5 h-5" />
            <span>होम</span>
          </button>

          {isAdmin ? (
            <button
              onClick={() => setActiveTab('officers')}
              className={`flex flex-col items-center gap-0.5 text-[10px] font-bold ${
                activeTab === 'officers' ? 'text-sky-700' : 'text-slate-500'
              }`}
            >
              <Users className="w-5 h-5 text-sky-600" />
              <span>अधिकारी</span>
            </button>
          ) : (
            <button
              onClick={() => {
                if (activeTab.startsWith('form_')) {
                  setActiveTab('dashboard');
                } else {
                  setActiveTab('form_anganwadi');
                }
              }}
              className={`flex flex-col items-center gap-0.5 text-[10px] font-bold ${
                activeTab.startsWith('form_') ? 'text-pink-700' : 'text-slate-500'
              }`}
            >
              <PlusCircle className="w-5 h-5 text-blue-600" />
              <span>फॉर्म भरें</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('goswara')}
            className={`flex flex-col items-center gap-0.5 text-[10px] font-bold ${
              activeTab === 'goswara' ? 'text-emerald-700' : 'text-slate-500'
            }`}
          >
            <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
            <span>गोसवारा</span>
          </button>

          {isAdmin && (
            <button
              onClick={() => setActiveTab('compliance')}
              className={`flex flex-col items-center gap-0.5 text-[10px] font-bold ${
                activeTab === 'compliance' ? 'text-blue-700' : 'text-slate-500'
              }`}
            >
              <ClipboardCheck className="w-5 h-5 text-blue-600" />
              <span>समीक्षा</span>
            </button>
          )}

          <button
            onClick={handleLogout}
            className="flex flex-col items-center gap-0.5 text-[10px] font-bold text-slate-500 hover:text-red-600"
          >
            <LogOut className="w-5 h-5 text-red-500" />
            <span>लॉगआउट</span>
          </button>
        </nav>
      )}

      {/* Detail Modal */}
      {selectedInspection && (
        <InspectionDetailModal
          data={selectedInspection}
          onClose={() => setSelectedInspection(null)}
        />
      )}

    </div>
  );
}

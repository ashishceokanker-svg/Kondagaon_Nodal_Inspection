import React, { useState, useEffect } from 'react';
import { Shield, User, LogOut, Wifi, WifiOff, RefreshCw, FileSpreadsheet, Home, ChevronRight, ClipboardCheck, Users } from 'lucide-react';
import { API } from '../api';

export default function Navbar({ officer, onLogout, activeTab, setActiveTab }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [draftCount, setDraftCount] = useState(0);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const updateDrafts = () => {
      const drafts = API.getOfflineDrafts();
      setDraftCount(drafts.length);
    };
    updateDrafts();
    const interval = setInterval(updateDrafts, 3000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await API.syncOfflineDrafts();
      alert(`सिंक संपन्न: ${res.synced} रिकॉर्ड्स अपलोड हुए।`);
      setDraftCount(API.getOfflineDrafts().length);
    } catch (e) {
      alert('सिंक विफल हुआ। कृपया इंटरनेट कनेक्शन जांचें।');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <header className="bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-950 text-white shadow-md sticky top-0 z-50">
      {/* Main Header with Center Prominent Title and Logo */}
      <div className="max-w-7xl mx-auto px-3 py-2.5 flex flex-col md:flex-row items-center justify-between gap-3">
        <div 
          onClick={() => setActiveTab('dashboard')} 
          className="cursor-pointer flex items-center justify-center md:justify-start gap-3 select-none text-center md:text-left w-full md:w-auto"
        >
          <div className="w-13 h-13 sm:w-16 sm:h-16 rounded-full bg-white p-1 shadow-lg border-2 border-amber-400 flex items-center justify-center shrink-0">
            <img 
              src="/cg_logo.svg" 
              alt="छत्तीसगढ़ शासन मोनो" 
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <h1 className="text-base sm:text-lg md:text-xl font-black tracking-tight text-amber-300 leading-tight">
              कार्यालय कलेक्टर, जिला-कोण्डागांव (छ०ग०)
            </h1>
            <p className="text-[11px] sm:text-xs text-blue-100 font-semibold mt-0.5">
              नोडल अधिकारी क्षेत्रीय निरीक्षण एवं डिजिटल गोसवारा पोर्टल
            </p>
          </div>
        </div>

        {/* Right action controls */}
        <div className="flex flex-wrap items-center justify-center md:justify-end gap-2">
          {/* Online/Offline status indicator */}
          <div className="shrink-0">
            {isOnline ? (
              <span className="hidden sm:inline-flex items-center gap-1 text-emerald-300 text-[10px] bg-emerald-950/60 px-2 py-1 rounded-lg border border-emerald-500/30 font-medium">
                <Wifi className="w-3 h-3 text-emerald-400" /> ऑनलाइन
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-amber-300 text-[10px] bg-amber-950/60 px-2 py-1 rounded-lg border border-amber-500/30 font-medium animate-pulse">
                <WifiOff className="w-3 h-3 text-amber-400" /> ऑफलाइन मोड
              </span>
            )}
          </div>

          {draftCount > 0 && (
            <button
              onClick={handleSync}
              disabled={syncing}
              className="bg-amber-500 hover:bg-amber-600 text-amber-950 text-xs px-2.5 py-1.5 rounded-lg font-bold flex items-center gap-1 shadow-sm transition animate-pulse"
              title="लंबित ऑफलाइन ड्राफ्ट सिंक करें"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">सिंक ({draftCount})</span>
              <span className="sm:hidden">({draftCount})</span>
            </button>
          )}

          {officer?.role === 'admin' && (
            <button
              onClick={() => setActiveTab('officers')}
              className={`text-xs px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition ${
                activeTab === 'officers' 
                  ? 'bg-amber-400 text-slate-900 shadow-md' 
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
            >
              <Users className="w-4 h-4 text-sky-300" />
              <span className="hidden sm:inline">नोडल अधिकारी प्रबंधन</span>
              <span className="sm:hidden">अधिकारी प्रबंधन</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('goswara')}
            className={`text-xs px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition ${
              activeTab === 'goswara' 
                ? 'bg-amber-400 text-slate-900 shadow-md' 
                : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">गोसवारा रिपोर्ट</span>
            <span className="sm:hidden">गोसवारा</span>
          </button>

          {officer?.role === 'admin' && (
            <button
              onClick={() => setActiveTab('compliance')}
              className={`text-xs px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition ${
                activeTab === 'compliance' 
                  ? 'bg-amber-400 text-slate-900 shadow-md' 
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
            >
              <ClipboardCheck className="w-4 h-4 text-amber-300" />
              <span className="hidden sm:inline">माहवार अनुपालन समीक्षा</span>
              <span className="sm:hidden">समीक्षा</span>
            </button>
          )}

          {officer && (
            <div className="flex items-center gap-2 bg-white/10 px-2.5 py-1 rounded-xl border border-white/10">
              <div className="text-right">
                <div className="flex items-center justify-end gap-1.5">
                  {officer.role === 'admin' ? (
                    <span className="text-[10px] bg-amber-400 text-slate-950 font-black px-1.5 py-0.2 rounded">
                      ADMIN
                    </span>
                  ) : (
                    <span className="text-[10px] bg-blue-500/50 text-blue-100 font-semibold px-1.5 py-0.2 rounded">
                      {officer.panchayat || officer.block}
                    </span>
                  )}
                  <p className="text-xs font-bold leading-tight truncate max-w-[130px] sm:max-w-none">{officer.name}</p>
                </div>
                <div className="flex items-center justify-end gap-2 text-[10px] text-blue-200">
                  <span>{officer.selectedMonth || 'सितम्बर 2026'}</span>
                  <span className="hidden sm:inline">• {officer.designation}</span>
                </div>
              </div>
              <button
                onClick={onLogout}
                title="लॉगआउट / अन्य लॉगिन"
                className="p-1.5 hover:bg-red-500/40 rounded-lg text-red-200 hover:text-white transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

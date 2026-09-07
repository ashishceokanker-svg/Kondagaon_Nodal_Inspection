import React, { useState, useEffect, useMemo } from 'react';
import { 
  ArrowLeft, Download, Printer, CheckCircle2, XCircle, AlertTriangle, 
  Search, Users, Building, Calendar, Phone, MapPin, 
  Baby, GraduationCap, Wheat, Landmark, Activity, Home, FileSpreadsheet, RefreshCw
} from 'lucide-react';
import { API } from '../api';
import { DISTRICT_BLOCKS, MONTHS_LIST, getPanchayatsForBlock } from '../constants';
import { exportComplianceToExcelClient } from '../utils/clientExcelExport';

export default function AdminComplianceReport({ officer, onBack }) {
  const [selectedBlock, setSelectedBlock] = useState('फरसगांव');
  const [selectedPanchayat, setSelectedPanchayat] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('सितम्बर 2026');
  const [activeListTab, setActiveListTab] = useState('all'); // 'all' | 'completed' | 'pending'
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState(null);

  useEffect(() => {
    fetchReport();
  }, [selectedBlock, selectedMonth]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const data = await API.getComplianceReport({
        block: selectedBlock,
        month: selectedMonth
      });
      setReportData(data);
    } catch (err) {
      console.error('Failed to load compliance report:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = async () => {
    try {
      await exportComplianceToExcelClient({
        block: selectedBlock,
        month: selectedMonth
      });
    } catch (err) {
      console.warn('Client compliance excel export fallback to server:', err);
      const url = API.getComplianceExcelUrl({
        block: selectedBlock,
        month: selectedMonth
      });
      window.open(url, '_blank');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const summary = reportData?.summary || {
    totalOfficers: 0,
    completedCount: 0,
    pendingCount: 0,
    completionRate: 0,
    totalInspections: 0,
    typeStats: {}
  };

  // Filtered officers list based on activeListTab and searchQuery
  const displayedOfficers = useMemo(() => {
    if (!reportData) return [];
    let list = [];
    if (activeListTab === 'completed') {
      list = reportData.completedList || [];
    } else if (activeListTab === 'pending') {
      list = reportData.pendingList || [];
    } else {
      list = reportData.allOfficers || [];
    }

    if (selectedPanchayat) {
      list = list.filter(off => off.panchayat === selectedPanchayat || (off.panchayats && off.panchayats.includes(selectedPanchayat)));
    }

    if (!searchQuery.trim()) return list;

    const q = searchQuery.toLowerCase().trim();
    return list.filter(off => 
      (off.name && off.name.toLowerCase().includes(q)) ||
      (off.designation && off.designation.toLowerCase().includes(q)) ||
      (off.panchayat && off.panchayat.toLowerCase().includes(q)) ||
      (off.mobile && off.mobile.includes(q)) ||
      (off.block && off.block.toLowerCase().includes(q))
    );
  }, [reportData, activeListTab, selectedPanchayat, searchQuery]);

  const facilityLabels = [
    { key: 'anganwadi', name: 'आंगनबाड़ी', icon: Baby, color: 'text-pink-600 bg-pink-50' },
    { key: 'school', name: 'शाला', icon: GraduationCap, color: 'text-blue-600 bg-blue-50' },
    { key: 'hostel', name: 'छात्रावास', icon: Building, color: 'text-emerald-600 bg-emerald-50' },
    { key: 'pds', name: 'उचित मूल्य दुकान', icon: Wheat, color: 'text-amber-600 bg-amber-50' },
    { key: 'chaupal', name: 'चौपाल', icon: Landmark, color: 'text-purple-600 bg-purple-50' },
    { key: 'health', name: 'स्वास्थ्य', icon: Activity, color: 'text-red-600 bg-red-50' },
    { key: 'awas', name: 'आवास', icon: Home, color: 'text-cyan-600 bg-cyan-50' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-5 mb-16">
      
      {/* 1. Header & Quick Actions */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-200 no-print">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-600 transition"
              title="वापस डैशबोर्ड"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white p-1 shadow border border-amber-400 shrink-0">
                <img src="/cg_logo.svg" alt="छत्तीसगढ़ शासन मोनो" className="w-full h-full object-contain" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  कार्यालय कलेक्टर, जिला-कोण्डागांव (छ०ग०)
                </h2>
                <p className="text-xs text-blue-800 font-semibold flex items-center gap-1.5 mt-0.5">
                  <span className="bg-blue-100 text-blue-900 px-2 py-0.5 rounded text-[11px] font-bold">
                    🛡️ एडमिन निगरानी मॉड्यूल
                  </span>
                  <span>माहवार निरीक्षण अनुपालन एवं समीक्षा प्रतिवेदन</span>
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportExcel}
              disabled={loading}
              className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold py-2.5 px-3.5 rounded-xl shadow-sm flex items-center gap-1.5 transition"
              title="अनुपालन रिपोर्ट एक्सेल डाउनलोड करें"
            >
              <Download className="w-4 h-4" />
              <span>एक्सेल रिपोर्ट (.xlsx)</span>
            </button>

            <button
              onClick={handlePrint}
              className="bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold py-2.5 px-3.5 rounded-xl shadow-sm flex items-center gap-1.5 transition"
              title="प्रिंट या पीडीएफ बनाएं"
            >
              <Printer className="w-4 h-4" />
              <span>प्रिंट / PDF</span>
            </button>
          </div>
        </div>

        {/* 2. Filter Bar: Block, Panchayat, Month & Search */}
        <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-4 gap-2.5">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
              <Building className="w-3.5 h-3.5 text-blue-600" />
              <span>विकासखण्ड चुनें (Block)</span>
            </label>
            <select
              value={selectedBlock}
              onChange={e => {
                setSelectedBlock(e.target.value);
                setSelectedPanchayat('');
              }}
              className="w-full p-2.5 border border-slate-300 rounded-xl bg-slate-50 text-slate-800 font-semibold text-xs focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="सभी विकासखण्ड">-- सभी विकासखण्ड (समस्त जिला) --</option>
              {DISTRICT_BLOCKS.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-red-600" />
              <span>ग्राम पंचायत (Panchayat)</span>
            </label>
            <select
              value={selectedPanchayat}
              onChange={e => setSelectedPanchayat(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-xl bg-slate-50 text-slate-800 font-semibold text-xs focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="">-- सभी ग्राम पंचायतें --</option>
              {getPanchayatsForBlock(selectedBlock).map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-amber-600" />
              <span>निरीक्षण माह (Month)</span>
            </label>
            <select
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-xl bg-slate-50 text-slate-800 font-semibold text-xs focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              {MONTHS_LIST.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
              <Search className="w-3.5 h-3.5 text-emerald-600" />
              <span>त्वरित खोज (Search)</span>
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="नाम, पद, मोबाइल..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full p-2.5 pl-8 border border-slate-300 rounded-xl bg-slate-50 text-slate-800 text-xs focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3.5" />
            </div>
          </div>
        </div>
      </div>

      {/* Printable Official Header (Shown ONLY during print) */}
      <div className="hidden print:block text-center border-b-2 border-black pb-4 mb-4">
        <div className="flex items-center justify-center gap-3 mb-2">
          <img src="/cg_logo.svg" alt="छत्तीसगढ़ शासन" className="w-14 h-14 object-contain" />
          <div>
            <h1 className="text-xl font-black text-black">कार्यालय कलेक्टर, जिला-कोण्डागांव (छ०ग०)</h1>
            <p className="text-sm font-bold text-gray-800">
              नोडल अधिकारी मासिक क्षेत्रीय निरीक्षण प्रगति एवं अनुपालन समीक्षा प्रतिवेदन
            </p>
          </div>
        </div>
        <div className="flex justify-between items-center text-xs font-semibold text-gray-700 mt-2 border-t border-gray-300 pt-1">
          <span>विकासखण्ड: <b>{selectedBlock}</b></span>
          <span>समीक्षा माह: <b>{selectedMonth}</b></span>
          <span>प्रतिवेदन दिनांक: <b>{new Date().toLocaleDateString('hi-IN')}</b></span>
        </div>
      </div>

      {/* 3. KPI Summary Indicators */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {/* Total Officers */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500">कुल नियुक्त नोडल</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-slate-900">{summary.totalOfficers}</span>
            <span className="text-[10px] text-slate-500 font-medium">अधिकारी</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1 truncate">
            {selectedBlock === 'सभी विकासखण्ड' ? 'समस्त 5 ब्लॉक' : selectedBlock}
          </p>
        </div>

        {/* Completed Inspections Count */}
        <div className="bg-emerald-50/70 p-3.5 rounded-2xl border border-emerald-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-800">निरीक्षण पूर्ण</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-emerald-700">{summary.completedCount}</span>
            <span className="text-[10px] text-emerald-800 font-bold">({summary.completionRate}%)</span>
          </div>
          <p className="text-[10px] text-emerald-600 mt-1">
            सफलतापूर्वक निरीक्षण पूर्ण
          </p>
        </div>

        {/* Pending Inspections Count */}
        <div className="bg-amber-50/70 p-3.5 rounded-2xl border border-amber-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-900">निरीक्षण लंबित</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-amber-700">{summary.pendingCount}</span>
            <span className="text-[10px] text-amber-800 font-bold">
              ({summary.totalOfficers ? Math.round((summary.pendingCount / summary.totalOfficers) * 100) : 0}%)
            </span>
          </div>
          <p className="text-[10px] text-amber-700 mt-1">
            प्रविष्टि अप्राप्त / शेष
          </p>
        </div>

        {/* Total Inspections Conducted */}
        <div className="bg-blue-50/70 p-3.5 rounded-2xl border border-blue-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-blue-900">कुल निरीक्षण प्रविष्टियां</span>
            <FileSpreadsheet className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-blue-700">{summary.totalInspections}</span>
            <span className="text-[10px] text-blue-800 font-bold">संस्थाएं</span>
          </div>
          <p className="text-[10px] text-blue-600 mt-1">
            7 संस्थाओं में कुल जांच
          </p>
        </div>

        {/* Progress % */}
        <div className="bg-indigo-50/70 p-3.5 rounded-2xl border border-indigo-200 shadow-sm col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-indigo-900">विकासखण्ड प्रगति दर</span>
            <span className="text-xs font-black text-indigo-700">{summary.completionRate}%</span>
          </div>
          <div className="w-full bg-indigo-200/60 rounded-full h-2.5 mt-3 overflow-hidden">
            <div 
              className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500" 
              style={{ width: `${Math.min(100, summary.completionRate || 0)}%` }}
            />
          </div>
          <p className="text-[10px] text-indigo-600 mt-2 font-medium">
            माह {selectedMonth} की प्रगति
          </p>
        </div>
      </div>

      {/* 4. Sector-wise Breakdown Badges */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
          <span>संस्थावार निरीक्षण सारांश ({selectedMonth}):</span>
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
          {facilityLabels.map(fac => {
            const val = summary.typeStats?.[fac.key];
            const count = typeof val === 'object' ? (val?.count ?? val?.total ?? 0) : (val || 0);
            return (
              <div 
                key={fac.key}
                className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-100"
              >
                <div className={`p-1.5 rounded-lg ${fac.color} shrink-0`}>
                  <fac.icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] text-slate-500 block truncate">{fac.name}</span>
                  <span className="text-xs font-bold text-slate-800">{count} निरीक्षण</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Filter Tabs: All vs Completed vs Pending */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-3 sm:p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 no-print">
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setActiveListTab('all')}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                activeListTab === 'all'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>समस्त नोडल अधिकारी</span>
              <span className="bg-slate-200 text-slate-800 px-1.5 py-0.2 rounded-full text-[10px]">
                {reportData?.allOfficers?.length || 0}
              </span>
            </button>

            <button
              onClick={() => setActiveListTab('completed')}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                activeListTab === 'completed'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-emerald-800 hover:text-emerald-950'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>निरीक्षण पूर्ण करने वाले</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeListTab === 'completed' ? 'bg-emerald-800 text-white' : 'bg-emerald-100 text-emerald-800'
              }`}>
                {summary.completedCount}
              </span>
            </button>

            <button
              onClick={() => setActiveListTab('pending')}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                activeListTab === 'pending'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-amber-800 hover:text-amber-950'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>निरीक्षण लंबित (अप्राप्त)</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeListTab === 'pending' ? 'bg-amber-800 text-white' : 'bg-amber-100 text-amber-800'
              }`}>
                {summary.pendingCount}
              </span>
            </button>
          </div>

          <div className="text-xs text-slate-500 font-medium">
            प्रदर्शित अधिकारी: <b className="text-slate-800">{displayedOfficers.length}</b>
          </div>
        </div>

        {/* 6. Officers Compliance Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-16 text-center text-slate-500">
              <RefreshCw className="w-8 h-8 mx-auto mb-2 animate-spin text-blue-600" />
              <p className="text-sm font-semibold">विकासखण्ड एवं माहवार अनुपालन डाटा लोड हो रहा है...</p>
            </div>
          ) : displayedOfficers.length === 0 ? (
            <div className="py-16 text-center text-slate-500">
              <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">कोई रिकॉर्ड नहीं मिला</p>
              <p className="text-xs text-slate-400 mt-1">चयनित फिल्टर अथवा खोज शब्द के अनुरूप कोई अधिकारी उपलब्ध नहीं है।</p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <table className="hidden sm:table w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                    <th className="py-3 px-3 w-12 text-center">क्र.</th>
                    <th className="py-3 px-3">अधिकारी का नाम एवं पदनाम</th>
                    <th className="py-3 px-3">आवंटित ग्राम पंचायत</th>
                    <th className="py-3 px-3">विकासखण्ड</th>
                    <th className="py-3 px-3">मोबाइल नंबर</th>
                    <th className="py-3 px-3 text-center">निरीक्षण स्थिति</th>
                    <th className="py-3 px-3">संस्थावार विवरण ({selectedMonth})</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {displayedOfficers.map((off, idx) => {
                    const isDone = off.hasInspected;
                    return (
                      <tr 
                        key={off.id || `${off.name}_${idx}`}
                        className={`hover:bg-slate-50/80 transition ${
                          !isDone ? 'bg-amber-50/20' : ''
                        }`}
                      >
                        <td className="py-3 px-3 text-center text-slate-500 font-semibold">{idx + 1}</td>
                        
                        {/* Name & Designation */}
                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-900">{off.name}</div>
                          <div className="text-[11px] text-slate-500 mt-0.5">{off.designation}</div>
                        </td>

                        {/* Panchayat */}
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1 font-semibold text-slate-800">
                            <MapPin className="w-3 h-3 text-red-500 shrink-0" />
                            <span>{off.panchayat || (off.panchayats ? off.panchayats.join(', ') : '-')}</span>
                          </div>
                        </td>

                        {/* Block */}
                        <td className="py-3 px-3 font-medium text-slate-700">{off.block || '-'}</td>

                        {/* Mobile */}
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1 text-slate-700 font-mono">
                            <Phone className="w-3 h-3 text-emerald-600 shrink-0" />
                            <span>{off.mobile || '-'}</span>
                          </div>
                        </td>

                        {/* Inspection Status Badge */}
                        <td className="py-3 px-3 text-center">
                          {isDone ? (
                            <div className="inline-flex flex-col items-center">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-xs">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>पूर्ण ({off.inspectionCount})</span>
                              </span>
                              <span className="text-[10px] text-emerald-700 font-medium mt-0.5">
                                {off.inspectionCount} निरीक्षण दर्ज
                              </span>
                            </div>
                          ) : (
                            <div className="inline-flex flex-col items-center">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                                <XCircle className="w-3.5 h-3.5 text-amber-600" />
                                <span>लंबित</span>
                              </span>
                              <span className="text-[10px] text-amber-700 font-medium mt-0.5">
                                निरीक्षण अप्राप्त
                              </span>
                            </div>
                          )}
                        </td>

                        {/* Facility Breakdown */}
                        <td className="py-3 px-3">
                          {isDone ? (
                            <div className="flex flex-wrap gap-1">
                              {Object.entries(off.typeBreakdown || {}).map(([type, cnt]) => {
                                if (!cnt) return null;
                                const facInfo = facilityLabels.find(f => f.key === type);
                                const label = facInfo ? facInfo.name : type;
                                return (
                                  <span 
                                    key={type} 
                                    className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded text-[10px] font-semibold"
                                  >
                                    <span>{label}:</span>
                                    <b className="text-blue-700">{cnt}</b>
                                  </span>
                                );
                              })}
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">
                              माह {selectedMonth} में कोई प्रविष्टि नहीं
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Mobile Card View (Optimized for field smartphones) */}
              <div className="block sm:hidden divide-y divide-slate-100">
                {displayedOfficers.map((off, idx) => {
                  const isDone = off.hasInspected;
                  return (
                    <div 
                      key={off.id || `${off.name}_${idx}`} 
                      className={`p-3.5 space-y-2.5 ${!isDone ? 'bg-amber-50/30' : 'bg-white'}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2">
                          <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <div>
                            <h4 className="font-bold text-slate-900 text-xs leading-snug">{off.name}</h4>
                            <p className="text-[11px] text-slate-500 leading-tight mt-0.5">{off.designation}</p>
                          </div>
                        </div>
                        {isDone ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shrink-0">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>पूर्ण ({off.inspectionCount})</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 shrink-0">
                            <XCircle className="w-3 h-3 text-amber-600" />
                            <span>लंबित</span>
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-600">
                        <span className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded font-medium">
                          <MapPin className="w-3 h-3 text-red-500 shrink-0" />
                          <b>{off.panchayat || (off.panchayats ? off.panchayats.join(', ') : '-')}</b>
                        </span>
                        <span className="bg-slate-100 px-2 py-0.5 rounded">
                          {off.block || '-'}
                        </span>
                        {off.mobile && (
                          <a 
                            href={`tel:${off.mobile}`} 
                            className="flex items-center gap-1 bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded border border-emerald-200 hover:bg-emerald-100 transition"
                            title="कॉल करें"
                          >
                            <Phone className="w-3 h-3 text-emerald-600 shrink-0" />
                            <span>{off.mobile}</span>
                          </a>
                        )}
                      </div>

                      {isDone ? (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {Object.entries(off.typeBreakdown || {}).map(([type, cnt]) => {
                            if (!cnt) return null;
                            const facInfo = facilityLabels.find(f => f.key === type);
                            return (
                              <span key={type} className="inline-flex items-center gap-1 bg-blue-50 text-blue-800 border border-blue-200 px-1.5 py-0.5 rounded text-[10px] font-semibold">
                                <span>{facInfo ? facInfo.name : type}:</span>
                                <b className="text-blue-900">{cnt}</b>
                              </span>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="flex items-center justify-between text-[11px] text-amber-800 pt-1">
                          <span className="italic">माह {selectedMonth} में निरीक्षण अप्राप्त</span>
                          {off.mobile && (
                            <a 
                              href={`tel:${off.mobile}`}
                              className="text-[10px] bg-amber-200/80 hover:bg-amber-300 text-amber-950 font-bold px-2 py-1 rounded-md transition flex items-center gap-1"
                            >
                              <Phone className="w-3 h-3" />
                              <span>स्मरण हेतु कॉल करें</span>
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Footer info bar */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex flex-col sm:flex-row justify-between items-center gap-2">
          <span>
            समीक्षा माह: <b>{selectedMonth}</b> • विकासखण्ड: <b>{selectedBlock}</b>
          </span>
          <span className="font-semibold text-slate-700">
            पूर्ण: {summary.completedCount} • लंबित: {summary.pendingCount} • कुल: {summary.totalOfficers} नोडल अधिकारी
          </span>
        </div>
      </div>
    </div>
  );
}

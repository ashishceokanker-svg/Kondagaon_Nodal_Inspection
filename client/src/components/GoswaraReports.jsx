import React, { useState, useEffect } from 'react';
import { FileSpreadsheet, Printer, Download, Filter, Eye, Trash2, Calendar, MapPin, Building, Baby, GraduationCap, Wheat, Landmark, Activity, Home, ArrowLeft, MessageSquare, RefreshCw } from 'lucide-react';
import { API } from '../api';
import { DISTRICT_BLOCKS, getPanchayatsForBlock } from '../constants';
import { exportGoswaraToExcelClient } from '../utils/clientExcelExport';


export default function GoswaraReports({ officer, onBack, onSelectInspection }) {
  const isAdmin = officer?.role === 'admin' || officer?.id === 'admin';

  const [goswaraData, setGoswaraData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState('summary'); // 'summary' | 'facility' | 'remarks'
  const [selectedFacilityType, setSelectedFacilityType] = useState('anganwadi');
  const [facilityRecords, setFacilityRecords] = useState([]);
  const [facilityLoading, setFacilityLoading] = useState(false);
  const [allRemarksRecords, setAllRemarksRecords] = useState([]);
  const [allRemarksLoading, setAllRemarksLoading] = useState(false);

  // Filters: Locked to officer unless Admin
  const [filters, setFilters] = useState({
    block: isAdmin ? '' : (officer?.block || ''),
    panchayat: isAdmin ? '' : (officer?.panchayat || (officer?.panchayats?.[0] || '')),
    startDate: '',
    endDate: '',
    officerId: isAdmin ? '' : (officer?.id || '')
  });

  const [masters, setMasters] = useState(null);

  useEffect(() => {
    loadMastersAndData();
  }, []);

  useEffect(() => {
    loadGoswaraData();
  }, [filters]);

  useEffect(() => {
    if (activeSubTab === 'facility') {
      loadFacilityRecords(selectedFacilityType);
    } else if (activeSubTab === 'remarks') {
      loadAllRemarks();
    }
  }, [activeSubTab, selectedFacilityType, filters]);

  const loadMastersAndData = async () => {
    try {
      const m = await API.getMasters();
      setMasters(m);
      await loadGoswaraData();
    } catch (e) {
      console.error(e);
    }
  };

  const loadGoswaraData = async () => {
    setLoading(true);
    try {
      const data = await API.getGoswaraSummary(filters);
      setGoswaraData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadFacilityRecords = async (type) => {
    setFacilityLoading(true);
    try {
      const records = await API.getInspections(type, filters);
      setFacilityRecords(records || []);
    } catch (err) {
      console.error(err);
    } finally {
      setFacilityLoading(false);
    }
  };

  const loadAllRemarks = async () => {
    setAllRemarksLoading(true);
    try {
      const promises = facilities.map(f => API.getInspections(f.key, filters));
      const results = await Promise.all(promises);
      const combined = [];
      results.forEach((records, idx) => {
        const fType = facilities[idx];
        (records || []).forEach(r => {
          combined.push({
            ...r,
            facilityKey: fType.key,
            facilityTypeName: fType.name,
            facilityColor: fType.color,
            facilityIcon: fType.icon,
          });
        });
      });
      // Sort combined by date descending
      combined.sort((a, b) => {
        const dA = new Date(a.date || a.inspectionDate || 0);
        const dB = new Date(b.date || b.inspectionDate || 0);
        return dB - dA;
      });
      setAllRemarksRecords(combined);
    } catch (err) {
      console.error('Error loading all remarks:', err);
    } finally {
      setAllRemarksLoading(false);
    }
  };

  const getRecordTip = (rec) => {
    if (!rec) return '';
    const tip = rec.remarks || rec.inspectionSummary || rec.academicRemarks || rec.complaints || (Array.isArray(rec.academicNotes) ? rec.academicNotes.filter(Boolean).join('; ') : '') || '';
    return typeof tip === 'string' ? tip.trim() : String(tip).trim();
  };

  const getFacilitySiteName = (rec) => {
    return rec.centerName || rec.schoolName || rec.hostelName || rec.shopName || rec.village || rec.beneficiaryName || 'निरीक्षण स्थल';
  };

  const handleDownloadExcel = async () => {
    const exportFilters = {
      ...filters,
      officerId: isAdmin ? (filters.officerId || '') : (officer?.id || '')
    };
    try {
      await exportGoswaraToExcelClient(exportFilters);
    } catch (err) {
      console.warn('Client excel export fallback to server:', err);
      const url = API.getExcelExportUrl(exportFilters);
      window.open(url, '_blank');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDeleteRecord = async (type, id) => {
    if (!confirm('क्या आप इस निरीक्षण प्रविष्टि को हटाना चाहते हैं?')) return;
    try {
      await API.deleteInspection(type, id);
      if (activeSubTab === 'facility') {
        loadFacilityRecords(type);
      } else if (activeSubTab === 'remarks') {
        loadAllRemarks();
      }
      loadGoswaraData();
    } catch (e) {
      alert('हटाने में समस्या आई।');
    }
  };

  const facilities = [
    { key: 'anganwadi', name: 'आंगनबाड़ी केन्द्र', icon: Baby, color: 'text-pink-600 bg-pink-50' },
    { key: 'school', name: 'शाला निरीक्षण', icon: GraduationCap, color: 'text-blue-600 bg-blue-50' },
    { key: 'hostel', name: 'छात्रावास / आश्रम', icon: Building, color: 'text-emerald-600 bg-emerald-50' },
    { key: 'pds', name: 'उचित मूल्य दुकान (PDS)', icon: Wheat, color: 'text-amber-600 bg-amber-50' },
    { key: 'chaupal', name: 'ग्राम चौपाल', icon: Landmark, color: 'text-purple-600 bg-purple-50' },
    { key: 'health', name: 'स्वास्थ्य केन्द्र', icon: Activity, color: 'text-red-600 bg-red-50' },
    { key: 'awas', name: 'प्रधानमंत्री आवास', icon: Home, color: 'text-cyan-600 bg-cyan-50' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6 mb-16">
      
      {/* Header & Controls (Hidden when printing) */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200 no-print space-y-4">
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
                <p className="text-xs text-slate-600 font-medium flex items-center gap-1.5 mt-0.5">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  <span>नोडल अधिकारी निरीक्षण गोसवारा • समेकित प्रतिवेदन</span>
                </p>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={loadGoswaraData}
              className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold py-2.5 px-3 rounded-xl shadow-sm flex items-center gap-1.5 transition"
              title="ताज़ा ऑनलाइन डेटा लोड करें"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">रिफ्रेश</span>
            </button>

            <button
              onClick={handleDownloadExcel}
              className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold py-2.5 px-3.5 rounded-xl shadow-sm flex items-center gap-1.5 transition"
              title="ऑफिशियल मल्टी-शीट एक्सेल डाउनलोड करें"
            >
              <Download className="w-4 h-4" />
              <span>एक्सेल डाउनलोड (.xlsx)</span>
            </button>

            <button
              onClick={handlePrint}
              className="bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold py-2.5 px-3.5 rounded-xl shadow-sm flex items-center gap-1.5 transition"
              title="प्रिंट या पीडीएफ सुरक्षित करें"
            >
              <Printer className="w-4 h-4" />
              <span>प्रिंट / PDF</span>
            </button>
          </div>
        </div>

        {/* Filter bar: Admin controls vs Nodal Officer view */}
        {isAdmin ? (
          <div className="pt-3 border-t border-slate-100 text-xs space-y-2">
            <div className="flex items-center gap-2">
              <span className="bg-amber-100 text-amber-950 border border-amber-300 font-bold px-2 py-0.5 rounded text-[11px]">
                🛡️ एडमिन दृश्य (Admin View)
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">विकासखण्ड (Block)</label>
                <select
                  value={filters.block}
                  onChange={e => setFilters({ ...filters, block: e.target.value, panchayat: '' })}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="">-- सभी विकासखंड --</option>
                  {(masters?.blocks && masters.blocks.length > 0 ? masters.blocks : DISTRICT_BLOCKS).map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">ग्राम पंचायत</label>
                <select
                  value={filters.panchayat}
                  onChange={e => setFilters({ ...filters, panchayat: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="">-- सभी ग्राम पंचायतें --</option>
                  {getPanchayatsForBlock(filters.block).map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">प्रारंभ दिनांक</label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={e => setFilters({ ...filters, startDate: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">समाप्ति दिनांक</label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={e => setFilters({ ...filters, endDate: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="pt-3 border-t border-slate-100 text-xs space-y-2.5">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="bg-blue-700 text-white font-bold px-2 py-0.5 rounded text-[11px]">
                  व्यक्तिगत गोसवारा
                </span>
                <span className="font-semibold text-slate-800">
                  नोडल अधिकारी: <strong className="text-blue-950 font-bold">{officer?.name}</strong> ({officer?.designation})
                </span>
              </div>
              <div className="text-slate-600 text-xs">
                विकासखण्ड: <strong className="text-slate-900">{officer?.block}</strong> • ग्राम पंचायत: <strong className="text-slate-900">{officer?.panchayat || officer?.panchayats?.join(', ')}</strong>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 sm:w-1/2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">प्रारंभ दिनांक से</label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={e => setFilters({ ...filters, startDate: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">समाप्ति दिनांक तक</label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={e => setFilters({ ...filters, endDate: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Printable Report View (Visible during print or on screen) */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6">
        
        {/* Official Letterhead Header for Print */}
        <div className="text-center pb-4 border-b-2 border-slate-800 mb-4 flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-white p-1 border-2 border-amber-400 mb-2 shadow-sm flex items-center justify-center">
            <img src="/cg_logo.svg" alt="छत्तीसगढ़ शासन मोनो" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            कार्यालय कलेक्टर, जिला-कोण्डागांव (छ०ग०)
          </h1>
          <h2 className="text-sm sm:text-base font-bold text-blue-900 mt-0.5">
            नोडल अधिकारियों द्वारा क्षेत्रीय निरीक्षण का मासिक / पाक्षिक गोसवारा प्रतिवेदन
          </h2>
          <p className="text-xs text-slate-600 mt-1 font-medium">
            {isAdmin 
              ? (filters.block ? `विकासखण्ड: ${filters.block}` : 'समस्त विकासखण्ड') 
              : `नोडल अधिकारी: ${officer?.name || ''} (${officer?.designation || ''}) • ग्राम पंचायत: ${officer?.panchayat || officer?.panchayats?.join(', ') || ''} • विकासखण्ड: ${officer?.block || ''}`} • 
            दिनांक: {new Date().toLocaleDateString('hi-IN')}
          </p>
        </div>

        {/* Top Summary Stat Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 mb-6">
          <div className="p-3 rounded-xl border bg-slate-900 text-white text-center">
            <span className="text-[10px] text-slate-300 block font-medium">कुल निरीक्षण</span>
            <span className="text-xl font-black">{goswaraData?.totalInspections || 0}</span>
          </div>

          {facilities.map(f => {
            const rawVal = goswaraData?.typeStats?.[f.key];
            const count = typeof rawVal === 'object' ? (rawVal?.count ?? rawVal?.total ?? 0) : (rawVal || 0);
            return (
              <div key={f.key} className={`p-3 rounded-xl border text-center ${f.color}`}>
                <span className="text-[10px] block font-semibold truncate">{f.name}</span>
                <span className="text-xl font-bold">{count}</span>
              </div>
            );
          })}
        </div>

        {/* Mode Selector Tabs (Hidden in Print) */}
        <div className="flex flex-wrap border-b border-slate-200 mb-4 no-print text-xs font-bold gap-1">
          <button
            onClick={() => setActiveSubTab('summary')}
            className={`py-2 px-3 sm:px-4 border-b-2 transition flex items-center gap-1.5 ${
              activeSubTab === 'summary'
                ? 'border-blue-700 text-blue-800'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>1. ग्राम पंचायतवार समेकित गोसवारा</span>
          </button>
          <button
            onClick={() => setActiveSubTab('facility')}
            className={`py-2 px-3 sm:px-4 border-b-2 transition flex items-center gap-1.5 ${
              activeSubTab === 'facility'
                ? 'border-blue-700 text-blue-800'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Building className="w-4 h-4" />
            <span>2. सुविधावार विस्तृत पंजी</span>
          </button>
          <button
            onClick={() => setActiveSubTab('remarks')}
            className={`py-2 px-3 sm:px-4 border-b-2 transition flex items-center gap-1.5 ${
              activeSubTab === 'remarks'
                ? 'border-amber-600 text-amber-900 bg-amber-50/60'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <MessageSquare className="w-4 h-4 text-amber-700" />
            <span>3. समस्त टीप एवं सुधार निर्देश (All Remarks)</span>
          </button>
        </div>

        {/* VIEW 1: PANCHAYAT GOSWARA TABLE */}
        {activeSubTab === 'summary' && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border border-slate-200">
              <thead className="bg-slate-100 text-slate-800 border-b border-slate-300">
                <tr>
                  <th className="p-2.5 text-center w-10 border-r">क्र.</th>
                  <th className="p-2.5 font-bold border-r">ग्राम पंचायत / स्थल</th>
                  <th className="p-2.5 text-center font-bold bg-blue-50 text-blue-900 border-r">कुल निरीक्षण</th>
                  <th className="p-2 text-center border-r">आंगनबाड़ी</th>
                  <th className="p-2 text-center border-r">शाला</th>
                  <th className="p-2 text-center border-r">छात्रावास</th>
                  <th className="p-2 text-center border-r">राशन दुकान</th>
                  <th className="p-2 text-center border-r">ग्राम चौपाल</th>
                  <th className="p-2 text-center border-r">स्वास्थ्य केन्द्र</th>
                  <th className="p-2 text-center">पीएम आवास</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {goswaraData?.panchayatStats?.length > 0 ? (
                  goswaraData.panchayatStats.map((p, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="p-2 text-center font-semibold text-slate-500 border-r">{idx + 1}</td>
                      <td className="p-2 font-bold text-slate-800 border-r">{p.panchayat}</td>
                      <td className="p-2 text-center font-extrabold bg-blue-50/70 text-blue-900 border-r">{p.total}</td>
                      <td className="p-2 text-center border-r">{p.anganwadi || '-'}</td>
                      <td className="p-2 text-center border-r">{p.school || '-'}</td>
                      <td className="p-2 text-center border-r">{p.hostel || '-'}</td>
                      <td className="p-2 text-center border-r">{p.pds || '-'}</td>
                      <td className="p-2 text-center border-r">{p.chaupal || '-'}</td>
                      <td className="p-2 text-center border-r">{p.health || '-'}</td>
                      <td className="p-2 text-center">{p.awas || '-'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-slate-400">
                      कोई निरीक्षण प्रविष्टि उपलब्ध नहीं है। कृपया फॉर्म भरकर सबमिट करें।
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* VIEW 2: DETAILED FACILITY REGISTER */}
        {activeSubTab === 'facility' && (
          <div className="space-y-4">
            {/* Facility category pills (No print) */}
            <div className="flex flex-wrap gap-2 no-print">
              {facilities.map(f => (
                <button
                  key={f.key}
                  onClick={() => setSelectedFacilityType(f.key)}
                  className={`text-xs px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition ${
                    selectedFacilityType === f.key
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <f.icon className="w-3.5 h-3.5" />
                  <span>{f.name}</span>
                </button>
              ))}
            </div>

            {/* Records List Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border border-slate-200">
                <thead className="bg-slate-100 text-slate-800 border-b border-slate-300">
                  <tr>
                    <th className="p-2.5 text-center w-10 border-r">क्र.</th>
                    <th className="p-2.5 border-r w-24">दिनांक</th>
                    <th className="p-2.5 border-r">संस्था / केन्द्र का नाम</th>
                    <th className="p-2.5 border-r">ग्राम पंचायत / ग्राम</th>
                    <th className="p-2.5 border-r">निरीक्षणकर्ता अधिकारी</th>
                    <th className="p-2.5 border-r text-center w-16">स्थिति</th>
                    <th className="p-2.5 border-r min-w-[280px] bg-amber-50/80 text-amber-950 font-bold">टीप (निरीक्षणकर्ता की विस्तृत टिप्पणी एवं सुधार हेतु निर्देश)</th>
                    <th className="p-2.5 text-center no-print w-20">कार्रवाई</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {facilityRecords.length > 0 ? (
                    facilityRecords.map((rec, idx) => {
                      const tip = getRecordTip(rec);
                      return (
                        <tr key={rec.id || idx} className="hover:bg-slate-50 align-top">
                          <td className="p-2 text-center font-semibold text-slate-500 border-r">{idx + 1}</td>
                          <td className="p-2 font-medium border-r whitespace-nowrap">{rec.date || rec.inspectionDate}</td>
                          <td className="p-2 font-bold text-slate-900 border-r">
                            <div>{getFacilitySiteName(rec)}</div>
                            {rec.latitude && rec.longitude && (
                              <a
                                href={`https://www.google.com/maps?q=${rec.latitude},${rec.longitude}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[10px] text-emerald-700 hover:text-emerald-900 font-medium inline-flex items-center gap-1 mt-0.5"
                              >
                                <MapPin className="w-3 h-3 text-rose-600 shrink-0" />
                                <span>{rec.latitude}, {rec.longitude}</span>
                              </a>
                            )}
                          </td>
                          <td className="p-2 border-r">{rec.panchayat || rec.village || '-'}</td>
                          <td className="p-2 border-r">
                            <span className="font-semibold text-slate-900">{rec.officerName}</span>
                            {rec.officerDesignation && <span className="text-[11px] text-slate-500 block">{rec.officerDesignation}</span>}
                          </td>
                          <td className="p-2 border-r text-center">
                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                              rec.isDraft ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {rec.status || 'पूर्ण'}
                            </span>
                          </td>
                          <td className="p-2 border-r">
                            {tip ? (
                              <div className="bg-amber-50/80 border border-amber-300 text-amber-950 p-2.5 rounded-lg text-xs leading-relaxed whitespace-pre-wrap font-medium">
                                {tip}
                              </div>
                            ) : (
                              <span className="text-[11px] text-slate-400 italic">निरंक (कोई विशेष टीप दर्ज नहीं)</span>
                            )}
                          </td>
                          <td className="p-2 text-center no-print">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => onSelectInspection({ type: selectedFacilityType, record: rec })}
                                className="p-1 text-blue-700 hover:bg-blue-50 rounded"
                                title="विवरण देखें"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteRecord(selectedFacilityType, rec.id)}
                                className="p-1 text-rose-600 hover:bg-rose-50 rounded"
                                title="हटाएं"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400">
                        {facilityLoading ? 'लोड हो रहा है...' : 'इस श्रेणी में कोई निरीक्षण रिकॉर्ड नहीं मिला।'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* VIEW 3: ALL REMARKS & DIRECTIVES REGISTER */}
        {activeSubTab === 'remarks' && (
          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-bold text-amber-950 text-sm flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-amber-700" />
                  <span>समस्त निरीक्षणों की टीप (निरीक्षणकर्ता की विस्तृत टिप्पणी एवं सुधार हेतु निर्देश)</span>
                </h3>
                <p className="text-xs text-amber-800 mt-0.5">
                  सभी 7 श्रेणियों के निरीक्षणों में दर्ज की गई विस्तृत टिप्पणियां एवं सुधार निर्देश का समेकित पंजी
                </p>
              </div>
              <div className="text-xs font-bold text-amber-900 bg-white px-3 py-1 rounded-lg border border-amber-300 shadow-sm self-start sm:self-auto">
                कुल प्रविष्टियां: {allRemarksRecords.length}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border border-slate-200">
                <thead className="bg-slate-100 text-slate-800 border-b border-slate-300">
                  <tr>
                    <th className="p-2.5 text-center w-10 border-r">क्र.</th>
                    <th className="p-2.5 border-r w-24">दिनांक</th>
                    <th className="p-2.5 border-r w-32">संस्था श्रेणी</th>
                    <th className="p-2.5 border-r">संस्था / स्थल का नाम</th>
                    <th className="p-2.5 border-r">विकासखण्ड / ग्राम पंचायत</th>
                    <th className="p-2.5 border-r">निरीक्षणकर्ता अधिकारी</th>
                    <th className="p-2.5 border-r min-w-[320px] bg-amber-50/80 text-amber-950 font-bold">
                      टीप (निरीक्षणकर्ता की विस्तृत टिप्पणी एवं सुधार हेतु निर्देश)
                    </th>
                    <th className="p-2.5 text-center no-print w-20">कार्रवाई</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {allRemarksRecords.length > 0 ? (
                    allRemarksRecords.map((rec, idx) => {
                      const tip = getRecordTip(rec);
                      return (
                        <tr key={rec.id || idx} className="hover:bg-slate-50 align-top">
                          <td className="p-2.5 text-center font-semibold text-slate-500 border-r">{idx + 1}</td>
                          <td className="p-2.5 font-medium border-r whitespace-nowrap">{rec.date || rec.inspectionDate}</td>
                          <td className="p-2.5 border-r">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${rec.facilityColor || 'bg-slate-100 text-slate-700'}`}>
                              {rec.facilityTypeName}
                            </span>
                          </td>
                          <td className="p-2.5 font-bold text-slate-900 border-r">
                            <div>{getFacilitySiteName(rec)}</div>
                            {rec.latitude && rec.longitude && (
                              <a
                                href={`https://www.google.com/maps?q=${rec.latitude},${rec.longitude}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[10px] text-emerald-700 hover:text-emerald-900 font-medium inline-flex items-center gap-1 mt-0.5"
                              >
                                <MapPin className="w-3 h-3 text-rose-600 shrink-0" />
                                <span>{rec.latitude}, {rec.longitude}</span>
                              </a>
                            )}
                          </td>
                          <td className="p-2.5 border-r">
                            <span className="font-semibold text-slate-800">{rec.panchayat || rec.village || '-'}</span>
                            {rec.block && <span className="text-[10px] text-slate-500 block">({rec.block})</span>}
                          </td>
                          <td className="p-2.5 border-r">
                            <span className="font-semibold text-slate-900">{rec.officerName}</span>
                            {rec.officerDesignation && <span className="text-[10px] text-slate-500 block">{rec.officerDesignation}</span>}
                          </td>
                          <td className="p-2.5 border-r">
                            {tip ? (
                              <div className="bg-amber-50/80 border border-amber-300 text-amber-950 p-2.5 rounded-lg text-xs leading-relaxed whitespace-pre-wrap font-medium">
                                {tip}
                              </div>
                            ) : (
                              <span className="text-[11px] text-slate-400 italic">निरंक (कोई विशेष टीप दर्ज नहीं)</span>
                            )}
                          </td>
                          <td className="p-2.5 text-center no-print">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => onSelectInspection({ type: rec.facilityKey, record: rec })}
                                className="p-1 text-blue-700 hover:bg-blue-50 rounded"
                                title="विवरण देखें"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteRecord(rec.facilityKey, rec.id)}
                                className="p-1 text-rose-600 hover:bg-rose-50 rounded"
                                title="हटाएं"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400">
                        {allRemarksLoading ? 'लोड हो रहा है...' : 'कोई निरीक्षण रिकॉर्ड उपलब्ध नहीं है।'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

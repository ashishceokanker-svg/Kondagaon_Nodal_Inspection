import React, { useState, useEffect } from 'react';
import { FileSpreadsheet, Printer, Download, Filter, Eye, Trash2, Calendar, MapPin, Building, Baby, GraduationCap, Wheat, Landmark, Activity, Home, ArrowLeft, MessageSquare, RefreshCw, HardHat } from 'lucide-react';
import { API } from '../api';
import { DISTRICT_BLOCKS, getPanchayatsForBlock, getTodayDateString, getOfficerPanchayats, matchBlock, getBlockForPanchayat, MONTHS_LIST } from '../constants';
import { exportGoswaraToExcelClient } from '../utils/clientExcelExport';


export default function GoswaraReports({ officer, onBack, onSelectInspection }) {
  const isAdmin = officer?.role === 'admin' || officer?.id === 'admin';
  const officerPanchayats = getOfficerPanchayats(officer);

  const [goswaraData, setGoswaraData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState('summary'); // 'summary' | 'facility' | 'remarks'
  const [selectedFacilityType, setSelectedFacilityType] = useState('anganwadi');
  const [facilityRecords, setFacilityRecords] = useState([]);
  const [facilityLoading, setFacilityLoading] = useState(false);
  const [allRemarksRecords, setAllRemarksRecords] = useState([]);
  const [allRemarksLoading, setAllRemarksLoading] = useState(false);

  // Filters: Locked to officer unless Admin
  const [filters, setFilters] = useState(() => {
    if (isAdmin) {
      return {
        block: '',
        panchayat: '',
        month: 'सितम्बर 2026',
        officerId: ''
      };
    } else {
      return {
        block: officer?.block || '',
        panchayat: officerPanchayats.length === 1 ? officerPanchayats[0] : '',
        panchayats: officerPanchayats,
        month: 'सितम्बर 2026',
        officerId: officer?.id || ''
      };
    }
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
    let tip = rec.remarks || rec.inspectionSummary || rec.academicRemarks || rec.complaints || (Array.isArray(rec.academicNotes) ? rec.academicNotes.filter(Boolean).join('; ') : '') || '';
    if (rec.nrcRemarks) {
      const nrcInfo = `[NRC: दर्ज बच्चे ${rec.nrcChildrenCount || 0} - ${rec.nrcRemarks}]`;
      tip = tip ? `${tip}\n${nrcInfo}` : nrcInfo;
    }
    return typeof tip === 'string' ? tip.trim() : String(tip).trim();
  };

  const getFacilitySiteName = (rec) => {
    return rec.workName 
      ? `${rec.workName}${rec.sanctionCost ? ` (₹${rec.sanctionCost} लाख)` : ''}` 
      : (rec.centerName || rec.schoolName || rec.hostelName || rec.shopName || rec.village || rec.beneficiaryName || 'निरीक्षण स्थल');
  };

  const handleDownloadExcel = async () => {
    const exportFilters = {
      ...filters,
      officerId: isAdmin ? (filters.officerId || '') : (officer?.id || ''),
      panchayats: isAdmin ? null : (filters.panchayat ? [filters.panchayat] : officerPanchayats)
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
    { key: 'nirman', name: 'निर्माण कार्य', icon: HardHat, color: 'text-amber-800 bg-amber-50' },
  ];

  // Compute strictly officer's assigned panchayat(s) or filtered block/panchayat
  const displayedPanchayatStats = React.useMemo(() => {
    let list = goswaraData?.panchayatStats || [];

    // 1. If block filter is selected, strictly filter to that block
    if (filters.block && filters.block !== 'सभी विकासखण्ड' && filters.block !== 'समस्त विकासखण्ड') {
      list = list.filter(p => {
        const blk = p.block || getBlockForPanchayat(p.panchayat);
        return matchBlock(blk, filters.block);
      });
    }

    // 2. If specific panchayat filter is selected, filter to that panchayat
    if (filters.panchayat && filters.panchayat !== 'सभी ग्राम पंचायतें' && filters.panchayat !== 'समस्त पंचायतें') {
      list = list.filter(p => p.panchayat === filters.panchayat);
    }

    if (isAdmin) return list;

    const allowed = filters.panchayat ? [filters.panchayat] : officerPanchayats;
    if (allowed.length === 0) return list;

    const filtered = list.filter(p => allowed.includes(p.panchayat));

    // If any allowed panchayat doesn't have inspection yet, still show it in table with 0s
    allowed.forEach(pName => {
      if (!filtered.some(f => f.panchayat === pName)) {
        filtered.push({
          panchayat: pName,
          block: officer?.block || getBlockForPanchayat(pName),
          total: 0,
          anganwadi: 0,
          school: 0,
          hostel: 0,
          pds: 0,
          chaupal: 0,
          health: 0,
          awas: 0,
          nirman: 0
        });
      }
    });
    return filtered;
  }, [goswaraData?.panchayatStats, isAdmin, filters.block, filters.panchayat, officerPanchayats, officer?.block]);

  const { displayedTotalInspections, displayedTypeStats } = React.useMemo(() => {
    if (isAdmin && !filters.block && !filters.panchayat) {
      const ts = {};
      facilities.forEach(f => {
        const raw = goswaraData?.typeStats?.[f.key];
        ts[f.key] = typeof raw === 'object' ? (raw?.count ?? raw?.total ?? 0) : (raw || 0);
      });
      return {
        displayedTotalInspections: goswaraData?.totalInspections || 0,
        displayedTypeStats: ts
      };
    }

    let total = 0;
    const ts = { anganwadi: 0, school: 0, hostel: 0, pds: 0, chaupal: 0, health: 0, awas: 0, nirman: 0 };
    displayedPanchayatStats.forEach(p => {
      total += (Number(p.total) || 0);
      facilities.forEach(f => {
        ts[f.key] = (ts[f.key] || 0) + (Number(p[f.key]) || 0);
      });
    });
    return {
      displayedTotalInspections: total,
      displayedTypeStats: ts
    };
  }, [isAdmin, goswaraData, displayedPanchayatStats, filters.block, filters.panchayat]);

  const displayedFacilityRecords = React.useMemo(() => {
    if (isAdmin) return facilityRecords;
    const allowed = filters.panchayat ? [filters.panchayat] : officerPanchayats;
    if (allowed.length === 0) return facilityRecords;
    return facilityRecords.filter(r => allowed.includes(r.panchayat));
  }, [isAdmin, facilityRecords, filters.panchayat, officerPanchayats]);

  const displayedRemarksRecords = React.useMemo(() => {
    if (isAdmin) return allRemarksRecords;
    const allowed = filters.panchayat ? [filters.panchayat] : officerPanchayats;
    if (allowed.length === 0) return allRemarksRecords;
    return allRemarksRecords.filter(r => allowed.includes(r.panchayat));
  }, [isAdmin, allRemarksRecords, filters.panchayat, officerPanchayats]);

  const dateRangeDisplay = React.useMemo(() => {
    if (filters.month) {
      return `${filters.month} (आज दिनांक: ${new Date().toLocaleDateString('hi-IN')})`;
    }
    if (filters.startDate && filters.endDate) {
      return `${filters.startDate} से ${filters.endDate}`;
    }
    if (filters.startDate) {
      return `${filters.startDate} से आज तक`;
    }
    if (filters.endDate) {
      return `प्रारंभ से ${filters.endDate}`;
    }
    return new Date().toLocaleDateString('hi-IN');
  }, [filters.month, filters.startDate, filters.endDate]);

  const groupedPanchayatStats = React.useMemo(() => {
    const list = displayedPanchayatStats || [];
    if (filters.block && filters.block !== 'सभी विकासखण्ड' && filters.block !== 'समस्त विकासखण्ड') {
      const blockPanchayats = list.filter(p => {
        const pBlock = p.block || getBlockForPanchayat(p.panchayat);
        return matchBlock(pBlock, filters.block);
      });
      return [{
        blockName: filters.block,
        panchayats: blockPanchayats.length > 0 ? blockPanchayats : list
      }];
    }

    const BLOCKS = ['फरसगांव', 'बड़ेराजपुर', 'केशकाल', 'कोण्डागांव', 'माकड़ी'];
    const groups = [];
    const usedPanchayats = new Set();

    BLOCKS.forEach(bName => {
      const pList = list.filter(p => {
        const pBlock = p.block || getBlockForPanchayat(p.panchayat);
        return matchBlock(pBlock, bName);
      });
      pList.forEach(p => usedPanchayats.add(p.panchayat));
      if (pList.length > 0) {
        groups.push({
          blockName: bName,
          panchayats: pList
        });
      }
    });

    const remaining = list.filter(p => !usedPanchayats.has(p.panchayat));
    if (remaining.length > 0) {
      groups.push({
        blockName: 'अन्य / सामान्य',
        panchayats: remaining
      });
    }

    return groups.length > 0 ? groups : [{ blockName: 'समस्त विकासखण्ड', panchayats: list }];
  }, [displayedPanchayatStats, filters.block]);

  const grandTotals = React.useMemo(() => {
    const list = displayedPanchayatStats || [];
    return {
      total: list.reduce((s, p) => s + (Number(p.total) || 0), 0),
      anganwadi: list.reduce((s, p) => s + (Number(p.anganwadi) || 0), 0),
      school: list.reduce((s, p) => s + (Number(p.school) || 0), 0),
      hostel: list.reduce((s, p) => s + (Number(p.hostel) || 0), 0),
      pds: list.reduce((s, p) => s + (Number(p.pds) || 0), 0),
      chaupal: list.reduce((s, p) => s + (Number(p.chaupal) || 0), 0),
      health: list.reduce((s, p) => s + (Number(p.health) || 0), 0),
      awas: list.reduce((s, p) => s + (Number(p.awas) || 0), 0),
      nirman: list.reduce((s, p) => s + (Number(p.nirman) || 0), 0),
    };
  }, [displayedPanchayatStats]);

  return (
    <div className="max-w-6xl mx-auto space-y-6 mb-16">
      
      {/* Header & Controls (Hidden when printing) */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl shadow-sm border border-slate-200 no-print">
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={onBack}
            className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 transition shrink-0"
            title="वापस डैशबोर्ड"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex-1 text-center px-2">
            <h1 className="text-base sm:text-lg md:text-xl font-black text-slate-900 tracking-tight leading-tight">
              नोडल अधिकारियों द्वारा क्षेत्रीय निरीक्षण का मासिक / पाक्षिक गोसवारा प्रतिवेदन
            </h1>
            <p className="text-[11px] sm:text-xs text-slate-600 font-semibold mt-0.5">
              जिला कोण्डागांव (छ०ग०) • नोडल अधिकारियों द्वारा मासिक निरीक्षण एवं अनुपालन स्थिति
            </p>
          </div>

          <button
            onClick={loadGoswaraData}
            className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold py-2 px-3 rounded-xl shadow-sm flex items-center gap-1.5 transition shrink-0"
            title="ताज़ा ऑनलाइन डेटा लोड करें"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">रिफ्रेश</span>
          </button>
        </div>
      </div>

      {/* Top Summary Stat Badges (Hidden in Print/PDF) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-2 no-print">
        <div className="p-3 rounded-2xl border bg-slate-900 text-white text-center shadow-sm">
          <span className="text-[11px] text-slate-300 block font-medium">कुल निरीक्षण</span>
          <span className="text-xl sm:text-2xl font-black">{displayedTotalInspections}</span>
        </div>

        {facilities.map(f => {
          const count = displayedTypeStats[f.key] || 0;
          return (
            <div key={f.key} className={`p-3 rounded-2xl border text-center shadow-sm ${f.color}`}>
              <span className="text-[11px] block font-bold truncate">{f.name}</span>
              <span className="text-xl sm:text-2xl font-black">{count}</span>
            </div>
          );
        })}
      </div>

      {/* Search & Filter Options (Directly Under Summary Badges) */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-200 no-print space-y-3">
        {isAdmin ? (
          <div className="text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="bg-amber-100 text-amber-950 border border-amber-300 font-bold px-2 py-0.5 rounded text-[11px] flex items-center gap-1.5">
                <span>🛡️ एडमिन खोज एवं फ़िल्टर (Search Options)</span>
              </span>
              {(filters.block || filters.panchayat || (filters.month && filters.month !== 'सितम्बर 2026')) && (
                <button
                  onClick={() => setFilters({ ...filters, block: '', panchayat: '', month: 'सितम्बर 2026' })}
                  className="text-xs text-rose-600 hover:underline font-bold"
                >
                  फ़िल्टर रीसेट करें
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">माह का चयन करें (Month Filter)</label>
                <select
                  value={filters.month || ''}
                  onChange={e => setFilters({ ...filters, month: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl bg-white text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="">-- समस्त माह (All Months) --</option>
                  {MONTHS_LIST.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">विकासखण्ड (Block)</label>
                <select
                  value={filters.block}
                  onChange={e => setFilters({ ...filters, block: e.target.value, panchayat: '' })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl bg-white text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="">-- सभी विकासखंड --</option>
                  {(masters?.blocks && masters.blocks.length > 0 ? masters.blocks : DISTRICT_BLOCKS).map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">ग्राम पंचायत</label>
                <select
                  value={filters.panchayat}
                  onChange={e => setFilters({ ...filters, panchayat: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl bg-white text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="">-- सभी ग्राम पंचायतें --</option>
                  {getPanchayatsForBlock(filters.block).map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-xs space-y-2.5">
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
                विकासखण्ड: <strong className="text-slate-900">{officer?.block}</strong> • आवंटित ग्राम पंचायत: <strong className="text-slate-900">{officerPanchayats.join(', ') || officer?.panchayat}</strong>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">माह का चयन करें (Month Filter)</label>
                <select
                  value={filters.month || ''}
                  onChange={e => setFilters({ ...filters, month: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl bg-white text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="">-- समस्त माह (All Months) --</option>
                  {MONTHS_LIST.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              {officerPanchayats.length > 1 && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">आवंटित ग्राम पंचायत चुनें</label>
                  <select
                    value={filters.panchayat}
                    onChange={e => {
                      const val = e.target.value;
                      setFilters({
                        ...filters,
                        panchayat: val,
                        panchayats: val ? [val] : officerPanchayats
                      });
                    }}
                    className="w-full p-2.5 border border-slate-300 rounded-xl bg-white text-xs font-semibold"
                  >
                    <option value="">-- समस्त आवंटित पंचायतें ({officerPanchayats.length}) --</option>
                    {officerPanchayats.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Landscape Print Styles */}
      <style>{`
        @media print {
          @page {
            size: landscape;
            margin: 8mm 6mm;
          }
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            background: white !important;
          }
          .no-print, header, nav {
            display: none !important;
          }
          .printable-report-card {
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
            max-width: 100% !important;
          }
          table {
            page-break-inside: auto;
            width: 100% !important;
            border-collapse: collapse !important;
          }
          thead {
            display: table-header-group;
          }
          tfoot {
            display: table-footer-group;
          }
          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
          th, td {
            font-size: 11px !important;
            padding: 4px 6px !important;
          }
        }
      `}</style>

      {/* Printable Report View (Visible during print or on screen) */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6 printable-report-card">
        
        {/* Web View: Only show 'ग्राम पंचायतवार समेकित गोसवारा' pill */}
        <div className="no-print flex justify-center mb-4">
          <span className="inline-block bg-blue-900 text-white text-xs sm:text-sm font-extrabold px-5 py-1.5 rounded-full uppercase tracking-wider shadow-sm">
            ग्राम पंचायतवार समेकित गोसवारा
          </span>
        </div>

        {/* Print / PDF Only: Full Official Header */}
        <div className="hidden print:flex flex-col items-center justify-center text-center pb-3 border-b-2 border-black mb-4 space-y-1">
          <div className="w-16 h-16 mb-1 flex items-center justify-center">
            <img 
              src="/cg_logo.svg" 
              alt="छत्तीसगढ़ शासन" 
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">
            कार्यालय कलेक्टर, जिला-कोण्डागांव (छत्तीसगढ़)
          </h1>
          <h2 className="text-base font-bold text-blue-950">
            नोडल अधिकारियों द्वारा क्षेत्रीय निरीक्षण का मासिक / पाक्षिक गोसवारा प्रतिवेदन
          </h2>
          <p className="text-xs font-bold text-slate-700">
            {filters.block && filters.block !== 'सभी विकासखण्ड' && filters.block !== 'समस्त विकासखण्ड'
              ? `विकासखण्ड: ${filters.block}` 
              : 'समस्त विकासखण्ड'}
            {filters.panchayat ? ` • ग्राम पंचायत: ${filters.panchayat}` : ''}
            {' • '}
            <span>{dateRangeDisplay}</span>
          </p>
          <div className="pt-1">
            <span className="inline-block bg-blue-900 text-white text-xs font-extrabold px-4 py-1 rounded-full uppercase tracking-wider">
              {filters.block && filters.block !== 'सभी विकासखण्ड' && filters.block !== 'समस्त विकासखण्ड'
                ? `ग्राम पंचायतवार समेकित गोसवारा (विकासखण्ड: ${filters.block})`
                : 'ग्राम पंचायतवार समेकित गोसवारा (समस्त विकासखण्ड)'}
            </span>
          </div>
        </div>

        {/* Mode Selector Tabs & Action Buttons (Hidden in Print) */}
        <div className="flex flex-wrap items-center justify-between border-b border-slate-200 mb-4 pb-1 no-print gap-2">
          <div className="flex flex-wrap items-center gap-1 text-xs font-bold">
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

          {/* Action buttons beside All Remarks */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadExcel}
              className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold py-1.5 px-3 rounded-xl shadow-sm flex items-center gap-1.5 transition"
              title="ऑफिशियल मल्टी-शीट एक्सेल डाउनलोड करें"
            >
              <Download className="w-3.5 h-3.5" />
              <span>एक्सेल डाउनलोड (.xlsx)</span>
            </button>

            <button
              onClick={handlePrint}
              className="bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold py-1.5 px-3 rounded-xl shadow-sm flex items-center gap-1.5 transition"
              title="प्रिंट या पीडीएफ सुरक्षित करें"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>प्रिंट / PDF</span>
            </button>
          </div>
        </div>

        {/* VIEW 1: PANCHAYAT GOSWARA TABLE */}
        {activeSubTab === 'summary' && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border border-slate-300">
              <thead className="bg-slate-100 text-slate-900 border-b-2 border-slate-400">
                <tr>
                  <th className="p-2.5 text-center w-10 border-r border-slate-300">क्र.</th>
                  <th className="p-2.5 font-bold border-r border-slate-300 min-w-[140px]">ग्राम पंचायत / स्थल</th>
                  <th className="p-2.5 text-center font-black bg-blue-100/80 text-blue-950 border-r border-slate-300">कुल निरीक्षण</th>
                  <th className="p-2 text-center border-r border-slate-300 text-pink-700 font-bold">आंगनबाड़ी</th>
                  <th className="p-2 text-center border-r border-slate-300 text-blue-700 font-bold">शाला</th>
                  <th className="p-2 text-center border-r border-slate-300 text-emerald-700 font-bold">छात्रावास</th>
                  <th className="p-2 text-center border-r border-slate-300 text-amber-700 font-bold">राशन दुकान</th>
                  <th className="p-2 text-center border-r border-slate-300 text-purple-700 font-bold">ग्राम चौपाल</th>
                  <th className="p-2 text-center border-r border-slate-300 text-red-700 font-bold">स्वास्थ्य केन्द्र</th>
                  <th className="p-2 text-center border-r border-slate-300 text-cyan-700 font-bold">पीएम आवास</th>
                  <th className="p-2 text-center text-amber-900 font-bold">निर्माण कार्य</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {groupedPanchayatStats && groupedPanchayatStats.length > 0 ? (
                  groupedPanchayatStats.map((grp, gIdx) => {
                    const blockTotal = {
                      total: grp.panchayats.reduce((s, p) => s + (Number(p.total) || 0), 0),
                      anganwadi: grp.panchayats.reduce((s, p) => s + (Number(p.anganwadi) || 0), 0),
                      school: grp.panchayats.reduce((s, p) => s + (Number(p.school) || 0), 0),
                      hostel: grp.panchayats.reduce((s, p) => s + (Number(p.hostel) || 0), 0),
                      pds: grp.panchayats.reduce((s, p) => s + (Number(p.pds) || 0), 0),
                      chaupal: grp.panchayats.reduce((s, p) => s + (Number(p.chaupal) || 0), 0),
                      health: grp.panchayats.reduce((s, p) => s + (Number(p.health) || 0), 0),
                      awas: grp.panchayats.reduce((s, p) => s + (Number(p.awas) || 0), 0),
                      nirman: grp.panchayats.reduce((s, p) => s + (Number(p.nirman) || 0), 0),
                    };

                    return (
                      <React.Fragment key={gIdx}>
                        {/* Block Section Header */}
                        <tr className="bg-slate-200 text-slate-900 font-black border-y-2 border-slate-400">
                          <td colSpan={11} className="p-2 px-3 text-xs sm:text-sm tracking-wide">
                            📍 विकासखण्ड: <span className="text-blue-900">{grp.blockName}</span> ({grp.panchayats.length} ग्राम पंचायतें)
                          </td>
                        </tr>

                        {grp.panchayats.map((p, pIdx) => (
                          <tr key={pIdx} className="hover:bg-slate-50">
                            <td className="p-2 text-center font-semibold text-slate-500 border-r border-slate-200">{pIdx + 1}</td>
                            <td className="p-2 font-bold text-slate-800 border-r border-slate-200">{p.panchayat}</td>
                            <td className="p-2 text-center font-black bg-blue-50/70 text-blue-900 border-r border-slate-200">{p.total}</td>
                            <td className="p-2 text-center border-r border-slate-200">{p.anganwadi || '-'}</td>
                            <td className="p-2 text-center border-r border-slate-200">{p.school || '-'}</td>
                            <td className="p-2 text-center border-r border-slate-200">{p.hostel || '-'}</td>
                            <td className="p-2 text-center border-r border-slate-200">{p.pds || '-'}</td>
                            <td className="p-2 text-center border-r border-slate-200">{p.chaupal || '-'}</td>
                            <td className="p-2 text-center border-r border-slate-200">{p.health || '-'}</td>
                            <td className="p-2 text-center border-r border-slate-200">{p.awas || '-'}</td>
                            <td className="p-2 text-center font-bold text-amber-900">{p.nirman || '-'}</td>
                          </tr>
                        ))}

                        {/* Block Subtotal row */}
                        <tr className="bg-blue-50/70 font-extrabold text-blue-950 border-b-2 border-slate-300">
                          <td colSpan={2} className="p-2 text-right pr-4">योग (विकासखण्ड {grp.blockName}):</td>
                          <td className="p-2 text-center bg-blue-100 font-black">{blockTotal.total}</td>
                          <td className="p-2 text-center">{blockTotal.anganwadi}</td>
                          <td className="p-2 text-center">{blockTotal.school}</td>
                          <td className="p-2 text-center">{blockTotal.hostel}</td>
                          <td className="p-2 text-center">{blockTotal.pds}</td>
                          <td className="p-2 text-center">{blockTotal.chaupal}</td>
                          <td className="p-2 text-center">{blockTotal.health}</td>
                          <td className="p-2 text-center">{blockTotal.awas}</td>
                          <td className="p-2 text-center text-amber-900">{blockTotal.nirman}</td>
                        </tr>
                      </React.Fragment>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={11} className="p-8 text-center text-slate-400">
                      कोई निरीक्षण प्रविष्टि उपलब्ध नहीं है। कृपया फ़िल्टर जांचें या फॉर्म भरकर सबमिट करें।
                    </td>
                  </tr>
                )}

                {/* Grand Total Row across all blocks */}
                {displayedPanchayatStats && displayedPanchayatStats.length > 0 && (
                  <tr className="bg-slate-900 text-white font-black text-xs sm:text-sm border-t-2 border-slate-900">
                    <td colSpan={2} className="p-2.5 text-center">
                      महायोग ({filters.block && filters.block !== 'सभी विकासखण्ड' && filters.block !== 'समस्त विकासखण्ड' ? `विकासखण्ड ${filters.block}` : 'समस्त विकासखण्ड'})
                    </td>
                    <td className="p-2.5 text-center bg-blue-700 text-white font-black text-sm">{grandTotals.total}</td>
                    <td className="p-2.5 text-center text-pink-200">{grandTotals.anganwadi}</td>
                    <td className="p-2.5 text-center text-blue-200">{grandTotals.school}</td>
                    <td className="p-2.5 text-center text-emerald-200">{grandTotals.hostel}</td>
                    <td className="p-2.5 text-center text-amber-200">{grandTotals.pds}</td>
                    <td className="p-2.5 text-center text-purple-200">{grandTotals.chaupal}</td>
                    <td className="p-2.5 text-center text-red-200">{grandTotals.health}</td>
                    <td className="p-2.5 text-center text-cyan-200">{grandTotals.awas}</td>
                    <td className="p-2.5 text-center text-amber-300">{grandTotals.nirman}</td>
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
                  {displayedFacilityRecords.length > 0 ? (
                    displayedFacilityRecords.map((rec, idx) => {
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
                  सभी 8 श्रेणियों के निरीक्षणों में दर्ज की गई विस्तृत टिप्पणियां एवं सुधार निर्देश का समेकित पंजी
                </p>
              </div>
              <div className="text-xs font-bold text-amber-900 bg-white px-3 py-1 rounded-lg border border-amber-300 shadow-sm self-start sm:self-auto">
                कुल प्रविष्टियां: {displayedRemarksRecords.length}
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
                  {displayedRemarksRecords.length > 0 ? (
                    displayedRemarksRecords.map((rec, idx) => {
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

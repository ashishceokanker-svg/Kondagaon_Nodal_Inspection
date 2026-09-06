import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, UserPlus, Search, Edit3, Trash2, X, Check, AlertTriangle, 
  ArrowLeft, Phone, MapPin, Building, Shield, RefreshCw, Filter, CheckCircle2
} from 'lucide-react';
import { API } from '../api';
import { DISTRICT_BLOCKS, getPanchayatsForBlock, matchBlock } from '../constants';

export default function AdminOfficerManagement({ officer, onBack }) {
  const [officers, setOfficers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBlock, setSelectedBlock] = useState('सभी विकासखण्ड');

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [currentOfficer, setCurrentOfficer] = useState(null);
  const [deleteConfirmOfficer, setDeleteConfirmOfficer] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [notification, setNotification] = useState(null);

  // Form fields
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    designation: '',
    mobile: '',
    block: DISTRICT_BLOCKS[0],
    panchayat: '',
    district: 'कोण्डागांव'
  });

  useEffect(() => {
    loadOfficers();
  }, []);

  const showNotify = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  const loadOfficers = async () => {
    setLoading(true);
    try {
      const list = await API.getOfficers();
      setOfficers(list || []);
    } catch (err) {
      console.error('Failed to load officers:', err);
      showNotify('अधिकारियों की सूची लोड करने में समस्या आई।', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Open Add Modal
  const handleOpenAdd = () => {
    const initialBlock = selectedBlock !== 'सभी विकासखण्ड' ? selectedBlock : DISTRICT_BLOCKS[0];
    const panchayats = getPanchayatsForBlock(initialBlock);
    setFormData({
      id: '',
      name: '',
      designation: '',
      mobile: '',
      block: initialBlock,
      panchayat: panchayats[0] || '',
      district: 'कोण्डागांव'
    });
    setModalMode('add');
    setCurrentOfficer(null);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (off) => {
    const matchedPanchayat = off.panchayat || (off.panchayats && off.panchayats[0]) || '';
    setFormData({
      id: off.id,
      name: off.name || '',
      designation: off.designation || '',
      mobile: off.mobile || '',
      block: off.block || DISTRICT_BLOCKS[0],
      panchayat: matchedPanchayat,
      district: off.district || 'कोण्डागांव'
    });
    setModalMode('edit');
    setCurrentOfficer(off);
    setIsModalOpen(true);
  };

  // Handle Block Change in Form (updates available panchayats)
  const handleFormBlockChange = (newBlock) => {
    const panchayats = getPanchayatsForBlock(newBlock);
    setFormData(prev => ({
      ...prev,
      block: newBlock,
      panchayat: panchayats[0] || ''
    }));
  };

  // Submit Save or Update
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('कृपया अधिकारी का नाम दर्ज करें।');
      return;
    }
    if (!formData.designation.trim()) {
      alert('कृपया पदनाम दर्ज करें।');
      return;
    }
    const cleanMobile = formData.mobile.trim();
    if (!/^\d{10}$/.test(cleanMobile)) {
      alert('कृपया मान्य 10 अंकों का मोबाइल नंबर दर्ज करें। यह नंबर अधिकारी का पासवर्ड भी होगा।');
      return;
    }
    if (!formData.panchayat.trim()) {
      alert('कृपया आवंटित ग्राम पंचायत का चयन करें।');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...formData,
        mobile: cleanMobile,
        panchayats: [formData.panchayat.trim()]
      };

      const res = await API.saveOfficer(payload);
      if (res.success || res.officer) {
        showNotify(modalMode === 'add' ? 'नया नोडल अधिकारी सफलतापूर्वक जोड़ा गया!' : 'अधिकारी का विवरण सफलतापूर्वक अपडेट किया गया!');
        setIsModalOpen(false);
        await loadOfficers();
      } else {
        alert(res.message || 'अधिकारी सुरक्षित करने में त्रुटि हुई।');
      }
    } catch (err) {
      console.error('Error saving officer:', err);
      alert('सर्वर एरर: अधिकारी सुरक्षित नहीं हो सका।');
    } finally {
      setSaving(false);
    }
  };

  // Confirm Delete
  const handleDeleteOfficer = async () => {
    if (!deleteConfirmOfficer) return;
    setDeleting(true);
    try {
      const res = await API.deleteOfficer(deleteConfirmOfficer.id);
      if (res.success) {
        showNotify(`अधिकारी "${deleteConfirmOfficer.name}" को सफलतापूर्वक हटा दिया गया।`);
        setDeleteConfirmOfficer(null);
        await loadOfficers();
      } else {
        alert(res.message || 'अधिकारी को हटाया नहीं जा सका।');
      }
    } catch (err) {
      console.error('Error deleting officer:', err);
      alert('अधिकारी हटाने में त्रुटि हुई।');
    } finally {
      setDeleting(false);
    }
  };

  // Filtered officers list
  const filteredOfficers = useMemo(() => {
    return officers.filter(off => {
      // 1. Block filter
      if (selectedBlock !== 'सभी विकासखण्ड' && !matchBlock(off.block, selectedBlock)) {
        return false;
      }
      // 2. Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const name = (off.name || '').toLowerCase();
        const desig = (off.designation || '').toLowerCase();
        const mobile = (off.mobile || '').toLowerCase();
        const panchayat = (off.panchayat || (off.panchayats || []).join(' ')).toLowerCase();
        const block = (off.block || '').toLowerCase();
        return name.includes(q) || desig.includes(q) || mobile.includes(q) || panchayat.includes(q) || block.includes(q);
      }
      return true;
    });
  }, [officers, selectedBlock, searchQuery]);

  // Block wise counts for summary
  const blockCounts = useMemo(() => {
    const counts = {};
    DISTRICT_BLOCKS.forEach(b => counts[b] = 0);
    officers.forEach(o => {
      for (const b of DISTRICT_BLOCKS) {
        if (matchBlock(o.block, b)) {
          counts[b] = (counts[b] || 0) + 1;
          break;
        }
      }
    });
    return counts;
  }, [officers]);

  return (
    <div className="space-y-5 pb-10">
      
      {/* Top Banner & Action Header */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-5 rounded-2xl shadow-lg border border-slate-700/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <button
              onClick={onBack}
              className="inline-flex items-center gap-1.5 text-xs text-blue-200 hover:text-white mb-2 transition"
            >
              <ArrowLeft className="w-4 h-4" /> डैशबोर्ड पर वापस जाएं
            </button>
            <div className="flex items-center gap-2">
              <span className="text-[11px] bg-amber-400 text-slate-950 font-black px-2 py-0.5 rounded">
                ADMIN PANEL
              </span>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                <Users className="w-6 h-6 text-amber-400" />
                नोडल अधिकारी प्रबंधन (Officer Directory)
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-blue-200">
              जिले के नोडल अधिकारियों की सूची देखें, नया अधिकारी जोड़ें, विवरण संशोधित करें या हटाएं।
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
            <button
              onClick={handleOpenAdd}
              className="bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-md flex items-center gap-2 transition active:scale-95"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ नया अधिकारी जोड़ें</span>
            </button>
            <button
              onClick={loadOfficers}
              className="bg-white/10 hover:bg-white/20 text-white text-xs px-3 py-2.5 rounded-xl border border-white/20 flex items-center gap-1.5 transition"
              title="रिफ्रेश करें"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">रिफ्रेश</span>
            </button>
          </div>
        </div>

        {/* Quick Block Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 mt-5 pt-4 border-t border-white/10 text-xs">
          <div 
            onClick={() => setSelectedBlock('सभी विकासखण्ड')}
            className={`p-2.5 rounded-xl cursor-pointer transition text-center ${
              selectedBlock === 'सभी विकासखण्ड' ? 'bg-amber-400 text-slate-950 font-bold' : 'bg-white/5 hover:bg-white/10 text-white'
            }`}
          >
            <span className="text-[10px] block opacity-80">कुल नोडल अधिकारी</span>
            <span className="text-lg font-black">{officers.length}</span>
          </div>

          {DISTRICT_BLOCKS.map(blockName => (
            <div
              key={blockName}
              onClick={() => setSelectedBlock(blockName)}
              className={`p-2.5 rounded-xl cursor-pointer transition text-center ${
                selectedBlock === blockName ? 'bg-amber-400 text-slate-950 font-bold' : 'bg-white/5 hover:bg-white/10 text-white'
              }`}
            >
              <span className="text-[10px] block opacity-80 truncate">{blockName}</span>
              <span className="text-base font-bold">{blockCounts[blockName] || 0}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 shadow transition ${
          notification.type === 'error' ? 'bg-red-500 text-white' : 'bg-emerald-600 text-white'
        }`}>
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{notification.msg}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="नाम, पद, मोबाइल, ग्राम पंचायत से खोजें..."
            className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-500 shrink-0" />
          <span className="text-xs font-semibold text-slate-700 shrink-0">विकासखण्ड:</span>
          <select
            value={selectedBlock}
            onChange={(e) => setSelectedBlock(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-xs rounded-xl px-3 py-2 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-auto"
          >
            <option value="सभी विकासखण्ड">सभी विकासखण्ड (All Blocks)</option>
            {DISTRICT_BLOCKS.map(b => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
          <span className="text-[11px] text-slate-500 shrink-0 bg-slate-100 px-2.5 py-1.5 rounded-xl font-bold">
            दिख रहे: {filteredOfficers.length}
          </span>
        </div>
      </div>

      {/* Officers List / Table */}
      {loading ? (
        <div className="bg-white rounded-2xl p-12 text-center text-slate-500 space-y-2 border border-slate-200">
          <RefreshCw className="w-8 h-8 mx-auto animate-spin text-blue-600" />
          <p className="text-xs font-semibold">अधिकारियों की सूची लोड हो रही है...</p>
        </div>
      ) : filteredOfficers.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 space-y-3">
          <Users className="w-10 h-10 mx-auto text-slate-300" />
          <p className="text-sm font-bold text-slate-700">कोई नोडल अधिकारी नहीं मिला</p>
          <p className="text-xs text-slate-500">चयनित फ़िल्टर या खोज के अनुरूप कोई रिकॉर्ड उपलब्ध नहीं है।</p>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl"
          >
            <UserPlus className="w-3.5 h-3.5" /> नया अधिकारी जोड़ें
          </button>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                  <th className="py-3 px-3.5 w-12 text-center">क्र.</th>
                  <th className="py-3 px-3.5">अधिकारी का नाम</th>
                  <th className="py-3 px-3.5">पदनाम (Designation)</th>
                  <th className="py-3 px-3.5">मोबाइल नं. (लॉगिन पासवर्ड)</th>
                  <th className="py-3 px-3.5">विकासखण्ड</th>
                  <th className="py-3 px-3.5">आवंटित ग्राम पंचायत</th>
                  <th className="py-3 px-3.5 text-center w-36">क्रियाएं (Action)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOfficers.map((off, index) => {
                  const panchayatName = off.panchayat || (off.panchayats && off.panchayats.join(', ')) || '-';
                  return (
                    <tr key={off.id || index} className="hover:bg-blue-50/50 transition">
                      <td className="py-3 px-3.5 text-center font-bold text-slate-400">
                        {index + 1}
                      </td>
                      <td className="py-3 px-3.5 font-bold text-slate-900">
                        {off.name}
                      </td>
                      <td className="py-3 px-3.5 text-slate-600">
                        {off.designation}
                      </td>
                      <td className="py-3 px-3.5 font-mono text-slate-800">
                        <a 
                          href={`tel:${off.mobile}`}
                          className="text-blue-700 hover:underline flex items-center gap-1 font-semibold"
                        >
                          <Phone className="w-3 h-3 text-emerald-600" />
                          {off.mobile}
                        </a>
                      </td>
                      <td className="py-3 px-3.5">
                        <span className="bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded text-[11px]">
                          {off.block}
                        </span>
                      </td>
                      <td className="py-3 px-3.5 font-bold text-blue-900">
                        {panchayatName}
                      </td>
                      <td className="py-3 px-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(off)}
                            className="bg-blue-50 hover:bg-blue-100 text-blue-700 p-1.5 rounded-lg font-bold flex items-center gap-1 border border-blue-200 transition"
                            title="संपादित करें"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span className="text-[10px]">संपादित</span>
                          </button>
                          <button
                            onClick={() => setDeleteConfirmOfficer(off)}
                            className="bg-red-50 hover:bg-red-100 text-red-700 p-1.5 rounded-lg font-bold flex items-center gap-1 border border-red-200 transition"
                            title="हटाएं"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span className="text-[10px]">हटाएं</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-3">
            {filteredOfficers.map((off, index) => {
              const panchayatName = off.panchayat || (off.panchayats && off.panchayats.join(', ')) || '-';
              return (
                <div 
                  key={off.id || index}
                  className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 font-bold flex items-center justify-center shrink-0 text-xs">
                        {index + 1}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">{off.name}</h4>
                        <p className="text-xs text-slate-600">{off.designation}</p>
                      </div>
                    </div>
                    <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded shrink-0">
                      {off.block}
                    </span>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-xl text-xs space-y-1.5 border border-slate-100">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-amber-500" /> ग्राम पंचायत:
                      </span>
                      <span className="font-bold text-blue-900">{panchayatName}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-emerald-600" /> मोबाइल (पासवर्ड):
                      </span>
                      <a href={`tel:${off.mobile}`} className="font-mono font-bold text-blue-700">
                        {off.mobile}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      onClick={() => handleOpenEdit(off)}
                      className="bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 border border-blue-200"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>संपादित करें</span>
                    </button>
                    <button
                      onClick={() => setDeleteConfirmOfficer(off)}
                      className="bg-red-50 hover:bg-red-100 text-red-700 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 border border-red-200"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>हटाएं</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Add / Edit Officer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-300 overflow-hidden my-auto">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold">
                  {modalMode === 'add' ? 'नया नोडल अधिकारी जोड़ें' : 'नोडल अधिकारी विवरण संपादित करें'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleFormSubmit} className="p-4 sm:p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  अधिकारी का नाम (Full Name) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="उदा. श्री लखेश्वर यादव"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  पदनाम (Designation & Department) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="उदा. नायब तहसीलदार / उप संचालक कृषि"
                  value={formData.designation}
                  onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  मोबाइल नंबर (10 अंक) <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  pattern="\d{10}"
                  placeholder="उदा. 9876543210"
                  value={formData.mobile}
                  onChange={(e) => setFormData({ ...formData, mobile: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <p className="text-[11px] text-amber-600 mt-1">
                  * यह मोबाइल नंबर ही नोडल अधिकारी का लॉगिन पासवर्ड रहेगा।
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    विकासखण्ड (Block) <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.block}
                    onChange={(e) => handleFormBlockChange(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold bg-slate-50 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    {DISTRICT_BLOCKS.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    आवंटित ग्राम पंचायत <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.panchayat}
                    onChange={(e) => setFormData({ ...formData, panchayat: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold bg-slate-50 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    {getPanchayatsForBlock(formData.block).map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                    {formData.panchayat && !getPanchayatsForBlock(formData.block).includes(formData.panchayat) && (
                      <option value={formData.panchayat}>{formData.panchayat}</option>
                    )}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  अथवा अन्य ग्राम पंचायत नाम (यदि सूची में न हो):
                </label>
                <input
                  type="text"
                  placeholder="कस्टम ग्राम पंचायत नाम दर्ज करें"
                  value={formData.panchayat}
                  onChange={(e) => setFormData({ ...formData, panchayat: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50"
                />
              </div>

              {/* Modal Actions */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
                >
                  रद्द करें
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-blue-700 hover:bg-blue-800 text-white font-bold px-5 py-2 rounded-xl flex items-center gap-1.5 shadow"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>सुरक्षित हो रहा है...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>{modalMode === 'add' ? 'अधिकारी जोड़ें' : 'अपडेट सहेजें'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirmOfficer && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-red-200 overflow-hidden">
            <div className="bg-red-50 p-4 border-b border-red-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-red-900">नोडल अधिकारी हटाएं?</h3>
                <p className="text-[11px] text-red-600">यह प्रक्रिया वापस नहीं ली जा सकती।</p>
              </div>
            </div>

            <div className="p-4 space-y-2 text-xs text-slate-700">
              <p>क्या आप सुनिश्चित हैं कि आप निम्नलिखित अधिकारी को हटाना चाहते हैं?</p>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                <p className="font-bold text-slate-900">{deleteConfirmOfficer.name}</p>
                <p className="text-slate-600">{deleteConfirmOfficer.designation}</p>
                <p className="text-slate-600">
                  विकासखण्ड: <span className="font-bold">{deleteConfirmOfficer.block}</span> • पंचायत: <span className="font-bold">{deleteConfirmOfficer.panchayat || (deleteConfirmOfficer.panchayats || []).join(', ')}</span>
                </p>
                <p className="text-slate-600">
                  मोबाइल: <span className="font-mono">{deleteConfirmOfficer.mobile}</span>
                </p>
              </div>
            </div>

            <div className="bg-slate-50 p-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmOfficer(null)}
                className="px-3.5 py-1.5 rounded-xl text-slate-600 hover:bg-slate-200 text-xs font-bold"
              >
                रद्द करें
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDeleteOfficer}
                className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 shadow"
              >
                {deleting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>हटाया जा रहा है...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>हाँ, हटाएं</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

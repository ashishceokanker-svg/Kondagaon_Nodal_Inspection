import React, { useState, useEffect } from 'react';
import { X, Lock, Key, Plus, Edit, Trash2, Check, AlertCircle, Building, GraduationCap, Search, Sliders, Save, Eye, EyeOff } from 'lucide-react';
import { DISTRICT_BLOCKS, getPanchayatsForBlock } from '../constants';
import {
  getAllSchoolsList,
  addCustomSchool,
  editSchoolMaster,
  deleteSchoolMaster
} from '../data/schoolMasterData';
import {
  getAllHostelsList,
  addCustomHostel,
  editHostelMaster,
  deleteHostelMaster
} from '../data/hostelMasterData';
import { API } from '../api';

const ADMIN_PASSWORD = 'ashish#123';

export default function AdminMasterDataModal({ isOpen, onClose }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const [activeTab, setActiveTab] = useState('school'); // 'school' | 'hostel' | 'visibility'
  const [selectedBlock, setSelectedBlock] = useState('ALL');
  const [selectedPanchayat, setSelectedPanchayat] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [panchayatList, setPanchayatList] = useState([]);

  const [items, setItems] = useState([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Form states for Add / Edit school & hostel
  const [isEditing, setIsEditing] = useState(false);
  const [editingItemOriginalName, setEditingItemOriginalName] = useState('');
  const [editingTargetBlock, setEditingTargetBlock] = useState('');
  const [editingTargetPanchayat, setEditingTargetPanchayat] = useState('');

  const [formData, setFormData] = useState({
    block: '',
    panchayat: '',
    name: '',
    category: '',
    village: '',
    hostelType: ''
  });

  const [showAddForm, setShowAddForm] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Visibility Controls State (Special Field Control)
  const [visibilitySettings, setVisibilitySettings] = useState(() => API.getFormVisibilitySettings());
  const [savingVisibility, setSavingVisibility] = useState(false);

  // Update panchayat list when selectedBlock changes
  useEffect(() => {
    if (selectedBlock && selectedBlock !== 'ALL') {
      const pList = getPanchayatsForBlock(selectedBlock) || [];
      setPanchayatList(pList);
      setSelectedPanchayat('ALL');
    } else {
      setPanchayatList([]);
      setSelectedPanchayat('ALL');
    }
  }, [selectedBlock]);

  // Load items when panchayat, block, searchQuery, tab, or refreshTrigger changes
  useEffect(() => {
    if (activeTab === 'visibility') {
      API.fetchFormVisibilitySettings().then(s => {
        if (s) setVisibilitySettings(s);
      }).catch(() => {});
      return;
    }

    if (activeTab === 'school') {
      const list = getAllSchoolsList(selectedBlock, selectedPanchayat, searchQuery);
      setItems(list);
    } else if (activeTab === 'hostel') {
      const list = getAllHostelsList(selectedBlock, selectedPanchayat, searchQuery);
      setItems(list);
    }
  }, [selectedBlock, selectedPanchayat, searchQuery, activeTab, refreshTrigger]);

  if (!isOpen) return null;

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (passwordInput.trim() === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setPasswordError('');
    } else {
      setPasswordError('गलत पासवर्ड! कृपया सही प्रशासकीय पासवर्ड दर्ज करें।');
    }
  };

  const handleOpenAdd = () => {
    setIsEditing(false);
    setEditingItemOriginalName('');
    const defaultBlock = selectedBlock !== 'ALL' ? selectedBlock : DISTRICT_BLOCKS[0];
    const defaultPanch = selectedPanchayat !== 'ALL' ? selectedPanchayat : (getPanchayatsForBlock(defaultBlock)[0] || '');

    setEditingTargetBlock(defaultBlock);
    setEditingTargetPanchayat(defaultPanch);

    if (activeTab === 'school') {
      setFormData({
        block: defaultBlock,
        panchayat: defaultPanch,
        name: '',
        category: '1 - Primary',
        village: defaultPanch,
        hostelType: ''
      });
    } else {
      setFormData({
        block: defaultBlock,
        panchayat: defaultPanch,
        name: '',
        category: 'बालक',
        village: defaultPanch,
        hostelType: 'आश्रम शाला'
      });
    }
    setShowAddForm(true);
  };

  const handleOpenEdit = (item) => {
    setIsEditing(true);
    setEditingItemOriginalName(item.name);
    setEditingTargetBlock(item.block);
    setEditingTargetPanchayat(item.panchayat);

    if (activeTab === 'school') {
      setFormData({
        block: item.block,
        panchayat: item.panchayat,
        name: item.name,
        category: item.category || '1 - Primary',
        village: item.panchayat,
        hostelType: ''
      });
    } else {
      setFormData({
        block: item.block,
        panchayat: item.panchayat,
        name: item.name,
        category: item.category || 'बालक',
        village: item.village || item.panchayat,
        hostelType: item.hostelType || 'आश्रम शाला'
      });
    }
    setShowAddForm(true);
  };

  const handleDelete = (item) => {
    if (!window.confirm(`क्या आप "${item.name}" को ${item.block} -> ${item.panchayat} से हटाना चाहते हैं?`)) return;

    if (activeTab === 'school') {
      deleteSchoolMaster(item.block, item.panchayat, item.name);
    } else {
      deleteHostelMaster(item.block, item.panchayat, item.name);
    }
    setRefreshTrigger(prev => prev + 1);
    showNotification('सफलतापूर्वक हटा दिया गया!');
  };

  const handleSaveForm = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('कृपया नाम दर्ज करें');
      return;
    }

    const b = formData.block || editingTargetBlock;
    const p = formData.panchayat || editingTargetPanchayat;

    if (activeTab === 'school') {
      if (isEditing) {
        editSchoolMaster(b, p, editingItemOriginalName, {
          name: formData.name.trim(),
          category: formData.category
        });
      } else {
        addCustomSchool(b, p, {
          name: formData.name.trim(),
          category: formData.category
        });
      }
    } else {
      if (isEditing) {
        editHostelMaster(b, p, editingItemOriginalName, {
          name: formData.name.trim(),
          village: formData.village.trim() || p,
          category: formData.category,
          hostelType: formData.hostelType
        });
      } else {
        addCustomHostel(b, p, {
          name: formData.name.trim(),
          village: formData.village.trim() || p,
          category: formData.category,
          hostelType: formData.hostelType
        });
      }
    }

    setShowAddForm(false);
    setRefreshTrigger(prev => prev + 1);
    showNotification(isEditing ? 'सफलतापूर्वक अपडेट किया गया!' : 'सफलतापूर्वक नई प्रविष्टि जोड़ी गई!');
  };

  const handleToggleVisibilityKey = (key) => {
    setVisibilitySettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSaveVisibility = async () => {
    setSavingVisibility(true);
    try {
      await API.saveFormVisibilitySettings(visibilitySettings);
      showNotification('विशेष फ़ील्ड दृश्यता सेटिंग्स सफलतापूर्वक अपडेट की गईं!');
    } catch (err) {
      alert('सेटिंग्स सेव करने में त्रुटि आई।');
    } finally {
      setSavingVisibility(false);
    }
  };

  const showNotification = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-900 to-blue-900 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="bg-amber-400/20 p-2 rounded-xl text-amber-300 border border-amber-400/30">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg">मास्टर डेटा एवं फ़ील्ड नियंत्रण केंद्र</h3>
              <p className="text-xs text-blue-200">शाला / छात्रावास प्रविष्टियां एवं फॉर्म फ़ील्ड दृश्यता प्रबंधन</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-slate-300 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        {!isAuthenticated ? (
          /* Password Authentication screen - Clean Secret Input */
          <div className="p-6 sm:p-10 flex flex-col items-center justify-center text-center my-auto">
            <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-4 border border-indigo-100 shadow-sm">
              <Key className="w-8 h-8" />
            </div>
            <h4 className="text-lg font-bold text-slate-800 mb-1">प्रशासकीय प्रमाणीकरण (Admin Auth)</h4>
            <p className="text-xs text-slate-500 mb-6 max-w-sm">
              मास्टर डेटा व विशेष फ़ील्ड नियंत्रण तक पहुँचने के लिए कृपया अपना पासवर्ड दर्ज करें।
            </p>

            <form onSubmit={handlePasswordSubmit} className="w-full max-w-xs space-y-4">
              <div>
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="पासवर्ड दर्ज करें"
                  className="w-full text-center px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm tracking-wider shadow-inner"
                  autoFocus
                />
                {passwordError && (
                  <p className="text-xs text-rose-600 mt-2 font-medium flex items-center justify-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {passwordError}
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm py-3 rounded-xl shadow-md transition active:scale-98"
              >
                अनलाॅक करें (Unlock)
              </button>
            </form>
          </div>
        ) : (
          /* Main Panel */
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            
            {/* Notification Banner */}
            {successMsg && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 animate-fade-in">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Main Tabs */}
            <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 gap-1">
              <button
                type="button"
                onClick={() => { setActiveTab('school'); setShowAddForm(false); }}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                  activeTab === 'school' ? 'bg-white text-indigo-900 shadow-sm border border-slate-200' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <GraduationCap className="w-4 h-4 text-indigo-600" />
                <span>शाला मास्टर डेटा</span>
              </button>

              <button
                type="button"
                onClick={() => { setActiveTab('hostel'); setShowAddForm(false); }}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                  activeTab === 'hostel' ? 'bg-white text-emerald-900 shadow-sm border border-slate-200' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Building className="w-4 h-4 text-emerald-600" />
                <span>छात्रावास / आश्रम मास्टर</span>
              </button>

              <button
                type="button"
                onClick={() => { setActiveTab('visibility'); setShowAddForm(false); }}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                  activeTab === 'visibility' ? 'bg-white text-purple-900 shadow-sm border border-slate-200' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Sliders className="w-4 h-4 text-purple-600" />
                <span>विशेष फ़ील्ड नियंत्रण</span>
              </button>
            </div>

            {/* TAB 1 & TAB 2: SCHOOLS / HOSTELS MASTER DATA */}
            {activeTab !== 'visibility' && (
              <>
                {/* Search & Filter Controls */}
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    
                    {/* Search Input Box */}
                    <div className="sm:col-span-1 relative">
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">खोजें (Search Keyword):</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="नाम या शब्द से खोजें..."
                          className="w-full pl-8 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                      </div>
                    </div>

                    {/* Block Selector */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">विकासखण्ड (Block):</label>
                      <select
                        value={selectedBlock}
                        onChange={(e) => setSelectedBlock(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                      >
                        <option value="ALL">समस्त विकासखण्ड (All Blocks)</option>
                        {DISTRICT_BLOCKS.map(b => (
                          <option key={b} value={b}>{b}</option>
                        ))}
                      </select>
                    </div>

                    {/* Panchayat Selector */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">ग्राम पंचायत (Panchayat):</label>
                      <select
                        value={selectedPanchayat}
                        onChange={(e) => setSelectedPanchayat(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                      >
                        <option value="ALL">समस्त ग्राम पंचायत (All Panchayats)</option>
                        {panchayatList.map(p => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </div>

                  </div>
                </div>

                {/* Actions & Stats Header */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-700">
                      कुल प्रविष्टियां: <span className="bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full border border-indigo-200">{items.length}</span>
                    </span>
                    {searchQuery && (
                      <span className="text-[11px] text-slate-500">
                        (फिल्टर: "{searchQuery}")
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleOpenAdd}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 px-3.5 rounded-xl shadow flex items-center gap-1.5 transition active:scale-95"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{activeTab === 'school' ? '➕ नई शाला जोड़ें' : '➕ नया छात्रावास जोड़ें'}</span>
                  </button>
                </div>

                {/* Add / Edit Sub-form */}
                {showAddForm && (
                  <form onSubmit={handleSaveForm} className="bg-indigo-50/70 border border-indigo-200 p-4 rounded-2xl space-y-3 animate-fade-in">
                    <div className="flex items-center justify-between border-b border-indigo-200 pb-2">
                      <h5 className="font-bold text-xs text-indigo-900">
                        {isEditing ? `✏️ प्रविष्टि संशोधित करें` : `➕ नई प्रविष्टि जोड़ें`} ({activeTab === 'school' ? 'शाला' : 'छात्रावास'})
                      </h5>
                      <button
                        type="button"
                        onClick={() => setShowAddForm(false)}
                        className="text-slate-400 hover:text-slate-700 text-xs font-bold"
                      >
                        रद्द करें
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">विकासखण्ड *</label>
                        <select
                          disabled={isEditing}
                          value={formData.block}
                          onChange={(e) => {
                            const newB = e.target.value;
                            const pList = getPanchayatsForBlock(newB) || [];
                            setFormData({
                              ...formData,
                              block: newB,
                              panchayat: pList[0] || '',
                              village: pList[0] || ''
                            });
                          }}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 outline-none"
                        >
                          {DISTRICT_BLOCKS.map(b => (
                            <option key={b} value={b}>{b}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">ग्राम पंचायत *</label>
                        <select
                          disabled={isEditing}
                          value={formData.panchayat}
                          onChange={(e) => setFormData({ ...formData, panchayat: e.target.value, village: e.target.value })}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 outline-none"
                        >
                          {(getPanchayatsForBlock(formData.block || DISTRICT_BLOCKS[0]) || []).map(p => (
                            <option key={p} value={p}>{p}</option>
                          ))}
                        </select>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          {activeTab === 'school' ? 'शाला का नाम *' : 'छात्रावास / आश्रम का नाम *'}
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder={activeTab === 'school' ? 'उदा: प्रा.शा. रामपुर' : 'उदा: बालक आश्रम बांसकोट'}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                        />
                      </div>

                      {activeTab === 'school' ? (
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">शाला स्तर / श्रेणी</label>
                          <select
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 outline-none"
                          >
                            <option value="1 - Primary">1 - प्रा.शा. (Primary)</option>
                            <option value="2 - Primary with Upper Primary">2 - मा.शा. (Upper Primary)</option>
                            <option value="3 - Secondary">3 - शा.हाई स्कूल (High School)</option>
                            <option value="4 - Higher Secondary">4 - शा.उ.मा.वि. (Higher Secondary)</option>
                          </select>
                        </div>
                      ) : (
                        <>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">ग्राम / स्थान का पता</label>
                            <input
                              type="text"
                              value={formData.village}
                              onChange={(e) => setFormData({ ...formData, village: e.target.value })}
                              placeholder="ग्राम / टोला का नाम"
                              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">श्रेणी (Category)</label>
                            <select
                              value={formData.category}
                              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 outline-none"
                            >
                              <option value="बालक">बालक</option>
                              <option value="बालिका">बालिका</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">प्रकार (Hostel Type)</label>
                            <select
                              value={formData.hostelType}
                              onChange={(e) => setFormData({ ...formData, hostelType: e.target.value })}
                              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 outline-none"
                            >
                              <option value="आश्रम शाला">आश्रम शाला</option>
                              <option value="प्री-मैट्रिक छात्रावास">प्री-मैट्रिक छात्रावास</option>
                              <option value="पोस्ट-मैट्रिक छात्रावास">पोस्ट-मैट्रिक छात्रावास</option>
                              <option value="कस्तूरबा (KGBV)">कस्तूरबा (KGBV)</option>
                            </select>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-indigo-200">
                      <button
                        type="button"
                        onClick={() => setShowAddForm(false)}
                        className="px-3.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl"
                      >
                        रद्द करें
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow"
                      >
                        {isEditing ? 'अपडेट सुरक्षित करें' : 'नया जोड़ें'}
                      </button>
                    </div>
                  </form>
                )}

                {/* Items Master List */}
                <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white max-h-[50vh] overflow-y-auto">
                  {items.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 text-xs">
                      कोई प्रविष्टि नहीं मिली।
                      <br />
                      <span className="text-[11px] text-slate-400 mt-1 block">ऊपर "➕ नया जोड़ें" बटन से नई शाला / छात्रावास जोड़ सकते हैं।</span>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {items.map((item, idx) => (
                        <div key={idx} className="p-3.5 hover:bg-slate-50 transition flex items-center justify-between gap-3">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs text-slate-900">{item.name}</span>
                              {item.isCustom && (
                                <span className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200 px-1.5 py-0.5 rounded font-medium">
                                  कस्टम प्रविष्टि
                                </span>
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                              <span className="font-semibold text-slate-700">ब्लॉक: {item.block}</span>
                              <span>•</span>
                              <span className="font-semibold text-slate-700">पंचायत: {item.panchayat}</span>
                              {activeTab === 'school' ? (
                                <>
                                  <span>•</span>
                                  <span>श्रेणी: {item.category || 'N/A'}</span>
                                </>
                              ) : (
                                <>
                                  <span>•</span>
                                  <span>ग्राम: {item.village || item.panchayat}</span>
                                  <span>•</span>
                                  <span>प्रकार: {item.hostelType || 'N/A'}</span>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(item)}
                              className="p-1.5 bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-800 rounded-lg transition"
                              title="संपादित करें"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(item)}
                              className="p-1.5 bg-slate-100 hover:bg-rose-100 text-slate-700 hover:text-rose-800 rounded-lg transition"
                              title="हटाएं"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* TAB 3: SPECIAL FIELD CONTROL (विशेष फ़ील्ड नियंत्रण) */}
            {activeTab === 'visibility' && (
              <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-4 animate-fade-in">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div>
                    <h4 className="font-bold text-sm text-slate-800">विशेष फ़ील्ड दृश्यता नियंत्रण</h4>
                    <p className="text-xs text-slate-500">फॉर्म फ़ील्ड्स को अनहाइड या हाइड करने के लिए टॉगल स्विच का उपयोग करें</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleSaveVisibility}
                    disabled={savingVisibility}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs py-2 px-4 rounded-xl shadow flex items-center gap-1.5 transition active:scale-95"
                  >
                    <Save className="w-4 h-4" />
                    <span>{savingVisibility ? 'सेव हो रहा है...' : 'सेटिंग्स सेव करें'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  
                  {/* Field Control Item: Hostel Location & Date */}
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <h5 className="font-bold text-xs text-slate-800">1. छात्रावास पता, ग्राम, विकासखण्ड व दिनांक</h5>
                      <p className="text-[11px] text-slate-500">(4.2) छात्रावास का पता, ग्राम, विकासखण्ड एवं निरीक्षण दिनांक फ़ील्ड</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleVisibilityKey('hideHostelLocationFields')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                        !visibilitySettings.hideHostelLocationFields
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-amber-100 text-amber-800 border border-amber-300'
                      }`}
                    >
                      {!visibilitySettings.hideHostelLocationFields ? (
                        <> <Eye className="w-3.5 h-3.5" /> अनहाइड (शो) </>
                      ) : (
                        <> <EyeOff className="w-3.5 h-3.5" /> हाइड </>
                      )}
                    </button>
                  </div>

                  {/* Field Control Item 2 */}
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <h5 className="font-bold text-xs text-slate-800">2. अन्य फॉर्म प्रारंभिक जानकारी</h5>
                      <p className="text-[11px] text-slate-500">विकासखण्ड, ग्राम पंचायत व दिनांक फ़ील्ड (अन्य फॉर्म)</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleVisibilityKey('hidePreliminaryInfo')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                        !visibilitySettings.hidePreliminaryInfo
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-amber-100 text-amber-800 border border-amber-300'
                      }`}
                    >
                      {!visibilitySettings.hidePreliminaryInfo ? (
                        <> <Eye className="w-3.5 h-3.5" /> अनहाइड (शो) </>
                      ) : (
                        <> <EyeOff className="w-3.5 h-3.5" /> हाइड </>
                      )}
                    </button>
                  </div>

                  {/* Field Control Item 2 */}
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <h5 className="font-bold text-xs text-slate-800">2. आंगनबाड़ी राशन तालिका</h5>
                      <p className="text-[11px] text-slate-500">पूरक पोषण आहार वितरण तालिका</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleVisibilityKey('hideAnganwadiRation')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                        !visibilitySettings.hideAnganwadiRation
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-amber-100 text-amber-800 border border-amber-300'
                      }`}
                    >
                      {!visibilitySettings.hideAnganwadiRation ? (
                        <> <Eye className="w-3.5 h-3.5" /> अनहाइड (शो) </>
                      ) : (
                        <> <EyeOff className="w-3.5 h-3.5" /> हाइड </>
                      )}
                    </button>
                  </div>

                  {/* Field Control Item 3 */}
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <h5 className="font-bold text-xs text-slate-800">3. शाला अकादमिक विवरण</h5>
                      <p className="text-[11px] text-slate-500">शिक्षक उपस्थिति व अतिरिक्त अकादमिक नोट्स</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleVisibilityKey('hideSchoolAcademicExtra')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                        !visibilitySettings.hideSchoolAcademicExtra
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-amber-100 text-amber-800 border border-amber-300'
                      }`}
                    >
                      {!visibilitySettings.hideSchoolAcademicExtra ? (
                        <> <Eye className="w-3.5 h-3.5" /> अनहाइड (शो) </>
                      ) : (
                        <> <EyeOff className="w-3.5 h-3.5" /> हाइड </>
                      )}
                    </button>
                  </div>

                  {/* Field Control Item 4 */}
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <h5 className="font-bold text-xs text-slate-800">4. अधीक्षक निवास स्थिति</h5>
                      <p className="text-[11px] text-slate-500">छात्रावास अधीक्षक निवास प्रपत्र</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleVisibilityKey('hideHostelSuperintendent')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                        !visibilitySettings.hideHostelSuperintendent
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-amber-100 text-amber-800 border border-amber-300'
                      }`}
                    >
                      {!visibilitySettings.hideHostelSuperintendent ? (
                        <> <Eye className="w-3.5 h-3.5" /> अनहाइड (शो) </>
                      ) : (
                        <> <EyeOff className="w-3.5 h-3.5" /> हाइड </>
                      )}
                    </button>
                  </div>

                  {/* Field Control Item 5 */}
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <h5 className="font-bold text-xs text-slate-800">5. छात्रावास कर्मचारी मैट्रिक्स</h5>
                      <p className="text-[11px] text-slate-500">भृत्य, रसोइया, गार्ड व होमगार्ड तालिका</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleVisibilityKey('hideHostelStaff')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                        !visibilitySettings.hideHostelStaff
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-amber-100 text-amber-800 border border-amber-300'
                      }`}
                    >
                      {!visibilitySettings.hideHostelStaff ? (
                        <> <Eye className="w-3.5 h-3.5" /> अनहाइड (शो) </>
                      ) : (
                        <> <EyeOff className="w-3.5 h-3.5" /> हाइड </>
                      )}
                    </button>
                  </div>

                  {/* Field Control Item 6 */}
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <h5 className="font-bold text-xs text-slate-800">6. PM आवास सामग्री प्रपत्र</h5>
                      <p className="text-[11px] text-slate-500">ईंट, सीमेंट, गिट्टी, रेत प्रविष्टि</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleVisibilityKey('hideAwasMaterials')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                        !visibilitySettings.hideAwasMaterials
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-amber-100 text-amber-800 border border-amber-300'
                      }`}
                    >
                      {!visibilitySettings.hideAwasMaterials ? (
                        <> <Eye className="w-3.5 h-3.5" /> अनहाइड (शो) </>
                      ) : (
                        <> <EyeOff className="w-3.5 h-3.5" /> हाइड </>
                      )}
                    </button>
                  </div>

                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={handleSaveVisibility}
                    disabled={savingVisibility}
                    className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow flex items-center gap-1.5"
                  >
                    <Save className="w-4 h-4" />
                    <span>{savingVisibility ? 'सहेज रहे हैं...' : 'सेटिंग्स सेव करें'}</span>
                  </button>
                </div>
              </div>
            )}

          </div>
        )}

        {/* Footer */}
        <div className="bg-slate-100 px-4 py-3 border-t border-slate-200 flex justify-between items-center text-xs text-slate-500">
          <span>कलेक्टर नोडल निरीक्षण शाखा • कोण्डागांव</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl transition"
          >
            बंद करें
          </button>
        </div>

      </div>
    </div>
  );
}

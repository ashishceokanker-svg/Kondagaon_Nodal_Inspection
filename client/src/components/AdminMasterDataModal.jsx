import React, { useState, useEffect } from 'react';
import { X, Lock, Key, Plus, Edit, Trash2, Check, AlertCircle, Building, GraduationCap, RefreshCw } from 'lucide-react';
import { DISTRICT_BLOCKS, getPanchayatsForBlock } from '../constants';
import {
  getSchoolsForPanchayat,
  addCustomSchool,
  editSchoolMaster,
  deleteSchoolMaster
} from '../data/schoolMasterData';
import {
  getHostelsForPanchayat,
  addCustomHostel,
  editHostelMaster,
  deleteHostelMaster
} from '../data/hostelMasterData';

const ADMIN_PASSWORD = 'ashish#123';

export default function AdminMasterDataModal({ isOpen, onClose }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const [activeTab, setActiveTab] = useState('school'); // 'school' | 'hostel'
  const [selectedBlock, setSelectedBlock] = useState(DISTRICT_BLOCKS[0] || 'बड़ेराजपुर');
  const [selectedPanchayat, setSelectedPanchayat] = useState('');
  const [panchayatList, setPanchayatList] = useState([]);

  const [items, setItems] = useState([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Form states for Add / Edit
  const [isEditing, setIsEditing] = useState(false);
  const [editingItemOriginalName, setEditingItemOriginalName] = useState('');
  
  // Fields for school / hostel form
  const [formData, setFormData] = useState({
    name: '',
    category: '', // for school or hostel
    village: '',  // for hostel
    hostelType: '' // for hostel
  });

  const [showAddForm, setShowAddForm] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Update panchayat list when block changes
  useEffect(() => {
    if (selectedBlock) {
      const pList = getPanchayatsForBlock(selectedBlock) || [];
      setPanchayatList(pList);
      if (pList.length > 0) {
        setSelectedPanchayat(pList[0]);
      } else {
        setSelectedPanchayat('');
      }
    }
  }, [selectedBlock]);

  // Load items when panchayat, tab, or refreshTrigger changes
  useEffect(() => {
    if (!selectedBlock || !selectedPanchayat) {
      setItems([]);
      return;
    }

    if (activeTab === 'school') {
      const list = getSchoolsForPanchayat(selectedBlock, selectedPanchayat);
      setItems(list);
    } else {
      const list = getHostelsForPanchayat(selectedBlock, selectedPanchayat);
      setItems(list);
    }
  }, [selectedBlock, selectedPanchayat, activeTab, refreshTrigger]);

  if (!isOpen) return null;

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (passwordInput === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setPasswordError('');
    } else {
      setPasswordError('गलत पासवर्ड! कृपया सही पासवर्ड दर्ज करें।');
    }
  };

  const handleOpenAdd = () => {
    setIsEditing(false);
    setEditingItemOriginalName('');
    if (activeTab === 'school') {
      setFormData({
        name: '',
        category: '1 - Primary',
        village: selectedPanchayat,
        hostelType: ''
      });
    } else {
      setFormData({
        name: '',
        category: 'बालक',
        village: selectedPanchayat,
        hostelType: 'आश्रम शाला'
      });
    }
    setShowAddForm(true);
  };

  const handleOpenEdit = (item) => {
    setIsEditing(true);
    setEditingItemOriginalName(item.name);
    if (activeTab === 'school') {
      setFormData({
        name: item.name,
        category: item.category || '1 - Primary',
        village: selectedPanchayat,
        hostelType: ''
      });
    } else {
      setFormData({
        name: item.name,
        category: item.category || 'बालक',
        village: item.village || selectedPanchayat,
        hostelType: item.hostelType || 'आश्रम शाला'
      });
    }
    setShowAddForm(true);
  };

  const handleDelete = (item) => {
    if (!window.confirm(`क्या आप "${item.name}" को इस ग्राम पंचायत से हटाना चाहते हैं?`)) return;

    if (activeTab === 'school') {
      deleteSchoolMaster(selectedBlock, selectedPanchayat, item.name);
    } else {
      deleteHostelMaster(selectedBlock, selectedPanchayat, item.name);
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

    if (activeTab === 'school') {
      if (isEditing) {
        editSchoolMaster(selectedBlock, selectedPanchayat, editingItemOriginalName, {
          name: formData.name.trim(),
          category: formData.category
        });
      } else {
        addCustomSchool(selectedBlock, selectedPanchayat, {
          name: formData.name.trim(),
          category: formData.category
        });
      }
    } else {
      if (isEditing) {
        editHostelMaster(selectedBlock, selectedPanchayat, editingItemOriginalName, {
          name: formData.name.trim(),
          village: formData.village.trim() || selectedPanchayat,
          category: formData.category,
          hostelType: formData.hostelType
        });
      } else {
        addCustomHostel(selectedBlock, selectedPanchayat, {
          name: formData.name.trim(),
          village: formData.village.trim() || selectedPanchayat,
          category: formData.category,
          hostelType: formData.hostelType
        });
      }
    }

    setShowAddForm(false);
    setRefreshTrigger(prev => prev + 1);
    showNotification(isEditing ? 'सफलतापूर्वक अपडेट किया गया!' : 'सफलतापूर्वक नई प्रविष्टि जोड़ी गई!');
  };

  const showNotification = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-900 to-blue-900 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="bg-amber-400/20 p-2 rounded-xl text-amber-300 border border-amber-400/30">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg">स्कूल एवं छात्रावास मास्टर डेटा प्रबंधन</h3>
              <p className="text-xs text-blue-200">एडमिन पासवर्ड द्वारा सुरक्षित प्रविष्टि जोड़ें / बदलें / हटाएं</p>
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
          /* Password Authentication screen */
          <div className="p-6 sm:p-8 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-4 border border-indigo-100 shadow-sm">
              <Key className="w-8 h-8" />
            </div>
            <h4 className="text-lg font-bold text-slate-800 mb-1">प्रशासकीय प्रमाणीकरण</h4>
            <p className="text-xs text-slate-500 mb-6 max-w-sm">
              मास्टर डेटा में बदलाव करने के लिए कृपया विशेष एडमिन पासवर्ड दर्ज करें।
            </p>

            <form onSubmit={handlePasswordSubmit} className="w-full max-w-xs space-y-4">
              <div>
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="पासवर्ड दर्ज करें (ashish#123)"
                  className="w-full text-center px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm tracking-wider"
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
                अनलाइक करें (Unlock)
              </button>
            </form>
          </div>
        ) : (
          /* Main Master Data CRUD Panel */
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            
            {/* Success notification banner */}
            {successMsg && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Tabs & Location Selector */}
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-3">
              {/* Tabs */}
              <div className="flex bg-slate-200 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => { setActiveTab('school'); setShowAddForm(false); }}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 ${
                    activeTab === 'school' ? 'bg-white text-indigo-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <GraduationCap className="w-4 h-4" />
                  <span>शाला मास्टर डेटा ({items.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setActiveTab('hostel'); setShowAddForm(false); }}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 ${
                    activeTab === 'hostel' ? 'bg-white text-emerald-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Building className="w-4 h-4" />
                  <span>छात्रावास / आश्रम मास्टर डेटा ({items.length})</span>
                </button>
              </div>

              {/* Block & Panchayat Selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">विकासखण्ड (Block):</label>
                  <select
                    value={selectedBlock}
                    onChange={(e) => setSelectedBlock(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    {DISTRICT_BLOCKS.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">ग्राम पंचायत (Gram Panchayat):</label>
                  <select
                    value={selectedPanchayat}
                    onChange={(e) => setSelectedPanchayat(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    {panchayatList.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Actions Bar */}
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-700">
                {selectedBlock} ➔ ग्राम पंचायत: <span className="text-indigo-700">{selectedPanchayat || 'कोई नहीं'}</span>
              </h4>
              <button
                type="button"
                onClick={handleOpenAdd}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 px-3.5 rounded-xl shadow flex items-center gap-1.5 transition active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>{activeTab === 'school' ? '➕ नई शाला जोड़ें' : '➕ नया छात्रावास जोड़ें'}</span>
              </button>
            </div>

            {/* Add / Edit Form Modal Sub-section */}
            {showAddForm && (
              <form onSubmit={handleSaveForm} className="bg-indigo-50/60 border border-indigo-200 p-4 rounded-2xl space-y-3 animate-fade-in">
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
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      {activeTab === 'school' ? 'शाला का नाम *' : 'छात्रावास / आश्रम का नाम *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder={activeTab === 'school' ? 'उदा: प्रा.शा. नयापारा' : 'उदा: बालक आश्रम रामपुर'}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
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

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl"
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

            {/* List of items */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
              {items.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">
                  इस ग्राम पंचायत (<span className="font-semibold text-slate-700">{selectedPanchayat}</span>) में कोई {activeTab === 'school' ? 'शाला' : 'छात्रावास / आश्रम'} दर्ज नहीं है।
                  <br />
                  <span className="text-[11px] text-slate-400 mt-1 block">नया जोड़ने के लिए ऊपर दिए गए "➕ नया जोड़ें" बटन का उपयोग करें।</span>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {items.map((item, idx) => (
                    <div key={idx} className="p-3.5 hover:bg-slate-50 transition flex items-center justify-between gap-3">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900">{item.name}</span>
                          {item.id && (
                            <span className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200 px-1.5 py-0.5 rounded font-medium">
                              कस्टम (Custom)
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-2 text-[11px] text-slate-500">
                          {activeTab === 'school' ? (
                            <span>श्रेणी: {item.category || 'N/A'}</span>
                          ) : (
                            <>
                              <span>ग्राम: {item.village || selectedPanchayat}</span>
                              <span>•</span>
                              <span>श्रेणी: {item.category || 'N/A'}</span>
                              <span>•</span>
                              <span>प्रकार: {item.hostelType || 'N/A'}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Action buttons */}
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

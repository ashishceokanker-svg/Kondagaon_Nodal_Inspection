import React, { useState, useEffect } from 'react';
import { ShieldCheck, MapPin, User, Briefcase, Calendar, KeyRound, Lock, ArrowRight, CheckCircle2, ShieldAlert, Building } from 'lucide-react';
import { API } from '../api';
import { DISTRICT_BLOCKS, MONTH_OPTIONS, matchBlock } from '../constants';

export default function NodalLogin({ onLoginSuccess }) {
  const [loginMode, setLoginMode] = useState('officer'); // 'officer' | 'admin'
  const [officers, setOfficers] = useState([]);
  const [selectedBlock, setSelectedBlock] = useState('बड़ेराजपुर');
  const [selectedPanchayat, setSelectedPanchayat] = useState('');
  const [matchedOfficer, setMatchedOfficer] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState('सितम्बर 2026');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);


  // Admin state
  const [adminUsername, setAdminUsername] = useState('admin');
  const [adminPassword, setAdminPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    loadOfficers();
  }, []);

  const loadOfficers = async () => {
    try {
      const list = await API.getOfficers();
      const cleanList = (list || []).filter(o => !o.panchayat?.includes('रिजर्व'));
      setOfficers(cleanList);
      if (cleanList.length > 0) {
        const blockOfficers = cleanList.filter(o => matchBlock(o.block, selectedBlock));
        const first = blockOfficers[0] || cleanList[0];
        setSelectedPanchayat(first.panchayat);
        setMatchedOfficer(first);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleBlockChange = (blockName) => {
    setSelectedBlock(blockName);
    setErrorMsg('');
    setPassword('');
    const blockOfficers = officers.filter(o => matchBlock(o.block, blockName) && !o.panchayat?.includes('रिजर्व'));
    if (blockOfficers.length > 0) {
      setSelectedPanchayat(blockOfficers[0].panchayat);
      setMatchedOfficer(blockOfficers[0]);
    } else {
      setSelectedPanchayat('');
      setMatchedOfficer(null);
    }
  };

  // When Gram Panchayat changes, automatically find and set the officer & post
  const handlePanchayatChange = (panchayatName) => {
    setSelectedPanchayat(panchayatName);
    setErrorMsg('');
    setPassword('');
    const found = officers.find(o => o.panchayat === panchayatName || (o.panchayats && o.panchayats.includes(panchayatName)));
    if (found) {
      setMatchedOfficer(found);
    } else {
      setMatchedOfficer(null);
    }
  };


  // Handle Nodal Officer Login
  const handleOfficerLogin = async (e) => {
    e.preventDefault();
    if (!selectedPanchayat || !matchedOfficer) {
      setErrorMsg('कृपया ग्राम पंचायत का चयन करें');
      return;
    }
    if (!password) {
      setErrorMsg('कृपया पासवर्ड दर्ज करें');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      const res = await API.login({
        role: 'officer',
        panchayat: selectedPanchayat,
        month: selectedMonth,
        password: password.trim()
      });

      if (res.success && res.officer) {
        onLoginSuccess(res.officer);
      } else {
        setErrorMsg(res.message || 'लॉगिन असफल हुआ।');
      }
    } catch (err) {
      setErrorMsg('सर्वर से संपर्क नहीं हो सका।');
    } finally {
      setLoading(false);
    }
  };

  // Handle Admin Login
  const handleAdminLogin = async (e) => {
    e.preventDefault();
    if (!adminPassword) {
      setErrorMsg('कृपया एडमिन पासवर्ड दर्ज करें');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      const res = await API.login({
        role: 'admin',
        username: adminUsername.trim(),
        password: adminPassword.trim(),
        month: selectedMonth
      });

      if (res.success && res.officer) {
        onLoginSuccess(res.officer);
      } else {
        setErrorMsg(res.message || 'गलत एडमिन क्रेडेंशियल (पासवर्ड: admin)');
      }
    } catch (err) {
      setErrorMsg('सर्वर से संपर्क नहीं हो सका।');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-3 sm:p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        
        {/* Top Official Banner with Chhattisgarh Government Monogram */}
        <div className="bg-gradient-to-br from-blue-950 via-indigo-950 to-slate-950 text-white p-5 sm:p-6 text-center relative overflow-hidden border-b-4 border-amber-400">
          <div className="flex flex-col items-center justify-center">
            {/* Large Chhattisgarh Government Monogram in Center */}
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-white p-2 shadow-xl border-2 border-amber-400 flex items-center justify-center mb-3">
              <img 
                src="/cg_logo.svg" 
                alt="छत्तीसगढ़ शासन मोनो" 
                className="w-full h-full object-contain drop-shadow"
              />
            </div>
            
            <h2 className="text-xl sm:text-2xl font-black text-amber-300 tracking-tight leading-tight">
              कार्यालय कलेक्टर, जिला-कोण्डागांव (छ०ग०)
            </h2>
            
            <p className="text-xs sm:text-sm text-blue-100 mt-1.5 font-semibold">
              नोडल अधिकारी क्षेत्रीय निरीक्षण एवं डिजिटल गोसवारा पोर्टल
            </p>
          </div>
        </div>

        {/* Login Mode Tabs: Officer vs Admin */}
        <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-bold">
          <button
            type="button"
            onClick={() => { setLoginMode('officer'); setErrorMsg(''); }}
            className={`flex-1 py-3 text-center border-b-2 transition flex items-center justify-center gap-1.5 ${
              loginMode === 'officer'
                ? 'border-blue-700 bg-white text-blue-900 shadow-sm'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <User className="w-4 h-4 text-blue-600" />
            <span>नोडल अधिकारी लॉगिन</span>
          </button>

          <button
            type="button"
            onClick={() => { setLoginMode('admin'); setErrorMsg(''); }}
            className={`flex-1 py-3 text-center border-b-2 transition flex items-center justify-center gap-1.5 ${
              loginMode === 'admin'
                ? 'border-amber-600 bg-white text-amber-900 shadow-sm'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-amber-600" />
            <span>एडमिन लॉगिन (Admin)</span>
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5">
          {errorMsg && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start gap-2">
              <span className="font-bold">त्रुटि:</span> {errorMsg}
            </div>
          )}

          {loginMode === 'officer' ? (
            /* 1. NODAL OFFICER LOGIN FORM */
            <form onSubmit={handleOfficerLogin} className="space-y-4">
              
              {/* Step 1: Select Block */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Building className="w-4 h-4 text-indigo-600" />
                  विकासखण्ड का चयन करें (Block): *
                </label>
                <select
                  value={selectedBlock}
                  onChange={(e) => handleBlockChange(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border-2 border-indigo-200 bg-indigo-50/40 focus:bg-white focus:border-indigo-600 focus:outline-none transition font-bold text-slate-900 shadow-sm cursor-pointer"
                >
                  {DISTRICT_BLOCKS.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              {/* Step 2: Select Gram Panchayat */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  ग्राम पंचायत का चयन करें: *
                </label>
                <select
                  value={selectedPanchayat}
                  onChange={(e) => handlePanchayatChange(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border-2 border-blue-200 bg-blue-50/40 focus:bg-white focus:border-blue-600 focus:outline-none transition font-semibold text-slate-900 shadow-sm cursor-pointer"
                >
                  <option value="">-- ग्राम पंचायत चुनें --</option>
                  {officers
                    .filter(o => matchBlock(o.block, selectedBlock) && !o.panchayat?.includes('रिजर्व'))
                    .map((o, idx) => (
                      <option key={o.id || idx} value={o.panchayat}>
                        {idx + 1}. {o.panchayat}
                      </option>
                    ))}
                </select>
              </div>

              {/* Step 2: Auto-populated Officer Name & Designation */}
              {matchedOfficer && (
                <div className="bg-gradient-to-br from-slate-50 to-blue-50/50 p-3.5 rounded-xl border border-blue-200/80 space-y-2.5 animate-fadeIn">
                  <div className="flex items-center justify-between pb-1.5 border-b border-blue-200/50">
                    <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">
                      आवंटित नोडल अधिकारी विवरण
                    </span>
                    <span className="text-[10px] bg-blue-600 text-white font-bold px-2 py-0.2 rounded-full">
                      क्र. {matchedOfficer.sno || '1'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-500 block font-medium">अधिकारी का नाम:</span>
                    <p className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                      <User className="w-4 h-4 text-emerald-600 shrink-0" />
                      {matchedOfficer.name}
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-500 block font-medium">पदनाम:</span>
                    <p className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Briefcase className="w-4 h-4 text-blue-600 shrink-0" />
                      {matchedOfficer.designation}
                    </p>
                  </div>
                </div>
              )}

              {/* Step 3: Select Month */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-purple-600" />
                  माह का चयन करें (किस माह का निरीक्षण दर्ज कर रहे हैं): *
                </label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-purple-500 font-medium text-slate-800"
                >
                  {MONTH_OPTIONS.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              {/* Step 4: Password */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <KeyRound className="w-4 h-4 text-amber-600" />
                    पासवर्ड: *
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-[10px] text-blue-600 hover:underline font-medium"
                  >
                    {showPassword ? 'छुपाएं' : 'देखें'}
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder=""
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full text-xs p-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none transition font-mono tracking-wider text-slate-900"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !selectedPanchayat || !password}
                className="w-full mt-2 bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-xl shadow-md flex items-center justify-center gap-2 text-xs transition active:scale-[0.99]"
              >
                <span>नोडल लॉगिन करें (Login)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            /* 2. ADMIN LOGIN FORM */
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-200 text-amber-900 text-xs font-bold">
                प्रशासक लॉगिन (District Admin)
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  यूजरनेम (Username):
                </label>
                <input
                  type="text"
                  value={adminUsername}
                  onChange={(e) => setAdminUsername(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-slate-100 text-slate-600 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-amber-600" />
                  एडमिन पासवर्ड (Password):
                </label>
                <input
                  type="password"
                  placeholder="admin"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-amber-500 font-mono text-slate-900"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  डिफ़ॉल्ट पासवर्ड: <span className="font-mono font-bold text-slate-700">admin</span>
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-purple-600" />
                  समीक्षा माह (Review Month):
                </label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white font-medium"
                >
                  {MONTH_OPTIONS.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={loading || !adminPassword}
                className="w-full mt-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-xl shadow-md flex items-center justify-center gap-2 text-xs transition active:scale-[0.99]"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>एडमिन लॉगिन करें</span>
              </button>
            </form>
          )}

        </div>

        {/* Footer info */}
        <div className="bg-slate-50 p-3 text-center border-t border-slate-100 text-[10px] text-slate-500">
          जिला प्रशासन कोण्डागांव (छ०ग०) • विकासखण्ड: बड़ेराजपुर, केशकाल, फरसगांव, कोंडागांव, माकडी
        </div>

      </div>
    </div>
  );
}

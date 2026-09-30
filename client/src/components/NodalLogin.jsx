import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, MapPin, User, Briefcase, Calendar, KeyRound, Lock, 
  ArrowRight, CheckCircle2, ShieldAlert, Building, RefreshCw, 
  HelpCircle, X, BookOpen, FileText, Eye, PhoneCall, Layers
} from 'lucide-react';
import { API } from '../api';
import { DISTRICT_BLOCKS, MONTH_OPTIONS, matchBlock } from '../constants';

export default function NodalLogin({ onLoginSuccess }) {
  const [loginMode, setLoginMode] = useState('officer'); // 'officer' | 'admin'
  const [officers, setOfficers] = useState([]);
  const [selectedBlock, setSelectedBlock] = useState('फरसगांव');
  const [selectedPanchayat, setSelectedPanchayat] = useState('');
  const [matchedOfficer, setMatchedOfficer] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState('सितम्बर 2026');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Helpdesk State
  const [showHelpdesk, setShowHelpdesk] = useState(false);

  // App Update State
  const [isUpdatingApp, setIsUpdatingApp] = useState(false);
  const [updateMsg, setUpdateMsg] = useState('');

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
        const blockOfficers = cleanList.filter(o => matchBlock(o.block, 'फरसगांव'));
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

  const handlePanchayatChange = (panchayatName) => {
    setSelectedPanchayat(panchayatName);
    setErrorMsg('');
    setPassword('');
    const found = officers.find(o => 
      matchBlock(o.block, selectedBlock) && 
      (o.panchayat === panchayatName || (o.panchayats && o.panchayats.includes(panchayatName)))
    );
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
        setErrorMsg(res.message || 'गलत एडमिन क्रेडेंशियल');
      }
    } catch (err) {
      setErrorMsg('सर्वर से संपर्क नहीं हो सका।');
    } finally {
      setLoading(false);
    }
  };

  // Handle App & Data Update (Sync with cloud and refresh)
  const handleAppUpdate = async () => {
    setIsUpdatingApp(true);
    setUpdateMsg('नवीनतम डेटा एवं सेटिंग्स ऑनलाइन सिंक हो रही हैं...');
    try {
      await API.refreshAllData();
      await loadOfficers();
      setUpdateMsg('✅ ऐप एवं डेटा सफलतापूर्वक अपडेट हो गया!');
      setTimeout(() => {
        setUpdateMsg('');
        window.location.reload();
      }, 1000);
    } catch (e) {
      setUpdateMsg('⚠️ अपडेट में समस्या आई, कृपया इंटरनेट कनेक्शन जांचें।');
    } finally {
      setIsUpdatingApp(false);
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
                  placeholder="एडमिन पासवर्ड दर्ज करें"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-amber-500 font-mono text-slate-900"
                />
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

          {/* Helpdesk & App Update Buttons */}
          <div className="pt-3 border-t border-slate-100 mt-4 space-y-2">
            {/* Helpdesk Button */}
            <button
              type="button"
              onClick={() => setShowHelpdesk(true)}
              className="w-full bg-blue-50 hover:bg-blue-100 text-blue-900 border-2 border-blue-300 font-bold py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 text-xs transition active:scale-[0.99] shadow-sm"
              title="पोर्टल उपयोग एवं गोसवारा रिपोर्ट हेतु सहायता केंद्र"
            >
              <HelpCircle className="w-4 h-4 text-blue-700" />
              <span>📖 नोडल अधिकारी सहायता केंद्र एवं उपयोग मार्गदर्शिका (Helpdesk)</span>
            </button>

            {/* App / Web Update & Sync Button */}
            <button
              type="button"
              onClick={handleAppUpdate}
              disabled={isUpdatingApp}
              className="w-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 text-xs transition active:scale-[0.99] shadow-sm"
              title="नवीनतम अपडेट, फॉर्म सेटिंग्स एवं डेटा तुरंत लोड करें"
            >
              <RefreshCw className={`w-4 h-4 text-emerald-600 ${isUpdatingApp ? 'animate-spin' : ''}`} />
              <span>{isUpdatingApp ? 'अपडेट हो रहा है...' : 'ऐप एवं ऑनलाइन डेटा अपडेट करें (Update App & Sync)'}</span>
            </button>
            {updateMsg && (
              <p className="text-[11px] text-center font-bold text-emerald-700 mt-1.5 animate-pulse">
                {updateMsg}
              </p>
            )}
          </div>

        </div>

        {/* Footer info */}
        <div className="bg-slate-50 p-3 text-center border-t border-slate-100 text-[10px] text-slate-500">
          जिला प्रशासन कोण्डागांव (छ०ग०) • विकासखण्ड: बड़ेराजपुर, केशकाल, फरसगांव, कोंडागांव, माकडी
        </div>

      </div>

      {/* Helpdesk & User Guide Modal */}
      {showHelpdesk && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden my-auto max-h-[90vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-950 via-indigo-900 to-slate-950 text-white p-4 sm:p-5 flex items-start justify-between border-b-4 border-amber-400">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-300 shrink-0">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-amber-300">
                    नोडल अधिकारी सहायता केंद्र एवं उपयोग मार्गदर्शिका
                  </h3>
                  <p className="text-[11px] sm:text-xs text-blue-200 font-medium">
                    लॉगिन से लेकर प्रविष्टि एवं गोसवारा रिपोर्ट तक की सम्पूर्ण चरणबद्ध जानकारी
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowHelpdesk(false)}
                className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-1.5 rounded-lg transition"
                title="बंद करें"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body - Scrollable */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs text-slate-700 leading-relaxed">
              
              {/* Step 1: Login */}
              <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-200">
                <h4 className="font-bold text-blue-900 text-sm flex items-center gap-2 mb-2">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[11px] flex items-center justify-center font-bold">1</span>
                  लॉगिन कैसे करें (Login Process)
                </h4>
                <ul className="list-disc list-inside space-y-1.5 text-slate-700 ml-1">
                  <li><strong>विकासखण्ड चुनें:</strong> अपना ब्लॉक (उदा. फरसगांव, बड़ेराजपुर, केशकाल, कोंडागांव, माकड़ी) ड्रॉपडाउन से चुनें।</li>
                  <li><strong>ग्राम पंचायत चुनें:</strong> अपनी आवंटित ग्राम पंचायत चुनें। चयन करते ही आपका नाम व पद स्वतः प्रदर्शित होगा।</li>
                  <li><strong>समीक्षा माह चुनें:</strong> जिस माह का निरीक्षण दर्ज कर रहे हैं (उदा. सितम्बर 2026)।</li>
                  <li><strong>पासवर्ड:</strong> अपना <strong>10 अंकों का पंजीकृत मोबाइल नंबर</strong> पासवर्ड के रूप में दर्ज करें और <em>'नोडल लॉगिन करें'</em> बटन दबाएं।</li>
                </ul>
              </div>

              {/* Step 2: Inspection Forms */}
              <div className="p-3.5 bg-indigo-50/60 rounded-xl border border-indigo-200">
                <h4 className="font-bold text-indigo-900 text-sm flex items-center gap-2 mb-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[11px] flex items-center justify-center font-bold">2</span>
                  8 प्रमुख निरीक्षण प्रपत्र (8 Inspection Categories)
                </h4>
                <p className="mb-2 text-slate-600">डैशबोर्ड पर 8 प्रमुख निरीक्षण श्रेणियां उपलब्ध हैं, आवश्यकतानुसार संबंधित कार्ड पर क्लिक करें:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] font-semibold text-slate-800 bg-white p-2.5 rounded-lg border border-indigo-100">
                  <div className="flex items-center gap-1.5">🍼 1. आंगनबाड़ी केन्द्र निरीक्षण</div>
                  <div className="flex items-center gap-1.5">🏫 2. शाला (प्राथमिक / मिडिल)</div>
                  <div className="flex items-center gap-1.5">🏢 3. छात्रावास / आश्रम निरीक्षण</div>
                  <div className="flex items-center gap-1.5">🏠 4. प्रधानमंत्री आवास योजना (PMAY)</div>
                  <div className="flex items-center gap-1.5">🏥 5. उप स्वास्थ्य केंद्र / आरोग्य मंदिर</div>
                  <div className="flex items-center gap-1.5">🌾 6. उचित मूल्य दुकान (राशन दुकान)</div>
                  <div className="flex items-center gap-1.5">📜 7. राजस्व अभिलेख एवं नक्शा बटांकन</div>
                  <div className="flex items-center gap-1.5">🏗️ 8. ग्राम पंचायत निर्माण कार्य (नया)</div>
                </div>
                <p className="mt-2 text-[11px] text-indigo-950 font-medium">
                  <strong>नियम:</strong> निरीक्षण दिनांक में केवल वर्तमान (आज) या पूर्व की दिनांक मान्य है। आपकी आवंटित ग्राम पंचायत व आपका नाम फॉर्म में स्वतः लॉक रहेगा।
                </p>
              </div>

              {/* Step 3: GPS & Photo */}
              <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-200">
                <h4 className="font-bold text-emerald-900 text-sm flex items-center gap-2 mb-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[11px] flex items-center justify-center font-bold">3</span>
                  लाइव GPS लोकेशन एवं फोटो (Live Location & Photo)
                </h4>
                <ul className="list-disc list-inside space-y-1.5 text-slate-700 ml-1">
                  <li>कार्यस्थल अथवा संस्था पर पहुंचकर <strong>'स्थान (GPS) प्राप्त करें'</strong> बटन पर क्लिक करें।</li>
                  <li>संस्था या निर्माण कार्य की स्पष्ट लाइव फोटो अपलोड करें (अक्षांश व देशांतर स्वतः दर्ज होंगे)।</li>
                  <li>निर्माण कार्यों में कार्य का नाम, योजना, स्वीकृत लागत, भौतिक प्रगति (प्रतिशत) व सूचना पटल (CIB) की स्थिति अनिवार्य रूप से दर्ज करें।</li>
                </ul>
              </div>

              {/* Step 4: Draft & Submit */}
              <div className="p-3.5 bg-amber-50/60 rounded-xl border border-amber-200">
                <h4 className="font-bold text-amber-900 text-sm flex items-center gap-2 mb-2">
                  <span className="w-5 h-5 rounded-full bg-amber-600 text-white text-[11px] flex items-center justify-center font-bold">4</span>
                  ड्राफ्ट सुरक्षित करें एवं अंतिम सबमिट (Draft & Final Submit)
                </h4>
                <ul className="list-disc list-inside space-y-1.5 text-slate-700 ml-1">
                  <li><strong>ड्राफ्ट सुरक्षित करें (Save Draft):</strong> यदि निरीक्षण के दौरान जानकारी अधूरी है, तो इसे ड्राफ्ट के रूप में सुरक्षित कर बाद में पूरा कर सकते हैं।</li>
                  <li><strong>सत्यापित कर सबमिट करें (Submit Final):</strong> सम्पूर्ण प्रविष्टि पूर्ण होने के बाद सबमिट करें। सबमिट होते ही डेटा तुरंत क्लाउड पर सुरक्षित हो जाएगा।</li>
                </ul>
              </div>

              {/* Step 5: Goswara Reports & PDF */}
              <div className="p-3.5 bg-purple-50/60 rounded-xl border border-purple-200">
                <h4 className="font-bold text-purple-900 text-sm flex items-center gap-2 mb-2">
                  <span className="w-5 h-5 rounded-full bg-purple-600 text-white text-[11px] flex items-center justify-center font-bold">5</span>
                  गोसवारा रिपोर्ट, Eye 👁️ व्यू एवं PDF प्रिंट (Goswara Reports & PDF)
                </h4>
                <ul className="list-disc list-inside space-y-1.5 text-slate-700 ml-1">
                  <li>ऊपरी पट्टी में <strong>'गोसवारा रिपोर्ट' (Goswara Reports)</strong> बटन पर क्लिक करें।</li>
                  <li><strong>View 1 (विकासखण्डवार सारांश):</strong> सभी 8 श्रेणियों की ब्लॉकवार स्वीकृत व निरीक्षण प्रगति की सारांश तालिका।</li>
                  <li><strong>View 2 (पंचायतवार विस्तृत पंजी):</strong> आपकी ग्राम पंचायत की सभी निरीक्षण प्रविष्टियों की सूची।</li>
                  <li><strong>👁️ Eye Icon (कार्रवाई):</strong> किसी भी प्रविष्टि के '👁️' आइकन पर क्लिक करने पर मूल निरीक्षण प्रतिवेदन हूबहू प्रारूप में खुलेगा, जिसे <strong>'प्रिंट / PDF'</strong> बटन दबाकर सीधे A4 साइज में प्रिंट या PDF के रूप में सुरक्षित कर सकते हैं।</li>
                  <li><strong>View 3 (टीप व निर्देश पंजी):</strong> नोडल अधिकारियों द्वारा दर्ज की गई सभी टीप व निर्देश एक साथ।</li>
                  <li><strong>📊 संपूर्ण एक्सेल रिपोर्ट:</strong> इस बटन से सभी 8 श्रेणियों की प्रविष्टियां एक साथ एक्सेल फाइल (9 अलग-अलग शीट्स) में डाउनलोड हो जाती हैं।</li>
                </ul>
              </div>

              {/* Step 6: Sync & App update */}
              <div className="p-3.5 bg-cyan-50/60 rounded-xl border border-cyan-200">
                <h4 className="font-bold text-cyan-900 text-sm flex items-center gap-2 mb-2">
                  <span className="w-5 h-5 rounded-full bg-cyan-600 text-white text-[11px] flex items-center justify-center font-bold">6</span>
                  डेटा सिंक एवं ऐप अपडेट (App Update & Cloud Sync)
                </h4>
                <p className="text-slate-700">
                  यदि आपके मोबाइल या ब्राउज़र में कोई नया फॉर्म या नया डेटा तुरंत दिखाई न दे, तो लॉगिन स्क्रीन पर दिए गए 
                  <strong> 'ऐप एवं ऑनलाइन डेटा अपडेट करें (Update App & Sync)'</strong> बटन को दबाएं। यह तुरंत क्लाउड से नवीनतम डेटा व सेटिंग्स लोड कर देता है।
                </p>
              </div>

              {/* Contact / Support */}
              <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border-2 border-amber-300 text-slate-800 shadow-xs">
                <div className="flex items-center gap-2 font-bold text-amber-950 text-sm mb-1.5">
                  <PhoneCall className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>तकनीकी सहायता एवं नोडल हेल्पलाइन (Technical Support):</span>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-bold text-slate-900 text-sm">श्री आशीष डे (Ashish Dey)</span>
                    <span className="text-slate-600 font-medium text-xs">• मुख्य कार्यपालन अधिकारी (CEO), जनपद पंचायत बड़ेराजपुर</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-amber-900">मोबाइल नंबर:</span>
                    <a href="tel:9244249975" className="font-black text-blue-700 hover:underline bg-white px-2 py-0.5 rounded border border-amber-300 shadow-xs">
                      📞 9244249975
                    </a>
                  </div>
                  <div className="p-2.5 bg-white/90 rounded-lg border border-amber-200 text-xs text-amber-950 font-bold mt-1 shadow-xs">
                    💬 "ऐप अथवा पोर्टल के संचालन में किसी भी प्रकार की तकनीकी दिक्कत या समस्या होने पर तत्काल संपर्क करें।"
                  </div>
                  <p className="text-[10px] text-slate-500 pt-1">
                    कार्यालय कलेक्टर (नोडल निरीक्षण शाखा), जिला कोण्डागांव (छ०ग०)
                  </p>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setShowHelpdesk(false)}
                className="bg-blue-700 hover:bg-blue-800 text-white font-bold py-2 px-5 rounded-xl text-xs transition shadow"
              >
                समझ गया / विंडो बंद करें
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

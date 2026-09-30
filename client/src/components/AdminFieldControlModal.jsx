import React, { useState, useEffect } from 'react';
import { ShieldCheck, Lock, Unlock, Eye, EyeOff, Save, CheckCircle2, AlertCircle, X, RefreshCw, Sliders } from 'lucide-react';
import { API, DEFAULT_FORM_VISIBILITY } from '../api';

const SPECIAL_PASSWORD = 'ashish#123';

export default function AdminFieldControlModal({ isOpen, onClose }) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [authError, setAuthError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [settings, setSettings] = useState(() => API.getFormVisibilitySettings());

  useEffect(() => {
    if (isOpen) {
      // Refresh latest from Supabase
      API.fetchFormVisibilitySettings().then(s => {
        if (s) setSettings(s);
      }).catch(() => {});
      setSaveSuccess(false);
      setAuthError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleUnlock = (e) => {
    e.preventDefault();
    if (password.trim() === SPECIAL_PASSWORD) {
      setIsUnlocked(true);
      setAuthError('');
    } else {
      setAuthError('अमान्य पासवर्ड! कृपया सही पासवर्ड दर्ज करें।');
    }
  };

  const handleToggle = (key) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
    setSaveSuccess(false);
  };

  const handleUnhideAll = () => {
    setSettings({
      hidePreliminaryInfo: false,
      hideAnganwadiRation: false,
      hideSchoolAcademicExtra: false,
      hideHostelSuperintendent: false,
      hideHostelStaff: false,
      hideAwasMaterials: false,
    });
    setSaveSuccess(false);
  };

  const handleHideAll = () => {
    setSettings({
      hidePreliminaryInfo: true,
      hideAnganwadiRation: true,
      hideSchoolAcademicExtra: true,
      hideHostelSuperintendent: true,
      hideHostelStaff: true,
      hideAwasMaterials: true,
    });
    setSaveSuccess(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(false);
    try {
      await API.saveFormVisibilitySettings(settings);
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
      }, 4000);
    } catch (err) {
      alert('सेव करने में त्रुटि आई। कृपया पुनः प्रयास करें।');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-300 max-w-lg w-full overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Top Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-4 flex items-center justify-between border-b border-amber-400/40">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-400/20 text-amber-300 rounded-xl border border-amber-400/40">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black tracking-tight text-white flex items-center gap-1.5">
                <span>विशेष फ़ील्ड नियंत्रण</span>
                <span className="text-[10px] bg-amber-400 text-slate-950 font-bold px-1.5 py-0.5 rounded">
                  Admin Panel
                </span>
              </h3>
              <p className="text-[11px] text-slate-300">फॉर्म फ़ील्ड दृश्यता (Hide / Unhide) प्रबंधन</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5">
          {!isUnlocked ? (
            /* PASSWORD AUTHENTICATION SCREEN */
            <form onSubmit={handleUnlock} className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl flex items-start gap-2.5">
                <Lock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-900">
                  <p className="font-bold">सुरक्षित एडमिन नियंत्रण</p>
                  <p className="text-[11px] text-amber-800 mt-0.5">
                    फ़ील्ड्स को Unhide करने एवं दृश्यता बदलने हेतु अधिकृत पासवर्ड दर्ज करें।
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  विशेष पासवर्ड (Password):
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="पासवर्ड दर्ज करें..."
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full text-xs p-3 pr-10 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 font-mono text-slate-900"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {authError && (
                  <p className="text-[11px] text-rose-600 font-bold mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{authError}</span>
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="submit"
                  className="flex-1 bg-indigo-700 hover:bg-indigo-800 text-white font-bold py-2.5 px-4 rounded-xl shadow-md flex items-center justify-center gap-2 text-xs transition"
                >
                  <Unlock className="w-4 h-4" />
                  <span>पासवर्ड सत्यापित करें (Unlock)</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 px-3 rounded-xl text-xs transition"
                >
                  रद्द करें
                </button>
              </div>
            </form>
          ) : (
            /* UNLOCKED CONTROLS INTERFACE */
            <div className="space-y-4">
              
              {/* Quick Batch Controls */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-800">
                  त्वरित कार्रवाई (Quick Actions):
                </span>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={handleUnhideAll}
                    className="flex-1 sm:flex-initial bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] py-1.5 px-3 rounded-lg shadow-sm flex items-center justify-center gap-1 transition"
                    title="सभी 6 फ़ील्ड्स को एक साथ Unhide करें"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>सभी Unhide करें</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleHideAll}
                    className="flex-1 sm:flex-initial bg-slate-700 hover:bg-slate-800 text-white font-bold text-[11px] py-1.5 px-3 rounded-lg shadow-sm flex items-center justify-center gap-1 transition"
                    title="सभी 6 फ़ील्ड्स को एक साथ Hide करें"
                  >
                    <EyeOff className="w-3.5 h-3.5" />
                    <span>सभी Hide करें</span>
                  </button>
                </div>
              </div>

              {/* 6 Individual Toggle Switches */}
              <div className="space-y-2.5 max-h-[50vh] overflow-y-auto pr-1">
                
                {/* 1. All Preliminary Info */}
                <div 
                  onClick={() => handleToggle('hidePreliminaryInfo')}
                  className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between gap-3 ${
                    settings.hidePreliminaryInfo 
                      ? 'bg-rose-50/50 border-rose-200 hover:bg-rose-50' 
                      : 'bg-emerald-50/50 border-emerald-200 hover:bg-emerald-50'
                  }`}
                >
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <span>1. सभी 7 प्रपत्रों की 'प्रारंभिक जानकारी'</span>
                    </h4>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      दिनांक, नोडल अधिकारी, पदनाम, मोबाइल, विकासखण्ड, ग्राम पंचायत आदि।
                    </p>
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border shrink-0 ${
                    settings.hidePreliminaryInfo
                      ? 'bg-rose-100 text-rose-800 border-rose-300'
                      : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  }`}>
                    {settings.hidePreliminaryInfo ? 'छुपा हुआ (Hidden)' : 'प्रदर्शित (Visible)'}
                  </span>
                </div>

                {/* 2. Anganwadi Ration Status (8 Categories) */}
                <div 
                  onClick={() => handleToggle('hideAnganwadiRation')}
                  className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between gap-3 ${
                    settings.hideAnganwadiRation 
                      ? 'bg-rose-50/50 border-rose-200 hover:bg-rose-50' 
                      : 'bg-emerald-50/50 border-emerald-200 hover:bg-emerald-50'
                  }`}
                >
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <span>2. आंगनबाड़ी केन्द्र: सामग्री प्रदाय, बचत एवं वितरण</span>
                    </h4>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      8 श्रेणियों का पूरक पोषण राशन प्रदाय एवं पैकेट वितरण विवरण टेबल।
                    </p>
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border shrink-0 ${
                    settings.hideAnganwadiRation
                      ? 'bg-rose-100 text-rose-800 border-rose-300'
                      : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  }`}>
                    {settings.hideAnganwadiRation ? 'छुपा हुआ (Hidden)' : 'प्रदर्शित (Visible)'}
                  </span>
                </div>

                {/* 3. School Academic Level Remarks 2,3,4 */}
                <div 
                  onClick={() => handleToggle('hideSchoolAcademicExtra')}
                  className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between gap-3 ${
                    settings.hideSchoolAcademicExtra 
                      ? 'bg-rose-50/50 border-rose-200 hover:bg-rose-50' 
                      : 'bg-emerald-50/50 border-emerald-200 hover:bg-emerald-50'
                  }`}
                >
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <span>3. शाला निरीक्षण: अकादमिक स्तर टिप्पणी 2, 3, 4</span>
                    </h4>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      कक्षावार/विषयवार अकादमिक स्तर में केवल एक (1) पंक्ति रखें, 2,3,4 छुपाएं।
                    </p>
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border shrink-0 ${
                    settings.hideSchoolAcademicExtra
                      ? 'bg-rose-100 text-rose-800 border-rose-300'
                      : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  }`}>
                    {settings.hideSchoolAcademicExtra ? '2,3,4 छुपे (Hidden)' : 'सभी 4 प्रदर्शित (Visible)'}
                  </span>
                </div>

                {/* 4. Hostel Superintendent Details */}
                <div 
                  onClick={() => handleToggle('hideHostelSuperintendent')}
                  className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between gap-3 ${
                    settings.hideHostelSuperintendent 
                      ? 'bg-rose-50/50 border-rose-200 hover:bg-rose-50' 
                      : 'bg-emerald-50/50 border-emerald-200 hover:bg-emerald-50'
                  }`}
                >
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <span>4. छात्रावास: अधीक्षक / अधीक्षिका की जानकारी विवरण</span>
                    </h4>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      अधीक्षक नाम, मोबाइल, परिसर निवास, पृथक प्रवेश द्वार आदि।
                    </p>
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border shrink-0 ${
                    settings.hideHostelSuperintendent
                      ? 'bg-rose-100 text-rose-800 border-rose-300'
                      : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  }`}>
                    {settings.hideHostelSuperintendent ? 'छुपा हुआ (Hidden)' : 'प्रदर्शित (Visible)'}
                  </span>
                </div>

                {/* 5. Hostel Staff Matrix Details */}
                <div 
                  onClick={() => handleToggle('hideHostelStaff')}
                  className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between gap-3 ${
                    settings.hideHostelStaff 
                      ? 'bg-rose-50/50 border-rose-200 hover:bg-rose-50' 
                      : 'bg-emerald-50/50 border-emerald-200 hover:bg-emerald-50'
                  }`}
                >
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <span>5. छात्रावास: वर्तमान में कार्यरत कर्मचारियों की जानकारी (संख्या)</span>
                    </h4>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      भृत्य, रसोईयां, चौकीदार, होमगार्ड (पुरुष/महिला, नियमित/संविदा/दैनिक)।
                    </p>
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border shrink-0 ${
                    settings.hideHostelStaff
                      ? 'bg-rose-100 text-rose-800 border-rose-300'
                      : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  }`}>
                    {settings.hideHostelStaff ? 'छुपा हुआ (Hidden)' : 'प्रदर्शित (Visible)'}
                  </span>
                </div>

                {/* 6. Awas Materials On Site Details */}
                <div 
                  onClick={() => handleToggle('hideAwasMaterials')}
                  className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between gap-3 ${
                    settings.hideAwasMaterials 
                      ? 'bg-rose-50/50 border-rose-200 hover:bg-rose-50' 
                      : 'bg-emerald-50/50 border-emerald-200 hover:bg-emerald-50'
                  }`}
                >
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <span>6. प्रधानमंत्री आवास: उपलब्ध निर्माण सामग्री (मात्रा)</span>
                    </h4>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      ईंट, रेत, सीमेंट, छड़ / सरिया, गिट्टी आदि की मात्रा विवरण।
                    </p>
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border shrink-0 ${
                    settings.hideAwasMaterials
                      ? 'bg-rose-100 text-rose-800 border-rose-300'
                      : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  }`}>
                    {settings.hideAwasMaterials ? 'छुपा हुआ (Hidden)' : 'प्रदर्शित (Visible)'}
                  </span>
                </div>

              </div>

              {saveSuccess && (
                <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 p-2.5 rounded-xl text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>सेटिंग्स ऑनलाइन सेव हो गई हैं और सभी डिवाइस में तुरंत लागू हो गई हैं!</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white font-bold py-2.5 px-4 rounded-xl shadow-md flex items-center justify-center gap-2 text-xs transition"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>सेव हो रहा है...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>सेटिंग्स ऑनलाइन सुरक्षित करें (Save)</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 px-4 rounded-xl text-xs transition"
                >
                  बंद करें
                </button>
              </div>

            </div>
          )}
        </div>

      </div>
    </div>
  );
}

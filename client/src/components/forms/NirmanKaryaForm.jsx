import React, { useState } from 'react';
import { 
  HardHat, User, Calendar, MapPin, Save, Send, ArrowLeft, CheckCircle2, 
  Building2, CheckSquare, FileText, AlertTriangle, Layers, DollarSign, Wrench, ShieldCheck
} from 'lucide-react';
import { API } from '../../api';
import { DISTRICT_BLOCKS, getPanchayatsForBlock, getTodayDateString, getOfficerPanchayats } from '../../constants';
import GeoPhotoCapture from '../GeoPhotoCapture';
import { useFormVisibility } from '../../utils/useFormVisibility';

const WORK_CATEGORIES = [
  'सी.सी. रोड / डामर सड़क निर्माण',
  'सामुदायिक भवन / आश्रय स्थल',
  'पुल / पुलिया / रपटा निर्माण',
  'नाली निर्माण / जल निकासी',
  'आंगनबाड़ी भवन निर्माण',
  'मुक्तिधाम / शेड निर्माण',
  'गोठान विकास / बाउंड्रीवाल',
  'पेयजल कूप / बोर खनन / जल जीवन मिशन',
  'पंचायत भवन / भारत निर्माण सेवा केंद्र',
  'चबूतरा / सांस्कृतिक मंच निर्माण',
  'तालाब गहरीकरण / जल संरक्षण कार्य',
  'अन्य निर्माण कार्य'
];

const SCHEMES = [
  '15वां वित्त आयोग (15th FC)',
  'मूलभूत मद (Basic Grants)',
  'महात्मा गांधी नरेगा (MGNREGA)',
  'जिला खनिज संस्थान न्यास (DMF)',
  'विधायक निधि (MLA Fund)',
  'सांसद निधि (MP Fund)',
  'मुख्यमंत्री समग्र ग्रामीण विकास योजना',
  'विशेष केंद्रीय सहायता (SCA)',
  'स्वच्छ भारत मिशन (ग्रामीण)',
  'अन्य विभागीय मद'
];

const AGENCIES = [
  'ग्राम पंचायत',
  'ग्रामीण यांत्रिकी सेवा (RES)',
  'लोक निर्माण विभाग (PWD)',
  'प्रधानमंत्री ग्राम सड़क योजना (PMGSY)',
  'जल संसाधन विभाग (Jal Sansadhan)',
  'वन विभाग',
  'लोक स्वास्थ्य यांत्रिकी (PHE)',
  'अन्य कार्य एजेंसी'
];

const STAGES = [
  'अप्रारंभ (Not Started)',
  'ले-आउट / प्रारंभिक स्तर (Layout)',
  'नींव / खुदाई स्तर (Foundation / Excavation)',
  'प्लिंथ स्तर (Plinth Level)',
  'दीवार / लिंटल स्तर (Wall / Lintel)',
  'छत ढलाई स्तर (Roof / Slab)',
  'सड़क - सबग्रेड / अर्थवर्क स्तर (Subgrade)',
  'सड़क - GSB / WBM स्तर (GSB/WBM)',
  'सड़क - कंक्रीट / डामरीकरण स्तर (Concrete/BT)',
  'सड़क - साइड शोल्डर / फिनिशिंग स्तर',
  'नाली - बेस कंक्रीट / खुदाई स्तर (Drain Bed)',
  'नाली - साइड वॉल कंक्रीटिंग स्तर (Drain Wall)',
  'प्लास्टर / फिनिशिंग स्तर (Finishing)',
  'कार्य पूर्ण (Completed)',
  'कार्य बंद / बाधित (Stalled)'
];

export default function NirmanKaryaForm({ officer, onBack, onSuccess, initialData = null }) {
  const visibility = useFormVisibility();
  const isOfficer = officer && officer.role !== 'admin';
  const officerPanchayats = getOfficerPanchayats(officer);
  const today = getTodayDateString();

  const [formData, setFormData] = useState(() => {
    if (initialData) {
      const isKnownAgency = AGENCIES.includes(initialData.agencyName);
      return {
        ...initialData,
        agencyName: isKnownAgency ? initialData.agencyName : (initialData.agencyName ? 'अन्य कार्य एजेंसी' : 'ग्राम पंचायत'),
        customAgencyName: isKnownAgency ? '' : (initialData.agencyName || '')
      };
    }
    return {
      date: today,
      officerId: officer?.id || '',
      officerName: officer?.name || '',
      officerDesignation: officer?.designation || '',
      officerMobile: officer?.mobile || '',
      block: officer?.block || 'फरसगांव',
      district: officer?.district || 'कोण्डागांव',
      panchayat: officerPanchayats[0] || officer?.panchayats?.[0] || officer?.panchayat || '',
      village: '',

      // 1. कार्य का विवरण
      workName: '',
      workCategory: 'सी.सी. रोड / डामर सड़क निर्माण',
      schemeName: '15वां वित्त आयोग (15th FC)',
      asNumberDate: '',
      sanctionCost: '',
      expenditureCost: '',
      agencyName: 'ग्राम पंचायत',
      customAgencyName: '',
      startDate: '',
      targetDate: '',

      // 2. भौतिक प्रगति
      currentStage: 'दीवार / लिंटल स्तर (Wall / Lintel)',
      progressPercent: 50,
      isWorkOngoing: 'चालू',
      stalledReason: '',

      // 3. तकनीकी मूल्यांकन एवं गुणवत्ता
      qualityRating: 'अच्छी',
      isEstimateFollowed: 'हाँ',
      materialQuality: 'मानक अनुसार',
      hasCibBoard: 'हाँ',
      hasSubEngineerInspection: 'हाँ',
      laborPaymentStatus: 'नियमित',
      hasCuringFacility: 'हाँ',

      // 4. टीप एवं निर्देश
      remarks: '',

      // 5. फोटो व लोकेशन
      photoUrl: '',
      latitude: '',
      longitude: '',
      geoAccuracy: ''
    };
  });

  const [saving, setSaving] = useState(false);

  const handleSubmit = async (isDraft = false) => {
    if (!isDraft) {
      if (!formData.workName || !formData.workName.trim()) {
        alert('कृपया निर्माण कार्य का नाम दर्ज करें।');
        return;
      }
      if (!formData.panchayat) {
        alert('कृपया ग्राम पंचायत का चयन करें।');
        return;
      }
      if (formData.date > today) {
        alert('निरीक्षण दिनांक आज अथवा पूर्व की ही हो सकती है, भविष्य की दिनांक मान्य नहीं है।');
        return;
      }
      if (formData.agencyName === 'अन्य कार्य एजेंसी' && (!formData.customAgencyName || !formData.customAgencyName.trim())) {
        alert('कृपया अन्य निर्माण एजेंसी का नाम दर्ज करें।');
        return;
      }
    }

    setSaving(true);
    try {
      const finalAgencyName = formData.agencyName === 'अन्य कार्य एजेंसी'
        ? (formData.customAgencyName.trim() || 'अन्य कार्य एजेंसी')
        : formData.agencyName;

      const payload = {
        ...formData,
        agencyName: finalAgencyName,
        isDraft,
        status: isDraft ? 'ड्राफ्ट (लंबित)' : 'जमा किया गया (पूर्ण)'
      };
      const res = await API.saveInspection('nirman', payload);
      if (res.success) {
        alert(isDraft ? 'ड्राफ्ट सुरक्षित कर लिया गया है।' : 'ग्राम पंचायत निर्माण कार्य निरीक्षण सफलतापूर्वक जमा किया गया!');
        if (onSuccess) onSuccess();
      }
    } catch (err) {
      alert('सहेजने में समस्या आई: ' + (err.message || 'त्रुटि'));
    } finally {
      setSaving(false);
    }
  };

  let secIndex = 1;

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden mb-12">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-700 via-orange-700 to-amber-900 text-white p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs bg-white/20 hover:bg-white/30 text-white py-1.5 px-3 rounded-lg backdrop-blur-sm transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>डैशबोर्ड पर वापस</span>
          </button>
          <span className="text-[11px] font-bold bg-amber-400 text-amber-950 px-2.5 py-0.5 rounded-full shadow-sm">
            पंचायत एवं ग्रामीण विकास
          </span>
        </div>
        <div className="flex items-center gap-3 mt-4">
          <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md border border-white/20 shrink-0">
            <HardHat className="w-8 h-8 text-amber-200" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              ग्राम पंचायत में चल रहे निर्माण कार्यों का निरीक्षण प्रपत्र
            </h2>
            <p className="text-xs text-amber-100 mt-1">
              कार्य प्रगति स्तर, तकनीकी गुणवत्ता, समय-सीमा, प्रयुक्त सामग्री एवं सूचना पटल का क्षेत्रीय सत्यापन
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-6">

        {/* 1. प्रारंभिक जानकारी (निरीक्षण दिनांक एवं नोडल अधिकारी) - Hidden when hidePreliminaryInfo is enabled */}
        {!visibility.hidePreliminaryInfo && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-600" />
              <span>{secIndex++}. प्रारंभिक जानकारी (दिनांक एवं नोडल अधिकारी)</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  निरीक्षण दिनांक <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  max={today}
                  value={formData.date}
                  onChange={e => {
                    const val = e.target.value;
                    if (val > today) {
                      alert('निरीक्षण दिनांक आज अथवा पूर्व की ही हो सकती है, भविष्य की दिनांक मान्य नहीं है।');
                      setFormData({ ...formData, date: today });
                    } else {
                      setFormData({ ...formData, date: val });
                    }
                  }}
                  className="w-full p-2.5 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-amber-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">नोडल अधिकारी का नाम</label>
                <input
                  type="text"
                  readOnly={isOfficer}
                  value={formData.officerName}
                  onChange={e => setFormData({ ...formData, officerName: e.target.value })}
                  className={`w-full p-2.5 border border-slate-300 rounded-lg ${isOfficer ? 'bg-slate-100 text-slate-600 cursor-not-allowed' : 'bg-white'}`}
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">पदनाम</label>
                <input
                  type="text"
                  readOnly={isOfficer}
                  value={formData.officerDesignation}
                  onChange={e => setFormData({ ...formData, officerDesignation: e.target.value })}
                  className={`w-full p-2.5 border border-slate-300 rounded-lg ${isOfficer ? 'bg-slate-100 text-slate-600 cursor-not-allowed' : 'bg-white'}`}
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">मोबाइल नंबर</label>
                <input
                  type="text"
                  readOnly={isOfficer}
                  value={formData.officerMobile}
                  onChange={e => setFormData({ ...formData, officerMobile: e.target.value })}
                  className={`w-full p-2.5 border border-slate-300 rounded-lg ${isOfficer ? 'bg-slate-100 text-slate-600 cursor-not-allowed' : 'bg-white'}`}
                />
              </div>
            </div>
          </div>
        )}

        {/* 2. कार्यस्थल एवं ग्राम पंचायत विवरण */}
        <div className="bg-amber-50/50 border border-amber-200/80 rounded-xl p-4 space-y-4">
          <h3 className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-2">
            <MapPin className="w-4 h-4 text-amber-700" />
            <span>{secIndex++}. कार्यस्थल एवं ग्राम पंचायत विवरण</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                विकासखण्ड (Block)
              </label>
              <select
                disabled={isOfficer}
                value={formData.block}
                onChange={e => setFormData({ ...formData, block: e.target.value, panchayat: '' })}
                className={`w-full p-2.5 border border-slate-300 rounded-lg ${isOfficer ? 'bg-slate-100 cursor-not-allowed' : 'bg-white'}`}
              >
                {DISTRICT_BLOCKS.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                ग्राम पंचायत <span className="text-red-500">*</span>
              </label>
              {isOfficer ? (
                <select
                  disabled={officerPanchayats.length === 1}
                  value={formData.panchayat}
                  onChange={e => setFormData({ ...formData, panchayat: e.target.value })}
                  className={`w-full p-2.5 border border-slate-300 rounded-lg font-bold text-slate-800 ${
                    officerPanchayats.length === 1 ? 'bg-slate-100 cursor-not-allowed' : 'bg-white'
                  }`}
                >
                  {officerPanchayats.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              ) : (
                <select
                  value={formData.panchayat}
                  onChange={e => setFormData({ ...formData, panchayat: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-lg bg-white font-medium"
                >
                  <option value="">-- ग्राम पंचायत चुनें --</option>
                  {getPanchayatsForBlock(formData.block).map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                ग्राम / पारा / कार्यस्थल का नाम
              </label>
              <input
                type="text"
                placeholder="उदा. मेनपारा, स्कूल के पास, शीतला पारा"
                value={formData.village}
                onChange={e => setFormData({ ...formData, village: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-lg bg-white"
              />
            </div>
          </div>
        </div>

        {/* 3. निर्माण कार्य की विस्तृत जानकारी */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4 shadow-sm">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Building2 className="w-4 h-4 text-amber-600" />
            <span>{secIndex++}. निर्माण कार्य की आधारभूत जानकारी</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                निर्माण कार्य का पूरा नाम <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="उदा. सीसी रोड निर्माण मुख्य मार्ग से पटेल पारा तक"
                value={formData.workName}
                onChange={e => setFormData({ ...formData, workName: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-lg bg-white font-bold text-slate-900 text-sm focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  कार्य की श्रेणी (Category)
                </label>
                <select
                  value={formData.workCategory}
                  onChange={e => setFormData({ ...formData, workCategory: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-lg bg-white"
                >
                  {WORK_CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  योजना / मद का नाम (Scheme/Head)
                </label>
                <select
                  value={formData.schemeName}
                  onChange={e => setFormData({ ...formData, schemeName: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-lg bg-white"
                >
                  {SCHEMES.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  निर्माण एजेंसी (Executing Agency)
                </label>
                <select
                  value={formData.agencyName}
                  onChange={e => setFormData({ ...formData, agencyName: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-lg bg-white font-semibold"
                >
                  {AGENCIES.map(a => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
                {formData.agencyName === 'अन्य कार्य एजेंसी' && (
                  <input
                    type="text"
                    placeholder="अन्य कार्य एजेंसी का नाम दर्ज करें"
                    value={formData.customAgencyName}
                    onChange={e => setFormData({ ...formData, customAgencyName: e.target.value })}
                    className="w-full mt-2 p-2 border border-amber-400 rounded-lg bg-amber-50/70 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-amber-500"
                  />
                )}
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  प्रशासकीय स्वीकृति (AS) क्र. व दिनांक
                </label>
                <input
                  type="text"
                  placeholder="उदा. 452/जि.पं./2024-25 दि. 15.01.2025"
                  value={formData.asNumberDate}
                  onChange={e => setFormData({ ...formData, asNumberDate: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-lg bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  स्वीकृत लागत राशि (लाख ₹ में)
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="उदा. 5.00"
                  value={formData.sanctionCost}
                  onChange={e => setFormData({ ...formData, sanctionCost: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-lg bg-white font-bold text-amber-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  आहरित / व्यय राशि (लाख ₹ में)
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="उदा. 2.50"
                  value={formData.expenditureCost}
                  onChange={e => setFormData({ ...formData, expenditureCost: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-lg bg-white font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  कार्य प्रारंभ दिनांक
                </label>
                <input
                  type="date"
                  max={today}
                  value={formData.startDate}
                  onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-lg bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  लक्षित पूर्णता दिनांक
                </label>
                <input
                  type="date"
                  value={formData.targetDate}
                  onChange={e => setFormData({ ...formData, targetDate: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-lg bg-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 4. कार्य की वर्तमान भौतिक प्रगति */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4 shadow-sm">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-600" />
            <span>{secIndex++}. वर्तमान भौतिक प्रगति स्तर (Physical Progress)</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                वर्तमान प्रगति स्तर (Stage) <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.currentStage}
                onChange={e => setFormData({ ...formData, currentStage: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-lg bg-white font-bold text-blue-900"
              >
                {STAGES.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                भौतिक प्रगति प्रतिशत ({formData.progressPercent}%)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={formData.progressPercent}
                  onChange={e => setFormData({ ...formData, progressPercent: Number(e.target.value) })}
                  className="w-full accent-amber-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
                />
                <span className="font-mono font-bold text-xs w-10 text-right text-amber-800">
                  {formData.progressPercent}%
                </span>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                कार्य की स्थिति (Status)
              </label>
              <div className="flex gap-2">
                {['चालू', 'बंद / बाधित', 'पूर्ण'].map(statusOption => (
                  <label key={statusOption} className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold">
                    <input
                      type="radio"
                      name="isWorkOngoing"
                      value={statusOption}
                      checked={formData.isWorkOngoing === statusOption}
                      onChange={e => setFormData({ ...formData, isWorkOngoing: e.target.value })}
                      className="accent-amber-600"
                    />
                    <span>{statusOption}</span>
                  </label>
                ))}
              </div>
            </div>

            {formData.isWorkOngoing === 'बंद / बाधित' && (
              <div className="sm:col-span-3">
                <label className="block text-[11px] font-semibold text-rose-700 mb-1">
                  कार्य बंद / बाधित होने का मुख्य कारण
                </label>
                <input
                  type="text"
                  placeholder="उदा. राशि का अभाव / भूमि विवाद / सामग्री अनुपलब्धता / एजेंसी की लापरवाही"
                  value={formData.stalledReason}
                  onChange={e => setFormData({ ...formData, stalledReason: e.target.value })}
                  className="w-full p-2.5 border border-rose-300 rounded-lg bg-rose-50 text-rose-950 font-medium"
                />
              </div>
            )}
          </div>
        </div>

        {/* 5. गुणवत्ता एवं तकनीकी मानक मूल्यांकन */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4 shadow-sm">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            <span>{secIndex++}. गुणवत्ता एवं तकनीकी मानक मूल्यांकन</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                समग्र गुणवत्ता रेटिंग
              </label>
              <select
                value={formData.qualityRating}
                onChange={e => setFormData({ ...formData, qualityRating: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg bg-white font-bold"
              >
                <option value="उत्कृष्ट">उत्कृष्ट (Excellent)</option>
                <option value="अच्छी">अच्छी (Good)</option>
                <option value="संतोषजनक">संतोषजनक (Satisfactory)</option>
                <option value="गुणवत्ता में सुधार अपेक्षित">गुणवत्ता में सुधार अपेक्षित</option>
                <option value="अमानक / खराब">अमानक / खराब (Poor)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                प्राक्कलन (TS) व नक्शा अनुसार कार्य?
              </label>
              <select
                value={formData.isEstimateFollowed}
                onChange={e => setFormData({ ...formData, isEstimateFollowed: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg bg-white font-medium"
              >
                <option value="हाँ">हाँ (मानक अनुरूप)</option>
                <option value="नहीं">नहीं (विचलन पाया गया)</option>
                <option value="आंशिक">आंशिक</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                प्रयुक्त सामग्री की गुणवत्ता
              </label>
              <select
                value={formData.materialQuality}
                onChange={e => setFormData({ ...formData, materialQuality: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg bg-white font-medium"
              >
                <option value="मानक अनुसार">मानक अनुसार (Standard)</option>
                <option value="अमानक / घटिया">अमानक / घटिया (Substandard)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                कार्यस्थल पर सूचना पटल (CIB)?
              </label>
              <select
                value={formData.hasCibBoard}
                onChange={e => setFormData({ ...formData, hasCibBoard: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg bg-white font-medium"
              >
                <option value="हाँ">हाँ (लगा हुआ है)</option>
                <option value="नहीं">नहीं (नहीं लगा है)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                उप अभियंता द्वारा नियमित निरीक्षण?
              </label>
              <select
                value={formData.hasSubEngineerInspection}
                onChange={e => setFormData({ ...formData, hasSubEngineerInspection: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg bg-white font-medium"
              >
                <option value="हाँ">हाँ (नियमित)</option>
                <option value="नहीं">नहीं</option>
                <option value="कभी-कभी">कभी-कभी</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                श्रमिकों को मजदूरी भुगतान
              </label>
              <select
                value={formData.laborPaymentStatus}
                onChange={e => setFormData({ ...formData, laborPaymentStatus: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg bg-white font-medium"
              >
                <option value="नियमित">नियमित (समय पर)</option>
                <option value="आंशिक">आंशिक</option>
                <option value="विलंबित">विलंबित (बकाया है)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                तराई (Curing) की समुचित व्यवस्था
              </label>
              <select
                value={formData.hasCuringFacility}
                onChange={e => setFormData({ ...formData, hasCuringFacility: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg bg-white font-medium"
              >
                <option value="हाँ">हाँ (संतोषजनक)</option>
                <option value="नहीं">नहीं (अपर्याप्त)</option>
              </select>
            </div>
          </div>
        </div>

        {/* 6. टीप (निरीक्षणकर्ता की विस्तृत टिप्पणी एवं सुधार हेतु निर्देश) */}
        <div className="bg-amber-50/70 border-2 border-amber-300 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-800" />
            <h3 className="text-xs font-bold text-amber-950 uppercase tracking-wider">
              {secIndex++}. टीप (निरीक्षणकर्ता की विस्तृत टिप्पणी एवं सुधार हेतु निर्देश) <span className="text-red-500">*</span>
            </h3>
          </div>
          <p className="text-xs text-amber-800">
            कार्य की प्रगति, गुणवत्ता, पाई गई कमियों, एजेंसी/सचिव/उप अभियंता को दिए गए निर्देश एवं लक्षित पूर्णता के संबंध में स्पष्ट विवरण दर्ज करें:
          </p>
          <textarea
            rows={4}
            placeholder="उदा. कार्य वर्तमान में लिंटल स्तर तक पहुंच चुका है। कार्य की गुणवत्ता अच्छी है। उप अभियंता को आगामी सप्ताह में छत ढलाई की पूर्व जांच करने एवं एजेंसी को सूचना पटल अद्यतन करने के निर्देश दिए गए।"
            value={formData.remarks}
            onChange={e => setFormData({ ...formData, remarks: e.target.value })}
            className="w-full p-3 border border-amber-300 rounded-lg bg-white text-slate-900 text-xs focus:ring-2 focus:ring-amber-500 leading-relaxed font-medium"
          />
        </div>

        {/* 7. जियो-टैग्ड फोटो एवं लोकेशन */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-600" />
            <span>{secIndex++}. कार्यस्थल की लाइव फोटो एवं GPS लोकेशन</span>
          </h3>

          <GeoPhotoCapture
            photoUrl={formData.photoUrl}
            latitude={formData.latitude}
            longitude={formData.longitude}
            onCapture={(data) => {
              setFormData(prev => ({
                ...prev,
                photoUrl: data.photoUrl,
                latitude: data.latitude,
                longitude: data.longitude,
                geoAccuracy: data.accuracy
              }));
            }}
          />
        </div>

        {/* Action Buttons */}
        <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBack}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100 transition"
          >
            रद्द करें
          </button>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              disabled={saving}
              onClick={() => handleSubmit(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-amber-600 text-amber-800 text-xs font-bold hover:bg-amber-50 transition disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>ड्राफ्ट सहेजें</span>
            </button>

            <button
              type="button"
              disabled={saving}
              onClick={() => handleSubmit(false)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-6 py-2.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs font-black shadow-md hover:shadow-lg transition active:scale-95 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{saving ? 'जमा हो रहा है...' : 'निरीक्षण प्रपत्र सबमिट करें'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

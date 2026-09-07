import React, { useState } from 'react';
import { Landmark, Users, MapPin, Calendar, CheckSquare, ChevronDown, ChevronUp, Camera, Save, Send, ArrowLeft } from 'lucide-react';
import { API } from '../../api';
import { DISTRICT_BLOCKS, getPanchayatsForBlock, getTodayDateString, getOfficerPanchayats } from '../../constants';
import GeoPhotoCapture from '../GeoPhotoCapture';


export default function GramChaupalForm({ officer, onBack, onSuccess, initialData = null }) {
  const [activeSection, setActiveSection] = useState(0);
  const isOfficer = officer && officer.role !== 'admin';
  const officerPanchayats = getOfficerPanchayats(officer);
  const today = getTodayDateString();

  const [formData, setFormData] = useState(() => {
    if (initialData) return initialData;
    return {
      date: today,
      officerId: officer?.id || '',
      officerName: officer?.name || '',
      officerDesignation: officer?.designation || '',
      officerMobile: officer?.mobile || '',
      block: officer?.block || 'बड़ेराजपुर',
      district: officer?.district || 'कोण्डागांव',
      panchayat: officerPanchayats[0] || officer?.panchayats?.[0] || officer?.panchayat || '',
      village: '',
      dependentVillage: '',
      populationFemale: '',
      populationMale: '',
      populationTotal: '',
      scCount: '',
      stCount: '',
      obcCount: '',

      // 21 Sectors
      sectors: {
        school: { building: 'भवन अच्छा', teacherAttendance: 'नियमित', midDayMeal: 'नियमित', toilets: 'अच्छा', smcActive: 'हाँ', dropout: '5% से कम', instructions: '' },
        anganwadi: { status: 'क्रियाशील', attendance: '75% से अधिक', thrMeal: 'नियमित', samMamRecord: 'सामान्य', vhndDone: 'नियमित', cleanliness: 'हाँ', instructions: '' },
        pds: { status: 'नियमित वितरण', cardsUpdated: 'हाँ', quality: 'अच्छी है', allItemsTogether: 'हाँ', instructions: '' },
        health: { status: 'क्रियाशील', staffRegular: 'हाँ', instructions: '' },
        jjm: { tankStatus: 'कार्य पूर्ण', fhtcPercent: '>75%', supplyStatus: 'प्रतिदिन', sourceStatus: 'चालू', drinkingWaterProblem: 'नहीं' },
        creda: { regularRepair: 'हाँ', solarPump: 'क्रियाशील', highMast: 'क्रियाशील' },
        toilet: { status: 'क्रियाशील', householdCoverage: 'हाँ' },
        electricity: { status: 'नियमित आपूर्ति', unElectrifiedTolas: 'कोई नहीं' },
        road: { status: 'अच्छी स्थिति', requirement: '' },
        csc: { status: 'क्रियाशील', regularOpen: 'हाँ', servicesCount: '15' },
        hostel: { status: 'ठीक स्थिति', wardenPresent: 'हाँ', foodQuality: 'अच्छी', cleanliness: 'साफ', scholarshipGiven: 'हुआ' },
        panchayatBhawan: { status: 'ठीक स्थिति', recordsMaintained: 'हाँ' },
        panchayatSachiv: { attendance: 'नियमित उपस्थिति', satisfied: 'हाँ' },
        revenue: { patwariAttendance: 'नियमित उपस्थिति', satisfied: 'हाँ', pendingMutations: '0', rinPustikaProblem: 'नहीं' },
        sanitation: { regularCleaning: 'हाँ', shgWasteManagement: 'हाँ' },
        veterinary: { pmKisanBenefit: 'हाँ', cropInsuranceBenefit: 'हाँ', kccCount: '10', raeoVisit: 'हाँ', vaccinationDone: 'हाँ' },
        ujjwala: { leftOutBeneficiaries: '0', gotAllThree: 'तीनों', regularUse: 'हाँ', allEligibleIdentified: 'हाँ' },
        mahtariVandan: { pendingCount: '0' },
        pmay: { surveyStatus: 'पूर्ण', eligiblePendingSurvey: '0', regularMeetings: 'हाँ' },
        mgnrega: { regularPayment: 'हाँ', pendingPaymentAmount: '0', taAttendance: 'नियमित उपस्थिति', grsSatisfied: 'हाँ' },
        pensionAyushman: { regularPensionPayment: 'हाँ', ayushmanCardMade: 'हाँ', aadhaarIssue: 'नहीं', fraPattaDemand: 'नहीं' }
      },

      complaints: '',
      remarks: '',
      sarpanchName: '',
      photoUrl: '',
      latitude: '',
      longitude: '',
      geoAccuracy: ''
    };
  });

  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const handlePopulationChange = (female, male) => {
    const f = parseInt(female || 0);
    const m = parseInt(male || 0);
    setFormData(prev => ({
      ...prev,
      populationFemale: female,
      populationMale: male,
      populationTotal: (f + m).toString()
    }));
  };

  const handleSectorChange = (sec, field, val) => {
    setFormData(prev => ({
      ...prev,
      sectors: {
        ...prev.sectors,
        [sec]: {
          ...prev.sectors[sec],
          [field]: val
        }
      }
    }));
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const res = await API.uploadFile(file);
      if (res.fileUrl) {
        setFormData(prev => ({ ...prev, photoUrl: res.fileUrl }));
      }
    } catch (err) {
      alert('फोटो अपलोड में त्रुटि');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSubmit = async (isDraft = false) => {
    if (!isDraft && (!formData.village || !formData.panchayat)) {
      alert('कृपया ग्राम एवं ग्राम पंचायत का नाम दर्ज करें।');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...formData,
        isDraft,
        status: isDraft ? 'ड्राफ्ट (लंबित)' : 'जमा किया गया (पूर्ण)'
      };
      const res = await API.saveInspection('chaupal', payload);
      if (res.success) {
        alert(isDraft ? 'ड्राफ्ट सुरक्षित कर लिया गया है।' : 'ग्राम चौपाल निरीक्षण सफलतापूर्वक जमा किया गया!');
        if (onSuccess) onSuccess();
      }
    } catch (err) {
      alert('सहेजने में समस्या आई।');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden mb-12">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-800 via-indigo-900 to-slate-900 text-white p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-xs bg-white/20 hover:bg-white/30 py-1.5 px-3 rounded-lg transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> वापस
          </button>
          <span className="text-xs bg-purple-950/60 py-1 px-2.5 rounded-full border border-purple-400/30">
            प्रपत्र: Gram Chopal.pdf
          </span>
        </div>
        <div className="mt-3 text-center">
          <div className="inline-flex p-2.5 bg-white/10 rounded-2xl mb-2">
            <Landmark className="w-7 h-7 text-amber-300" />
          </div>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight">ग्राम चौपाल निरीक्षण प्रपत्र</h2>
          <p className="text-xs text-purple-200">जिला प्रशासन • 21 विभागों एवं जन कल्याणकारी योजनाओं की समीक्षा</p>
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-6">

        {/* Demographics */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-purple-600" /> ग्राम एवं जनसंख्या विवरण
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">निरीक्षण दिनांक</label>
              <input
                type="date"
                max={today}
                value={formData.date}
                onChange={e => {
                  const val = e.target.value;
                  if (val > today) {
                    alert('भविष्य (आगे) की तारीख का चयन नहीं किया जा सकता। कृपया वर्तमान या पूर्व की तारीख चुनें।');
                    return;
                  }
                  setFormData({ ...formData, date: val });
                }}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white font-medium"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">विकासखण्ड (Block) *</label>
              <select
                value={formData.block}
                disabled={isOfficer}
                onChange={e => {
                  const newBlock = e.target.value;
                  const panchs = getPanchayatsForBlock(newBlock);
                  setFormData({ 
                    ...formData, 
                    block: newBlock, 
                    panchayat: panchs[0] || '' 
                  });
                }}
                className={`w-full text-xs p-2.5 rounded-lg border border-slate-300 font-medium ${
                  isOfficer ? 'bg-slate-100 text-slate-700 cursor-not-allowed' : 'bg-white'
                }`}
              >
                {DISTRICT_BLOCKS.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">ग्राम पंचायत *</label>
              <select
                value={formData.panchayat}
                disabled={isOfficer && officerPanchayats.length <= 1}
                onChange={e => setFormData({ ...formData, panchayat: e.target.value })}
                className={`w-full text-xs p-2.5 rounded-lg border border-purple-300 font-medium ${
                  isOfficer && officerPanchayats.length <= 1 ? 'bg-slate-100 text-slate-700 cursor-not-allowed' : 'bg-white'
                }`}
              >
                {!isOfficer && <option value="">-- ग्राम पंचायत चुनें --</option>}
                {((isOfficer && officerPanchayats.length > 0) ? officerPanchayats : getPanchayatsForBlock(formData.block)).map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">ग्राम का नाम *</label>
              <input
                type="text"
                required
                placeholder="ग्राम का नाम"
                value={formData.village}
                onChange={e => setFormData({ ...formData, village: e.target.value })}
                className="w-full text-xs p-2.5 rounded-lg border border-purple-300 bg-purple-50/20 font-semibold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 border-t border-slate-200">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">आश्रित ग्राम</label>
              <input
                type="text"
                placeholder="आश्रित ग्राम"
                value={formData.dependentVillage}
                onChange={e => setFormData({ ...formData, dependentVillage: e.target.value })}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">नोडल अधिकारी का नाम</label>
              <input
                type="text"
                readOnly={isOfficer}
                value={formData.officerName}
                onChange={e => !isOfficer && setFormData({ ...formData, officerName: e.target.value })}
                className={`w-full text-xs p-2.5 rounded-lg border border-slate-300 font-bold ${
                  isOfficer ? 'bg-slate-100 text-slate-700 cursor-not-allowed' : 'bg-white text-slate-900'
                }`}
                title={isOfficer ? "नोडल अधिकारी का नाम बदला नहीं जा सकता" : ""}
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">पदनाम व मोबाइल</label>
              <input
                type="text"
                readOnly
                value={`${formData.officerDesignation || ''} (${formData.officerMobile || ''})`}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-slate-100 text-slate-700 cursor-not-allowed font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-2 text-xs">
            <div>
              <label className="block text-[10px] text-slate-500 mb-1">महिला</label>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={formData.populationFemale}
                onChange={e => handlePopulationChange(e.target.value, formData.populationMale)}
                className="w-full p-1.5 border rounded text-center"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-500 mb-1">पुरुष</label>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={formData.populationMale}
                onChange={e => handlePopulationChange(formData.populationFemale, e.target.value)}
                className="w-full p-1.5 border rounded text-center"
              />
            </div>
            <div>
              <label className="block text-[10px] text-purple-700 font-bold mb-1">कुल जनसंख्या</label>
              <input
                type="text"
                readOnly
                value={formData.populationTotal || '0'}
                className="w-full p-1.5 border border-purple-300 bg-purple-50 text-center font-bold text-purple-900 rounded"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-500 mb-1">अनु. जाति (SC)</label>
              <input
                type="number"
                min="0"
                value={formData.scCount}
                onChange={e => setFormData({ ...formData, scCount: e.target.value })}
                className="w-full p-1.5 border rounded text-center"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-500 mb-1">अनु. जनजाति (ST)</label>
              <input
                type="number"
                min="0"
                value={formData.stCount}
                onChange={e => setFormData({ ...formData, stCount: e.target.value })}
                className="w-full p-1.5 border rounded text-center"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-500 mb-1">अन्य पिछड़ा (OBC)</label>
              <input
                type="number"
                min="0"
                value={formData.obcCount}
                onChange={e => setFormData({ ...formData, obcCount: e.target.value })}
                className="w-full p-1.5 border rounded text-center"
              />
            </div>
          </div>
        </div>

        {/* 21 Sectors Review - Tabbed or Grouped Accordions */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center justify-between">
            <span>21 विभागों / योजनाओं की समीक्षा</span>
            <span className="text-[10px] text-purple-700 font-normal">सभी 4 पृष्ठों का संकलन</span>
          </h3>

          {/* Group 1: Education, Anganwadi & PDS */}
          <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 space-y-3">
            <h4 className="text-xs font-bold text-purple-950 flex items-center gap-1.5">
              1-4. शाला, आंगनबाड़ी, राशन दुकान एवं स्वास्थ्य
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <span className="font-bold text-slate-800 block mb-1">प्राथमिक / माध्यमिक शाला</span>
                <select value={formData.sectors.school.building} onChange={e => handleSectorChange('school', 'building', e.target.value)} className="w-full p-1.5 border rounded text-[11px] mb-1.5">
                  <option value="भवन अच्छा">भवन अच्छा</option>
                  <option value="मरम्मत योग्य">मरम्मत योग्य</option>
                  <option value="पुनर्निर्माण आवश्यक">पुनर्निर्माण की आवश्यकता</option>
                </select>
                <div className="grid grid-cols-2 gap-1 text-[11px]">
                  <select value={formData.sectors.school.teacherAttendance} onChange={e => handleSectorChange('school', 'teacherAttendance', e.target.value)} className="p-1 border rounded">
                    <option value="नियमित">शिक्षक नियमित</option>
                    <option value="अनियमित">शिक्षक अनियमित</option>
                  </select>
                  <select value={formData.sectors.school.midDayMeal} onChange={e => handleSectorChange('school', 'midDayMeal', e.target.value)} className="p-1 border rounded">
                    <option value="नियमित">मध्यान्ह भोजन नियमित</option>
                    <option value="अनियमित">मध्यान्ह भोजन अनियमित</option>
                  </select>
                </div>
              </div>

              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <span className="font-bold text-slate-800 block mb-1">आंगनबाड़ी केन्द्र</span>
                <select value={formData.sectors.anganwadi.status} onChange={e => handleSectorChange('anganwadi', 'status', e.target.value)} className="w-full p-1.5 border rounded text-[11px] mb-1.5">
                  <option value="क्रियाशील">क्रियाशील</option>
                  <option value="भवन जर्जर">भवन जर्जर</option>
                  <option value="नवनिर्माण आवश्यक">नवनिर्माण आवश्यक</option>
                </select>
                <div className="grid grid-cols-2 gap-1 text-[11px]">
                  <select value={formData.sectors.anganwadi.thrMeal} onChange={e => handleSectorChange('anganwadi', 'thrMeal', e.target.value)} className="p-1 border rounded">
                    <option value="नियमित">पूरक आहार नियमित</option>
                    <option value="अनियमित">अनियमित</option>
                  </select>
                  <select value={formData.sectors.anganwadi.samMamRecord} onChange={e => handleSectorChange('anganwadi', 'samMamRecord', e.target.value)} className="p-1 border rounded">
                    <option value="सामान्य">पोषण: सामान्य</option>
                    <option value="SAM / MAM">कुपोषित (SAM/MAM)</option>
                  </select>
                </div>
              </div>

              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <span className="font-bold text-slate-800 block mb-1">राशन दुकान (PDS)</span>
                <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                  <select value={formData.sectors.pds.status} onChange={e => handleSectorChange('pds', 'status', e.target.value)} className="p-1.5 border rounded">
                    <option value="नियमित वितरण">नियमित वितरण</option>
                    <option value="अनियमित वितरण">अनियमित वितरण</option>
                    <option value="बंद">बंद</option>
                  </select>
                  <select value={formData.sectors.pds.quality} onChange={e => handleSectorChange('pds', 'quality', e.target.value)} className="p-1.5 border rounded">
                    <option value="अच्छी है">सामग्री गुणवत्ता अच्छी</option>
                    <option value="अच्छी नहीं है">गुणवत्ता खराब</option>
                  </select>
                </div>
              </div>

              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <span className="font-bold text-slate-800 block mb-1">उप-स्वास्थ्य केन्द्र</span>
                <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                  <select value={formData.sectors.health.status} onChange={e => handleSectorChange('health', 'status', e.target.value)} className="p-1.5 border rounded">
                    <option value="क्रियाशील">क्रियाशील</option>
                    <option value="भवन जर्जर">भवन जर्जर</option>
                  </select>
                  <select value={formData.sectors.health.staffRegular} onChange={e => handleSectorChange('health', 'staffRegular', e.target.value)} className="p-1.5 border rounded">
                    <option value="हाँ">स्वास्थ्यकर्मी नियमित</option>
                    <option value="नहीं">अनियमित</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Group 2: Infrastructure (JJM, CREDA, Toilet, Power, Road, CSC) */}
          <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 space-y-3">
            <h4 className="text-xs font-bold text-purple-950 flex items-center gap-1.5">
              5-10. जल जीवन, क्रेडा, शौचालय, बिजली, सड़क, अटल डिजिटल केंद्र (CSC)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <span className="font-bold text-slate-800 block mb-1">जल जीवन मिशन (JJM)</span>
                <select value={formData.sectors.jjm.tankStatus} onChange={e => handleSectorChange('jjm', 'tankStatus', e.target.value)} className="w-full p-1 border rounded text-[11px] mb-1">
                  <option value="कार्य पूर्ण">टंकी कार्य पूर्ण</option>
                  <option value="कार्य अपूर्ण">कार्य अपूर्ण</option>
                  <option value="अप्रारंभ">अप्रारंभ</option>
                </select>
                <select value={formData.sectors.jjm.supplyStatus} onChange={e => handleSectorChange('jjm', 'supplyStatus', e.target.value)} className="w-full p-1 border rounded text-[11px]">
                  <option value="प्रतिदिन">जल आपूर्ति प्रतिदिन</option>
                  <option value="सप्ताह में 2-3 दिन">सप्ताह में 2-3 दिन</option>
                  <option value="अनियमित">अनियमित</option>
                </select>
              </div>

              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <span className="font-bold text-slate-800 block mb-1">क्रेडा (CREDA) सोलर/लाइट</span>
                <select value={formData.sectors.creda.solarPump} onChange={e => handleSectorChange('creda', 'solarPump', e.target.value)} className="w-full p-1 border rounded text-[11px] mb-1">
                  <option value="क्रियाशील">सोलर ड्यूल पंप क्रियाशील</option>
                  <option value="अक्रियाशील">अक्रियाशील / खराब</option>
                </select>
                <select value={formData.sectors.creda.highMast} onChange={e => handleSectorChange('creda', 'highMast', e.target.value)} className="w-full p-1 border rounded text-[11px]">
                  <option value="क्रियाशील">हाई मास्ट लाइट क्रियाशील</option>
                  <option value="अक्रियाशील">अक्रियाशील</option>
                </select>
              </div>

              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <span className="font-bold text-slate-800 block mb-1">बिजली आपूर्ति</span>
                <select value={formData.sectors.electricity.status} onChange={e => handleSectorChange('electricity', 'status', e.target.value)} className="w-full p-1 border rounded text-[11px] mb-1">
                  <option value="नियमित आपूर्ति">नियमित आपूर्ति</option>
                  <option value="अनियमित">अनियमित</option>
                  <option value="बंद">बंद</option>
                </select>
                <input
                  type="text"
                  placeholder="बिना बिजली वाले टोले..."
                  value={formData.sectors.electricity.unElectrifiedTolas}
                  onChange={e => handleSectorChange('electricity', 'unElectrifiedTolas', e.target.value)}
                  className="w-full p-1 border rounded text-[10px]"
                />
              </div>

              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <span className="font-bold text-slate-800 block mb-1">सड़क स्थिति</span>
                <select value={formData.sectors.road.status} onChange={e => handleSectorChange('road', 'status', e.target.value)} className="w-full p-1 border rounded text-[11px] mb-1">
                  <option value="अच्छी स्थिति">अच्छी स्थिति</option>
                  <option value="मरम्मत योग्य">मरम्मत योग्य</option>
                  <option value="खराब स्थिति">खराब स्थिति</option>
                </select>
                <input
                  type="text"
                  placeholder="आवश्यक सड़क का नाम..."
                  value={formData.sectors.road.requirement}
                  onChange={e => handleSectorChange('road', 'requirement', e.target.value)}
                  className="w-full p-1 border rounded text-[10px]"
                />
              </div>

              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <span className="font-bold text-slate-800 block mb-1">अटल डिजिटल केंद्र (CSC)</span>
                <div className="grid grid-cols-2 gap-1 text-[11px]">
                  <select value={formData.sectors.csc.status} onChange={e => handleSectorChange('csc', 'status', e.target.value)} className="p-1 border rounded">
                    <option value="क्रियाशील">क्रियाशील</option>
                    <option value="आंशिक">आंशिक</option>
                    <option value="बंद">बंद</option>
                  </select>
                  <input
                    type="number"
                    placeholder="सेवा संख्या"
                    value={formData.sectors.csc.servicesCount}
                    onChange={e => handleSectorChange('csc', 'servicesCount', e.target.value)}
                    className="p-1 border rounded text-center"
                  />
                </div>
              </div>

              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <span className="font-bold text-slate-800 block mb-1">शौचालय स्थिति</span>
                <select value={formData.sectors.toilet.status} onChange={e => handleSectorChange('toilet', 'status', e.target.value)} className="w-full p-1 border rounded text-[11px]">
                  <option value="क्रियाशील">क्रियाशील एवं उपयोगी</option>
                  <option value="अनुपयोगी">अनुपयोगी</option>
                  <option value="निर्माणाधीन">निर्माणाधीन</option>
                </select>
              </div>
            </div>
          </div>

          {/* Group 3: Panchayat, Revenue, Agriculture & Veterinary */}
          <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 space-y-3">
            <h4 className="text-xs font-bold text-purple-950 flex items-center gap-1.5">
              11-16. पंचायत, राजस्व (पटवारी), स्वच्छता, पशु चिकित्सा एवं कृषि
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <span className="font-bold text-slate-800 block mb-1">पंचायत सचिव उपस्थिति एवं कार्य</span>
                <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                  <select value={formData.sectors.panchayatSachiv.attendance} onChange={e => handleSectorChange('panchayatSachiv', 'attendance', e.target.value)} className="p-1.5 border rounded">
                    <option value="नियमित उपस्थिति">नियमित उपस्थिति</option>
                    <option value="आंशिक">आंशिक</option>
                    <option value="अनुपस्थित">अनुपस्थित</option>
                  </select>
                  <select value={formData.sectors.panchayatSachiv.satisfied} onChange={e => handleSectorChange('panchayatSachiv', 'satisfied', e.target.value)} className="p-1.5 border rounded">
                    <option value="हाँ">कार्य से संतुष्ट</option>
                    <option value="नहीं">असंतुष्ट</option>
                  </select>
                </div>
              </div>

              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <span className="font-bold text-slate-800 block mb-1">राजस्व विभाग (पटवारी)</span>
                <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                  <select value={formData.sectors.revenue.patwariAttendance} onChange={e => handleSectorChange('revenue', 'patwariAttendance', e.target.value)} className="p-1.5 border rounded">
                    <option value="नियमित उपस्थिति">नियमित उपस्थिति</option>
                    <option value="आंशिक">आंशिक</option>
                    <option value="अनुपस्थित">अनुपस्थित</option>
                  </select>
                  <input
                    type="number"
                    placeholder="नामांतरण लंबित संख्या"
                    value={formData.sectors.revenue.pendingMutations}
                    onChange={e => handleSectorChange('revenue', 'pendingMutations', e.target.value)}
                    className="p-1.5 border rounded text-center"
                  />
                </div>
              </div>

              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <span className="font-bold text-slate-800 block mb-1">पशु चिकित्सा एवं KCC</span>
                <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                  <select value={formData.sectors.veterinary.pmKisanBenefit} onChange={e => handleSectorChange('veterinary', 'pmKisanBenefit', e.target.value)} className="p-1.5 border rounded">
                    <option value="हाँ">PM किसान लाभ मिल रहा</option>
                    <option value="नहीं">छूटे लोग हैं</option>
                  </select>
                  <select value={formData.sectors.veterinary.vaccinationDone} onChange={e => handleSectorChange('veterinary', 'vaccinationDone', e.target.value)} className="p-1.5 border rounded">
                    <option value="हाँ">टीकाकरण संपन्न</option>
                    <option value="नहीं">टीकाकरण नहीं हुआ</option>
                  </select>
                </div>
              </div>

              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <span className="font-bold text-slate-800 block mb-1">कचरा प्रबंधन व स्वच्छता</span>
                <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                  <select value={formData.sectors.sanitation.regularCleaning} onChange={e => handleSectorChange('sanitation', 'regularCleaning', e.target.value)} className="p-1.5 border rounded">
                    <option value="हाँ">नियमित सफाई</option>
                    <option value="नहीं">अनियमित</option>
                  </select>
                  <select value={formData.sectors.sanitation.shgWasteManagement} onChange={e => handleSectorChange('sanitation', 'shgWasteManagement', e.target.value)} className="p-1.5 border rounded">
                    <option value="हाँ">समूह द्वारा कचरा प्रबंधन</option>
                    <option value="नहीं">नहीं</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Group 4: Welfare Schemes (Ujjwala, Mahtari Vandan, PMAY, MGNREGA, Pension/Ayushman) */}
          <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 space-y-3">
            <h4 className="text-xs font-bold text-purple-950 flex items-center gap-1.5">
              17-21. महतारी वंदन, पीएम आवास, मनरेगा, पेंशन, आयुष्मान व उज्ज्वला
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <span className="font-bold text-slate-800 block mb-1">महतारी वंदन योजना</span>
                <label className="text-[10px] text-slate-500 block">पंजीकरण बाकी महिलाओं की संख्या:</label>
                <input
                  type="number"
                  min="0"
                  value={formData.sectors.mahtariVandan.pendingCount}
                  onChange={e => handleSectorChange('mahtariVandan', 'pendingCount', e.target.value)}
                  className="w-full p-1.5 border rounded text-center font-bold text-purple-800 mt-1"
                />
              </div>

              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <span className="font-bold text-slate-800 block mb-1">प्रधानमंत्री आवास ग्रामीण</span>
                <select value={formData.sectors.pmay.surveyStatus} onChange={e => handleSectorChange('pmay', 'surveyStatus', e.target.value)} className="w-full p-1.5 border rounded text-[11px] mb-1">
                  <option value="पूर्ण">सर्वे कार्य: पूर्ण</option>
                  <option value="प्रगतिरत">सर्वे कार्य: प्रगतिरत</option>
                  <option value="प्रारंभ नहीं">प्रारंभ नहीं किया गया</option>
                </select>
                <input
                  type="number"
                  placeholder="सर्वे शेष पात्र लोग"
                  value={formData.sectors.pmay.eligiblePendingSurvey}
                  onChange={e => handleSectorChange('pmay', 'eligiblePendingSurvey', e.target.value)}
                  className="w-full p-1 border rounded text-[10px]"
                />
              </div>

              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <span className="font-bold text-slate-800 block mb-1">मनरेगा (MGNREGA)</span>
                <select value={formData.sectors.mgnrega.regularPayment} onChange={e => handleSectorChange('mgnrega', 'regularPayment', e.target.value)} className="w-full p-1.5 border rounded text-[11px] mb-1">
                  <option value="हाँ">नियमित भुगतान हो रहा</option>
                  <option value="नहीं">भुगतान लंबित है</option>
                </select>
                <select value={formData.sectors.mgnrega.taAttendance} onChange={e => handleSectorChange('mgnrega', 'taAttendance', e.target.value)} className="w-full p-1 border rounded text-[11px]">
                  <option value="नियमित उपस्थिति">तकनीकी सहायक नियमित</option>
                  <option value="आंशिक">आंशिक</option>
                  <option value="अनुपस्थित">अनुपस्थित</option>
                </select>
              </div>

              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <span className="font-bold text-slate-800 block mb-1">पेंशन व आयुष्मान कार्ड</span>
                <select value={formData.sectors.pensionAyushman.regularPensionPayment} onChange={e => handleSectorChange('pensionAyushman', 'regularPensionPayment', e.target.value)} className="w-full p-1.5 border rounded text-[11px] mb-1">
                  <option value="हाँ">नियमित पेंशन भुगतान हो रहा</option>
                  <option value="नहीं">छूटे हुए हितग्राही हैं</option>
                </select>
                <select value={formData.sectors.pensionAyushman.ayushmanCardMade} onChange={e => handleSectorChange('pensionAyushman', 'ayushmanCardMade', e.target.value)} className="w-full p-1.5 border rounded text-[11px]">
                  <option value="हाँ">सभी का आयुष्मान कार्ड बना</option>
                  <option value="नहीं">कार्ड बनाना शेष</option>
                </select>
              </div>

              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <span className="font-bold text-slate-800 block mb-1">उज्ज्वला योजना</span>
                <select value={formData.sectors.ujjwala.gotAllThree} onChange={e => handleSectorChange('ujjwala', 'gotAllThree', e.target.value)} className="w-full p-1.5 border rounded text-[11px] mb-1">
                  <option value="तीनों">सिलेंडर/चूल्हा/रेगुलेटर मिला</option>
                  <option value="आंशिक">आंशिक मिला</option>
                  <option value="नहीं">नहीं मिला</option>
                </select>
                <select value={formData.sectors.ujjwala.regularUse} onChange={e => handleSectorChange('ujjwala', 'regularUse', e.target.value)} className="w-full p-1.5 border rounded text-[11px]">
                  <option value="हाँ">गैस का नियमित उपयोग</option>
                  <option value="कभी-कभी">कभी-कभी</option>
                </select>
              </div>

              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <span className="font-bold text-slate-800 block mb-1">वन अधिकार पट्टा</span>
                <select value={formData.sectors.pensionAyushman.fraPattaDemand} onChange={e => handleSectorChange('pensionAyushman', 'fraPattaDemand', e.target.value)} className="w-full p-1.5 border rounded text-[11px]">
                  <option value="नहीं">कोई लंबित मांग नहीं</option>
                  <option value="हाँ">लंबित प्रकरण हैं</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Remarks & Instructions */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            टीप (निरीक्षणकर्ता की विस्तृत टिप्पणी एवं सुधार हेतु निर्देश):
          </label>
          <textarea
            rows={3}
            value={formData.remarks}
            onChange={e => setFormData({ ...formData, remarks: e.target.value })}
            placeholder="चौपाल समीक्षा उपरांत सुधार हेतु दिए गए विशेष निर्देश एवं टीप लिखें..."
            className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-purple-600 focus:outline-none"
          ></textarea>
        </div>

        {/* Complaints & Suggestions */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            अन्य विषय / सुझाव / शिकायत (ग्रामीणों द्वारा उठाई गई प्रमुख समस्याएं):
          </label>
          <textarea
            rows={3}
            value={formData.complaints}
            onChange={e => setFormData({ ...formData, complaints: e.target.value })}
            placeholder="चौपाल में ग्रामीणों द्वारा रखी गई प्रमुख मांगें, शिकायतें एवं निराकरण..."
            className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-purple-600 focus:outline-none"
          ></textarea>
        </div>

        {/* Photo Upload */}
        <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
          <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
            <Camera className="w-4 h-4 text-purple-600" />
            ग्राम चौपाल फोटो (Live Photo / Upload)
          </label>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhotoUpload}
              className="text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-purple-100 file:text-purple-800 hover:file:bg-purple-200 cursor-pointer"
            />
            {uploadingPhoto && <span className="text-xs text-purple-600 animate-pulse">फोटो लोड हो रहा है...</span>}
            {formData.photoUrl && (
              <img
                src={formData.photoUrl}
                alt="Gram Chaupal"
                className="w-20 h-20 object-cover rounded-xl border border-slate-300 shadow-sm"
              />
            )}
          </div>
        </div>

        {/* Verification Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">सरपंच का नाम</label>
            <input
              type="text"
              placeholder="सरपंच का नाम"
              value={formData.sarpanchName}
              onChange={e => setFormData({ ...formData, sarpanchName: e.target.value })}
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">नोडल अधिकारी</label>
            <input
              type="text"
              readOnly
              value={`${formData.officerName} (${formData.officerDesignation})`}
              className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-slate-100 text-slate-600"
            />
          </div>
        </div>

        {/* Photo & GPS Capture */}
        <GeoPhotoCapture
          photoUrl={formData.photoUrl}
          latitude={formData.latitude}
          longitude={formData.longitude}
          geoAccuracy={formData.geoAccuracy}
          panchayat={formData.panchayat || officer?.panchayat}
          officerName={formData.officerName || officer?.name}
          categoryLabel="ग्राम चौपाल निरीक्षण"
          themeColor="purple"
          onChange={({ photoUrl, latitude, longitude, geoAccuracy }) => {
            setFormData(prev => ({
              ...prev,
              photoUrl,
              latitude,
              longitude,
              geoAccuracy
            }));
          }}
        />

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200 gap-3">
          <button
            type="button"
            onClick={() => handleSubmit(true)}
            disabled={saving}
            className="flex-1 sm:flex-none border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold py-3 px-5 rounded-xl shadow-sm flex items-center justify-center gap-1.5 transition"
          >
            <Save className="w-4 h-4 text-slate-500" /> ड्राफ्ट सहेजें (Save Draft)
          </button>

          <button
            type="button"
            onClick={() => handleSubmit(false)}
            disabled={saving}
            className="flex-1 sm:flex-none bg-purple-800 hover:bg-purple-900 text-white text-xs font-bold py-3 px-6 rounded-xl shadow-md flex items-center justify-center gap-1.5 transition"
          >
            <Send className="w-4 h-4" /> फाइनल जमा करें (Submit)
          </button>
        </div>

      </div>
    </div>
  );
}

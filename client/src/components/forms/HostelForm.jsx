import React, { useState } from 'react';
import { Building, Shield, User, Camera, Save, Send, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { API } from '../../api';
import { DISTRICT_BLOCKS, getPanchayatsForBlock, getTodayDateString, getOfficerPanchayats } from '../../constants';
import GeoPhotoCapture from '../GeoPhotoCapture';


export default function HostelForm({ officer, onBack, onSuccess, initialData = null }) {
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
      officerOffice: officer?.office || 'तहसील / जनपद कार्यालय',
      block: officer?.block || 'बड़ेराजपुर',
      district: officer?.district || 'कोण्डागांव',
      panchayat: officerPanchayats[0] || officer?.panchayats?.[0] || officer?.panchayat || '',

      // 4. Hostel Info
      hostelName: '',
      address: '',
      category: 'बालक', // बालक / बालिका
      hostelType: 'प्री-मैट्रिक छात्रावास',
      casteCategory: 'ST', // ST / SC / OBC
      email: '',
      areaType: 'ग्रामीण',
      sanctionedSeats: '',
      presentStudents: '',
      contactPhone: '',
      superintendentName: '',

      // 5. Superintendent Info
      superintendentMobile: '',
      hasStaffQuarter: 'हाँ',
      superintendentResiding: 'हाँ',
      residingReasonIfNot: '',
      familyMembersStaying: '',
      separateEntrance: 'हाँ',
      safetyArrangement: '',

      // 7. Staff Matrix [peon, cook, guard, homeguard]
      staff: {
        peon: { mReg: 0, mCont: 0, mDaily: 0, fReg: 0, fCont: 0, fDaily: 0 },
        cook: { mReg: 0, mCont: 0, mDaily: 0, fReg: 0, fCont: 0, fDaily: 0 },
        guard: { mReg: 0, mCont: 0, mDaily: 0, fReg: 0, fCont: 0, fDaily: 0 },
        homeguard: { mReg: 0, mCont: 0, mDaily: 0, fReg: 0, fCont: 0, fDaily: 0 },
      },
      hasFemaleStaffQuarter: 'हाँ',
      femaleHomeguardName: '',
      hasFemaleHomeguardQuarter: 'हाँ',
      femaleGuardName: '',
      hasFemaleGuardQuarter: 'हाँ',
      isFemaleGuardStayingInside: 'हाँ',

      // 8. Hostel Profile & Committee
      monitoringCommitteeFormed: 'हाँ',
      meetingsHeldInYear: 'हाँ',
      meetingsCount: '2',
      registersMaintained: 'हाँ',

      // 9. Building & Amenities
      buildingAvailability: 'पर्याप्त',
      buildingOwned: 'हाँ',
      alternativeBuildingDesc: '',
      toiletsAvailable: 'हाँ',
      usableToilets: '4',
      unusableToilets: '0',
      extraToiletsNeeded: 'नहीं',
      dormitorySufficient: 'हाँ',
      mosquitoNetStatus: 'उपलब्ध एवं उपयोग में',
      bathroomAvailable: 'हाँ',
      campusEnvironment: 'अच्छा',
      boundaryWallAvailable: 'हाँ',
      electricityAvailable: 'हाँ',
      solarAvailable: 'हाँ',
      drinkingWaterSource: 'बोरवेल एवं RO',
      drainageWaterAvailable: 'हाँ',
      isoCertified: 'नहीं',
      idealHostelDeveloped: 'हाँ',

      // 10. Education, Health & Food
      regularHealthCheckup: 'हाँ',
      healthScheme: 'RBSK / स्वास्थ्य विभाग',
      playgroundAvailable: 'हाँ',
      sportsGearAvailable: 'हाँ',
      coachingScheme: 'हाँ',
      rationCardMade: 'हाँ',
      foodGrainSufficiency: 'पर्याप्त',
      foodQuality: 'अच्छी',

      // 11. CCTV, Computers, RO, Complaint box
      cctvAvailable: 'हाँ',
      cctvWorking: 'हाँ',
      cctvCount: '4',
      computerLabAvailable: 'हाँ',
      computerWorkingCount: '5',
      libraryAvailable: 'हाँ',
      roAvailable: 'हाँ',
      roWorking: 'हाँ',
      roDefectiveCount: '0',
      officerNumbersOnWall: 'हाँ',
      tollFreeNumberDisplayed: 'हाँ',
      complaintBoxMaintained: 'हाँ',

      remarks: '',
      photoUrl: '',
      latitude: '',
      longitude: '',
      geoAccuracy: ''
    };
  });

  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const handleStaffChange = (role, key, val) => {
    setFormData(prev => ({
      ...prev,
      staff: {
        ...prev.staff,
        [role]: {
          ...prev.staff[role],
          [key]: parseInt(val || 0)
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
    if (!isDraft && !formData.hostelName) {
      alert('कृपया छात्रावास का नाम दर्ज करें।');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...formData,
        isDraft,
        powerSolar: `विद्युत: ${formData.electricityAvailable}, सोलर: ${formData.solarAvailable}`,
        status: isDraft ? 'ड्राफ्ट (लंबित)' : 'जमा किया गया (पूर्ण)'
      };
      const res = await API.saveInspection('hostel', payload);
      if (res.success) {
        alert(isDraft ? 'ड्राफ्ट सुरक्षित कर लिया गया है।' : 'छात्रावास निरीक्षण सफलतापूर्वक जमा किया गया!');
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
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 text-white p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-xs bg-white/20 hover:bg-white/30 py-1.5 px-3 rounded-lg transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> वापस
          </button>
          <span className="text-xs bg-emerald-950/60 py-1 px-2.5 rounded-full border border-emerald-400/30">
            प्रपत्र: Hostel_Ashram.pdf
          </span>
        </div>
        <div className="mt-3 text-center">
          <div className="inline-flex p-2.5 bg-white/10 rounded-2xl mb-2">
            <Building className="w-7 h-7 text-emerald-300" />
          </div>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight">छात्रावास / आश्रमों का निरीक्षण प्रतिवेदन</h2>
          <p className="text-xs text-emerald-200">कार्यालय कलेक्टर, जिला-कोण्डागांव (छ०ग०) • आदिवासी विकास विभाग</p>
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-6">

        {/* Preliminary Date & Officer Info */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <User className="w-4 h-4 text-emerald-600" /> प्रारंभिक जानकारी
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
        </div>

        {/* Section 4: Hostel Info */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Building className="w-4 h-4 text-emerald-600" /> 4. छात्रावास की जानकारी
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">(4.1) छात्रावास का नाम *</label>
              <input
                type="text"
                required
                placeholder="उदा. बालक आश्रम विश्रामपुरी"
                value={formData.hostelName}
                onChange={e => setFormData({ ...formData, hostelName: e.target.value })}
                className="w-full text-xs p-2.5 rounded-lg border border-emerald-300 bg-emerald-50/30 focus:bg-white font-semibold text-slate-800"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">(4.2) छात्रावास का पता / ग्राम</label>
              <input
                type="text"
                value={formData.address}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
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
                className={`w-full text-xs p-2.5 rounded-lg border border-slate-300 font-medium ${
                  isOfficer && officerPanchayats.length <= 1 ? 'bg-slate-100 text-slate-700 cursor-not-allowed' : 'bg-white'
                }`}
              >
                {!isOfficer && <option value="">-- ग्राम पंचायत चुनें --</option>}
                {((isOfficer && officerPanchayats.length > 0) ? officerPanchayats : getPanchayatsForBlock(formData.block)).map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">(4.3) कैटेगरी</label>
              <select
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value })}
                className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white font-medium"
              >
                <option value="बालक">बालक</option>
                <option value="बालिका">बालिका</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">(4.4) प्रकार</label>
              <select
                value={formData.hostelType}
                onChange={e => setFormData({ ...formData, hostelType: e.target.value })}
                className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white"
              >
                <option value="प्री-मैट्रिक छात्रावास">प्री-मैट्रिक छात्रावास</option>
                <option value="पोस्ट-मैट्रिक छात्रावास">पोस्ट-मैट्रिक छात्रावास</option>
                <option value="आश्रम शाला">आश्रम शाला</option>
                <option value="पोटाकेबिन">पोटाकेबिन</option>
                <option value="कस्तूरबा (KGBV)">कस्तूरबा (KGBV)</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">(4.5) वगग</label>
              <select
                value={formData.casteCategory}
                onChange={e => setFormData({ ...formData, casteCategory: e.target.value })}
                className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white"
              >
                <option value="ST">ST (अ.ज.जा.)</option>
                <option value="SC">SC (अ.जा.)</option>
                <option value="OBC">OBC (अ.पि.व.)</option>
                <option value="General">सामान्य</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">(4.7) एरिया टाइप</label>
              <select
                value={formData.areaType}
                onChange={e => setFormData({ ...formData, areaType: e.target.value })}
                className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white"
              >
                <option value="ग्रामीण">ग्रामीण</option>
                <option value="शहरी">शहरी</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">(4.8) स्वीकृत सीट</label>
              <input
                type="number"
                min="0"
                value={formData.sanctionedSeats}
                onChange={e => setFormData({ ...formData, sanctionedSeats: e.target.value })}
                className="w-full text-xs p-2 rounded-lg border border-slate-300 text-center font-bold"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">(4.9) उपस्थित संख्या</label>
              <input
                type="number"
                min="0"
                value={formData.presentStudents}
                onChange={e => setFormData({ ...formData, presentStudents: e.target.value })}
                className="w-full text-xs p-2 rounded-lg border border-slate-300 text-center font-bold text-emerald-700"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">विकासखण्ड</label>
              <select
                value={formData.block}
                onChange={e => setFormData({ ...formData, block: e.target.value })}
                className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white font-medium"
              >
                {DISTRICT_BLOCKS.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">दिनांक</label>
              <input
                type="date"
                value={formData.date}
                onChange={e => setFormData({ ...formData, date: e.target.value })}
                className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white"
              />
            </div>
          </div>
        </div>

        {/* Section 5: Superintendent Info & Residency */}
        <div className="border border-slate-200 rounded-xl p-4 space-y-3">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 text-emerald-900">
            <User className="w-4 h-4 text-emerald-600" /> 5. अधीक्षक / अधीक्षिका की जानकारी
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">(5.1) अधीक्षक का नाम</label>
              <input
                type="text"
                placeholder="अधीक्षक का नाम"
                value={formData.superintendentName}
                onChange={e => setFormData({ ...formData, superintendentName: e.target.value })}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white font-medium"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">(5.2) मोबाइल नंबर</label>
              <input
                type="tel"
                placeholder="मोबाइल नंबर"
                value={formData.superintendentMobile}
                onChange={e => setFormData({ ...formData, superintendentMobile: e.target.value })}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
            <div>
              <label className="block font-medium text-slate-700 mb-1">(5.3) क्या आवास गृह उपलब्ध है?</label>
              <select
                value={formData.hasStaffQuarter}
                onChange={e => setFormData({ ...formData, hasStaffQuarter: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg bg-white"
              >
                <option value="हाँ">हाँ</option>
                <option value="नहीं">नहीं</option>
              </select>
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">(5.4) क्या परिसर में निवास करते हैं?</label>
              <select
                value={formData.superintendentResiding}
                onChange={e => setFormData({ ...formData, superintendentResiding: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg bg-white font-bold"
              >
                <option value="हाँ">हाँ</option>
                <option value="नहीं">नहीं</option>
              </select>
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">(5.7) पृथक प्रवेश द्वार निर्मित है?</label>
              <select
                value={formData.separateEntrance}
                onChange={e => setFormData({ ...formData, separateEntrance: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg bg-white"
              >
                <option value="हाँ">हाँ</option>
                <option value="नहीं">नहीं</option>
              </select>
            </div>
          </div>

          {formData.superintendentResiding === 'नहीं' && (
            <div>
              <label className="block text-[11px] font-semibold text-rose-700 mb-1">(5.5) अगर नहीं, तो कारण बताएं</label>
              <input
                type="text"
                placeholder="परिसर में निवास न करने का कारण..."
                value={formData.residingReasonIfNot}
                onChange={e => setFormData({ ...formData, residingReasonIfNot: e.target.value })}
                className="w-full text-xs p-2 rounded-lg border border-rose-300 bg-rose-50"
              />
            </div>
          )}
        </div>

        {/* Section 7: Staff Table (Matrix from PDF Page 2) */}
        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="bg-slate-100 px-4 py-2.5 border-b border-slate-200">
            <h3 className="text-xs font-bold text-slate-800">
              7. वर्तमान में कार्यरत कर्मचारियों की जानकारी (संख्या)
            </h3>
            <p className="text-[10px] text-slate-500">भृत्य, रसोईयां, चौकीदार, होमगार्ड (पुरुष / महिला)</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-[11px] text-center">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th rowSpan={2} className="p-2 text-left min-w-[100px] border-r">कर्मचारी प्रकार</th>
                  <th colSpan={3} className="p-1 bg-blue-50/50 border-r text-blue-900 font-bold">पुरुष</th>
                  <th colSpan={3} className="p-1 bg-rose-50/50 text-rose-900 font-bold">महिला</th>
                </tr>
                <tr className="border-b border-slate-200 text-[10px] text-slate-600">
                  <th className="p-1">स्थायी</th>
                  <th className="p-1">संविदा</th>
                  <th className="p-1 border-r">दैनिक</th>
                  <th className="p-1">स्थायी</th>
                  <th className="p-1">संविदा</th>
                  <th className="p-1">दैनिक</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {[
                  { key: 'peon', label: 'भृत्य' },
                  { key: 'cook', label: 'रसोईयां' },
                  { key: 'guard', label: 'चौकीदार' },
                  { key: 'homeguard', label: 'होमगार्ड' }
                ].map(r => (
                  <tr key={r.key} className="hover:bg-slate-50">
                    <td className="p-2 text-left font-semibold text-slate-700 border-r">{r.label}</td>
                    <td className="p-1"><input type="number" min="0" value={formData.staff[r.key].mReg} onChange={e => handleStaffChange(r.key, 'mReg', e.target.value)} className="w-10 text-center border rounded p-0.5" /></td>
                    <td className="p-1"><input type="number" min="0" value={formData.staff[r.key].mCont} onChange={e => handleStaffChange(r.key, 'mCont', e.target.value)} className="w-10 text-center border rounded p-0.5" /></td>
                    <td className="p-1 border-r"><input type="number" min="0" value={formData.staff[r.key].mDaily} onChange={e => handleStaffChange(r.key, 'mDaily', e.target.value)} className="w-10 text-center border rounded p-0.5" /></td>
                    <td className="p-1"><input type="number" min="0" value={formData.staff[r.key].fReg} onChange={e => handleStaffChange(r.key, 'fReg', e.target.value)} className="w-10 text-center border rounded p-0.5" /></td>
                    <td className="p-1"><input type="number" min="0" value={formData.staff[r.key].fCont} onChange={e => handleStaffChange(r.key, 'fCont', e.target.value)} className="w-10 text-center border rounded p-0.5" /></td>
                    <td className="p-1"><input type="number" min="0" value={formData.staff[r.key].fDaily} onChange={e => handleStaffChange(r.key, 'fDaily', e.target.value)} className="w-10 text-center border rounded p-0.5" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 9: Infrastructure & Amenities */}
        <div className="border border-slate-200 rounded-xl p-4 space-y-3">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider text-emerald-900">
            9. छात्रावास भवन एवं मूलभूत सुविधाएं
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block text-[11px] text-slate-600 mb-1">भवन उपलब्धता</label>
              <select value={formData.buildingAvailability} onChange={e => setFormData({ ...formData, buildingAvailability: e.target.value })} className="w-full p-2 border rounded-lg bg-white">
                <option value="पर्याप्त">पर्याप्त</option>
                <option value="अपर्याप्त">अपर्याप्त</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] text-slate-600 mb-1">भवन स्वयं का है?</label>
              <select value={formData.buildingOwned} onChange={e => setFormData({ ...formData, buildingOwned: e.target.value })} className="w-full p-2 border rounded-lg bg-white">
                <option value="हाँ">हाँ</option>
                <option value="नहीं">नहीं (किराया/अन्य)</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] text-slate-600 mb-1">उपयोगी शौचालय संख्या</label>
              <input type="number" min="0" value={formData.usableToilets} onChange={e => setFormData({ ...formData, usableToilets: e.target.value })} className="w-full p-2 border rounded-lg text-center font-bold" />
            </div>
            <div>
              <label className="block text-[11px] text-slate-600 mb-1">अनुपयोगी शौचालय</label>
              <input type="number" min="0" value={formData.unusableToilets} onChange={e => setFormData({ ...formData, unusableToilets: e.target.value })} className="w-full p-2 border rounded-lg text-center text-rose-700" />
            </div>
            <div>
              <label className="block text-[11px] text-slate-600 mb-1">अहाता (Boundary Wall)?</label>
              <select value={formData.boundaryWallAvailable} onChange={e => setFormData({ ...formData, boundaryWallAvailable: e.target.value })} className="w-full p-2 border rounded-lg bg-white">
                <option value="हाँ">हाँ</option>
                <option value="नहीं">नहीं</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] text-slate-600 mb-1">विद्युत व सोलर सुविधा?</label>
              <select value={formData.solarAvailable} onChange={e => setFormData({ ...formData, solarAvailable: e.target.value })} className="w-full p-2 border rounded-lg bg-white">
                <option value="हाँ">दोनों उपलब्ध (विद्युत व सोलर)</option>
                <option value="केवल विद्युत">केवल विद्युत</option>
                <option value="केवल सोलर">केवल सोलर</option>
                <option value="नहीं">कोई नहीं</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 11: Security & Modern Facilities */}
        <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-3">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 text-emerald-900">
            <Shield className="w-4 h-4 text-emerald-600" /> 11. CCTV, कंप्यूटर, RO एवं सुरक्षा
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div>
              <label className="block text-[11px] text-slate-600 mb-1">CCTV चालू हालत में?</label>
              <select value={formData.cctvWorking} onChange={e => setFormData({ ...formData, cctvWorking: e.target.value })} className="w-full p-2 border rounded-lg bg-white font-medium">
                <option value="हाँ">हाँ (चालू)</option>
                <option value="नहीं">नहीं (खराब/अनुपलब्ध)</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] text-slate-600 mb-1">CCTV संख्या</label>
              <input type="number" min="0" value={formData.cctvCount} onChange={e => setFormData({ ...formData, cctvCount: e.target.value })} className="w-full p-2 border rounded-lg text-center" />
            </div>
            <div>
              <label className="block text-[11px] text-slate-600 mb-1">RO वाटर चालू?</label>
              <select value={formData.roWorking} onChange={e => setFormData({ ...formData, roWorking: e.target.value })} className="w-full p-2 border rounded-lg bg-white font-medium">
                <option value="हाँ">हाँ (चालू)</option>
                <option value="नहीं">नहीं (खराब)</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] text-slate-600 mb-1">भोजन की गुणवत्ता</label>
              <select value={formData.foodQuality} onChange={e => setFormData({ ...formData, foodQuality: e.target.value })} className="w-full p-2 border rounded-lg bg-white font-bold text-slate-800">
                <option value="अच्छी">अच्छी</option>
                <option value="संतोषजनक">संतोषजनक</option>
                <option value="अच्छी नहीं है">अच्छी नहीं है</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-2">
            <div>
              <label className="block text-[11px] text-slate-600 mb-1">वरिष्ठ अधिकारियों व टोल-फ्री नंबर दीवारों पर अंकित?</label>
              <select value={formData.officerNumbersOnWall} onChange={e => setFormData({ ...formData, officerNumbersOnWall: e.target.value })} className="w-full p-2 border rounded-lg bg-white">
                <option value="हाँ">हाँ</option>
                <option value="नहीं">नहीं</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] text-slate-600 mb-1">शिकायत पेटी का संधारण है?</label>
              <select value={formData.complaintBoxMaintained} onChange={e => setFormData({ ...formData, complaintBoxMaintained: e.target.value })} className="w-full p-2 border rounded-lg bg-white">
                <option value="हाँ">हाँ</option>
                <option value="नहीं">नहीं</option>
              </select>
            </div>
          </div>
        </div>

        {/* Remarks */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            12. टीप (निरीक्षणकर्ता की विस्तृत टिप्पणी एवं सुधार हेतु निर्देश):
          </label>
          <textarea
            rows={3}
            value={formData.remarks}
            onChange={e => setFormData({ ...formData, remarks: e.target.value })}
            placeholder="छात्रावास की सुरक्षा, भोजन, स्वच्छता, अधीक्षक उपस्थिति पर विस्तृत टीप लिखें..."
            className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
          ></textarea>
        </div>

        {/* Photo & GPS Capture */}
        <GeoPhotoCapture
          photoUrl={formData.photoUrl}
          latitude={formData.latitude}
          longitude={formData.longitude}
          geoAccuracy={formData.geoAccuracy}
          panchayat={formData.panchayat || officer?.panchayat}
          officerName={formData.officerName || officer?.name}
          categoryLabel="छात्रावास / आश्रम निरीक्षण"
          themeColor="emerald"
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
            className="flex-1 sm:flex-none bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold py-3 px-6 rounded-xl shadow-md flex items-center justify-center gap-1.5 transition"
          >
            <Send className="w-4 h-4" /> फाइनल जमा करें (Submit)
          </button>
        </div>

      </div>
    </div>
  );
}

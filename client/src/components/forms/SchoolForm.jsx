import React, { useState } from 'react';
import { GraduationCap, Calendar, User, BookOpen, Camera, Save, Send, ArrowLeft } from 'lucide-react';
import { API } from '../../api';
import { DISTRICT_BLOCKS, getPanchayatsForBlock, getTodayDateString, getOfficerPanchayats } from '../../constants';
import GeoPhotoCapture from '../GeoPhotoCapture';


export default function SchoolForm({ officer, onBack, onSuccess, initialData = null }) {
  const isOfficer = officer && officer.role !== 'admin';
  const officerPanchayats = getOfficerPanchayats(officer);
  const today = getTodayDateString();

  const [formData, setFormData] = useState(() => {
    if (initialData) return initialData;
    return {
      date: today,
      month: officer?.selectedMonth || new Date().toLocaleString('hi-IN', { month: 'long' }),
      officerId: officer?.id || '',
      officerName: officer?.name || '',
      officerDesignation: officer?.designation || '',
      officerMobile: officer?.mobile || '',
      block: officer?.block || 'बड़ेराजपुर',
      district: officer?.district || 'कोण्डागांव',
      panchayat: officerPanchayats[0] || officer?.panchayats?.[0] || officer?.panchayat || '',
      schoolName: '',
      schoolLevel: 'प्राथमिक',
      sankul: '',
      // Teachers
      teachersPosted: '',
      teachersPresent: '',
      teacherPunctuality: 'हाँ',
      // Students
      studentsEnrolled: '',
      studentsPresent: '',
      // Checkpoints
      booksUniformsDistributed: 'हाँ',
      academicCalendarFollowed: 'हाँ',
      buildingCondition: 'उत्तम',
      waterAvailable: 'उपलब्ध',
      electricityAvailable: 'उपलब्ध',
      toiletAvailable: 'उपलब्ध',
      smcMeetingRegular: 'हाँ',
      labLibraryUsed: 'हाँ',
      studentLearningLevel: 'सामान्य',
      midDayMeal: 'नियमित एवं गुणवत्तायुक्त',
      baglessDay: 'हाँ',
      teacherDiaryMaintained: 'हाँ',
      homeworkGivenAndChecked: 'हाँ',
      // Academic notes
      academicNotes: ['', '', '', ''],
      remarks: '',
      headmasterName: '',
      headmasterDesignation: 'प्रधान पाठक',
      photoUrl: '',
      latitude: '',
      longitude: '',
      geoAccuracy: ''
    };
  });

  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const handleAcademicNoteChange = (idx, val) => {
    const updated = [...formData.academicNotes];
    updated[idx] = val;
    setFormData({ ...formData, academicNotes: updated });
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
    if (!isDraft && !formData.schoolName) {
      alert('कृपया शाला का नाम भरें।');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...formData,
        isDraft,
        basicAmenities: `पानी: ${formData.waterAvailable}, बिजली: ${formData.electricityAvailable}, शौचालय: ${formData.toiletAvailable}`,
        academicRemarks: formData.academicNotes.filter(n => n.trim()).join(' | '),
        status: isDraft ? 'ड्राफ्ट (लंबित)' : 'जमा किया गया (पूर्ण)'
      };
      const res = await API.saveInspection('school', payload);
      if (res.success) {
        alert(isDraft ? 'ड्राफ्ट सुरक्षित कर लिया गया है।' : 'शाला निरीक्षण सफलतापूर्वक जमा किया गया!');
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
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-indigo-900 text-white p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-xs bg-white/20 hover:bg-white/30 py-1.5 px-3 rounded-lg transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> वापस
          </button>
          <span className="text-xs bg-blue-900/60 py-1 px-2.5 rounded-full border border-blue-400/30">
            प्रपत्र: School.pdf
          </span>
        </div>
        <div className="mt-3 text-center">
          <div className="inline-flex p-2.5 bg-white/10 rounded-2xl mb-2">
            <GraduationCap className="w-7 h-7 text-amber-300" />
          </div>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight">शाला निरीक्षण / अवलोकन प्रतिवेदन</h2>
          <p className="text-xs text-blue-200">जिला - कोण्डागांव (छ०ग०) • स्कूल शिक्षा विभाग</p>
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-6">

        {/* 1. Preliminary Details */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <User className="w-4 h-4 text-blue-600" /> प्रारंभिक जानकारी
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">1. निरीक्षण दिनांक</label>
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
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">माह</label>
              <input
                type="text"
                value={formData.month}
                onChange={e => setFormData({ ...formData, month: e.target.value })}
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
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">2. विकासखण्ड</label>
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

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">3. शाला का नाम *</label>
              <input
                type="text"
                required
                placeholder="उदा. प्रा.शा. विश्रामपुरी"
                value={formData.schoolName}
                onChange={e => setFormData({ ...formData, schoolName: e.target.value })}
                className="w-full text-xs p-2.5 rounded-lg border border-blue-300 bg-blue-50/30 focus:bg-white font-semibold text-slate-800"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">शाला स्तर</label>
              <select
                value={formData.schoolLevel}
                onChange={e => setFormData({ ...formData, schoolLevel: e.target.value })}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white"
              >
                <option value="प्राथमिक">प्राथमिक शाला</option>
                <option value="माध्यमिक">माध्यमिक शाला</option>
                <option value="हाई स्कूल">हाई स्कूल</option>
                <option value="हायर सेकेंडरी">हायर सेकेंडरी स्कूल</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">4. संकुल का नाम</label>
              <input
                type="text"
                placeholder="संकुल का नाम"
                value={formData.sankul}
                onChange={e => setFormData({ ...formData, sankul: e.target.value })}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white"
              />
            </div>
          </div>
        </div>

        {/* 2. Teachers & Students Matrix */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
            <h4 className="text-xs font-bold text-slate-800 mb-3 text-blue-900">
              5 & 6. शिक्षक संख्या एवं उपस्थिति
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="block text-[11px] text-slate-600 mb-1">कुल पदस्थ शिक्षक</label>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={formData.teachersPosted}
                  onChange={e => setFormData({ ...formData, teachersPosted: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-300 text-center font-bold"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-600 mb-1">उपस्थित शिक्षक</label>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={formData.teachersPresent}
                  onChange={e => setFormData({ ...formData, teachersPresent: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-300 text-center font-bold text-emerald-700"
                />
              </div>
            </div>
            <div className="mt-3">
              <label className="block text-[11px] text-slate-600 mb-1">शिक्षकों की समय पर उपस्थिति?</label>
              <div className="flex gap-4 text-xs font-medium">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="punctuality"
                    checked={formData.teacherPunctuality === 'हाँ'}
                    onChange={() => setFormData({ ...formData, teacherPunctuality: 'हाँ' })}
                  /> हाँ
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="punctuality"
                    checked={formData.teacherPunctuality === 'नहीं'}
                    onChange={() => setFormData({ ...formData, teacherPunctuality: 'नहीं' })}
                  /> नहीं
                </label>
              </div>
            </div>
          </div>

          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
            <h4 className="text-xs font-bold text-slate-800 mb-3 text-blue-900">
              7. शाला में दर्ज एवं छात्र उपस्थिति
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="block text-[11px] text-slate-600 mb-1">कुल दर्ज छात्र (Enrolled)</label>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={formData.studentsEnrolled}
                  onChange={e => setFormData({ ...formData, studentsEnrolled: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-300 text-center font-bold"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-600 mb-1">उपस्थित छात्र (Present)</label>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={formData.studentsPresent}
                  onChange={e => setFormData({ ...formData, studentsPresent: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-300 text-center font-bold text-blue-700"
                />
              </div>
            </div>
            <div className="mt-3 text-center">
              <span className="text-[11px] text-slate-500">
                उपस्थिति प्रतिशत: {formData.studentsEnrolled && formData.studentsPresent ? `${Math.round((formData.studentsPresent / formData.studentsEnrolled) * 100)}%` : '0%'}
              </span>
            </div>
          </div>
        </div>

        {/* 3. 19-Points Questionnaire Checklist */}
        <div className="border border-slate-200 rounded-xl p-4 space-y-4">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-200">
            8 से 18. मुख्य निरीक्षण बिन्दु
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                8. क्या पाठ्य सामग्री एवं गणवेश वितरण किया गया?
              </label>
              <select
                value={formData.booksUniformsDistributed}
                onChange={e => setFormData({ ...formData, booksUniformsDistributed: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg bg-white"
              >
                <option value="हाँ">हाँ</option>
                <option value="नहीं">नहीं</option>
                <option value="आंशिक">आंशिक</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                9. वार्षिक शैक्षणिक कैलेण्डर अनुरूप अध्ययन?
              </label>
              <select
                value={formData.academicCalendarFollowed}
                onChange={e => setFormData({ ...formData, academicCalendarFollowed: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg bg-white"
              >
                <option value="हाँ">हाँ</option>
                <option value="नहीं">नहीं</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                10. शाला भवन की साफ-सफाई, रंगरोगन, रखरखाव:
              </label>
              <select
                value={formData.buildingCondition}
                onChange={e => setFormData({ ...formData, buildingCondition: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg bg-white"
              >
                <option value="अतिउत्तम">अतिउत्तम</option>
                <option value="उत्तम">उत्तम</option>
                <option value="अच्छा">अच्छा</option>
                <option value="खराब">खराब</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                11. मूलभूत सुविधाएं (पानी / बिजली / शौचालय):
              </label>
              <div className="grid grid-cols-3 gap-1">
                <select
                  value={formData.waterAvailable}
                  onChange={e => setFormData({ ...formData, waterAvailable: e.target.value })}
                  className="p-1.5 border border-slate-300 rounded text-[11px]"
                >
                  <option value="पानी उपलब्ध">पानी: उपलब्ध</option>
                  <option value="पानी अनुपलब्ध">पानी: नहीं</option>
                </select>
                <select
                  value={formData.electricityAvailable}
                  onChange={e => setFormData({ ...formData, electricityAvailable: e.target.value })}
                  className="p-1.5 border border-slate-300 rounded text-[11px]"
                >
                  <option value="बिजली उपलब्ध">बिजली: उपलब्ध</option>
                  <option value="बिजली अनुपलब्ध">बिजली: नहीं</option>
                </select>
                <select
                  value={formData.toiletAvailable}
                  onChange={e => setFormData({ ...formData, toiletAvailable: e.target.value })}
                  className="p-1.5 border border-slate-300 rounded text-[11px]"
                >
                  <option value="शौचालय उपलब्ध">शौचालय: उपलब्ध</option>
                  <option value="शौचालय अनुपलब्ध">शौचालय: नहीं</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                12. शाला विकास समिति (SMC) की नियमित बैठक?
              </label>
              <select
                value={formData.smcMeetingRegular}
                onChange={e => setFormData({ ...formData, smcMeetingRegular: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg bg-white"
              >
                <option value="हाँ">हाँ</option>
                <option value="नहीं">नहीं</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                13. प्रयोगशाला एवं पुस्तकालय का उपयोग?
              </label>
              <select
                value={formData.labLibraryUsed}
                onChange={e => setFormData({ ...formData, labLibraryUsed: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg bg-white"
              >
                <option value="हाँ">हाँ</option>
                <option value="नहीं">नहीं</option>
                <option value="लागू नहीं">लागू नहीं</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                14. विद्यार्थियों का अध्ययन स्तर (लिखने, पढ़ने, सीखने):
              </label>
              <select
                value={formData.studentLearningLevel}
                onChange={e => setFormData({ ...formData, studentLearningLevel: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg bg-white font-medium"
              >
                <option value="उत्कृष्ट">उत्कृष्ट</option>
                <option value="सामान्य">सामान्य</option>
                <option value="कमजोर">कमजोर (सुधार आवश्यक)</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                15. PM पोषण शक्ति (मध्यान्ह भोजन):
              </label>
              <select
                value={formData.midDayMeal}
                onChange={e => setFormData({ ...formData, midDayMeal: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg bg-white"
              >
                <option value="नियमित एवं गुणवत्तायुक्त">नियमित एवं गुणवत्तायुक्त</option>
                <option value="अनियमित">अनियमित</option>
                <option value="नहीं मिल रहा">नहीं मिल रहा / बंद</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                16. बैग लेस डे (शनिवार) का नियमित आयोजन?
              </label>
              <select
                value={formData.baglessDay}
                onChange={e => setFormData({ ...formData, baglessDay: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg bg-white"
              >
                <option value="हाँ">हाँ</option>
                <option value="नहीं">नहीं</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                17. शिक्षक दैनंदिनी नियमित संधारण?
              </label>
              <select
                value={formData.teacherDiaryMaintained}
                onChange={e => setFormData({ ...formData, teacherDiaryMaintained: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg bg-white"
              >
                <option value="हाँ">हाँ</option>
                <option value="नहीं">नहीं</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                18. विद्यार्थियों को नियमित गृहकार्य एवं जांच?
              </label>
              <select
                value={formData.homeworkGivenAndChecked}
                onChange={e => setFormData({ ...formData, homeworkGivenAndChecked: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg bg-white"
              >
                <option value="हाँ">हाँ</option>
                <option value="नहीं">नहीं</option>
              </select>
            </div>
          </div>
        </div>

        {/* 4. Item 19: Academic Remarks (Class-wise / Subject-wise) */}
        <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-2">
          <h4 className="text-xs font-bold text-slate-800">
            19. बच्चों का कक्षावार / विषयवार, अकादमिक स्तर पर टिप्पणी:
          </h4>
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 w-4">{i + 1}.</span>
              <input
                type="text"
                placeholder={`टिप्पणी बिन्दु ${i + 1}...`}
                value={formData.academicNotes[i]}
                onChange={e => handleAcademicNoteChange(i, e.target.value)}
                className="flex-1 text-xs p-2 rounded-lg border border-slate-300 bg-white"
              />
            </div>
          ))}
        </div>

        {/* 20. Remarks / Directives */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            टीप (निरीक्षणकर्ता की विस्तृत टिप्पणी एवं सुधार हेतु निर्देश):
          </label>
          <textarea
            rows={3}
            value={formData.remarks}
            onChange={e => setFormData({ ...formData, remarks: e.target.value })}
            placeholder="शाला परिसर, शिक्षक उपस्थिति, मध्यान्ह भोजन, स्वच्छता अथवा अन्य कमियों पर सुधार हेतु विस्तृत टीप लिखें..."
            className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          ></textarea>
        </div>

        {/* 5. Photo & GPS Capture */}
        <GeoPhotoCapture
          photoUrl={formData.photoUrl}
          latitude={formData.latitude}
          longitude={formData.longitude}
          geoAccuracy={formData.geoAccuracy}
          panchayat={formData.panchayat || officer?.panchayat}
          officerName={formData.officerName || officer?.name}
          categoryLabel="शाला निरीक्षण"
          themeColor="blue"
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

        {/* 6. Verification Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">संस्था प्रमुख का नाम व पदनाम</label>
            <input
              type="text"
              placeholder="उदा. श्री बी. आर. पटेल (प्रधान पाठक)"
              value={formData.headmasterName}
              onChange={e => setFormData({ ...formData, headmasterName: e.target.value })}
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">निरीक्षणकर्ता अधिकारी</label>
            <input
              type="text"
              readOnly
              value={`${formData.officerName} (${formData.officerDesignation})`}
              className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-slate-100 text-slate-600"
            />
          </div>
        </div>

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
            className="flex-1 sm:flex-none bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold py-3 px-6 rounded-xl shadow-md flex items-center justify-center gap-1.5 transition"
          >
            <Send className="w-4 h-4" /> फाइनल जमा करें (Submit)
          </button>
        </div>

      </div>
    </div>
  );
}

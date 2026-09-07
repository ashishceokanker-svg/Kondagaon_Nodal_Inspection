import React, { useState } from 'react';
import { Home, User, Calendar, MapPin, Camera, Save, Send, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { API } from '../../api';
import { DISTRICT_BLOCKS, getPanchayatsForBlock, getTodayDateString, getOfficerPanchayats } from '../../constants';
import GeoPhotoCapture from '../GeoPhotoCapture';


const CONSTRUCTION_STAGES = [
  'अप्रारंभ',
  'नींव (Foundation)',
  'प्लिंथ स्तर (Plinth Level)',
  'खिड़की स्तर (Window Level)',
  'लिंटल स्तर (Lintel Level)',
  'छत स्तर (Roof Level)',
  'ढलाई पूर्ण (Slab Cast)',
  'पूर्ण (Completed)'
];

export default function AwasForm({ officer, onBack, onSuccess, initialData = null }) {
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

      // Beneficiary details
      beneficiaryName: '',
      fatherName: '',
      category: 'ST', // ST / SC / OBC / General
      beneficiaryId: '', // PMAY ID
      installmentAmount: '25,000/-',
      installmentDate: new Date().toISOString().slice(0, 10),
      fundUtilization: 'उचित उपयोग किया गया',

      // Construction stage
      currentStage: 'प्लिंथ स्तर (Plinth Level)',

      // Construction materials on-site
      materials: {
        bricks: 'उपलब्ध (2000 ईंट)',
        sand: '1 ट्रैक्टर',
        cement: '10 बोरी',
        steel: '2 क्विंटल',
        aggregate: '1 ट्रैक्टर',
        other: 'पानी की व्यवस्था उपलब्ध'
      },

      remarks: '',
      photoUrl: '',
      latitude: '',
      longitude: '',
      geoAccuracy: ''
    };
  });

  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const handleMaterialChange = (field, val) => {
    setFormData(prev => ({
      ...prev,
      materials: { ...prev.materials, [field]: val }
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
    if (!isDraft && (!formData.beneficiaryName || !formData.village)) {
      alert('कृपया हितग्राही का नाम एवं ग्राम का नाम दर्ज करें।');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...formData,
        isDraft,
        status: isDraft ? 'ड्राफ्ट (लंबित)' : 'जमा किया गया (पूर्ण)'
      };
      const res = await API.saveInspection('awas', payload);
      if (res.success) {
        alert(isDraft ? 'ड्राफ्ट सुरक्षित कर लिया गया है।' : 'प्रधानमंत्री आवास स्थल निरीक्षण सफलतापूर्वक जमा किया गया!');
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
      <div className="bg-gradient-to-r from-cyan-800 via-teal-800 to-slate-900 text-white p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-xs bg-white/20 hover:bg-white/30 py-1.5 px-3 rounded-lg transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> वापस
          </button>
          <span className="text-xs bg-cyan-950/60 py-1 px-2.5 rounded-full border border-cyan-400/30">
            प्रारूप: Awas Nirikshan
          </span>
        </div>
        <div className="mt-3 text-center">
          <div className="inline-flex p-2.5 bg-white/10 rounded-2xl mb-2">
            <Home className="w-7 h-7 text-cyan-200" />
          </div>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight">प्रधानमंत्री आवास स्थल निरीक्षण प्रारूप</h2>
          <p className="text-xs text-cyan-200">पंचायत एवं ग्रामीण विकास विभाग • जिला कोण्डागांव (छ०ग०)</p>
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-6">

        {/* 1. Beneficiary Info */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <User className="w-4 h-4 text-cyan-700" /> प्रारंभिक एवं हितग्राही की जानकारी
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">हितग्राही का नाम *</label>
              <input
                type="text"
                required
                placeholder="उदा. श्री बुधराम मरकाम"
                value={formData.beneficiaryName}
                onChange={e => setFormData({ ...formData, beneficiaryName: e.target.value })}
                className="w-full text-xs p-2.5 rounded-lg border border-cyan-300 bg-cyan-50/20 focus:bg-white font-semibold text-slate-800"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">पिता / पति का नाम</label>
              <input
                type="text"
                placeholder="पिता / पति का नाम"
                value={formData.fatherName}
                onChange={e => setFormData({ ...formData, fatherName: e.target.value })}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">वर्ग (Category)</label>
              <select
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value })}
                className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white font-medium"
              >
                <option value="ST">ST (अ.ज.जा.)</option>
                <option value="SC">SC (अ.जा.)</option>
                <option value="OBC">OBC (अ.पि.व.)</option>
                <option value="General">सामान्य</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">हितग्राही क्रमांक (ID)</label>
              <input
                type="text"
                placeholder="उदा. CG1234567"
                value={formData.beneficiaryId}
                onChange={e => setFormData({ ...formData, beneficiaryId: e.target.value })}
                className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">ग्राम का नाम *</label>
              <input
                type="text"
                required
                placeholder="ग्राम का नाम"
                value={formData.village}
                onChange={e => setFormData({ ...formData, village: e.target.value })}
                className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">जनपद पंचायत (विकासखण्ड)</label>
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
                className={`w-full text-xs p-2 rounded-lg border border-slate-300 font-medium ${
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
                className={`w-full text-xs p-2 rounded-lg border border-slate-300 font-medium ${
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
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">जिला</label>
              <input
                type="text"
                disabled
                value="कोण्डागांव (छ०ग०)"
                className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-slate-100 text-slate-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-200 text-xs">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">प्रदत्त किश्त की राशि</label>
              <input
                type="text"
                value={formData.installmentAmount}
                onChange={e => setFormData({ ...formData, installmentAmount: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg bg-white font-bold text-cyan-900"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">किश्त दिनांक</label>
              <input
                type="date"
                max={today}
                value={formData.installmentDate}
                onChange={e => {
                  const val = e.target.value;
                  if (val > today) {
                    alert('भविष्य (आगे) की तारीख का चयन नहीं किया जा सकता। कृपया वर्तमान या पूर्व की तारीख चुनें।');
                    return;
                  }
                  setFormData({ ...formData, installmentDate: val });
                }}
                className="w-full p-2 border border-slate-300 rounded-lg bg-white font-medium"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">प्रदत्त राशि का उपयोग</label>
              <select
                value={formData.fundUtilization}
                onChange={e => setFormData({ ...formData, fundUtilization: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg bg-white font-medium"
              >
                <option value="उचित उपयोग किया गया">उचित उपयोग किया गया</option>
                <option value="आंशिक उपयोग">आंशिक उपयोग</option>
                <option value="दुरुपयोग / कार्य नहीं हुआ">दुरुपयोग / कार्य नहीं हुआ</option>
              </select>
            </div>
          </div>
        </div>

        {/* 2. Construction Stage Selector */}
        <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-3">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider text-cyan-900">
            आवास की वर्तमान स्थिति (प्रगति स्तर):
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {CONSTRUCTION_STAGES.map(stage => {
              const isSelected = formData.currentStage === stage;
              return (
                <button
                  key={stage}
                  type="button"
                  onClick={() => setFormData({ ...formData, currentStage: stage })}
                  className={`p-2.5 rounded-xl border text-xs font-bold text-center transition flex flex-col items-center justify-center gap-1 ${
                    isSelected
                      ? 'bg-cyan-700 text-white border-cyan-800 shadow-md ring-2 ring-cyan-400'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  <span>{stage}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Materials Available On Site */}
        <div className="border border-slate-200 rounded-xl p-4 space-y-3">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider text-cyan-900">
            उपलब्ध निर्माण सामग्री (मात्रा) :—
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block text-[11px] text-slate-600 mb-1">ईंट (Bricks)</label>
              <input
                type="text"
                placeholder="उदा. 3000 नग"
                value={formData.materials.bricks}
                onChange={e => handleMaterialChange('bricks', e.target.value)}
                className="w-full p-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-600 mb-1">रेत (Sand)</label>
              <input
                type="text"
                placeholder="उदा. 2 ट्रैक्टर"
                value={formData.materials.sand}
                onChange={e => handleMaterialChange('sand', e.target.value)}
                className="w-full p-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-600 mb-1">सीमेंट (Cement)</label>
              <input
                type="text"
                placeholder="उदा. 15 बोरी"
                value={formData.materials.cement}
                onChange={e => handleMaterialChange('cement', e.target.value)}
                className="w-full p-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-600 mb-1">छड़ / सरिया (Steel)</label>
              <input
                type="text"
                placeholder="उदा. 3 क्विंटल"
                value={formData.materials.steel}
                onChange={e => handleMaterialChange('steel', e.target.value)}
                className="w-full p-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-600 mb-1">गिट्टी (Aggregate)</label>
              <input
                type="text"
                placeholder="उदा. 1 ट्रैक्टर"
                value={formData.materials.aggregate}
                onChange={e => handleMaterialChange('aggregate', e.target.value)}
                className="w-full p-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-600 mb-1">अन्य (Other)</label>
              <input
                type="text"
                placeholder="अन्य निर्माण सामग्री..."
                value={formData.materials.other}
                onChange={e => handleMaterialChange('other', e.target.value)}
                className="w-full p-2 border rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* 4. Remarks */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            टीप (निरीक्षणकर्ता की विस्तृत टिप्पणी एवं सुधार हेतु निर्देश):
          </label>
          <textarea
            rows={3}
            value={formData.remarks}
            onChange={e => setFormData({ ...formData, remarks: e.target.value })}
            placeholder="आवास निर्माण में विलंब का कारण अथवा आगामी किश्त की अनुशंसा..."
            className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-cyan-600 focus:outline-none"
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
          categoryLabel="प्रधानमंत्री आवास निरीक्षण"
          themeColor="cyan"
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
            className="flex-1 sm:flex-none bg-cyan-800 hover:bg-cyan-900 text-white text-xs font-bold py-3 px-6 rounded-xl shadow-md flex items-center justify-center gap-1.5 transition"
          >
            <Send className="w-4 h-4" /> फाइनल जमा करें (Submit)
          </button>
        </div>

      </div>
    </div>
  );
}

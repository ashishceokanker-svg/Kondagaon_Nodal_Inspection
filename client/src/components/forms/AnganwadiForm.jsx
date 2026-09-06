import React, { useState } from 'react';
import { Baby, Calendar, User, MapPin, Camera, Save, Send, CheckCircle2, ArrowLeft } from 'lucide-react';
import { API } from '../../api';
import { DISTRICT_BLOCKS, getPanchayatsForBlock } from '../../constants';
import GeoPhotoCapture from '../GeoPhotoCapture';




const DEFAULT_RATION_ROWS = [
  { id: 1, category: '06 माह से 03 वर्ष सामान्य बच्चे हेतु', supply: '', prevBalance: '', total: '', distributed: '', availablePackets: '' },
  { id: 2, category: '06 माह से 03 वर्ष गंभीर कुपोषित बच्चों हेतु', supply: '', prevBalance: '', total: '', distributed: '', availablePackets: '' },
  { id: 3, category: '3 वर्ष से 6 वर्ष नाश्ता हेतु', supply: '', prevBalance: '', total: '', distributed: '', availablePackets: '' },
  { id: 4, category: '3 वर्ष से 6 गंभीर कुपोषित बच्चों हेतु', supply: '', prevBalance: '', total: '', distributed: '', availablePackets: '' },
  { id: 5, category: 'गर्भवती महिलाएं हेतु', supply: '', prevBalance: '', total: '', distributed: '', availablePackets: '' },
  { id: 6, category: 'शिशुवती महिलाएं हेतु', supply: '', prevBalance: '', total: '', distributed: '', availablePackets: '' },
  { id: 7, category: '11 से 14 वर्ष शाला त्यागी किशोरी हेतु', supply: '', prevBalance: '', total: '', distributed: '', availablePackets: '' },
  { id: 8, category: 'गर्भवती महिला / बच्चों हेतु आटा', supply: '', prevBalance: '', total: '', distributed: '', availablePackets: '' },
];

export default function AnganwadiForm({ officer, onBack, onSuccess, initialData = null }) {
  const [formData, setFormData] = useState(() => {
    if (initialData) return initialData;
    return {
      date: new Date().toISOString().slice(0, 10),
      officerId: officer?.id || '',
      officerName: officer?.name || '',
      officerDesignation: officer?.designation || '',
      officerMobile: officer?.mobile || '',
      block: officer?.block || 'बड़ेराजपुर',
      district: officer?.district || 'कोण्डागांव',
      panchayat: officer?.panchayats?.[0] || '',
      centerName: '',
      workerName: '',
      workerMobile: '',
      beneficiaries: {
        age06m3y: '',
        age3y6y: '',
        pregnant: '',
        lactating: '',
        adolescentGirls: '',
        total: '',
        remarks: ''
      },
      rationRows: DEFAULT_RATION_ROWS,
      remarks: '',
      photoUrl: '',
      latitude: '',
      longitude: '',
      geoAccuracy: ''
    };
  });

  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Beneficiary total calculation
  const handleBeneficiaryChange = (field, val) => {
    const updated = { ...formData.beneficiaries, [field]: val };
    const num06m3y = parseInt(updated.age06m3y || 0);
    const num3y6y = parseInt(updated.age3y6y || 0);
    const numPreg = parseInt(updated.pregnant || 0);
    const numLact = parseInt(updated.lactating || 0);
    const numAdo = parseInt(updated.adolescentGirls || 0);
    updated.total = (num06m3y + num3y6y + numPreg + numLact + numAdo).toString();
    setFormData({ ...formData, beneficiaries: updated });
  };

  const handleRationChange = (index, field, value) => {
    const updated = [...formData.rationRows];
    updated[index][field] = value;
    // auto calculate total = supply + prevBalance
    if (field === 'supply' || field === 'prevBalance') {
      const sup = parseFloat(updated[index].supply || 0);
      const prev = parseFloat(updated[index].prevBalance || 0);
      updated[index].total = (sup + prev).toString();
    }
    setFormData({ ...formData, rationRows: updated });
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
    if (!isDraft && (!formData.centerName || !formData.workerName)) {
      alert('कृपया आंगनबाड़ी केन्द्र का नाम एवं कार्यकर्ता का नाम भरें।');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...formData,
        isDraft,
        status: isDraft ? 'ड्राफ्ट (लंबित)' : 'जमा किया गया (पूर्ण)'
      };
      const res = await API.saveInspection('anganwadi', payload);
      if (res.success) {
        alert(isDraft ? 'ड्राफ्ट सुरक्षित कर लिया गया है।' : 'आंगनबाड़ी निरीक्षण सफलतापूर्वक जमा किया गया!');
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
      <div className="bg-gradient-to-r from-pink-700 via-rose-700 to-rose-900 text-white p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-xs bg-white/20 hover:bg-white/30 py-1.5 px-3 rounded-lg transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> वापस
          </button>
          <span className="text-xs bg-pink-900/60 py-1 px-2.5 rounded-full border border-pink-400/30">
            प्रपत्र: Aganbadi.pdf
          </span>
        </div>
        <div className="mt-3 text-center">
          <div className="inline-flex p-2.5 bg-white/10 rounded-2xl mb-2">
            <Baby className="w-7 h-7 text-pink-200" />
          </div>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight">आंगनबाड़ी केन्द्र निरीक्षण प्रतिवेदन</h2>
          <p className="text-xs text-pink-200">कार्यालय महिला एवं बाल विकास विभाग / जिला प्रशासन</p>
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-6">

        {/* 1. Preliminary Info */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <User className="w-4 h-4 text-pink-600" /> प्रारंभिक जानकारी
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">दिनांक</label>
              <input
                type="date"
                value={formData.date}
                onChange={e => setFormData({ ...formData, date: e.target.value })}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">नोडल अधिकारी का नाम</label>
              <input
                type="text"
                value={formData.officerName}
                onChange={e => setFormData({ ...formData, officerName: e.target.value })}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white font-medium"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">पदनाम</label>
              <input
                type="text"
                value={formData.officerDesignation}
                onChange={e => setFormData({ ...formData, officerDesignation: e.target.value })}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">मोबाइल नंबर</label>
              <input
                type="tel"
                value={formData.officerMobile}
                onChange={e => setFormData({ ...formData, officerMobile: e.target.value })}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-200">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">1. विकासखण्ड का नाम</label>
              <select
                value={formData.block}
                onChange={e => {
                  const newBlock = e.target.value;
                  const panchs = getPanchayatsForBlock(newBlock);
                  setFormData({ 
                    ...formData, 
                    block: newBlock, 
                    panchayat: panchs[0] || '' 
                  });
                }}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white font-medium"
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
                onChange={e => setFormData({ ...formData, panchayat: e.target.value })}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white font-medium"
              >
                <option value="">-- ग्राम पंचायत चुनें --</option>
                {getPanchayatsForBlock(formData.block).map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">2. आंगनबाड़ी केन्द्र का नाम *</label>
              <input
                type="text"
                required
                placeholder="उदा. बांसकोट-1"
                value={formData.centerName}
                onChange={e => setFormData({ ...formData, centerName: e.target.value })}
                className="w-full text-xs p-2.5 rounded-lg border border-pink-300 bg-pink-50/30 focus:bg-white font-semibold text-slate-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">3. आंगनबाड़ी कार्यकर्ता का नाम *</label>
              <input
                type="text"
                required
                placeholder="कार्यकर्ता का नाम"
                value={formData.workerName}
                onChange={e => setFormData({ ...formData, workerName: e.target.value })}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white font-medium"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">कार्यकर्ता मोबाइल नंबर</label>
              <input
                type="tel"
                placeholder="कार्यकर्ता मोबाइल"
                value={formData.workerMobile}
                onChange={e => setFormData({ ...formData, workerMobile: e.target.value })}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white"
              />
            </div>
          </div>
        </div>

        {/* 2. Registered Beneficiaries Table */}
        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="bg-pink-50 px-4 py-2.5 border-b border-pink-200 flex items-center justify-between">
            <h3 className="text-xs font-bold text-pink-950">दर्ज हितग्राहियों की संख्या (Registered Beneficiaries)</h3>
            <span className="text-[11px] text-pink-800 font-medium">कुल योग: {formData.beneficiaries.total || 0}</span>
          </div>

          <div className="p-3 grid grid-cols-2 sm:grid-cols-3 gap-3 bg-white text-xs">
            <div>
              <label className="block text-[11px] text-slate-600 mb-1 font-medium">06 माह से 03 वर्ष</label>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={formData.beneficiaries.age06m3y}
                onChange={e => handleBeneficiaryChange('age06m3y', e.target.value)}
                className="w-full p-2 rounded-lg border border-slate-300 text-center font-bold text-slate-800"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-600 mb-1 font-medium">03 वर्ष से 06 वर्ष के बच्चे</label>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={formData.beneficiaries.age3y6y}
                onChange={e => handleBeneficiaryChange('age3y6y', e.target.value)}
                className="w-full p-2 rounded-lg border border-slate-300 text-center font-bold text-slate-800"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-600 mb-1 font-medium">गर्भवती महिलाएं</label>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={formData.beneficiaries.pregnant}
                onChange={e => handleBeneficiaryChange('pregnant', e.target.value)}
                className="w-full p-2 rounded-lg border border-slate-300 text-center font-bold text-slate-800"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-600 mb-1 font-medium">शिशुवती महिलाएं</label>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={formData.beneficiaries.lactating}
                onChange={e => handleBeneficiaryChange('lactating', e.target.value)}
                className="w-full p-2 rounded-lg border border-slate-300 text-center font-bold text-slate-800"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-600 mb-1 font-medium">11 से 14 वर्ष शाला त्यागी</label>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={formData.beneficiaries.adolescentGirls}
                onChange={e => handleBeneficiaryChange('adolescentGirls', e.target.value)}
                className="w-full p-2 rounded-lg border border-slate-300 text-center font-bold text-slate-800"
              />
            </div>
            <div>
              <label className="block text-[11px] text-pink-700 mb-1 font-bold">कुल योग (Total)</label>
              <input
                type="text"
                readOnly
                value={formData.beneficiaries.total || '0'}
                className="w-full p-2 rounded-lg border border-pink-300 bg-pink-50 text-center font-extrabold text-pink-900"
              />
            </div>
          </div>
          <div className="px-3 pb-3">
            <label className="block text-[11px] text-slate-600 mb-1 font-medium">रिमार्क (हितग्राही संबंधित टिप्पणी)</label>
            <input
              type="text"
              placeholder="रिमार्क..."
              value={formData.beneficiaries.remarks}
              onChange={e => handleBeneficiaryChange('remarks', e.target.value)}
              className="w-full p-2 rounded-lg border border-slate-300 text-xs"
            />
          </div>
        </div>

        {/* 3. Ration & Nutrition Stock Table */}
        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="bg-slate-100 px-4 py-2.5 border-b border-slate-200">
            <h3 className="text-xs font-bold text-slate-800">
              सामग्री प्रदाय, बचत एवं वितरण की स्थिति (8 श्रेणियां)
            </h3>
            <p className="text-[10px] text-slate-500">पीडीएफ प्रपत्र अनुसार मात्रा व पैकेट विवरण</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-[11px] text-left">
              <thead className="bg-slate-50 text-slate-700 border-b border-slate-200">
                <tr>
                  <th className="p-2 text-center w-8">क्र</th>
                  <th className="p-2 min-w-[140px]">हितग्राही वर्ग</th>
                  <th className="p-2 text-center">सामग्री प्रदाय</th>
                  <th className="p-2 text-center">पूर्व बचत</th>
                  <th className="p-2 text-center">कुल मात्रा</th>
                  <th className="p-2 text-center">वितरण</th>
                  <th className="p-2 text-center">उपलब्ध पैकेट</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {formData.rationRows.map((row, idx) => (
                  <tr key={row.id} className="hover:bg-slate-50/80">
                    <td className="p-2 text-center font-bold text-slate-500">{row.id}</td>
                    <td className="p-2 font-medium text-slate-800">{row.category}</td>
                    <td className="p-1">
                      <input
                        type="text"
                        placeholder="0"
                        value={row.supply}
                        onChange={e => handleRationChange(idx, 'supply', e.target.value)}
                        className="w-16 mx-auto block p-1 text-center border border-slate-300 rounded text-xs"
                      />
                    </td>
                    <td className="p-1">
                      <input
                        type="text"
                        placeholder="0"
                        value={row.prevBalance}
                        onChange={e => handleRationChange(idx, 'prevBalance', e.target.value)}
                        className="w-16 mx-auto block p-1 text-center border border-slate-300 rounded text-xs"
                      />
                    </td>
                    <td className="p-1">
                      <input
                        type="text"
                        placeholder="0"
                        value={row.total}
                        onChange={e => handleRationChange(idx, 'total', e.target.value)}
                        className="w-16 mx-auto block p-1 text-center border border-slate-200 bg-slate-100 rounded text-xs font-semibold"
                      />
                    </td>
                    <td className="p-1">
                      <input
                        type="text"
                        placeholder="0"
                        value={row.distributed}
                        onChange={e => handleRationChange(idx, 'distributed', e.target.value)}
                        className="w-16 mx-auto block p-1 text-center border border-slate-300 rounded text-xs"
                      />
                    </td>
                    <td className="p-1">
                      <input
                        type="text"
                        placeholder="0"
                        value={row.availablePackets}
                        onChange={e => handleRationChange(idx, 'availablePackets', e.target.value)}
                        className="w-16 mx-auto block p-1 text-center border border-slate-300 rounded text-xs"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 4. Notes / Remarks */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            टीप (निरीक्षणकर्ता की विस्तृत टिप्पणी एवं सुधार हेतु निर्देश):
          </label>
          <textarea
            rows={3}
            value={formData.remarks}
            onChange={e => setFormData({ ...formData, remarks: e.target.value })}
            placeholder="केन्द्र की स्वच्छता, पोषण स्तर, उपस्थिति अथवा अन्य कमियों पर विस्तृत टीप लिखें..."
            className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-pink-500 focus:outline-none"
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
          categoryLabel="आंगनबाड़ी केन्द्र निरीक्षण"
          themeColor="pink"
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
            className="flex-1 sm:flex-none bg-pink-700 hover:bg-pink-800 text-white text-xs font-bold py-3 px-6 rounded-xl shadow-md flex items-center justify-center gap-1.5 transition"
          >
            <Send className="w-4 h-4" /> फाइनल जमा करें (Submit)
          </button>
        </div>

      </div>
    </div>
  );
}

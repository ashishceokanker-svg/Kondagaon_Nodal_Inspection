import React, { useState } from 'react';
import { Wheat, Calendar, User, Camera, Save, Send, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { API } from '../../api';
import { DISTRICT_BLOCKS, getPanchayatsForBlock, getTodayDateString, getOfficerPanchayats } from '../../constants';
import GeoPhotoCapture from '../GeoPhotoCapture';


export default function PdsForm({ officer, onBack, onSuccess, initialData = null }) {
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

      // 01. Shop Details
      shopName: '',
      shopId: '',
      shopStatus: 'नियमित खुलती है', // नियमित / अनियमित / बंद

      // 03-16 Inspection Points
      declarationPast3MonthsOk: 'हाँ',
      riceFestivalHeld: 'हाँ',
      stockBySixth: 'हाँ',
      tollFreeBoardDisplayed: 'हाँ',
      stockBeneficiaryListDisplayed: 'हाँ',
      aplCards: '',
      bplCards: '',
      consultedCardHoldersCount: '5',
      shopOpensRegularly: 'हाँ',
      stockInFirstWeek: 'हाँ',
      vigilanceCommitteeVerifying: 'हाँ',
      weightAndQualityOk: 'हाँ',
      correctRateAndQtyGiven: 'हाँ',
      dealerBehavior: 'अच्छा है',
      givenInInstallments: 'नहीं (एकमुश्त)',

      remarks: '',
      photoUrl: '',
      latitude: '',
      longitude: '',
      geoAccuracy: ''
    };
  });

  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

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
    if (!isDraft && (!formData.shopName || !formData.shopId)) {
      alert('कृपया दुकान का नाम एवं आईडी क्रमांक दर्ज करें।');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...formData,
        isDraft,
        boardsDisplayed: `टोल फ्री: ${formData.tollFreeBoardDisplayed}, स्टॉक सूची: ${formData.stockBeneficiaryListDisplayed}`,
        status: isDraft ? 'ड्राफ्ट (लंबित)' : 'जमा किया गया (पूर्ण)'
      };
      const res = await API.saveInspection('pds', payload);
      if (res.success) {
        alert(isDraft ? 'ड्राफ्ट सुरक्षित कर लिया गया है।' : 'उचित मूल्य दुकान जांच सफलतापूर्वक जमा की गई!');
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
      <div className="bg-gradient-to-r from-amber-700 via-yellow-700 to-amber-900 text-white p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-xs bg-white/20 hover:bg-white/30 py-1.5 px-3 rounded-lg transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> वापस
          </button>
          <span className="text-xs bg-amber-950/60 py-1 px-2.5 rounded-full border border-amber-400/30">
            प्रपत्र: PDS.pdf
          </span>
        </div>
        <div className="mt-3 text-center">
          <div className="inline-flex p-2.5 bg-white/10 rounded-2xl mb-2">
            <Wheat className="w-7 h-7 text-amber-200" />
          </div>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight">शासकीय उचित मूल्य दुकान जांच पत्रक</h2>
          <p className="text-xs text-amber-200">खाद्य एवं नागरिक आपूर्ति विभाग • जिला कोण्डागांव</p>
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-6">

        {/* 01 & 02 Preliminary */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Wheat className="w-4 h-4 text-amber-600" /> दुकान एवं जांच का विवरण
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">01. दुकान का नाम *</label>
              <input
                type="text"
                required
                placeholder="उदा. प्राथमिक कृषि साख सहकारी समिति..."
                value={formData.shopName}
                onChange={e => setFormData({ ...formData, shopName: e.target.value })}
                className="w-full text-xs p-2.5 rounded-lg border border-amber-300 bg-amber-50/30 focus:bg-white font-semibold text-slate-800"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">आईडी क्रमांक (Shop ID) *</label>
              <input
                type="text"
                required
                placeholder="उदा. 432001005"
                value={formData.shopId}
                onChange={e => setFormData({ ...formData, shopId: e.target.value })}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">02. जांच की तिथि</label>
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
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">विकासखण्ड</label>
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
        </div>

        {/* 17 Inspection Points Checklist */}
        <div className="border border-slate-200 rounded-xl p-4 space-y-4">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-200">
            03 से 16. जांच बिन्दुवार स्थिति
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                03. विगत 3 माह घोषणा पत्र आधार पर राशन सामग्री स्थिति सही पाई गई?
              </label>
              <select
                value={formData.declarationPast3MonthsOk}
                onChange={e => setFormData({ ...formData, declarationPast3MonthsOk: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg bg-white font-medium"
              >
                <option value="हाँ">हाँ (सही पाई गई)</option>
                <option value="नहीं">नहीं (अंतर पाया गया)</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                04. विगत 3 माह में 'चावल उत्सव' आयोजन की स्थिति सही पाई गई?
              </label>
              <select
                value={formData.riceFestivalHeld}
                onChange={e => setFormData({ ...formData, riceFestivalHeld: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg bg-white font-medium"
              >
                <option value="हाँ">हाँ (आयोजित हुआ)</option>
                <option value="नहीं">नहीं</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                05. माह की 06 तारीख तक राशन सामग्री का भण्डारण सही हो रहा है?
              </label>
              <select
                value={formData.stockBySixth}
                onChange={e => setFormData({ ...formData, stockBySixth: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg bg-white"
              >
                <option value="हाँ">हाँ</option>
                <option value="नहीं">नहीं</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                06. कॉल सेंटर टोल-फ्री नंबर व सूचनाओं का प्रदर्शन है?
              </label>
              <select
                value={formData.tollFreeBoardDisplayed}
                onChange={e => setFormData({ ...formData, tollFreeBoardDisplayed: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg bg-white"
              >
                <option value="हाँ">हाँ (दीवार पर प्रदर्शित)</option>
                <option value="नहीं">नहीं</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                07. हितग्राहियों की सूची, स्टॉक आदि आवश्यक सूचना बोर्ड लगा है?
              </label>
              <select
                value={formData.stockBeneficiaryListDisplayed}
                onChange={e => setFormData({ ...formData, stockBeneficiaryListDisplayed: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg bg-white"
              >
                <option value="हाँ">हाँ</option>
                <option value="नहीं">नहीं</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                08. राशनकार्ड संख्या (एपीएल एवं बीपीएल):
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  min="0"
                  placeholder="APL संख्या"
                  value={formData.aplCards}
                  onChange={e => setFormData({ ...formData, aplCards: e.target.value })}
                  className="p-2 border border-slate-300 rounded-lg text-center"
                />
                <input
                  type="number"
                  min="0"
                  placeholder="BPL संख्या"
                  value={formData.bplCards}
                  onChange={e => setFormData({ ...formData, bplCards: e.target.value })}
                  className="p-2 border border-slate-300 rounded-lg text-center font-bold text-amber-800"
                />
              </div>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                09. चर्चा किए गए BPL/अंत्योदय हितग्राहियों की संख्या:
              </label>
              <input
                type="number"
                min="0"
                value={formData.consultedCardHoldersCount}
                onChange={e => setFormData({ ...formData, consultedCardHoldersCount: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg text-center font-bold"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                10. दुकान नियमित रूप से खुल रही है?
              </label>
              <select
                value={formData.shopOpensRegularly}
                onChange={e => setFormData({ ...formData, shopOpensRegularly: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg bg-white font-medium"
              >
                <option value="हाँ">हाँ (नियमित)</option>
                <option value="नहीं">नहीं (अनियमित)</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                11. माह के प्रथम सप्ताह में भण्डारण होता है?
              </label>
              <select
                value={formData.stockInFirstWeek}
                onChange={e => setFormData({ ...formData, stockInFirstWeek: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg bg-white"
              >
                <option value="हाँ">हाँ</option>
                <option value="नहीं">नहीं</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                12. निगरानी समिति वास्तविक राशन पहुंचने का सत्यापन करती है?
              </label>
              <select
                value={formData.vigilanceCommitteeVerifying}
                onChange={e => setFormData({ ...formData, vigilanceCommitteeVerifying: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg bg-white"
              >
                <option value="हाँ">हाँ</option>
                <option value="नहीं">नहीं</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                13. राशन की तौल एवं गुणवत्ता सही है?
              </label>
              <select
                value={formData.weightAndQualityOk}
                onChange={e => setFormData({ ...formData, weightAndQualityOk: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg bg-white font-bold"
              >
                <option value="हाँ">हाँ (तौल व गुणवत्ता सही)</option>
                <option value="नहीं">नहीं (कम तौल / गुणवत्ता खराब)</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                14. निर्धारित मात्रा व शासकीय दर पर सामग्री प्राप्त होती है?
              </label>
              <select
                value={formData.correctRateAndQtyGiven}
                onChange={e => setFormData({ ...formData, correctRateAndQtyGiven: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg bg-white font-medium"
              >
                <option value="हाँ">हाँ</option>
                <option value="नहीं">नहीं (अधिक दर / कम मात्रा)</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                15. दुकानदार का हितग्राहियों के प्रति व्यवहार:
              </label>
              <select
                value={formData.dealerBehavior}
                onChange={e => setFormData({ ...formData, dealerBehavior: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg bg-white"
              >
                <option value="अच्छा है">अच्छा है</option>
                <option value="संतोषजनक">संतोषजनक</option>
                <option value="शिकायत प्राप्त हुई">शिकायत प्राप्त हुई / दुर्व्यवहार</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                16. क्या हितग्राहियों को किश्तों में सामग्री दी जाती है?
              </label>
              <select
                value={formData.givenInInstallments}
                onChange={e => setFormData({ ...formData, givenInInstallments: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg bg-white"
              >
                <option value="नहीं (एकमुश्त)">नहीं (एकमुश्त वितरण)</option>
                <option value="हाँ (किश्तों में)">हाँ (किश्तों में वितरण)</option>
              </select>
            </div>
          </div>
        </div>

        {/* 17. Remarks */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            17. टीप (निरीक्षणकर्ता की विस्तृत टिप्पणी एवं सुधार हेतु निर्देश):
          </label>
          <textarea
            rows={3}
            value={formData.remarks}
            onChange={e => setFormData({ ...formData, remarks: e.target.value })}
            placeholder="राशन वितरण में कोई अनियमितता, स्टॉक मिलान अथवा सुझाव..."
            className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:outline-none"
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
          categoryLabel="उचित मूल्य दुकान (PDS) निरीक्षण"
          themeColor="amber"
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
            className="flex-1 sm:flex-none bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold py-3 px-6 rounded-xl shadow-md flex items-center justify-center gap-1.5 transition"
          >
            <Send className="w-4 h-4" /> फाइनल जमा करें (Submit)
          </button>
        </div>

      </div>
    </div>
  );
}

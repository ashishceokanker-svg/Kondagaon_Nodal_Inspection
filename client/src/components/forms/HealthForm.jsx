import React, { useState } from 'react';
import { Activity, HeartPulse, User, Camera, Save, Send, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { API } from '../../api';
import { DISTRICT_BLOCKS, getPanchayatsForBlock } from '../../constants';
import GeoPhotoCapture from '../GeoPhotoCapture';


export default function HealthForm({ officer, onBack, onSuccess, initialData = null }) {
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

      // 1-3. Basic Info
      centerName: '',
      centerType: 'प्राथमिक स्वास्थ्य केन्द्र (PHC)', // उप स्वास्थ्य केन्द्र (SHC/HWC) / PHC / CHC
      inchargeName: '',
      
      // 4. Staff Presence
      staffPresent: 'हाँ (सभी उपस्थित)',
      subCenterStaffPresence: 'RHO/CHO उपस्थित',
      phcStaffPresence: 'MO, Staff Nurse, Pharmacist उपस्थित',
      cleanliness: 'उत्तम',
      residingAtHq: 'हाँ',
      opdCount: '',
      ipdCount: '',

      // 8. Essential 9 Drugs Availability
      drugs: {
        ifa: 'उपलब्ध',
        calcium: 'उपलब्ध',
        folicAcid: 'उपलब्ध',
        oxytocin: 'उपलब्ध',
        injTd: 'उपलब्ध',
        misoprostol: 'उपलब्ध',
        dexamethasone: 'उपलब्ध',
        amlodipine: 'उपलब्ध',
        metformin: 'उपलब्ध'
      },
      expiredDrugsPresent: 'नहीं',

      // 10-14. Samiti & Maternal Health
      samitiFormed: 'हाँ',
      samitiMeetingsCount: '3',
      institutionalDeliveries: '',
      jsyPaymentStatus: 'नियमित',
      jsyNutritionFoodGiven: 'हाँ',

      // 15-21. Clinical & Diagnostics
      immunizationRegular: 'हाँ',
      labTestsAvailable: 'सभी 6 टेस्ट उपलब्ध (HB/Sickling/HIV/Malaria/Urine/BP)',
      xrayAvailable: 'लागू नहीं (केवल CHC/DH)',
      equipmentFunctional: 'हाँ',
      protocolBannersDisplayed: 'हाँ',
      buildingRepairNeeded: 'नहीं',
      ambulanceAvailable: 'हाँ (108/महतारी एक्सप्रेस)',

      // 22. Labour Room 9 Amenities
      labourRoom: {
        sevenTrays: 'हाँ (उपलब्ध)',
        threeColorBins: 'हाँ (नीला, लाल, पीला)',
        babyWarmer: 'हाँ',
        fetalDoppler: 'हाँ',
        suctionMachine: 'हाँ',
        nebulizer: 'हाँ',
        ambuBag: 'हाँ',
        mucusSuction: 'हाँ',
        wheelchairStretcher: 'हाँ'
      },

      // 24-26. Basic Utilities & Registers
      waterInLabourRoomAndToilet: 'हाँ (पर्याप्त)',
      electricityAvailable: 'हाँ (24 घंटे / इन्वर्टर)',
      registers: {
        opdIpdRegister: 'हाँ',
        stockRegister: 'हाँ',
        deliveryRegister: 'हाँ',
        rchRegister: 'हाँ'
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

  const handleDrugChange = (drugKey, val) => {
    setFormData(prev => ({
      ...prev,
      drugs: { ...prev.drugs, [drugKey]: val }
    }));
  };

  const handleLabourRoomChange = (itemKey, val) => {
    setFormData(prev => ({
      ...prev,
      labourRoom: { ...prev.labourRoom, [itemKey]: val }
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
    if (!isDraft && (!formData.centerName || !formData.inchargeName)) {
      alert('कृपया स्वास्थ्य केन्द्र का नाम एवं प्रभारी का नाम दर्ज करें।');
      return;
    }
    setSaving(true);
    try {
      const allDrugsAvailable = Object.values(formData.drugs).every(v => v === 'उपलब्ध');
      const payload = {
        ...formData,
        isDraft,
        essentialDrugsAvailable: allDrugsAvailable ? 'हाँ (सभी 9 दवाएं उपलब्ध)' : 'आंशिक उपलब्ध',
        laborRoomEquipped: formData.labourRoom.sevenTrays === 'हाँ (उपलब्ध)' ? 'हाँ' : 'नहीं',
        waterElectricityOk: `जल: ${formData.waterInLabourRoomAndToilet}, विद्युत: ${formData.electricityAvailable}`,
        registersMaintained: 'हाँ (सभी संधारित)',
        status: isDraft ? 'ड्राफ्ट (लंबित)' : 'जमा किया गया (पूर्ण)'
      };
      const res = await API.saveInspection('health', payload);
      if (res.success) {
        alert(isDraft ? 'ड्राफ्ट सुरक्षित कर लिया गया है।' : 'स्वास्थ्य केन्द्र निरीक्षण चेकलिस्ट सफलतापूर्वक जमा की गई!');
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
      <div className="bg-gradient-to-r from-red-700 via-rose-800 to-slate-900 text-white p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-xs bg-white/20 hover:bg-white/30 py-1.5 px-3 rounded-lg transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> वापस
          </button>
          <span className="text-xs bg-red-950/60 py-1 px-2.5 rounded-full border border-red-400/30">
            प्रपत्र: Helth.pdf
          </span>
        </div>
        <div className="mt-3 text-center">
          <div className="inline-flex p-2.5 bg-white/10 rounded-2xl mb-2">
            <Activity className="w-7 h-7 text-red-200" />
          </div>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight">चेक लिस्ट - स्वास्थ्य केन्द्र</h2>
          <p className="text-xs text-red-200">लोक स्वास्थ्य एवं परिवार कल्याण विभाग • जिला कोण्डागांव</p>
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-6">

        {/* 1-4. Basic Information */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <HeartPulse className="w-4 h-4 text-red-600" /> 1 से 4. स्वास्थ्य केन्द्र एवं अधिकारी उपस्थिति
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">1. स्वास्थ्य केन्द्र का नाम *</label>
              <input
                type="text"
                required
                placeholder="उदा. प्राथमिक स्वास्थ्य केन्द्र विश्रामपुरी"
                value={formData.centerName}
                onChange={e => setFormData({ ...formData, centerName: e.target.value })}
                className="w-full text-xs p-2.5 rounded-lg border border-red-300 bg-red-50/20 focus:bg-white font-semibold text-slate-800"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">केन्द्र का स्तर (Type)</label>
              <select
                value={formData.centerType}
                onChange={e => setFormData({ ...formData, centerType: e.target.value })}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white font-medium"
              >
                <option value="उप स्वास्थ्य केन्द्र (SHC/HWC)">उप स्वास्थ्य केन्द्र (HWC / Sub Center)</option>
                <option value="प्राथमिक स्वास्थ्य केन्द्र (PHC)">प्राथमिक स्वास्थ्य केन्द्र (PHC)</option>
                <option value="सामुदायिक स्वास्थ्य केन्द्र (CHC)">सामुदायिक स्वास्थ्य केन्द्र (CHC)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">2. विकासखण्ड</label>
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
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">3. प्रभारी का नाम *</label>
              <input
                type="text"
                required
                placeholder="प्रभारी डॉक्टर / RHO"
                value={formData.inchargeName}
                onChange={e => setFormData({ ...formData, inchargeName: e.target.value })}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white font-medium"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">4. उपस्थिति स्थिति</label>
              <select
                value={formData.staffPresent}
                onChange={e => setFormData({ ...formData, staffPresent: e.target.value })}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white font-medium"
              >
                <option value="हाँ (सभी उपस्थित)">हाँ (सभी उपस्थित)</option>
                <option value="आंशिक उपस्थित">आंशिक उपस्थित</option>
                <option value="अनुपस्थित">अनुपस्थित</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-2 text-xs">
            <div>
              <label className="block text-[11px] text-slate-600 mb-1">5. परिसर साफ-सफाई</label>
              <select value={formData.cleanliness} onChange={e => setFormData({ ...formData, cleanliness: e.target.value })} className="w-full p-2 border rounded-lg bg-white">
                <option value="उत्तम">उत्तम</option>
                <option value="सामान्य">सामान्य</option>
                <option value="खराब">खराब</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] text-slate-600 mb-1">6. मुख्यालय निवास?</label>
              <select value={formData.residingAtHq} onChange={e => setFormData({ ...formData, residingAtHq: e.target.value })} className="w-full p-2 border rounded-lg bg-white">
                <option value="हाँ">हाँ</option>
                <option value="नहीं">नहीं</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] text-slate-600 mb-1">7. विगत 01 माह OPD</label>
              <input type="number" min="0" placeholder="OPD संख्या" value={formData.opdCount} onChange={e => setFormData({ ...formData, opdCount: e.target.value })} className="w-full p-2 border rounded-lg text-center font-bold" />
            </div>
            <div>
              <label className="block text-[11px] text-slate-600 mb-1">विगत 01 माह IPD</label>
              <input type="number" min="0" placeholder="IPD संख्या" value={formData.ipdCount} onChange={e => setFormData({ ...formData, ipdCount: e.target.value })} className="w-full p-2 border rounded-lg text-center font-bold" />
            </div>
          </div>
        </div>

        {/* 8. 9 Essential Drugs Availability Matrix */}
        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="bg-red-50 px-4 py-2.5 border-b border-red-200 flex items-center justify-between">
            <h3 className="text-xs font-bold text-red-950">
              8. आवश्यक ड्रग सूची अनुसार 9 दवाइयों की उपलब्धता
            </h3>
            <span className="text-[10px] text-red-800 font-medium">पीडीएफ प्रपत्र 1 अनुसार</span>
          </div>

          <div className="p-3 grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs bg-white">
            {[
              { key: 'ifa', label: '(1) IFA TABLET' },
              { key: 'calcium', label: '(2) CALCIUM' },
              { key: 'folicAcid', label: '(3) FOLIC ACID' },
              { key: 'oxytocin', label: '(4) INJ. OXYTOCIN' },
              { key: 'injTd', label: '(5) INJ. TD' },
              { key: 'misoprostol', label: '(6) TAB MISOPROSTOL' },
              { key: 'dexamethasone', label: '(7) INJ. DEXAMETHASONE' },
              { key: 'amlodipine', label: '(8) AMLODIPINE' },
              { key: 'metformin', label: '(9) METFORMIN' }
            ].map(d => (
              <div key={d.key} className="border border-slate-200 rounded-lg p-2 bg-slate-50">
                <span className="block font-semibold text-slate-700 text-[11px] mb-1">{d.label}</span>
                <select
                  value={formData.drugs[d.key]}
                  onChange={e => handleDrugChange(d.key, e.target.value)}
                  className="w-full p-1.5 border border-slate-300 rounded text-[11px] bg-white font-medium"
                >
                  <option value="उपलब्ध">उपलब्ध</option>
                  <option value="अनुपलब्ध">अनुपलब्ध (कमी)</option>
                </select>
              </div>
            ))}
          </div>

          <div className="p-3 bg-red-50/50 border-t border-red-100 flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-800">9. क्या कोई एक्सपायरी दवाई उपस्थित है?</span>
            <select
              value={formData.expiredDrugsPresent}
              onChange={e => setFormData({ ...formData, expiredDrugsPresent: e.target.value })}
              className="p-1.5 border border-slate-300 rounded font-bold text-xs"
            >
              <option value="नहीं">नहीं (कोई एक्सपायरी नहीं)</option>
              <option value="हाँ">हाँ (एक्सपायरी पाई गई)</option>
            </select>
          </div>
        </div>

        {/* 10-21. Delivery, Diagnostics & Facilities */}
        <div className="border border-slate-200 rounded-xl p-4 space-y-4">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-200">
            10 से 21. प्रसव, जननी सुरक्षा, लैब टेस्ट एवं एम्बुलेंस
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block text-[11px] text-slate-600 mb-1">10 & 11. जीवनदीप / जन आरोग्य समिति बैठकें</label>
              <input
                type="number"
                placeholder="बैठक संख्या"
                value={formData.samitiMeetingsCount}
                onChange={e => setFormData({ ...formData, samitiMeetingsCount: e.target.value })}
                className="w-full p-2 border rounded-lg text-center font-bold"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-600 mb-1">12. संस्थागत प्रसव (Deliveries count)</label>
              <input
                type="number"
                min="0"
                placeholder="माह में प्रसव संख्या"
                value={formData.institutionalDeliveries}
                onChange={e => setFormData({ ...formData, institutionalDeliveries: e.target.value })}
                className="w-full p-2 border rounded-lg text-center font-bold text-red-800"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-600 mb-1">13. JSY भुगतान स्थिति</label>
              <select value={formData.jsyPaymentStatus} onChange={e => setFormData({ ...formData, jsyPaymentStatus: e.target.value })} className="w-full p-2 border rounded-lg bg-white">
                <option value="नियमित">नियमित भुगतान</option>
                <option value="लंबित">लंबित</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] text-slate-600 mb-1">16. लैब टेस्ट (HB/Sickling/HIV/Malaria/Urine/BP)</label>
              <select value={formData.labTestsAvailable} onChange={e => setFormData({ ...formData, labTestsAvailable: e.target.value })} className="w-full p-2 border rounded-lg bg-white font-medium">
                <option value="सभी 6 टेस्ट उपलब्ध (HB/Sickling/HIV/Malaria/Urine/BP)">सभी 6 टेस्ट उपलब्ध</option>
                <option value="आंशिक टेस्ट उपलब्ध">आंशिक टेस्ट उपलब्ध</option>
                <option value="अनुपलब्ध">अनुपलब्ध</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] text-slate-600 mb-1">21. एम्बुलेंस (108/महतारी) सुविधा</label>
              <select value={formData.ambulanceAvailable} onChange={e => setFormData({ ...formData, ambulanceAvailable: e.target.value })} className="w-full p-2 border rounded-lg bg-white">
                <option value="हाँ (108/महतारी एक्सप्रेस)">हाँ (सुलभ)</option>
                <option value="नहीं">नहीं / विलंब</option>
              </select>
            </div>
          </div>
        </div>

        {/* 22. Labour Room Amenities (Page 2 of PDF) */}
        <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-3">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider text-red-950">
            22. प्रसव कक्ष (Labour Room) 9 आवश्यक सुविधाएं
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
            {[
              { key: 'sevenTrays', label: '(1) सेवन ट्रे (7 Trays)' },
              { key: 'threeColorBins', label: '(2) डस्टबीन (नीला, लाल, पीला)' },
              { key: 'babyWarmer', label: '(3) बेबी वार्मर' },
              { key: 'fetalDoppler', label: '(4) फीटल डापलर' },
              { key: 'suctionMachine', label: '(5) सक्शन मशीन' },
              { key: 'nebulizer', label: '(6) न्यूबिलाइजर' },
              { key: 'ambuBag', label: '(7) एम्बू बैग' },
              { key: 'mucusSuction', label: '(8) म्यूकस सक्शन' },
              { key: 'wheelchairStretcher', label: '(9) व्हीलचेयर व स्ट्रेचर' }
            ].map(item => (
              <div key={item.key} className="bg-white p-2 border rounded-lg flex items-center justify-between">
                <span className="font-medium text-slate-700 text-[11px]">{item.label}</span>
                <select
                  value={formData.labourRoom[item.key]}
                  onChange={e => handleLabourRoomChange(item.key, e.target.value)}
                  className="p-1 border rounded text-[11px]"
                >
                  <option value="हाँ">हाँ</option>
                  <option value="नहीं">नहीं</option>
                </select>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
            <div>
              <label className="block text-[11px] text-slate-600 mb-1">24. प्रसव कक्ष में पानी व टॉयलेट उपलब्धता</label>
              <select value={formData.waterInLabourRoomAndToilet} onChange={e => setFormData({ ...formData, waterInLabourRoomAndToilet: e.target.value })} className="w-full p-2 border rounded-lg bg-white">
                <option value="हाँ (पर्याप्त)">हाँ (पर्याप्त जल व स्वच्छ शौचालय)</option>
                <option value="नहीं">नहीं</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] text-slate-600 mb-1">25. बिजली की उपलब्धता</label>
              <select value={formData.electricityAvailable} onChange={e => setFormData({ ...formData, electricityAvailable: e.target.value })} className="w-full p-2 border rounded-lg bg-white">
                <option value="हाँ (24 घंटे / इन्वर्टर)">हाँ (24 घंटे / बैकअप)</option>
                <option value="अनियमित">अनियमित</option>
              </select>
            </div>
          </div>
        </div>

        {/* 26. Remarks */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            टीप (निरीक्षणकर्ता की विस्तृत टिप्पणी एवं सुधार हेतु निर्देश):
          </label>
          <textarea
            rows={3}
            value={formData.remarks}
            onChange={e => setFormData({ ...formData, remarks: e.target.value })}
            placeholder="स्वास्थ्य केन्द्र की कमियों, आवश्यक दवाओं की मांग अथवा सुधार निर्देश..."
            className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-red-600 focus:outline-none"
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
          categoryLabel="स्वास्थ्य केन्द्र निरीक्षण"
          themeColor="red"
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
            className="flex-1 sm:flex-none bg-red-700 hover:bg-red-800 text-white text-xs font-bold py-3 px-6 rounded-xl shadow-md flex items-center justify-center gap-1.5 transition"
          >
            <Send className="w-4 h-4" /> फाइनल जमा करें (Submit)
          </button>
        </div>

      </div>
    </div>
  );
}

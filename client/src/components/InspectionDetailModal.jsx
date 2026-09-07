import React from 'react';
import { 
  X, Printer, Baby, GraduationCap, Wheat, Landmark, Building, 
  HeartPulse, Home, MapPin, ExternalLink, Calendar, User, Phone, CheckCircle2, AlertCircle
} from 'lucide-react';

const safeParse = (val, fallback = {}) => {
  if (!val) return fallback;
  if (typeof val === 'object') return val;
  try {
    return JSON.parse(val);
  } catch (e) {
    return fallback;
  }
};

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

export default function InspectionDetailModal({ data, onClose }) {
  if (!data || !data.record) return null;
  const { record } = data;

  // Detect facility type reliably
  let type = data.type || record.type || record.facility_type;
  if (!type) {
    if (record.schoolName || record.sankul || record.schoolLevel) type = 'school';
    else if (record.centerName || record.workerName || record.rationRows) type = 'anganwadi';
    else if (record.shopId || record.shopName) type = 'pds';
    else if (record.hostelName || record.superintendentName) type = 'hostel';
    else if (record.inchargeName || record.drugs || record.centerType) type = 'health';
    else if (record.beneficiaryId || record.currentStage || record.fatherName) type = 'awas';
    else if (record.sectors || record.dependentVillage || record.scCount) type = 'chaupal';
    else type = 'anganwadi';
  }

  const handlePrint = () => {
    window.print();
  };

  const beneficiaries = safeParse(record.beneficiaries, {});
  const rationRows = Array.isArray(record.rationRows) && record.rationRows.length > 0 
    ? record.rationRows 
    : (safeParse(record.rationRows, DEFAULT_RATION_ROWS));
  const sectors = safeParse(record.sectors, {});
  const staff = safeParse(record.staff, {});
  const drugs = safeParse(record.drugs, {});
  const labourRoom = safeParse(record.labourRoom, {});
  const registers = safeParse(record.registers, {});
  const materials = safeParse(record.materials, {});
  const academicNotes = Array.isArray(record.academicNotes) 
    ? record.academicNotes 
    : (safeParse(record.academicNotes, ['', '', '', '']));

  // Department & Form Titles
  const getHeaderMeta = () => {
    switch (type) {
      case 'anganwadi':
        return {
          dept: 'महिला एवं बाल विकास विभाग',
          title: 'आंगनबाड़ी केन्द्र निरीक्षण प्रतिवेदन',
          leftSigner: 'आंगनबाड़ी कार्यकर्ता',
          leftSignerName: record.workerName || 'कार्यकर्ता'
        };
      case 'school':
        return {
          dept: 'स्कूल शिक्षा विभाग',
          title: 'शाला निरीक्षण एवं अवलोकन प्रतिवेदन',
          leftSigner: 'प्रधान पाठक / संस्था प्रमुख',
          leftSignerName: record.headmasterName || 'प्रधान पाठक'
        };
      case 'pds':
        return {
          dept: 'खाद्य एवं नागरिक आपूर्ति विभाग',
          title: 'शासकीय उचित मूल्य दुकान जांच पत्रक',
          leftSigner: 'विक्रेता / संचालक',
          leftSignerName: record.salesmanName || 'उचित मूल्य दुकान विक्रेता'
        };
      case 'chaupal':
        return {
          dept: 'जिला प्रशासन • ग्राम चौपाल समीक्षा',
          title: 'ग्राम चौपाल निरीक्षण प्रपत्र (21 विभागीय समीक्षा बिन्दु)',
          leftSigner: 'सरपंच / सचिव',
          leftSignerName: record.sarpanchName || 'सरपंच / सचिव'
        };
      case 'hostel':
        return {
          dept: 'आदिवासी विकास विभाग',
          title: 'छात्रावास / आश्रमों का निरीक्षण प्रतिवेदन',
          leftSigner: 'छात्रावास अधीक्षक',
          leftSignerName: record.superintendentName || 'अधीक्षक'
        };
      case 'health':
        return {
          dept: 'स्वास्थ्य एवं परिवार कल्याण विभाग',
          title: 'चेक लिस्ट - स्वास्थ्य केन्द्र निरीक्षण',
          leftSigner: 'केन्द्र प्रभारी / चिकित्सा अधिकारी',
          leftSignerName: record.inchargeName || 'चिकित्सा अधिकारी'
        };
      case 'awas':
        return {
          dept: 'पंचायत एवं ग्रामीण विकास विभाग',
          title: 'प्रधानमंत्री आवास योजना (ग्रामीण) स्थल निरीक्षण प्रारूप',
          leftSigner: 'हितग्राही / ग्राम रोजगार सहायक',
          leftSignerName: record.beneficiaryName || 'हितग्राही'
        };
      default:
        return {
          dept: 'जिला प्रशासन',
          title: 'नोडल अधिकारी निरीक्षण प्रतिवेदन',
          leftSigner: 'संस्था प्रमुख',
          leftSignerName: 'हस्ताक्षर'
        };
    }
  };

  const meta = getHeaderMeta();

  return (
    <div className="inspection-modal-backdrop fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="inspection-modal-box bg-white rounded-2xl shadow-2xl border border-slate-300 max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden my-auto">
        
        {/* MODAL CONTROL HEADER (Hidden when printing) */}
        <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between no-print shrink-0">
          <div className="flex items-center gap-2">
            <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase">
              {type}
            </span>
            <h3 className="text-sm font-bold tracking-tight text-slate-100">
              {meta.title} (पूर्ण प्रविष्टि विवरण)
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition shadow-sm"
              title="सरकारी प्रपत्र अनुसार प्रिंट / PDF निकालें"
            >
              <Printer className="w-3.5 h-3.5" /> प्रिंट / PDF
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition"
              title="बंद करें"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* MODAL BODY / PRINTABLE OFFICIAL DOCUMENT */}
        <div className="inspection-modal-body p-4 sm:p-7 overflow-y-auto space-y-4 text-xs text-slate-800 bg-white">
          
          {/* OFFICIAL STATE LETTERHEAD */}
          <div className="text-center pb-3 border-b-2 border-slate-900">
            <div className="flex items-center justify-center gap-3 mb-1">
              <div className="w-12 h-12 rounded-full border border-amber-500 p-0.5 shadow-xs bg-white shrink-0">
                <img src="/cg_logo.svg" alt="छत्तीसगढ़ शासन" className="w-full h-full object-contain" />
              </div>
              <div className="text-center">
                <h2 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                  कार्यालय कलेक्टर, जिला-कोण्डागांव (छ०ग०)
                </h2>
                <p className="text-[11px] font-bold text-slate-600">
                  {meta.dept}
                </p>
              </div>
            </div>
            <div className="mt-2 bg-slate-100 py-1 px-3 rounded-md inline-block border border-slate-300">
              <h1 className="text-xs sm:text-sm font-black text-blue-950 uppercase tracking-wide">
                {meta.title}
              </h1>
            </div>
            <div className="flex flex-wrap justify-between text-[11px] text-slate-700 mt-2 px-1 font-medium">
              <span>निरीक्षण दिनांक: <strong className="text-slate-950 font-bold">{record.date || record.inspectionDate || '-'}</strong></span>
              <span>विकासखण्ड: <strong className="text-slate-950 font-bold">{record.block || 'कोण्डागांव'}</strong></span>
              <span>ग्राम पंचायत: <strong className="text-slate-950 font-bold">{record.panchayat || record.village || '-'}</strong></span>
              <span>स्थिति: <strong className="text-emerald-800 font-bold">{record.status || 'पूर्ण'}</strong></span>
            </div>
          </div>

          {/* PRELIMINARY COMMON INFO */}
          <div className="bg-slate-50 border border-slate-300 rounded-xl p-3 space-y-2">
            <div className="font-bold text-[11px] text-slate-800 uppercase tracking-wider pb-1 border-b border-slate-200">
              1. प्रारंभिक विवरण (Preliminary Details)
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div>
                <span className="text-[10px] text-slate-500 block">संस्था / स्थल का नाम:</span>
                <span className="font-bold text-slate-900 text-xs">
                  {record.centerName || record.schoolName || record.shopName || record.hostelName || record.village || record.beneficiaryName || '-'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">ग्राम पंचायत:</span>
                <span className="font-semibold text-slate-800">{record.panchayat || record.village || '-'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">निरीक्षणकर्ता नोडल अधिकारी:</span>
                <span className="font-bold text-slate-900">{record.officerName || '-'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">पदनाम व मोबाइल:</span>
                <span className="font-semibold text-slate-800">{record.officerDesignation || '-'} ({record.officerMobile || '-'})</span>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 1. ANGANWADI PROFORMA */}
          {/* ========================================================================= */}
          {type === 'anganwadi' && (
            <div className="space-y-4">
              {/* Worker info */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-pink-50/50 p-3 rounded-xl border border-pink-200">
                <div>
                  <span className="text-[10px] text-pink-700 block">केन्द्र का नाम:</span>
                  <span className="font-bold text-slate-900">{record.centerName || '-'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-pink-700 block">कार्यकर्ता का नाम:</span>
                  <span className="font-bold text-slate-900">{record.workerName || '-'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-pink-700 block">कार्यकर्ता मोबाइल:</span>
                  <span className="font-semibold text-slate-800">{record.workerMobile || '-'}</span>
                </div>
              </div>

              {/* 2. Registered Beneficiaries Table */}
              <div className="border border-slate-300 rounded-xl overflow-hidden shadow-xs">
                <div className="bg-pink-100/70 px-3 py-1.5 border-b border-pink-200 flex justify-between items-center">
                  <span className="font-bold text-pink-950 text-[11px]">
                    2. दर्ज हितग्राहियों की संख्या (Registered Beneficiaries)
                  </span>
                  <span className="text-pink-900 font-black">
                    कुल दर्ज योग: {beneficiaries.total || record.totalBeneficiaries || 0}
                  </span>
                </div>
                <div className="p-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-center bg-white">
                  <div className="p-2 bg-pink-50 rounded-lg border border-pink-100">
                    <span className="text-[10px] text-slate-500 block">06 माह से 03 वर्ष</span>
                    <span className="font-bold text-sm text-slate-800">{beneficiaries.age06m3y ?? '-'}</span>
                  </div>
                  <div className="p-2 bg-pink-50 rounded-lg border border-pink-100">
                    <span className="text-[10px] text-slate-500 block">03 से 06 वर्ष</span>
                    <span className="font-bold text-sm text-slate-800">{beneficiaries.age3y6y ?? '-'}</span>
                  </div>
                  <div className="p-2 bg-pink-50 rounded-lg border border-pink-100">
                    <span className="text-[10px] text-slate-500 block">गर्भवती महिलाएं</span>
                    <span className="font-bold text-sm text-slate-800">{beneficiaries.pregnant ?? '-'}</span>
                  </div>
                  <div className="p-2 bg-pink-50 rounded-lg border border-pink-100">
                    <span className="text-[10px] text-slate-500 block">शिशुवती महिलाएं</span>
                    <span className="font-bold text-sm text-slate-800">{beneficiaries.lactating ?? '-'}</span>
                  </div>
                  <div className="p-2 bg-pink-50 rounded-lg border border-pink-100">
                    <span className="text-[10px] text-slate-500 block">11-14 वर्ष शाला त्यागी</span>
                    <span className="font-bold text-sm text-slate-800">{beneficiaries.adolescentGirls ?? '-'}</span>
                  </div>
                  <div className="p-2 bg-pink-200/60 rounded-lg border border-pink-300">
                    <span className="text-[10px] text-pink-900 block font-bold">कुल योग</span>
                    <span className="font-black text-sm text-pink-950">{beneficiaries.total || 0}</span>
                  </div>
                </div>
                {beneficiaries.remarks && (
                  <div className="px-3 py-1.5 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-700">
                    <strong>हितग्राही संबंधी टीप:</strong> {beneficiaries.remarks}
                  </div>
                )}
              </div>

              {/* 3. Ration & Nutrition Stock Table */}
              <div className="border border-slate-300 rounded-xl overflow-hidden shadow-xs">
                <div className="bg-slate-100 px-3 py-1.5 border-b border-slate-300">
                  <span className="font-bold text-slate-900 text-[11px]">
                    3. सामग्री प्रदाय, बचत एवं वितरण की स्थिति (8 श्रेणियां)
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[11px] border-collapse">
                    <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 font-bold">
                      <tr>
                        <th className="p-2 text-center w-8 border-r border-slate-200">क्र.</th>
                        <th className="p-2 border-r border-slate-200">हितग्राही वर्ग</th>
                        <th className="p-2 text-center border-r border-slate-200">सामग्री प्रदाय</th>
                        <th className="p-2 text-center border-r border-slate-200">पूर्व बचत</th>
                        <th className="p-2 text-center border-r border-slate-200">कुल मात्रा</th>
                        <th className="p-2 text-center border-r border-slate-200">वितरण</th>
                        <th className="p-2 text-center">उपलब्ध पैकेट</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {(Array.isArray(rationRows) ? rationRows : DEFAULT_RATION_ROWS).map((row, idx) => (
                        <tr key={row.id || idx} className="hover:bg-slate-50">
                          <td className="p-2 text-center font-bold text-slate-500 border-r border-slate-200">{idx + 1}</td>
                          <td className="p-2 font-medium text-slate-800 border-r border-slate-200">{row.category}</td>
                          <td className="p-2 text-center border-r border-slate-200">{row.supply || '-'}</td>
                          <td className="p-2 text-center border-r border-slate-200">{row.prevBalance || '-'}</td>
                          <td className="p-2 text-center font-bold text-slate-900 border-r border-slate-200">{row.total || '-'}</td>
                          <td className="p-2 text-center border-r border-slate-200">{row.distributed || '-'}</td>
                          <td className="p-2 text-center font-semibold text-emerald-800">{row.availablePackets || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 2. SCHOOL PROFORMA */}
          {/* ========================================================================= */}
          {type === 'school' && (
            <div className="space-y-4">
              {/* School meta */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-blue-50/50 p-3 rounded-xl border border-blue-200">
                <div>
                  <span className="text-[10px] text-blue-700 block">शाला का नाम:</span>
                  <span className="font-bold text-slate-900">{record.schoolName || '-'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-blue-700 block">शाला स्तर:</span>
                  <span className="font-semibold text-slate-800">{record.schoolLevel || '-'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-blue-700 block">संकुल का नाम:</span>
                  <span className="font-semibold text-slate-800">{record.sankul || '-'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-blue-700 block">निरीक्षण माह:</span>
                  <span className="font-semibold text-slate-800">{record.month || '-'}</span>
                </div>
              </div>

              {/* Teachers & Students matrix */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="border border-slate-300 rounded-xl p-3 bg-white">
                  <div className="font-bold text-[11px] text-blue-900 mb-2 pb-1 border-b border-slate-200">
                    5 & 6. शिक्षक संख्या एवं उपस्थिति
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                      <span className="text-[10px] text-slate-500 block">पदस्थ शिक्षक</span>
                      <span className="font-bold text-sm text-slate-800">{record.teachersPosted ?? '-'}</span>
                    </div>
                    <div className="p-2 bg-emerald-50 rounded-lg border border-emerald-200">
                      <span className="text-[10px] text-emerald-700 block">उपस्थित शिक्षक</span>
                      <span className="font-bold text-sm text-emerald-900">{record.teachersPresent ?? '-'}</span>
                    </div>
                    <div className="p-2 bg-blue-50 rounded-lg border border-blue-200">
                      <span className="text-[10px] text-blue-700 block">समय पर उपस्थिति</span>
                      <span className="font-bold text-xs text-blue-900">{record.teacherPunctuality || 'हाँ'}</span>
                    </div>
                  </div>
                </div>

                <div className="border border-slate-300 rounded-xl p-3 bg-white">
                  <div className="font-bold text-[11px] text-blue-900 mb-2 pb-1 border-b border-slate-200">
                    7. शाला में दर्ज एवं छात्र उपस्थिति
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                      <span className="text-[10px] text-slate-500 block">कुल दर्ज छात्र</span>
                      <span className="font-bold text-sm text-slate-800">{record.studentsEnrolled ?? '-'}</span>
                    </div>
                    <div className="p-2 bg-blue-50 rounded-lg border border-blue-200">
                      <span className="text-[10px] text-blue-700 block">उपस्थित छात्र</span>
                      <span className="font-bold text-sm text-blue-900">{record.studentsPresent ?? '-'}</span>
                    </div>
                    <div className="p-2 bg-indigo-50 rounded-lg border border-indigo-200">
                      <span className="text-[10px] text-indigo-700 block">उपस्थिति %</span>
                      <span className="font-black text-sm text-indigo-900">
                        {record.studentsEnrolled && record.studentsPresent 
                          ? `${Math.round((record.studentsPresent / record.studentsEnrolled) * 100)}%` 
                          : '-'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 11 Inspection checkpoints table */}
              <div className="border border-slate-300 rounded-xl overflow-hidden shadow-xs">
                <div className="bg-slate-100 px-3 py-1.5 border-b border-slate-300">
                  <span className="font-bold text-slate-900 text-[11px]">
                    8 से 18. मुख्य निरीक्षण बिन्दु स्थिति (Questionnaire Checklist)
                  </span>
                </div>
                <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2.5 bg-white text-xs">
                  <div className="flex justify-between border-b pb-1">
                    <span className="text-slate-600">8. पाठ्य सामग्री व गणवेश वितरण:</span>
                    <strong className="text-slate-900">{record.booksUniformsDistributed || '-'}</strong>
                  </div>
                  <div className="flex justify-between border-b pb-1">
                    <span className="text-slate-600">9. वार्षिक शैक्षणिक कैलेण्डर:</span>
                    <strong className="text-slate-900">{record.academicCalendarFollowed || '-'}</strong>
                  </div>
                  <div className="flex justify-between border-b pb-1">
                    <span className="text-slate-600">10. शाला भवन स्थिति व साफ-सफाई:</span>
                    <strong className="text-slate-900">{record.buildingCondition || '-'}</strong>
                  </div>
                  <div className="flex justify-between border-b pb-1">
                    <span className="text-slate-600">11. मूलभूत सुविधाएं:</span>
                    <strong className="text-slate-900">
                      {record.waterAvailable || 'पानी'}, {record.electricityAvailable || 'बिजली'}, {record.toiletAvailable || 'शौचालय'}
                    </strong>
                  </div>
                  <div className="flex justify-between border-b pb-1">
                    <span className="text-slate-600">12. शाला विकास समिति (SMC) बैठक:</span>
                    <strong className="text-slate-900">{record.smcMeetingRegular || '-'}</strong>
                  </div>
                  <div className="flex justify-between border-b pb-1">
                    <span className="text-slate-600">13. प्रयोगशाला व पुस्तकालय उपयोग:</span>
                    <strong className="text-slate-900">{record.labLibraryUsed || '-'}</strong>
                  </div>
                  <div className="flex justify-between border-b pb-1">
                    <span className="text-slate-600">14. विद्यार्थियों का अध्ययन स्तर:</span>
                    <strong className="text-slate-900 font-bold">{record.studentLearningLevel || '-'}</strong>
                  </div>
                  <div className="flex justify-between border-b pb-1">
                    <span className="text-slate-600">15. PM पोषण शक्ति (मध्यान्ह भोजन):</span>
                    <strong className="text-slate-900 font-bold text-emerald-800">{record.midDayMeal || '-'}</strong>
                  </div>
                  <div className="flex justify-between border-b pb-1">
                    <span className="text-slate-600">16. बैग लेस डे (शनिवार) आयोजन:</span>
                    <strong className="text-slate-900">{record.baglessDay || '-'}</strong>
                  </div>
                  <div className="flex justify-between border-b pb-1">
                    <span className="text-slate-600">17. शिक्षक दैनंदिनी संधारण:</span>
                    <strong className="text-slate-900">{record.teacherDiaryMaintained || '-'}</strong>
                  </div>
                  <div className="flex justify-between border-b pb-1">
                    <span className="text-slate-600">18. नियमित गृहकार्य एवं जांच:</span>
                    <strong className="text-slate-900">{record.homeworkGivenAndChecked || '-'}</strong>
                  </div>
                </div>
              </div>

              {/* 19. Academic notes */}
              {Array.isArray(academicNotes) && academicNotes.some(n => n && n.trim()) && (
                <div className="border border-slate-300 rounded-xl p-3 bg-slate-50 space-y-1.5">
                  <div className="font-bold text-[11px] text-slate-800">
                    19. बच्चों का कक्षावार / विषयवार, अकादमिक स्तर पर टिप्पणी:
                  </div>
                  <div className="space-y-1">
                    {academicNotes.map((note, idx) => note && note.trim() ? (
                      <div key={idx} className="flex gap-2 text-xs">
                        <span className="font-bold text-slate-600 w-4">{idx + 1}.</span>
                        <span className="text-slate-900 font-medium">{note}</span>
                      </div>
                    ) : null)}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* 3. PDS SHOP PROFORMA */}
          {/* ========================================================================= */}
          {type === 'pds' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-amber-50/50 p-3 rounded-xl border border-amber-200">
                <div>
                  <span className="text-[10px] text-amber-700 block">01. दुकान का नाम:</span>
                  <span className="font-bold text-slate-900">{record.shopName || '-'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-amber-700 block">आईडी क्रमांक (Shop ID):</span>
                  <span className="font-bold text-slate-900 font-mono">{record.shopId || '-'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-amber-700 block">02. जांच तिथि:</span>
                  <span className="font-semibold text-slate-800">{record.date || '-'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-amber-700 block">संचालन स्थिति:</span>
                  <span className="font-semibold text-slate-800">{record.shopOpensRegularly || 'नियमित'}</span>
                </div>
              </div>

              {/* Checkpoints */}
              <div className="border border-slate-300 rounded-xl overflow-hidden shadow-xs">
                <div className="bg-slate-100 px-3 py-1.5 border-b border-slate-300">
                  <span className="font-bold text-slate-900 text-[11px]">
                    03 से 16. जांच बिन्दुवार स्थिति
                  </span>
                </div>
                <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2.5 bg-white text-xs">
                  <div className="flex justify-between border-b pb-1">
                    <span className="text-slate-600">03. विगत 3 माह घोषणा पत्र अनुसार:</span>
                    <strong className="text-slate-900">{record.declarationPast3MonthsOk || '-'}</strong>
                  </div>
                  <div className="flex justify-between border-b pb-1">
                    <span className="text-slate-600">04. चावल उत्सव आयोजन स्थिति:</span>
                    <strong className="text-slate-900">{record.riceFestivalHeld || '-'}</strong>
                  </div>
                  <div className="flex justify-between border-b pb-1">
                    <span className="text-slate-600">05. माह की 06 तारीख तक भण्डारण:</span>
                    <strong className="text-slate-900">{record.stockBySixth || '-'}</strong>
                  </div>
                  <div className="flex justify-between border-b pb-1">
                    <span className="text-slate-600">06. कॉल सेंटर टोल-फ्री नंबर बोर्ड:</span>
                    <strong className="text-slate-900">{record.tollFreeBoardDisplayed || '-'}</strong>
                  </div>
                  <div className="flex justify-between border-b pb-1">
                    <span className="text-slate-600">07. स्टॉक व हितग्राही सूचना बोर्ड:</span>
                    <strong className="text-slate-900">{record.stockBeneficiaryListDisplayed || '-'}</strong>
                  </div>
                  <div className="flex justify-between border-b pb-1">
                    <span className="text-slate-600">08. राशनकार्ड संख्या:</span>
                    <strong className="text-slate-900">
                      APL: {record.aplCards || 0} | BPL: {record.bplCards || 0}
                    </strong>
                  </div>
                  <div className="flex justify-between border-b pb-1">
                    <span className="text-slate-600">09. चर्चा किए गए BPL हितग्राही:</span>
                    <strong className="text-slate-900">{record.consultedCardHoldersCount || 0}</strong>
                  </div>
                  <div className="flex justify-between border-b pb-1">
                    <span className="text-slate-600">10. दुकान नियमित खुलती है:</span>
                    <strong className="text-slate-900">{record.shopOpensRegularly || '-'}</strong>
                  </div>
                  <div className="flex justify-between border-b pb-1">
                    <span className="text-slate-600">11. प्रथम सप्ताह में भण्डारण:</span>
                    <strong className="text-slate-900">{record.stockInFirstWeek || '-'}</strong>
                  </div>
                  <div className="flex justify-between border-b pb-1">
                    <span className="text-slate-600">12. निगरानी समिति सत्यापन:</span>
                    <strong className="text-slate-900">{record.vigilanceCommitteeVerifying || '-'}</strong>
                  </div>
                  <div className="flex justify-between border-b pb-1">
                    <span className="text-slate-600">13. तौल एवं गुणवत्ता स्थिति:</span>
                    <strong className="text-slate-900 font-bold text-emerald-800">{record.weightAndQualityOk || '-'}</strong>
                  </div>
                  <div className="flex justify-between border-b pb-1">
                    <span className="text-slate-600">14. शासकीय दर व मात्रा पर प्रदाय:</span>
                    <strong className="text-slate-900">{record.correctRateAndQtyGiven || '-'}</strong>
                  </div>
                  <div className="flex justify-between border-b pb-1">
                    <span className="text-slate-600">15. दुकानदार का व्यवहार:</span>
                    <strong className="text-slate-900">{record.dealerBehavior || '-'}</strong>
                  </div>
                  <div className="flex justify-between border-b pb-1">
                    <span className="text-slate-600">16. किश्तों में सामग्री वितरण:</span>
                    <strong className="text-slate-900">{record.givenInInstallments || '-'}</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 4. GRAM CHAUPAL PROFORMA */}
          {/* ========================================================================= */}
          {type === 'chaupal' && (
            <div className="space-y-4">
              {/* Demographics */}
              <div className="border border-slate-300 rounded-xl overflow-hidden shadow-xs">
                <div className="bg-purple-100/70 px-3 py-1.5 border-b border-purple-200 flex justify-between items-center">
                  <span className="font-bold text-purple-950 text-[11px]">
                    ग्राम एवं जनसंख्या विवरण
                  </span>
                  <span className="text-purple-900 font-black">
                    कुल जनसंख्या: {record.populationTotal || '-'}
                  </span>
                </div>
                <div className="p-3 grid grid-cols-2 sm:grid-cols-6 gap-2 text-center bg-white">
                  <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-500 block">ग्राम / आश्रित</span>
                    <span className="font-bold text-slate-800">{record.village || '-'}{record.dependentVillage ? ` / ${record.dependentVillage}` : ''}</span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-500 block">पुरुष</span>
                    <span className="font-bold text-slate-800">{record.populationMale || '-'}</span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-500 block">महिला</span>
                    <span className="font-bold text-slate-800">{record.populationFemale || '-'}</span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-500 block">अनुसूचित जाति (SC)</span>
                    <span className="font-bold text-slate-800">{record.scCount || '-'}</span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-500 block">अनुसूचित जनजाति (ST)</span>
                    <span className="font-bold text-slate-800">{record.stCount || '-'}</span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-500 block">अन्य पिछड़ा वर्ग (OBC)</span>
                    <span className="font-bold text-slate-800">{record.obcCount || '-'}</span>
                  </div>
                </div>
              </div>

              {/* 21 Sectors Table */}
              <div className="border border-slate-300 rounded-xl overflow-hidden shadow-xs">
                <div className="bg-slate-100 px-3 py-1.5 border-b border-slate-300">
                  <span className="font-bold text-slate-900 text-[11px]">
                    21 विभागों एवं जन कल्याणकारी योजनाओं की बिन्दुवार समीक्षा
                  </span>
                </div>
                <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-white">
                  <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                    <strong className="text-purple-900 block text-[11px]">1. स्कूल शिक्षा:</strong>
                    <span className="text-slate-700">भवन: {sectors.school?.building || '-'} • शिक्षक: {sectors.school?.teacherAttendance || '-'} • भोजन: {sectors.school?.midDayMeal || '-'}</span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                    <strong className="text-purple-900 block text-[11px]">2. महिला एवं बाल विकास:</strong>
                    <span className="text-slate-700">स्थिति: {sectors.anganwadi?.status || '-'} • उपस्थिति: {sectors.anganwadi?.attendance || '-'} • THR: {sectors.anganwadi?.thrMeal || '-'}</span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                    <strong className="text-purple-900 block text-[11px]">3. राशन दुकान (PDS):</strong>
                    <span className="text-slate-700">वितरण: {sectors.pds?.status || '-'} • गुणवत्ता: {sectors.pds?.quality || '-'} • कार्ड अद्यतन: {sectors.pds?.cardsUpdated || '-'}</span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                    <strong className="text-purple-900 block text-[11px]">4. स्वास्थ्य केन्द्र:</strong>
                    <span className="text-slate-700">संचालन: {sectors.health?.status || '-'} • स्टॉफ नियमित: {sectors.health?.staffRegular || '-'}</span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                    <strong className="text-purple-900 block text-[11px]">5. जल जीवन मिशन (JJM):</strong>
                    <span className="text-slate-700">टंकी: {sectors.jjm?.tankStatus || '-'} • FHTC: {sectors.jjm?.fhtcPercent || '-'} • जलापूर्ति: {sectors.jjm?.supplyStatus || '-'}</span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                    <strong className="text-purple-900 block text-[11px]">6. क्रेडा (सौर ऊर्जा):</strong>
                    <span className="text-slate-700">सोलर पम्प: {sectors.creda?.solarPump || '-'} • हाई मास्ट: {sectors.creda?.highMast || '-'} • मरम्मत: {sectors.creda?.regularRepair || '-'}</span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                    <strong className="text-purple-900 block text-[11px]">7. स्वच्छ भारत (शौचालय):</strong>
                    <span className="text-slate-700">स्थिति: {sectors.toilet?.status || '-'} • घर-घर कवरेज: {sectors.toilet?.householdCoverage || '-'}</span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                    <strong className="text-purple-900 block text-[11px]">8. विद्युत आपूर्ति:</strong>
                    <span className="text-slate-700">आपूर्ति: {sectors.electricity?.status || '-'} • अविद्युतीकृत टोला: {sectors.electricity?.unElectrifiedTolas || 'कोई नहीं'}</span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                    <strong className="text-purple-900 block text-[11px]">9. ग्रामीण सड़क:</strong>
                    <span className="text-slate-700">स्थिति: {sectors.road?.status || '-'} • आवश्यकता: {sectors.road?.requirement || 'निरंक'}</span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                    <strong className="text-purple-900 block text-[11px]">10. लोक सेवा केन्द्र (CSC):</strong>
                    <span className="text-slate-700">स्थिति: {sectors.csc?.status || '-'} • सेवाएं: {sectors.csc?.servicesCount || '-'}</span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                    <strong className="text-purple-900 block text-[11px]">11. छात्रावास / आश्रम:</strong>
                    <span className="text-slate-700">स्थिति: {sectors.hostel?.status || '-'} • अधीक्षक उपस्थित: {sectors.hostel?.wardenPresent || '-'} • भोजन: {sectors.hostel?.foodQuality || '-'}</span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                    <strong className="text-purple-900 block text-[11px]">12. पंचायत भवन:</strong>
                    <span className="text-slate-700">भवन स्थिति: {sectors.panchayatBhawan?.status || '-'} • अभिलेख: {sectors.panchayatBhawan?.recordsMaintained || '-'}</span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                    <strong className="text-purple-900 block text-[11px]">13. पंचायत सचिव:</strong>
                    <span className="text-slate-700">उपस्थिति: {sectors.panchayatSachiv?.attendance || '-'} • कार्य संतोष: {sectors.panchayatSachiv?.satisfied || '-'}</span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                    <strong className="text-purple-900 block text-[11px]">14. राजस्व / पटवारी:</strong>
                    <span className="text-slate-700">उपस्थिति: {sectors.revenue?.patwariAttendance || '-'} • लंबित नामांतरण: {sectors.revenue?.pendingMutations || '0'}</span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                    <strong className="text-purple-900 block text-[11px]">15. स्वच्छता व कचरा प्रबंधन:</strong>
                    <span className="text-slate-700">सफाई: {sectors.sanitation?.regularCleaning || '-'} • SHG प्रबंधन: {sectors.sanitation?.shgWasteManagement || '-'}</span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                    <strong className="text-purple-900 block text-[11px]">16. पशुपालन व कृषि:</strong>
                    <span className="text-slate-700">PM किसान: {sectors.veterinary?.pmKisanBenefit || '-'} • फसल बीमा: {sectors.veterinary?.cropInsuranceBenefit || '-'} • टीकाकरण: {sectors.veterinary?.vaccinationDone || '-'}</span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                    <strong className="text-purple-900 block text-[11px]">17. उज्ज्वला योजना:</strong>
                    <span className="text-slate-700">छूटे हितग्राही: {sectors.ujjwala?.leftOutBeneficiaries || '0'} • नियमित उपयोग: {sectors.ujjwala?.regularUse || '-'}</span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                    <strong className="text-purple-900 block text-[11px]">18. महतारी वंदन योजना:</strong>
                    <span className="text-slate-700">लंबित आवेदन: {sectors.mahtariVandan?.pendingCount || '0'}</span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                    <strong className="text-purple-900 block text-[11px]">19. PM आवास योजना (PMAY):</strong>
                    <span className="text-slate-700">सर्वे: {sectors.pmay?.surveyStatus || '-'} • पात्र लंबित: {sectors.pmay?.eligiblePendingSurvey || '0'}</span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                    <strong className="text-purple-900 block text-[11px]">20. मनरेगा (MGNREGA):</strong>
                    <span className="text-slate-700">भुगतान: {sectors.mgnrega?.regularPayment || '-'} • TA उपस्थिति: {sectors.mgnrega?.taAttendance || '-'}</span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 sm:col-span-2">
                    <strong className="text-purple-900 block text-[11px]">21. सामाजिक सुरक्षा पेंशन व आयुष्मान:</strong>
                    <span className="text-slate-700">पेंशन भुगतान: {sectors.pensionAyushman?.regularPensionPayment || '-'} • आयुष्मान कार्ड: {sectors.pensionAyushman?.ayushmanCardMade || '-'} • वनाधिकार पट्टा: {sectors.pensionAyushman?.fraPattaDemand || '-'}</span>
                  </div>
                </div>
              </div>

              {/* Complaints / Grievances */}
              {record.complaints && (
                <div className="border border-slate-300 rounded-xl p-3 bg-amber-50/50">
                  <div className="font-bold text-amber-950 text-[11px] mb-1">
                    जनसमस्याएं एवं मांग / शिकायतें (Grievances):
                  </div>
                  <p className="text-slate-800 text-xs whitespace-pre-wrap">{record.complaints}</p>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* 5. HOSTEL PROFORMA */}
          {/* ========================================================================= */}
          {type === 'hostel' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-slate-50 p-3 rounded-xl border border-slate-300">
                <div>
                  <span className="text-[10px] text-slate-500 block">छात्रावास का नाम:</span>
                  <span className="font-bold text-slate-900">{record.hostelName || '-'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">वर्ग व प्रकार:</span>
                  <span className="font-semibold text-slate-800">{record.category || '-'} ({record.hostelType || '-'})</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">स्वीकृत / उपस्थित सीट:</span>
                  <span className="font-bold text-slate-900">{record.sanctionedSeats || '-'} / {record.presentStudents || '-'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">अधीक्षक का नाम:</span>
                  <span className="font-semibold text-slate-800">{record.superintendentName || '-'} ({record.superintendentMobile || '-'})</span>
                </div>
              </div>

              {/* Staff matrix table */}
              <div className="border border-slate-300 rounded-xl overflow-hidden shadow-xs">
                <div className="bg-slate-100 px-3 py-1.5 border-b border-slate-300">
                  <span className="font-bold text-slate-900 text-[11px]">
                    7. पदस्थ स्टॉफ विवरण (Staff Matrix)
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[11px] border-collapse">
                    <thead className="bg-slate-50 text-slate-700 border-b border-slate-200">
                      <tr>
                        <th className="p-2 border-r">पद का नाम</th>
                        <th className="p-2 text-center border-r" colSpan={2}>नियमित (पु/म)</th>
                        <th className="p-2 text-center border-r" colSpan={2}>संविदा (पु/म)</th>
                        <th className="p-2 text-center" colSpan={2}>दैनिक वेतनभोगी (पु/म)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-center">
                      {['peon', 'cook', 'guard', 'homeguard'].map(role => {
                        const rName = role === 'peon' ? 'भृत्य' : role === 'cook' ? 'रसोइया' : role === 'guard' ? 'चौकीदार' : 'नगर सैनिक/होमगार्ड';
                        const s = staff[role] || {};
                        return (
                          <tr key={role} className="hover:bg-slate-50">
                            <td className="p-2 text-left font-bold text-slate-800 border-r">{rName}</td>
                            <td className="p-1 border-r text-slate-600">पु: {s.mReg || 0}</td>
                            <td className="p-1 border-r text-slate-600">म: {s.fReg || 0}</td>
                            <td className="p-1 border-r text-slate-600">पु: {s.mCont || 0}</td>
                            <td className="p-1 border-r text-slate-600">म: {s.fCont || 0}</td>
                            <td className="p-1 border-r text-slate-600">पु: {s.mDaily || 0}</td>
                            <td className="p-1 text-slate-600">म: {s.fDaily || 0}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Amenities & Security Checklist */}
              <div className="border border-slate-300 rounded-xl p-3 bg-white space-y-2">
                <div className="font-bold text-slate-900 text-[11px] pb-1 border-b border-slate-200">
                  8 से 11. भवन, सुरक्षा व मूलभूत सुविधाएं
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="flex justify-between border-b pb-1">
                    <span className="text-slate-600">अधीक्षक क्वार्टर में निवास:</span>
                    <strong className="text-slate-900">{record.superintendentResiding || '-'}</strong>
                  </div>
                  <div className="flex justify-between border-b pb-1">
                    <span className="text-slate-600">CCTV कैमरा स्थिति:</span>
                    <strong className="text-slate-900">{record.cctvWorking || 'हाँ'} ({record.cctvCount || 0} कैमरे)</strong>
                  </div>
                  <div className="flex justify-between border-b pb-1">
                    <span className="text-slate-600">RO वाटर प्यूरीफायर:</span>
                    <strong className="text-slate-900">{record.roWorking || 'हाँ'}</strong>
                  </div>
                  <div className="flex justify-between border-b pb-1">
                    <span className="text-slate-600">भोजन गुणवत्ता:</span>
                    <strong className="text-slate-900 font-bold text-emerald-800">{record.foodQuality || '-'}</strong>
                  </div>
                  <div className="flex justify-between border-b pb-1">
                    <span className="text-slate-600">शौचालय स्थिति:</span>
                    <strong className="text-slate-900">उपयोगी: {record.usableToilets || '-'} • अनुपयोगी: {record.unusableToilets || '0'}</strong>
                  </div>
                  <div className="flex justify-between border-b pb-1">
                    <span className="text-slate-600">विद्युत व सौर ऊर्जा:</span>
                    <strong className="text-slate-900">विद्युत: {record.electricityAvailable || 'हाँ'}, सोलर: {record.solarAvailable || 'हाँ'}</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 6. HEALTH PROFORMA */}
          {/* ========================================================================= */}
          {type === 'health' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-emerald-50/50 p-3 rounded-xl border border-emerald-200">
                <div>
                  <span className="text-[10px] text-emerald-700 block">स्वास्थ्य केन्द्र नाम:</span>
                  <span className="font-bold text-slate-900">{record.centerName || '-'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-emerald-700 block">केन्द्र स्तर:</span>
                  <span className="font-semibold text-slate-800">{record.centerType || '-'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-emerald-700 block">प्रभारी का नाम:</span>
                  <span className="font-bold text-slate-900">{record.inchargeName || '-'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-emerald-700 block">औसत OPD / IPD:</span>
                  <span className="font-semibold text-slate-800">{record.opdCount || '-'} / {record.ipdCount || '-'}</span>
                </div>
              </div>

              {/* 9 Essential Drugs Table */}
              <div className="border border-slate-300 rounded-xl overflow-hidden shadow-xs">
                <div className="bg-emerald-100/70 px-3 py-1.5 border-b border-emerald-200">
                  <span className="font-bold text-emerald-950 text-[11px]">
                    8. आवश्यक 9 जीवनरक्षक दवाइयों की उपलब्धता स्थिति
                  </span>
                </div>
                <div className="p-3 grid grid-cols-3 sm:grid-cols-5 gap-2 bg-white text-center text-xs">
                  {['ifa', 'calcium', 'folicAcid', 'oxytocin', 'injTd', 'misoprostol', 'dexamethasone', 'amlodipine', 'metformin'].map(dKey => {
                    const dNames = {
                      ifa: 'IFA सिरप/गोली', calcium: 'Calcium', folicAcid: 'Folic Acid',
                      oxytocin: 'Oxytocin Inj', injTd: 'Inj TD', misoprostol: 'Misoprostol',
                      dexamethasone: 'Dexamethasone', amlodipine: 'Amlodipine', metformin: 'Metformin'
                    };
                    const status = drugs[dKey] || 'उपलब्ध';
                    return (
                      <div key={dKey} className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                        <span className="text-[10px] text-slate-500 block truncate">{dNames[dKey]}</span>
                        <span className={`font-bold text-xs ${status === 'उपलब्ध' ? 'text-emerald-700' : 'text-rose-600'}`}>
                          {status}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Labour Room Amenities */}
              <div className="border border-slate-300 rounded-xl p-3 bg-white space-y-2">
                <div className="font-bold text-slate-900 text-[11px] pb-1 border-b border-slate-200">
                  22 & 23. प्रसव कक्ष (Labour Room) आवश्यक उपकरण व सुविधाएं
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="flex justify-between border-b pb-1">
                    <span className="text-slate-600">7 ट्रे उपलब्धता:</span>
                    <strong className="text-slate-900">{labourRoom.sevenTrays || 'हाँ'}</strong>
                  </div>
                  <div className="flex justify-between border-b pb-1">
                    <span className="text-slate-600">बेबी वार्मर व भ्रूण डॉपलर:</span>
                    <strong className="text-slate-900">{labourRoom.babyWarmer || 'हाँ'} / {labourRoom.fetalDoppler || 'हाँ'}</strong>
                  </div>
                  <div className="flex justify-between border-b pb-1">
                    <span className="text-slate-600">सक्शन व नेबुलाइजर:</span>
                    <strong className="text-slate-900">{labourRoom.suctionMachine || 'हाँ'} / {labourRoom.nebulizer || 'हाँ'}</strong>
                  </div>
                  <div className="flex justify-between border-b pb-1">
                    <span className="text-slate-600">रोगी कल्याण समिति बैठकें:</span>
                    <strong className="text-slate-900">{record.samitiMeetingsCount || '3'}</strong>
                  </div>
                  <div className="flex justify-between border-b pb-1">
                    <span className="text-slate-600">JSY भुगतान व गर्म पौष्टिक भोजन:</span>
                    <strong className="text-slate-900">{record.jsyPaymentStatus || 'नियमित'} / {record.jsyNutritionFoodGiven || 'हाँ'}</strong>
                  </div>
                  <div className="flex justify-between border-b pb-1">
                    <span className="text-slate-600">108/महतारी एम्बुलेंस:</span>
                    <strong className="text-slate-900">{record.ambulanceAvailable || 'हाँ'}</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 7. AWAS PROFORMA */}
          {/* ========================================================================= */}
          {type === 'awas' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-cyan-50/50 p-3 rounded-xl border border-cyan-200">
                <div>
                  <span className="text-[10px] text-cyan-700 block">हितग्राही का नाम:</span>
                  <span className="font-bold text-slate-900">{record.beneficiaryName || '-'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-cyan-700 block">पिता / पति का नाम:</span>
                  <span className="font-semibold text-slate-800">{record.fatherName || '-'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-cyan-700 block">हितग्राही आईडी (PMAY ID):</span>
                  <span className="font-bold text-slate-900 font-mono">{record.beneficiaryId || '-'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-cyan-700 block">सामाजिक संवर्ग:</span>
                  <span className="font-semibold text-slate-800">{record.category || 'ST'}</span>
                </div>
              </div>

              {/* Progress and installment */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="border border-slate-300 rounded-xl p-3 bg-white">
                  <div className="font-bold text-[11px] text-cyan-900 mb-2 pb-1 border-b border-slate-200">
                    निर्माण की वर्तमान प्रगति
                  </div>
                  <div className="p-3 bg-cyan-50 rounded-xl border border-cyan-200 text-center">
                    <span className="text-[10px] text-cyan-800 block">वर्तमान निर्माण स्तर</span>
                    <span className="text-base font-black text-cyan-950">{record.currentStage || 'प्लिंथ स्तर'}</span>
                  </div>
                </div>

                <div className="border border-slate-300 rounded-xl p-3 bg-white space-y-1.5">
                  <div className="font-bold text-[11px] text-cyan-900 pb-1 border-b border-slate-200">
                    किश्त एवं राशि उपयोग
                  </div>
                  <div className="flex justify-between text-xs py-1 border-b">
                    <span className="text-slate-600">प्राप्त किश्त राशि:</span>
                    <strong className="text-slate-900">{record.installmentAmount || '25,000/-'}</strong>
                  </div>
                  <div className="flex justify-between text-xs py-1 border-b">
                    <span className="text-slate-600">किश्त भुगतान दिनांक:</span>
                    <strong className="text-slate-900">{record.installmentDate || '-'}</strong>
                  </div>
                  <div className="flex justify-between text-xs py-1">
                    <span className="text-slate-600">राशि का उपयोग:</span>
                    <strong className="text-emerald-800 font-bold">{record.fundUtilization || 'उचित उपयोग किया गया'}</strong>
                  </div>
                </div>
              </div>

              {/* Construction materials on site */}
              <div className="border border-slate-300 rounded-xl overflow-hidden shadow-xs">
                <div className="bg-slate-100 px-3 py-1.5 border-b border-slate-300">
                  <span className="font-bold text-slate-900 text-[11px]">
                    स्थल पर उपलब्ध निर्माण सामग्री की स्थिति
                  </span>
                </div>
                <div className="p-3 grid grid-cols-2 sm:grid-cols-3 gap-2 bg-white text-center text-xs">
                  <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-500 block">ईंट (Bricks)</span>
                    <span className="font-bold text-slate-800">{materials.bricks || 'उपलब्ध'}</span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-500 block">रेत (Sand)</span>
                    <span className="font-bold text-slate-800">{materials.sand || 'उपलब्ध'}</span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-500 block">सीमेंट (Cement)</span>
                    <span className="font-bold text-slate-800">{materials.cement || 'उपलब्ध'}</span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-500 block">छड़ / लोहा (Steel)</span>
                    <span className="font-bold text-slate-800">{materials.steel || 'उपलब्ध'}</span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-500 block">गिट्टी (Aggregate)</span>
                    <span className="font-bold text-slate-800">{materials.aggregate || 'उपलब्ध'}</span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-500 block">पानी व अन्य</span>
                    <span className="font-bold text-slate-800">{materials.other || 'उपलब्ध'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* MANDATORY REMARKS & DIRECTIVES (टीप) */}
          {/* ========================================================================= */}
          <div className="break-inside-avoid border-2 border-amber-400 rounded-xl p-3.5 bg-amber-50/90 shadow-xs space-y-1.5 mt-4">
            <div className="flex items-center gap-2">
              <span className="text-[10px] bg-amber-500 text-slate-950 font-black px-1.5 py-0.5 rounded uppercase">
                अनिवार्य टीप
              </span>
              <span className="font-black text-slate-900 text-xs">
                टीप (निरीक्षणकर्ता की विस्तृत टिप्पणी एवं सुधार हेतु निर्देश):
              </span>
            </div>
            {(() => {
              const tipText = record.remarks?.trim() || 
                record.inspectionSummary?.trim() || 
                record.academicRemarks?.trim() || 
                record.complaints?.trim() || 
                (Array.isArray(academicNotes) ? academicNotes.filter(Boolean).join('; ') : '');
              return tipText ? (
                <p className="text-xs text-slate-950 leading-relaxed whitespace-pre-wrap font-semibold pt-1 border-t border-amber-300">
                  {tipText}
                </p>
              ) : (
                <p className="text-xs text-slate-500 italic pt-1 border-t border-amber-300">
                  निरंक / निरीक्षणकर्ता द्वारा कोई विशेष टीप दर्ज नहीं की गई है।
                </p>
              );
            })()}
          </div>

          {/* ========================================================================= */}
          {/* PHOTO & GPS GEOLOCATION */}
          {/* ========================================================================= */}
          {(record.photoUrl || (record.latitude && record.longitude)) && (
            <div className="break-inside-avoid border border-slate-300 rounded-xl p-3 bg-slate-50 space-y-2 mt-4">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 flex items-center gap-1.5 text-[11px]">
                  <MapPin className="w-3.5 h-3.5 text-rose-600" />
                  <span>निरीक्षण स्थल छायाचित्र एवं जीपीएस लोकेशन (Geo-Tagged Photo):</span>
                </span>
                {record.latitude && record.longitude && (
                  <a
                    href={`https://www.google.com/maps?q=${record.latitude},${record.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="no-print inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 hover:text-blue-900 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200 hover:underline"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>गूगल मैप्स पर देखें</span>
                  </a>
                )}
              </div>

              {record.latitude && record.longitude && (
                <div className="bg-emerald-50 border border-emerald-300 rounded-lg p-2 text-xs font-mono font-bold text-emerald-950 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>
                    अक्षांश (Lat): {record.latitude}° N | देशांतर (Long): {record.longitude}° E
                    {record.geoAccuracy && <span className="text-[10px] font-normal text-emerald-700 ml-1">(±{record.geoAccuracy} मी.)</span>}
                  </span>
                </div>
              )}

              {record.photoUrl && (
                <div className="border border-slate-300 rounded-lg overflow-hidden bg-black/5 flex justify-center">
                  <img
                    src={record.photoUrl}
                    alt="निरीक्षण छायाचित्र"
                    className="max-h-72 object-contain rounded-lg"
                  />
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* VERIFICATION & OFFICIAL SIGNATURE BLOCK */}
          {/* ========================================================================= */}
          <div className="break-inside-avoid pt-8 pb-4 flex justify-between items-end text-xs border-t-2 border-slate-800 mt-6">
            <div className="text-center w-56">
              <div className="h-14 border-b border-dashed border-slate-400 mb-2"></div>
              <p className="font-bold text-slate-900">{meta.leftSignerName}</p>
              <p className="text-[11px] text-slate-700 font-semibold">{meta.leftSigner}</p>
              <p className="text-[10px] text-slate-500">हस्ताक्षर एवं पदमुद्रा</p>
            </div>

            <div className="text-center w-64">
              <div className="h-14 border-b border-dashed border-slate-400 mb-2"></div>
              <p className="font-bold text-slate-950 text-sm">{record.officerName || 'निरीक्षणकर्ता नोडल अधिकारी'}</p>
              <p className="text-[11px] text-slate-800 font-bold">{record.officerDesignation || 'नोडल अधिकारी'}</p>
              {record.officerMobile && <p className="text-[10px] text-slate-600 font-mono">मो: {record.officerMobile}</p>}
              <p className="text-[11px] text-blue-900 font-black mt-1">हस्ताक्षर नोडल अधिकारी</p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

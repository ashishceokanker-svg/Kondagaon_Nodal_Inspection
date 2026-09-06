import React from 'react';
import { X, Printer, Calendar, User, MapPin, CheckCircle2, Camera, ExternalLink } from 'lucide-react';

export default function InspectionDetailModal({ data, onClose }) {
  if (!data || !data.record) return null;
  const { type, record } = data;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between no-print">
          <div>
            <h3 className="text-sm font-bold tracking-tight">निरीक्षण प्रविष्टि विवरण (Inspection Details)</h3>
            <p className="text-[11px] text-slate-400">आईडी: {record.id}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 transition"
            >
              <Printer className="w-3.5 h-3.5" /> प्रिंट करें
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Content / Printable Slip */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          
          {/* Printable Header */}
          <div className="text-center pb-3 border-b-2 border-slate-800">
            <h2 className="text-base font-bold text-slate-900">कार्यालय कलेक्टर, जिला-कोण्डागांव (छ०ग०)</h2>
            <h3 className="text-xs font-bold text-blue-900 uppercase">
              {type === 'anganwadi' && 'आंगनबाड़ी केन्द्र निरीक्षण प्रतिवेदन'}
              {type === 'school' && 'शाला निरीक्षण / अवलोकन प्रतिवेदन'}
              {type === 'hostel' && 'छात्रावास / आश्रमों का निरीक्षण प्रतिवेदन'}
              {type === 'pds' && 'शासकीय उचित मूल्य दुकान जांच पत्रक'}
              {type === 'chaupal' && 'ग्राम चौपाल निरीक्षण प्रपत्र'}
              {type === 'health' && 'चेक लिस्ट - स्वास्थ्य केन्द्र'}
              {type === 'awas' && 'प्रधानमंत्री आवास स्थल निरीक्षण प्रारूप'}
            </h3>
            <p className="text-[11px] text-slate-600 mt-0.5">
              दिनांक: {record.date || record.inspectionDate} • विकासखण्ड: {record.block || 'कोण्डागांव'}
            </p>
          </div>

          {/* Preliminary Metadata */}
          <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div>
              <span className="text-slate-500 block text-[10px]">संस्था / स्थल का नाम:</span>
              <span className="font-bold text-slate-900 text-sm">
                {record.centerName || record.schoolName || record.hostelName || record.shopName || record.village || record.beneficiaryName}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">ग्राम पंचायत / ग्राम:</span>
              <span className="font-semibold text-slate-800">{record.panchayat || record.village || '-'}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">निरीक्षणकर्ता अधिकारी:</span>
              <span className="font-semibold text-slate-800">{record.officerName}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">पदनाम व मोबाइल:</span>
              <span className="font-semibold text-slate-800">{record.officerDesignation} ({record.officerMobile})</span>
            </div>
          </div>

          {/* Module-specific highlights */}
          {type === 'anganwadi' && record.beneficiaries && (
            <div className="border border-slate-200 rounded-xl p-3 space-y-2">
              <span className="font-bold text-slate-800 block text-[11px]">दर्ज हितग्राही विवरण:</span>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 bg-pink-50 rounded-lg">
                  <span className="text-[10px] text-slate-500 block">06 माह - 3 वर्ष</span>
                  <span className="font-bold">{record.beneficiaries.age06m3y || 0}</span>
                </div>
                <div className="p-2 bg-pink-50 rounded-lg">
                  <span className="text-[10px] text-slate-500 block">3 - 6 वर्ष</span>
                  <span className="font-bold">{record.beneficiaries.age3y6y || 0}</span>
                </div>
                <div className="p-2 bg-pink-50 rounded-lg">
                  <span className="text-[10px] text-slate-500 block">कुल दर्ज</span>
                  <span className="font-bold text-pink-700">{record.beneficiaries.total || 0}</span>
                </div>
              </div>
            </div>
          )}

          {type === 'school' && (
            <div className="border border-slate-200 rounded-xl p-3 grid grid-cols-2 gap-2">
              <div>
                <span className="text-slate-500 block text-[10px]">शिक्षक उपस्थिति:</span>
                <span className="font-semibold">{record.teachersPresent} / {record.teachersPosted}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">छात्र उपस्थिति:</span>
                <span className="font-semibold">{record.studentsPresent} / {record.studentsEnrolled}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">मध्यान्ह भोजन:</span>
                <span className="font-semibold">{record.midDayMeal}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">भवन स्थिति:</span>
                <span className="font-semibold">{record.buildingCondition}</span>
              </div>
            </div>
          )}

          {type === 'hostel' && (
            <div className="border border-slate-200 rounded-xl p-3 grid grid-cols-2 gap-2">
              <div>
                <span className="text-slate-500 block text-[10px]">स्वीकृत / उपस्थित सीट:</span>
                <span className="font-semibold">{record.sanctionedSeats} / {record.presentStudents}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">अधीक्षक निवास:</span>
                <span className="font-semibold">{record.superintendentResiding}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">CCTV / RO:</span>
                <span className="font-semibold">CCTV: {record.cctvWorking} • RO: {record.roWorking}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">भोजन गुणवत्ता:</span>
                <span className="font-semibold">{record.foodQuality}</span>
              </div>
            </div>
          )}

          {type === 'pds' && (
            <div className="border border-slate-200 rounded-xl p-3 grid grid-cols-2 gap-2">
              <div>
                <span className="text-slate-500 block text-[10px]">दुकान आईडी:</span>
                <span className="font-semibold">{record.shopId}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">चावल उत्सव:</span>
                <span className="font-semibold">{record.riceFestivalHeld}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">06 तारीख तक भण्डारण:</span>
                <span className="font-semibold">{record.stockBySixth}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">तौल व गुणवत्ता:</span>
                <span className="font-semibold">{record.weightAndQualityOk}</span>
              </div>
            </div>
          )}

          {type === 'awas' && (
            <div className="border border-slate-200 rounded-xl p-3 grid grid-cols-2 gap-2">
              <div>
                <span className="text-slate-500 block text-[10px]">हितग्राही क्रमांक (ID):</span>
                <span className="font-semibold">{record.beneficiaryId || '-'}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">प्रगति स्तर:</span>
                <span className="font-bold text-cyan-800">{record.currentStage}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">किश्त राशि:</span>
                <span className="font-semibold">{record.installmentAmount}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">राशि उपयोग:</span>
                <span className="font-semibold">{record.fundUtilization}</span>
              </div>
            </div>
          )}

          {/* Mandatory Remarks & Instructions (टीप) */}
          <div className="border-2 border-amber-300 rounded-2xl p-4 bg-amber-50/90 shadow-xs space-y-1.5">
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
                (Array.isArray(record.academicNotes) ? record.academicNotes.filter(Boolean).join('; ') : '');
              return tipText ? (
                <p className="text-xs text-slate-900 leading-relaxed whitespace-pre-wrap font-semibold pt-1 border-t border-amber-200/60">
                  {tipText}
                </p>
              ) : (
                <p className="text-xs text-slate-500 italic pt-1 border-t border-amber-200/60">
                  निरंक / निरीक्षणकर्ता द्वारा कोई विशेष टीप दर्ज नहीं की गई है।
                </p>
              );
            })()}
          </div>

          {/* Photo & GPS Geolocation */}
          {(record.photoUrl || (record.latitude && record.longitude)) && (
            <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 flex items-center gap-1.5 text-[11px]">
                  <Camera className="w-3.5 h-3.5 text-slate-700" />
                  <span>निरीक्षण स्थल छायाचित्र एवं जीपीएस लोकेशन:</span>
                </span>
                {record.latitude && record.longitude && (
                  <a
                    href={`https://www.google.com/maps?q=${record.latitude},${record.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 hover:text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 hover:underline"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>गूगल मैप्स पर देखें</span>
                  </a>
                )}
              </div>

              {record.latitude && record.longitude && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2 text-xs font-mono font-bold text-emerald-950 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>
                    अक्षांश (Lat): {record.latitude}° N | देशांतर (Long): {record.longitude}° E
                    {record.geoAccuracy && <span className="text-[10px] font-normal text-emerald-700 ml-1">(±{record.geoAccuracy} मी.)</span>}
                  </span>
                </div>
              )}

              {record.photoUrl && (
                <div className="relative border border-slate-200 rounded-lg overflow-hidden bg-black/5">
                  <img
                    src={record.photoUrl}
                    alt="Inspection site"
                    className="w-full max-h-64 object-contain rounded-lg"
                  />
                </div>
              )}
            </div>
          )}


        </div>

      </div>
    </div>
  );
}

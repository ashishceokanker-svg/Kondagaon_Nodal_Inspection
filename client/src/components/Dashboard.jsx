import React, { useState, useEffect } from 'react';
import { Baby, GraduationCap, Building, Wheat, Landmark, Activity, Home, FileSpreadsheet, ChevronRight, Clock, PlusCircle, MapPin, CheckCircle, AlertTriangle, ClipboardCheck, Users, UserPlus } from 'lucide-react';
import { API } from '../api';

export default function Dashboard({ officer, onSelectModule, onViewGoswara, onViewDetail, onViewCompliance, onViewOfficers }) {
  const isAdmin = officer?.role === 'admin' || officer?.id === 'admin';
  const [stats, setStats] = useState(null);
  const [recentList, setRecentList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [officer]);

  const loadDashboardData = async () => {
    try {
      const isAdmin = officer?.role === 'admin' || officer?.id === 'admin';
      const data = await API.getGoswaraSummary({ officerId: isAdmin ? '' : officer?.id });
      setStats(data);
      setRecentList(data.recentInspections || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const modules = [
    {
      key: 'anganwadi',
      title: 'आंगनबाड़ी केन्द्र निरीक्षण',
      desc: 'हितग्राही संख्या, पूरक पोषण आहार, राशन वितरण टेबल',
      icon: Baby,
      color: 'from-pink-500 to-rose-600',
      badgeBg: 'bg-pink-50 text-pink-700 border-pink-200',
      countKey: 'anganwadi'
    },
    {
      key: 'school',
      title: 'शाला निरीक्षण / अवलोकन',
      desc: 'शिक्षक/छात्र उपस्थिति, मध्यान्ह भोजन, अकादमिक स्तर',
      icon: GraduationCap,
      color: 'from-blue-600 to-indigo-700',
      badgeBg: 'bg-blue-50 text-blue-700 border-blue-200',
      countKey: 'school'
    },
    {
      key: 'hostel',
      title: 'छात्रावास / आश्रम निरीक्षण',
      desc: 'अधीक्षक निवास, कर्मचारी संख्या, सीसीटीवी, आरओ, भोजन',
      icon: Building,
      color: 'from-emerald-600 to-teal-700',
      badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      countKey: 'hostel'
    },
    {
      key: 'pds',
      title: 'शासकीय उचित मूल्य दुकान',
      desc: 'चावल उत्सव, भण्डारण, तौल व गुणवत्ता, हितग्राही चर्चा',
      icon: Wheat,
      color: 'from-amber-600 to-orange-600',
      badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
      countKey: 'pds'
    },
    {
      key: 'chaupal',
      title: 'ग्राम चौपाल निरीक्षण प्रपत्र',
      desc: '21 विभागों एवं कल्याणकारी योजनाओं की ग्राम समीक्षा',
      icon: Landmark,
      color: 'from-purple-600 to-indigo-800',
      badgeBg: 'bg-purple-50 text-purple-700 border-purple-200',
      countKey: 'chaupal'
    },
    {
      key: 'health',
      title: 'स्वास्थ्य केन्द्र चेक लिस्ट',
      desc: 'स्टाफ उपस्थिति, 9 जीवनरक्षक दवाएं, प्रसव कक्ष सुविधाएं',
      icon: Activity,
      color: 'from-red-600 to-rose-700',
      badgeBg: 'bg-red-50 text-red-700 border-red-200',
      countKey: 'health'
    },
    {
      key: 'awas',
      title: 'प्रधानमंत्री आवास स्थल निरीक्षण',
      desc: 'किश्त राशि, निर्माण प्रगति स्तर, उपलब्ध निर्माण सामग्री',
      icon: Home,
      color: 'from-cyan-600 to-teal-700',
      badgeBg: 'bg-cyan-50 text-cyan-700 border-cyan-200',
      countKey: 'awas'
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-5 mb-16">
      
      {/* Officer Welcome Card */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-4 sm:p-5 shadow-lg border border-slate-700/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[11px] bg-amber-400/20 text-amber-300 font-bold px-2.5 py-0.5 rounded-full border border-amber-400/30 inline-block mb-1.5">
              {isAdmin ? 'जिला प्रशासन एडमिन' : 'क्षेत्रीय नोडल अधिकारी'}
            </span>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight">
              नमस्ते, {officer?.name || (isAdmin ? 'जिला प्रशासक' : 'अधिकारी महोदय')}
            </h2>
            <p className="text-xs text-blue-200">
              {officer?.designation} • विकासखण्ड: {officer?.block || 'समस्त विकासखण्ड'}
            </p>
            {officer?.panchayats?.length > 0 && (
              <p className="text-[11px] text-slate-300 mt-1 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
                <span>आवंटित क्षेत्र: {officer.panchayats.join(', ')}</span>
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
            {isAdmin && (
              <>
                <button
                  onClick={onViewOfficers}
                  className="bg-sky-500 hover:bg-sky-600 text-slate-950 font-bold text-xs py-2.5 px-3 rounded-xl shadow-md flex items-center justify-center gap-1.5 transition active:scale-95"
                >
                  <Users className="w-4 h-4 text-slate-950" />
                  <span>नोडल अधिकारी प्रबंधन</span>
                </button>
                <button
                  onClick={onViewCompliance}
                  className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs py-2.5 px-3 rounded-xl shadow-md flex items-center justify-center gap-1.5 transition active:scale-95"
                >
                  <ClipboardCheck className="w-4 h-4 text-slate-950" />
                  <span>माहवार समीक्षा</span>
                </button>
              </>
            )}

            <button
              onClick={onViewGoswara}
              className="bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-xs py-2.5 px-3 rounded-xl shadow-md flex items-center justify-center gap-1.5 transition active:scale-95"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-800" />
              <span>गोसवारा रिपोर्ट</span>
            </button>
          </div>
        </div>

        {/* Quick counter bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 pt-3 border-t border-white/10 text-center text-xs">
          <div className="bg-white/5 p-2 rounded-xl">
            <span className="text-[10px] text-slate-300 block">कुल निरीक्षण</span>
            <span className="text-base font-bold text-amber-300">{stats?.totalInspections || 0}</span>
          </div>
          <div className="bg-white/5 p-2 rounded-xl">
            <span className="text-[10px] text-slate-300 block">पंचायतें कवर्ड</span>
            <span className="text-base font-bold text-white">{stats?.panchayatStats?.length || 0}</span>
          </div>
          <div className="bg-white/5 p-2 rounded-xl">
            <span className="text-[10px] text-slate-300 block">स्कूल / आंगनबाड़ी</span>
            <span className="text-base font-bold text-emerald-300">
              {(stats?.typeStats?.school?.count || 0) + (stats?.typeStats?.anganwadi?.count || 0)}
            </span>
          </div>
          <div className="bg-white/5 p-2 rounded-xl">
            <span className="text-[10px] text-slate-300 block">स्वास्थ्य / चौपाल</span>
            <span className="text-base font-bold text-sky-300">
              {(stats?.typeStats?.health?.count || 0) + (stats?.typeStats?.chaupal?.count || 0)}
            </span>
          </div>
        </div>
      </div>

      {/* Main Section: For Admin -> Management & Reports; For Officer -> 7 Inspection Forms */}
      {isAdmin ? (
        <div className="space-y-3.5">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Building className="w-4 h-4 text-blue-700" />
              प्रशासनिक नियंत्रण एवं समीक्षा (Admin Management)
            </h3>
            <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-bold">
              प्रविष्टि फॉर्म केवल नोडल अधिकारियों हेतु आरक्षित
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* 1. Nodal Officers Management Card */}
            <div
              onClick={onViewOfficers}
              className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-200 hover:border-sky-400 hover:shadow-md cursor-pointer transition flex items-start justify-between gap-3 group relative overflow-hidden active:scale-[0.99]"
            >
              <div className="flex items-start gap-3.5">
                <div className="p-3.5 rounded-2xl bg-gradient-to-br from-blue-600 to-sky-700 text-white shadow-md shrink-0 group-hover:scale-105 transition">
                  <Users className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] bg-sky-100 text-sky-800 font-black px-2 py-0.5 rounded">
                      डायरेक्टरी
                    </span>
                    <h4 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-blue-700 transition">
                      नोडल अधिकारी प्रबंधन (Add / Edit / Delete)
                    </h4>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    जिले के समस्त नोडल अधिकारियों की सूची देखें, नया अधिकारी जोड़ें, विवरण सुधारें या हटाएं।
                  </p>
                  <div className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition">
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>नोडल अधिकारी प्रबंधित करें</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Monthly Compliance Review Card */}
            <div
              onClick={onViewCompliance}
              className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-200 hover:border-emerald-400 hover:shadow-md cursor-pointer transition flex items-start justify-between gap-3 group relative overflow-hidden active:scale-[0.99]"
            >
              <div className="flex items-start gap-3.5">
                <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-md shrink-0 group-hover:scale-105 transition">
                  <ClipboardCheck className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-black px-2 py-0.5 rounded">
                      माहवार समीक्षा
                    </span>
                    <h4 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-emerald-700 transition">
                      माहवार निरीक्षण समीक्षा (Compliance Report)
                    </h4>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    देखें किस ब्लॉक में उस माह में कितनों ने निरीक्षण किया और कितनों ने नहीं किया (किए व नहीं किए सूची व एक्सेल)।
                  </p>
                  <div className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition">
                    <ClipboardCheck className="w-3.5 h-3.5" />
                    <span>समीक्षा रिपोर्ट खोलें</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Consolidated Goswara Reports & Excel Export Card */}
            <div
              onClick={onViewGoswara}
              className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-200 hover:border-amber-400 hover:shadow-md cursor-pointer transition flex items-start justify-between gap-3 group relative overflow-hidden active:scale-[0.99] sm:col-span-2"
            >
              <div className="flex items-start gap-3.5">
                <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-md shrink-0 group-hover:scale-105 transition">
                  <FileSpreadsheet className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] bg-amber-100 text-amber-900 font-black px-2 py-0.5 rounded">
                      समेकित गोसवारा
                    </span>
                    <h4 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-amber-700 transition">
                      डिजिटल गोसवारा रिपोर्ट एवं शासकीय एक्सेल डाउनलोड
                    </h4>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    जिले के सभी 7 निरीक्षण प्रपत्रों की समेकित रिपोर्ट देखें, प्रिंट करें एवं मल्टी-शीट आधिकारिक एक्सेल (.xlsx) डाउनलोड करें।
                  </p>
                  <div className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-amber-900 bg-amber-100 px-3 py-1.5 rounded-xl group-hover:bg-amber-500 group-hover:text-slate-950 transition">
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>गोसवारा रिपोर्ट व एक्सेल खोलें</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Section Title for Nodal Officers */}
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              निरीक्षण प्रपत्र चुनें (Select Form)
            </h3>
            <span className="text-[11px] text-slate-500 font-medium">7 श्रेणियां उपलब्ध</span>
          </div>

          {/* 7 Inspection Modules Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {modules.map(mod => {
              const count = stats?.typeStats?.[mod.countKey]?.count || 0;
              return (
                <div
                  key={mod.key}
                  onClick={() => onSelectModule(mod.key)}
                  className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 hover:border-slate-300 hover:shadow-md cursor-pointer transition flex items-start justify-between gap-3 group relative overflow-hidden active:scale-[0.99]"
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-3 rounded-2xl bg-gradient-to-br ${mod.color} text-white shadow-md shrink-0 group-hover:scale-105 transition`}>
                      <mod.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-700 transition">
                        {mod.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">
                        {mod.desc}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${mod.badgeBg}`}>
                          दर्ज: {count}
                        </span>
                        <span className="text-[10px] text-blue-600 font-semibold flex items-center gap-0.5 hover:underline">
                          नया फॉर्म भरें <PlusCircle className="w-3 h-3 inline" />
                        </span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-slate-600 shrink-0 self-center transition" />
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Recent Inspections Timeline */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-200 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-blue-600" />
            हाल ही में किए गए निरीक्षण (Recent Activity)
          </h3>
          <button
            onClick={onViewGoswara}
            className="text-xs text-blue-700 hover:underline font-semibold"
          >
            सभी देखें
          </button>
        </div>

        {recentList.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {recentList.slice(0, 6).map((item, idx) => (
              <div
                key={item.id || idx}
                onClick={() => onViewDetail({ type: item.typeKey, record: item })}
                className="py-2.5 flex items-center justify-between gap-3 hover:bg-slate-50 px-2 rounded-xl cursor-pointer transition"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 truncate">
                      {item.centerName || item.schoolName || item.hostelName || item.shopName || item.village || item.beneficiaryName || 'निरीक्षण'}
                    </span>
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.2 rounded-full font-medium shrink-0">
                      {item.typeNameHindi}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate">
                    {item.panchayat || item.village || 'ग्राम'} • {item.date || item.inspectionDate} • द्वारा: {item.officerName}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                    item.isDraft ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {item.status || 'पूर्ण'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-slate-400 text-xs">
            अभी तक कोई निरीक्षण दर्ज नहीं किया गया है। ऊपर दिए गए प्रपत्रों से पहला निरीक्षण दर्ज करें।
          </div>
        )}
      </div>

    </div>
  );
}

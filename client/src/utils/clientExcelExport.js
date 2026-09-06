import * as XLSX from 'xlsx';
import { API } from '../api';

function extractTip(r) {
  if (!r) return '';
  if (r.remarks && typeof r.remarks === 'string' && r.remarks.trim()) return r.remarks.trim();
  if (r.inspectionSummary && typeof r.inspectionSummary === 'string' && r.inspectionSummary.trim()) return r.inspectionSummary.trim();
  if (r.academicRemarks && typeof r.academicRemarks === 'string' && r.academicRemarks.trim()) return r.academicRemarks.trim();
  if (r.complaints && typeof r.complaints === 'string' && r.complaints.trim()) return r.complaints.trim();
  if (Array.isArray(r.academicNotes)) {
    const valid = r.academicNotes.filter(n => n && n.trim());
    if (valid.length > 0) return valid.join('; ');
  }
  return 'निरंक';
}

export async function exportGoswaraToExcelClient(filters = {}) {
  const wb = XLSX.utils.book_new();

  // 1. Goswara Summary Sheet
  const goswara = await API.getGoswaraSummary(filters);
  const summaryRows = [
    ['कार्यालय कलेक्टर, जिला-कोण्डागांव (छ०ग०) — नोडल अधिकारी निरीक्षण गोसवारा प्रतिवेदन'],
    ['क्र.', 'ग्राम पंचायत / स्थल', 'कुल निरीक्षण', 'आंगनबाड़ी', 'शाला', 'छात्रावास', 'उचित मूल्य दुकान', 'ग्राम चौपाल', 'स्वास्थ्य केन्द्र', 'पीएम आवास']
  ];

  (goswara.panchayatStats || []).forEach((p, idx) => {
    summaryRows.push([
      idx + 1,
      p.panchayat || '',
      p.total || 0,
      p.anganwadi || 0,
      p.school || 0,
      p.hostel || 0,
      p.pds || 0,
      p.chaupal || 0,
      p.health || 0,
      p.awas || 0
    ]);
  });

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'गोसवारा सारांश');

  // 2. Anganwadi Sheet
  const anganwadi = await API.getInspections('anganwadi', filters);
  const anganwadiRows = [
    ['क्र.', 'निरीक्षण दिनांक', 'नोडल अधिकारी का नाम', 'पदनाम', 'मोबाइल', 'विकासखण्ड', 'ग्राम पंचायत', 'आंगनबाड़ी केन्द्र का नाम', 'कार्यकर्ता का नाम', '06 माह से 03 वर्ष बच्चे', '03 से 06 वर्ष बच्चे', 'गर्भवती महिलाएं', 'शिशुवती महिलाएं', '11-14 वर्ष शाला त्यागी', 'कुल दर्ज हितग्राही', 'राशन वितरण स्थिति', 'टीप (निरीक्षणकर्ता की विस्तृत टिप्पणी एवं सुधार हेतु निर्देश)']
  ];
  anganwadi.forEach((r, idx) => {
    const ben = r.beneficiaries || {};
    anganwadiRows.push([
      idx + 1, r.date || '', r.officerName || '', r.officerDesignation || '', r.officerMobile || '',
      r.block || '', r.panchayat || '', r.centerName || '', r.workerName || '',
      ben.age06m3y || 0, ben.age3y6y || 0, ben.pregnant || 0, ben.lactating || 0, ben.adolescentGirls || 0, ben.total || 0,
      r.rationStatus || 'नियमित', extractTip(r)
    ]);
  });
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(anganwadiRows), 'aaganbadi nirkchan');

  // 3. School Sheet
  const school = await API.getInspections('school', filters);
  const schoolRows = [
    ['क्र.', 'निरीक्षण दिनांक', 'नोडल अधिकारी का नाम', 'पदनाम', 'मोबाइल', 'विकासखण्ड', 'ग्राम पंचायत', 'शाला का नाम', 'स्तर', 'प्रधान पाठक का नाम', 'कुल दर्ज छात्र', 'उपस्थित छात्र', 'कुल शिक्षक', 'उपस्थित शिक्षक', 'मध्यान्ह भोजन स्थिति', 'पेयजल सुविधा', 'शौचालय स्थिति', 'टीप (निरीक्षणकर्ता की विस्तृत टिप्पणी एवं सुधार हेतु निर्देश)']
  ];
  school.forEach((r, idx) => {
    schoolRows.push([
      idx + 1, r.date || '', r.officerName || '', r.officerDesignation || '', r.officerMobile || '',
      r.block || '', r.panchayat || '', r.schoolName || '', r.schoolLevel || '', r.headmasterName || '',
      r.totalEnrolled || 0, r.presentToday || 0, r.totalTeachers || 0, r.presentTeachers || 0,
      r.mdmStatus || '', r.drinkingWater || '', r.toiletStatus || '', extractTip(r)
    ]);
  });
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(schoolRows), 'shala nirkchan');

  // 4. Hostel Sheet
  const hostel = await API.getInspections('hostel', filters);
  const hostelRows = [
    ['क्र.', 'निरीक्षण दिनांक', 'नोडल अधिकारी का नाम', 'पदनाम', 'मोबाइल', 'विकासखण्ड', 'ग्राम पंचायत', 'छात्रावास / आश्रम का नाम', 'अधीक्षक का नाम', 'स्वीकृत सीट', 'दर्ज छात्र/छात्रा', 'उपस्थित छात्र/छात्रा', 'भोजन गुणवत्ता', 'सुरक्षा व्यवस्था', 'टीप (निरीक्षणकर्ता की विस्तृत टिप्पणी एवं सुधार हेतु निर्देश)']
  ];
  hostel.forEach((r, idx) => {
    hostelRows.push([
      idx + 1, r.date || '', r.officerName || '', r.officerDesignation || '', r.officerMobile || '',
      r.block || '', r.panchayat || '', r.hostelName || '', r.superintendentName || '',
      r.sanctionedSeats || 0, r.enrolledStudents || 0, r.presentStudents || 0,
      r.foodQuality || '', r.securityStatus || '', extractTip(r)
    ]);
  });
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(hostelRows), 'chatravas nirkchan');

  // 5. PDS Sheet
  const pds = await API.getInspections('pds', filters);
  const pdsRows = [
    ['क्र.', 'निरीक्षण दिनांक', 'नोडल अधिकारी का नाम', 'पदनाम', 'मोबाइल', 'विकासखण्ड', 'ग्राम पंचायत', 'उचित मूल्य दुकान क्र.', 'संचालक एजेंसी', 'विक्रेता का नाम', 'कुल राशनकार्ड', 'दुकान खुलने की स्थिति', 'स्टॉक बोर्ड अद्यतन', 'तौल कांटा सत्यापन', 'टीप (निरीक्षणकर्ता की विस्तृत टिप्पणी एवं सुधार हेतु निर्देश)']
  ];
  pds.forEach((r, idx) => {
    pdsRows.push([
      idx + 1, r.date || '', r.officerName || '', r.officerDesignation || '', r.officerMobile || '',
      r.block || '', r.panchayat || '', r.shopNumber || '', r.agencyName || '', r.salesmanName || '',
      r.totalCards || 0, r.isOpenRegularly || '', r.stockBoardUpdated || '', r.weighingScaleVerified || '', extractTip(r)
    ]);
  });
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(pdsRows), 'PDS nirkchan');

  // 6. Chaupal Sheet
  const chaupal = await API.getInspections('chaupal', filters);
  const chaupalRows = [
    ['क्र.', 'चौपाल दिनांक', 'नोडल अधिकारी का नाम', 'पदनाम', 'मोबाइल', 'विकासखण्ड', 'ग्राम पंचायत', 'ग्राम', 'कुल जनसंख्या', 'प्राप्त शिकायतें / मांग', 'निराकृत शिकायतें', 'टीप (निरीक्षणकर्ता की विस्तृत टिप्पणी एवं सुधार हेतु निर्देश)']
  ];
  chaupal.forEach((r, idx) => {
    chaupalRows.push([
      idx + 1, r.date || r.chaupalDate || '', r.officerName || '', r.officerDesignation || '', r.officerMobile || '',
      r.block || '', r.panchayat || '', r.village || '', r.population || 0,
      r.complaintsCount || 0, r.resolvedCount || 0, extractTip(r)
    ]);
  });
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(chaupalRows), 'gram chopal');

  // 7. Health Sheet
  const health = await API.getInspections('health', filters);
  const healthRows = [
    ['क्र.', 'निरीक्षण दिनांक', 'नोडल अधिकारी का नाम', 'पदनाम', 'मोबाइल', 'विकासखण्ड', 'ग्राम पंचायत', 'स्वास्थ्य संस्था का नाम', 'संस्था स्तर (उपकेन्द्र/PHC/CHC)', 'प्रभारी चिकित्सा अधिकारी / CHO', 'दवाओं की उपलब्धता', 'प्रसव सुविधा उपलब्धता', 'टीप (निरीक्षणकर्ता की विस्तृत टिप्पणी एवं सुधार हेतु निर्देश)']
  ];
  health.forEach((r, idx) => {
    healthRows.push([
      idx + 1, r.date || '', r.officerName || '', r.officerDesignation || '', r.officerMobile || '',
      r.block || '', r.panchayat || '', r.healthCenterName || '', r.facilityLevel || '', r.inchargeName || '',
      r.medicineAvailability || '', r.deliveryFacility || '', extractTip(r)
    ]);
  });
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(healthRows), 'helth nirkchan');

  // 8. Awas Sheet
  const awas = await API.getInspections('awas', filters);
  const awasRows = [
    ['क्र.', 'निरीक्षण दिनांक', 'नोडल अधिकारी का नाम', 'पदनाम', 'मोबाइल', 'विकासखण्ड', 'ग्राम पंचायत', 'ग्राम', 'हितग्राही का नाम', 'पिता/पति का नाम', 'स्वीकृति वर्ष', 'वर्तमान निर्माण स्तर', 'किश्त भुगतान स्थिति', 'टीप (निरीक्षणकर्ता की विस्तृत टिप्पणी एवं सुधार हेतु निर्देश)']
  ];
  awas.forEach((r, idx) => {
    awasRows.push([
      idx + 1, r.date || '', r.officerName || '', r.officerDesignation || '', r.officerMobile || '',
      r.block || '', r.panchayat || '', r.village || '', r.beneficiaryName || '', r.fatherHusbandName || '',
      r.sanctionYear || '', r.constructionStage || '', r.installmentStatus || '', extractTip(r)
    ]);
  });
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(awasRows), 'awas nirkchan');

  const fileName = `Nodal_Goswara_Report_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

export async function exportComplianceToExcelClient(filters = {}) {
  const data = await API.getComplianceReport(filters);
  const wb = XLSX.utils.book_new();

  // 1. Summary Sheet
  const sum = data.summary || {};
  const summaryRows = [
    ['कार्यालय कलेक्टर, जिला-कोण्डागांव (छ०ग०) — नोडल अधिकारी मासिक निरीक्षण अनुपालन प्रतिवेदन'],
    ['माह:', sum.selectedMonth || '', 'विकासखण्ड:', sum.selectedBlock || ''],
    ['कुल नोडल अधिकारी', 'निरीक्षण पूर्ण करने वाले', 'लंबित नोडल अधिकारी', 'अनुपालन प्रतिशत (%)', 'कुल दर्ज निरीक्षण'],
    [sum.totalOfficers || 0, sum.completedCount || 0, sum.pendingCount || 0, `${sum.completionRate || 0}%`, sum.totalInspections || 0]
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summaryRows), 'मासिक अनुपालन सारांश');

  // 2. Completed List
  const completedRows = [
    ['क्र.', 'अधिकारी का नाम', 'पदनाम', 'मोबाइल', 'विकासखण्ड', 'आवंटित ग्राम पंचायत', 'निरीक्षण संख्या', 'निरीक्षित क्षेत्र']
  ];
  (data.completedList || []).forEach((o, idx) => {
    completedRows.push([
      idx + 1, o.name, o.designation, o.mobile, o.block, o.panchayat || (o.panchayats ? o.panchayats.join(', ') : ''),
      o.inspectionCount, (o.inspectedTypes || []).join(', ')
    ]);
  });
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(completedRows), 'निरीक्षण पूर्ण करने वाले');

  // 3. Pending List
  const pendingRows = [
    ['क्र.', 'अधिकारी का नाम', 'पदनाम', 'मोबाइल', 'विकासखण्ड', 'आवंटित ग्राम पंचायत', 'स्थिति']
  ];
  (data.pendingList || []).forEach((o, idx) => {
    pendingRows.push([
      idx + 1, o.name, o.designation, o.mobile, o.block, o.panchayat || (o.panchayats ? o.panchayats.join(', ') : ''),
      'निरीक्षण नहीं किया (लंबित)'
    ]);
  });
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(pendingRows), 'लंबित (निरीक्षण नहीं करने वाले)');

  const fileName = `Monthly_Compliance_Report_${(sum.selectedBlock || 'All')}_${(sum.selectedMonth || '2026').replace(/\s+/g, '_')}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

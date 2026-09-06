const ExcelJS = require('exceljs');
const DB = require('./db');

async function generateGoswaraExcel(filters = {}) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Nodal Officer Inspection Portal';
  workbook.created = new Date();

  // Helper styles
  const headerFill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1E3A8A' } // Deep Blue
  };
  const headerFont = {
    name: 'Arial',
    size: 11,
    bold: true,
    color: { argb: 'FFFFFFFF' }
  };
  const titleFill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF3B82F6' } // Sky Blue
  };
  const titleFont = {
    name: 'Arial',
    size: 13,
    bold: true,
    color: { argb: 'FFFFFFFF' }
  };
  const borderStyle = {
    top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
  };

  // 1. SUMMARY SHEET (गोसवारा सारांश)
  const summarySheet = workbook.addWorksheet('गोसवारा सारांश');
  summarySheet.mergeCells('A1:J1');
  const titleCell = summarySheet.getCell('A1');
  titleCell.value = 'कार्यालय कलेक्टर, जिला-कोण्डागांव (छ०ग०) — नोडल अधिकारी निरीक्षण गोसवारा प्रतिवेदन';
  titleCell.font = titleFont;
  titleCell.fill = titleFill;
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  summarySheet.getRow(1).height = 30;

  summarySheet.addRow([
    'क्र.', 'ग्राम पंचायत / स्थल', 'कुल निरीक्षण', 'आंगनबाड़ी', 'शाला', 'छात्रावास', 'उचित मूल्य दुकान', 'ग्राम चौपाल', 'स्वास्थ्य केन्द्र', 'पीएम आवास'
  ]);
  const summaryHeaderRow = summarySheet.getRow(2);
  summaryHeaderRow.height = 25;
  summaryHeaderRow.eachCell(cell => {
    cell.font = headerFont;
    cell.fill = headerFill;
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = borderStyle;
  });

  const goswaraData = DB.getGoswaraSummary(filters);
  goswaraData.panchayatStats.forEach((p, idx) => {
    const row = summarySheet.addRow([
      idx + 1,
      p.panchayat,
      p.total,
      p.anganwadi || 0,
      p.school || 0,
      p.hostel || 0,
      p.pds || 0,
      p.chaupal || 0,
      p.health || 0,
      p.awas || 0
    ]);
    row.eachCell(c => {
      c.border = borderStyle;
      c.alignment = { vertical: 'middle' };
    });
  });

  summarySheet.columns = [
    { width: 6 }, { width: 25 }, { width: 14 }, { width: 14 }, { width: 14 },
    { width: 14 }, { width: 18 }, { width: 14 }, { width: 16 }, { width: 14 }
  ];

  function getExtractTip(r) {
    if (!r) return '';
    if (r.remarks && typeof r.remarks === 'string' && r.remarks.trim()) return r.remarks.trim();
    if (r.inspectionSummary && typeof r.inspectionSummary === 'string' && r.inspectionSummary.trim()) return r.inspectionSummary.trim();
    if (r.academicRemarks && typeof r.academicRemarks === 'string' && r.academicRemarks.trim()) return r.academicRemarks.trim();
    if (r.complaints && typeof r.complaints === 'string' && r.complaints.trim()) return r.complaints.trim();
    if (Array.isArray(r.academicNotes)) {
      const valid = r.academicNotes.filter(n => n && n.trim());
      if (valid.length > 0) return valid.join('; ');
    }
    return '';
  }

  // 2. ANGANWADI SHEET (aaganbadi nirkchan)
  const anganwadiSheet = workbook.addWorksheet('aaganbadi nirkchan');
  anganwadiSheet.addRow([
    'क्र.', 'निरीक्षण दिनांक', 'नोडल अधिकारी का नाम', 'पदनाम', 'मोबाइल', 'विकासखण्ड', 'ग्राम पंचायत', 
    'आंगनबाड़ी केन्द्र का नाम', 'कार्यकर्ता का नाम', '06 माह से 03 वर्ष बच्चे', '03 से 06 वर्ष बच्चे', 
    'गर्भवती महिलाएं', 'शिशुवती महिलाएं', '11-14 वर्ष शाला त्यागी', 'कुल दर्ज हितग्राही', 'राशन वितरण स्थिति', 'टीप (निरीक्षणकर्ता की विस्तृत टिप्पणी एवं सुधार हेतु निर्देश)'
  ]);
  anganwadiSheet.getRow(1).height = 28;
  anganwadiSheet.getRow(1).eachCell(cell => {
    cell.font = headerFont;
    cell.fill = headerFill;
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = borderStyle;
  });

  const anganwadiRecords = DB.getInspections('anganwadi', filters);
  anganwadiRecords.forEach((r, idx) => {
    const ben = r.beneficiaries || {};
    const row = anganwadiSheet.addRow([
      idx + 1,
      r.date || '',
      r.officerName || '',
      r.officerDesignation || '',
      r.officerMobile || '',
      r.block || '',
      r.panchayat || '',
      r.centerName || '',
      r.workerName || '',
      ben.age06m3y || 0,
      ben.age3y6y || 0,
      ben.pregnant || 0,
      ben.lactating || 0,
      ben.adolescentGirls || 0,
      ben.total || 0,
      r.rationStatus || 'नियमित',
      getExtractTip(r) || 'निरंक'
    ]);
    row.eachCell((c, colNum) => { 
      c.border = borderStyle; 
      c.alignment = { vertical: 'middle', wrapText: colNum === 17 }; 
    });
  });
  anganwadiSheet.columns = [
    { width: 6 }, { width: 15 }, { width: 22 }, { width: 20 }, { width: 15 },
    { width: 16 }, { width: 18 }, { width: 24 }, { width: 20 }, { width: 12 },
    { width: 12 }, { width: 12 }, { width: 12 }, { width: 12 }, { width: 14 },
    { width: 18 }, { width: 45 }
  ];

  // 3. SCHOOL SHEET (Shala_Nirikshan)
  const schoolSheet = workbook.addWorksheet('Shala_Nirikshan');
  schoolSheet.addRow([
    'क्र.', 'निरीक्षण दिनांक', 'माह', 'नोडल अधिकारी', 'विकासखण्ड', 'ग्राम पंचायत / शाला नाम', 'शाला स्तर', 'संकुल का नाम',
    'शिक्षक पदस्थ', 'शिक्षक उपस्थित', 'समय पर उपस्थिति', 'छात्र दर्ज', 'छात्र उपस्थित', 'पाठ्य सामग्री/गणवेश',
    'भवन स्थिति', 'मूलभूत सुविधा (जल/विद्युत/शौचालय)', 'मध्यान्ह भोजन स्थिति', 'बैगलेस डे', 'टीप (निरीक्षणकर्ता की विस्तृत टिप्पणी एवं सुधार हेतु निर्देश)'
  ]);
  schoolSheet.getRow(1).height = 28;
  schoolSheet.getRow(1).eachCell(cell => {
    cell.font = headerFont;
    cell.fill = headerFill;
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = borderStyle;
  });

  const schoolRecords = DB.getInspections('school', filters);
  schoolRecords.forEach((r, idx) => {
    const row = schoolSheet.addRow([
      idx + 1,
      r.date || '',
      r.month || '',
      r.officerName || '',
      r.block || '',
      r.schoolName || '',
      r.schoolLevel || '',
      r.sankul || '',
      r.teachersPosted || 0,
      r.teachersPresent || 0,
      r.teacherPunctuality || '',
      r.studentsEnrolled || 0,
      r.studentsPresent || 0,
      r.booksUniformsDistributed || '',
      r.buildingCondition || '',
      r.basicAmenities || '',
      r.midDayMeal || '',
      r.baglessDay || '',
      getExtractTip(r) || 'निरंक'
    ]);
    row.eachCell((c, colNum) => { 
      c.border = borderStyle; 
      c.alignment = { vertical: 'middle', wrapText: colNum === 19 }; 
    });
  });
  schoolSheet.columns = [
    { width: 6 }, { width: 15 }, { width: 12 }, { width: 22 }, { width: 16 },
    { width: 25 }, { width: 15 }, { width: 18 }, { width: 12 }, { width: 12 },
    { width: 14 }, { width: 12 }, { width: 12 }, { width: 16 }, { width: 14 },
    { width: 20 }, { width: 16 }, { width: 12 }, { width: 45 }
  ];

  // 4. HOSTEL SHEET (छात्रावास निरीक्षण)
  const hostelSheet = workbook.addWorksheet('छात्रावास निरीक्षण');
  hostelSheet.addRow([
    'क्र.', 'निरीक्षण दिनांक', 'नोडल अधिकारी', 'विकासखण्ड', 'छात्रावास का नाम', 'कैटेगरी (बालक/बालिका)', 'वगग (ST/SC/OBC)',
    'स्वीकृत सीट', 'उपस्थित छात्र संख्या', 'अधीक्षक का नाम', 'परिसर में निवास?', 'भवन स्वयं का?', 'उपयोगी शौचालय संख्या',
    'भोजन गुणवत्ता', 'CCTV उपलब्ध व चालू?', 'RO उपलब्ध व चालू?', 'विद्युत व सोलर?', 'टीप (निरीक्षणकर्ता की विस्तृत टिप्पणी एवं सुधार हेतु निर्देश)'
  ]);
  hostelSheet.getRow(1).height = 28;
  hostelSheet.getRow(1).eachCell(cell => {
    cell.font = headerFont;
    cell.fill = headerFill;
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = borderStyle;
  });

  const hostelRecords = DB.getInspections('hostel', filters);
  hostelRecords.forEach((r, idx) => {
    const row = hostelSheet.addRow([
      idx + 1,
      r.date || '',
      r.officerName || '',
      r.block || '',
      r.hostelName || '',
      r.category || '',
      r.casteCategory || '',
      r.sanctionedSeats || 0,
      r.presentStudents || 0,
      r.superintendentName || '',
      r.superintendentResiding || '',
      r.buildingOwned || '',
      r.usableToilets || 0,
      r.foodQuality || '',
      r.cctvWorking || '',
      r.roWorking || '',
      r.powerSolar || '',
      getExtractTip(r) || 'निरंक'
    ]);
    row.eachCell((c, colNum) => { 
      c.border = borderStyle; 
      c.alignment = { vertical: 'middle', wrapText: colNum === 18 }; 
    });
  });
  hostelSheet.columns = [
    { width: 6 }, { width: 15 }, { width: 22 }, { width: 16 }, { width: 25 },
    { width: 16 }, { width: 14 }, { width: 12 }, { width: 15 }, { width: 20 },
    { width: 14 }, { width: 12 }, { width: 14 }, { width: 14 }, { width: 16 },
    { width: 16 }, { width: 14 }, { width: 45 }
  ];

  // 5. PDS SHEET (उचित मूल्य दुकान जांच)
  const pdsSheet = workbook.addWorksheet('उचित मूल्य दुकान जांच');
  pdsSheet.addRow([
    'क्र.', 'जांच की तिथि', 'नोडल अधिकारी', 'दुकान का नाम एवं आईडी', 'दुकान की स्थिति (नियमित/अनियमित)', 
    'विगत 3 माह चावल उत्सव?', 'माह 06 तारीख तक भण्डारण?', 'टोल फ्री व सूचना बोर्ड?', 'राशन कार्ड (APL / BPL)',
    'राशन तौल एवं गुणवत्ता सही?', 'हितग्राहियों से चर्चा संतोषजनक?', 'दुकानदार का व्यवहार', 'टीप (निरीक्षणकर्ता की विस्तृत टिप्पणी एवं सुधार हेतु निर्देश)'
  ]);
  pdsSheet.getRow(1).height = 28;
  pdsSheet.getRow(1).eachCell(cell => {
    cell.font = headerFont;
    cell.fill = headerFill;
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = borderStyle;
  });

  const pdsRecords = DB.getInspections('pds', filters);
  pdsRecords.forEach((r, idx) => {
    const row = pdsSheet.addRow([
      idx + 1,
      r.date || '',
      r.officerName || '',
      `${r.shopName || ''} (${r.shopId || ''})`,
      r.shopStatus || '',
      r.riceFestivalHeld || '',
      r.stockBySixth || '',
      r.boardsDisplayed || '',
      `APL: ${r.aplCards || 0}, BPL: ${r.bplCards || 0}`,
      r.weightAndQualityOk || '',
      r.publicFeedbackOk || '',
      r.dealerBehavior || '',
      getExtractTip(r) || 'निरंक'
    ]);
    row.eachCell((c, colNum) => { 
      c.border = borderStyle; 
      c.alignment = { vertical: 'middle', wrapText: colNum === 13 }; 
    });
  });
  pdsSheet.columns = [
    { width: 6 }, { width: 15 }, { width: 22 }, { width: 26 }, { width: 18 },
    { width: 16 }, { width: 16 }, { width: 16 }, { width: 20 }, { width: 16 },
    { width: 18 }, { width: 16 }, { width: 45 }
  ];

  // 6. HEALTH SHEET (Hospital nirkichan)
  const healthSheet = workbook.addWorksheet('Hospital nirkichan');
  healthSheet.addRow([
    'क्र.', 'निरीक्षण दिनांक', 'नोडल अधिकारी', 'विकासखण्ड', 'स्वास्थ्य केन्द्र का नाम', 'केन्द्र प्रकार', 'प्रभारी का नाम',
    'कर्मचारी उपस्थिति', 'परिसर साफ-सफाई', 'विगत 01 माह OPD/IPD', '9 आवश्यक दवाएं उपलब्ध?', 'एक्सपायरी दवाई?',
    'संस्थागत प्रसव', 'प्रसव कक्ष 7 ट्रे व उपकरण?', 'बिजली व पानी सुविधा', 'रजिस्टर संधारण', 'टीप (निरीक्षणकर्ता की विस्तृत टिप्पणी एवं सुधार हेतु निर्देश)'
  ]);
  healthSheet.getRow(1).height = 28;
  healthSheet.getRow(1).eachCell(cell => {
    cell.font = headerFont;
    cell.fill = headerFill;
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = borderStyle;
  });

  const healthRecords = DB.getInspections('health', filters);
  healthRecords.forEach((r, idx) => {
    const row = healthSheet.addRow([
      idx + 1,
      r.date || '',
      r.officerName || '',
      r.block || '',
      r.centerName || '',
      r.centerType || '',
      r.inchargeName || '',
      r.staffPresent || '',
      r.cleanliness || '',
      `OPD: ${r.opdCount || 0}, IPD: ${r.ipdCount || 0}`,
      r.essentialDrugsAvailable || '',
      r.expiredDrugsPresent || '',
      r.institutionalDeliveries || 0,
      r.laborRoomEquipped || '',
      r.waterElectricityOk || '',
      r.registersMaintained || '',
      getExtractTip(r) || 'निरंक'
    ]);
    row.eachCell((c, colNum) => { 
      c.border = borderStyle; 
      c.alignment = { vertical: 'middle', wrapText: colNum === 17 }; 
    });
  });
  healthSheet.columns = [
    { width: 6 }, { width: 15 }, { width: 22 }, { width: 16 }, { width: 25 },
    { width: 16 }, { width: 20 }, { width: 16 }, { width: 16 }, { width: 18 },
    { width: 16 }, { width: 14 }, { width: 14 }, { width: 18 }, { width: 16 },
    { width: 16 }, { width: 45 }
  ];

  // 7. GRAM CHAUPAL SHEET (ग्राम चौपाल निरीक्षण प्रपत्)
  const chaupalSheet = workbook.addWorksheet('ग्राम चौपाल निरीक्षण प्रपत्');
  chaupalSheet.addRow([
    'क्र.', 'निरीक्षण दिनांक', 'नोडल अधिकारी', 'विकासखण्ड', 'ग्राम पंचायत', 'ग्राम / आश्रित ग्राम', 'जनसंख्या',
    'शाला स्थिति', 'आंगनबाड़ी स्थिति', 'राशन दुकान', 'स्वास्थ्य उप-केंद्र', 'जल जीवन मिशन', 'बिजली आपूर्ति',
    'सड़क निर्माण मांग', 'पीएम किसान व पशुपालन', 'पीएम आवास स्थिति', 'मनरेगा भुगतान', 'टीप (निरीक्षणकर्ता की विस्तृत टिप्पणी एवं सुधार हेतु निर्देश)'
  ]);
  chaupalSheet.getRow(1).height = 28;
  chaupalSheet.getRow(1).eachCell(cell => {
    cell.font = headerFont;
    cell.fill = headerFill;
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = borderStyle;
  });

  const chaupalRecords = DB.getInspections('chaupal', filters);
  chaupalRecords.forEach((r, idx) => {
    const s = r.sectors || {};
    const row = chaupalSheet.addRow([
      idx + 1,
      r.date || '',
      r.officerName || '',
      r.block || '',
      r.panchayat || '',
      `${r.village || ''} ${r.dependentVillage ? `(${r.dependentVillage})` : ''}`,
      `कुल: ${r.populationTotal || 0}`,
      s.school?.building || '',
      s.anganwadi?.status || '',
      s.pds?.status || '',
      s.health?.status || '',
      s.jjm?.status || '',
      s.electricity?.status || '',
      s.road?.requirement || '',
      s.veterinary?.pmKisanBenefit || '',
      s.pmay?.surveyStatus || '',
      s.mgnrega?.paymentStatus || '',
      getExtractTip(r) || 'निरंक'
    ]);
    row.eachCell((c, colNum) => { 
      c.border = borderStyle; 
      c.alignment = { vertical: 'middle', wrapText: colNum === 18 }; 
    });
  });
  chaupalSheet.columns = [
    { width: 6 }, { width: 15 }, { width: 22 }, { width: 16 }, { width: 20 },
    { width: 24 }, { width: 16 }, { width: 16 }, { width: 16 }, { width: 16 },
    { width: 16 }, { width: 16 }, { width: 16 }, { width: 22 }, { width: 18 },
    { width: 18 }, { width: 16 }, { width: 45 }
  ];

  // 8. PM AWAS SHEET (Awas Nirikshan)
  const awasSheet = workbook.addWorksheet('Awas Nirikshan');
  awasSheet.addRow([
    'क्र.', 'निरीक्षण दिनांक', 'नोडल अधिकारी', 'विकासखण्ड', 'ग्राम पंचायत', 'ग्राम', 'हितग्राही का नाम',
    'पिता/पति का नाम', 'वर्ग', 'हितग्राही क्रमांक', 'प्रदत्त किश्त राशि', 'आवास की वर्तमान स्थिति',
    'उपलब्ध सामग्री (ईंट, रेत, सीमेंट, छड़)', 'टीप (निरीक्षणकर्ता की विस्तृत टिप्पणी एवं सुधार हेतु निर्देश)'
  ]);
  awasSheet.getRow(1).height = 28;
  awasSheet.getRow(1).eachCell(cell => {
    cell.font = headerFont;
    cell.fill = headerFill;
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = borderStyle;
  });

  const awasRecords = DB.getInspections('awas', filters);
  awasRecords.forEach((r, idx) => {
    const mat = r.materials || {};
    const matText = `ईंट: ${mat.bricks || '-'}, रेत: ${mat.sand || '-'}, सीमेंट: ${mat.cement || '-'}, छड़: ${mat.steel || '-'}`;
    const row = awasSheet.addRow([
      idx + 1,
      r.date || '',
      r.officerName || '',
      r.block || '',
      r.panchayat || '',
      r.village || '',
      r.beneficiaryName || '',
      r.fatherName || '',
      r.category || '',
      r.beneficiaryId || '',
      r.installmentAmount || '',
      r.currentStage || '',
      matText,
      getExtractTip(r) || 'निरंक'
    ]);
    row.eachCell((c, colNum) => { 
      c.border = borderStyle; 
      c.alignment = { vertical: 'middle', wrapText: colNum === 14 }; 
    });
  });
  awasSheet.columns = [
    { width: 6 }, { width: 15 }, { width: 22 }, { width: 16 }, { width: 20 },
    { width: 20 }, { width: 22 }, { width: 22 }, { width: 12 }, { width: 18 },
    { width: 16 }, { width: 22 }, { width: 35 }, { width: 45 }
  ];

  // 9. ALL REMARKS & DIRECTIVES SHEET (समस्त_टीप_एवं_निर्देश)
  const allTipsSheet = workbook.addWorksheet('समस्त_टीप_एवं_निर्देश');
  allTipsSheet.addRow([
    'क्र.', 'निरीक्षण दिनांक', 'माह', 'प्रपत्र / संस्था श्रेणी', 'संस्था / केन्द्र / हितग्राही का नाम', 
    'विकासखण्ड', 'ग्राम पंचायत / ग्राम', 'नोडल अधिकारी का नाम', 'पदनाम', 'मोबाइल नंबर', 
    'स्थिति', 'अक्षांश (Latitude)', 'देशांतर (Longitude)', 'टीप (निरीक्षणकर्ता की विस्तृत टिप्पणी एवं सुधार हेतु निर्देश)'
  ]);
  allTipsSheet.getRow(1).height = 28;
  allTipsSheet.getRow(1).eachCell(cell => {
    cell.font = headerFont;
    cell.fill = headerFill;
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = borderStyle;
  });

  const facilityCategories = [
    { type: 'anganwadi', name: 'आंगनबाड़ी केन्द्र', list: anganwadiRecords, getPlace: r => r.centerName },
    { type: 'school', name: 'शाला (स्कूल)', list: schoolRecords, getPlace: r => r.schoolName },
    { type: 'hostel', name: 'छात्रावास / आश्रम', list: hostelRecords, getPlace: r => r.hostelName },
    { type: 'pds', name: 'उचित मूल्य दुकान (PDS)', list: pdsRecords, getPlace: r => r.shopName },
    { type: 'health', name: 'स्वास्थ्य केन्द्र', list: healthRecords, getPlace: r => r.centerName },
    { type: 'chaupal', name: 'ग्राम चौपाल', list: chaupalRecords, getPlace: r => r.village || r.panchayat },
    { type: 'awas', name: 'पीएम आवास', list: awasRecords, getPlace: r => r.beneficiaryName }
  ];

  const combinedAll = [];
  facilityCategories.forEach(cat => {
    (cat.list || []).forEach(r => {
      combinedAll.push({
        date: r.date || r.inspectionDate || '',
        month: r.month || '',
        categoryName: cat.name,
        place: cat.getPlace(r) || '-',
        block: r.block || '',
        panchayat: r.panchayat || r.village || '',
        officerName: r.officerName || '',
        officerDesignation: r.officerDesignation || '',
        officerMobile: r.officerMobile || '',
        status: r.status || (r.isDraft ? 'ड्राफ्ट' : 'पूर्ण'),
        latitude: r.latitude || '',
        longitude: r.longitude || '',
        tip: getExtractTip(r)
      });
    });
  });

  combinedAll.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

  combinedAll.forEach((item, idx) => {
    const row = allTipsSheet.addRow([
      idx + 1,
      item.date,
      item.month,
      item.categoryName,
      item.place,
      item.block,
      item.panchayat,
      item.officerName,
      item.officerDesignation,
      item.officerMobile,
      item.status,
      item.latitude || '-',
      item.longitude || '-',
      item.tip || 'निरंक'
    ]);
    row.eachCell((c, colNum) => {
      c.border = borderStyle;
      c.alignment = { vertical: 'middle', wrapText: colNum === 14 };
    });
  });

  allTipsSheet.columns = [
    { width: 6 }, { width: 15 }, { width: 14 }, { width: 22 }, { width: 26 },
    { width: 16 }, { width: 20 }, { width: 22 }, { width: 22 }, { width: 15 },
    { width: 14 }, { width: 18 }, { width: 18 }, { width: 50 }
  ];

  return workbook;
}

async function generateComplianceExcel(filters = {}) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'कार्यालय कलेक्टर जिला कोण्डागांव';
  workbook.created = new Date();

  const data = DB.getComplianceReport(filters);

  // Styles
  const navyHeader = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1E3A8A' }
  };
  const emeraldHeader = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF047857' }
  };
  const roseHeader = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFBE123C' }
  };
  const headerFont = {
    name: 'Arial',
    size: 11,
    bold: true,
    color: { argb: 'FFFFFFFF' }
  };
  const borderStyle = {
    top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
  };

  // 1. SUMMARY SHEET
  const summarySheet = workbook.addWorksheet('प्रगति समीक्षा सारांश');
  summarySheet.mergeCells('A1:H1');
  const title1 = summarySheet.getCell('A1');
  title1.value = 'कार्यालय कलेक्टर, जिला-कोण्डागांव (छ०ग०) • नोडल अधिकारी मासिक निरीक्षण अनुपालन प्रतिवेदन';
  title1.font = { name: 'Arial', size: 13, bold: true, color: { argb: 'FFFFFFFF' } };
  title1.fill = navyHeader;
  title1.alignment = { horizontal: 'center', vertical: 'middle' };
  summarySheet.getRow(1).height = 30;

  summarySheet.mergeCells('A2:H2');
  const subTitle = summarySheet.getCell('A2');
  subTitle.value = `विकासखण्ड: ${data.block} | निरीक्षण माह: ${data.month} | रिपोर्ट दिनांक: ${new Date().toLocaleDateString('hi-IN')}`;
  subTitle.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF1E293B' } };
  subTitle.alignment = { horizontal: 'center', vertical: 'middle' };
  summarySheet.getRow(2).height = 20;

  summarySheet.addRow([]); // Blank row

  summarySheet.addRow(['मापदंड (KPI Indicator)', 'संख्या / प्रतिशत (Value)']);
  summarySheet.getRow(4).eachCell(c => {
    c.font = headerFont;
    c.fill = navyHeader;
    c.border = borderStyle;
  });

  const kpis = [
    ['कुल नोडल अधिकारी / आवंटित पंचायतें', data.stats.totalOfficers],
    ['निरीक्षण पूर्ण करने वाले अधिकारी', data.stats.completedCount],
    ['निरीक्षण लंबित / नहीं करने वाले अधिकारी', data.stats.pendingCount],
    ['कुल प्रतिशत प्रगति (%)', `${data.stats.completionPercent}%`],
    ['कुल दर्ज निरीक्षण संख्या (सभी सेक्टर)', data.stats.totalInspectionsLogged],
    ['आंगनबाड़ी केंद्र निरीक्षण', data.stats.sectorTotals?.anganwadi || 0],
    ['शाला निरीक्षण', data.stats.sectorTotals?.school || 0],
    ['छात्रावास / आश्रम निरीक्षण', data.stats.sectorTotals?.hostel || 0],
    ['उचित मूल्य दुकान (PDS) जांच', data.stats.sectorTotals?.pds || 0],
    ['स्वास्थ्य केंद्र निरीक्षण', data.stats.sectorTotals?.health || 0],
    ['प्रधानमंत्री आवास निरीक्षण', data.stats.sectorTotals?.awas || 0],
    ['ग्राम चौपाल समीक्षा', data.stats.sectorTotals?.chaupal || 0]
  ];

  kpis.forEach(([metric, val]) => {
    const r = summarySheet.addRow([metric, val]);
    r.eachCell(c => {
      c.border = borderStyle;
      c.alignment = { vertical: 'middle' };
    });
  });

  summarySheet.columns = [{ width: 40 }, { width: 25 }];

  // 2. COMPLETED OFFICERS SHEET
  const completedSheet = workbook.addWorksheet('निरीक्षण पूर्ण करने वाले');
  completedSheet.addRow([
    'क्र.', 'ग्राम पंचायत', 'विकासखण्ड', 'नोडल अधिकारी का नाम', 'पदनाम', 'मोबाइल नंबर', 
    'कुल निरीक्षण', 'आंगनबाड़ी', 'शाला', 'छात्रावास', 'PDS दुकान', 'स्वास्थ्य', 'पीएम आवास', 'ग्राम चौपाल', 'अंतिम निरीक्षण दिनांक'
  ]);
  completedSheet.getRow(1).height = 26;
  completedSheet.getRow(1).eachCell(c => {
    c.font = headerFont;
    c.fill = emeraldHeader;
    c.alignment = { horizontal: 'center', vertical: 'middle' };
    c.border = borderStyle;
  });

  data.completedList.forEach((off, idx) => {
    const r = completedSheet.addRow([
      idx + 1,
      off.panchayat,
      off.block,
      off.name,
      off.designation,
      off.mobile,
      off.totalInspections,
      off.breakdown.anganwadi,
      off.breakdown.school,
      off.breakdown.hostel,
      off.breakdown.pds,
      off.breakdown.health,
      off.breakdown.awas,
      off.breakdown.chaupal,
      off.lastInspectionDate || ''
    ]);
    r.eachCell(c => {
      c.border = borderStyle;
      c.alignment = { vertical: 'middle' };
    });
  });

  completedSheet.columns = [
    { width: 6 }, { width: 18 }, { width: 15 }, { width: 24 }, { width: 26 }, { width: 15 },
    { width: 14 }, { width: 12 }, { width: 10 }, { width: 12 }, { width: 12 }, { width: 12 }, { width: 12 }, { width: 12 }, { width: 18 }
  ];

  // 3. PENDING OFFICERS SHEET
  const pendingSheet = workbook.addWorksheet('निरीक्षण लंबित (अप्राप्त)');
  pendingSheet.addRow([
    'क्र.', 'ग्राम पंचायत', 'विकासखण्ड', 'नोडल अधिकारी का नाम', 'पदनाम', 'मोबाइल नंबर', 'स्थिति'
  ]);
  pendingSheet.getRow(1).height = 26;
  pendingSheet.getRow(1).eachCell(c => {
    c.font = headerFont;
    c.fill = roseHeader;
    c.alignment = { horizontal: 'center', vertical: 'middle' };
    c.border = borderStyle;
  });

  data.pendingList.forEach((off, idx) => {
    const r = pendingSheet.addRow([
      idx + 1,
      off.panchayat,
      off.block,
      off.name,
      off.designation,
      off.mobile,
      'लंबित (निरीक्षण नहीं किया)'
    ]);
    r.eachCell(c => {
      c.border = borderStyle;
      c.alignment = { vertical: 'middle' };
    });
  });

  pendingSheet.columns = [
    { width: 6 }, { width: 20 }, { width: 16 }, { width: 25 }, { width: 28 }, { width: 16 }, { width: 25 }
  ];

  return workbook;
}

module.exports = {
  generateGoswaraExcel,
  generateComplianceExcel
};

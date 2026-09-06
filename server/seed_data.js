const DB = require('./db');

// Seed sample inspections if none exist
function seedInspections() {
  const officers = DB.getOfficers();
  const off1 = officers[0]; // श्री आर. के. शर्मा
  const off2 = officers[1]; // श्रीमती अनीता मरकाम

  // 1. Anganwadi
  if (DB.getAllInspections('anganwadi').length === 0) {
    DB.saveInspection('anganwadi', {
      date: '2026-09-02',
      officerId: off1.id,
      officerName: off1.name,
      officerDesignation: off1.designation,
      officerMobile: off1.mobile,
      block: 'बड़ेराजपुर',
      district: 'कोण्डागांव',
      panchayat: 'विश्रामपुरी',
      centerName: 'आंगनबाड़ी केन्द्र विश्रामपुरी-01',
      workerName: 'श्रीमती मंगली बाई',
      workerMobile: '9827011223',
      beneficiaries: {
        age06m3y: '18',
        age3y6y: '22',
        pregnant: '6',
        lactating: '7',
        adolescentGirls: '4',
        total: '57',
        remarks: 'कुपोषण दर में 12% की कमी पाई गई।'
      },
      rationStatus: 'नियमित वितरण',
      remarks: 'केन्द्र स्वच्छ है। गरम पका भोजन नियमित रूप से दिया जा रहा है। पोषण ट्रैकर ऐप नियमित रूप से अपडेट किया जा रहा है।',
      status: 'जमा किया गया (पूर्ण)'
    });

    DB.saveInspection('anganwadi', {
      date: '2026-09-04',
      officerId: off2.id,
      officerName: off2.name,
      officerDesignation: off2.designation,
      officerMobile: off2.mobile,
      block: 'बड़ेराजपुर',
      district: 'कोण्डागांव',
      panchayat: 'बांसकोट',
      centerName: 'आंगनबाड़ी केन्द्र बांसकोट-02',
      workerName: 'सुश्री प्रमिला शोरी',
      workerMobile: '9425099887',
      beneficiaries: {
        age06m3y: '14',
        age3y6y: '19',
        pregnant: '5',
        lactating: '5',
        adolescentGirls: '3',
        total: '46',
        remarks: 'वजन एवं ऊंचाई मापन नियमित।'
      },
      rationStatus: 'नियमित',
      remarks: 'भवन अच्छा है। पेयजल हेतु बोरवेल रनिंग है।',
      status: 'जमा किया गया (पूर्ण)'
    });
  }

  // 2. School
  if (DB.getAllInspections('school').length === 0) {
    DB.saveInspection('school', {
      date: '2026-09-03',
      month: 'सितम्बर',
      officerId: off2.id,
      officerName: off2.name,
      officerDesignation: off2.designation,
      officerMobile: off2.mobile,
      block: 'बड़ेराजपुर',
      district: 'कोण्डागांव',
      panchayat: 'विश्रामपुरी',
      schoolName: 'प्राथमिक शाला विश्रामपुरी',
      schoolLevel: 'प्राथमिक',
      sankul: 'संकुल केन्द्र विश्रामपुरी',
      teachersPosted: '4',
      teachersPresent: '4',
      teacherPunctuality: 'हाँ',
      studentsEnrolled: '68',
      studentsPresent: '62',
      booksUniformsDistributed: 'हाँ',
      academicCalendarFollowed: 'हाँ',
      buildingCondition: 'उत्तम',
      basicAmenities: 'पानी: उपलब्ध, बिजली: उपलब्ध, शौचालय: उपलब्ध',
      midDayMeal: 'नियमित एवं गुणवत्तायुक्त',
      baglessDay: 'हाँ',
      teacherDiaryMaintained: 'हाँ',
      homeworkGivenAndChecked: 'हाँ',
      academicRemarks: 'कक्षा 3 एवं 5 के छात्रों का पठन-पाठन स्तर संतोषजनक। गणित पहाड़े एवं हिंदी वाचन अच्छा पाया गया।',
      headmasterName: 'श्री के. आर. मंडावी',
      status: 'जमा किया गया (पूर्ण)'
    });
  }

  // 3. Hostel
  if (DB.getAllInspections('hostel').length === 0) {
    DB.saveInspection('hostel', {
      date: '2026-09-03',
      officerId: off1.id,
      officerName: off1.name,
      officerDesignation: off1.designation,
      officerMobile: off1.mobile,
      block: 'बड़ेराजपुर',
      district: 'कोण्डागांव',
      panchayat: 'विश्रामपुरी',
      hostelName: 'प्री-मैट्रिक बालक आदिवासी छात्रावास विश्रामपुरी',
      address: 'विश्रामपुरी मुख्य मार्ग',
      category: 'बालक',
      hostelType: 'प्री-मैट्रिक छात्रावास',
      casteCategory: 'ST',
      sanctionedSeats: '50',
      presentStudents: '47',
      superintendentName: 'श्री संतोष नेताम',
      superintendentMobile: '9425123456',
      superintendentResiding: 'हाँ',
      buildingOwned: 'हाँ',
      usableToilets: '5',
      foodQuality: 'अच्छी',
      cctvWorking: 'हाँ',
      roWorking: 'हाँ',
      powerSolar: 'विद्युत: हाँ, सोलर: हाँ',
      remarks: 'छात्रावास में सुरक्षा व्यवस्था चाक-चौबंद है। रात्रि में अधीक्षक उपस्थित मिले। भोजन मेन्यू अनुसार पाया गया।',
      status: 'जमा किया गया (पूर्ण)'
    });
  }

  // 4. PDS
  if (DB.getAllInspections('pds').length === 0) {
    DB.saveInspection('pds', {
      date: '2026-09-04',
      officerId: off1.id,
      officerName: off1.name,
      officerDesignation: off1.designation,
      officerMobile: off1.mobile,
      block: 'बड़ेराजपुर',
      district: 'कोण्डागांव',
      panchayat: 'बांसकोट',
      shopName: 'सेवा सहकारी समिति मर्यादित बांसकोट',
      shopId: '432001008',
      shopStatus: 'नियमित खुलती है',
      declarationPast3MonthsOk: 'हाँ',
      riceFestivalHeld: 'हाँ',
      stockBySixth: 'हाँ',
      boardsDisplayed: 'टोल फ्री: हाँ, स्टॉक सूची: हाँ',
      aplCards: '45',
      bplCards: '312',
      consultedCardHoldersCount: '8',
      shopOpensRegularly: 'हाँ',
      stockInFirstWeek: 'हाँ',
      vigilanceCommitteeVerifying: 'हाँ',
      weightAndQualityOk: 'हाँ',
      correctRateAndQtyGiven: 'हाँ',
      dealerBehavior: 'अच्छा है',
      remarks: 'राशन वितरण ई-पॉस मशीन द्वारा पारदर्शी रूप से किया जा रहा है। स्टॉक पंजी का भौतिक सत्यापन सही पाया गया।',
      status: 'जमा किया गया (पूर्ण)'
    });
  }

  // 5. Chaupal
  if (DB.getAllInspections('chaupal').length === 0) {
    DB.saveInspection('chaupal', {
      date: '2026-09-05',
      officerId: off1.id,
      officerName: off1.name,
      officerDesignation: off1.designation,
      officerMobile: off1.mobile,
      block: 'बड़ेराजपुर',
      district: 'कोण्डागांव',
      panchayat: 'कोरीगांव',
      village: 'कोरीगांव',
      dependentVillage: 'जामगांव',
      populationTotal: '840',
      sectors: {
        school: { building: 'भवन अच्छा' },
        anganwadi: { status: 'क्रियाशील' },
        pds: { status: 'नियमित वितरण' },
        health: { status: 'क्रियाशील' },
        jjm: { status: 'कार्य पूर्ण' },
        electricity: { status: 'नियमित आपूर्ति' },
        road: { requirement: 'पारा चौक से स्कूल तक 500 मीटर सीसी रोड आवश्यक' },
        veterinary: { pmKisanBenefit: 'हाँ' },
        pmay: { surveyStatus: 'पूर्ण' },
        mgnrega: { paymentStatus: 'नियमित' }
      },
      complaints: 'पारा टोला में पेयजल पाइपलाइन एक्सटेंशन एवं नवीन हैंडपंप खनन की ग्रामीणों द्वारा मांग की गई।',
      sarpanchName: 'श्री जयपाल सोरी',
      status: 'जमा किया गया (पूर्ण)'
    });
  }

  // 6. Health
  if (DB.getAllInspections('health').length === 0) {
    DB.saveInspection('health', {
      date: '2026-09-04',
      officerId: off1.id,
      officerName: off1.name,
      officerDesignation: off1.designation,
      officerMobile: off1.mobile,
      block: 'बड़ेराजपुर',
      district: 'कोण्डागांव',
      panchayat: 'विश्रामपुरी',
      centerName: 'प्राथमिक स्वास्थ्य केंद्र विश्रामपुरी',
      centerType: 'प्राथमिक स्वास्थ्य केन्द्र (PHC)',
      inchargeName: 'डॉ. संजय बघेल',
      staffPresent: 'हाँ (सभी उपस्थित)',
      cleanliness: 'उत्तम',
      residingAtHq: 'हाँ',
      opdCount: '480',
      ipdCount: '28',
      essentialDrugsAvailable: 'हाँ (सभी 9 दवाएं उपलब्ध)',
      expiredDrugsPresent: 'नहीं',
      institutionalDeliveries: '14',
      laborRoomEquipped: 'हाँ',
      waterElectricityOk: 'जल: पर्याप्त, विद्युत: 24 घंटे बैकअप',
      registersMaintained: 'हाँ (सभी संधारित)',
      remarks: 'अस्पताल परिसर अति स्वच्छ है। प्रसव कक्ष में सभी 7 ट्रे एवं बेबी वार्मर क्रियाशील मिले। आपातकालीन दवाएं पर्याप्त हैं।',
      status: 'जमा किया गया (पूर्ण)'
    });
  }

  // 7. Awas
  if (DB.getAllInspections('awas').length === 0) {
    DB.saveInspection('awas', {
      date: '2026-09-05',
      officerId: off1.id,
      officerName: off1.name,
      officerDesignation: off1.designation,
      officerMobile: off1.mobile,
      block: 'बड़ेराजपुर',
      district: 'कोण्डागांव',
      panchayat: 'विश्रामपुरी',
      village: 'विश्रामपुरी',
      beneficiaryName: 'श्री फागूराम नेताम',
      fatherName: 'स्व. सुकलू नेताम',
      category: 'ST',
      beneficiaryId: 'CG081002345',
      installmentAmount: '40,000/- (द्वितीय किश्त)',
      installmentDate: '2026-08-20',
      fundUtilization: 'उचित उपयोग किया गया',
      currentStage: 'लिंटल स्तर (Lintel Level)',
      materials: {
        bricks: 'उपलब्ध (2500 नग)',
        sand: '1 ट्रैक्टर',
        cement: '8 बोरी',
        steel: '1.5 क्विंटल',
        aggregate: '1 ट्रैक्टर',
        other: 'पानी सुलभ'
      },
      remarks: 'कार्य तीव्र गति से प्रगतिरत है। छत स्तर हेतु निर्माण सामग्री स्थल पर मौजूद है। तृतीय किश्त जारी करने की अनुशंसा की जाती है।',
      status: 'जमा किया गया (पूर्ण)'
    });
  }

  console.log('Seed inspections created successfully!');
}

seedInspections();

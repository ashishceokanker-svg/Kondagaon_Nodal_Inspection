const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

function getFilePath(filename) {
  return path.join(DATA_DIR, filename);
}

function readJson(filename, defaultValue = []) {
  const filePath = getFilePath(filename);
  try {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(defaultValue, null, 2), 'utf-8');
      return defaultValue;
    }
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error(`Error reading ${filename}:`, err);
    return defaultValue;
  }
}

function writeJson(filename, data) {
  const filePath = getFilePath(filename);
  const tempPath = `${filePath}.tmp`;
  fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf-8');
  fs.renameSync(tempPath, filePath);
}

// Initialize seed data if not present
function initDb() {
  const officersFile = 'nodal_officers.json';
  const existingOfficers = readJson(officersFile, null);
  if (!existingOfficers || existingOfficers.length === 0) {
    const defaultOfficers = [
      {
        id: 'off-01',
        name: 'श्री आर. के. शर्मा',
        designation: 'नायब तहसीलदार',
        mobile: '9876543210',
        office: 'तहसील कार्यालय बड़ेराजपुर',
        block: 'बड़ेराजपुर',
        district: 'कोण्डागांव',
        panchayats: ['विश्रामपुरी', 'बांसकोट', 'कोरीगांव', 'सालना']
      },
      {
        id: 'off-02',
        name: 'श्रीमती अनीता मरकाम',
        designation: 'विकासखंड शिक्षा अधिकारी (BEO)',
        mobile: '9827112233',
        office: 'विकासखंड शिक्षा कार्यालय बड़ेराजपुर',
        block: 'बड़ेराजपुर',
        district: 'कोण्डागांव',
        panchayats: ['बड़ेराजपुर', 'मतोली', 'खारगांव', 'कुधुर']
      },
      {
        id: 'off-03',
        name: 'श्री दिनेश कुमार नेताम',
        designation: 'उप अभियंता (RES)',
        mobile: '9425234567',
        office: 'जनपद पंचायत बड़ेराजपुर',
        block: 'बड़ेराजपुर',
        district: 'कोण्डागांव',
        panchayats: ['पिपरा', 'होनहेंड', 'घोड़ागांव']
      },
      {
        id: 'off-04',
        name: 'डॉ. संजय बघेल',
        designation: 'चिकित्सा अधिकारी (MO)',
        mobile: '9907123456',
        office: 'सामुदायिक स्वास्थ्य केंद्र विश्रामपुरी',
        block: 'बड़ेराजपुर',
        district: 'कोण्डागांव',
        panchayats: ['विश्रामपुरी', 'बांसकोट']
      }
    ];
    writeJson(officersFile, defaultOfficers);
  }

  // Master lists
  const mastersFile = 'masters.json';
  if (!fs.existsSync(getFilePath(mastersFile))) {
    const masters = {
      district: 'कोण्डागांव',
      blocks: [
        'बड़ेराजपुर',
        'कोण्डागांव',
        'केशकाल',
        'माकड़ी',
        'फरसगांव'
      ],
      panchayats: {
        'बड़ेराजपुर': [
          'विश्रामपुरी', 'बांसकोट', 'कोरीगांव', 'सालना', 'मतोली', 
          'खारगांव', 'कुधुर', 'पिपरा', 'होनहेंड', 'घोड़ागांव', 'अमागांव', 'बोरगांव'
        ],
        'कोण्डागांव': ['बनियागांव', 'दहीकोंगा', 'जुगानी', 'बम्हनी'],
        'केशकाल': ['बटराली', 'अरण्डी', 'तमोरा'],
        'माकड़ी': ['अनंतपुर', 'बालेंग', 'कांगोली'],
        'फरसगांव': ['पासंगी', 'बड़ाडोंगर', 'मांझीआठगांव']
      },
      designations: [
        'नोडल अधिकारी',
        'तहसीलदार',
        'नायब तहसीलदार',
        'विकासखंड शिक्षा अधिकारी (BEO)',
        'सहायक विकासखंड शिक्षा अधिकारी (ABEO)',
        'मुख्य कार्यपालन अधिकारी (CEO Janpad)',
        'उप अभियंता (Sub Engineer)',
        'ग्रामीण कृषि विस्तार अधिकारी (RAEO)',
        'चिकित्सा अधिकारी (MO)',
        'खंड विस्तार प्रशिक्षक (BEE)',
        'महिला एवं बाल विकास परियोजना अधिकारी (CDPO)',
        'पर्यवेक्षक (Supervisor)'
      ]
    };
    writeJson(mastersFile, masters);
  }
}

initDb();

const DB = {
  // Officers
  getOfficers() {
    return readJson('nodal_officers.json');
  },
  findOfficerByMobile(mobile) {
    const list = this.getOfficers();
    return list.find(o => o.mobile === mobile);
  },
  saveOfficer(officer) {
    const list = this.getOfficers();
    if (officer.panchayat && (!officer.panchayats || officer.panchayats.length === 0)) {
      officer.panchayats = [officer.panchayat];
    }
    if (!officer.id) {
      officer.id = 'off-' + uuidv4().slice(0, 8);
      list.push(officer);
    } else {
      const idx = list.findIndex(o => o.id === officer.id);
      if (idx >= 0) list[idx] = { ...list[idx], ...officer };
      else list.push(officer);
    }
    writeJson('nodal_officers.json', list);
    return officer;
  },
  deleteOfficer(id) {
    let list = this.getOfficers();
    const initialLen = list.length;
    list = list.filter(o => o.id !== id);
    if (list.length !== initialLen) {
      writeJson('nodal_officers.json', list);
      return true;
    }
    return false;
  },

  // Masters
  getMasters() {
    return readJson('masters.json');
  },

  // Inspections
  getInspectionFilename(type) {
    return `inspections_${type}.json`;
  },

  getAllInspections(type) {
    return readJson(this.getInspectionFilename(type));
  },

  getInspections(type, filters = {}) {
    let items = this.getAllInspections(type);
    if (filters.officerId && filters.officerId !== 'admin') {
      const officers = this.getOfficers();
      const matched = officers.find(o => o.id === filters.officerId || o.mobile === filters.officerId);
      const officerName = matched?.name?.trim();
      const officerMobile = matched?.mobile?.trim();
      const officerPanchayat = matched?.panchayat?.trim();

      items = items.filter(i => {
        if (i.officerId && i.officerId === filters.officerId) return true;
        if (officerMobile && i.officerMobile === officerMobile) return true;
        if (officerName && i.officerName === officerName) return true;
        if (officerPanchayat && i.panchayat === officerPanchayat) return true;
        return false;
      });
    }
    if (filters.block) {
      items = items.filter(i => i.block === filters.block);
    }
    if (filters.panchayat) {
      items = items.filter(i => i.panchayat === filters.panchayat);
    }
    if (filters.startDate) {
      items = items.filter(i => (i.date || i.inspectionDate) >= filters.startDate);
    }
    if (filters.endDate) {
      items = items.filter(i => (i.date || i.inspectionDate) <= filters.endDate);
    }
    return items.sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date));
  },

  getInspectionById(type, id) {
    const items = this.getAllInspections(type);
    return items.find(i => i.id === id);
  },

  saveInspection(type, data) {
    const filename = this.getInspectionFilename(type);
    const items = readJson(filename);
    if (!data.id) {
      data.id = `${type.toUpperCase().slice(0, 3)}-${Date.now()}-${uuidv4().slice(0, 4)}`;
      data.createdAt = new Date().toISOString();
      items.unshift(data);
    } else {
      data.updatedAt = new Date().toISOString();
      const idx = items.findIndex(i => i.id === data.id);
      if (idx >= 0) items[idx] = { ...items[idx], ...data };
      else items.unshift(data);
    }
    writeJson(filename, items);
    return data;
  },

  deleteInspection(type, id) {
    const filename = this.getInspectionFilename(type);
    let items = readJson(filename);
    items = items.filter(i => i.id !== id);
    writeJson(filename, items);
    return true;
  },

  // Consolidated Goswara Statistics
  getGoswaraSummary(filters = {}) {
    const types = [
      { key: 'anganwadi', nameHindi: 'आंगनबाड़ी केन्द्र', icon: 'Baby' },
      { key: 'school', nameHindi: 'शाला निरीक्षण', icon: 'GraduationCap' },
      { key: 'hostel', nameHindi: 'छात्रावास / आश्रम', icon: 'Building' },
      { key: 'pds', nameHindi: 'उचित मूल्य दुकान (PDS)', icon: 'Wheat' },
      { key: 'chaupal', nameHindi: 'ग्राम चौपाल', icon: 'Landmark' },
      { key: 'health', nameHindi: 'स्वास्थ्य केन्द्र', icon: 'Activity' },
      { key: 'awas', nameHindi: 'प्रधानमंत्री आवास', icon: 'Home' }
    ];

    const stats = {};
    let totalAll = 0;
    const allRecords = [];

    for (const t of types) {
      const records = this.getInspections(t.key, filters);
      stats[t.key] = {
        key: t.key,
        nameHindi: t.nameHindi,
        count: records.length,
        records: records
      };
      totalAll += records.length;
      records.forEach(r => {
        allRecords.push({
          ...r,
          typeKey: t.key,
          typeNameHindi: t.nameHindi
        });
      });
    }

    // Sort all inspections by date descending
    allRecords.sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date));

    // Gram Panchayat aggregation
    const panchayatSummary = {};
    allRecords.forEach(r => {
      const gp = r.panchayat || r.gramPanchayat || r.village || 'अन्य';
      if (!panchayatSummary[gp]) {
        panchayatSummary[gp] = {
          panchayat: gp,
          total: 0,
          anganwadi: 0,
          school: 0,
          hostel: 0,
          pds: 0,
          chaupal: 0,
          health: 0,
          awas: 0
        };
      }
      panchayatSummary[gp].total += 1;
      if (panchayatSummary[gp][r.typeKey] !== undefined) {
        panchayatSummary[gp][r.typeKey] += 1;
      }
    });

    return {
      totalInspections: totalAll,
      typeStats: stats,
      panchayatStats: Object.values(panchayatSummary).sort((a, b) => b.total - a.total),
      recentInspections: allRecords.slice(0, 20)
    };
  },

  // Nodal Officer Monthly Compliance & Progress Report (Admin view)
  getComplianceReport(filters = {}) {
    const targetBlock = filters.block || '';
    const targetMonth = filters.month || 'सितम्बर 2026';

    const HINDI_MONTH_MAP = {
      'जनवरी': '01', 'फ़रवरी': '02', 'फरवरी': '02', 'मार्च': '03', 'अप्रैल': '04',
      'मई': '05', 'जून': '06', 'जुलाई': '07', 'अगस्त': '08', 'सितम्बर': '09',
      'सितंबर': '09', 'अक्टूबर': '10', 'नवम्बर': '11', 'नवंबर': '11', 'दिसम्बर': '12', 'दिसंबर': '12'
    };

    const matchesMonth = (record, targetM) => {
      if (!targetM) return true;
      if (record.month && record.month.trim() === targetM.trim()) return true;
      const parts = targetM.trim().split(/\s+/);
      if (parts.length >= 2) {
        const mName = parts[0];
        const year = parts[1];
        const mNum = HINDI_MONTH_MAP[mName];
        if (mNum && record.date) {
          const ym = `${year}-${mNum}`;
          if (record.date.startsWith(ym)) return true;
        }
      }
      return false;
    };

    const matchBlock = (b1, b2) => {
      if (!b1 || !b2) return false;
      if (b1 === b2) return true;
      const s1 = b1.replace(/[\u093c\s]/g, '');
      const s2 = b2.replace(/[\u093c\s]/g, '');
      if (s1 === s2) return true;
      if (s1.includes('राजपुर') && s2.includes('राजपुर')) return true;
      if ((s1.includes('कोण्डा') || s1.includes('कोंडा')) && (s2.includes('कोण्डा') || s2.includes('कोंडा'))) return true;
      if (s1.includes('माकड') && s2.includes('माकड')) return true;
      if (s1.includes('फरस') && s2.includes('फरस')) return true;
      if (s1.includes('केश') && s2.includes('केश')) return true;
      return false;
    };

    const allOfficers = this.getOfficers();
    let officers = allOfficers;
    if (targetBlock && targetBlock !== 'सभी विकासखण्ड') {
      officers = officers.filter(o => matchBlock(o.block, targetBlock));
    }

    const types = [
      { key: 'anganwadi', name: 'आंगनबाड़ी' },
      { key: 'school', name: 'शाला' },
      { key: 'hostel', name: 'छात्रावास' },
      { key: 'pds', name: 'उचित मूल्य दुकान' },
      { key: 'chaupal', name: 'ग्राम चौपाल' },
      { key: 'health', name: 'स्वास्थ्य केन्द्र' },
      { key: 'awas', name: 'पीएम आवास' }
    ];

    const monthInspections = [];
    for (const t of types) {
      const records = this.getAllInspections(t.key);
      for (const r of records) {
        if (matchesMonth(r, targetMonth)) {
          monthInspections.push({ ...r, facilityType: t.key });
        }
      }
    }

    const officerComplianceList = officers.map((off, index) => {
      const offInspections = monthInspections.filter(i => {
        if (i.officerId && i.officerId === off.id) return true;
        if (i.officerMobile && off.mobile && i.officerMobile.trim() === off.mobile.trim()) return true;
        if (i.officerName && off.name && i.officerName.trim() === off.name.trim()) return true;
        if (i.panchayat && off.panchayat && i.panchayat.trim() === off.panchayat.trim()) return true;
        return false;
      });

      const breakdown = {
        anganwadi: 0,
        school: 0,
        hostel: 0,
        pds: 0,
        chaupal: 0,
        health: 0,
        awas: 0
      };

      let latestDate = null;
      for (const ins of offInspections) {
        if (breakdown[ins.facilityType] !== undefined) {
          breakdown[ins.facilityType]++;
        }
        const insDate = ins.date || ins.inspectionDate;
        if (insDate && (!latestDate || insDate > latestDate)) {
          latestDate = insDate;
        }
      }

      const totalCount = offInspections.length;
      const hasInspected = totalCount > 0;

      return {
        id: off.id,
        sno: off.sno || (index + 1),
        name: off.name,
        designation: off.designation,
        mobile: off.mobile,
        panchayat: off.panchayat,
        block: off.block,
        district: off.district || 'कोण्डागांव',
        hasInspected,
        totalInspections: totalCount,
        inspectionCount: totalCount,
        breakdown,
        typeBreakdown: breakdown,
        lastInspectionDate: latestDate
      };
    });

    const completedList = officerComplianceList.filter(o => o.hasInspected);
    const pendingList = officerComplianceList.filter(o => !o.hasInspected);

    const totalOfficers = officerComplianceList.length;
    const completedCount = completedList.length;
    const pendingCount = pendingList.length;
    const totalInspectionsLogged = completedList.reduce((acc, curr) => acc + curr.totalInspections, 0);
    const completionPercent = totalOfficers > 0 ? Number(((completedCount / totalOfficers) * 100).toFixed(1)) : 0;

    const sectorTotals = {
      anganwadi: completedList.reduce((a, c) => a + c.breakdown.anganwadi, 0),
      school: completedList.reduce((a, c) => a + c.breakdown.school, 0),
      hostel: completedList.reduce((a, c) => a + c.breakdown.hostel, 0),
      pds: completedList.reduce((a, c) => a + c.breakdown.pds, 0),
      chaupal: completedList.reduce((a, c) => a + c.breakdown.chaupal, 0),
      health: completedList.reduce((a, c) => a + c.breakdown.health, 0),
      awas: completedList.reduce((a, c) => a + c.breakdown.awas, 0)
    };

    const summary = {
      totalOfficers,
      completedCount,
      pendingCount,
      completionPercent,
      completionRate: completionPercent,
      totalInspectionsLogged,
      totalInspections: totalInspectionsLogged,
      sectorTotals,
      typeStats: sectorTotals
    };

    return {
      block: targetBlock || 'समस्त विकासखण्ड',
      month: targetMonth,
      stats: summary,
      summary,
      completedList,
      pendingList,
      allOfficers: officerComplianceList
    };
  }
};

module.exports = DB;

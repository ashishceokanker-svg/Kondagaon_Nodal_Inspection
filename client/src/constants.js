export const DISTRICT_BLOCKS = [
  'बड़ेराजपुर',
  'केशकाल',
  'फरसगांव',
  'कोंडागांव',
  'माकडी'
];

export const MONTH_OPTIONS = [
  'सितम्बर 2026',
  'अगस्त 2026',
  'जुलाई 2026',
  'जून 2026',
  'मई 2026',
  'अप्रैल 2026',
  'मार्च 2026',
  'फ़रवरी 2026',
  'जनवरी 2026',
  'अक्टूबर 2026',
  'नवम्बर 2026',
  'दिसम्बर 2026'
];

export const MONTHS_LIST = MONTH_OPTIONS;

export const matchBlock = (b1, b2) => {
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

export const BLOCK_PANCHAYATS = {
  'बड़ेराजपुर': [
    'बाँसकोट', 'तितरवण्ड', 'बड़बत्तर', 'ढोढरा', 'रामपुर', 'बस्तरबुड्रा', 'पिटेचुवा', 'खरगांव', 'जिरीपारा', 'बैजनपुरी',
    'खलारी', 'कोसमी', 'हात्मा', 'कोरहोबेड़ा', 'कोरगांव', 'टेंवसा', 'कलगांव', 'कोंगेरा', 'सोनपुर', 'पेण्ड्रावन',
    'होनावण्डी', 'बाड़ागांव', 'काँदेकरा', 'मचली', 'पारोण्ड', 'खजरावण्ड', 'आमगांव', 'बड़ेराजपुर', 'छोटेराजपुर', 'माड़ोकी खरगांव',
    'कोपरा', 'छिन्दली', 'धामनपुरी', 'किबड़ा', 'बालेंगा', 'लिहागांव', 'पलना', 'चिचाड़ी', 'सालना', 'मारंगपुरी',
    'केरागांव', 'हरवेल', 'पीढ़ापाल', 'नौकाबेड़ा', 'जोड़ेकेरा', 'गम्हरी', "विश्रामपुरी 'अ'", "विश्रामपुरी 'ब'", 'बीरापारा'
  ],
  'केशकाल': [
    'बटराली', 'अरण्डी', 'तमोरा', 'दादरगढ़', 'सुरदोंग'
  ],
  'फरसगांव': [
    'पासंगी', 'बड़ाडोंगर', 'मांझीआठगांव', 'भोंगापाल', 'पाटला'
  ],
  'कोंडागांव': [
    'बनियागांव', 'दहीकोंगा', 'जुगानी', 'बम्हनी', 'लंजोड़ा'
  ],
  'माकडी': [
    'अनंतपुर', 'बालेंग', 'कांगोली', 'रांधना', 'शामपुर'
  ]
};

export const getPanchayatsForBlock = (blockName) => {
  if (!blockName || blockName === 'सभी विकासखण्ड' || blockName === 'समस्त विकासखण्ड') {
    return Object.values(BLOCK_PANCHAYATS).flat();
  }
  for (const [blk, list] of Object.entries(BLOCK_PANCHAYATS)) {
    if (matchBlock(blk, blockName)) return list;
  }
  return [];
};


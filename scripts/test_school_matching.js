const fs = require('fs');
const path = require('path');

const masterPath = path.join(__dirname, '../client/src/data/schoolMasterData.js');
const constantsPath = path.join(__dirname, '../client/src/constants.js');

const content = fs.readFileSync(masterPath, 'utf8');
eval(content.replace(/export const /g, 'var '));

const constantsContent = fs.readFileSync(constantsPath, 'utf8');
eval(constantsContent.replace(/export const /g, 'var '));

function normalizeStr(str) {
  if (!str) return '';
  let s = str.trim();
  return s
    .replace(/['"()]/g, '')
    .replace(/[\u093c]/g, '') // strip nukta
    .replace(/\s+/g, '')
    .replace(/िं/g, 'ी')
    .replace(/ि/g, 'ी')
    .replace(/ुं/g, 'ू')
    .replace(/ु/g, 'ू')
    .replace(/ण्ड/g, 'ंड')
    .replace(/ड़/g, 'ड')
    .replace(/ढ़/g, 'ढ');
}

function getSchoolsFuzzy(blockName, panchayatName) {
  if (!blockName || !panchayatName) return [];
  const blockKey = Object.keys(SCHOOL_MASTER_DATA).find(b => matchBlock(b, blockName));
  if (!blockKey) return [];
  const blockData = SCHOOL_MASTER_DATA[blockKey];
  if (!blockData) return [];
  
  if (blockData[panchayatName]) return blockData[panchayatName];
  
  const normP = normalizeStr(panchayatName);
  for (const [pName, list] of Object.entries(blockData)) {
    if (normalizeStr(pName) === normP) return list;
  }
  
  // Partial / substring match as fallback
  for (const [pName, list] of Object.entries(blockData)) {
    const normK = normalizeStr(pName);
    if ((normK.includes(normP) || normP.includes(normK)) && normK.length >= 4 && normP.length >= 4) {
      return list;
    }
  }
  return [];
}

let totalCount = 0;
let totalMatched = 0;

for (const [blk, panchs] of Object.entries(BLOCK_PANCHAYATS)) {
  let matchedCount = 0;
  let missing = [];
  for (const p of panchs) {
    totalCount++;
    const schools = getSchoolsFuzzy(blk, p);
    if (schools && schools.length > 0) {
      matchedCount++;
      totalMatched++;
    } else {
      missing.push(p);
    }
  }
  console.log(blk, 'Matched:', matchedCount, '/', panchs.length, 'Missing:', missing.length);
  if (missing.length > 0) console.log('Missing:', missing);
}

console.log('TOTAL:', totalMatched, '/', totalCount);

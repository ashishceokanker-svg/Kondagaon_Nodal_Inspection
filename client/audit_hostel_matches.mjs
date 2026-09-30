import { HOSTEL_MASTER_DATA, getHostelsForPanchayat } from './src/data/hostelMasterData.js';
import { DISTRICT_BLOCKS, getPanchayatsForBlock } from './src/constants.js';

console.log('--- AUDITING HOSTELS MATCHING FOR ALL GRAM PANCHAYATS ---');

let falseMatches = [];
let validMatches = [];
let noHostelPanchayats = [];

for (const block of DISTRICT_BLOCKS) {
  const panchayats = getPanchayatsForBlock(block);
  for (const panch of panchayats) {
    const hostels = getHostelsForPanchayat(block, panch);
    if (hostels.length > 0) {
      validMatches.push({ block, panch, count: hostels.length, names: hostels.map(h => h.name) });
    } else {
      noHostelPanchayats.push({ block, panch });
    }
  }
}

console.log(`Total Gram Panchayats checked: ${validMatches.length + noHostelPanchayats.length}`);
console.log(`GPs WITH Hostels (${validMatches.length}):`);
validMatches.forEach(m => console.log(`  - [${m.block}] ${m.panch}: ${m.count} hostels -> ${m.names.join(', ')}`));

console.log(`\nGPs WITHOUT Hostels (${noHostelPanchayats.length}):`);
noHostelPanchayats.forEach(m => console.log(`  - [${m.block}] ${m.panch}`));

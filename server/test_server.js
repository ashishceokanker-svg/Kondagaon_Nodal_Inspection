const { generateGoswaraExcel } = require('./excelExport');
const fs = require('fs');

async function test() {
  const wb = await generateGoswaraExcel();
  await wb.xlsx.writeFile('test_goswara.xlsx');
  console.log('test_goswara.xlsx successfully generated! File size:', fs.statSync('test_goswara.xlsx').size, 'bytes');
  console.log('Worksheets:', wb.worksheets.map(w => `${w.name} (${w.rowCount} rows)`));
}

test().catch(console.error);

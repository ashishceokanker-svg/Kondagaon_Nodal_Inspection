const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const DB = require('./db');
const { generateGoswaraExcel, generateComplianceExcel } = require('./excelExport');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Static uploads directory
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Multer setup for photos & signatures
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `file-${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 } // 15 MB
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Auth / Officers
app.get('/api/officers', (req, res) => {
  res.json(DB.getOfficers());
});

app.post('/api/officers', (req, res) => {
  try {
    const officer = DB.saveOfficer(req.body);
    res.json({ success: true, officer });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/officers/:id', (req, res) => {
  try {
    const officerData = { ...req.body, id: req.params.id };
    const officer = DB.saveOfficer(officerData);
    res.json({ success: true, officer });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/officers/:id', (req, res) => {
  try {
    const success = DB.deleteOfficer(req.params.id);
    if (success) {
      res.json({ success: true, message: 'अधिकारी सफलतापूर्वक हटा दिया गया।' });
    } else {
      res.status(404).json({ success: false, message: 'अधिकारी नहीं मिला।' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/login', (req, res) => {
  const { role, username, password, panchayat, officerId, mobile, month } = req.body;

  // 1. Admin Login
  if (role === 'admin' || username === 'admin') {
    if (password && password.trim() === 'admin') {
      return res.json({
        success: true,
        officer: {
          id: 'admin',
          name: 'जिला प्रशासक (Admin)',
          designation: 'कलेक्टर कार्यालय / एडमिन',
          role: 'admin',
          block: 'सभी विकासखण्ड',
          district: 'कोण्डागांव',
          panchayat: 'समस्त ग्राम पंचायत',
          mobile: '9999999999',
          selectedMonth: month || 'सितम्बर 2026'
        }
      });
    } else {
      return res.status(401).json({ success: false, message: 'गलत एडमिन पासवर्ड! कृपया सही पासवर्ड (admin) दर्ज करें।' });
    }
  }

  // 2. Nodal Officer Login by Panchayat + Mobile as password
  const officers = DB.getOfficers();
  let officer = null;

  if (panchayat) {
    officer = officers.find(o => o.panchayat === panchayat || (o.panchayats && o.panchayats.includes(panchayat)));
  } else if (officerId) {
    officer = officers.find(o => o.id === officerId);
  } else if (mobile) {
    officer = officers.find(o => o.mobile === mobile.trim());
  }

  if (!officer) {
    return res.status(404).json({ success: false, message: 'चयनित ग्राम पंचायत हेतु कोई नोडल अधिकारी नहीं मिला।' });
  }

  // Check password: Password is the officer's registered mobile number
  const enteredPass = (password || '').trim();
  const registeredMobile = (officer.mobile || '').trim();

  if (enteredPass !== registeredMobile) {
    return res.status(401).json({
      success: false,
      message: 'गलत पासवर्ड! आपका पासवर्ड आपका पंजीकृत 10 अंकों का मोबाइल नंबर है।'
    });
  }

  return res.json({
    success: true,
    officer: {
      ...officer,
      selectedMonth: month || 'सितम्बर 2026'
    }
  });
});


// Masters
app.get('/api/masters', (req, res) => {
  res.json(DB.getMasters());
});

// File upload
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({
    success: true,
    fileUrl,
    filename: req.file.filename,
    size: req.file.size
  });
});

// Inspections CRUD
const VALID_TYPES = ['anganwadi', 'school', 'hostel', 'pds', 'chaupal', 'health', 'awas'];

app.get('/api/inspections/:type', (req, res) => {
  const { type } = req.params;
  if (!VALID_TYPES.includes(type)) {
    return res.status(400).json({ error: 'Invalid inspection type' });
  }
  const filters = {
    officerId: req.query.officerId,
    block: req.query.block,
    panchayat: req.query.panchayat,
    startDate: req.query.startDate,
    endDate: req.query.endDate
  };
  const list = DB.getInspections(type, filters);
  res.json(list);
});

app.get('/api/inspections/:type/:id', (req, res) => {
  const { type, id } = req.params;
  if (!VALID_TYPES.includes(type)) {
    return res.status(400).json({ error: 'Invalid inspection type' });
  }
  const item = DB.getInspectionById(type, id);
  if (!item) {
    return res.status(404).json({ error: 'Inspection not found' });
  }
  res.json(item);
});

app.post('/api/inspections/:type', (req, res) => {
  const { type } = req.params;
  if (!VALID_TYPES.includes(type)) {
    return res.status(400).json({ error: 'Invalid inspection type' });
  }
  try {
    const saved = DB.saveInspection(type, req.body);
    res.json({ success: true, item: saved });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/inspections/:type/:id', (req, res) => {
  const { type, id } = req.params;
  if (!VALID_TYPES.includes(type)) {
    return res.status(400).json({ error: 'Invalid inspection type' });
  }
  const success = DB.deleteInspection(type, id);
  res.json({ success });
});

// Goswara Summary
app.get('/api/reports/goswara', (req, res) => {
  const filters = {
    officerId: req.query.officerId,
    block: req.query.block,
    panchayat: req.query.panchayat,
    startDate: req.query.startDate,
    endDate: req.query.endDate
  };
  const summary = DB.getGoswaraSummary(filters);
  res.json(summary);
});

// Export Excel
app.get(['/api/reports/export-excel', '/api/reports/excel'], async (req, res) => {
  try {
    const filters = {
      officerId: req.query.officerId,
      block: req.query.block,
      panchayat: req.query.panchayat,
      startDate: req.query.startDate,
      endDate: req.query.endDate
    };
    const workbook = await generateGoswaraExcel(filters);

    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `Nodal_Goswara_Report_${timestamp}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('Error exporting Excel:', err);
    res.status(500).json({ error: 'Failed to generate Excel report' });
  }
});

// Admin Monthly Compliance Report (Block-wise & Month-wise who completed and who did not)
app.get('/api/reports/compliance', (req, res) => {
  try {
    const filters = {
      block: req.query.block,
      month: req.query.month
    };
    const report = DB.getComplianceReport(filters);
    res.json({ success: true, ...report });
  } catch (err) {
    console.error('Error fetching compliance report:', err);
    res.status(500).json({ success: false, error: 'Failed to generate compliance report' });
  }
});

// Admin Monthly Compliance Excel Export
app.get('/api/reports/export-compliance-excel', async (req, res) => {
  try {
    const filters = {
      block: req.query.block,
      month: req.query.month
    };
    const workbook = await generateComplianceExcel(filters);

    const safeMonth = (filters.month || 'all_months').replace(/\s+/g, '_');
    const safeBlock = (filters.block || 'all_blocks').replace(/\s+/g, '_');
    const filename = `Nodal_Compliance_${safeBlock}_${safeMonth}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('Error exporting compliance Excel:', err);
    res.status(500).json({ error: 'Failed to export compliance Excel report' });
  }
});

// Serve frontend in production if built
const clientDist = path.join(__dirname, '../client/dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.use((req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}


app.listen(PORT, () => {
  console.log(`Nodal Inspection Server running on port ${PORT}`);
});

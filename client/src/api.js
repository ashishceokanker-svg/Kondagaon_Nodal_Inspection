// API Service with Supabase Cloud DB, Local Express Server & Offline LocalStorage Fallback

import { supabase, isSupabaseConfigured } from './supabaseClient';

const API_BASE = '/api';

// Helper to convert inspection DB row to frontend object
function mapDbRowToInspection(row) {
  if (!row) return null;
  const formData = row.form_data || {};
  return {
    ...formData,
    id: row.id,
    officerId: row.officer_id || formData.officerId,
    officerName: row.officer_name || formData.officerName,
    officerDesignation: row.officer_designation || formData.officerDesignation,
    officerMobile: row.officer_mobile || formData.officerMobile,
    block: row.block || formData.block,
    district: row.district || formData.district || 'कोण्डागांव',
    panchayat: row.panchayat || formData.panchayat,
    village: row.village || formData.village,
    centerName: row.center_name || formData.centerName,
    schoolName: row.school_name || formData.schoolName,
    hostelName: row.hostel_name || formData.hostelName,
    shopNumber: row.shop_number || formData.shopNumber,
    beneficiaryName: row.beneficiary_name || formData.beneficiaryName,
    healthCenterName: row.health_center_name || formData.healthCenterName,
    date: row.date || formData.date,
    month: row.month || formData.month,
    status: row.status || formData.status || 'पूर्ण',
    remarks: row.remarks || formData.remarks,
    photoUrl: row.photo_url || formData.photoUrl,
    latitude: row.latitude || formData.latitude,
    longitude: row.longitude || formData.longitude,
    geoAccuracy: row.geo_accuracy || formData.geoAccuracy,
    createdAt: row.created_at || formData.createdAt,
    updatedAt: row.updated_at || formData.updatedAt,
  };
}

// Helper to convert frontend object to Supabase row
function mapInspectionToDbRow(type, data) {
  const id = data.id || `insp-${type}-${Date.now()}-${Math.round(Math.random() * 1000)}`;
  return {
    id,
    officer_id: data.officerId || data.officer_id || '',
    officer_name: data.officerName || data.officer_name || '',
    officer_designation: data.officerDesignation || data.officer_designation || '',
    officer_mobile: data.officerMobile || data.officer_mobile || '',
    block: data.block || '',
    district: data.district || 'कोण्डागांव',
    panchayat: data.panchayat || '',
    village: data.village || '',
    center_name: data.centerName || '',
    school_name: data.schoolName || '',
    hostel_name: data.hostelName || '',
    shop_number: data.shopNumber || '',
    beneficiary_name: data.beneficiaryName || '',
    health_center_name: data.healthCenterName || '',
    chaupal_date: data.chaupalDate || data.date || '',
    date: data.date || '',
    month: data.month || 'सितम्बर 2026',
    status: data.status || 'पूर्ण',
    remarks: data.remarks || data.overallRemarks || data.academicRemarks || '',
    photo_url: data.photoUrl || '',
    latitude: data.latitude ? Number(data.latitude) : null,
    longitude: data.longitude ? Number(data.longitude) : null,
    geo_accuracy: data.geoAccuracy ? Number(data.geoAccuracy) : null,
    form_data: { ...data, id },
    updated_at: new Date().toISOString()
  };
}

export const API = {
  // Officers Management
  async getOfficers() {
    // 1. Try Supabase
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('nodal_officers')
          .select('*')
          .order('sno', { ascending: true });
        if (!error && data && data.length > 0) {
          localStorage.setItem('cached_officers', JSON.stringify(data));
          return data;
        }
      } catch (err) {
        console.warn('Supabase getOfficers failed, falling back:', err);
      }
    }

    // 2. Try Local Server
    try {
      const res = await fetch(`${API_BASE}/officers`);
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('cached_officers', JSON.stringify(data));
        return data;
      }
    } catch (err) {
      console.warn('Backend server unreachable, using offline cached officers:', err);
    }

    // 3. Fallback to LocalStorage Cache
    const cached = localStorage.getItem('cached_officers');
    return cached ? JSON.parse(cached) : [];
  },

  async login(credentials) {
    // Admin check
    if (credentials.role === 'admin' || credentials.username === 'admin') {
      if (credentials.password && credentials.password.trim() === 'admin') {
        const adminOfficer = {
          id: 'admin',
          name: 'जिला प्रशासक (Admin)',
          designation: 'कलेक्टर कार्यालय / एडमिन',
          role: 'admin',
          block: 'सभी विकासखण्ड',
          district: 'कोण्डागांव',
          panchayat: 'समस्त ग्राम पंचायत',
          mobile: '9999999999',
          selectedMonth: credentials.month || 'सितम्बर 2026'
        };
        localStorage.setItem('current_officer', JSON.stringify(adminOfficer));
        return { success: true, officer: adminOfficer };
      } else {
        return { success: false, message: 'गलत एडमिन पासवर्ड! कृपया सही पासवर्ड (admin) दर्ज करें।' };
      }
    }

    // Nodal Officer Login
    // 1. Try Supabase
    if (isSupabaseConfigured() && supabase) {
      try {
        let query = supabase.from('nodal_officers').select('*');
        if (credentials.panchayat) {
          query = query.or(`panchayat.eq.${credentials.panchayat},panchayats.cs.["${credentials.panchayat}"]`);
        } else if (credentials.officerId) {
          query = query.eq('id', credentials.officerId);
        } else if (credentials.mobile) {
          query = query.eq('mobile', credentials.mobile.trim());
        }

        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          const officer = data[0];
          const enteredPass = (credentials.password || '').trim();
          const registeredMobile = (officer.mobile || '').trim();

          if (enteredPass !== registeredMobile) {
            return {
              success: false,
              message: 'गलत पासवर्ड! आपका पासवर्ड आपका पंजीकृत 10 अंकों का मोबाइल नंबर है।'
            };
          }

          const officerWithMonth = {
            ...officer,
            selectedMonth: credentials.month || 'सितम्बर 2026'
          };
          localStorage.setItem('current_officer', JSON.stringify(officerWithMonth));
          return { success: true, officer: officerWithMonth };
        }
      } catch (err) {
        console.warn('Supabase login failed, trying local fallback:', err);
      }
    }

    // 2. Try Local Server
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });
      const data = await res.json();
      if (data.success && data.officer) {
        localStorage.setItem('current_officer', JSON.stringify(data.officer));
        return data;
      }
      if (res.status === 401 || res.status === 404) {
        return data;
      }
    } catch (err) {
      console.warn('Offline login fallback:', err);
    }

    // 3. Fallback to LocalStorage Cached Officers
    const cached = localStorage.getItem('cached_officers');
    if (cached) {
      const list = JSON.parse(cached);
      const found = list.find(o => 
        (credentials.panchayat && (o.panchayat === credentials.panchayat || (o.panchayats && o.panchayats.includes(credentials.panchayat)))) ||
        (credentials.officerId && o.id === credentials.officerId) ||
        (credentials.mobile && o.mobile === credentials.mobile.trim())
      );
      if (found) {
        if (credentials.password && credentials.password.trim() === (found.mobile || '').trim()) {
          const officerWithMonth = { ...found, selectedMonth: credentials.month || 'सितम्बर 2026' };
          localStorage.setItem('current_officer', JSON.stringify(officerWithMonth));
          return { success: true, officer: officerWithMonth };
        } else {
          return { success: false, message: 'गलत पासवर्ड! आपका पासवर्ड आपका पंजीकृत 10 अंकों का मोबाइल नंबर है।' };
        }
      }
    }

    return { success: false, message: 'चयनित ग्राम पंचायत हेतु कोई नोडल अधिकारी नहीं मिला या इंटरनेट बंद है।' };
  },

  async saveOfficer(officerData) {
    // 1. Try Supabase
    if (isSupabaseConfigured() && supabase) {
      try {
        const id = officerData.id || `off-${Date.now()}`;
        const row = {
          id,
          sno: Number(officerData.sno) || 0,
          name: officerData.name,
          designation: officerData.designation || '',
          mobile: officerData.mobile,
          block: officerData.block,
          district: officerData.district || 'कोण्डागांव',
          panchayat: officerData.panchayat || '',
          panchayats: officerData.panchayats || (officerData.panchayat ? [officerData.panchayat] : []),
          is_active: officerData.is_active !== false,
          updated_at: new Date().toISOString()
        };
        const { data, error } = await supabase.from('nodal_officers').upsert(row).select().single();
        if (!error && data) {
          this._updateCachedOfficer(data);
          return { success: true, officer: data };
        }
      } catch (err) {
        console.warn('Supabase saveOfficer failed:', err);
      }
    }

    // 2. Try Local Server
    try {
      const isEdit = !!officerData.id;
      const url = isEdit ? `${API_BASE}/officers/${officerData.id}` : `${API_BASE}/officers`;
      const method = isEdit ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(officerData)
      });
      const data = await res.json();
      if (data.officer) this._updateCachedOfficer(data.officer);
      return data;
    } catch (err) {
      console.warn('Local saveOfficer failed, saving in cache:', err);
      const saved = { ...officerData, id: officerData.id || `off-local-${Date.now()}` };
      this._updateCachedOfficer(saved);
      return { success: true, officer: saved, isOffline: true };
    }
  },

  async deleteOfficer(id) {
    // 1. Try Supabase
    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.from('nodal_officers').delete().eq('id', id);
      } catch (err) {
        console.warn('Supabase deleteOfficer failed:', err);
      }
    }

    // 2. Try Local Server
    try {
      await fetch(`${API_BASE}/officers/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.warn('Local deleteOfficer failed:', err);
    }

    // Update cache
    const cached = localStorage.getItem('cached_officers');
    if (cached) {
      const list = JSON.parse(cached).filter(o => o.id !== id);
      localStorage.setItem('cached_officers', JSON.stringify(list));
    }
    return { success: true, message: 'अधिकारी सफलतापूर्वक हटा दिया गया।' };
  },

  _updateCachedOfficer(officer) {
    try {
      const cached = localStorage.getItem('cached_officers');
      let list = cached ? JSON.parse(cached) : [];
      const idx = list.findIndex(o => o.id === officer.id);
      if (idx >= 0) list[idx] = officer;
      else list.push(officer);
      localStorage.setItem('cached_officers', JSON.stringify(list));
    } catch (e) {
      console.warn('Cache update error:', e);
    }
  },

  getCurrentOfficer() {
    const raw = localStorage.getItem('current_officer');
    return raw ? JSON.parse(raw) : null;
  },

  logout() {
    localStorage.removeItem('current_officer');
  },

  // Masters Data
  async getMasters() {
    // 1. Try Supabase
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase.from('masters').select('*').eq('id', 'kondagaon_master').single();
        if (!error && data) {
          localStorage.setItem('cached_masters', JSON.stringify(data));
          return data;
        }
      } catch (err) {
        console.warn('Supabase getMasters failed:', err);
      }
    }

    // 2. Try Local Server
    try {
      const res = await fetch(`${API_BASE}/masters`);
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('cached_masters', JSON.stringify(data));
        return data;
      }
    } catch (err) {
      console.warn('Using fallback masters data:', err);
    }

    // 3. Fallback
    const cached = localStorage.getItem('cached_masters');
    return cached ? JSON.parse(cached) : {
      district: 'कोण्डागांव',
      blocks: ['बड़ेराजपुर', 'कोण्डागांव', 'केशकाल', 'माकड़ी', 'फरसगांव'],
      panchayats: {
        'बड़ेराजपुर': ['बाँसकोट', 'तितरवण्ड', 'बड़बत्तर', 'ढोढरा', 'रामपुर', 'बस्तरबुड्रा', 'पिटेचुवा', 'खरगांव', 'जिरीपारा', 'बैजनपुरी', 'खलारी', 'कोसमी', 'हात्मा', 'कोरहोबेड़ा', 'कोरगांव', 'टेंवसा', 'कलगांव', 'कोंगेरा', 'सोनपुर', 'पेण्ड्रावन', 'होनावण्डी', 'बाड़ागांव', 'काँदेकरा', 'मचली', 'पारोण्ड', 'खजरावण्ड', 'आमगांव', 'बड़ेराजपुर', 'छोटेराजपुर', 'माड़ोकी खरगांव', 'कोपरा', 'छिन्दली', 'धामनपुरी', 'किबड़ा', 'बालेंगा', 'लिहागांव', 'पलना', 'चिचाड़ी', 'सालना', 'मारंगपुरी', 'केरागांव', 'हरवेल', 'पीढ़ापाल', 'नौकाबेड़ा', 'जोड़ेकेरा', 'गम्हरी', "विश्रामपुरी 'अ'", "विश्रामपुरी 'ब'", 'बीरापारा'],
        'कोण्डागांव': ['बनियागांव', 'दहीकोंगा', 'जुगानी', 'बम्हनी', 'लंजोड़ा'],
        'केशकाल': ['बटराली', 'अरण्डी', 'तमोरा', 'दादरगढ़', 'सुरदोंग'],
        'माकड़ी': ['अनंतपुर', 'बालेंग', 'कांगोली', 'रांधना', 'शामपुर'],
        'फरसगांव': ['पासंगी', 'बड़ाडोंगर', 'मांझीआठगांव', 'भोंगापाल', 'पाटला']
      }
    };
  },

  // Inspections CRUD
  async getInspections(type, filters = {}) {
    // 1. Try Supabase
    if (isSupabaseConfigured() && supabase) {
      try {
        let query = supabase.from(`inspections_${type}`).select('*');
        if (filters.officerId) query = query.eq('officer_id', filters.officerId);
        if (filters.block) query = query.eq('block', filters.block);
        if (filters.panchayat) query = query.eq('panchayat', filters.panchayat);
        if (filters.startDate) query = query.gte('date', filters.startDate);
        if (filters.endDate) query = query.lte('date', filters.endDate);
        query = query.order('created_at', { ascending: false });

        const { data, error } = await query;
        if (!error && Array.isArray(data)) {
          const mapped = data.map(mapDbRowToInspection);
          localStorage.setItem(`cached_inspections_${type}`, JSON.stringify(mapped));
          // Merge any offline pending drafts
          const drafts = this.getOfflineDrafts(type);
          return [...drafts, ...mapped];
        }
      } catch (err) {
        console.warn(`Supabase getInspections failed for ${type}:`, err);
      }
    }

    // 2. Try Local Server
    const params = new URLSearchParams();
    if (filters.officerId) params.append('officerId', filters.officerId);
    if (filters.block) params.append('block', filters.block);
    if (filters.panchayat) params.append('panchayat', filters.panchayat);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);

    try {
      const res = await fetch(`${API_BASE}/inspections/${type}?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem(`cached_inspections_${type}`, JSON.stringify(data));
        const drafts = this.getOfflineDrafts(type);
        return [...drafts, ...data];
      }
    } catch (err) {
      console.warn(`Using cached inspections for ${type}:`, err);
    }

    // 3. Fallback to LocalStorage Cache + Drafts
    const cached = localStorage.getItem(`cached_inspections_${type}`);
    let list = cached ? JSON.parse(cached) : [];
    const drafts = this.getOfflineDrafts(type);
    return [...drafts, ...list];
  },

  async saveInspection(type, data) {
    // 1. Try Supabase
    if (isSupabaseConfigured() && supabase) {
      try {
        const dbRow = mapInspectionToDbRow(type, data);
        const { data: savedRow, error } = await supabase
          .from(`inspections_${type}`)
          .upsert(dbRow)
          .select()
          .single();

        if (!error && savedRow) {
          const item = mapDbRowToInspection(savedRow);
          this.removeOfflineDraft(type, data.draftId || data.id);
          this._updateCachedInspection(type, item);
          return { success: true, item };
        } else if (error) {
          console.warn('Supabase upsert error, falling back to local/draft:', error);
        }
      } catch (err) {
        console.warn('Supabase save failed:', err);
      }
    }

    // 2. Try Local Server
    try {
      const res = await fetch(`${API_BASE}/inspections/${type}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        const result = await res.json();
        this.removeOfflineDraft(type, data.draftId || data.id);
        this._updateCachedInspection(type, result.item || data);
        return result;
      }
    } catch (err) {
      console.warn('Backend unavailable, saving offline draft:', err);
    }

    // 3. Save as Offline Draft
    const savedDraft = this.saveOfflineDraft(type, data);
    return { success: true, item: savedDraft, isOffline: true };
  },

  async deleteInspection(type, id) {
    // 1. Try Supabase
    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.from(`inspections_${type}`).delete().eq('id', id);
      } catch (err) {
        console.warn('Supabase delete failed:', err);
      }
    }

    // 2. Try Local Server
    try {
      await fetch(`${API_BASE}/inspections/${type}/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.warn('Local delete failed:', err);
    }

    // Remove from offline drafts and cache
    this.removeOfflineDraft(type, id);
    const cached = localStorage.getItem(`cached_inspections_${type}`);
    if (cached) {
      const list = JSON.parse(cached).filter(i => i.id !== id);
      localStorage.setItem(`cached_inspections_${type}`, JSON.stringify(list));
    }
    return { success: true };
  },

  _updateCachedInspection(type, item) {
    try {
      const cached = localStorage.getItem(`cached_inspections_${type}`);
      let list = cached ? JSON.parse(cached) : [];
      const idx = list.findIndex(i => i.id === item.id);
      if (idx >= 0) list[idx] = item;
      else list.unshift(item);
      localStorage.setItem(`cached_inspections_${type}`, JSON.stringify(list));
    } catch (e) {
      console.warn('Inspection cache update error:', e);
    }
  },

  // File & Photo Upload (Supabase Storage with Local Server / DataURL fallback)
  async uploadFile(file) {
    // 1. Try Supabase Storage
    if (isSupabaseConfigured() && supabase) {
      try {
        const ext = file.name.split('.').pop() || 'jpg';
        const cleanName = file.name.replace(/[^a-zA-Z0-9]/g, '_');
        const fileName = `${Date.now()}-${cleanName}.${ext}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('inspection-photos')
          .upload(fileName, file, { cacheControl: '3600', upsert: true });

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from('inspection-photos')
            .getPublicUrl(fileName);
          return { success: true, fileUrl: publicUrl, filename: fileName };
        } else {
          console.warn('Supabase storage upload error:', uploadError);
        }
      } catch (err) {
        console.warn('Supabase storage upload failed:', err);
      }
    }

    // 2. Try Local Server Upload
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${API_BASE}/upload`, { method: 'POST', body: formData });
      if (res.ok) return await res.json();
    } catch (err) {
      console.warn('Server upload failed, converting to local Data URL');
    }

    // 3. Fallback: Base64 Data URL (Works 100% offline inside mobile APK)
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve({ success: true, fileUrl: reader.result, isLocalDataUrl: true });
      };
      reader.readAsDataURL(file);
    });
  },

  // Goswara Summary
  async getGoswaraSummary(filters = {}) {
    const params = new URLSearchParams();
    if (filters.officerId) params.append('officerId', filters.officerId);
    if (filters.block) params.append('block', filters.block);
    if (filters.panchayat) params.append('panchayat', filters.panchayat);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);

    // 1. Try Local Server
    try {
      const res = await fetch(`${API_BASE}/reports/goswara?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('cached_goswara', JSON.stringify(data));
        return data;
      }
    } catch (err) {
      console.warn('Backend server unavailable for goswara, calculating from available data:', err);
    }

    // 2. Client-side Goswara computation (from Supabase or Cache)
    try {
      const TYPES = ['anganwadi', 'school', 'hostel', 'pds', 'chaupal', 'health', 'awas'];
      const allInspections = [];
      const typeStats = { anganwadi: 0, school: 0, hostel: 0, pds: 0, chaupal: 0, health: 0, awas: 0 };
      const panchayatMap = {};

      for (const type of TYPES) {
        const items = await this.getInspections(type, filters);
        typeStats[type] = items.length;
        items.forEach(item => {
          allInspections.push({ ...item, _type: type });
          const pName = item.panchayat || 'अन्य';
          if (!panchayatMap[pName]) {
            panchayatMap[pName] = { panchayat: pName, total: 0, anganwadi: 0, school: 0, hostel: 0, pds: 0, chaupal: 0, health: 0, awas: 0 };
          }
          panchayatMap[pName].total++;
          panchayatMap[pName][type]++;
        });
      }

      allInspections.sort((a, b) => new Date(b.date || b.createdAt || 0) - new Date(a.date || a.createdAt || 0));

      const summary = {
        totalInspections: allInspections.length,
        typeStats,
        panchayatStats: Object.values(panchayatMap).sort((a, b) => b.total - a.total),
        recentInspections: allInspections.slice(0, 50)
      };
      localStorage.setItem('cached_goswara', JSON.stringify(summary));
      return summary;
    } catch (calcErr) {
      console.warn('Goswara computation error, using cached summary:', calcErr);
      const cached = localStorage.getItem('cached_goswara');
      return cached ? JSON.parse(cached) : { totalInspections: 0, typeStats: {}, panchayatStats: [], recentInspections: [] };
    }
  },

  getExcelExportUrl(filters = {}) {
    const params = new URLSearchParams();
    if (filters.officerId) params.append('officerId', filters.officerId);
    if (filters.block) params.append('block', filters.block);
    if (filters.panchayat) params.append('panchayat', filters.panchayat);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    return `${API_BASE}/reports/export-excel?${params.toString()}`;
  },

  // Admin Monthly Compliance Report
  async getComplianceReport(filters = {}) {
    const params = new URLSearchParams();
    if (filters.block) params.append('block', filters.block);
    if (filters.month) params.append('month', filters.month);

    // 1. Try Local Server
    try {
      const res = await fetch(`${API_BASE}/reports/compliance?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem(`cached_compliance_${filters.block || 'all'}_${filters.month || 'all'}`, JSON.stringify(data));
        return data;
      }
    } catch (err) {
      console.warn('Backend unavailable, calculating compliance report on client:', err);
    }

    // 2. Client-side Compliance computation (Supabase / Local cache)
    try {
      const officers = await this.getOfficers();
      const targetMonth = (filters.month || 'सितम्बर 2026').trim();
      const targetBlock = filters.block && filters.block !== 'सभी विकासखण्ड' ? filters.block : null;

      let filteredOfficers = officers;
      if (targetBlock) {
        filteredOfficers = officers.filter(o => o.block === targetBlock);
      }

      // Collect all inspections across the 7 types
      const TYPES = ['anganwadi', 'school', 'hostel', 'pds', 'chaupal', 'health', 'awas'];
      const officerInspections = {};
      const typeStats = { anganwadi: 0, school: 0, hostel: 0, pds: 0, chaupal: 0, health: 0, awas: 0 };
      let totalInspections = 0;

      for (const type of TYPES) {
        const list = await this.getInspections(type);
        list.forEach(item => {
          const itemMonth = (item.month || '').trim();
          const matchesMonth = !targetMonth || itemMonth === targetMonth;
          const matchesBlock = !targetBlock || item.block === targetBlock;

          if (matchesMonth && matchesBlock) {
            const offId = item.officerId || (item.officerMobile ? `mob-${item.officerMobile}` : null);
            if (offId) {
              if (!officerInspections[offId]) {
                officerInspections[offId] = { count: 0, types: {}, inspections: [] };
              }
              officerInspections[offId].count++;
              officerInspections[offId].types[type] = (officerInspections[offId].types[type] || 0) + 1;
              officerInspections[offId].inspections.push(item);
            }
            totalInspections++;
            typeStats[type] = (typeStats[type] || 0) + 1;
          }
        });
      }

      const completedList = [];
      const pendingList = [];
      const allOfficers = [];

      filteredOfficers.forEach(officer => {
        const offId = officer.id;
        const offMobKey = officer.mobile ? `mob-${officer.mobile}` : null;
        const inspData = officerInspections[offId] || (offMobKey && officerInspections[offMobKey]) || { count: 0, types: {}, inspections: [] };
        const hasDone = inspData.count > 0;

        const record = {
          officerId: officer.id,
          sno: officer.sno,
          name: officer.name,
          designation: officer.designation,
          mobile: officer.mobile,
          block: officer.block,
          panchayat: officer.panchayat,
          panchayats: officer.panchayats || [officer.panchayat],
          hasInspected: hasDone,
          inspectionCount: inspData.count,
          inspectedTypes: Object.keys(inspData.types),
          lastInspectionDate: inspData.inspections.length > 0 ? (inspData.inspections[0].date || '') : null
        };

        allOfficers.push(record);
        if (hasDone) completedList.push(record);
        else pendingList.push(record);
      });

      const totalOfficers = filteredOfficers.length;
      const completedCount = completedList.length;
      const pendingCount = pendingList.length;
      const completionRate = totalOfficers > 0 ? Math.round((completedCount / totalOfficers) * 100) : 0;

      const result = {
        success: true,
        summary: {
          totalOfficers,
          completedCount,
          pendingCount,
          completionRate,
          totalInspections,
          typeStats,
          selectedMonth: targetMonth,
          selectedBlock: targetBlock || 'सभी विकासखण्ड'
        },
        completedList,
        pendingList,
        allOfficers
      };

      localStorage.setItem(`cached_compliance_${filters.block || 'all'}_${filters.month || 'all'}`, JSON.stringify(result));
      return result;
    } catch (e) {
      console.warn('Error calculating compliance:', e);
      const cached = localStorage.getItem(`cached_compliance_${filters.block || 'all'}_${filters.month || 'all'}`);
      return cached ? JSON.parse(cached) : {
        success: false,
        summary: { totalOfficers: 0, completedCount: 0, pendingCount: 0, completionRate: 0, totalInspections: 0, typeStats: {} },
        completedList: [],
        pendingList: [],
        allOfficers: []
      };
    }
  },

  getComplianceExcelUrl(filters = {}) {
    const params = new URLSearchParams();
    if (filters.block) params.append('block', filters.block);
    if (filters.month) params.append('month', filters.month);
    return `${API_BASE}/reports/export-compliance-excel?${params.toString()}`;
  },

  // Offline Draft Management
  getOfflineDrafts(type = null) {
    const raw = localStorage.getItem('nodal_offline_drafts');
    const all = raw ? JSON.parse(raw) : [];
    if (type) {
      return all.filter(d => d._inspectionType === type);
    }
    return all;
  },

  saveOfflineDraft(type, data) {
    const drafts = this.getOfflineDrafts();
    const draftId = data.draftId || data.id || `draft-${Date.now()}`;
    const draftItem = {
      ...data,
      id: draftId,
      draftId: draftId,
      _inspectionType: type,
      _isDraft: true,
      createdAt: data.createdAt || new Date().toISOString()
    };
    const idx = drafts.findIndex(d => d.id === draftId);
    if (idx >= 0) {
      drafts[idx] = draftItem;
    } else {
      drafts.unshift(draftItem);
    }
    localStorage.setItem('nodal_offline_drafts', JSON.stringify(drafts));
    return draftItem;
  },

  removeOfflineDraft(type, draftId) {
    let drafts = this.getOfflineDrafts();
    drafts = drafts.filter(d => d.id !== draftId && d.draftId !== draftId);
    localStorage.setItem('nodal_offline_drafts', JSON.stringify(drafts));
  },

  async syncOfflineDrafts() {
    const drafts = this.getOfflineDrafts();
    if (drafts.length === 0) return { synced: 0, failed: 0 };
    let synced = 0;
    let failed = 0;
    for (const draft of drafts) {
      try {
        const type = draft._inspectionType;
        const payload = { ...draft };
        delete payload._inspectionType;
        delete payload._isDraft;
        delete payload.draftId;

        const res = await this.saveInspection(type, payload);
        if (res && res.success && !res.isOffline) {
          this.removeOfflineDraft(type, draft.id);
          synced++;
        } else {
          failed++;
        }
      } catch (e) {
        failed++;
      }
    }
    return { synced, failed };
  }
};

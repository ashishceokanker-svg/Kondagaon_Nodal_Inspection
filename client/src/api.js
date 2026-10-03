// API Service with Supabase Cloud DB, Local Express Server & Offline LocalStorage Fallback

import { supabase, isSupabaseConfigured } from './supabaseClient';
import { DEFAULT_NODAL_OFFICERS } from './data/defaultOfficers';
import { matchBlock, getPanchayatsForBlock, getBlockForPanchayat, getCurrentMonthString, dateToMonthString } from './constants';

const API_BASE = '/api';

export const DEFAULT_FORM_VISIBILITY = {
  hidePreliminaryInfo: true,
  hideHostelLocationFields: true,
  hideAnganwadiRation: true,
  hideSchoolAcademicExtra: true,
  hideHostelSuperintendent: true,
  hideHostelStaff: true,
  hideAwasMaterials: true,
};

// Helper to convert inspection DB row to frontend object
function mapDbRowToInspection(row) {
  if (!row) return null;
  const formData = row.form_data || {};
  const determinedMonth = row.month || formData.month || (row.date ? dateToMonthString(row.date) : getCurrentMonthString());
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
    workName: row.work_name || formData.workName || '',
    date: row.date || formData.date,
    month: determinedMonth,
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

export function normalizeOfficer(officer) {
  if (!officer) return officer;
  const isGajendra = officer.id === 'nodal-makdi-4' || (officer.name && officer.name.includes('गजेन्द्र') && officer.name.includes('घुरडे'));
  if (isGajendra && officer.mobile !== '8962498501') {
    return { ...officer, mobile: '8962498501' };
  }
  return officer;
}

// Helper to convert frontend object to Supabase row matching exact schema columns
function mapInspectionToDbRow(type, data) {
  const id = data.id || `insp-${type}-${Date.now()}-${Math.round(Math.random() * 1000)}`;
  const currentOfficer = API.getCurrentOfficer();
  const assignedMonth = data.month || currentOfficer?.selectedMonth || (data.date ? dateToMonthString(data.date) : getCurrentMonthString());
  const row = {
    id,
    officer_id: data.officerId || data.officer_id || '',
    officer_name: data.officerName || data.officer_name || '',
    officer_designation: data.officerDesignation || data.officer_designation || '',
    officer_mobile: data.officerMobile || data.officer_mobile || '',
    block: data.block || '',
    district: data.district || 'कोण्डागांव',
    panchayat: data.panchayat || '',
    village: data.village || '',
    date: data.date || '',
    month: assignedMonth,
    status: data.status || 'पूर्ण',
    remarks: data.remarks || data.overallRemarks || data.academicRemarks || '',
    photo_url: data.photoUrl || '',
    latitude: data.latitude ? Number(data.latitude) : null,
    longitude: data.longitude ? Number(data.longitude) : null,
    geo_accuracy: data.geoAccuracy ? Number(data.geoAccuracy) : null,
    form_data: { ...data, id, month: assignedMonth },
    updated_at: new Date().toISOString()
  };

  // Add only the specific valid column corresponding to this inspection type
  if (type === 'anganwadi') {
    row.center_name = data.centerName || data.center_name || '';
  } else if (type === 'school') {
    row.school_name = data.schoolName || data.school_name || '';
  } else if (type === 'hostel') {
    row.hostel_name = data.hostelName || data.hostel_name || '';
  } else if (type === 'pds') {
    row.shop_number = data.shopNumber || data.shop_number || '';
  } else if (type === 'chaupal') {
    row.chaupal_date = data.chaupalDate || data.chaupal_date || data.date || '';
  } else if (type === 'health') {
    row.health_center_name = data.healthCenterName || data.health_center_name || '';
  } else if (type === 'awas') {
    row.beneficiary_name = data.beneficiaryName || data.beneficiary_name || '';
  } else if (type === 'nirman') {
    row.work_name = data.workName || data.work_name || '';
  }

  return row;
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
          const normalized = data.map(normalizeOfficer);
          const gajendra = data.find(o => o.id === 'nodal-makdi-4' || (o.name && o.name.includes('गजेन्द्र') && o.name.includes('घुरडे')));
          if (gajendra && gajendra.mobile !== '8962498501') {
            supabase.from('nodal_officers').update({ mobile: '8962498501' }).eq('id', gajendra.id).then(() => {}).catch(() => {});
          }
          localStorage.setItem('cached_officers', JSON.stringify(normalized));
          return normalized;
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
        const normalized = (data || []).map(normalizeOfficer);
        localStorage.setItem('cached_officers', JSON.stringify(normalized));
        return normalized;
      }
    } catch (err) {
      console.warn('Backend server unreachable, using offline cached officers:', err);
    }

    // 3. Fallback to LocalStorage Cache or Embedded Default Officers (All 69 officers)
    const cached = localStorage.getItem('cached_officers');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const normalized = parsed.map(normalizeOfficer);
          localStorage.setItem('cached_officers', JSON.stringify(normalized));
          return normalized;
        }
      } catch (e) {
        console.warn('Failed to parse cached_officers:', e);
      }
    }

    const defaultNorm = DEFAULT_NODAL_OFFICERS.map(normalizeOfficer);
    try {
      localStorage.setItem('cached_officers', JSON.stringify(defaultNorm));
    } catch (e) {
      console.warn('Could not seed default officers to cache', e);
    }
    return defaultNorm;
  },

  async login(credentials) {
    // Admin check
    if (credentials.role === 'admin' || credentials.username === 'admin') {
      if (credentials.password && credentials.password.trim() === 'admin#123') {
        const adminOfficer = {
          id: 'admin',
          name: 'जिला प्रशासक (Admin)',
          designation: 'कलेक्टर कार्यालय / एडमिन',
          role: 'admin',
          block: 'सभी विकासखण्ड',
          district: 'कोण्डागांव',
          panchayat: 'समस्त ग्राम पंचायत',
          mobile: '9999999999',
          selectedMonth: credentials.month || getCurrentMonthString()
        };
        localStorage.setItem('current_officer', JSON.stringify(adminOfficer));
        return { success: true, officer: adminOfficer };
      } else {
        return { success: false, message: 'गलत एडमिन पासवर्ड! कृपया सही पासवर्ड दर्ज करें।' };
      }
    }

    // Nodal Officer Login
    // 1. Try Supabase
    if (isSupabaseConfigured() && supabase) {
      try {
        let query = supabase.from('nodal_officers').select('*');
        if (credentials.officerId) {
          query = query.eq('id', credentials.officerId);
        } else if (credentials.panchayat) {
          query = query.or(`panchayat.eq.${credentials.panchayat},panchayats.cs.["${credentials.panchayat}"]`);
        } else if (credentials.mobile) {
          query = query.eq('mobile', credentials.mobile.trim());
        }

        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          // Find matching officer if multiple returned (e.g. identical panchayat names across blocks)
          let matched = data[0];
          if (credentials.officerId) {
            matched = data.find(o => o.id === credentials.officerId) || matched;
          } else if (credentials.block) {
            matched = data.find(o => matchBlock(o.block, credentials.block)) || matched;
          }

          let officer = normalizeOfficer(matched);
          const isGajendra = officer.id === 'nodal-makdi-4' || (officer.name && officer.name.includes('गजेन्द्र') && officer.name.includes('घुरडे'));
          if (isGajendra && isSupabaseConfigured() && supabase) {
            supabase.from('nodal_officers').update({ mobile: '8962498501' }).eq('id', officer.id).then(() => {}).catch(() => {});
          }

          const enteredPass = (credentials.password || '').trim();
          const registeredMobile = (officer.mobile || '').trim();

          const isPassValid = enteredPass === registeredMobile || (isGajendra && (enteredPass === '8962498501' || enteredPass === '7974368756'));
          if (!isPassValid) {
            return {
              success: false,
              message: 'गलत पासवर्ड! आपका पासवर्ड आपका पंजीकृत 10 अंकों का मोबाइल नंबर है।'
            };
          }

          const officerWithMonth = {
            ...officer,
            mobile: isGajendra ? '8962498501' : officer.mobile,
            selectedMonth: credentials.month || getCurrentMonthString()
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
        const normalized = normalizeOfficer(data.officer);
        localStorage.setItem('current_officer', JSON.stringify(normalized));
        return { ...data, officer: normalized };
      }
      if (res.status === 401 || res.status === 404) {
        return data;
      }
    } catch (err) {
      console.warn('Offline login fallback:', err);
    }

    // 3. Fallback to LocalStorage Cached Officers or Default Officers
    const cached = localStorage.getItem('cached_officers');
    let list = DEFAULT_NODAL_OFFICERS;
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) list = parsed;
      } catch (e) {
        console.warn('Fallback parse error:', e);
      }
    }

    const foundRaw = list.find(o => 
      (credentials.panchayat && (o.panchayat === credentials.panchayat || (o.panchayats && o.panchayats.includes(credentials.panchayat)))) ||
      (credentials.officerId && o.id === credentials.officerId) ||
      (credentials.mobile && o.mobile === credentials.mobile.trim())
    );
    if (foundRaw) {
      const found = normalizeOfficer(foundRaw);
      const isGajendra = found.id === 'nodal-makdi-4' || (found.name && found.name.includes('गजेन्द्र') && found.name.includes('घुरडे'));
      const entered = (credentials.password || '').trim();
      const expected = (found.mobile || '').trim();
      const match = entered === expected || (isGajendra && (entered === '8962498501' || entered === '7974368756'));
      if (match) {
        const officerWithMonth = { ...found, mobile: isGajendra ? '8962498501' : found.mobile, selectedMonth: credentials.month || getCurrentMonthString() };
        localStorage.setItem('current_officer', JSON.stringify(officerWithMonth));
        return { success: true, officer: officerWithMonth };
      } else {
        return { success: false, message: 'गलत पासवर्ड! आपका पासवर्ड आपका पंजीकृत 10 अंकों का मोबाइल नंबर है।' };
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
    let list = DEFAULT_NODAL_OFFICERS;
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) list = parsed;
      } catch (e) {
        console.warn('Cache parse error in delete:', e);
      }
    }
    list = list.filter(o => o.id !== id);
    localStorage.setItem('cached_officers', JSON.stringify(list));
    return { success: true, message: 'अधिकारी सफलतापूर्वक हटा दिया गया।' };
  },

  _updateCachedOfficer(officer) {
    try {
      const cached = localStorage.getItem('cached_officers');
      let list = DEFAULT_NODAL_OFFICERS;
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) list = parsed;
        } catch (e) {
          console.warn('Cache parse error in update:', e);
        }
      } else {
        list = [...DEFAULT_NODAL_OFFICERS];
      }
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

  // Form Visibility Settings (Controlled by Admin with password ashish#123)
  getFormVisibilitySettings() {
    try {
      const cached = localStorage.getItem('form_visibility_settings');
      if (cached) {
        return { ...DEFAULT_FORM_VISIBILITY, ...JSON.parse(cached) };
      }
    } catch (e) {
      console.warn('Error reading form visibility cache:', e);
    }
    return { ...DEFAULT_FORM_VISIBILITY };
  },

  async fetchFormVisibilitySettings() {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('masters')
          .select('panchayats')
          .eq('id', 'app_config')
          .single();
        if (!error && data && data.panchayats) {
          const settings = { ...DEFAULT_FORM_VISIBILITY, ...data.panchayats };
          localStorage.setItem('form_visibility_settings', JSON.stringify(settings));
          window.dispatchEvent(new CustomEvent('form_visibility_changed', { detail: settings }));
          return settings;
        }
      } catch (err) {
        console.warn('Supabase fetchFormVisibilitySettings failed:', err);
      }
    }
    return this.getFormVisibilitySettings();
  },

  async saveFormVisibilitySettings(settings) {
    const updated = { ...this.getFormVisibilitySettings(), ...settings };
    localStorage.setItem('form_visibility_settings', JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('form_visibility_changed', { detail: updated }));

    if (isSupabaseConfigured() && supabase) {
      try {
        const { error } = await supabase.from('masters').upsert({
          id: 'app_config',
          district: 'config',
          panchayats: updated,
          updated_at: new Date().toISOString()
        });
        if (error) {
          console.warn('Supabase saveFormVisibilitySettings error:', error);
        }
      } catch (err) {
        console.warn('Supabase saveFormVisibilitySettings exception:', err);
      }
    }
    return { success: true, settings: updated };
  },

  async refreshAllData() {
    // 1. Fetch latest visibility settings from Supabase
    await this.fetchFormVisibilitySettings();

    // 2. Fetch latest masters
    try {
      if (isSupabaseConfigured() && supabase) {
        const { data } = await supabase.from('masters').select('*').eq('id', 'kondagaon_master').single();
        if (data) {
          localStorage.setItem('cached_masters', JSON.stringify(data));
        }
      }
    } catch (e) {}

    // 3. Fetch latest officers
    try {
      if (isSupabaseConfigured() && supabase) {
        const { data: officersData } = await supabase.from('nodal_officers').select('*').order('sno', { ascending: true });
        if (officersData && officersData.length > 0) {
          localStorage.setItem('cached_officers', JSON.stringify(officersData));
        }
      }
    } catch (e) {}

    // 4. Invalidate goswara cache
    localStorage.removeItem('cached_goswara');

    // 5. Clear browser cache storage if available
    if ('caches' in window) {
      try {
        const keys = await caches.keys();
        await Promise.all(keys.map(k => caches.delete(k)));
      } catch (e) {}
    }

    return { success: true };
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
      blocks: ['फरसगांव', 'बड़ेराजपुर', 'कोण्डागांव', 'केशकाल', 'माकड़ी'],
      panchayats: {
        'फरसगांव': [
          'फुण्डर', 'मोहलई', 'बाड़ागांव', 'बनचपई', 'लंजोड़ा', 'भानपुरी', 'कोसागांव', 'झाकरी', 'बड़ेओड़ागांव', 'बड़गई',
          'पावड़ा', 'मोदेबेड़मा', 'जैतपुरी', 'बोरगांव', 'सोड़मा', 'बंजोड़ा', 'मोहपाल', 'बंगोली', 'बड़ेडोंगर', 'चनियागांव',
          'देवगांव', 'जामगांव', 'छिन्दलीबेड़ा', 'गवाड़ी', 'बोकराबेड़ा', 'हाटचपई', 'कोकोड़ाजुगानार', 'परोदा', 'मांझीआंठगांव', 'चिचाड़ी',
          'बानगांव', 'गटटीपलना', 'पतोड़ा', 'कोराड़बड़गांव', 'भण्डारवण्डी', 'आलोर', 'झाटीबन', 'मोदे', 'कन्हारगांव', 'कोनगुड़',
          'उरन्दाबेड़ा', 'आमगांव', 'शंकरपुर', 'फूफगांव', 'बोरगांव (पूर्वी)', 'पाण्डेआठगांव', 'चांदागांव', 'सिंगारपुरी', 'चुरेगांव', 'हिरी',
          'भूमका', 'गोड़मा', 'कोरई', 'तोरण्ड', 'कोटपाड़', 'खण्डसरा', 'मांदागांव', 'भोंगापाल', 'चांदाबेड़ा', 'छिंदली',
          'जुगानीकलार', 'कुल्हाड़गांव', 'भण्डारसिवनी', 'चरकई', 'सिरपुर', 'कुम्हारबड़गांव', 'पलना', 'चिंगनार', 'कसई फरसगांव', 'मैनपुर',
          'मोड़ेगा', 'सिरसीकलार', 'कबोंगा'
        ],
        'बड़ेराजपुर': ['बाँसकोट', 'तितरवण्ड', 'बड़बत्तर', 'ढोढरा', 'रामपुर', 'बस्तरबुड्रा', 'पिटेचुवा', 'खरगांव', 'जिरीपारा', 'बैजनपुरी', 'खलारी', 'कोसमी', 'हात्मा', 'कोरहोबेड़ा', 'कोरगांव', 'टेंवसा', 'कलगांव', 'कोंगेरा', 'सोनपुर', 'पेण्ड्रावन', 'होनावण्डी', 'बाड़ागांव', 'काँदेकरा', 'मचली', 'पारोण्ड', 'खजरावण्ड', 'आमगांव', 'बड़ेराजपुर', 'छोटेराजपुर', 'माड़ोकी खरगांव', 'कोपरा', 'छिन्दली', 'धामनपुरी', 'किबड़ा', 'बालेंगा', 'लिहागांव', 'पलना', 'चिचाड़ी', 'सालना', 'मारंगपुरी', 'केरागांव', 'हरवेल', 'पीढ़ापाल', 'नौकाबेड़ा', 'जोड़ेकेरा', 'गम्हरी', "विश्रामपुरी 'अ'", "विश्रामपुरी 'ब'", 'बीरापारा'],
        'कोण्डागांव': ['बनियागांव', 'दहीकोंगा', 'जुगानी', 'बम्हनी', 'लंजोड़ा'],
        'केशकाल': ['बटराली', 'अरण्डी', 'तमोरा', 'दादरगढ़', 'सुरदोंग'],
        'माकड़ी': ['अनंतपुर', 'बालेंग', 'कांगोली', 'रांधना', 'शामपुर']
      }
    };
  },

  // Inspections CRUD
  async getInspections(type, filters = {}) {
    // 1. Try Supabase
    if (isSupabaseConfigured() && supabase) {
      try {
        if (type === 'nirman') {
          let query = supabase.from('masters').select('*').eq('district', 'inspections_nirman');
          const { data, error } = await query;
          if (!error && Array.isArray(data)) {
            let mapped = data.map(r => {
              const p = r.panchayats || {};
              const date = p.date || (r.updated_at ? r.updated_at.slice(0, 10) : '');
              const itemMonth = p.month || (date ? dateToMonthString(date) : getCurrentMonthString());
              return {
                ...p,
                id: r.id,
                date,
                month: itemMonth,
                block: p.block || (Array.isArray(r.blocks) ? r.blocks[0] : ''),
                panchayat: p.panchayat || (Array.isArray(r.blocks) ? r.blocks[1] : ''),
                officerId: p.officerId || (Array.isArray(r.blocks) ? r.blocks[2] : '')
              };
            });
            if (filters.officerId && filters.officerId !== 'admin') {
              mapped = mapped.filter(item => item.officerId === filters.officerId || item.officer_id === filters.officerId);
            }
            if (filters.block && filters.block !== 'सभी विकासखण्ड' && filters.block !== 'समस्त विकासखण्ड') {
              mapped = mapped.filter(item => matchBlock(item.block, filters.block));
            }
            if (filters.panchayat && filters.panchayat !== 'सभी ग्राम पंचायतें' && filters.panchayat !== 'समस्त पंचायतें') {
              mapped = mapped.filter(item => item.panchayat === filters.panchayat);
            } else if (filters.panchayats && Array.isArray(filters.panchayats) && filters.panchayats.length > 0) {
              mapped = mapped.filter(item => filters.panchayats.includes(item.panchayat));
            }
            if (filters.startDate) mapped = mapped.filter(item => (item.date || item.inspectionDate || '') >= filters.startDate);
            if (filters.endDate) mapped = mapped.filter(item => (item.date || item.inspectionDate || '') <= filters.endDate);
            if (filters.month) {
              mapped = mapped.filter(item => item.month === filters.month || (item.date && dateToMonthString(item.date) === filters.month));
            }
            mapped.sort((a, b) => new Date(b.date || b.createdAt || 0) - new Date(a.date || a.createdAt || 0));

            localStorage.setItem(`cached_inspections_${type}`, JSON.stringify(mapped));
            let drafts = this.getOfflineDrafts(type);
            if (filters.panchayat && filters.panchayat !== 'सभी ग्राम पंचायतें' && filters.panchayat !== 'समस्त पंचायतें') {
              drafts = drafts.filter(item => item.panchayat === filters.panchayat);
            } else if (filters.panchayats && Array.isArray(filters.panchayats) && filters.panchayats.length > 0) {
              drafts = drafts.filter(item => filters.panchayats.includes(item.panchayat));
            }
            if (filters.month) {
              drafts = drafts.filter(item => item.month === filters.month || (item.date && dateToMonthString(item.date) === filters.month));
            }
            return [...drafts, ...mapped];
          }
        } else {
          let query = supabase.from(`inspections_${type}`).select('*');
          if (filters.officerId && filters.officerId !== 'admin') {
            query = query.eq('officer_id', filters.officerId);
          }
          if (filters.block && filters.block !== 'सभी विकासखण्ड' && filters.block !== 'समस्त विकासखण्ड') {
            query = query.or(`block.eq.${filters.block},block.ilike.%${filters.block}%`);
          }
          if (filters.panchayat && filters.panchayat !== 'सभी ग्राम पंचायतें' && filters.panchayat !== 'समस्त पंचायतें') {
            query = query.eq('panchayat', filters.panchayat);
          } else if (filters.panchayats && Array.isArray(filters.panchayats) && filters.panchayats.length > 0) {
            query = query.in('panchayat', filters.panchayats);
          }
          if (filters.startDate) query = query.gte('date', filters.startDate);
          if (filters.endDate) query = query.lte('date', filters.endDate);
          if (filters.month) query = query.or(`month.eq.${filters.month},month.is.null`);
          query = query.order('created_at', { ascending: false });

          const { data, error } = await query;
          if (!error && Array.isArray(data)) {
            let mapped = data.map(mapDbRowToInspection);
            if (filters.block && filters.block !== 'सभी विकासखण्ड' && filters.block !== 'समस्त विकासखण्ड') {
              mapped = mapped.filter(item => matchBlock(item.block, filters.block));
            }
            if (filters.panchayat && filters.panchayat !== 'सभी ग्राम पंचायतें' && filters.panchayat !== 'समस्त पंचायतें') {
              mapped = mapped.filter(item => item.panchayat === filters.panchayat);
            } else if (filters.panchayats && Array.isArray(filters.panchayats) && filters.panchayats.length > 0) {
              mapped = mapped.filter(item => filters.panchayats.includes(item.panchayat));
            }
            if (filters.month) mapped = mapped.filter(item => item.month === filters.month || (item.date && dateToMonthString(item.date) === filters.month));
            localStorage.setItem(`cached_inspections_${type}`, JSON.stringify(mapped));
            // Merge any offline pending drafts
            let drafts = this.getOfflineDrafts(type);
            if (filters.panchayat && filters.panchayat !== 'सभी ग्राम पंचायतें' && filters.panchayat !== 'समस्त पंचायतें') {
              drafts = drafts.filter(item => item.panchayat === filters.panchayat);
            } else if (filters.panchayats && Array.isArray(filters.panchayats) && filters.panchayats.length > 0) {
              drafts = drafts.filter(item => filters.panchayats.includes(item.panchayat));
            }
            if (filters.month) drafts = drafts.filter(item => item.month === filters.month);
            return [...drafts, ...mapped];
          }
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
    if (filters.month) params.append('month', filters.month);

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
    let drafts = this.getOfflineDrafts(type);
    let combined = [...drafts, ...list];
    if (filters.panchayat && filters.panchayat !== 'सभी ग्राम पंचायतें' && filters.panchayat !== 'समस्त पंचायतें') {
      combined = combined.filter(item => item.panchayat === filters.panchayat);
    } else if (filters.panchayats && Array.isArray(filters.panchayats) && filters.panchayats.length > 0) {
      combined = combined.filter(item => filters.panchayats.includes(item.panchayat));
    }
    if (filters.block && filters.block !== 'सभी विकासखण्ड' && filters.block !== 'समस्त विकासखण्ड') {
      combined = combined.filter(item => matchBlock(item.block, filters.block));
    }
    if (filters.startDate) {
      combined = combined.filter(item => (item.date || item.inspectionDate) >= filters.startDate);
    }
    if (filters.endDate) {
      combined = combined.filter(item => (item.date || item.inspectionDate) <= filters.endDate);
    }
    if (filters.month) {
      combined = combined.filter(item => item.month === filters.month || (item.date && dateToMonthString(item.date) === filters.month));
    }
    return combined;
  },

  async saveInspection(type, data) {
    // 1. Try Supabase
    if (isSupabaseConfigured() && supabase) {
      try {
        if (type === 'nirman') {
          const id = data.id || `insp-nirman-${Date.now()}-${Math.round(Math.random() * 1000)}`;
          const month = data.month || (data.date ? dateToMonthString(data.date) : getCurrentMonthString());
          const itemToSave = { ...data, id, type: 'nirman', month };
          const row = {
            id,
            district: 'inspections_nirman',
            blocks: [data.block || '', data.panchayat || '', data.officerId || ''],
            panchayats: itemToSave,
            updated_at: new Date().toISOString()
          };
          const { error } = await supabase.from('masters').upsert(row);
          if (!error) {
            localStorage.removeItem('cached_goswara');
            this.removeOfflineDraft('nirman', data.draftId || id);
            this._updateCachedInspection('nirman', itemToSave);
            try {
              window.dispatchEvent(new CustomEvent('inspections_updated', { detail: { type: 'nirman', item: itemToSave } }));
            } catch (e) {}
            return { success: true, item: itemToSave };
          } else {
            console.warn('Supabase nirman upsert error:', error);
          }
        } else {
          const dbRow = mapInspectionToDbRow(type, data);
          const { data: savedRows, error } = await supabase
            .from(`inspections_${type}`)
            .upsert(dbRow)
            .select();

          if (!error) {
            const rowToUse = (savedRows && savedRows.length > 0) ? savedRows[0] : dbRow;
            const item = mapDbRowToInspection(rowToUse);
            localStorage.removeItem('cached_goswara');
            this.removeOfflineDraft(type, data.draftId || data.id);
            this._updateCachedInspection(type, item);
            try {
              window.dispatchEvent(new CustomEvent('inspections_updated', { detail: { type, item } }));
            } catch (e) {}
            return { success: true, item };
          } else {
            console.warn('Supabase upsert error, falling back to local/draft:', error);
          }
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
        if (type === 'nirman') {
          await supabase.from('masters').delete().eq('id', id);
        } else {
          await supabase.from(`inspections_${type}`).delete().eq('id', id);
        }
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
    localStorage.removeItem('cached_goswara');
    const cached = localStorage.getItem(`cached_inspections_${type}`);
    if (cached) {
      const list = JSON.parse(cached).filter(i => i.id !== id);
      localStorage.setItem(`cached_inspections_${type}`, JSON.stringify(list));
    }
    try {
      window.dispatchEvent(new CustomEvent('inspections_updated', { detail: { type, id } }));
    } catch (e) {}
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

  // File & Photo Upload (Direct Optimized Base64 for Supabase Database)
  async uploadFile(file) {
    return new Promise((resolve) => {
      // If image, compress to lightweight Base64 to save database space and ensure ultra-fast sync
      if (file.type && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            try {
              const canvas = document.createElement('canvas');
              const maxDim = 1024;
              let width = img.width;
              let height = img.height;
              if (width > height && width > maxDim) {
                height = Math.round((height * maxDim) / width);
                width = maxDim;
              } else if (height > maxDim) {
                width = Math.round((width * maxDim) / height);
                height = maxDim;
              }
              canvas.width = width;
              canvas.height = height;
              const ctx = canvas.getContext('2d');
              ctx.drawImage(img, 0, 0, width, height);
              const base64Url = canvas.toDataURL('image/jpeg', 0.8);
              resolve({ success: true, fileUrl: base64Url, dataUrl: base64Url, filename: file.name });
            } catch (canvasErr) {
              resolve({ success: true, fileUrl: e.target.result, dataUrl: e.target.result, filename: file.name });
            }
          };
          img.onerror = () => {
            resolve({ success: true, fileUrl: e.target.result, dataUrl: e.target.result, filename: file.name });
          };
          img.src = e.target.result;
        };
        reader.readAsDataURL(file);
      } else {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve({ success: true, fileUrl: reader.result, dataUrl: reader.result, filename: file.name });
        };
        reader.readAsDataURL(file);
      }
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
    if (filters.month) params.append('month', filters.month);

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
      const TYPES = ['anganwadi', 'school', 'hostel', 'pds', 'chaupal', 'health', 'awas', 'nirman'];
      const allInspections = [];
      const typeStats = { anganwadi: 0, school: 0, hostel: 0, pds: 0, chaupal: 0, health: 0, awas: 0, nirman: 0 };
      const panchayatMap = {};

      // Determine target panchayats if filtering for officer or specific panchayat
      let targetPanchayats = null;
      if (filters.panchayat && filters.panchayat !== 'सभी ग्राम पंचायतें' && filters.panchayat !== 'समस्त पंचायतें') {
        targetPanchayats = [filters.panchayat];
      } else if (filters.panchayats && Array.isArray(filters.panchayats) && filters.panchayats.length > 0) {
        targetPanchayats = filters.panchayats;
      }

      if (targetPanchayats) {
        targetPanchayats.forEach(pName => {
          panchayatMap[pName] = { panchayat: pName, block: getBlockForPanchayat(pName), total: 0, anganwadi: 0, school: 0, hostel: 0, pds: 0, chaupal: 0, health: 0, awas: 0, nirman: 0 };
        });
      } else if (!filters.officerId && filters.block && filters.block !== 'सभी विकासखण्ड' && filters.block !== 'समस्त विकासखण्ड') {
        const blkPanchayats = getPanchayatsForBlock(filters.block);
        blkPanchayats.forEach(pName => {
          if (!panchayatMap[pName]) {
            panchayatMap[pName] = { panchayat: pName, block: filters.block, total: 0, anganwadi: 0, school: 0, hostel: 0, pds: 0, chaupal: 0, health: 0, awas: 0, nirman: 0 };
          }
        });
      }

      for (const type of TYPES) {
        const items = await this.getInspections(type, filters);
        let validItemsCount = 0;
        items.forEach(item => {
          const pName = item.panchayat || 'अन्य';
          if (targetPanchayats && !targetPanchayats.includes(pName)) {
            return;
          }
          if (filters.block && filters.block !== 'सभी विकासखण्ड' && filters.block !== 'समस्त विकासखण्ड') {
            const blk = item.block || getBlockForPanchayat(pName);
            if (!matchBlock(blk, filters.block)) {
              return;
            }
          }
          validItemsCount++;
          allInspections.push({ ...item, _type: type });
          if (!panchayatMap[pName]) {
            panchayatMap[pName] = { panchayat: pName, block: item.block || getBlockForPanchayat(pName) || '', total: 0, anganwadi: 0, school: 0, hostel: 0, pds: 0, chaupal: 0, health: 0, awas: 0, nirman: 0 };
          }
          panchayatMap[pName].total++;
          panchayatMap[pName][type]++;
        });
        typeStats[type] = { count: validItemsCount, total: validItemsCount };
      }

      allInspections.sort((a, b) => new Date(b.date || b.createdAt || 0) - new Date(a.date || a.createdAt || 0));

      let panchayatStats = Object.values(panchayatMap);
      if (targetPanchayats) {
        panchayatStats = panchayatStats.filter(p => targetPanchayats.includes(p.panchayat));
      }
      if (filters.block && filters.block !== 'सभी विकासखण्ड' && filters.block !== 'समस्त विकासखण्ड') {
        panchayatStats = panchayatStats.filter(p => {
          const blk = p.block || getBlockForPanchayat(p.panchayat);
          return matchBlock(blk, filters.block);
        });
      }
      panchayatStats.sort((a, b) => b.total - a.total);

      const summary = {
        totalInspections: allInspections.length,
        typeStats,
        panchayatStats,
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
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);

    const cacheKey = `cached_compliance_${filters.block || 'all'}_${filters.month || 'all'}_${filters.startDate || ''}_${filters.endDate || ''}`;

    // 1. Try Local Server
    try {
      const res = await fetch(`${API_BASE}/reports/compliance?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem(cacheKey, JSON.stringify(data));
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

      // Collect all inspections across the 8 types
      const TYPES = ['anganwadi', 'school', 'hostel', 'pds', 'chaupal', 'health', 'awas', 'nirman'];
      const officerInspections = {};
      const typeStats = { anganwadi: 0, school: 0, hostel: 0, pds: 0, chaupal: 0, health: 0, awas: 0, nirman: 0 };
      let totalInspections = 0;

      for (const type of TYPES) {
        const list = await this.getInspections(type);
        list.forEach(item => {
          const itemMonth = (item.month || '').trim();
          const itemDate = item.date || item.inspectionDate || '';
          const matchesDateRange = (!filters.startDate || (itemDate && itemDate >= filters.startDate)) &&
                                   (!filters.endDate || (itemDate && itemDate <= filters.endDate));
          const matchesMonth = (filters.startDate || filters.endDate) ? true : (!targetMonth || itemMonth === targetMonth);
          const matchesBlock = !targetBlock || item.block === targetBlock;

          if (matchesMonth && matchesBlock && matchesDateRange) {
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
    const currentOff = this.getCurrentOfficer();
    const activeMonth = data.month || currentOff?.selectedMonth || (data.date ? dateToMonthString(data.date) : getCurrentMonthString());
    const draftItem = {
      ...data,
      month: activeMonth,
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

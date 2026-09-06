-- ==============================================================================
-- जिला प्रशासन कोण्डागांव (छ०ग०) - नोडल अधिकारी निरीक्षण पोर्टल
-- Supabase Database Schema & Tables
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. NODAL OFFICERS TABLE
CREATE TABLE IF NOT EXISTS public.nodal_officers (
    id TEXT PRIMARY KEY,
    sno INTEGER,
    name TEXT NOT NULL,
    designation TEXT,
    mobile TEXT NOT NULL,
    block TEXT NOT NULL,
    district TEXT NOT NULL DEFAULT 'कोण्डागांव',
    panchayat TEXT,
    panchayats JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_officers_mobile ON public.nodal_officers (mobile);
CREATE INDEX IF NOT EXISTS idx_officers_block ON public.nodal_officers (block);
CREATE INDEX IF NOT EXISTS idx_officers_panchayat ON public.nodal_officers (panchayat);

-- 3. MASTERS TABLE (Districts, Blocks & Panchayats)
CREATE TABLE IF NOT EXISTS public.masters (
    id TEXT PRIMARY KEY DEFAULT 'kondagaon_master',
    district TEXT NOT NULL DEFAULT 'कोण्डागांव',
    blocks JSONB DEFAULT '[]'::jsonb NOT NULL,
    panchayats JSONB DEFAULT '{}'::jsonb NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. INSPECTION TABLES (7 Categories)

-- 4.1 आँगनबाड़ी निरीक्षण (Anganwadi)
CREATE TABLE IF NOT EXISTS public.inspections_anganwadi (
    id TEXT PRIMARY KEY,
    officer_id TEXT,
    officer_name TEXT,
    officer_designation TEXT,
    officer_mobile TEXT,
    block TEXT,
    district TEXT DEFAULT 'कोण्डागांव',
    panchayat TEXT,
    village TEXT,
    center_name TEXT,
    date TEXT,
    month TEXT,
    status TEXT DEFAULT 'पूर्ण',
    remarks TEXT,
    photo_url TEXT,
    latitude NUMERIC,
    longitude NUMERIC,
    geo_accuracy NUMERIC,
    form_data JSONB DEFAULT '{}'::jsonb NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_anganwadi_officer ON public.inspections_anganwadi (officer_id);
CREATE INDEX IF NOT EXISTS idx_anganwadi_block ON public.inspections_anganwadi (block);
CREATE INDEX IF NOT EXISTS idx_anganwadi_panchayat ON public.inspections_anganwadi (panchayat);
CREATE INDEX IF NOT EXISTS idx_anganwadi_month ON public.inspections_anganwadi (month);

-- 4.2 शाला निरीक्षण (School)
CREATE TABLE IF NOT EXISTS public.inspections_school (
    id TEXT PRIMARY KEY,
    officer_id TEXT,
    officer_name TEXT,
    officer_designation TEXT,
    officer_mobile TEXT,
    block TEXT,
    district TEXT DEFAULT 'कोण्डागांव',
    panchayat TEXT,
    village TEXT,
    school_name TEXT,
    date TEXT,
    month TEXT,
    status TEXT DEFAULT 'पूर्ण',
    remarks TEXT,
    photo_url TEXT,
    latitude NUMERIC,
    longitude NUMERIC,
    geo_accuracy NUMERIC,
    form_data JSONB DEFAULT '{}'::jsonb NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_school_officer ON public.inspections_school (officer_id);
CREATE INDEX IF NOT EXISTS idx_school_block ON public.inspections_school (block);
CREATE INDEX IF NOT EXISTS idx_school_panchayat ON public.inspections_school (panchayat);
CREATE INDEX IF NOT EXISTS idx_school_month ON public.inspections_school (month);

-- 4.3 आश्रम / छात्रावास निरीक्षण (Hostel & Ashram)
CREATE TABLE IF NOT EXISTS public.inspections_hostel (
    id TEXT PRIMARY KEY,
    officer_id TEXT,
    officer_name TEXT,
    officer_designation TEXT,
    officer_mobile TEXT,
    block TEXT,
    district TEXT DEFAULT 'कोण्डागांव',
    panchayat TEXT,
    village TEXT,
    hostel_name TEXT,
    date TEXT,
    month TEXT,
    status TEXT DEFAULT 'पूर्ण',
    remarks TEXT,
    photo_url TEXT,
    latitude NUMERIC,
    longitude NUMERIC,
    geo_accuracy NUMERIC,
    form_data JSONB DEFAULT '{}'::jsonb NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_hostel_officer ON public.inspections_hostel (officer_id);
CREATE INDEX IF NOT EXISTS idx_hostel_block ON public.inspections_hostel (block);
CREATE INDEX IF NOT EXISTS idx_hostel_panchayat ON public.inspections_hostel (panchayat);
CREATE INDEX IF NOT EXISTS idx_hostel_month ON public.inspections_hostel (month);

-- 4.4 उचित मूल्य दुकान निरीक्षण (PDS / Ration Shop)
CREATE TABLE IF NOT EXISTS public.inspections_pds (
    id TEXT PRIMARY KEY,
    officer_id TEXT,
    officer_name TEXT,
    officer_designation TEXT,
    officer_mobile TEXT,
    block TEXT,
    district TEXT DEFAULT 'कोण्डागांव',
    panchayat TEXT,
    village TEXT,
    shop_number TEXT,
    date TEXT,
    month TEXT,
    status TEXT DEFAULT 'पूर्ण',
    remarks TEXT,
    photo_url TEXT,
    latitude NUMERIC,
    longitude NUMERIC,
    geo_accuracy NUMERIC,
    form_data JSONB DEFAULT '{}'::jsonb NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_pds_officer ON public.inspections_pds (officer_id);
CREATE INDEX IF NOT EXISTS idx_pds_block ON public.inspections_pds (block);
CREATE INDEX IF NOT EXISTS idx_pds_panchayat ON public.inspections_pds (panchayat);
CREATE INDEX IF NOT EXISTS idx_pds_month ON public.inspections_pds (month);

-- 4.5 ग्राम चौपाल निरीक्षण (Gram Chaupal - 21 Sector Points)
CREATE TABLE IF NOT EXISTS public.inspections_chaupal (
    id TEXT PRIMARY KEY,
    officer_id TEXT,
    officer_name TEXT,
    officer_designation TEXT,
    officer_mobile TEXT,
    block TEXT,
    district TEXT DEFAULT 'कोण्डागांव',
    panchayat TEXT,
    village TEXT,
    chaupal_date TEXT,
    date TEXT,
    month TEXT,
    status TEXT DEFAULT 'पूर्ण',
    remarks TEXT,
    photo_url TEXT,
    latitude NUMERIC,
    longitude NUMERIC,
    geo_accuracy NUMERIC,
    form_data JSONB DEFAULT '{}'::jsonb NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_chaupal_officer ON public.inspections_chaupal (officer_id);
CREATE INDEX IF NOT EXISTS idx_chaupal_block ON public.inspections_chaupal (block);
CREATE INDEX IF NOT EXISTS idx_chaupal_panchayat ON public.inspections_chaupal (panchayat);
CREATE INDEX IF NOT EXISTS idx_chaupal_month ON public.inspections_chaupal (month);

-- 4.6 स्वास्थ्य केन्द्र निरीक्षण (Health Center / Sub-Center / PHC)
CREATE TABLE IF NOT EXISTS public.inspections_health (
    id TEXT PRIMARY KEY,
    officer_id TEXT,
    officer_name TEXT,
    officer_designation TEXT,
    officer_mobile TEXT,
    block TEXT,
    district TEXT DEFAULT 'कोण्डागांव',
    panchayat TEXT,
    village TEXT,
    health_center_name TEXT,
    date TEXT,
    month TEXT,
    status TEXT DEFAULT 'पूर्ण',
    remarks TEXT,
    photo_url TEXT,
    latitude NUMERIC,
    longitude NUMERIC,
    geo_accuracy NUMERIC,
    form_data JSONB DEFAULT '{}'::jsonb NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_health_officer ON public.inspections_health (officer_id);
CREATE INDEX IF NOT EXISTS idx_health_block ON public.inspections_health (block);
CREATE INDEX IF NOT EXISTS idx_health_panchayat ON public.inspections_health (panchayat);
CREATE INDEX IF NOT EXISTS idx_health_month ON public.inspections_health (month);

-- 4.7 प्रधानमंत्री आवास योजना निरीक्षण (PMAY / Awas)
CREATE TABLE IF NOT EXISTS public.inspections_awas (
    id TEXT PRIMARY KEY,
    officer_id TEXT,
    officer_name TEXT,
    officer_designation TEXT,
    officer_mobile TEXT,
    block TEXT,
    district TEXT DEFAULT 'कोण्डागांव',
    panchayat TEXT,
    village TEXT,
    beneficiary_name TEXT,
    date TEXT,
    month TEXT,
    status TEXT DEFAULT 'पूर्ण',
    remarks TEXT,
    photo_url TEXT,
    latitude NUMERIC,
    longitude NUMERIC,
    geo_accuracy NUMERIC,
    form_data JSONB DEFAULT '{}'::jsonb NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_awas_officer ON public.inspections_awas (officer_id);
CREATE INDEX IF NOT EXISTS idx_awas_block ON public.inspections_awas (block);
CREATE INDEX IF NOT EXISTS idx_awas_panchayat ON public.inspections_awas (panchayat);
CREATE INDEX IF NOT EXISTS idx_awas_month ON public.inspections_awas (month);

-- 5. STORAGE BUCKET CONFIGURATION (for inspection photos)
INSERT INTO storage.buckets (id, name, public)
VALUES ('inspection-photos', 'inspection-photos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage policies for inspection-photos
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'Public Inspection Photos Select'
    ) THEN
        CREATE POLICY "Public Inspection Photos Select" ON storage.objects FOR SELECT USING (bucket_id = 'inspection-photos');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'Public Inspection Photos Insert'
    ) THEN
        CREATE POLICY "Public Inspection Photos Insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'inspection-photos');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'Public Inspection Photos Update'
    ) THEN
        CREATE POLICY "Public Inspection Photos Update" ON storage.objects FOR UPDATE USING (bucket_id = 'inspection-photos');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'Public Inspection Photos Delete'
    ) THEN
        CREATE POLICY "Public Inspection Photos Delete" ON storage.objects FOR DELETE USING (bucket_id = 'inspection-photos');
    END IF;
END $$;

-- 6. ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.nodal_officers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.masters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspections_anganwadi ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspections_school ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspections_hostel ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspections_pds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspections_chaupal ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspections_health ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspections_awas ENABLE ROW LEVEL SECURITY;

-- 7. OPEN ACCESS POLICIES FOR SECURE CLIENT-SIDE / SERVERLESS ACCESS
DO $$
BEGIN
    -- nodal_officers
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'nodal_officers' AND policyname = 'Allow select nodal_officers') THEN
        CREATE POLICY "Allow select nodal_officers" ON public.nodal_officers FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'nodal_officers' AND policyname = 'Allow mutate nodal_officers') THEN
        CREATE POLICY "Allow mutate nodal_officers" ON public.nodal_officers FOR ALL USING (true);
    END IF;

    -- masters
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'masters' AND policyname = 'Allow select masters') THEN
        CREATE POLICY "Allow select masters" ON public.masters FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'masters' AND policyname = 'Allow mutate masters') THEN
        CREATE POLICY "Allow mutate masters" ON public.masters FOR ALL USING (true);
    END IF;

    -- inspections
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'inspections_anganwadi' AND policyname = 'Allow all anganwadi') THEN
        CREATE POLICY "Allow all anganwadi" ON public.inspections_anganwadi FOR ALL USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'inspections_school' AND policyname = 'Allow all school') THEN
        CREATE POLICY "Allow all school" ON public.inspections_school FOR ALL USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'inspections_hostel' AND policyname = 'Allow all hostel') THEN
        CREATE POLICY "Allow all hostel" ON public.inspections_hostel FOR ALL USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'inspections_pds' AND policyname = 'Allow all pds') THEN
        CREATE POLICY "Allow all pds" ON public.inspections_pds FOR ALL USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'inspections_chaupal' AND policyname = 'Allow all chaupal') THEN
        CREATE POLICY "Allow all chaupal" ON public.inspections_chaupal FOR ALL USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'inspections_health' AND policyname = 'Allow all health') THEN
        CREATE POLICY "Allow all health" ON public.inspections_health FOR ALL USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'inspections_awas' AND policyname = 'Allow all awas') THEN
        CREATE POLICY "Allow all awas" ON public.inspections_awas FOR ALL USING (true);
    END IF;
END $$;

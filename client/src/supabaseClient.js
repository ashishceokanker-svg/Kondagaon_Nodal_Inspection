import { createClient } from '@supabase/supabase-js';

// Read from Vite environment variables or localStorage override
const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const storedUrl = typeof window !== 'undefined' ? (localStorage.getItem('custom_supabase_url') || '') : '';
const storedKey = typeof window !== 'undefined' ? (localStorage.getItem('custom_supabase_key') || '') : '';

export const SUPABASE_URL = storedUrl.trim() || envUrl.trim();
export const SUPABASE_ANON_KEY = storedKey.trim() || envKey.trim();

export const isSupabaseConfigured = () => {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY && !SUPABASE_URL.includes('your-project'));
};

export const supabase = isSupabaseConfigured()
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

import { createClient } from '@supabase/supabase-js';

// Default Supabase project credentials for Kondagaon Nodal Inspection
const DEFAULT_URL = 'https://rovjavynllqsftslgeup.supabase.co';
const DEFAULT_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvdmphdnlubGxxc2Z0c2xnZXVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3MTYyNDUsImV4cCI6MjEwNDI5MjI0NX0.4xjJTT6GUygb6iYvhEgp6HOQaXoq2WjqDePrwnQiZbY';

// Read from Vite environment variables or localStorage override or default
const envUrl = import.meta.env?.VITE_SUPABASE_URL || '';
const envKey = import.meta.env?.VITE_SUPABASE_ANON_KEY || '';

const storedUrl = typeof window !== 'undefined' ? (localStorage.getItem('custom_supabase_url') || '') : '';
const storedKey = typeof window !== 'undefined' ? (localStorage.getItem('custom_supabase_key') || '') : '';

export const SUPABASE_URL = (storedUrl.trim() || envUrl.trim() || DEFAULT_URL).trim();
export const SUPABASE_ANON_KEY = (storedKey.trim() || envKey.trim() || DEFAULT_ANON_KEY).trim();

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

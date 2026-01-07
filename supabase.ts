
import { createClient } from '@supabase/supabase-js';

/**
 * Standard Vite environment variable access.
 * These are replaced at build time by Vite.
 * Cast to any to bypass TypeScript's missing ImportMeta.env definition.
 */
const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://grqkgljfhnvrsrwalozh.supabase.co';
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdycWtnbGpmaG52cnNyd2Fsb3poIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2Mzg5MTIsImV4cCI6MjA4MzIxNDkxMn0.0_dyPBVXglvU9fFJeTgmIcG5Jhk6NmNA3w01kk1LHDU';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    })
  : null;


import { createClient } from '@supabase/supabase-js';

// Configuration from provided details
const supabaseUrl = 'https://grqkgljfhnvrsrwalozh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdycWtnbGpmaG52cnNyd2Fsb3poIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2Mzg5MTIsImV4cCI6MjA4MzIxNDkxMn0.0_dyPBVXglvU9fFJeTgmIcG5Jhk6NmNA3w01kk1LHDU';

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

import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? "";
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? "";
export const supabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY);

// Keep the client importable so public routes can render a useful configuration error
// instead of failing during module evaluation when preview env vars are unavailable.
const clientUrl = SUPABASE_URL || "https://placeholder.supabase.co";
const clientKey = SUPABASE_PUBLISHABLE_KEY || "preview-not-configured";

export const supabase = createClient<Database>(
  clientUrl,
  clientKey,
  {
    auth: {
      storage: typeof window !== 'undefined' ? localStorage : undefined,
      persistSession: true,
      autoRefreshToken: true,
    },
  }
);

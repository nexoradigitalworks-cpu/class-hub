import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../types/database';

/**
 * Supabase Client Configuration
 * Uses Vite client environment variables (VITE_*)
 * ONLY uses the public/anon publishable key — NEVER service_role.
 */

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseAnonKey = (
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY
)?.trim();

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl.startsWith('http') && 
  supabaseAnonKey.length > 10
);

/**
 * Singleton Supabase Client instance.
 * If credentials are not yet supplied in the environment,
 * supabase is initialized only when isSupabaseConfigured is true.
 */
export const supabase: SupabaseClient<Database> | null = isSupabaseConfigured
  ? createClient<Database>(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'classhub_supabase_auth_token'
      }
    })
  : null;

/**
 * Safe accessor for the Supabase client
 * Throws a descriptive error if called before configuration
 */
export function getSupabase(): SupabaseClient<Database> {
  if (!supabase) {
    throw new Error(
      'Supabase client non configurato. Configura VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY.'
    );
  }
  return supabase;
}

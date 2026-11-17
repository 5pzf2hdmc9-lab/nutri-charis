import { createClient } from '@supabase/supabase-js';

/**
 * Only public anon / publishable key may appear in the browser bundle.
 * NEVER put SUPABASE_SERVICE_ROLE_KEY (or any secret) in REACT_APP_* / NEXT_PUBLIC_*.
 */
const supabaseUrl = (process.env.REACT_APP_SUPABASE_URL || '').trim();
const supabaseAnonKey = (process.env.REACT_APP_SUPABASE_ANON_KEY || '').trim();

if (!supabaseUrl || !supabaseAnonKey) {
  // Fail closed in production builds; keep a clear console signal in development.
  // eslint-disable-next-line no-console
  console.error(
    '[NutriCharis] Missing REACT_APP_SUPABASE_URL or REACT_APP_SUPABASE_ANON_KEY. Refusing to init with hardcoded secrets.'
  );
}

export const supabase = createClient(
  supabaseUrl || 'https://invalid.supabase.co',
  supabaseAnonKey || 'missing-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce'
    }
  }
);

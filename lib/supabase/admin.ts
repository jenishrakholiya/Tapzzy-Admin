import { createClient, SupabaseClient } from '@supabase/supabase-js';

let adminInstance: SupabaseClient | undefined;

export function createAdminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const rawServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

  const hasValidServiceKey = Boolean(
    rawServiceKey &&
    rawServiceKey.startsWith('eyJ') &&
    !rawServiceKey.startsWith('[SENSITIVE')
  );

  const keyToUse = hasValidServiceKey ? rawServiceKey! : anonKey;

  return createClient(url, keyToUse, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}


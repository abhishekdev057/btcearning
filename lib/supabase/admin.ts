import { createClient } from '@supabase/supabase-js'

/**
 * Service-role client for trusted server-to-server callers only (e.g. the
 * OfferwallApi postback route). Bypasses RLS — never expose to the browser
 * and never use for anything driven by an end-user request.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    throw new Error('Missing Supabase admin credentials (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)')
  }

  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

function normalizeBaseUrl(url: string) {
  return url.replace(/\/+$/, '')
}

/**
 * Portal API base.
 *
 * Deliberately relative: requests go to this app's own origin and are proxied
 * to the upstream API by the edge function in `api/[...path].ts` (and by the
 * Vite dev proxy in development). The upstream origin is therefore a
 * server-side secret and never ships in the client bundle.
 */
export function getPortalApiBaseUrl() {
  return '/api/portal/'
}

export function getSupabaseProjectUrl() {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined

  if (!supabaseUrl) {
    throw new Error('Missing VITE_SUPABASE_URL environment variable')
  }

  return normalizeBaseUrl(supabaseUrl)
}

export function getSupabaseAnonKey() {
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as
    | string
    | undefined

  if (!supabaseAnonKey) {
    throw new Error('Missing VITE_SUPABASE_ANON_KEY environment variable')
  }

  return supabaseAnonKey
}

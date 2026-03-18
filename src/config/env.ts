function normalizeBaseUrl(url: string) {
  return url.replace(/\/+$/, '')
}

export function getPortalApiBaseUrl() {
  const viteBaseUrl = import.meta.env.VITE_BASE_URL as string | undefined

  if (!viteBaseUrl) {
    throw new Error('Missing VITE_BASE_URL environment variable')
  }

  return `${normalizeBaseUrl(viteBaseUrl)}/portal/`
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

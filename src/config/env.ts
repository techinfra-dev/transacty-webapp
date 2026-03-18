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

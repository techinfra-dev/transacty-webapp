/**
 * URL safety helpers.
 *
 * Any URL that reaches `window.open`, `location.assign` or an `href` can come
 * from an API response, so it is attacker-controlled the moment the upstream is
 * compromised or a field is reflected. These helpers keep two rules:
 *
 *  - scheme must be https (blocks `javascript:`, `data:`, and http downgrades)
 *  - host must match an allowlist entry exactly, or be a true subdomain of one
 *
 * Exact/suffix matching is deliberate: a naive `endsWith` check lets
 * `app.tekkoglobal.com.evil.example` through.
 */

/** Hosts the portal is allowed to navigate to or open in a new tab. */
export const ALLOWED_EXTERNAL_HOSTS = [
  'transacty.ai',
  'docs.transacty.ai',
] as const

function parseUrl(raw: string): URL | null {
  const trimmed = raw?.trim()
  if (!trimmed) return null
  try {
    return new URL(trimmed)
  } catch {
    return null
  }
}

/** True when `host` is exactly `allowed` or a subdomain of it. */
export function isHostAllowed(host: string, allowedHosts: readonly string[]) {
  const normalized = host.toLowerCase()
  return allowedHosts.some((allowed) => {
    const base = allowed.toLowerCase()
    return normalized === base || normalized.endsWith(`.${base}`)
  })
}

/**
 * Returns the URL only when it is an https URL on an allowed host.
 * Returns null for anything else, including relative URLs.
 */
export function getSafeExternalUrl(
  raw: string | null | undefined,
  allowedHosts: readonly string[] = ALLOWED_EXTERNAL_HOSTS,
): string | null {
  if (!raw) return null
  const url = parseUrl(raw)
  if (!url) return null
  if (url.protocol !== 'https:') return null
  if (!isHostAllowed(url.hostname, allowedHosts)) return null
  return url.toString()
}

/**
 * Scheme-only check, for URLs whose host cannot be known ahead of time
 * (e.g. a third-party payment provider checkout returned by the API).
 *
 * This blocks `javascript:`, `data:` and http downgrades, which is what stops
 * script execution. It does NOT constrain the destination host — prefer
 * `getSafeExternalUrl` with an allowlist wherever the hosts are known.
 */
export function getSafeHttpsUrl(raw: string | null | undefined): string | null {
  if (!raw) return null
  const url = parseUrl(raw)
  if (!url) return null
  if (url.protocol !== 'https:') return null
  return url.toString()
}

/**
 * Returns a safe in-app destination. Absolute URLs must pass the allowlist;
 * relative paths must be a single-slash path so `//evil.example` cannot be
 * used as a protocol-relative escape. Falls back to `fallback` otherwise.
 */
export function getSafeRedirectPath(
  raw: string | null | undefined,
  fallback = '/dashboard',
): string {
  const trimmed = raw?.trim()
  if (!trimmed) return fallback
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) return trimmed
  return getSafeExternalUrl(trimmed) ? trimmed : fallback
}

/** Opens an external URL in a new tab only when it passes the allowlist. */
export function openSafeExternalUrl(
  raw: string | null | undefined,
  allowedHosts: readonly string[] = ALLOWED_EXTERNAL_HOSTS,
): boolean {
  const safe = getSafeExternalUrl(raw, allowedHosts)
  if (!safe) return false
  window.open(safe, '_blank', 'noopener,noreferrer')
  return true
}

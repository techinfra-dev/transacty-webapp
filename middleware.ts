import { next } from '@vercel/edge'

export const config = {
  // Everything except Vercel internals. Static assets are included so the
  // headers apply to fonts and JS as well as HTML.
  matcher: ['/((?!_vercel/).*)'],
}

/**
 * Supabase Storage is called directly by the browser for KYC document uploads
 * (see src/features/kyc/services/kycService.ts), so it must be in connect-src.
 * Portal API calls go to VITE_BASE_URL (see getPortalApiBaseUrl).
 */
const SUPABASE_ORIGIN = process.env.SUPABASE_ORIGIN ?? ''

function originFromEnvUrl(raw: string | undefined) {
  if (!raw?.trim()) {
    return ''
  }
  try {
    return new URL(raw).origin
  } catch {
    return ''
  }
}

function buildCsp(): string {
  const apiOrigin = originFromEnvUrl(
    process.env.API_UPSTREAM_ORIGIN ?? process.env.VITE_BASE_URL,
  )
  const connectSrc = ["'self'", SUPABASE_ORIGIN, apiOrigin]
    .filter(Boolean)
    .join(' ')

  return [
    "default-src 'self'",
    // No inline scripts: the theme bootstrap lives in /theme-init.js.
    "script-src 'self'",
    // React and Tailwind set styles via CSSOM and style attributes; dropping
    // 'unsafe-inline' here breaks rendering and buys little, since inline
    // styles cannot execute script.
    "style-src 'self' 'unsafe-inline'",
    // Fonts are self-hosted under /fonts.
    "font-src 'self'",
    "img-src 'self' data: blob: https://assets.coingecko.com https://flagcdn.com",
    `connect-src ${connectSrc}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "frame-src 'none'",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    'upgrade-insecure-requests',
    'report-uri /api/csp-report',
    'report-to csp-endpoint',
  ].join('; ')
}

const PERMISSIONS_POLICY = [
  'geolocation=()',
  'microphone=()',
  'camera=()',
  'payment=()',
  'usb=()',
  'magnetometer=()',
  'gyroscope=()',
  'accelerometer=()',
  'interest-cohort=()',
].join(', ')

export default function middleware() {
  const response = next()
  const headers = response.headers

  headers.set('Content-Security-Policy', buildCsp())
  headers.set(
    'Reporting-Endpoints',
    'csp-endpoint="/api/csp-report"',
  )
  headers.set(
    'Strict-Transport-Security',
    'max-age=63072000; includeSubDomains; preload',
  )
  headers.set('X-Frame-Options', 'DENY')
  headers.set('X-Content-Type-Options', 'nosniff')
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  headers.set('Permissions-Policy', PERMISSIONS_POLICY)
  headers.set('Cross-Origin-Opener-Policy', 'same-origin')
  headers.set('Cross-Origin-Resource-Policy', 'same-origin')
  headers.set('X-DNS-Prefetch-Control', 'off')

  return response
}

export const config = { runtime: 'edge' }

/**
 * Same-origin proxy for the portal API.
 *
 * The browser only ever talks to this app's own origin, so:
 *  - the upstream API origin is never published to the client
 *  - `connect-src 'self'` in the CSP is meaningful rather than decorative
 *  - cookies are first-party
 *
 * `API_UPSTREAM_ORIGIN` is a server-side env var (NOT prefixed `VITE_`, which
 * would inline it into the bundle).
 */

/** Response headers that leak upstream identity or relax our own policy. */
const STRIPPED_RESPONSE_HEADERS = [
  'access-control-allow-origin',
  'access-control-allow-credentials',
  'access-control-allow-headers',
  'access-control-allow-methods',
  'access-control-expose-headers',
  // Upstream CSP names the upstream's own hosts; ours is set in middleware.
  'content-security-policy',
  'content-security-policy-report-only',
  // Host/infra fingerprints.
  'rndr-id',
  'x-powered-by',
  'server',
  'x-render-origin-server',
  // Hop-by-hop.
  'connection',
  'keep-alive',
  'transfer-encoding',
  'upgrade',
]

/** Request headers that must not be forwarded upstream. */
const STRIPPED_REQUEST_HEADERS = [
  'host',
  'origin',
  'referer',
  'connection',
  'keep-alive',
  'transfer-encoding',
  'upgrade',
  'x-forwarded-host',
]

function getUpstreamOrigin(): string {
  const raw = process.env.API_UPSTREAM_ORIGIN
  if (!raw) {
    throw new Error('Missing API_UPSTREAM_ORIGIN environment variable')
  }
  return raw.replace(/\/+$/, '')
}

export default async function handler(request: Request): Promise<Response> {
  let upstreamOrigin: string
  try {
    upstreamOrigin = getUpstreamOrigin()
  } catch {
    return new Response(
      JSON.stringify({ message: 'API proxy is not configured.' }),
      { status: 500, headers: { 'content-type': 'application/json' } },
    )
  }

  const incoming = new URL(request.url)
  // `/api/portal/foo?x=1` -> `<upstream>/portal/foo?x=1`
  const forwardedPath = incoming.pathname.replace(/^\/api\/?/, '')
  const target = new URL(`${upstreamOrigin}/${forwardedPath}`)
  target.search = incoming.search

  const headers = new Headers(request.headers)
  for (const name of STRIPPED_REQUEST_HEADERS) headers.delete(name)

  // Stream the body through untouched so multipart uploads are not buffered.
  const hasBody = request.method !== 'GET' && request.method !== 'HEAD'

  let upstreamResponse: Response
  try {
    upstreamResponse = await fetch(target, {
      method: request.method,
      headers,
      body: hasBody ? request.body : undefined,
      redirect: 'manual',
      // Required by undici/edge when streaming a request body.
      ...(hasBody ? { duplex: 'half' } : {}),
    } as RequestInit)
  } catch {
    return new Response(
      JSON.stringify({ message: 'Upstream API is unreachable.' }),
      { status: 502, headers: { 'content-type': 'application/json' } },
    )
  }

  const responseHeaders = new Headers(upstreamResponse.headers)
  for (const name of STRIPPED_RESPONSE_HEADERS) responseHeaders.delete(name)

  // Bind cookies to this host: an upstream `Domain=` would scope them to the
  // API domain and the browser would drop them for this origin.
  const setCookie = upstreamResponse.headers.getSetCookie?.() ?? []
  if (setCookie.length > 0) {
    responseHeaders.delete('set-cookie')
    for (const cookie of setCookie) {
      responseHeaders.append(
        'set-cookie',
        cookie.replace(/;\s*Domain=[^;]*/gi, ''),
      )
    }
  }

  return new Response(upstreamResponse.body, {
    status: upstreamResponse.status,
    statusText: upstreamResponse.statusText,
    headers: responseHeaders,
  })
}

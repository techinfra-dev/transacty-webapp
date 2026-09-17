export const config = { runtime: 'edge' }

/**
 * CSP violation sink. Log-only: it never trusts or reflects the report body.
 * POST-only, with a small body cap so it cannot be used as a log-flood vector.
 */
const MAX_BODY_BYTES = 4 * 1024

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response(null, { status: 405, headers: { allow: 'POST' } })
  }

  try {
    const body = await request.text()
    if (body.length <= MAX_BODY_BYTES) {
      console.warn('[csp-report]', body)
    } else {
      console.warn('[csp-report] oversized report discarded', body.length)
    }
  } catch {
    // Never fail the browser's report delivery.
  }

  return new Response(null, { status: 204 })
}

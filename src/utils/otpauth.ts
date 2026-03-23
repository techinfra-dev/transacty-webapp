/**
 * Parses otpauth://totp/... URLs (RFC-style) to extract TOTP secret and label parts.
 * Handles standard encoding; falls back to regex if URL parsing fails.
 */
export interface ParsedOtpauthTotp {
  secret: string | null
  issuerFromQuery: string | null
  /** Path label after /totp/, e.g. "Issuer:account@email.com" */
  label: string | null
}

function decodeSecretParam(raw: string): string {
  try {
    return decodeURIComponent(raw.replace(/\+/g, ' '))
  } catch {
    return raw
  }
}

function extractSecretRegex(otpauthUrl: string): string | null {
  const match = otpauthUrl.match(/[?&]secret=([^&]+)/i)
  if (!match) {
    return null
  }
  return decodeSecretParam(match[1])
}

export function parseOtpauthTotpUrl(otpauthUrl: string): ParsedOtpauthTotp {
  const fallbackSecret = extractSecretRegex(otpauthUrl)

  try {
    const url = new URL(otpauthUrl)
    if (url.protocol !== 'otpauth:') {
      return {
        secret: fallbackSecret,
        issuerFromQuery: null,
        label: null,
      }
    }

    const secretFromQuery = url.searchParams.get('secret')
    const secret = secretFromQuery ?? fallbackSecret
    const issuerFromQuery = url.searchParams.get('issuer')

    const pathMatch = url.pathname.match(/^\/totp\/(.+)$/i)
    let label: string | null = null
    if (pathMatch?.[1]) {
      try {
        label = decodeURIComponent(pathMatch[1])
      } catch {
        label = pathMatch[1]
      }
    }

    return {
      secret,
      issuerFromQuery,
      label,
    }
  } catch {
    return {
      secret: fallbackSecret,
      issuerFromQuery: null,
      label: null,
    }
  }
}

/** Groups base32 secret for readability (e.g. ABCD EFGH ...). */
export function formatSetupKeyForDisplay(secret: string, groupSize = 4): string {
  const cleaned = secret.replace(/\s/g, '').toUpperCase()
  if (!cleaned) {
    return ''
  }
  return cleaned.match(new RegExp(`.{1,${groupSize}}`, 'g'))?.join(' ') ?? cleaned
}

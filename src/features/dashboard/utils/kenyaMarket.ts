import type { PortalEnvironment } from '../../../types/portalEnvironment.ts'

/** Kenya KES (M-Pesa) runs live-only — the provider has no sandbox. */
export const KENYA_LIVE_ONLY_ENVIRONMENT: PortalEnvironment = 'live'

export const KENYA_LIVE_ONLY_COPY =
  'Kenya KES is live-only. Switch the portal environment to Live to collect or send KES.'

export const KENYA_MARKET_SUMMARY =
  'Collect and pay out KES over M-Pesa. Funds debit and credit your Kenya wallet.'

export const KENYA_PAYOUT_CURRENCY = 'KES'
export const KENYA_COLLECT_MIN_AMOUNT = 20
export const KENYA_COLLECT_MAX_AMOUNT = 145_000
export const KENYA_PAYOUT_MIN_AMOUNT = 20
export const KENYA_PAYOUT_MAX_AMOUNT = 250_000

export function isKenyaMarket(market: string | null | undefined) {
  return (market ?? '').trim().toLowerCase() === 'kenya'
}

export function isKenyaWallet(
  wallet:
    | {
        currency?: string | null
        market?: string | null
        region?: string | null
      }
    | null
    | undefined,
) {
  if (!wallet) {
    return false
  }
  const market = (wallet.market ?? wallet.region ?? '').trim().toLowerCase()
  return (
    isKenyaMarket(market) ||
    (wallet.currency ?? '').trim().toUpperCase() === KENYA_PAYOUT_CURRENCY
  )
}

/** Accept 2547…, +2547…, or 07…. Always send 254XXXXXXXXX. */
export function normalizeKenyaMsisdn(raw: string) {
  const digits = raw.replace(/\D/g, '')
  if (digits.startsWith('254') && digits.length >= 12) {
    return digits.slice(0, 12)
  }
  if (digits.startsWith('0') && digits.length >= 10) {
    return `254${digits.slice(1, 10)}`
  }
  if (digits.length === 9) {
    return `254${digits}`
  }
  return digits
}

export function isValidKenyaMsisdn(raw: string) {
  return /^254[17]\d{8}$/.test(normalizeKenyaMsisdn(raw))
}

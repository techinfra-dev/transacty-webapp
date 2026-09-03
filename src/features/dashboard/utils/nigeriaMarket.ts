import type { PortalEnvironment } from '../../../types/portalEnvironment.ts'

/** Nigeria NGN runs live-only — the provider has no sandbox, so test has no NGN pocket. */
export const NIGERIA_LIVE_ONLY_ENVIRONMENT: PortalEnvironment = 'live'

export const NIGERIA_LIVE_ONLY_COPY =
  'Nigeria NGN is live-only. Switch the portal environment to Live to collect or send NGN.'

export const NIGERIA_MARKET_SUMMARY =
  'Payers transfer any amount to your permanent NGN account. Credits land in your NGN wallet. Payouts send NGN to Nigerian bank accounts.'

export const NIGERIA_PAYOUT_CURRENCY = 'NGN'

/**
 * The VA provider prefixes the account holder with its own tag
 * (e.g. "provider-Daniel Adeola"). Merchants should only see the name.
 */
export function formatNgnAccountName(accountName: string | null | undefined) {
  return (accountName ?? '').replace(/^\s*provider\s*[-_]\s*/i, '').trim()
}

export function isNigeriaMarket(market: string | null | undefined) {
  return (market ?? '').trim().toLowerCase() === 'nigeria'
}

export function isNigeriaWallet(
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
    isNigeriaMarket(market) ||
    (wallet.currency ?? '').trim().toUpperCase() === NIGERIA_PAYOUT_CURRENCY
  )
}

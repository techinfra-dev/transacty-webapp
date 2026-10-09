import type { PortalEnvironment } from '../../../types/portalEnvironment.ts'

/** Canada CAD runs live-only — the provider has no sandbox. */
export const CANADA_LIVE_ONLY_ENVIRONMENT: PortalEnvironment = 'live'

export const CANADA_LIVE_ONLY_COPY =
  'Canada CAD is live-only. Switch the portal environment to Live to send CAD.'

export const CANADA_MARKET_SUMMARY =
  'Pay out CAD to Canadian bank accounts, Interac email, or billers. Funds debit from your CAD wallet.'

export const CANADA_PAYOUT_CURRENCY = 'CAD'

export function isCanadaMarket(market: string | null | undefined) {
  return (market ?? '').trim().toLowerCase() === 'canada'
}

export function isCanadaWallet(
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
    isCanadaMarket(market) ||
    (wallet.currency ?? '').trim().toUpperCase() === CANADA_PAYOUT_CURRENCY
  )
}

/** Temporary product pause — Bangladesh / BDT is offline. Flip to false to restore. */
export const BANGLADESH_RAIL_PAUSED = true

export const BANGLADESH_RAIL_PAUSE_COPY =
  'Bangladesh is temporarily unavailable.'

export function isBangladeshMarket(market: string | null | undefined) {
  return (market ?? '').trim().toLowerCase() === 'bangladesh'
}

export function isBangladeshCurrency(currency: string | null | undefined) {
  return (currency ?? '').trim().toUpperCase() === 'BDT'
}

export function isBangladeshWallet(
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
  return isBangladeshMarket(market) || isBangladeshCurrency(wallet.currency)
}

export function isBangladeshRailPausedForMarket(market: string | null | undefined) {
  return BANGLADESH_RAIL_PAUSED && isBangladeshMarket(market)
}

export function isBangladeshRailPausedForWallet(
  wallet:
    | {
        currency?: string | null
        market?: string | null
        region?: string | null
      }
    | null
    | undefined,
) {
  return BANGLADESH_RAIL_PAUSED && isBangladeshWallet(wallet)
}


/**
 * Local override only. Leave false so Bangladesh follows the balance/markets
 * payload (`blockers` with `provider_unavailable`). Flip to true to force a pause.
 */
export const BANGLADESH_RAIL_PAUSED = false

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

export function hasProviderUnavailableBlocker(
  blockers: { code?: string | null }[] | null | undefined,
) {
  return (blockers ?? []).some((blocker) => blocker.code === 'provider_unavailable')
}

export function isBangladeshRailPausedForWallet(
  wallet:
    | {
        currency?: string | null
        market?: string | null
        region?: string | null
        blockers?: { code?: string | null }[] | null
      }
    | null
    | undefined,
) {
  if (!isBangladeshWallet(wallet)) {
    return false
  }
  if (BANGLADESH_RAIL_PAUSED) {
    return true
  }
  return hasProviderUnavailableBlocker(wallet?.blockers)
}


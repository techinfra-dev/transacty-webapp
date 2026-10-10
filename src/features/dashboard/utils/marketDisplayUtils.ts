import type { PortalMarketRow } from '../services/marketSchemas.ts'
import { KNOWN_MERCHANT_MARKETS } from '../services/marketSchemas.ts'
import { isBangladeshRailPausedForMarket } from './bangladeshRailPause.ts'

export const MARKET_ORDER: readonly string[] = KNOWN_MERCHANT_MARKETS

export const MARKET_DISPLAY_NAMES: Record<string, string> = {
  bangladesh: 'Bangladesh',
  india: 'India',
  europe: 'Europe',
  brazil: 'Brazil',
  nigeria: 'Nigeria',
  canada: 'Canada',
  kenya: 'Kenya',
  pyusd: 'PYUSD',
}

/** Short codes for market avatars in the add-wallet browser. */
export const MARKET_AVATAR_CODES: Record<string, string> = {
  bangladesh: 'BD',
  india: 'IN',
  europe: 'EU',
  brazil: 'BR',
  nigeria: 'NG',
  canada: 'CA',
  kenya: 'KE',
  pyusd: 'PY',
}

/** Human-readable rail hints shown under currency badges. */
export const MARKET_RAIL_SUMMARIES: Record<string, string> = {
  bangladesh: 'Bank transfer · Local rails',
  india: 'UPI · Bank transfer',
  europe: 'SEPA · Instant',
  brazil: 'Pix',
  nigeria: 'Virtual account · Bank payout',
  canada: 'Bank / Interac / bill payout',
  kenya: 'M-Pesa collect · M-Pesa payout',
  pyusd: 'Stablecoin settlement · PYUSD → PYUSD USDC',
}

/**
 * Markets whose provider has no sandbox. Approved access still shows up as an
 * inactive pocket in the test catalog — that means "switch to live", not
 * "not approved".
 */
export const LIVE_ONLY_MARKETS = new Set<string>(['nigeria', 'canada', 'kenya'])

export function normalizeMarketKey(market: string | null | undefined) {
  return (market ?? '').trim().toLowerCase()
}

/** Title-case unknown API keys (`kenya` → `Kenya`) without a frontend enum. */
export function humanizeMarketKey(market: string) {
  return market
    .trim()
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ')
}

/** Known markets first, then any new API keys alphabetically. */
export function uniqueInPreferredOrder(keys: Iterable<string>) {
  const seen = new Set<string>()
  const result: string[] = []
  const normalized = [...keys]
    .map((key) => normalizeMarketKey(key))
    .filter((key) => key.length > 0 && key !== 'other')

  for (const preferred of MARKET_ORDER) {
    if (normalized.includes(preferred) && !seen.has(preferred)) {
      seen.add(preferred)
      result.push(preferred)
    }
  }

  for (const key of normalized.sort()) {
    if (!seen.has(key)) {
      seen.add(key)
      result.push(key)
    }
  }

  return result
}

export const LIVE_ONLY_MARKET_COPY =
  'Approved — switch the portal to Live to use this market.'

export function isLiveOnlyMarket(market: string | null | undefined) {
  return LIVE_ONLY_MARKETS.has(normalizeMarketKey(market))
}

export type MarketBrowserFilter = 'all' | 'enabled' | 'available' | 'unavailable'

export function getMarketAvatarCode(market: string) {
  const key = normalizeMarketKey(market)
  return MARKET_AVATAR_CODES[key] ?? key.slice(0, 2).toUpperCase()
}

export function getMarketRailSummary(market: string) {
  const key = normalizeMarketKey(market)
  return MARKET_RAIL_SUMMARIES[key] ?? 'Local settlement rails'
}

export function getMarketBrowserFilter(
  market: PortalMarketRow,
): Exclude<MarketBrowserFilter, 'all'> {
  // Only truly offline / suspended markets — not merely "not enabled yet".
  if (
    market.entitlementStatus === 'suspended' ||
    isMarketTemporarilyDown(market)
  ) {
    return 'unavailable'
  }
  if (market.entitlementStatus === 'approved') {
    return 'enabled'
  }
  return 'available'
}

export function getMarketDisplayName(
  market: string,
  displayName?: string | null,
) {
  if (displayName && displayName.trim().length > 0) {
    return displayName.trim()
  }
  const key = normalizeMarketKey(market)
  return MARKET_DISPLAY_NAMES[key] ?? (humanizeMarketKey(market) || market)
}

export function formatEntitlementStatusLabel(status: string) {
  const labels: Record<string, string> = {
    disabled: 'Not enabled',
    not_requested: 'Not requested',
    requested: 'Requested',
    kyb_in_review: 'Under review',
    approved: 'Active',
    rejected: 'Rejected',
    suspended: 'Suspended',
  }
  return labels[status] ?? humanizeMarketKey(status)
}

export function formatKybStatusLabel(status: string) {
  const labels: Record<string, string> = {
    not_started: 'KYB not started',
    pending: 'KYB pending',
    verified: 'KYB verified',
    rejected: 'KYB rejected',
  }
  return labels[status] ?? humanizeMarketKey(status)
}

export function canRequestMarketAccess(market: PortalMarketRow) {
  if (isMarketTemporarilyDown(market) || market.entitlementStatus === 'suspended') {
    return false
  }
  // Spec: request when not yet requested, disabled, or previously rejected.
  if (
    market.entitlementStatus === 'disabled' ||
    market.entitlementStatus === 'not_requested' ||
    market.entitlementStatus === 'rejected'
  ) {
    return true
  }
  if (typeof market.canRequest === 'boolean') {
    return market.canRequest
  }
  return false
}

export function formatMarketUnlockCopy(market: PortalMarketRow) {
  const messages = [
    ...(market.blockers ?? []).map((blocker) => blocker.message.trim()),
    market.unlockReason?.trim() ?? '',
  ].filter((message) => message.length > 0)

  return [...new Set(messages)].join(' · ') || null
}

/** Provider / rail is offline — not the same as “not enabled yet”. */
export function isMarketTemporarilyDown(market: PortalMarketRow) {
  if (isBangladeshRailPausedForMarket(market.market)) {
    return true
  }
  return (market.blockers ?? []).some(
    (blocker) => blocker.code === 'provider_unavailable',
  )
}

export function isMarketUnavailable(market: PortalMarketRow) {
  return (
    market.entitlementStatus === 'suspended' || isMarketTemporarilyDown(market)
  )
}

export function isMarketRequestPending(market: PortalMarketRow) {
  return (
    market.entitlementStatus === 'requested' ||
    market.entitlementStatus === 'kyb_in_review'
  )
}

export function marketNeedsKycAction(market: PortalMarketRow) {
  return (
    market.entitlementStatus === 'approved' &&
    market.kybStatus !== 'verified'
  ) || (
    market.entitlementStatus !== 'approved' &&
    market.entitlementStatus !== 'disabled' &&
    market.entitlementStatus !== 'suspended' &&
    market.kybStatus === 'not_started'
  )
}

export function sortMarkets<T extends { market: string }>(items: T[]) {
  const order = uniqueInPreferredOrder(items.map((item) => item.market))
  return [...items].sort(
    (a, b) =>
      order.indexOf(normalizeMarketKey(a.market)) -
      order.indexOf(normalizeMarketKey(b.market)),
  )
}

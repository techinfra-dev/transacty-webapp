import type {
  MarketEntitlementStatus,
  MarketKybStatus,
  MerchantMarket,
  PortalMarketRow,
} from '../services/marketSchemas.ts'
import { isBangladeshRailPausedForMarket } from './bangladeshRailPause.ts'

export const MARKET_ORDER: MerchantMarket[] = [
  'bangladesh',
  'india',
  'europe',
  'brazil',
  'pyusd',
]

export const MARKET_DISPLAY_NAMES: Record<MerchantMarket, string> = {
  bangladesh: 'Bangladesh',
  india: 'India',
  europe: 'Europe',
  brazil: 'Brazil',
  pyusd: 'PYUSD',
}

/** Short codes for market avatars in the add-wallet browser. */
export const MARKET_AVATAR_CODES: Record<MerchantMarket, string> = {
  bangladesh: 'BD',
  india: 'IN',
  europe: 'EU',
  brazil: 'BR',
  pyusd: 'PY',
}

/** Human-readable rail hints shown under currency badges. */
export const MARKET_RAIL_SUMMARIES: Record<MerchantMarket, string> = {
  bangladesh: 'Bank transfer · Local rails',
  india: 'UPI · Bank transfer',
  europe: 'SEPA · Instant',
  brazil: 'Pix',
  pyusd: 'Stablecoin settlement',
}

export type MarketBrowserFilter = 'all' | 'enabled' | 'available' | 'unavailable'

export function getMarketAvatarCode(market: string) {
  const key = market.trim().toLowerCase() as MerchantMarket
  return MARKET_AVATAR_CODES[key] ?? market.trim().slice(0, 2).toUpperCase()
}

export function getMarketRailSummary(market: string) {
  const key = market.trim().toLowerCase() as MerchantMarket
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
  const key = market.trim().toLowerCase() as MerchantMarket
  return MARKET_DISPLAY_NAMES[key] ?? market
}

export function formatEntitlementStatusLabel(status: MarketEntitlementStatus) {
  const labels: Record<MarketEntitlementStatus, string> = {
    disabled: 'Not enabled',
    requested: 'Requested',
    kyb_in_review: 'Under review',
    approved: 'Active',
    suspended: 'Suspended',
  }
  return labels[status]
}

export function formatKybStatusLabel(status: MarketKybStatus) {
  const labels: Record<MarketKybStatus, string> = {
    not_started: 'KYB not started',
    pending: 'KYB pending',
    verified: 'KYB verified',
    rejected: 'KYB rejected',
  }
  return labels[status]
}

export function canRequestMarketAccess(market: PortalMarketRow) {
  if (isMarketTemporarilyDown(market) || market.entitlementStatus === 'suspended') {
    return false
  }
  // Not-enabled markets stay requestable after global KYB is complete.
  if (market.entitlementStatus === 'disabled') {
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
  return [...items].sort(
    (a, b) =>
      MARKET_ORDER.indexOf(a.market as MerchantMarket) -
      MARKET_ORDER.indexOf(b.market as MerchantMarket),
  )
}

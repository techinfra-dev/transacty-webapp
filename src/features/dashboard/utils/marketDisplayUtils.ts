import type {
  MarketEntitlementStatus,
  MarketKybStatus,
  MerchantMarket,
  PortalMarketRow,
} from '../services/marketSchemas.ts'

export const MARKET_ORDER: MerchantMarket[] = ['bangladesh', 'india', 'europe']

export const MARKET_DISPLAY_NAMES: Record<MerchantMarket, string> = {
  bangladesh: 'Bangladesh',
  india: 'India',
  europe: 'Europe',
}

export function getMarketDisplayName(market: string) {
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
  return market.entitlementStatus === 'disabled'
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

import type { PortalEnvironment } from '../../../types/portalEnvironment.ts'

/** Currencies Nuvion can pay out today (own-currency, no FX). */
export const NUVION_PAYOUT_CURRENCIES = [
  'USD',
  'AED',
  'GHS',
  'TZS',
  'MXN',
  'KES',
] as const

export type NuvionPayoutCurrency = (typeof NUVION_PAYOUT_CURRENCIES)[number]

/**
 * Markets that unlock through Nuvion (not the normal Tekko/Tylt request path).
 * CAD/KES stay on their existing market flows even though Nuvion also covers
 * some of those rails.
 */
export const NUVION_WALLET_CURRENCIES = [
  'USD',
  'AED',
  'GHS',
  'TZS',
  'MXN',
  'AUD',
  'ZAR',
  'SGD',
  'PHP',
  'HKD',
  'UGX',
  'CNY',
] as const

const EXISTING_NON_NUVION_MARKETS = new Set([
  'bangladesh',
  'india',
  'europe',
  'brazil',
  'nigeria',
  'canada',
  'kenya',
  'pyusd',
])

const NUVION_MARKET_KEYS = new Set([
  'united_states',
  'united-states',
  'usa',
  'us',
  'uae',
  'united_arab_emirates',
  'united-arab-emirates',
  'ghana',
  'tanzania',
  'mexico',
  'australia',
  'south_africa',
  'south-africa',
  'singapore',
  'philippines',
  'hong_kong',
  'hong-kong',
  'uganda',
  'china',
])

export const NUVION_MINIMUM_PAYOUT_AMOUNT = 1
export const NUVION_MAXIMUM_PAYOUT_AMOUNT = 1_000_000

export const NUVION_ONBOARDING_COPY =
  'Register your business with Nuvion once per environment to send USD, AED, GHS, TZS, MXN, and KES bank payouts.'

export const NUVION_ENTITY_APPROVED_COPY =
  'Nuvion entity approved. You can send payouts in currencies your Nuvion account holds.'

export function isNuvionPayoutCurrency(
  currency: string | null | undefined,
): currency is NuvionPayoutCurrency {
  const code = (currency ?? '').trim().toUpperCase()
  return (NUVION_PAYOUT_CURRENCIES as readonly string[]).includes(code)
}

export function isNuvionWalletCurrency(currency: string | null | undefined) {
  const code = (currency ?? '').trim().toUpperCase()
  return (NUVION_WALLET_CURRENCIES as readonly string[]).includes(code)
}

/** True when this Add-wallet row should use the Nuvion entity → request flow. */
export function isNuvionMarketRow(market: {
  market: string
  settlementCurrencies?: string[] | null
}) {
  const key = (market.market ?? '').trim().toLowerCase()
  if (!key || EXISTING_NON_NUVION_MARKETS.has(key)) {
    return false
  }
  if (NUVION_MARKET_KEYS.has(key)) {
    return true
  }
  return (market.settlementCurrencies ?? []).some((currency) =>
    isNuvionWalletCurrency(currency),
  )
}

/** KES mobile-money stays on Tekko; Nuvion covers KES bank EFT only. */
export function defaultNuvionDestinationType(currency: string) {
  const code = currency.trim().toUpperCase()
  switch (code) {
    case 'USD':
      return 'usd_bank' as const
    case 'AED':
      return 'aed_bank' as const
    case 'GHS':
      return 'ghs_bank' as const
    case 'TZS':
      return 'tzs_bank' as const
    case 'MXN':
      return 'mxn_bank' as const
    case 'KES':
      return 'kes_bank' as const
    default:
      return null
  }
}

export function formatNuvionEntityStatus(status: string | null | undefined) {
  const key = (status ?? '').trim().toLowerCase()
  if (key === 'approved') return 'Approved'
  if (key === 'incomplete' || key === 'pending') return 'Under review'
  if (key === 'failed') return 'Failed'
  if (key === 'blocked') return 'Blocked'
  if (!key) return 'Not started'
  return key.charAt(0).toUpperCase() + key.slice(1)
}

export function isNuvionEntityApproved(status: string | null | undefined) {
  return (status ?? '').trim().toLowerCase() === 'approved'
}

export function isNuvionEntityPending(status: string | null | undefined) {
  const key = (status ?? '').trim().toLowerCase()
  return key === 'incomplete' || key === 'pending'
}

export function isNuvionEntityTerminalFailure(status: string | null | undefined) {
  const key = (status ?? '').trim().toLowerCase()
  return key === 'failed' || key === 'blocked'
}

export function nuvionEnvironmentLabel(environment: PortalEnvironment) {
  return environment === 'live' ? 'Live' : 'Test'
}

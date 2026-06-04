import type { BalanceResponse, BalanceWalletItem } from '../services/balanceSchemas.ts'
import type { MerchantMarket, PortalMarketRow } from '../services/marketSchemas.ts'
import { getCurrencyFullName } from '../../../utils/currencyNames.ts'
import { MARKET_ORDER } from './marketDisplayUtils.ts'

export function isSyntheticWalletId(id: string) {
  return id.startsWith('market:')
}

export function canUseWalletForTransactions(wallet: BalanceWalletItem) {
  return wallet.walletActivated === true && !isSyntheticWalletId(wallet.id)
}

export function findBalanceWalletItem(
  balance: BalanceResponse | undefined,
  walletId: string,
): BalanceWalletItem | undefined {
  return balance?.items.find((item) => item.id === walletId)
}

export function findBalanceWalletItemByCurrency(
  balance: BalanceResponse | undefined,
  currency: string,
): BalanceWalletItem | undefined {
  const code = currency.trim().toUpperCase()
  return balance?.items.find(
    (item) => item.currency.trim().toUpperCase() === code,
  )
}

export function getWalletDisplayLabel(
  wallet: Pick<
    BalanceWalletItem,
    'currency' | 'displayLabel' | 'regionLabel' | 'label'
  >,
) {
  if (wallet.displayLabel?.trim()) {
    return wallet.displayLabel.trim()
  }
  if (wallet.regionLabel?.trim()) {
    return wallet.regionLabel.trim()
  }
  if (wallet.label?.trim()) {
    return wallet.label.trim()
  }
  return getCurrencyFullName(wallet.currency)
}

export function getWalletUpdatedAt(wallet: BalanceWalletItem) {
  return wallet.lastUpdated || wallet.updatedAt || wallet.createdAt || ''
}

export function isWalletActivated(wallet: BalanceWalletItem) {
  return wallet.walletActivated === true
}

export function getActivatedWallets(
  balance: BalanceResponse | undefined,
): BalanceWalletItem[] {
  return (balance?.items ?? []).filter(isWalletActivated)
}

export function getCatalogWallets(
  balance: BalanceResponse | undefined,
): BalanceWalletItem[] {
  return balance?.items ?? []
}

export function groupWalletsByMarket(items: BalanceWalletItem[]) {
  const grouped = new Map<string, BalanceWalletItem[]>()
  for (const item of items) {
    const market = (item.market ?? item.region ?? 'other').trim().toLowerCase()
    const list = grouped.get(market) ?? []
    list.push(item)
    grouped.set(market, list)
  }
  return MARKET_ORDER.filter((market) => grouped.has(market)).map((market) => ({
    market,
    items: grouped.get(market) ?? [],
  }))
}

export function getWalletMarket(wallet: BalanceWalletItem): MerchantMarket | null {
  const raw = (wallet.market ?? wallet.region ?? '').trim().toLowerCase()
  if (raw === 'bangladesh' || raw === 'india' || raw === 'europe') {
    return raw
  }
  return null
}

export type MarketWalletAction =
  | 'request_access'
  | 'pending_review'
  | 'complete_kyc'
  | 'suspended'
  | 'provisioning'
  | 'none'

export function getMarketWalletAction(
  market: PortalMarketRow,
  catalogItems: BalanceWalletItem[],
): MarketWalletAction {
  if (market.entitlementStatus === 'suspended') {
    return 'suspended'
  }
  if (market.entitlementStatus === 'disabled') {
    return 'request_access'
  }
  if (
    market.entitlementStatus === 'requested' ||
    market.entitlementStatus === 'kyb_in_review'
  ) {
    return 'pending_review'
  }
  if (market.entitlementStatus === 'approved' && market.kybStatus !== 'verified') {
    return 'complete_kyc'
  }

  const marketItems = catalogItems.filter(
    (item) => getWalletMarket(item) === market.market,
  )
  const hasInactiveApproved = marketItems.some(
    (item) =>
      item.activationStatus === 'active' &&
      !item.walletActivated &&
      market.entitlementStatus === 'approved' &&
      market.kybStatus === 'verified',
  )
  if (hasInactiveApproved) {
    return 'provisioning'
  }

  return 'none'
}

export function getMarketsWithWalletActions(
  markets: PortalMarketRow[],
  catalog: BalanceWalletItem[],
) {
  return markets
    .map((market) => ({
      market,
      action: getMarketWalletAction(market, catalog),
    }))
    .filter(({ action }) => action !== 'none')
}

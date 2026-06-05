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

export type CatalogWalletAction =
  | 'request_access'
  | 'pending_review'
  | 'complete_kyc'
  | 'suspended'
  | 'provisioning'
  | 'none'

export type MarketWalletAction = CatalogWalletAction

function resolveMarketEntitlement(
  wallet: BalanceWalletItem,
  market: PortalMarketRow | undefined,
) {
  return market?.entitlementStatus ?? wallet.entitlementStatus ?? 'disabled'
}

function resolveMarketKyb(
  wallet: BalanceWalletItem,
  market: PortalMarketRow | undefined,
) {
  return market?.kybStatus ?? wallet.kybStatus ?? 'not_started'
}

export function getCatalogWalletAction(
  wallet: BalanceWalletItem,
  market: PortalMarketRow | undefined,
): CatalogWalletAction {
  if (isWalletActivated(wallet)) {
    return 'none'
  }

  const entitlement = resolveMarketEntitlement(wallet, market)
  const kyb = resolveMarketKyb(wallet, market)
  const activationStatus = wallet.activationStatus ?? 'not_enabled'

  if (entitlement === 'suspended' || activationStatus === 'suspended') {
    return 'suspended'
  }
  if (entitlement === 'disabled' || activationStatus === 'not_enabled') {
    return 'request_access'
  }
  if (entitlement === 'requested' || entitlement === 'kyb_in_review') {
    return 'pending_review'
  }
  if (entitlement === 'approved' && kyb !== 'verified') {
    return 'complete_kyc'
  }
  if (activationStatus === 'pending_kyb') {
    return 'complete_kyc'
  }
  if (
    entitlement === 'approved' &&
    kyb === 'verified' &&
    activationStatus === 'active'
  ) {
    return 'provisioning'
  }

  return 'none'
}

export function getInactiveCatalogWallets(catalog: BalanceWalletItem[]) {
  return catalog.filter((item) => !isWalletActivated(item))
}

export function getAddWalletCatalogRows(
  markets: PortalMarketRow[],
  catalog: BalanceWalletItem[],
) {
  const marketById = new Map(markets.map((row) => [row.market, row]))

  return getInactiveCatalogWallets(catalog)
    .map((wallet) => {
      const marketKey = getWalletMarket(wallet)
      const market = marketKey ? marketById.get(marketKey) : undefined
      return {
        wallet,
        market,
        action: getCatalogWalletAction(wallet, market),
      }
    })
    .filter((row) => row.action !== 'none')
}

export function getMarketWalletAction(
  market: PortalMarketRow,
  catalogItems: BalanceWalletItem[],
): CatalogWalletAction {
  const inactiveInMarket = catalogItems.filter(
    (item) =>
      getWalletMarket(item) === market.market && !isWalletActivated(item),
  )
  if (inactiveInMarket.length === 0) {
    return 'none'
  }

  const actions = inactiveInMarket.map((wallet) =>
    getCatalogWalletAction(wallet, market),
  )
  if (actions.every((action) => action === 'none')) {
    return 'none'
  }
  return actions.find((action) => action !== 'none') ?? 'none'
}

export function getMarketsWithWalletActions(
  markets: PortalMarketRow[],
  catalog: BalanceWalletItem[],
) {
  return getAddWalletCatalogRows(markets, catalog)
}

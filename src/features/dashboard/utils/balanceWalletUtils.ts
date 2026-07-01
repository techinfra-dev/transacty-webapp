import type { BalanceResponse, BalanceWalletItem } from '../services/balanceSchemas.ts'
import type { MerchantMarket, PortalMarketRow } from '../services/marketSchemas.ts'
import { getCurrencyFullName } from '../../../utils/currencyNames.ts'
import { MARKET_ORDER } from './marketDisplayUtils.ts'

/** INR settlement pockets are hidden from all merchant portal wallet UI. */
export const HIDDEN_WALLET_CURRENCIES = new Set(['INR'])

export const INDIA_PORTAL_SETTLEMENT_CURRENCY = 'USDT'

export function isVisibleWallet(
  wallet: Pick<BalanceWalletItem, 'currency'>,
) {
  const code = wallet.currency.trim().toUpperCase()
  return !HIDDEN_WALLET_CURRENCIES.has(code)
}

export function filterVisibleWallets(items: BalanceWalletItem[]) {
  return items.filter(isVisibleWallet)
}

export function getVisibleSettlementCurrencies(
  market: MerchantMarket | null | undefined,
  currencies: string[],
) {
  const visible = currencies
    .map((currency) => currency.trim().toUpperCase())
    .filter((currency) => !HIDDEN_WALLET_CURRENCIES.has(currency))

  if (market === 'india') {
    return visible.filter((currency) => currency === INDIA_PORTAL_SETTLEMENT_CURRENCY)
  }

  return visible
}

export function formatVisibleWalletCurrencies(wallets: BalanceWalletItem[]) {
  return filterVisibleWallets(wallets)
    .map((wallet) => wallet.currency.trim().toUpperCase())
    .join(', ')
}

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
  const item = balance?.items.find((wallet) => wallet.id === walletId)
  return item && isVisibleWallet(item) ? item : undefined
}

export function findBalanceWalletItemByCurrency(
  balance: BalanceResponse | undefined,
  currency: string,
): BalanceWalletItem | undefined {
  const code = currency.trim().toUpperCase()
  const item = balance?.items.find(
    (wallet) => wallet.currency.trim().toUpperCase() === code,
  )
  return item && isVisibleWallet(item) ? item : undefined
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
  return filterVisibleWallets(balance?.items ?? []).filter(isWalletActivated)
}

export function getCatalogWallets(
  balance: BalanceResponse | undefined,
): BalanceWalletItem[] {
  return filterVisibleWallets(balance?.items ?? [])
}

export function groupWalletsByMarket(items: BalanceWalletItem[]) {
  const grouped = new Map<string, BalanceWalletItem[]>()
  for (const item of filterVisibleWallets(items)) {
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
  if (
    raw === 'bangladesh' ||
    raw === 'india' ||
    raw === 'europe' ||
    raw === 'brazil'
  ) {
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
  return filterVisibleWallets(catalog).filter((item) => !isWalletActivated(item))
}

export type AddWalletCatalogGroup = {
  market: MerchantMarket | null
  marketRow: PortalMarketRow | undefined
  wallets: BalanceWalletItem[]
  action: CatalogWalletAction
}

export function getAddWalletCatalogGroups(
  markets: PortalMarketRow[],
  catalog: BalanceWalletItem[],
): AddWalletCatalogGroup[] {
  const marketById = new Map(markets.map((row) => [row.market, row]))
  const inactive = getInactiveCatalogWallets(catalog)
  const byMarket = new Map<MerchantMarket, BalanceWalletItem[]>()
  const withoutMarket: BalanceWalletItem[] = []

  for (const wallet of inactive) {
    const marketKey = getWalletMarket(wallet)
    if (!marketKey) {
      withoutMarket.push(wallet)
      continue
    }
    const list = byMarket.get(marketKey) ?? []
    list.push(wallet)
    byMarket.set(marketKey, list)
  }

  const groups: AddWalletCatalogGroup[] = []

  for (const marketKey of MARKET_ORDER) {
    const wallets = byMarket.get(marketKey)
    if (!wallets || wallets.length === 0) {
      continue
    }
    const marketRow = marketById.get(marketKey)
    const action = marketRow
      ? getMarketWalletAction(marketRow, catalog)
      : wallets
          .map((wallet) => getCatalogWalletAction(wallet, undefined))
          .find((value) => value !== 'none') ?? 'none'
    if (action === 'none') {
      continue
    }
    groups.push({
      market: marketKey,
      marketRow,
      wallets,
      action,
    })
  }

  for (const wallet of withoutMarket) {
    const action = getCatalogWalletAction(wallet, undefined)
    if (action === 'none') {
      continue
    }
    groups.push({
      market: null,
      marketRow: undefined,
      wallets: [wallet],
      action,
    })
  }

  return groups
}

export function getAddWalletCatalogRows(
  markets: PortalMarketRow[],
  catalog: BalanceWalletItem[],
) {
  return getAddWalletCatalogGroups(markets, catalog).flatMap((group) =>
    group.wallets.map((wallet) => ({
      wallet,
      market: group.marketRow,
      action: group.action,
    })),
  )
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

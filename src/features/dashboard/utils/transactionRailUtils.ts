import type { BalanceWalletItem } from '../services/balanceSchemas.ts'
import type { PortalMarketRow } from '../services/marketSchemas.ts'
import type {
  TransactionRailApi,
  TransactionRailFilter,
} from '../services/transactionsSchemas.ts'
import {
  getMarketDisplayName,
  uniqueInPreferredOrder,
} from './marketDisplayUtils.ts'
import {
  canUseWalletForTransactions,
  getWalletMarket,
  isVisibleWallet,
} from './balanceWalletUtils.ts'

/** Static labels for known rails — not the live filter list. */
export const transactionRailFilterOptions: {
  value: TransactionRailFilter
  label: string
}[] = [
  { value: 'all', label: 'All' },
  { value: 'bangladesh', label: 'Bangladesh' },
  { value: 'india', label: 'India' },
  { value: 'europe', label: 'Europe' },
  { value: 'brazil', label: 'Brazil' },
  { value: 'nigeria', label: 'Nigeria' },
  { value: 'canada', label: 'Canada' },
  { value: 'kenya', label: 'Kenya' },
  { value: 'pyusd', label: 'PYUSD' },
]

const STATIC_RAIL_LABELS = new Map(
  transactionRailFilterOptions.map((option) => [option.value, option.label]),
)

function railOptionLabel(rail: string) {
  return STATIC_RAIL_LABELS.get(rail) ?? getMarketDisplayName(rail)
}

/**
 * Markets the merchant can filter transactions by: approved entitlements
 * plus any activated wallet pockets (covers live-only / lagging market rows).
 */
export function getEnabledTransactionRails(params: {
  markets?: PortalMarketRow[] | null
  wallets?: BalanceWalletItem[] | null
}): string[] {
  const fromMarkets = (params.markets ?? [])
    .filter((row) => row.entitlementStatus === 'approved')
    .map((row) => row.market)

  const fromWallets = (params.wallets ?? [])
    .filter(
      (wallet) =>
        isVisibleWallet(wallet) && canUseWalletForTransactions(wallet),
    )
    .map((wallet) => getWalletMarket(wallet) ?? '')

  return uniqueInPreferredOrder([...fromMarkets, ...fromWallets])
}

export function getTransactionRailFilterOptions(enabledRails: string[] = []) {
  const rails = uniqueInPreferredOrder(enabledRails).filter(
    (rail) => rail.length > 0 && rail !== 'all',
  )

  return [
    { value: 'all' as const, label: 'All' },
    ...rails.map((value) => ({
      value,
      label: railOptionLabel(value),
    })),
  ]
}

export function transactionRailFilterToApiParam(
  rail: TransactionRailFilter | TransactionRailApi | undefined,
): TransactionRailApi | undefined {
  if (!rail || rail === 'all') {
    return undefined
  }
  return rail
}

const CURRENCY_TRANSACTION_RAIL: Record<string, TransactionRailApi> = {
  BDT: 'bangladesh',
  BRL: 'brazil',
  NGN: 'nigeria',
  CAD: 'canada',
  KES: 'kenya',
  INR: 'india',
  EUR: 'europe',
}

export function resolveWalletTransactionRail(
  wallet:
    | Pick<BalanceWalletItem, 'region' | 'currency' | 'market'>
    | null
    | undefined,
): TransactionRailApi | undefined {
  if (!wallet) {
    return undefined
  }

  const region = (wallet.region ?? wallet.market)?.trim().toLowerCase()
  if (region && region !== 'other') {
    return region
  }

  const currency = wallet.currency.trim().toUpperCase()
  if (CURRENCY_TRANSACTION_RAIL[currency]) {
    return CURRENCY_TRANSACTION_RAIL[currency]
  }
  if (currency === 'PYUSD' || currency === 'PYUSD-USDC' || currency.startsWith('PYUSD')) {
    return 'pyusd'
  }

  return undefined
}

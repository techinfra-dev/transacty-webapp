import type { BalanceWalletItem } from '../services/balanceSchemas.ts'
import type {
  TransactionRailApi,
  TransactionRailFilter,
} from '../services/transactionsSchemas.ts'
import {
  getMarketDisplayName,
  uniqueInPreferredOrder,
} from './marketDisplayUtils.ts'

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
  { value: 'pyusd', label: 'PYUSD' },
]

export function getTransactionRailFilterOptions(extraRails: string[] = []) {
  const seen = new Set(
    transactionRailFilterOptions.map((option) => option.value),
  )
  const extras = uniqueInPreferredOrder(extraRails).filter(
    (rail) => rail !== 'all' && !seen.has(rail),
  )

  return [
    ...transactionRailFilterOptions,
    ...extras.map((value) => ({
      value,
      label: getMarketDisplayName(value),
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

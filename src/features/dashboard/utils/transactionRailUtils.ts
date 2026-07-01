import type { BalanceWalletItem } from '../services/balanceSchemas.ts'
import type {
  TransactionRailApi,
  TransactionRailFilter,
} from '../services/transactionsSchemas.ts'

export const transactionRailFilterOptions: {
  value: TransactionRailFilter
  label: string
}[] = [
  { value: 'all', label: 'All' },
  { value: 'bangladesh', label: 'Bangladesh' },
  { value: 'india', label: 'India' },
  { value: 'europe', label: 'Europe' },
  { value: 'brazil', label: 'Brazil' },
]

export function transactionRailFilterToApiParam(
  rail: TransactionRailFilter | TransactionRailApi | undefined,
): TransactionRailApi | undefined {
  if (!rail || rail === 'all') {
    return undefined
  }
  return rail
}

export function resolveWalletTransactionRail(
  wallet: Pick<BalanceWalletItem, 'region' | 'currency'> | null | undefined,
): TransactionRailApi | undefined {
  if (!wallet) {
    return undefined
  }

  const region = wallet.region?.trim().toLowerCase()
  if (
    region === 'bangladesh' ||
    region === 'india' ||
    region === 'europe' ||
    region === 'brazil'
  ) {
    return region
  }

  const currency = wallet.currency.trim().toUpperCase()
  if (currency === 'BDT') {
    return 'bangladesh'
  }
  if (currency === 'BRL') {
    return 'brazil'
  }
  if (currency === 'INR') {
    return 'india'
  }
  if (currency === 'EUR') {
    return 'europe'
  }

  return undefined
}

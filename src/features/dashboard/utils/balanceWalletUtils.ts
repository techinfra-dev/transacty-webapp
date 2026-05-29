import type { BalanceResponse, BalanceWalletItem } from '../services/balanceSchemas.ts'
import { getCurrencyFullName } from '../../../utils/currencyNames.ts'

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
  return wallet.lastUpdated || wallet.updatedAt
}

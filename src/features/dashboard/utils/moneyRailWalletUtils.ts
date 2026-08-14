import type { BalanceWalletItem } from '../services/balanceSchemas.ts'
import type { MoneyRailOverviewItem } from '../services/moneyOverviewSchemas.ts'
import { resolveWalletTransactionRail } from './transactionRailUtils.ts'

/** Pick the money-overview rail that belongs to this merchant pocket. */
export function findRailForWallet(
  rails: MoneyRailOverviewItem[],
  wallet: Pick<BalanceWalletItem, 'market' | 'region' | 'currency'>,
): MoneyRailOverviewItem | undefined {
  const market =
    wallet.market && wallet.market !== 'other'
      ? wallet.market
      : resolveWalletTransactionRail(wallet)

  if (market) {
    const byMarket = rails.find((rail) => rail.market === market)
    if (byMarket) {
      return byMarket
    }
  }

  const currency = wallet.currency.trim().toUpperCase()
  return rails.find((rail) =>
    rail.settlementCurrencies.some(
      (code) => code.trim().toUpperCase() === currency,
    ),
  )
}

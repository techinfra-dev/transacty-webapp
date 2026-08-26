import { useMemo, useState } from 'react'
import { LoadingSpinner } from '../../../../components/ui/LoadingSpinner.tsx'
import { AddWalletDialog } from '../AddWalletDialog.tsx'
import { useBalanceQuery } from '../../hooks/useBalanceQuery.ts'
import { useMarketsQuery } from '../../hooks/useMarketsQuery.ts'
import { useMoneyOverviewQuery } from '../../hooks/usePortalDepthQueries.ts'
import type { BalanceWalletItem } from '../../services/balanceSchemas.ts'
import {
  getCatalogWallets,
  getWalletDisplayLabel,
} from '../../utils/balanceWalletUtils.ts'
import { findRailForWallet } from '../../utils/moneyRailWalletUtils.ts'
import { isBangladeshRailPausedForWallet } from '../../utils/bangladeshRailPause.ts'
import {
  canRequestMarketAccess,
  getMarketBrowserFilter,
} from '../../utils/marketDisplayUtils.ts'
import { resolveWalletTransactionRail } from '../../utils/transactionRailUtils.ts'
import { WalletBalancePanel } from './WalletBalancePanel.tsx'
import { WalletCurrencyTabs } from './WalletCurrencyTabs.tsx'
import { WalletRailStatusCard } from './WalletRailStatusCard.tsx'

type WalletOverviewCardProps = {
  wallets: BalanceWalletItem[]
  activeWalletId: string
  areBalancesHidden: boolean
  walletsLoading?: boolean
}

export function WalletOverviewCard({
  wallets,
  activeWalletId,
  areBalancesHidden,
  walletsLoading = false,
}: WalletOverviewCardProps) {
  const [isAddWalletOpen, setIsAddWalletOpen] = useState(false)
  const active = wallets.find((w) => w.id === activeWalletId)
  const moneyOverviewQuery = useMoneyOverviewQuery(Boolean(active))
  const marketsQuery = useMarketsQuery(true)
  const balanceQuery = useBalanceQuery(true)
  const walletRail = resolveWalletTransactionRail(active)
  const railForWallet =
    active && moneyOverviewQuery.data
      ? findRailForWallet(moneyOverviewQuery.data.rails, active)
      : undefined

  const markets = marketsQuery.data ?? []
  const catalog = getCatalogWallets(balanceQuery.data)

  const hasRequestableMarkets = useMemo(
    () =>
      markets.some(
        (market) =>
          getMarketBrowserFilter(market) === 'available' &&
          canRequestMarketAccess(market),
      ),
    [markets],
  )

  if (!active) {
    return null
  }

  const displayName = getWalletDisplayLabel(active)
  const paused = isBangladeshRailPausedForWallet(active)

  return (
    <>
      <section className="dashboard-card">
        <WalletCurrencyTabs
          wallets={wallets}
          activeWalletId={activeWalletId}
          areBalancesHidden={areBalancesHidden}
          showAddWallet={hasRequestableMarkets}
          onAddWallet={() => setIsAddWalletOpen(true)}
        />

        <div
          className="wallet-overview-body"
          role="tabpanel"
          aria-label={`${displayName} account overview`}
        >
          <div
            className={`wallet-overview-layout ${paused ? 'wallet-overview-layout--paused' : ''}`}
          >
            <WalletBalancePanel
              wallet={active}
              walletRail={walletRail}
              areBalancesHidden={areBalancesHidden}
              loading={walletsLoading}
            />

            {moneyOverviewQuery.isPending ? (
              <div className="wallet-rail-status wallet-rail-status--loading">
                <LoadingSpinner label="Loading market…" />
              </div>
            ) : railForWallet ? (
              <WalletRailStatusCard rail={railForWallet} paused={paused} />
            ) : (
              <article className="wallet-rail-status wallet-rail-status--empty">
                <h3 className="wallet-rail-status-title">{displayName}</h3>
                <p className="wallet-rail-status-sub">
                  Market activity will appear here once this pocket is linked to a
                  settlement rail.
                </p>
              </article>
            )}
          </div>
        </div>
      </section>

      <AddWalletDialog
        isOpen={isAddWalletOpen}
        onClose={() => setIsAddWalletOpen(false)}
        markets={markets}
        catalog={catalog}
      />
    </>
  )
}

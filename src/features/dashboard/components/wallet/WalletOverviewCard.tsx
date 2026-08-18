import { FormattedMoney } from '../../../../components/ui/FormattedMoney.tsx'
import { LoadingSpinner } from '../../../../components/ui/LoadingSpinner.tsx'
import { useMoneyOverviewQuery } from '../../hooks/usePortalDepthQueries.ts'
import type { BalanceWalletItem } from '../../services/balanceSchemas.ts'
import {
  getWalletDisplayLabel,
  getWalletUpdatedAt,
} from '../../utils/balanceWalletUtils.ts'
import { findRailForWallet } from '../../utils/moneyRailWalletUtils.ts'
import { isBangladeshRailPausedForWallet } from '../../utils/bangladeshRailPause.ts'
import { RailCard } from '../RailCard.tsx'
import { WalletCurrencyTabs } from './WalletCurrencyTabs.tsx'

type WalletOverviewCardProps = {
  wallets: BalanceWalletItem[]
  activeWalletId: string
  areBalancesHidden: boolean
  walletsLoading?: boolean
}

function formatWalletUpdated(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function WalletMetricTile({
  label,
  currency,
  amountStr,
  areBalancesHidden,
}: {
  label: string
  currency: string
  amountStr: string | undefined
  areBalancesHidden: boolean
}) {
  const n = Number(amountStr)
  const safe = Number.isFinite(n) ? n : 0
  return (
    <div className="wallet-metric-tile">
      <p className="wallet-metric-tile-label">{label}</p>
      <p className="wallet-metric-tile-value">
        <FormattedMoney
          currency={currency}
          value={safe}
          masked={areBalancesHidden}
        />
      </p>
    </div>
  )
}

export function WalletOverviewCard({
  wallets,
  activeWalletId,
  areBalancesHidden,
  walletsLoading = false,
}: WalletOverviewCardProps) {
  const active = wallets.find((w) => w.id === activeWalletId)
  const moneyOverviewQuery = useMoneyOverviewQuery(Boolean(active))
  const railForWallet =
    active && moneyOverviewQuery.data
      ? findRailForWallet(moneyOverviewQuery.data.rails, active)
      : undefined

  if (!active) {
    return null
  }

  const displayName = getWalletDisplayLabel(active)

  return (
    <section className="dashboard-card">
      <WalletCurrencyTabs
        wallets={wallets}
        activeWalletId={activeWalletId}
        areBalancesHidden={areBalancesHidden}
      />

      <div
        className="dashboard-card-head border-b-0! pt-3!"
        role="tabpanel"
        aria-label={`${displayName} account overview`}
      >
        <div>
          <h2 className="dashboard-section-title text-sm">Account overview</h2>
          <p className="dashboard-caption">
            {displayName} · updated {formatWalletUpdated(getWalletUpdatedAt(active))}
          </p>
        </div>
      </div>

      <div className="wallet-overview-body">
        {walletsLoading ? (
          <div className="flex min-h-[120px] items-center justify-center">
            <LoadingSpinner label="Loading wallet balances…" />
          </div>
        ) : (
          <div
            className={`wallet-overview-row ${isBangladeshRailPausedForWallet(active) ? 'wallet-overview-row--paused' : ''}`}
          >
            <div className="wallet-metrics-grid">
              <WalletMetricTile
                label="Balance"
                currency={active.currency}
                amountStr={active.balance}
                areBalancesHidden={areBalancesHidden}
              />
              <WalletMetricTile
                label="Available balance"
                currency={active.currency}
                amountStr={active.availableBalance}
                areBalancesHidden={areBalancesHidden}
              />
              <WalletMetricTile
                label="Pending balance"
                currency={active.currency}
                amountStr={active.pendingBalance}
                areBalancesHidden={areBalancesHidden}
              />
            </div>

            {moneyOverviewQuery.isPending ? (
              <div className="wallet-rail-slot flex min-h-[72px] items-center">
                <LoadingSpinner label="Loading rail…" />
              </div>
            ) : railForWallet ? (
              <div className="wallet-rail-slot">
                <RailCard
                  rail={railForWallet}
                  paused={isBangladeshRailPausedForWallet(active)}
                />
              </div>
            ) : null}
          </div>
        )}
      </div>
    </section>
  )
}

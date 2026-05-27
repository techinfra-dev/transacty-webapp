import { FormattedMoney } from '../../../../components/ui/FormattedMoney.tsx'
import { LoadingSpinner } from '../../../../components/ui/LoadingSpinner.tsx'
import { useBalanceQuery } from '../../hooks/useBalanceQuery.ts'
import type { MerchantWalletItem } from '../../services/walletsSchemas.ts'
import { WalletCurrencyTabs } from './WalletCurrencyTabs.tsx'

type WalletOverviewCardProps = {
  wallets: MerchantWalletItem[]
  activeWalletId: string
  areBalancesHidden: boolean
  walletsLoading?: boolean
}

function formatLimitRange(min: number, max: number) {
  return `${min.toLocaleString('en-US')} – ${max.toLocaleString('en-US')}`
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
  const balanceQuery = useBalanceQuery(true)
  const active = wallets.find((w) => w.id === activeWalletId)

  if (!active) {
    return null
  }

  const ledger = balanceQuery.data
  const ledgerMatchesWallet =
    ledger != null && ledger.currency === active.currency

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
        aria-label={`${active.currency} account overview`}
      >
        <div>
          <h2 className="dashboard-section-title text-sm">Account overview</h2>
          <p className="dashboard-caption">
            Pocket balance from merchant wallets · updated{' '}
            {formatWalletUpdated(active.updatedAt)}
          </p>
        </div>
      </div>

      <div className="p-3 md:p-4">
        {walletsLoading ? (
          <div className="flex min-h-[120px] items-center justify-center">
            <LoadingSpinner label="Loading wallet balances…" />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <WalletMetricTile
              label="Balance"
              currency={active.currency}
              amountStr={active.balance}
              areBalancesHidden={areBalancesHidden}
            />

            {ledgerMatchesWallet ? (
              <>
                <WalletMetricTile
                  label="Available balance"
                  currency={active.currency}
                  amountStr={ledger.availableBalance}
                  areBalancesHidden={areBalancesHidden}
                />
                <WalletMetricTile
                  label="Pending balance"
                  currency={active.currency}
                  amountStr={ledger.pendingBalance}
                  areBalancesHidden={areBalancesHidden}
                />
                <div className="wallet-metric-tile">
                  <p className="wallet-metric-tile-label">Payin & payout limits</p>
                  <dl className="wallet-metric-tile-body space-y-2">
                    <div>
                      <dt>Payin</dt>
                      <dd className="tabular-nums">
                        {formatLimitRange(
                          ledger.limits.payin.min,
                          ledger.limits.payin.max,
                        )}{' '}
                        {active.currency}
                      </dd>
                    </div>
                    <div>
                      <dt>Payout</dt>
                      <dd className="tabular-nums">
                        {formatLimitRange(
                          ledger.limits.payout.min,
                          ledger.limits.payout.max,
                        )}{' '}
                        {active.currency}
                      </dd>
                    </div>
                  </dl>
                </div>
              </>
            ) : (
              <div className="wallet-metric-tile">
                <p className="wallet-metric-tile-label">Status</p>
                <p className="wallet-metric-tile-value capitalize !text-base">
                  {active.status}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  )
}

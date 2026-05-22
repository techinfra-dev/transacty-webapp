import { LoadingSpinner } from '../../../../components/ui/LoadingSpinner.tsx'
import { formatWalletMoney } from '../../utils/walletFormatters.ts'
import { useBalanceQuery } from '../../hooks/useBalanceQuery.ts'
import type { MerchantWalletItem } from '../../services/walletsSchemas.ts'
import { WalletCurrencyTabs } from './WalletCurrencyTabs.tsx'

type WalletOverviewCardProps = {
  wallets: MerchantWalletItem[]
  activeWalletId: string
  areBalancesHidden: boolean
}

function maskMoney(currency: string, amount: number) {
  const formatted = formatWalletMoney(currency, amount)
  const [code] = formatted.split(' ')
  return `${code} ******`
}

function formatLimitRange(min: number, max: number) {
  return `${min.toLocaleString('en-US')} – ${max.toLocaleString('en-US')}`
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
  const display = areBalancesHidden
    ? maskMoney(currency, safe)
    : formatWalletMoney(currency, safe)

  return (
    <div className="rounded-[10px] border border-[rgba(15,7,0,0.08)] bg-white px-3 py-3">
      <p className="[font-family:var(--font-body)] text-[10px] font-semibold uppercase tracking-[0.1em] text-[#566167]">
        {label}
      </p>
      <p className="mt-1.5 [font-family:var(--font-display)] text-xl font-semibold tracking-tight tabular-nums text-[#0F0700]">
        {display}
      </p>
    </div>
  )
}

export function WalletOverviewCard({
  wallets,
  activeWalletId,
  areBalancesHidden,
}: WalletOverviewCardProps) {
  const balanceQuery = useBalanceQuery(true)
  const active = wallets.find((w) => w.id === activeWalletId)

  if (!active) {
    return null
  }

  const data = balanceQuery.data
  const ledgerCurrency = data?.currency ?? active.currency

  return (
    <section className="dashboard-card">
      <WalletCurrencyTabs wallets={wallets} activeWalletId={activeWalletId} />

      <div
        className="dashboard-card-head border-b-0! pt-3!"
        role="tabpanel"
        aria-label={`${active.currency} account overview`}
      >
        <div>
          <h2 className="dashboard-section-title text-sm">Account overview</h2>
          <p className="mt-0.5 [font-family:var(--font-body)] text-[11px] text-[rgba(15,7,0,0.5)]">
            Balances and limits for {active.currency}
          </p>
        </div>
      </div>

      {data && data.currency !== active.currency ? (
        <p className="border-b border-[rgba(15,7,0,0.06)] px-[18px] py-2.5 [font-family:var(--font-body)] text-[11px] leading-relaxed text-[#566167]">
          Ledger figures follow your primary{' '}
          <span className="font-semibold text-[#0F0700]">{data.currency}</span> account.
          Selected tab:{' '}
          <span className="font-semibold text-[#0F0700]">{active.currency}</span>.
        </p>
      ) : null}

      <div className="p-3 md:p-4">
        {balanceQuery.isPending ? (
          <div className="flex min-h-[120px] items-center justify-center">
            <LoadingSpinner label="Loading ledger…" />
          </div>
        ) : balanceQuery.isError ? (
          <p className="py-6 text-center [font-family:var(--font-body)] text-xs text-[#b91c1c]">
            {balanceQuery.error.message}
          </p>
        ) : data ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <WalletMetricTile
              label="Balance"
              currency={ledgerCurrency}
              amountStr={data.balance}
              areBalancesHidden={areBalancesHidden}
            />
            <WalletMetricTile
              label="Available balance"
              currency={ledgerCurrency}
              amountStr={data.availableBalance}
              areBalancesHidden={areBalancesHidden}
            />
            <WalletMetricTile
              label="Pending balance"
              currency={ledgerCurrency}
              amountStr={data.pendingBalance}
              areBalancesHidden={areBalancesHidden}
            />
            <div className="rounded-[10px] border border-[rgba(15,7,0,0.08)] bg-white px-3 py-3">
              <p className="[font-family:var(--font-body)] text-[10px] font-semibold uppercase tracking-[0.1em] text-[#566167]">
                Payin & payout limits
              </p>
              <dl className="mt-2 space-y-2 [font-family:var(--font-body)] text-xs text-[#464644]">
                <div>
                  <dt className="font-semibold text-[#566167]">Payin</dt>
                  <dd className="tabular-nums">
                    {formatLimitRange(data.limits.payin.min, data.limits.payin.max)}{' '}
                    {ledgerCurrency}
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold text-[#566167]">Payout</dt>
                  <dd className="tabular-nums">
                    {formatLimitRange(data.limits.payout.min, data.limits.payout.max)}{' '}
                    {ledgerCurrency}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  )
}

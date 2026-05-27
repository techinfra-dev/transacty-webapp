import { FormattedMoney } from '../../../../components/ui/FormattedMoney.tsx'
import type { CustomersBalanceByCurrency } from '../../hooks/useCustomersTotalBalance.ts'

type CustomersStatsStripProps = {
  total: number
  active: number
  frozen: number
  closed: number
  balancesByCurrency: CustomersBalanceByCurrency[]
  isCountsLoading: boolean
  isBalanceLoading: boolean
}

function StatCard({
  label,
  value,
  isLoading,
}: {
  label: string
  value: number
  isLoading: boolean
}) {
  return (
    <article className="customers-stat-card">
      <p className="customers-stat-label">{label}</p>
      <p className="customers-stat-value">{isLoading ? '—' : value.toLocaleString('en-US')}</p>
    </article>
  )
}

function TotalBalanceStatCard({
  balances,
  isLoading,
}: {
  balances: CustomersBalanceByCurrency[]
  isLoading: boolean
}) {
  return (
    <article className="customers-stat-card customers-stat-card--balance">
      <p className="customers-stat-label">Total balance</p>
      {isLoading ? (
        <p className="customers-stat-value customers-stat-value--money">—</p>
      ) : balances.length === 0 ? (
        <p className="customers-stat-value customers-stat-value--money">—</p>
      ) : (
        <div className="customers-stat-balances">
          {balances.map(({ currency, total }) => (
            <p key={currency} className="customers-stat-value customers-stat-value--money">
              <FormattedMoney currency={currency} value={total} />
            </p>
          ))}
        </div>
      )}
    </article>
  )
}

export function CustomersStatsStrip({
  total,
  active,
  frozen,
  closed,
  balancesByCurrency,
  isCountsLoading,
  isBalanceLoading,
}: CustomersStatsStripProps) {
  return (
    <div className="customers-stats">
      <TotalBalanceStatCard balances={balancesByCurrency} isLoading={isBalanceLoading} />
      <StatCard label="Total customers" value={total} isLoading={isCountsLoading} />
      <StatCard label="Active" value={active} isLoading={isCountsLoading} />
      <StatCard label="Frozen" value={frozen} isLoading={isCountsLoading} />
      <StatCard label="Closed" value={closed} isLoading={isCountsLoading} />
    </div>
  )
}

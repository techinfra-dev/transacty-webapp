import { FormattedMoney } from '../../../../components/ui/FormattedMoney.tsx'
import type { CustomersBalanceByCurrency } from '../../hooks/useCustomersTotalBalance.ts'
import {
  BANGLADESH_RAIL_PAUSED,
  isBangladeshCurrency,
} from '../../utils/bangladeshRailPause.ts'

type CustomersStatsStripProps = {
  total: number
  active: number
  frozen: number
  closed: number
  balancesByCurrency: CustomersBalanceByCurrency[]
  isCountsLoading: boolean
  isBalanceLoading: boolean
}

function UsersGlyph() {
  return (
    <svg width="14" height="14" viewBox="0 0 256 256" fill="currentColor" aria-hidden>
      <path d="M117.25 157.92a60 60 0 1 0-66.5 0a95.83 95.83 0 0 0-47.22 37.71a8 8 0 1 0 13.4 8.74a80 80 0 0 1 134.14 0a8 8 0 0 0 13.4-8.74a95.83 95.83 0 0 0-47.22-37.71M40 108a44 44 0 1 1 44 44a44.05 44.05 0 0 1-44-44m210.14 98.7a8 8 0 0 1-11.07-2.33A79.83 79.83 0 0 0 172 168a8 8 0 0 1 0-16a44 44 0 1 0-16.34-84.87a8 8 0 1 1-5.94-14.85a60 60 0 0 1 55.53 105.64a95.83 95.83 0 0 1 47.22 37.71a8 8 0 0 1-2.33 11.07" />
    </svg>
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
  const markets = balancesByCurrency.length
  const statusTotal = Math.max(active + frozen + closed, 1)
  const activePct = (active / statusTotal) * 100
  const frozenPct = (frozen / statusTotal) * 100
  const closedPct = (closed / statusTotal) * 100

  return (
    <section className="customers-board" aria-label="Customers overview">
      <div className="customers-board-balances">
        <p className="customers-board-kicker">Balances held by customers</p>
        {isBalanceLoading ? (
          <p className="customers-board-empty">—</p>
        ) : balancesByCurrency.length === 0 ? (
          <p className="customers-board-empty">No balances yet</p>
        ) : (
          <div className="customers-board-balance-row">
            {balancesByCurrency.map(({ currency, total: amount }) => {
              const paused =
                BANGLADESH_RAIL_PAUSED && isBangladeshCurrency(currency)
              return (
                <div
                  key={currency}
                  className={`customers-board-balance-item${paused ? ' customers-board-balance-item--paused' : ''}`}
                  title={paused ? 'Temporarily unavailable' : undefined}
                >
                  <p className="customers-board-balance-value">
                    <FormattedMoney currency={currency} value={amount} />
                  </p>
                  <p className="customers-board-balance-code">{currency}</p>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="customers-board-divider" aria-hidden />

      <div className="customers-board-customers">
        <p className="customers-board-kicker customers-board-kicker--with-icon">
          <UsersGlyph />
          Customers
        </p>
        <p className="customers-board-summary">
          <span className="customers-board-summary-count">
            {isCountsLoading ? '—' : total.toLocaleString('en-US')}
          </span>
          <span className="customers-board-summary-meta">
            {isCountsLoading
              ? 'loading wallets…'
              : `wallets across ${markets} market${markets === 1 ? '' : 's'}`}
          </span>
        </p>

        <div
          className="customers-board-status-bar"
          role="img"
          aria-label={`${active} active, ${frozen} frozen, ${closed} closed`}
        >
          {active > 0 ? (
            <span
              className="customers-board-status-seg customers-board-status-seg--active"
              style={{ width: `${activePct}%` }}
            />
          ) : null}
          {frozen > 0 ? (
            <span
              className="customers-board-status-seg customers-board-status-seg--frozen"
              style={{ width: `${frozenPct}%` }}
            />
          ) : null}
          {closed > 0 ? (
            <span
              className="customers-board-status-seg customers-board-status-seg--closed"
              style={{ width: `${closedPct}%` }}
            />
          ) : null}
          {active + frozen + closed === 0 ? (
            <span className="customers-board-status-seg customers-board-status-seg--empty" />
          ) : null}
        </div>

        <ul className="customers-board-legend">
          <li>
            <i className="customers-board-legend-dot customers-board-legend-dot--active" />
            {isCountsLoading ? '—' : active} active
          </li>
          <li>
            <i className="customers-board-legend-dot customers-board-legend-dot--frozen" />
            {isCountsLoading ? '—' : frozen} frozen
          </li>
          <li>
            <i className="customers-board-legend-dot customers-board-legend-dot--closed" />
            {isCountsLoading ? '—' : closed} closed
          </li>
        </ul>
      </div>
    </section>
  )
}

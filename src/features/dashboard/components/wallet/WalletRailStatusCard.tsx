import type { ReactNode } from 'react'
import type {
  MoneyRailOverviewItem,
  MoneyRailStatusCounts,
} from '../../services/moneyOverviewSchemas.ts'
import { formatSettlementCurrenciesLabel } from '../../../../utils/currencyNames.ts'

type WalletRailStatusCardProps = {
  rail: MoneyRailOverviewItem
  paused?: boolean
}

function PayinIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M8 2.5v7.5M8 10 5.5 7.5M8 10l2.5-2.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3 12.5h10"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  )
}

function PayoutIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M8 13.5V6M8 6l2.5 2.5M8 6 5.5 8.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3 3.5h10"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  )
}

function formatFlowSummary(counts: MoneyRailStatusCounts) {
  if (counts.total <= 0) {
    return 'No activity yet'
  }
  return `${counts.success} of ${counts.total} succeeded`
}

function StatusStackBar({ counts }: { counts: MoneyRailStatusCounts }) {
  if (counts.total <= 0) {
    return <div className="wallet-rail-stackbar wallet-rail-stackbar--empty" />
  }

  const successPct = (counts.success / counts.total) * 100
  const pendingPct = (counts.pending / counts.total) * 100
  const failedPct = (counts.failed / counts.total) * 100

  return (
    <div
      className="wallet-rail-stackbar"
      role="img"
      aria-label={`${counts.success} succeeded, ${counts.pending} pending, ${counts.failed} failed`}
    >
      {successPct > 0 ? (
        <span
          className="wallet-rail-stackbar-seg wallet-rail-stackbar-seg--ok"
          style={{ width: `${successPct}%` }}
        />
      ) : null}
      {pendingPct > 0 ? (
        <span
          className="wallet-rail-stackbar-seg wallet-rail-stackbar-seg--pend"
          style={{ width: `${pendingPct}%` }}
        />
      ) : null}
      {failedPct > 0 ? (
        <span
          className="wallet-rail-stackbar-seg wallet-rail-stackbar-seg--fail"
          style={{ width: `${failedPct}%` }}
        />
      ) : null}
    </div>
  )
}

function FlowRow({
  label,
  icon,
  counts,
}: {
  label: string
  icon: ReactNode
  counts: MoneyRailStatusCounts
}) {
  return (
    <div className="wallet-rail-flow">
      <div className="wallet-rail-flow-head">
        <span className="wallet-rail-flow-label">
          <span className="wallet-rail-flow-icon">{icon}</span>
          {label}
        </span>
        <span className="wallet-rail-flow-meta">{formatFlowSummary(counts)}</span>
      </div>
      <StatusStackBar counts={counts} />
    </div>
  )
}

export function WalletRailStatusCard({
  rail,
  paused = false,
}: WalletRailStatusCardProps) {
  const settlement = formatSettlementCurrenciesLabel(rail.settlementCurrencies)
  const ready = rail.ready && !paused

  return (
    <article
      className={`wallet-rail-status ${paused ? 'wallet-rail-status--paused' : ''}`}
    >
      <div className="wallet-rail-status-head">
        <div className="min-w-0">
          <div className="wallet-rail-status-title-row">
            <h3 className="wallet-rail-status-title">{rail.displayName}</h3>
            {ready ? (
              <span className="dashboard-pill dashboard-pill-succ">
                <i aria-hidden />
                Healthy
              </span>
            ) : paused ? (
              <span className="dashboard-pill dashboard-pill-neutral">
                <i aria-hidden />
                Unavailable
              </span>
            ) : (
              <span className="dashboard-pill dashboard-pill-pend">
                <i aria-hidden />
                Locked
              </span>
            )}
          </div>
          <p className="wallet-rail-status-sub">
            Settles {settlement || '—'} · last 30 days
          </p>
        </div>
      </div>

      <div className="wallet-rail-status-flows">
        <FlowRow label="Pay-in" icon={<PayinIcon />} counts={rail.counts.payin} />
        <FlowRow label="Pay-out" icon={<PayoutIcon />} counts={rail.counts.payout} />
      </div>

      <ul className="wallet-rail-legend" aria-label="Status legend">
        <li>
          <i className="wallet-rail-legend-dot wallet-rail-legend-dot--ok" aria-hidden />
          Succeeded
        </li>
        <li>
          <i className="wallet-rail-legend-dot wallet-rail-legend-dot--pend" aria-hidden />
          Pending
        </li>
        <li>
          <i className="wallet-rail-legend-dot wallet-rail-legend-dot--fail" aria-hidden />
          Failed
        </li>
      </ul>

      {paused ? (
        <p className="wallet-rail-status-note">Temporarily down</p>
      ) : rail.unlockReason ? (
        <p className="wallet-rail-status-note wallet-rail-status-note--warn">
          {rail.unlockReason}
        </p>
      ) : null}
    </article>
  )
}

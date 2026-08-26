import type { ReactNode } from 'react'
import { FormattedMoney } from '../../../../components/ui/FormattedMoney.tsx'
import { getCurrencyFullName } from '../../../../utils/currencyNames.ts'
import type {
  CustomerDetail,
  CustomerStatus,
} from '../../services/customersSchemas.ts'
import {
  formatDateTime,
  formatRelativeTime,
  getCustomerStatusPillClassName,
  getCustomerWalletTitle,
  getMarketNameForCurrency,
  toTitleCaseFromSnake,
} from './customerViewUtils.tsx'

type FlowStat = {
  credited: number
  debited: number
  creditCount: number
  debitCount: number
  sinceLabel: string
}

type OutcomeStat = {
  success: number
  pending: number
  failed: number
  total: number
}

type CustomerDetailOverviewProps = {
  customer: CustomerDetail
  currency: string
  balance: number
  environmentLabel: string
  flow: FlowStat
  outcomes: OutcomeStat
  lastActivityAt: string | null
}

function ArrowDownIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-3.5 w-3.5 fill-current" aria-hidden>
      <path d="M10 3.5a.75.75 0 0 1 .75.75v9.19l2.72-2.72a.75.75 0 1 1 1.06 1.06l-4 4a.75.75 0 0 1-1.06 0l-4-4a.75.75 0 0 1 1.06-1.06l2.72 2.72V4.25A.75.75 0 0 1 10 3.5Z" />
    </svg>
  )
}

function ArrowUpIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-3.5 w-3.5 fill-current" aria-hidden>
      <path d="M10 16.5a.75.75 0 0 1-.75-.75V6.56L6.53 9.28a.75.75 0 0 1-1.06-1.06l4-4a.75.75 0 0 1 1.06 0l4 4a.75.75 0 1 1-1.06 1.06L10.75 6.56v9.19a.75.75 0 0 1-.75.75Z" />
    </svg>
  )
}

function NetIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-3.5 w-3.5 fill-current" aria-hidden>
      <path d="M3.22 7.22a.75.75 0 0 1 1.06 0L6 8.94V4.75a.75.75 0 0 1 1.5 0v5.5a.75.75 0 0 1-.22.53l-2.5 2.5a.75.75 0 1 1-1.06-1.06L5.94 10.5H4.75a.75.75 0 0 1 0-1.5h.69L3.22 8.28a.75.75 0 0 1 0-1.06Zm9.56-.5a.75.75 0 0 1 .22-.53l2.5-2.5a.75.75 0 0 1 1.06 1.06L14.56 7H15.25a.75.75 0 0 1 0 1.5h-1.19l1.72 1.72a.75.75 0 1 1-1.06 1.06l-2.5-2.5a.75.75 0 0 1-.22-.53V4.75a.75.75 0 0 1 1.5 0v1.97Z" />
    </svg>
  )
}

function MetaRow({
  label,
  children,
  sub,
}: {
  label: string
  children: ReactNode
  sub?: string
}) {
  return (
    <div className="cd-meta-row">
      <dt>{label}</dt>
      <dd>
        <div className="cd-meta-main">{children}</div>
        {sub ? <div className="cd-meta-sub">{sub}</div> : null}
      </dd>
    </div>
  )
}

export function CustomerDetailOverview({
  customer,
  currency,
  balance,
  environmentLabel,
  flow,
  outcomes,
  lastActivityAt,
}: CustomerDetailOverviewProps) {
  const created = formatDateTime(customer.createdAt)
  const createdRelative = formatRelativeTime(customer.createdAt)
  const lastActivity = lastActivityAt
    ? formatDateTime(lastActivityAt)
    : null
  const lastActivityRelative = lastActivityAt
    ? formatRelativeTime(lastActivityAt)
    : null
  const walletTitle = getCustomerWalletTitle(customer)
  const hasName = Boolean(customer.label?.trim())
  const market = getMarketNameForCurrency(currency)
  const currencyName = getCurrencyFullName(currency)
  const net = flow.credited - flow.debited
  const outcomeTotal = Math.max(outcomes.total, 1)
  const successPct = (outcomes.success / outcomeTotal) * 100
  const pendingPct = (outcomes.pending / outcomeTotal) * 100
  const failedPct = (outcomes.failed / outcomeTotal) * 100

  return (
    <div className="cd-overview">
      <div className="cd-overview-grid">
        <section className="cd-balance-card" aria-label="Wallet balance">
          <p className="cd-kicker">Wallet balance</p>
          <p className="cd-balance-value">
            <FormattedMoney currency={currency} value={balance} />
          </p>

          <div className="cd-flow-grid">
            <div className="cd-flow-item">
              <span className="cd-flow-icon cd-flow-icon--in">
                <ArrowDownIcon />
              </span>
              <div>
                <p className="cd-flow-amount cd-flow-amount--in">
                  <FormattedMoney currency={currency} value={flow.credited} />
                </p>
                <p className="cd-flow-label">Credited</p>
                <p className="cd-flow-meta">
                  {flow.creditCount > 0
                    ? `${flow.creditCount} movement${flow.creditCount === 1 ? '' : 's'} in`
                    : 'Nothing in yet'}
                </p>
              </div>
            </div>
            <div className="cd-flow-item">
              <span className="cd-flow-icon cd-flow-icon--out">
                <ArrowUpIcon />
              </span>
              <div>
                <p className="cd-flow-amount">
                  <FormattedMoney currency={currency} value={flow.debited} />
                </p>
                <p className="cd-flow-label">Debited</p>
                <p className="cd-flow-meta">
                  {flow.debitCount > 0
                    ? `${flow.debitCount} movement${flow.debitCount === 1 ? '' : 's'} out`
                    : 'Nothing out yet'}
                </p>
              </div>
            </div>
            <div className="cd-flow-item">
              <span className="cd-flow-icon">
                <NetIcon />
              </span>
              <div>
                <p className="cd-flow-amount">
                  <FormattedMoney currency={currency} value={net} />
                </p>
                <p className="cd-flow-label">Net</p>
                <p className="cd-flow-meta">{flow.sinceLabel}</p>
              </div>
            </div>
          </div>

          <div className="cd-outcomes">
            <div className="cd-outcomes-head">
              <p className="cd-kicker">Transaction outcomes</p>
              <p className="cd-outcomes-summary">
                {outcomes.total === 0
                  ? 'No transactions yet'
                  : `${outcomes.success} of ${outcomes.total} succeeded`}
              </p>
            </div>
            <div
              className="cd-outcomes-bar"
              role="img"
              aria-label={`${outcomes.success} succeeded, ${outcomes.pending} pending, ${outcomes.failed} failed`}
            >
              {outcomes.success > 0 ? (
                <span
                  className="cd-outcomes-seg cd-outcomes-seg--ok"
                  style={{ width: `${successPct}%` }}
                />
              ) : null}
              {outcomes.pending > 0 ? (
                <span
                  className="cd-outcomes-seg cd-outcomes-seg--pend"
                  style={{ width: `${pendingPct}%` }}
                />
              ) : null}
              {outcomes.failed > 0 ? (
                <span
                  className="cd-outcomes-seg cd-outcomes-seg--fail"
                  style={{ width: `${failedPct}%` }}
                />
              ) : null}
              {outcomes.total === 0 ? (
                <span className="cd-outcomes-seg cd-outcomes-seg--empty" />
              ) : null}
            </div>
            <ul className="cd-outcomes-legend">
              <li>
                <i className="cd-outcomes-dot cd-outcomes-dot--ok" />
                {outcomes.success} succeeded
              </li>
              <li>
                <i className="cd-outcomes-dot cd-outcomes-dot--pend" />
                {outcomes.pending} pending
              </li>
              <li>
                <i className="cd-outcomes-dot cd-outcomes-dot--fail" />
                {outcomes.failed} failed
              </li>
            </ul>
          </div>
        </section>

        <section className="cd-meta-card" aria-label="Customer details">
          <dl className="cd-meta-list">
            <MetaRow label="Status">
              <span
                className={getCustomerStatusPillClassName(
                  customer.status as CustomerStatus,
                )}
              >
                {toTitleCaseFromSnake(customer.status)}
              </span>
            </MetaRow>
            <MetaRow
              label="Name"
              sub={hasName ? undefined : `Shown as ${walletTitle}`}
            >
              {hasName ? customer.label : 'Not set'}
            </MetaRow>
            <MetaRow label="Currency" sub={currencyName}>
              {currency}
            </MetaRow>
            <MetaRow label="Market">{market}</MetaRow>
            <MetaRow label="Environment">
              <span className="cd-env-pill">{environmentLabel}</span>
            </MetaRow>
            <MetaRow
              label="Created"
              sub={createdRelative || undefined}
            >
              {created.primary}
              {created.secondary ? ` · ${created.secondary}` : ''}
            </MetaRow>
            <MetaRow
              label="Last activity"
              sub={lastActivityRelative || undefined}
            >
              {lastActivity
                ? `${lastActivity.primary}${lastActivity.secondary ? ` · ${lastActivity.secondary}` : ''}`
                : '—'}
            </MetaRow>
          </dl>
        </section>
      </div>
    </div>
  )
}

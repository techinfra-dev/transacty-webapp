import type { UseQueryResult } from '@tanstack/react-query'
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner.tsx'
import { useTransactionDetailModalStore } from '../../../store/transactionDetailModalStore.ts'
import type {
  TransactionItem,
  TransactionsListResponse,
} from '../services/transactionsSchemas.ts'
import { TransactionMethodTag } from './transactions/TransactionMethodTag.tsx'
import {
  formatTransactionMoney,
  getLedgerStatusPillClass,
  toTitleCase,
} from './transactions/transactionFormatters.ts'
import {
  getTransactionAmountColumnDisplay,
  getTransactionFeeColumnDisplay,
  getTransactionPaidColumnDisplay,
} from './transactions/transactionAmountUtils.ts'

function truncateId(id: string) {
  if (id.length <= 12) return id
  return `${id.slice(0, 8)}…${id.slice(-4)}`
}

function truncateText(value: string, max = 24) {
  if (value.length <= max) return value
  return `${value.slice(0, max)}…`
}

function formatDateCompact(isoDate: string) {
  const date = new Date(isoDate)
  if (Number.isNaN(date.getTime())) {
    return isoDate
  }
  const day = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
  const time = date
    .toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    .replace(/ ([AP]M)$/i, '\u00A0$1')
  return `${day} · ${time}`
}

type DashboardTransactionsTableProps = {
  transactionsQuery: UseQueryResult<TransactionsListResponse, Error>
  rows: TransactionItem[]
  emptyMessage?: string
  minLoadingHeight?: string
}

export function DashboardTransactionsTable({
  transactionsQuery,
  rows,
  emptyMessage = 'No transactions found.',
  minLoadingHeight = 'min-h-[200px]',
}: DashboardTransactionsTableProps) {
  const openTransactionDetail = useTransactionDetailModalStore(
    (state) => state.openTransactionDetail,
  )

  if (transactionsQuery.isPending) {
    return (
      <div className={`flex ${minLoadingHeight} items-center justify-center`}>
        <LoadingSpinner label="Loading transactions..." />
      </div>
    )
  }

  if (transactionsQuery.isError) {
    return (
      <p className="px-3 py-6 text-center [font-family:var(--font-body)] text-sm text-[#b91c1c]">
        Unable to load transactions right now.
      </p>
    )
  }

  if (rows.length === 0) {
    return (
      <p className="dashboard-caption px-3 py-6 text-center">
        {emptyMessage}
      </p>
    )
  }

  return (
    <table className="dashboard-table dashboard-table--compact">
      <colgroup>
        <col />
        <col />
        <col />
        <col />
        <col />
        <col />
        <col />
        <col />
      </colgroup>
      <thead>
        <tr>
          <th>Transaction ID</th>
          <th>Customer</th>
          <th>Type</th>
          <th className="num">Amount</th>
          <th className="num">Settled</th>
          <th className="num">Fee</th>
          <th>Status</th>
          <th>Date</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((activity) => {
          const customerRaw =
            activity.platformOrderId ||
            activity.customerWalletId ||
            'Ledger'
          const customer = truncateText(customerRaw)
          const isFailed = activity.status === 'failed'
          const amountColumn = getTransactionAmountColumnDisplay(activity)
          const paidColumn = getTransactionPaidColumnDisplay(activity)
          const feeColumn = getTransactionFeeColumnDisplay(activity)

          return (
            <tr
              key={activity.id}
              onClick={() => openTransactionDetail(activity.id)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  openTransactionDetail(activity.id)
                }
              }}
              tabIndex={0}
            >
              <td title={activity.id}>
                <span className="dashboard-cell-primary">
                  {truncateId(activity.id)}
                </span>
              </td>
              <td title={customerRaw}>
                <span className="dashboard-cell-body">{customer}</span>
              </td>
              <td className="dashboard-td-type">
                <TransactionMethodTag transaction={activity} />
              </td>
              <td className="num">
                <span
                  className={
                    isFailed ? 'dashboard-amt-muted' : 'dashboard-cell-mono'
                  }
                >
                  {formatTransactionMoney(
                    amountColumn.value,
                    amountColumn.currency,
                  )}
                </span>
              </td>
              <td className="num">
                <span
                  className={
                    isFailed
                      ? 'dashboard-amt-muted'
                      : 'dashboard-cell-mono-muted'
                  }
                >
                  {paidColumn.hasValue && paidColumn.value
                    ? formatTransactionMoney(
                        paidColumn.value,
                        paidColumn.currency,
                      )
                    : '—'}
                </span>
              </td>
              <td className="num">
                <span
                  className={
                    isFailed || !feeColumn.hasFee
                      ? 'dashboard-amt-muted'
                      : 'dashboard-cell-mono-muted'
                  }
                >
                  {feeColumn.hasFee && feeColumn.value
                    ? formatTransactionMoney(feeColumn.value, feeColumn.currency)
                    : '—'}
                </span>
              </td>
              <td>
                <span className={getLedgerStatusPillClass(activity.status)}>
                  <i aria-hidden />
                  {toTitleCase(activity.status)}
                </span>
              </td>
              <td title={activity.createdAt}>
                <span className="dashboard-cell-subtle">
                  {formatDateCompact(activity.createdAt)}
                </span>
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

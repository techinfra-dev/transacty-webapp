import type { UseQueryResult } from '@tanstack/react-query'
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner.tsx'
import { useTransactionDetailModalStore } from '../../../store/transactionDetailModalStore.ts'
import type {
  TransactionItem,
  TransactionsListResponse,
} from '../services/transactionsSchemas.ts'
import {
  formatTransactionMoney,
  getLedgerStatusPillClass,
  toTitleCase,
} from './transactions/transactionFormatters.ts'

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
      <p className="px-3 py-6 text-center [font-family:var(--font-body)] text-xs text-[#b91c1c]">
        Unable to load transactions right now.
      </p>
    )
  }

  if (rows.length === 0) {
    return (
      <p className="px-3 py-6 text-center [font-family:var(--font-body)] text-xs text-[rgba(15,7,0,0.58)]">
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
      </colgroup>
      <thead>
        <tr>
          <th>Transaction ID</th>
          <th>Customer</th>
          <th>Type</th>
          <th className="num">Amount</th>
          <th className="num">Paid</th>
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
          const currency = activity.currency ?? 'BDT'

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
                <span className="[font-family:ui-monospace,monospace] text-[13px] text-[#0F0700]">
                  {truncateId(activity.id)}
                </span>
              </td>
              <td title={customerRaw}>
                <span className="text-[#0F0700]">{customer}</span>
              </td>
              <td className="text-[rgba(15,7,0,0.72)]">
                {toTitleCase(activity.type)}
              </td>
              <td className="num">
                <span
                  className={
                    isFailed
                      ? 'dashboard-amt-muted'
                      : '[font-family:ui-monospace,monospace] text-[13px] font-medium tabular-nums text-[#0F0700]'
                  }
                >
                  {formatTransactionMoney(activity.amount, currency)}
                </span>
              </td>
              <td className="num">
                <span
                  className={
                    isFailed
                      ? 'dashboard-amt-muted'
                      : '[font-family:ui-monospace,monospace] text-[13px] tabular-nums text-[rgba(15,7,0,0.4)]'
                  }
                >
                  {formatTransactionMoney(
                    activity.paidAmount || activity.amount,
                    currency,
                  )}
                </span>
              </td>
              <td>
                <span className={getLedgerStatusPillClass(activity.status)}>
                  <i aria-hidden />
                  {toTitleCase(activity.status)}
                </span>
              </td>
              <td title={activity.createdAt}>
                <span className="text-xs text-[rgba(15,7,0,0.55)]">
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

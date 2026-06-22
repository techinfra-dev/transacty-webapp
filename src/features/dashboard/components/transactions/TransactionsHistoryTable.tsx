import type { UseQueryResult } from '@tanstack/react-query'
import { LoadingSpinner } from '../../../../components/ui/LoadingSpinner.tsx'
import { useTransactionDetailModalStore } from '../../../../store/transactionDetailModalStore.ts'
import type {
  TransactionItem,
  TransactionsListResponse,
} from '../../services/transactionsSchemas.ts'
import { TransactionMethodTag } from './TransactionMethodTag.tsx'
import {
  formatTransactionDateParts,
  formatTransactionMoney,
  getLedgerStatusPillClass,
  toTitleCase,
} from './transactionFormatters.ts'
import {
  getTransactionAmountColumnDisplay,
  getTransactionFeeColumnDisplay,
  getTransactionPaidColumnDisplay,
} from './transactionAmountUtils.ts'

function OpenRowIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M7 17L17 7M7 7h10v10" />
    </svg>
  )
}

type TransactionsHistoryTableProps = {
  transactionsQuery: UseQueryResult<TransactionsListResponse, Error>
  rows: TransactionItem[]
  emptyMessage?: string
  minLoadingHeight?: string
}

export function TransactionsHistoryTable({
  transactionsQuery,
  rows,
  emptyMessage = 'No transactions found.',
  minLoadingHeight = 'min-h-[240px]',
}: TransactionsHistoryTableProps) {
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
      <p className="px-6 py-10 text-center [font-family:var(--font-body)] text-xs text-[#b91c1c]">
        Unable to load transactions right now.
      </p>
    )
  }

  if (rows.length === 0) {
    return (
      <p className="px-6 py-12 text-center [font-family:var(--font-body)] text-[13px] text-[var(--dash-fg-subtle)]">
        {emptyMessage}
      </p>
    )
  }

  return (
    <table className="tx-history-table">
      <colgroup>
        <col className="tx-history-col-txn" />
        <col className="tx-history-col-ref" />
        <col className="tx-history-col-type" />
        <col className="tx-history-col-amt" />
        <col className="tx-history-col-amt" />
        <col className="tx-history-col-amt" />
        <col className="tx-history-col-status" />
        <col className="tx-history-col-date" />
        <col className="tx-history-col-action" />
      </colgroup>
      <thead>
        <tr>
          <th>Transaction</th>
          <th>Reference</th>
          <th>Type</th>
          <th className="num">Amount</th>
          <th className="num">Settled</th>
          <th className="num">Fee</th>
          <th>Status</th>
          <th>Date</th>
          <th aria-label="Actions" />
        </tr>
      </thead>
      <tbody>
        {rows.map((activity) => {
          const reference =
            activity.platformOrderId ||
            activity.customerWalletId ||
            '—'
          const isFailed = activity.status === 'failed'
          const amountColumn = getTransactionAmountColumnDisplay(activity)
          const paidColumn = getTransactionPaidColumnDisplay(activity)
          const feeColumn = getTransactionFeeColumnDisplay(activity)
          const { date, time } = formatTransactionDateParts(activity.createdAt)
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
                <div className="tx-history-txn-id">
                  <span className="tx-history-mono">{activity.id.slice(0, 8)}</span>
                  <span className="tx-history-mono tx-history-dim">
                    …{activity.id.slice(-4)}
                  </span>
                </div>
              </td>
              <td
                title={reference}
                className="tx-history-td-ref tx-history-mono tx-history-dim"
              >
                {reference}
              </td>
              <td className="tx-history-td-type">
                <TransactionMethodTag transaction={activity} />
              </td>
              <td className="num">
                <span className={isFailed ? 'tx-history-amt tx-history-amt-mute' : 'tx-history-amt'}>
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
                      ? 'tx-history-amt tx-history-amt-mute'
                      : 'tx-history-amt tx-history-amt-paid'
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
                      ? 'tx-history-amt tx-history-amt-mute'
                      : 'tx-history-amt tx-history-amt-paid'
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
              <td className="tx-history-td-date" title={activity.createdAt}>
                <div className="tx-history-date-cell">
                  <span>{date}</span>
                  {time ? <span className="tx-history-dim">{time}</span> : null}
                </div>
              </td>
              <td>
                <button
                  type="button"
                  className="tx-history-row-action"
                  aria-label="Open transaction"
                  onClick={(event) => {
                    event.stopPropagation()
                    openTransactionDetail(activity.id)
                  }}
                >
                  <OpenRowIcon />
                </button>
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

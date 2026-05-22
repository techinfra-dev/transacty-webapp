import type { UseQueryResult } from '@tanstack/react-query'
import { LoadingSpinner } from '../../../../components/ui/LoadingSpinner.tsx'
import type { TransactionItem, TransactionsListResponse } from '../../services/transactionsSchemas.ts'
import { TransactionRow } from './TransactionRow.tsx'

type TransactionsListBodyProps = {
  transactionsQuery: UseQueryResult<TransactionsListResponse, Error>
  filteredTransactions: TransactionItem[]
  isLiveEnvironment: boolean
  /** When the list is empty after load, show this instead of the default filter copy. */
  emptyListMessage?: string
}

export function TransactionsListBody({
  transactionsQuery,
  filteredTransactions,
  isLiveEnvironment,
  emptyListMessage,
}: TransactionsListBodyProps) {
  if (transactionsQuery.isPending) {
    return (
      <div className="flex min-h-[240px] items-center justify-center">
        <LoadingSpinner label="Loading transactions..." />
      </div>
    )
  }

  if (transactionsQuery.isError) {
    return (
      <div className="px-5 py-8 text-center [font-family:var(--font-body)] text-sm text-rose-600">
        {transactionsQuery.error.message}
      </div>
    )
  }

  if (filteredTransactions.length === 0) {
    if (emptyListMessage) {
      return (
        <div className="px-5 py-8 text-center [font-family:var(--font-body)] text-sm text-(--color-secondary)">
          {emptyListMessage}
        </div>
      )
    }
    const serverTotal = transactionsQuery.data?.total ?? 0
    const emptyLive =
      isLiveEnvironment &&
      serverTotal === 0 &&
      !transactionsQuery.isPending &&
      !transactionsQuery.isError

    return (
      <div className="px-5 py-8 text-center [font-family:var(--font-body)] text-sm text-(--color-secondary)">
        {emptyLive
          ? 'No live transactions yet.'
          : 'No transactions found for the selected filters.'}
      </div>
    )
  }

  return (
    <>
      {filteredTransactions.map((transaction) => (
        <TransactionRow key={transaction.id} transaction={transaction} />
      ))}
    </>
  )
}

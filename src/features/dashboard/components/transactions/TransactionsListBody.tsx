import type { UseQueryResult } from '@tanstack/react-query'
import { LoadingSpinner } from '../../../../components/ui/LoadingSpinner.tsx'
import type { TransactionItem, TransactionsListResponse } from '../../services/transactionsSchemas.ts'
import { TransactionRow } from './TransactionRow.tsx'

type TransactionsListBodyProps = {
  transactionsQuery: UseQueryResult<TransactionsListResponse, Error>
  filteredTransactions: TransactionItem[]
  onViewTransaction: (id: string) => void
  isLiveEnvironment: boolean
}

export function TransactionsListBody({
  transactionsQuery,
  filteredTransactions,
  onViewTransaction,
  isLiveEnvironment,
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
        <TransactionRow
          key={transaction.id}
          transaction={transaction}
          onView={() => onViewTransaction(transaction.id)}
        />
      ))}
    </>
  )
}

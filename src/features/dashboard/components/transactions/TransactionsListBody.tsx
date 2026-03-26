import type { UseQueryResult } from '@tanstack/react-query'
import { LoadingSpinner } from '../../../../components/ui/LoadingSpinner.tsx'
import type { TransactionItem, TransactionsListResponse } from '../../services/transactionsSchemas.ts'
import { TransactionRow } from './TransactionRow.tsx'

type TransactionsListBodyProps = {
  transactionsQuery: UseQueryResult<TransactionsListResponse, Error>
  filteredTransactions: TransactionItem[]
  onViewTransaction: (id: string) => void
}

export function TransactionsListBody({
  transactionsQuery,
  filteredTransactions,
  onViewTransaction,
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
    return (
      <div className="px-5 py-8 text-center [font-family:var(--font-body)] text-sm text-(--color-secondary)">
        No transactions found for the selected filters.
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

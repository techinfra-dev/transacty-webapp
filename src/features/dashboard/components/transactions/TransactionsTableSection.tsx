import type { UseQueryResult } from '@tanstack/react-query'
import type { TransactionItem, TransactionsListResponse } from '../../services/transactionsSchemas.ts'
import { TransactionsFooter } from './TransactionsFooter.tsx'
import { TransactionsListBody } from './TransactionsListBody.tsx'

type TransactionsTableSectionProps = {
  transactionsQuery: UseQueryResult<TransactionsListResponse, Error>
  filteredTransactions: TransactionItem[]
  onViewTransaction: (id: string) => void
  startItem: number
  endItem: number
  totalItems: number
  pageSize: number
  currentPage: number
  totalPages: number
  onPageSizeChange: (value: number) => void
  onPreviousPage: () => void
  onNextPage: () => void
}

export function TransactionsTableSection({
  transactionsQuery,
  filteredTransactions,
  onViewTransaction,
  startItem,
  endItem,
  totalItems,
  pageSize,
  currentPage,
  totalPages,
  onPageSizeChange,
  onPreviousPage,
  onNextPage,
}: TransactionsTableSectionProps) {
  return (
    <section className="relative z-0 flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-(--color-accent)/45 bg-(--color-card)">
      <div className="hidden grid-cols-[132px_1.2fr_124px_108px_124px_138px_120px_92px] gap-3 border-b border-(--color-accent)/35 px-5 py-2 [font-family:var(--font-body)] text-[11px] font-semibold uppercase tracking-wide text-(--color-secondary) lg:grid">
        <p>Transaction</p>
        <p>Reference</p>
        <p>Type</p>
        <p>Amount</p>
        <p>Paid amount</p>
        <p>Status</p>
        <p>Date</p>
        <p>Action</p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <TransactionsListBody
          transactionsQuery={transactionsQuery}
          filteredTransactions={filteredTransactions}
          onViewTransaction={onViewTransaction}
        />
      </div>

      <TransactionsFooter
        startItem={startItem}
        endItem={endItem}
        totalItems={totalItems}
        pageSize={pageSize}
        currentPage={currentPage}
        totalPages={totalPages}
        isPending={transactionsQuery.isPending}
        onPageSizeChange={onPageSizeChange}
        onPreviousPage={onPreviousPage}
        onNextPage={onNextPage}
      />
    </section>
  )
}

import type { UseQueryResult } from '@tanstack/react-query'
import type { TransactionItem, TransactionsListResponse } from '../../services/transactionsSchemas.ts'
import { TransactionsFooter } from './TransactionsFooter.tsx'
import { TransactionsHistoryTable } from './TransactionsHistoryTable.tsx'
import {
  TransactionStatusTabs,
  type TransactionStatusTab,
  type TransactionStatusTabId,
} from './TransactionStatusTabs.tsx'

type TransactionsTableSectionProps = {
  transactionsQuery: UseQueryResult<TransactionsListResponse, Error>
  statusTabs: TransactionStatusTab[]
  statusTab: TransactionStatusTabId
  onStatusTabChange: (id: TransactionStatusTabId) => void
  filteredTransactions: TransactionItem[]
  startItem: number
  endItem: number
  totalItems: number
  pageSize: number
  currentPage: number
  totalPages: number
  onPageSizeChange: (value: number) => void
  onPreviousPage: () => void
  onNextPage: () => void
  isLiveEnvironment: boolean
}

function emptyMessageForStatusTab(tab: TransactionStatusTabId) {
  if (tab === 'all') {
    return 'No transactions match these filters.'
  }
  const label =
    tab === 'success' ? 'successful' : tab === 'pending' ? 'pending' : 'failed'
  return `No ${label} transactions match these filters.`
}

export function TransactionsTableSection({
  transactionsQuery,
  statusTabs,
  statusTab,
  onStatusTabChange,
  filteredTransactions,
  startItem,
  endItem,
  totalItems,
  pageSize,
  currentPage,
  totalPages,
  onPageSizeChange,
  onPreviousPage,
  onNextPage,
  isLiveEnvironment,
}: TransactionsTableSectionProps) {
  const serverTotal = transactionsQuery.data?.total ?? 0
  const emptyLive =
    isLiveEnvironment &&
    serverTotal === 0 &&
    !transactionsQuery.isPending &&
    !transactionsQuery.isError

  const emptyMessage = emptyLive
    ? 'No live transactions yet.'
    : emptyMessageForStatusTab(statusTab)

  return (
    <section className="tx-history-card">
      <TransactionStatusTabs
        tabs={statusTabs}
        activeId={statusTab}
        onChange={onStatusTabChange}
      />

      <div
        key={statusTab}
        className="dashboard-activity-table-panel tx-history-table-wrap"
      >
        <TransactionsHistoryTable
          transactionsQuery={transactionsQuery}
          rows={filteredTransactions}
          emptyMessage={emptyMessage}
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
        isLiveEnvironment={isLiveEnvironment}
        onPageSizeChange={onPageSizeChange}
        onPreviousPage={onPreviousPage}
        onNextPage={onNextPage}
      />
    </section>
  )
}

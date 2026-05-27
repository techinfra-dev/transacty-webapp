import type { RefObject } from 'react'
import type { UseQueryResult } from '@tanstack/react-query'
import type { CustomerItem, CustomersListResponse } from '../../services/customersSchemas.ts'
import { CustomersFooter } from './CustomersFooter.tsx'
import { CustomersHistoryTable } from './CustomersHistoryTable.tsx'

type CustomersTableSectionProps = {
  customersQuery: UseQueryResult<CustomersListResponse, Error>
  items: CustomerItem[]
  emptyMessage: string
  startItem: number
  endItem: number
  totalItems: number
  pageSize: number
  currentPage: number
  totalPages: number
  copiedCustomerId: string | null
  openActionsCustomerId: string | null
  actionsMenuRef: RefObject<HTMLDivElement | null>
  isLiveEnvironment: boolean
  onPageSizeChange: (value: number) => void
  onPreviousPage: () => void
  onNextPage: () => void
  onCopyCustomerId: (customerId: string) => void
  onToggleActions: (customerId: string) => void
  onView: (customer: CustomerItem) => void
  onUpdateStatus: (customer: CustomerItem) => void
  onTransactions: (customer: CustomerItem) => void
  onTransfer: (customer: CustomerItem) => void
  onRefund: (customer: CustomerItem) => void
}

export function CustomersTableSection({
  customersQuery,
  items,
  emptyMessage,
  startItem,
  endItem,
  totalItems,
  pageSize,
  currentPage,
  totalPages,
  copiedCustomerId,
  openActionsCustomerId,
  actionsMenuRef,
  isLiveEnvironment,
  onPageSizeChange,
  onPreviousPage,
  onNextPage,
  onCopyCustomerId,
  onToggleActions,
  onView,
  onUpdateStatus,
  onTransactions,
  onTransfer,
  onRefund,
}: CustomersTableSectionProps) {
  return (
    <section className="customers-card">
      <div className="customers-table-wrap">
        <CustomersHistoryTable
          isPending={customersQuery.isPending}
          isError={customersQuery.isError}
          items={items}
          emptyMessage={emptyMessage}
          copiedCustomerId={copiedCustomerId}
          openActionsCustomerId={openActionsCustomerId}
          actionsMenuRef={actionsMenuRef}
          onCopyCustomerId={onCopyCustomerId}
          onToggleActions={onToggleActions}
          onView={onView}
          onUpdateStatus={onUpdateStatus}
          onTransactions={onTransactions}
          onTransfer={onTransfer}
          onRefund={onRefund}
        />
      </div>

      <CustomersFooter
        startItem={startItem}
        endItem={endItem}
        totalItems={totalItems}
        pageSize={pageSize}
        currentPage={currentPage}
        totalPages={totalPages}
        isPending={customersQuery.isPending}
        isLiveEnvironment={isLiveEnvironment}
        onPageSizeChange={onPageSizeChange}
        onPreviousPage={onPreviousPage}
        onNextPage={onNextPage}
      />
    </section>
  )
}

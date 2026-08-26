import type { UseQueryResult } from '@tanstack/react-query'
import type { CustomerItem, CustomersListResponse } from '../../services/customersSchemas.ts'
import { CustomersFooter } from './CustomersFooter.tsx'
import { CustomersHistoryTable } from './CustomersHistoryTable.tsx'

type CustomersTableSectionProps = {
  customersQuery: UseQueryResult<CustomersListResponse, Error>
  items: CustomerItem[]
  emptyTitle: string
  emptyDescription: string
  showClearFilters?: boolean
  onClearFilters?: () => void
  startItem: number
  endItem: number
  totalItems: number
  pageSize: number
  currentPage: number
  totalPages: number
  copiedCustomerId: string | null
  isLiveEnvironment: boolean
  onPageSizeChange: (value: number) => void
  onPreviousPage: () => void
  onNextPage: () => void
  onCopyCustomerId: (customerId: string) => void
}

export function CustomersTableSection({
  customersQuery,
  items,
  emptyTitle,
  emptyDescription,
  showClearFilters = false,
  onClearFilters,
  startItem,
  endItem,
  totalItems,
  pageSize,
  currentPage,
  totalPages,
  copiedCustomerId,
  isLiveEnvironment,
  onPageSizeChange,
  onPreviousPage,
  onNextPage,
  onCopyCustomerId,
}: CustomersTableSectionProps) {
  return (
    <section className="customers-card">
      <div className="customers-table-wrap">
        <CustomersHistoryTable
          isPending={customersQuery.isPending}
          isError={customersQuery.isError}
          items={items}
          emptyTitle={emptyTitle}
          emptyDescription={emptyDescription}
          showClearFilters={showClearFilters}
          onClearFilters={onClearFilters}
          copiedCustomerId={copiedCustomerId}
          onCopyCustomerId={onCopyCustomerId}
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

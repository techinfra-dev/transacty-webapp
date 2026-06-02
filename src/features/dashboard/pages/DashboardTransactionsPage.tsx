import { usePortalEnvironmentStore } from '../../../store/portalEnvironmentStore.ts'
import { TransactionsPageHeader } from '../components/transactions/TransactionsPageHeader.tsx'
import { TransactionsTableSection } from '../components/transactions/TransactionsTableSection.tsx'
import { useTransactionsPage } from '../hooks/useTransactionsPage.ts'

export function DashboardTransactionsPage() {
  const tx = useTransactionsPage()
  const portalEnvironment = usePortalEnvironmentStore((state) => state.environment)

  return (
    <section className="tx-history-page app-page-enter flex h-full min-h-0 flex-col gap-3">
      <TransactionsPageHeader
        query={tx.query}
        onQueryChange={(value) => {
          tx.setQuery(value)
          tx.setCurrentPage(1)
        }}
        customerIdFilter={tx.customerIdFilter}
        onCustomerIdFilterChange={(value) => {
          tx.setCustomerIdFilter(value)
          tx.setCurrentPage(1)
        }}
        selectedRail={tx.selectedRail}
        onSelectedRailChange={(value) => {
          tx.setSelectedRail(value)
          tx.setCurrentPage(1)
        }}
        selectedMethod={tx.selectedMethod}
        onSelectedMethodChange={(value) => {
          tx.setSelectedMethod(value)
          tx.setCurrentPage(1)
        }}
        totalItems={tx.totalItems}
        hasActiveDateFilter={
          tx.appliedStartDate.length > 0 || tx.appliedEndDate.length > 0
        }
        isFilterDialogOpen={tx.isFilterDialogOpen}
        onOpenFilterDialog={tx.openFilterDialog}
        onCloseFilterDialog={tx.closeFilterDialog}
        tempStartDate={tx.tempStartDate}
        tempEndDate={tx.tempEndDate}
        onTempStartDateChange={tx.setTempStartDate}
        onTempEndDateChange={tx.setTempEndDate}
        onResetDateFilters={() => {
          tx.setTempStartDate('')
          tx.setTempEndDate('')
          tx.setAppliedStartDate('')
          tx.setAppliedEndDate('')
          tx.setCurrentPage(1)
        }}
        onApplyDateFilters={() => {
          tx.setAppliedStartDate(tx.tempStartDate)
          tx.setAppliedEndDate(tx.tempEndDate)
          tx.setCurrentPage(1)
          tx.closeFilterDialog()
        }}
      />

      <TransactionsTableSection
        transactionsQuery={tx.transactionsQuery}
        statusTabs={tx.statusTabs}
        statusTab={tx.statusTab}
        onStatusTabChange={tx.setStatusTab}
        filteredTransactions={tx.filteredTransactions}
        startItem={tx.startItem}
        endItem={tx.endItem}
        totalItems={tx.totalItems}
        pageSize={tx.pageSize}
        currentPage={tx.currentPage}
        totalPages={tx.totalPages}
        onPageSizeChange={(value) => {
          tx.setPageSize(value)
          tx.setCurrentPage(1)
        }}
        onPreviousPage={() => tx.setCurrentPage((previousPage) => previousPage - 1)}
        onNextPage={() => tx.setCurrentPage((previousPage) => previousPage + 1)}
        isLiveEnvironment={portalEnvironment === 'live'}
      />
    </section>
  )
}

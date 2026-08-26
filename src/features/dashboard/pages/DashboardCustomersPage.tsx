import { useMemo, useState } from 'react'
import { Button } from '../../../components/ui/Button.tsx'
import { Dialog } from '../../../components/ui/Dialog.tsx'
import { Input } from '../../../components/ui/Input.tsx'
import { usePortalEnvironmentStore } from '../../../store/portalEnvironmentStore.ts'
import { CustomersFilterBar } from '../components/customers/CustomersFilterBar.tsx'
import { CustomersPageHeader } from '../components/customers/CustomersPageHeader.tsx'
import { CustomersStatsStrip } from '../components/customers/CustomersStatsStrip.tsx'
import { CustomersTableSection } from '../components/customers/CustomersTableSection.tsx'
import { LoadingButtonLabel } from '../components/customers/customerViewUtils.tsx'
import { useCreateCustomerMutation } from '../hooks/useCustomersQueries.ts'
import { useCustomersPage } from '../hooks/useCustomersPage.ts'

export function DashboardCustomersPage() {
  const portalEnvironment = usePortalEnvironmentStore((state) => state.environment)
  const page = useCustomersPage()

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newCustomerLabel, setNewCustomerLabel] = useState('')
  const [createError, setCreateError] = useState<string | null>(null)
  const [isCreateLabelMissing, setIsCreateLabelMissing] = useState(false)

  const createCustomerMutation = useCreateCustomerMutation()

  const statusPills = useMemo(
    () => [
      { id: 'all', label: 'All', count: page.statusCounts.total },
      { id: 'active', label: 'Active', count: page.statusCounts.active },
      { id: 'frozen', label: 'Frozen', count: page.statusCounts.frozen },
      { id: 'closed', label: 'Closed', count: page.statusCounts.closed },
    ],
    [
      page.statusCounts.active,
      page.statusCounts.closed,
      page.statusCounts.frozen,
      page.statusCounts.total,
    ],
  )

  const emptyTitle =
    portalEnvironment === 'live' &&
    page.statusCounts.total === 0 &&
    !page.hasActiveFilters
      ? 'No live customers yet'
      : 'No customers match this view'

  const emptyDescription = page.normalizedSearch
    ? `Nothing found for “${page.normalizedSearch}”.`
    : page.hasActiveFilters
      ? 'Try adjusting status or currency filters.'
      : portalEnvironment === 'live'
        ? 'Create a customer wallet to get started.'
        : 'No customers in this environment yet.'

  async function handleCreateCustomer() {
    setCreateError(null)
    const normalizedLabel = newCustomerLabel.trim()
    if (!normalizedLabel) {
      setIsCreateLabelMissing(true)
      setCreateError('Customer label is required.')
      return
    }

    try {
      await createCustomerMutation.mutateAsync({ label: normalizedLabel })
      setNewCustomerLabel('')
      setIsCreateLabelMissing(false)
      setIsCreateDialogOpen(false)
    } catch (error) {
      setCreateError(
        error instanceof Error
          ? error.message
          : 'Unable to create customer right now.',
      )
    }
  }

  return (
    <section className="customers-page app-page-enter flex h-full min-h-0 flex-col gap-3">
      <CustomersPageHeader onCreate={() => setIsCreateDialogOpen(true)} />

      <CustomersStatsStrip
        total={page.statusCounts.total}
        active={page.statusCounts.active}
        frozen={page.statusCounts.frozen}
        closed={page.statusCounts.closed}
        balancesByCurrency={page.totalBalanceQuery.data?.byCurrency ?? []}
        isCountsLoading={page.statusCounts.isLoading}
        isBalanceLoading={page.totalBalanceQuery.isPending}
      />

      <CustomersFilterBar
        searchQuery={page.searchQuery}
        onSearchQueryChange={page.setSearchQuery}
        statusFilter={page.statusFilter}
        onStatusFilterChange={page.setStatusFilter}
        currencyFilter={page.currencyFilter}
        onCurrencyFilterChange={page.setCurrencyFilter}
        currencyOptions={page.currencyOptions}
        statusPills={statusPills}
        isCountsLoading={page.statusCounts.isLoading}
      />

      <CustomersTableSection
        customersQuery={page.customersQuery}
        items={page.displayedItems}
        emptyTitle={emptyTitle}
        emptyDescription={emptyDescription}
        showClearFilters={page.hasActiveFilters}
        onClearFilters={page.clearFilters}
        startItem={page.startItem}
        endItem={page.endItem}
        totalItems={page.totalItems}
        pageSize={page.pageSize}
        currentPage={page.currentPage}
        totalPages={page.totalPages}
        copiedCustomerId={page.copiedCustomerId}
        isLiveEnvironment={portalEnvironment === 'live'}
        onPageSizeChange={page.setPageSize}
        onPreviousPage={() => page.setCurrentPage((p) => p - 1)}
        onNextPage={() => page.setCurrentPage((p) => p + 1)}
        onCopyCustomerId={(id) => void page.copyCustomerId(id)}
      />

      <Dialog
        isOpen={isCreateDialogOpen}
        onClose={() => {
          if (!createCustomerMutation.isPending) {
            setIsCreateDialogOpen(false)
          }
        }}
        title="Create customer"
        description="Create a new customer wallet."
        maxWidthClassName="max-w-lg"
        footer={
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="ghost"
              className="h-10 w-full px-4 text-xs"
              onClick={() => setIsCreateDialogOpen(false)}
              disabled={createCustomerMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              className="h-10 w-full px-4 text-xs"
              onClick={() => void handleCreateCustomer()}
              disabled={createCustomerMutation.isPending}
            >
              {createCustomerMutation.isPending ? (
                <LoadingButtonLabel label="Creating…" />
              ) : (
                'Create customer'
              )}
            </Button>
          </div>
        }
      >
        <label className="space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-(--color-secondary)">
            Label *
          </span>
          <Input
            placeholder="John Doe"
            value={newCustomerLabel}
            onChange={(event) => {
              setNewCustomerLabel(event.target.value)
              if (isCreateLabelMissing) {
                setIsCreateLabelMissing(false)
              }
            }}
            className={
              isCreateLabelMissing
                ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-300/40'
                : undefined
            }
          />
        </label>
        {createError ? (
          <p className="mt-3 [font-family:var(--font-body)] text-sm text-rose-600">
            {createError}
          </p>
        ) : null}
      </Dialog>
    </section>
  )
}

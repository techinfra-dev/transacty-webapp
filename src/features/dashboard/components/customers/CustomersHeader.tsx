import { Button } from '../../../../components/ui/Button.tsx'
import { DropdownSelect } from '../../../../components/ui/DropdownSelect.tsx'
import { pageSizeOptions, statusFilterOptions } from './customerViewUtils.tsx'

interface CustomersHeaderProps {
  statusFilter: string
  pageSize: number
  onStatusFilterChange: (value: string) => void
  onPageSizeChange: (value: number) => void
  onCreate: () => void
}

export function CustomersHeader({
  statusFilter,
  pageSize,
  onStatusFilterChange,
  onPageSizeChange,
  onCreate,
}: CustomersHeaderProps) {
  return (
    <header className="relative z-20 rounded-2xl border border-(--color-accent)/45 bg-(--color-card) p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="[font-family:var(--font-display)] text-3xl font-semibold text-(--color-foreground)">
            Customers
          </h1>
          <p className="mt-1 [font-family:var(--font-body)] text-sm text-(--color-secondary)">
            Manage customer wallets, statuses, and transaction activity.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DropdownSelect
            ariaLabel="Filter customers by status"
            options={statusFilterOptions}
            value={statusFilter}
            onChange={onStatusFilterChange}
          />
          <DropdownSelect
            ariaLabel="Select customers per page"
            options={pageSizeOptions}
            value={String(pageSize)}
            onChange={(value) => onPageSizeChange(Number(value))}
            className="min-w-[108px]"
          />
          <Button className="h-10 px-3 text-xs" onClick={onCreate}>
            Add customer
          </Button>
        </div>
      </div>
    </header>
  )
}

import type { RefObject } from 'react'
import { Button } from '../../../../components/ui/Button.tsx'
import { DropdownSelect } from '../../../../components/ui/DropdownSelect.tsx'
import { Input } from '../../../../components/ui/Input.tsx'
import {
  transactionMethodOptions,
  transactionStatusOptions,
} from './transactionConstants.ts'

type TransactionsPageHeaderProps = {
  query: string
  onQueryChange: (value: string) => void
  customerIdFilter: string
  onCustomerIdFilterChange: (value: string) => void
  selectedMethod: string
  onSelectedMethodChange: (value: string) => void
  selectedStatus: string
  onSelectedStatusChange: (value: string) => void
  totalItems: number
  isFilterPanelOpen: boolean
  onToggleFilterPanel: () => void
  filterMenuRef: RefObject<HTMLDivElement | null>
  tempStartDate: string
  tempEndDate: string
  onTempStartDateChange: (value: string) => void
  onTempEndDateChange: (value: string) => void
  onResetDateFilters: () => void
  onApplyDateFilters: () => void
  onOpenTransfer: () => void
  onOpenRefund: () => void
}

export function TransactionsPageHeader({
  query,
  onQueryChange,
  customerIdFilter,
  onCustomerIdFilterChange,
  selectedMethod,
  onSelectedMethodChange,
  selectedStatus,
  onSelectedStatusChange,
  totalItems,
  isFilterPanelOpen,
  onToggleFilterPanel,
  filterMenuRef,
  tempStartDate,
  tempEndDate,
  onTempStartDateChange,
  onTempEndDateChange,
  onResetDateFilters,
  onApplyDateFilters,
  onOpenTransfer,
  onOpenRefund,
}: TransactionsPageHeaderProps) {
  return (
    <header className="relative z-20 rounded-xl border border-(--color-accent)/45 bg-(--color-card) p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="[font-family:var(--font-display)] text-2xl font-semibold tracking-tight text-(--color-foreground)">
            Transactions History
          </h1>
          <p className="mt-0.5 max-w-2xl [font-family:var(--font-body)] text-[13px] leading-snug text-(--color-secondary)">
            Track payins and payouts with method, fee, net amount, and status.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            className="h-9! border! border-solid! border-[#0F0700]! bg-[#0F0700]! px-3 text-xs font-semibold text-[#F3E8D6]! hover:bg-[#2a241c]!"
            onClick={onOpenTransfer}
          >
            Create transfer
          </Button>
          <Button
            variant="ghost"
            className="h-9! border! border-solid! border-[#35383F]! bg-[#35383F]! px-3 text-xs font-semibold text-[#F3E8D6]! hover:bg-[#3d4247]!"
            onClick={onOpenRefund}
          >
            Create refund
          </Button>
          <div ref={filterMenuRef} className="relative">
            <button
              type="button"
              onClick={onToggleFilterPanel}
              className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-(--color-accent)/45 bg-(--color-card) text-(--color-foreground) transition hover:border-(--color-secondary)/55 focus:border-(--color-secondary) focus:ring-2 focus:ring-(--color-secondary)/20"
              aria-label="Toggle transaction filters"
              aria-expanded={isFilterPanelOpen}
            >
              <svg viewBox="0 0 20 20" className="h-4 w-4 fill-current">
                <path d="M3.25 4.75a.75.75 0 0 1 .75-.75h12a.75.75 0 0 1 .58 1.22L12 10.92V15a.75.75 0 0 1-.44.68l-2.5 1.12A.75.75 0 0 1 8 16.12v-5.2L3.42 5.22a.75.75 0 0 1-.17-.47Z" />
              </svg>
            </button>

            {isFilterPanelOpen ? (
              <div className="absolute right-0 top-full z-30 mt-2 w-[min(92vw,420px)] rounded-xl border border-(--color-accent)/35 bg-(--color-card) p-4">
                <h2 className="[font-family:var(--font-display)] text-lg font-semibold text-(--color-foreground)">
                  Transaction Filter
                </h2>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <label className="space-y-1.5">
                    <span className="[font-family:var(--font-body)] text-xs font-semibold text-(--color-secondary)">
                      Start Date
                    </span>
                    <Input
                      type="date"
                      value={tempStartDate}
                      onChange={(event) => onTempStartDateChange(event.target.value)}
                      className="h-10 cursor-pointer bg-(--color-card)"
                    />
                  </label>
                  <label className="space-y-1.5">
                    <span className="[font-family:var(--font-body)] text-xs font-semibold text-(--color-secondary)">
                      End Date
                    </span>
                    <Input
                      type="date"
                      value={tempEndDate}
                      onChange={(event) => onTempEndDateChange(event.target.value)}
                      className="h-10 cursor-pointer bg-(--color-card)"
                    />
                  </label>
                </div>

                <div className="mt-4 flex flex-wrap justify-end gap-2">
                  <Button
                    variant="ghost"
                    className="h-9 border border-(--color-accent)/45 px-3 text-xs"
                    onClick={onResetDateFilters}
                  >
                    Reset
                  </Button>
                  <Button className="h-9 px-3 text-xs" onClick={onApplyDateFilters}>
                    Apply Filter
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
          <div className="inline-flex rounded-full border border-(--color-accent)/45 bg-(--color-background) px-2.5 py-1 [font-family:var(--font-body)] text-[11px] font-semibold text-(--color-secondary)">
            {totalItems} records
          </div>
        </div>
      </div>

      <div className="mt-3 grid gap-2 lg:grid-cols-[1fr_auto_auto_auto]">
        <Input
          placeholder="Search by transaction ID or platform order ID"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          className="h-10 bg-(--color-card)"
        />
        <Input
          placeholder="Customer wallet ID"
          value={customerIdFilter}
          onChange={(event) => onCustomerIdFilterChange(event.target.value)}
          className="h-10 bg-(--color-card)"
        />
        <DropdownSelect
          ariaLabel="Filter transactions by type"
          options={transactionMethodOptions}
          value={selectedMethod}
          onChange={onSelectedMethodChange}
        />
        <DropdownSelect
          ariaLabel="Filter transactions by status"
          options={transactionStatusOptions}
          value={selectedStatus}
          onChange={onSelectedStatusChange}
        />
      </div>
    </header>
  )
}

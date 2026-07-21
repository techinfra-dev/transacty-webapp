import { transactionMethodOptions } from './transactionConstants.ts'
import { transactionRailFilterOptions } from '../../utils/transactionRailUtils.ts'
import type { TransactionRailFilter } from '../../services/transactionsSchemas.ts'
import { TransactionDateFilterDialog } from './TransactionDateFilterDialog.tsx'
import { InputClearButton } from '../../../../components/ui/InputClearButton.tsx'
import { DropdownSelect } from '../../../../components/ui/DropdownSelect.tsx'

function SearchIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      aria-hidden
    >
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  )
}

function FilterIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />
    </svg>
  )
}

type TransactionsPageHeaderProps = {
  query: string
  onQueryChange: (value: string) => void
  customerIdFilter: string
  customerIdFilterError: string | null
  onCustomerIdFilterChange: (value: string) => void
  selectedRail: TransactionRailFilter
  onSelectedRailChange: (value: TransactionRailFilter) => void
  selectedMethod: string
  onSelectedMethodChange: (value: string) => void
  totalItems: number
  isFilterDialogOpen: boolean
  onOpenFilterDialog: () => void
  onCloseFilterDialog: () => void
  hasActiveDateFilter: boolean
  tempStartDate: string
  tempEndDate: string
  onTempStartDateChange: (value: string) => void
  onTempEndDateChange: (value: string) => void
  onResetDateFilters: () => void
  onApplyDateFilters: () => void
}

export function TransactionsPageHeader({
  query,
  onQueryChange,
  customerIdFilter,
  customerIdFilterError,
  onCustomerIdFilterChange,
  selectedRail,
  onSelectedRailChange,
  selectedMethod,
  onSelectedMethodChange,
  totalItems,
  isFilterDialogOpen,
  onOpenFilterDialog,
  onCloseFilterDialog,
  hasActiveDateFilter,
  tempStartDate,
  tempEndDate,
  onTempStartDateChange,
  onTempEndDateChange,
  onResetDateFilters,
  onApplyDateFilters,
}: TransactionsPageHeaderProps) {
  return (
    <>
      <header className="tx-history-head">
        <div>
          <h1 className="tx-history-title">Transactions History</h1>
          <p className="tx-history-sub">
            Track payins and payouts with method, fee, net amount, and status.
          </p>
        </div>
        <div className="tx-history-head-meta">
          <button
            type="button"
            className={`tx-history-icon-btn ${isFilterDialogOpen ? 'tx-history-icon-btn--active' : ''}`}
            aria-label="Open date range filter"
            aria-haspopup="dialog"
            aria-expanded={isFilterDialogOpen}
            onClick={onOpenFilterDialog}
          >
            <FilterIcon />
            Filter
            {hasActiveDateFilter ? (
              <span className="tx-history-filter-dot" aria-hidden />
            ) : null}
          </button>
          <span className="tx-history-records">
            <b>{totalItems}</b> records
          </span>
        </div>
      </header>

      <div className="tx-history-filter-bar">
        <label className="tx-history-field">
          <SearchIcon />
          <input
            type="search"
            placeholder="Search by transaction ID or platform order ID"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
          />
        </label>
        <div className="relative min-w-0">
          <label
            className={`tx-history-field w-full ${
              customerIdFilterError ? 'border-red-500!' : ''
            }`}
          >
            <input
              type="text"
              placeholder="Customer wallet ID"
              value={customerIdFilter}
              onChange={(event) => onCustomerIdFilterChange(event.target.value)}
              aria-invalid={Boolean(customerIdFilterError)}
              aria-describedby={
                customerIdFilterError ? 'customer-wallet-filter-error' : undefined
              }
            />
            {customerIdFilter ? (
              <InputClearButton
                label="Clear customer wallet ID"
                onClear={() => onCustomerIdFilterChange('')}
              />
            ) : null}
          </label>
          {customerIdFilterError ? (
            <p
              id="customer-wallet-filter-error"
              className="absolute top-full left-1 z-10 mt-1 rounded bg-red-50 px-1.5 py-0.5 [font-family:var(--font-body)] text-[11px] text-red-700 shadow-sm"
            >
              {customerIdFilterError}
            </p>
          ) : null}
        </div>
        <DropdownSelect
          options={transactionRailFilterOptions}
          value={selectedRail}
          onChange={(value) => onSelectedRailChange(value as TransactionRailFilter)}
          ariaLabel="Filter transactions by rail"
          className="w-full min-w-0"
          variant="filter"
        />
        <DropdownSelect
          options={transactionMethodOptions}
          value={selectedMethod}
          onChange={onSelectedMethodChange}
          ariaLabel="Filter transactions by type"
          className="w-full min-w-0"
          variant="filter"
        />
      </div>

      <TransactionDateFilterDialog
        isOpen={isFilterDialogOpen}
        onClose={onCloseFilterDialog}
        tempStartDate={tempStartDate}
        tempEndDate={tempEndDate}
        onTempStartDateChange={onTempStartDateChange}
        onTempEndDateChange={onTempEndDateChange}
        onReset={onResetDateFilters}
        onApply={onApplyDateFilters}
      />
    </>
  )
}

import { transactionMethodOptions } from './transactionConstants.ts'
import { TransactionDateFilterDialog } from './TransactionDateFilterDialog.tsx'

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

function DownloadIcon() {
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
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
    </svg>
  )
}

function SelectChevron() {
  return (
    <svg
      className="tx-history-field-chev"
      width="10"
      height="10"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  )
}

type TransactionsPageHeaderProps = {
  query: string
  onQueryChange: (value: string) => void
  customerIdFilter: string
  onCustomerIdFilterChange: (value: string) => void
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
  onCustomerIdFilterChange,
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
          <button type="button" className="tx-history-icon-btn" aria-label="Export">
            <DownloadIcon />
            Export
          </button>
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

      <div className="tx-history-filter-bar tx-history-filter-bar--three">
        <label className="tx-history-field">
          <SearchIcon />
          <input
            type="search"
            placeholder="Search by transaction ID or platform order ID"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
          />
        </label>
        <label className="tx-history-field">
          <input
            type="text"
            placeholder="Customer wallet ID"
            value={customerIdFilter}
            onChange={(event) => onCustomerIdFilterChange(event.target.value)}
          />
        </label>
        <label className="tx-history-field tx-history-field-select">
          <select
            aria-label="Filter transactions by type"
            value={selectedMethod}
            onChange={(event) => onSelectedMethodChange(event.target.value)}
          >
            {transactionMethodOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <SelectChevron />
        </label>
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

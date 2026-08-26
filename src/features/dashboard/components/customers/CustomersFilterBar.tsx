import { InputClearButton } from '../../../../components/ui/InputClearButton.tsx'
import { DropdownSelect } from '../../../../components/ui/DropdownSelect.tsx'

function SearchIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      aria-hidden
    >
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  )
}

type StatusPill = {
  id: string
  label: string
  count: number
}

type CustomersFilterBarProps = {
  searchQuery: string
  onSearchQueryChange: (value: string) => void
  statusFilter: string
  onStatusFilterChange: (value: string) => void
  currencyFilter: string
  onCurrencyFilterChange: (value: string) => void
  currencyOptions: Array<{ value: string; label: string }>
  statusPills: StatusPill[]
  isCountsLoading?: boolean
}

export function CustomersFilterBar({
  searchQuery,
  onSearchQueryChange,
  statusFilter,
  onStatusFilterChange,
  currencyFilter,
  onCurrencyFilterChange,
  currencyOptions,
  statusPills,
  isCountsLoading = false,
}: CustomersFilterBarProps) {
  return (
    <div className="customers-toolbar">
      <label className="customers-toolbar-search">
        <SearchIcon />
        <input
          type="text"
          placeholder="Search by name, email or wallet ID"
          value={searchQuery}
          onChange={(event) => onSearchQueryChange(event.target.value)}
          aria-label="Search customers"
        />
        {searchQuery ? (
          <InputClearButton
            label="Clear customer search"
            onClear={() => onSearchQueryChange('')}
          />
        ) : null}
      </label>

      <div className="customers-toolbar-pills" role="tablist" aria-label="Filter by status">
        {statusPills.map((pill) => {
          const isActive = statusFilter === pill.id
          return (
            <button
              key={pill.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`customers-toolbar-pill${isActive ? ' customers-toolbar-pill--active' : ''}`}
              onClick={() => onStatusFilterChange(pill.id)}
            >
              <span>{pill.label}</span>
              <span className="customers-toolbar-pill-count">
                {isCountsLoading ? '—' : pill.count}
              </span>
            </button>
          )
        })}
      </div>

      <DropdownSelect
        options={currencyOptions}
        value={currencyFilter}
        onChange={onCurrencyFilterChange}
        ariaLabel="Filter customers by currency"
        className="customers-toolbar-currency"
        variant="filter"
      />
    </div>
  )
}

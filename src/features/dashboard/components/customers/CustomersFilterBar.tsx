import { pageSizeOptions, statusFilterOptions } from './customerViewUtils.tsx'
import { InputClearButton } from '../../../../components/ui/InputClearButton.tsx'
import { DropdownSelect } from '../../../../components/ui/DropdownSelect.tsx'

const customerPageSizeOptions = pageSizeOptions.map((option) => ({
  ...option,
  label: `${option.value} per page`,
}))

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

type CustomersFilterBarProps = {
  searchQuery: string
  onSearchQueryChange: (value: string) => void
  statusFilter: string
  onStatusFilterChange: (value: string) => void
  pageSize: number
  onPageSizeChange: (value: number) => void
}

export function CustomersFilterBar({
  searchQuery,
  onSearchQueryChange,
  statusFilter,
  onStatusFilterChange,
  pageSize,
  onPageSizeChange,
}: CustomersFilterBarProps) {
  return (
    <div className="customers-filter-bar">
      <label className="customers-field customers-field--search">
        <SearchIcon />
        <input
          type="text"
          placeholder="Search by name or wallet ID"
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

      <DropdownSelect
        options={statusFilterOptions}
        value={statusFilter}
        onChange={onStatusFilterChange}
        ariaLabel="Filter customers by status"
        className="w-full min-w-0"
        variant="filter"
      />

      <DropdownSelect
        options={customerPageSizeOptions}
        value={String(pageSize)}
        onChange={(value) => onPageSizeChange(Number(value))}
        ariaLabel="Customers per page"
        className="w-full min-w-0"
        variant="filter"
      />
    </div>
  )
}

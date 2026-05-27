import { pageSizeOptions, statusFilterOptions } from './customerViewUtils.tsx'

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

function SelectChevron() {
  return (
    <svg
      className="customers-field-chev"
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
          type="search"
          placeholder="Search by name or wallet ID"
          value={searchQuery}
          onChange={(event) => onSearchQueryChange(event.target.value)}
          aria-label="Search customers"
        />
      </label>

      <label className="customers-field customers-field-select">
        <select
          aria-label="Filter customers by status"
          value={statusFilter}
          onChange={(event) => onStatusFilterChange(event.target.value)}
        >
          {statusFilterOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <SelectChevron />
      </label>

      <label className="customers-field customers-field-select">
        <select
          aria-label="Customers per page"
          value={String(pageSize)}
          onChange={(event) => onPageSizeChange(Number(event.target.value))}
        >
          {pageSizeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.value} per page
            </option>
          ))}
        </select>
        <SelectChevron />
      </label>
    </div>
  )
}

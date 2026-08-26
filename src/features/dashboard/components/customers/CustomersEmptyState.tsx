type CustomersEmptyStateProps = {
  title: string
  description: string
  showClearFilters?: boolean
  onClearFilters?: () => void
}

function SearchEmptyIcon() {
  return (
    <svg
      width="22"
      height="22"
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

export function CustomersEmptyState({
  title,
  description,
  showClearFilters = false,
  onClearFilters,
}: CustomersEmptyStateProps) {
  return (
    <div className="customers-empty">
      <span className="customers-empty-icon">
        <SearchEmptyIcon />
      </span>
      <h2 className="customers-empty-title">{title}</h2>
      <p className="customers-empty-copy">{description}</p>
      {showClearFilters && onClearFilters ? (
        <button
          type="button"
          className="customers-empty-clear"
          onClick={onClearFilters}
        >
          Clear filters
        </button>
      ) : null}
    </div>
  )
}

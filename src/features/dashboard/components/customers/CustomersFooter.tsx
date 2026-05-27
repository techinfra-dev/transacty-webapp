import { pageSizeOptions } from './customerViewUtils.tsx'

function ChevronLeftIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M15 18l-6-6 6-6" />
    </svg>
  )
}

function ChevronRightIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M9 18l6-6-6-6" />
    </svg>
  )
}

function ChevronDownIcon() {
  return (
    <svg
      width="11"
      height="11"
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

type CustomersFooterProps = {
  startItem: number
  endItem: number
  totalItems: number
  pageSize: number
  currentPage: number
  totalPages: number
  isPending: boolean
  isLiveEnvironment: boolean
  onPageSizeChange: (value: number) => void
  onPreviousPage: () => void
  onNextPage: () => void
}

export function CustomersFooter({
  startItem,
  endItem,
  totalItems,
  pageSize,
  currentPage,
  totalPages,
  isPending,
  isLiveEnvironment,
  onPageSizeChange,
  onPreviousPage,
  onNextPage,
}: CustomersFooterProps) {
  return (
    <footer className="tx-history-foot">
      <p className="tx-history-foot-info">
        Showing{' '}
        <b>
          {totalItems === 0 ? 0 : startItem}–{endItem}
        </b>{' '}
        of <b>{totalItems}</b>
      </p>

      {!isLiveEnvironment ? (
        <span className="tx-history-test-banner" role="status">
          <i aria-hidden />
          Test mode
        </span>
      ) : null}

      <div className="tx-history-foot-spacer" />

      <label className="tx-history-page-size">
        <select
          aria-label="Select customers per page"
          value={String(pageSize)}
          disabled={isPending}
          onChange={(event) => onPageSizeChange(Number(event.target.value))}
        >
          {pageSizeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <span>per page</span>
        <ChevronDownIcon />
      </label>

      <div className="tx-history-pager">
        <button
          type="button"
          className="tx-history-pager-btn"
          disabled={currentPage <= 1 || isPending}
          onClick={onPreviousPage}
        >
          <ChevronLeftIcon />
          Prev
        </button>
        <span className="tx-history-pager-pos">
          Page {currentPage} of {totalPages}
        </span>
        <button
          type="button"
          className="tx-history-pager-btn"
          disabled={currentPage >= totalPages || isPending}
          onClick={onNextPage}
        >
          Next
          <ChevronRightIcon />
        </button>
      </div>
    </footer>
  )
}

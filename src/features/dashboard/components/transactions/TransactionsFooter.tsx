import { transactionPageSizeOptions } from './transactionConstants.ts'

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

type TransactionsFooterProps = {
  startItem: number
  endItem: number
  totalItems: number
  pageSize: number
  currentPage: number
  totalPages: number
  isPending: boolean
  isFetching?: boolean
  isLiveEnvironment: boolean
  onPageSizeChange: (value: number) => void
  onPreviousPage: () => void
  onNextPage: () => void
}

export function TransactionsFooter({
  startItem,
  endItem,
  totalItems,
  pageSize,
  currentPage,
  totalPages,
  isPending,
  isFetching = false,
  isLiveEnvironment,
  onPageSizeChange,
  onPreviousPage,
  onNextPage,
}: TransactionsFooterProps) {
  const pagerBusy = isPending || isFetching

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

      <div className="tx-history-page-size-wrap">
        <select
          className="tx-history-page-size-select"
          aria-label="Select transactions per page"
          value={String(pageSize)}
          disabled={totalItems === 0}
          onChange={(event) => {
            const next = Number(event.target.value)
            if (Number.isFinite(next) && next > 0) {
              onPageSizeChange(next)
            }
          }}
        >
          {transactionPageSizeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <span className="tx-history-page-size-suffix">per page</span>
      </div>

      <div className="tx-history-pager">
        <button
          type="button"
          className="tx-history-pager-btn"
          disabled={currentPage <= 1 || pagerBusy}
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
          disabled={currentPage >= totalPages || pagerBusy}
          onClick={onNextPage}
        >
          Next
          <ChevronRightIcon />
        </button>
      </div>
    </footer>
  )
}

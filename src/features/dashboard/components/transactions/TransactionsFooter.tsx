import { Button } from '../../../../components/ui/Button.tsx'
import { DropdownSelect } from '../../../../components/ui/DropdownSelect.tsx'
import { transactionPageSizeOptions } from './transactionConstants.ts'

type TransactionsFooterProps = {
  startItem: number
  endItem: number
  totalItems: number
  pageSize: number
  currentPage: number
  totalPages: number
  isPending: boolean
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
  onPageSizeChange,
  onPreviousPage,
  onNextPage,
}: TransactionsFooterProps) {
  return (
    <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-(--color-accent)/35 px-5 py-3 [font-family:var(--font-body)] text-xs text-(--color-secondary)">
      <p>
        Showing {startItem}-{endItem} of {totalItems}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <DropdownSelect
          ariaLabel="Select transactions per page"
          options={transactionPageSizeOptions}
          value={String(pageSize)}
          onChange={(value) => onPageSizeChange(Number(value))}
          className="min-w-[112px]"
          menuPlacement="top"
        />
        <Button
          variant="ghost"
          className="h-9 border border-(--color-accent)/45 px-3 text-xs"
          disabled={currentPage <= 1 || isPending}
          onClick={onPreviousPage}
        >
          Previous
        </Button>
        <Button
          variant="ghost"
          className="h-9 border border-(--color-accent)/45 px-3 text-xs"
          disabled={currentPage >= totalPages || isPending}
          onClick={onNextPage}
        >
          Next
        </Button>
        <p>
          Page {currentPage} of {totalPages}
        </p>
      </div>
    </footer>
  )
}

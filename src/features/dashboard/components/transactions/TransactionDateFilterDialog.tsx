import { Dialog } from '../../../../components/ui/Dialog.tsx'

type TransactionDateFilterDialogProps = {
  isOpen: boolean
  onClose: () => void
  tempStartDate: string
  tempEndDate: string
  onTempStartDateChange: (value: string) => void
  onTempEndDateChange: (value: string) => void
  onReset: () => void
  onApply: () => void
}

export function TransactionDateFilterDialog({
  isOpen,
  onClose,
  tempStartDate,
  tempEndDate,
  onTempStartDateChange,
  onTempEndDateChange,
  onReset,
  onApply,
}: TransactionDateFilterDialogProps) {
  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Date range"
      description="Narrow results by when the transaction was created."
      maxWidthClassName="max-w-md"
      bodyVariant="framed"
      footer={
        <div className="flex flex-wrap justify-end gap-2">
          <button
            type="button"
            className="tx-history-btn tx-history-btn--ghost"
            onClick={onReset}
          >
            Reset
          </button>
          <button
            type="button"
            className="tx-history-btn tx-history-btn--primary"
            onClick={onApply}
          >
            Apply filter
          </button>
        </div>
      }
    >
      <div className="tx-history-date-panel-fields">
        <label className="tx-history-date-field">
          <span className="tx-history-date-field-label">Start date</span>
          <span className="tx-history-field tx-history-field--date">
            <input
              type="date"
              value={tempStartDate}
              onChange={(event) => onTempStartDateChange(event.target.value)}
            />
          </span>
        </label>
        <label className="tx-history-date-field">
          <span className="tx-history-date-field-label">End date</span>
          <span className="tx-history-field tx-history-field--date">
            <input
              type="date"
              value={tempEndDate}
              min={tempStartDate || undefined}
              onChange={(event) => onTempEndDateChange(event.target.value)}
            />
          </span>
        </label>
      </div>
    </Dialog>
  )
}

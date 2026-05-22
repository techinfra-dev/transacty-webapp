import type { FormEvent } from 'react'
import type { UseMutationResult } from '@tanstack/react-query'
import { Button } from '../../../../components/ui/Button.tsx'
import { Dialog } from '../../../../components/ui/Dialog.tsx'
import { Input } from '../../../../components/ui/Input.tsx'
import type { CreateTransferPayload } from '../../services/transactionsSchemas.ts'

type TransferTransactionDialogProps = {
  isOpen: boolean
  onClose: () => void
  customerWalletId: string
  amount: string
  onAmountChange: (value: string) => void
  reason: string
  onReasonChange: (value: string) => void
  mutation: UseMutationResult<
    unknown,
    Error,
    Omit<CreateTransferPayload, 'environment'>,
    unknown
  >
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

export function TransferTransactionDialog({
  isOpen,
  onClose,
  customerWalletId,
  amount,
  onAmountChange,
  reason,
  onReasonChange,
  mutation,
  onSubmit,
}: TransferTransactionDialogProps) {
  return (
    <Dialog
      isOpen={isOpen}
      onClose={() => {
        if (!mutation.isPending) {
          onClose()
        }
      }}
      title="Create transfer"
      description="Move funds for this customer."
      maxWidthClassName="max-w-md"
    >
      <form className="space-y-3" onSubmit={onSubmit}>
        <input type="hidden" name="customerWalletId" value={customerWalletId} readOnly />

        <label className="space-y-1">
          <span className="[font-family:var(--font-body)] text-xs font-semibold text-(--color-secondary)">
            Amount
          </span>
          <Input
            value={amount}
            onChange={(event) => onAmountChange(event.target.value)}
            required
            className="h-10 bg-(--color-card)"
            placeholder="100.00"
            inputMode="decimal"
          />
        </label>

        <label className="space-y-1">
          <span className="[font-family:var(--font-body)] text-xs font-semibold text-(--color-secondary)">
            Reason (optional)
          </span>
          <Input
            value={reason}
            onChange={(event) => onReasonChange(event.target.value)}
            className="h-10 bg-(--color-card)"
            placeholder="Bonus payment"
          />
        </label>

        {mutation.isError ? (
          <p className="[font-family:var(--font-body)] text-sm text-rose-600">
            {mutation.error.message}
          </p>
        ) : null}

        <div className="dialog-action-row mt-3 grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant="ghost"
            className="h-10 w-full px-3 text-xs"
            onClick={onClose}
            disabled={mutation.isPending}
          >
            Cancel
          </Button>
          <Button type="submit" className="h-10 w-full px-3 text-xs" disabled={mutation.isPending}>
            {mutation.isPending ? 'Creating...' : 'Create transfer'}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}

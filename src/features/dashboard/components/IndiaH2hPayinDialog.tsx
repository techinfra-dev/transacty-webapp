import { useState } from 'react'
import { Button } from '../../../components/ui/Button.tsx'
import { Dialog } from '../../../components/ui/Dialog.tsx'
import { Input } from '../../../components/ui/Input.tsx'
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner.tsx'
import {
  useConfirmH2hBuyerPaymentMutation,
  useCreateH2hPayinMutation,
  useH2hPayinInstanceQuery,
} from '../hooks/useH2hMutations.ts'

type IndiaH2hPayinDialogProps = {
  isOpen: boolean
  onClose: () => void
  defaultCustomerWalletId?: string
}

export function IndiaH2hPayinDialog({
  isOpen,
  onClose,
  defaultCustomerWalletId,
}: IndiaH2hPayinDialogProps) {
  const [amount, setAmount] = useState('')
  const [customerWalletId, setCustomerWalletId] = useState(
    defaultCustomerWalletId ?? '',
  )
  const [platformOrderId, setPlatformOrderId] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [activeTransactionId, setActiveTransactionId] = useState<string | null>(
    null,
  )

  const createMutation = useCreateH2hPayinMutation()
  const confirmMutation = useConfirmH2hBuyerPaymentMutation()
  const instanceQuery = useH2hPayinInstanceQuery(activeTransactionId, isOpen)

  async function handleCreate() {
    setError(null)
    const trimmedAmount = amount.trim()
    if (!trimmedAmount) {
      setError('Enter an amount.')
      return
    }
    try {
      const created = await createMutation.mutateAsync({
        amount: trimmedAmount,
        currency: 'INR',
        customerWalletId: customerWalletId.trim() || undefined,
        platformOrderId: platformOrderId.trim() || undefined,
      })
      setActiveTransactionId(created.transactionId)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to create H2H pay-in.',
      )
    }
  }

  async function handleConfirmBuyer() {
    if (!activeTransactionId) {
      return
    }
    setError(null)
    try {
      await confirmMutation.mutateAsync(activeTransactionId)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to confirm buyer payment.',
      )
    }
  }

  function handleClose() {
    if (createMutation.isPending || confirmMutation.isPending) {
      return
    }
    setAmount('')
    setPlatformOrderId('')
    setError(null)
    setActiveTransactionId(null)
    onClose()
  }

  const instance = instanceQuery.data

  return (
    <Dialog
      isOpen={isOpen}
      onClose={handleClose}
      title="India H2H pay-in"
      description="Create a host-to-host pay-in instance, then confirm when the buyer has paid."
      maxWidthClassName="max-w-lg"
      footer={
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="ghost" className="px-4" onClick={handleClose}>
            Close
          </Button>
          {!activeTransactionId ? (
            <Button
              className="px-4"
              onClick={() => void handleCreate()}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? 'Creating…' : 'Create instance'}
            </Button>
          ) : (
            <Button
              className="px-4"
              onClick={() => void handleConfirmBuyer()}
              disabled={confirmMutation.isPending}
            >
              {confirmMutation.isPending
                ? 'Confirming…'
                : 'Buyer confirms payment'}
            </Button>
          )}
        </div>
      }
    >
      {!activeTransactionId ? (
        <div className="space-y-3">
          <label className="block space-y-1">
            <span className="[font-family:var(--font-body)] text-xs font-semibold uppercase tracking-wide text-(--color-secondary)">
              Amount (INR)
            </span>
            <Input
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              inputMode="decimal"
              placeholder="1000.00"
            />
          </label>
          <label className="block space-y-1">
            <span className="[font-family:var(--font-body)] text-xs font-semibold uppercase tracking-wide text-(--color-secondary)">
              Customer wallet ID (optional)
            </span>
            <Input
              value={customerWalletId}
              onChange={(event) => setCustomerWalletId(event.target.value)}
              placeholder="UUID"
            />
          </label>
          <label className="block space-y-1">
            <span className="[font-family:var(--font-body)] text-xs font-semibold uppercase tracking-wide text-(--color-secondary)">
              Platform order ID (optional)
            </span>
            <Input
              value={platformOrderId}
              onChange={(event) => setPlatformOrderId(event.target.value)}
            />
          </label>
        </div>
      ) : instanceQuery.isPending && !instance ? (
        <div className="flex min-h-[120px] items-center justify-center">
          <LoadingSpinner label="Loading instance…" />
        </div>
      ) : (
        <div className="space-y-2 [font-family:var(--font-body)] text-sm text-(--color-primary)">
          <p>
            <span className="text-(--color-secondary)">Transaction · </span>
            <span className="font-mono text-xs">{activeTransactionId}</span>
          </p>
          <p>
            <span className="text-(--color-secondary)">Status · </span>
            {instance?.status ?? '—'}
          </p>
          {instance?.amount ? (
            <p>
              <span className="text-(--color-secondary)">Amount · </span>
              {instance.amount}
              {instance.currency ? ` ${instance.currency}` : ''}
            </p>
          ) : null}
          {instance?.paymentInstructions ? (
            <pre className="mt-2 max-h-40 overflow-auto rounded-lg border border-(--color-accent)/30 bg-(--color-card) p-2 text-[11px] leading-relaxed">
              {JSON.stringify(instance.paymentInstructions, null, 2)}
            </pre>
          ) : null}
        </div>
      )}
      {error ? (
        <p className="mt-3 [font-family:var(--font-body)] text-sm text-rose-600">
          {error}
        </p>
      ) : null}
    </Dialog>
  )
}

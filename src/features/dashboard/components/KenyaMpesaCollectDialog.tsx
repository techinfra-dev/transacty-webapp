import { useMemo, useState } from 'react'
import { Button } from '../../../components/ui/Button.tsx'
import { Dialog } from '../../../components/ui/Dialog.tsx'
import { Input } from '../../../components/ui/Input.tsx'
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner.tsx'
import { useTransactionDetailModalStore } from '../../../store/transactionDetailModalStore.ts'
import {
  useCreateKeCollectMutation,
  useKeCollectQuery,
} from '../hooks/useKeCollectMutations.ts'
import type { KeCollectInstance } from '../services/keCollectSchemas.ts'
import {
  KENYA_COLLECT_MAX_AMOUNT,
  KENYA_COLLECT_MIN_AMOUNT,
  KENYA_PAYOUT_CURRENCY,
  isValidKenyaMsisdn,
  normalizeKenyaMsisdn,
} from '../utils/kenyaMarket.ts'

type KenyaMpesaCollectDialogProps = {
  isOpen: boolean
  onClose: () => void
}

function instructionText(created: KeCollectInstance) {
  const info = created.paymentInstructions
  return (
    info?.message?.trim() ||
    info?.instructions?.trim() ||
    info?.content?.trim() ||
    ''
  )
}

function CollectStatusPanel({ created }: { created: KeCollectInstance }) {
  const openTransactionDetail = useTransactionDetailModalStore(
    (state) => state.openTransactionDetail,
  )
  const transactionId = created.transactionId ?? created.id ?? ''
  const collectQuery = useKeCollectQuery(transactionId, Boolean(transactionId))
  const latest = collectQuery.data ?? created
  const status = latest.status?.trim().toLowerCase() || 'pending'
  const instructions = instructionText(latest)

  return (
    <div className="space-y-4">
      <p className="[font-family:var(--font-body)] text-sm text-(--dash-fg-muted)">
        Status is{' '}
        <span className="capitalize text-(--dash-fg)">{status}</span>
        . Ask the payer to approve the M-Pesa prompt. Money credits after they
        pay.
      </p>

      {instructions ? (
        <p className="rounded-lg border border-(--dash-border) bg-(--dash-surface-2) p-3 [font-family:var(--font-body)] text-sm text-(--dash-fg)">
          {instructions}
        </p>
      ) : null}

      <div className="grid gap-2 sm:grid-cols-2">
        <div>
          <p className="settings-hint">Amount</p>
          <p className="text-sm text-(--dash-fg)">
            {latest.amount ?? '—'}{' '}
            {latest.currency?.toUpperCase() || KENYA_PAYOUT_CURRENCY}
          </p>
        </div>
        <div>
          <p className="settings-hint">Reference</p>
          <p className="text-sm text-(--dash-fg)">
            {latest.reference || latest.merchantReference || '—'}
          </p>
        </div>
      </div>

      {collectQuery.isFetching ? (
        <div className="flex items-center gap-2 text-sm text-(--dash-fg-muted)">
          <LoadingSpinner label="Refreshing collect status…" />
        </div>
      ) : null}

      {transactionId ? (
        <Button
          type="button"
          className="dash-btn-primary"
          onClick={() => openTransactionDetail(transactionId)}
        >
          View transaction
        </Button>
      ) : null}
    </div>
  )
}

export function KenyaMpesaCollectDialog({
  isOpen,
  onClose,
}: KenyaMpesaCollectDialogProps) {
  const createMutation = useCreateKeCollectMutation()
  const [amount, setAmount] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [accountName, setAccountName] = useState('')
  const [merchantReference, setMerchantReference] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [created, setCreated] = useState<KeCollectInstance | null>(null)

  const amountHint = useMemo(
    () =>
      `Limits: ${KENYA_COLLECT_MIN_AMOUNT.toLocaleString('en-US')} – ${KENYA_COLLECT_MAX_AMOUNT.toLocaleString('en-US')} ${KENYA_PAYOUT_CURRENCY}.`,
    [],
  )

  function resetForm() {
    setAmount('')
    setAccountNumber('')
    setAccountName('')
    setMerchantReference('')
    setDescription('')
    setError(null)
    setCreated(null)
    createMutation.reset()
  }

  function handleClose() {
    if (createMutation.isPending) return
    resetForm()
    onClose()
  }

  async function handleCreate() {
    setError(null)
    const parsedAmount = Number(amount.trim().replace(/,/g, ''))
    if (
      !Number.isFinite(parsedAmount) ||
      parsedAmount < KENYA_COLLECT_MIN_AMOUNT ||
      parsedAmount > KENYA_COLLECT_MAX_AMOUNT
    ) {
      setError(
        `Amount must be between ${KENYA_COLLECT_MIN_AMOUNT} and ${KENYA_COLLECT_MAX_AMOUNT.toLocaleString('en-US')} KES.`,
      )
      return
    }
    if (!accountName.trim()) {
      setError('Enter the payer name.')
      return
    }
    if (!isValidKenyaMsisdn(accountNumber)) {
      setError('Enter a valid Kenyan M-Pesa number (2547… or 07…).')
      return
    }

    try {
      const response = await createMutation.mutateAsync({
        amount: parsedAmount.toFixed(2),
        accountNumber: normalizeKenyaMsisdn(accountNumber),
        accountName: accountName.trim(),
        merchantReference: merchantReference.trim() || undefined,
        description: description.trim() || undefined,
      })
      setCreated(response)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to create M-Pesa collect.',
      )
    }
  }

  return (
    <Dialog
      isOpen={isOpen}
      onClose={handleClose}
      title={created ? 'M-Pesa collect created' : 'Kenya M-Pesa collect'}
      description={
        created
          ? 'Ask the payer to approve the M-Pesa prompt. Settlement credits the KES wallet after payment.'
          : `Create a live M-Pesa collect. ${amountHint}`
      }
      maxWidthClassName="max-w-lg"
      footer={
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="ghost" className="px-4" onClick={handleClose}>
            {created ? 'Done' : 'Cancel'}
          </Button>
          {!created ? (
            <Button
              className="px-4"
              onClick={() => void handleCreate()}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? 'Creating…' : 'Create collect'}
            </Button>
          ) : (
            <Button
              className="px-4"
              onClick={() => {
                setCreated(null)
                createMutation.reset()
              }}
            >
              Create another
            </Button>
          )}
        </div>
      }
    >
      {created ? (
        <CollectStatusPanel created={created} />
      ) : (
        <div className="space-y-3">
          {error ? (
            <p className="rounded-lg bg-rose-50 px-3 py-2 [font-family:var(--font-body)] text-sm text-rose-800">
              {error}
            </p>
          ) : null}
          <div>
            <label className="settings-hint" htmlFor="ke-collect-amount">
              Amount (KES)
            </label>
            <Input
              id="ke-collect-amount"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="500.00"
              inputMode="decimal"
              className="mt-1"
              disabled={createMutation.isPending}
            />
          </div>
          <div>
            <label className="settings-hint" htmlFor="ke-collect-name">
              Payer name
            </label>
            <Input
              id="ke-collect-name"
              value={accountName}
              onChange={(event) => setAccountName(event.target.value)}
              placeholder="Jane Doe"
              className="mt-1"
              disabled={createMutation.isPending}
            />
          </div>
          <div>
            <label className="settings-hint" htmlFor="ke-collect-phone">
              M-Pesa number
            </label>
            <Input
              id="ke-collect-phone"
              value={accountNumber}
              onChange={(event) =>
                setAccountNumber(event.target.value.replace(/[^\d+]/g, ''))
              }
              onBlur={() =>
                setAccountNumber((previous) => normalizeKenyaMsisdn(previous))
              }
              placeholder="254712345678"
              inputMode="tel"
              className="mt-1"
              disabled={createMutation.isPending}
            />
          </div>
          <div>
            <label className="settings-hint" htmlFor="ke-collect-ref">
              Reference (optional)
            </label>
            <Input
              id="ke-collect-ref"
              value={merchantReference}
              onChange={(event) => setMerchantReference(event.target.value)}
              placeholder="order-42"
              className="mt-1"
              disabled={createMutation.isPending}
            />
          </div>
          <div>
            <label className="settings-hint" htmlFor="ke-collect-desc">
              Description (optional)
            </label>
            <Input
              id="ke-collect-desc"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Invoice 42"
              className="mt-1"
              disabled={createMutation.isPending}
            />
          </div>
        </div>
      )}
    </Dialog>
  )
}

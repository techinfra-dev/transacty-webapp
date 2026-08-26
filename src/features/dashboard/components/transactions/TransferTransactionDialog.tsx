import { useEffect, useMemo, useState, type FormEvent } from 'react'
import type { UseMutationResult } from '@tanstack/react-query'
import { Button } from '../../../../components/ui/Button.tsx'
import { Dialog } from '../../../../components/ui/Dialog.tsx'
import { FormattedMoney } from '../../../../components/ui/FormattedMoney.tsx'
import { Input } from '../../../../components/ui/Input.tsx'
import { getCurrencySymbol } from '../../../../utils/currencyNames.ts'
import type { CreateTransferPayload } from '../../services/transactionsSchemas.ts'

export type TransferDirection = 'credit' | 'debit'

const REASON_PRESETS = [
  'Bonus payment',
  'Refund',
  'Correction',
  'Chargeback',
] as const

const QUICK_AMOUNTS = [25, 50, 100, 250] as const

type TransferTransactionDialogProps = {
  isOpen: boolean
  onClose: () => void
  customerWalletId: string
  walletTitle: string
  currency: string
  balance: number
  amount: string
  onAmountChange: (value: string) => void
  direction: TransferDirection
  onDirectionChange: (value: TransferDirection) => void
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

function CloseIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4 fill-current" aria-hidden>
      <path d="M5.22 5.22a.75.75 0 0 1 1.06 0L10 8.94l3.72-3.72a.75.75 0 1 1 1.06 1.06L11.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06L10 11.06l-3.72 3.72a.75.75 0 1 1-1.06-1.06L8.94 10 5.22 6.28a.75.75 0 0 1 0-1.06Z" />
    </svg>
  )
}

/** Iconify Phosphor: ph:arrows-left-right-bold */
function TransferIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 256 256"
      className={className}
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path d="m216.49 184.49l-32 32a12 12 0 0 1-17-17L179 188H48a12 12 0 0 1 0-24h131l-11.52-11.51a12 12 0 0 1 17-17l32 32a12 12 0 0 1 .01 17m-145-64a12 12 0 0 0 17-17L77 92h131a12 12 0 0 0 0-24H77l11.49-11.51a12 12 0 0 0-17-17l-32 32a12 12 0 0 0 0 17Z" />
    </svg>
  )
}

function parseAmount(value: string) {
  const normalized = value.trim().replace(/,/g, '')
  if (!normalized) {
    return 0
  }
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : Number.NaN
}

export function TransferTransactionDialog({
  isOpen,
  onClose,
  customerWalletId,
  walletTitle,
  currency,
  balance,
  amount,
  onAmountChange,
  direction,
  onDirectionChange,
  reason,
  onReasonChange,
  mutation,
  onSubmit,
}: TransferTransactionDialogProps) {
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null)
  const currencyCode = currency.trim().toUpperCase()
  const symbol = getCurrencySymbol(currencyCode) ?? currencyCode
  const amountValue = parseAmount(amount)
  const afterBalance = useMemo(() => {
    if (!Number.isFinite(amountValue) || amountValue < 0) {
      return balance
    }
    return direction === 'credit' ? balance + amountValue : balance - amountValue
  }, [amountValue, balance, direction])

  const canSubmit =
    Number.isFinite(amountValue) &&
    amountValue > 0 &&
    reason.trim().length > 0 &&
    (direction === 'credit' || afterBalance >= 0)

  useEffect(() => {
    if (!isOpen) {
      setSelectedPreset(null)
    }
  }, [isOpen])

  return (
    <Dialog
      isOpen={isOpen}
      onClose={() => {
        if (!mutation.isPending) {
          onClose()
        }
      }}
      showCloseButton={false}
      bodyVariant="plain"
      maxWidthClassName="max-w-lg"
      contentClassName="cd-transfer-dialog-body"
      footerClassName="cd-transfer-dialog-footer"
      footer={
        <div className="cd-transfer-dialog-actions">
          <Button
            type="button"
            variant="ghost"
            className="h-10 px-4 text-sm"
            onClick={onClose}
            disabled={mutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="cd-transfer-form"
            className="h-10 px-4 text-sm"
            disabled={mutation.isPending || !canSubmit}
          >
            {mutation.isPending
              ? direction === 'credit'
                ? 'Crediting…'
                : 'Debiting…'
              : direction === 'credit'
                ? 'Credit wallet'
                : 'Debit wallet'}
          </Button>
        </div>
      }
    >
      <form id="cd-transfer-form" className="cd-transfer-dialog" onSubmit={onSubmit}>
        <input type="hidden" name="customerWalletId" value={customerWalletId} readOnly />

        <header className="cd-transfer-dialog-head">
          <span className="cd-transfer-dialog-icon" aria-hidden>
            <TransferIcon className="h-5 w-5" />
          </span>
          <div className="cd-transfer-dialog-head-copy">
            <h2 className="cd-transfer-dialog-title">New transfer</h2>
            <p className="cd-transfer-dialog-subtitle">
              Adjust <strong>{walletTitle}</strong>
              ’s {currencyCode} wallet balance by hand. This is recorded against
              your admin account.
            </p>
          </div>
          <button
            type="button"
            className="cd-transfer-dialog-close"
            onClick={onClose}
            aria-label="Close"
            disabled={mutation.isPending}
          >
            <CloseIcon />
          </button>
        </header>

        <div>
          <p className="cd-transfer-label">
            Direction <span className="cd-transfer-required">*</span>
          </p>
          <div className="cd-transfer-direction" role="group" aria-label="Transfer direction">
            <button
              type="button"
              className={`cd-transfer-direction-btn${direction === 'credit' ? ' cd-transfer-direction-btn--credit' : ''}`}
              onClick={() => onDirectionChange('credit')}
              disabled={mutation.isPending}
            >
              <span className="cd-transfer-direction-sign">+</span>
              Credit — add funds
            </button>
            <button
              type="button"
              className={`cd-transfer-direction-btn${direction === 'debit' ? ' cd-transfer-direction-btn--debit' : ''}`}
              onClick={() => onDirectionChange('debit')}
              disabled={mutation.isPending}
            >
              <span className="cd-transfer-direction-sign">−</span>
              Debit — remove funds
            </button>
          </div>
        </div>

        <div>
          <p className="cd-transfer-label">
            Amount <span className="cd-transfer-required">*</span>
          </p>
          <label className="cd-transfer-amount-field">
            <span className="cd-transfer-amount-symbol" aria-hidden>
              {symbol}
            </span>
            <input
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(event) => onAmountChange(event.target.value)}
              placeholder="0.00"
              required
              disabled={mutation.isPending}
              aria-label="Transfer amount"
            />
            <span className="cd-transfer-amount-code">{currencyCode}</span>
          </label>
          <div className="cd-transfer-pills" role="group" aria-label="Quick amounts">
            {QUICK_AMOUNTS.map((quick) => (
              <button
                key={quick}
                type="button"
                className="cd-transfer-pill"
                onClick={() => onAmountChange(quick.toFixed(2))}
                disabled={mutation.isPending}
              >
                {symbol}
                {quick}
              </button>
            ))}
          </div>
        </div>

        <div className="cd-transfer-preview" aria-live="polite">
          <div>
            <p className="cd-transfer-preview-label">Balance now</p>
            <p className="cd-transfer-preview-value">
              <FormattedMoney currency={currencyCode} value={balance} />
            </p>
          </div>
          <span className="cd-transfer-preview-arrow" aria-hidden>
            →
          </span>
          <div>
            <p className="cd-transfer-preview-label">After transfer</p>
            <p
              className={`cd-transfer-preview-value${afterBalance < 0 ? ' cd-transfer-preview-value--warn' : ''}`}
            >
              <FormattedMoney currency={currencyCode} value={afterBalance} />
            </p>
          </div>
        </div>

        <div>
          <p className="cd-transfer-label">
            Reason <span className="cd-transfer-required">*</span>
          </p>
          <div className="cd-transfer-pills" role="group" aria-label="Reason presets">
            {REASON_PRESETS.map((preset) => {
              const selected = selectedPreset === preset
              return (
                <button
                  key={preset}
                  type="button"
                  className={`cd-transfer-pill${selected ? ' cd-transfer-pill--active' : ''}`}
                  onClick={() => {
                    setSelectedPreset(preset)
                    onReasonChange(preset)
                  }}
                  disabled={mutation.isPending}
                >
                  {preset}
                </button>
              )
            })}
          </div>
          <Input
            placeholder="Or type your own reason"
            value={reason}
            onChange={(event) => {
              setSelectedPreset(null)
              onReasonChange(event.target.value)
            }}
            required
            disabled={mutation.isPending}
            className="cd-transfer-reason-input"
          />
        </div>

        {direction === 'debit' && afterBalance < 0 ? (
          <p className="[font-family:var(--font-body)] text-sm text-rose-600">
            Debit amount exceeds the current wallet balance.
          </p>
        ) : null}

        {mutation.isError ? (
          <p className="[font-family:var(--font-body)] text-sm text-rose-600">
            {mutation.error.message}
          </p>
        ) : null}
      </form>
    </Dialog>
  )
}

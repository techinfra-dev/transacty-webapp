import { useEffect, useState } from 'react'
import { Button } from '../../../../components/ui/Button.tsx'
import { Dialog } from '../../../../components/ui/Dialog.tsx'
import { FormattedMoney } from '../../../../components/ui/FormattedMoney.tsx'
import { Input } from '../../../../components/ui/Input.tsx'
import type { CustomerStatus } from '../../services/customersSchemas.ts'
import { LoadingButtonLabel } from './customerViewUtils.tsx'

const REASON_PRESETS = [
  'Fraud investigation',
  'Customer request',
  'Compliance hold',
  'Duplicate account',
] as const

type CustomerUpdateStatusDialogProps = {
  isOpen: boolean
  onClose: () => void
  walletTitle: string
  currency: string
  balance: number
  currentStatus: CustomerStatus
  nextStatus: string
  onNextStatusChange: (value: string) => void
  statusReason: string
  onStatusReasonChange: (value: string) => void
  isPending: boolean
  error: string | null
  savedFlash: boolean
  onConfirm: () => void
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4 fill-current" aria-hidden>
      <path d="M5.22 5.22a.75.75 0 0 1 1.06 0L10 8.94l3.72-3.72a.75.75 0 1 1 1.06 1.06L11.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06L10 11.06l-3.72 3.72a.75.75 0 1 1-1.06-1.06L8.94 10 5.22 6.28a.75.75 0 0 1 0-1.06Z" />
    </svg>
  )
}

/** Iconify Phosphor: ph:snowflake-bold */
function SnowflakeIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 256 256"
      className={className}
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path d="M227.65 149.14a12 12 0 0 1-8.79 14.51l-20.67 5.08l5.4 20.16a12 12 0 0 1-23.18 6.22l-7.29-27.2L140 148.78V187l20.48 20.48a12 12 0 0 1-17 17L128 209l-15.51 15.52a12 12 0 0 1-17-17L116 187v-38.22l-33.12 19.13l-7.29 27.2a12 12 0 0 1-23.18-6.22l5.4-20.16l-20.67-5.08a12 12 0 1 1 5.72-23.3l27.89 6.85L104 128l-33.25-19.2l-27.89 6.85A11.8 11.8 0 0 1 40 116a12 12 0 0 1-2.85-23.65l20.67-5.08l-5.4-20.16a12 12 0 0 1 23.18-6.22l7.29 27.2L116 107.21V69L95.52 48.48a12 12 0 0 1 17-17L128 47l15.51-15.52a12 12 0 1 1 17 17L140 69v38.24l33.12-19.12l7.29-27.2a12 12 0 0 1 23.18 6.22l-5.4 20.16l20.67 5.08A12 12 0 0 1 216 116a11.8 11.8 0 0 1-2.87-.35l-27.89-6.85L152 128l33.25 19.2l27.89-6.85a12 12 0 0 1 14.51 8.79" />
    </svg>
  )
}

function WarnIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-3.5 w-3.5 fill-current" aria-hidden>
      <path
        fillRule="evenodd"
        d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.168 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 6.25a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 6.25Zm0 8a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
        clipRule="evenodd"
      />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-3.5 w-3.5 fill-current" aria-hidden>
      <path
        fillRule="evenodd"
        d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
        clipRule="evenodd"
      />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-3.5 w-3.5 fill-current" aria-hidden>
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm.75-12.75a.75.75 0 0 0-1.5 0v4.5c0 .192.168.1.5.75h3.25a.75.75 0 0 0 0-1.5H10.75V5.25Z"
        clipRule="evenodd"
      />
    </svg>
  )
}

function copyForStatus(nextStatus: string, currentStatus: CustomerStatus) {
  if (nextStatus === 'frozen') {
    return {
      title: 'Freeze this wallet?',
      subtitleVerb: 'Freezing',
      confirmLabel: 'Freeze wallet',
      effects: [
        {
          tone: 'warn' as const,
          before: 'Incoming pay-ins are ',
          emphasis: 'rejected',
          after: ' at the point of payment.',
        },
        {
          tone: 'warn' as const,
          before: 'Payouts and transfers out are ',
          emphasis: 'blocked',
          after: '.',
        },
        {
          tone: 'ok' as const,
          before: 'The balance is ',
          emphasis: 'preserved',
          after: ' and released on unfreeze.',
        },
      ],
    }
  }

  if (nextStatus === 'active' && currentStatus === 'frozen') {
    return {
      title: 'Unfreeze this wallet?',
      subtitleVerb: 'Unfreezing',
      confirmLabel: 'Unfreeze wallet',
      effects: [
        {
          tone: 'ok' as const,
          before: 'Pay-ins can ',
          emphasis: 'resume',
          after: ' for this customer wallet.',
        },
        {
          tone: 'ok' as const,
          before: 'Payouts and transfers out are ',
          emphasis: 'allowed',
          after: ' again.',
        },
        {
          tone: 'ok' as const,
          before: 'Existing balance stays ',
          emphasis: 'available',
          after: ' immediately.',
        },
      ],
    }
  }

  if (nextStatus === 'closed') {
    return {
      title: 'Close this wallet?',
      subtitleVerb: 'Closing',
      confirmLabel: 'Close wallet',
      effects: [
        {
          tone: 'warn' as const,
          before: 'The wallet becomes ',
          emphasis: 'inactive',
          after: ' for new money movement.',
        },
        {
          tone: 'warn' as const,
          before: 'Pay-ins, payouts and transfers are ',
          emphasis: 'blocked',
          after: '.',
        },
        {
          tone: 'ok' as const,
          before: 'History remains ',
          emphasis: 'visible',
          after: ' for audit and support.',
        },
      ],
    }
  }

  return {
    title: 'Update wallet status?',
    subtitleVerb: 'This change',
    confirmLabel: 'Update status',
    effects: [
      {
        tone: 'ok' as const,
        before: 'Status is applied ',
        emphasis: 'immediately',
        after: ' for this customer wallet.',
      },
      {
        tone: 'ok' as const,
        before: 'Your team can see the change in the ',
        emphasis: 'activity log',
        after: '.',
      },
      {
        tone: 'ok' as const,
        before: 'You can change status again ',
        emphasis: 'at any time',
        after: '.',
      },
    ],
  }
}

const STATUS_OPTIONS: Array<{ id: CustomerStatus; label: string }> = [
  { id: 'active', label: 'Active' },
  { id: 'frozen', label: 'Frozen' },
  { id: 'pending', label: 'Pending' },
  { id: 'closed', label: 'Closed' },
]

export function CustomerUpdateStatusDialog({
  isOpen,
  onClose,
  walletTitle,
  currency,
  balance,
  currentStatus,
  nextStatus,
  onNextStatusChange,
  statusReason,
  onStatusReasonChange,
  isPending,
  error,
  savedFlash,
  onConfirm,
}: CustomerUpdateStatusDialogProps) {
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null)
  const copy = copyForStatus(nextStatus, currentStatus)
  const reasonRequired = nextStatus === 'frozen' || nextStatus === 'closed'
  const reasonMissing = reasonRequired && statusReason.trim().length === 0

  useEffect(() => {
    if (!isOpen) {
      setSelectedPreset(null)
    }
  }, [isOpen])

  return (
    <Dialog
      isOpen={isOpen}
      onClose={() => {
        if (!isPending) {
          onClose()
        }
      }}
      showCloseButton={false}
      bodyVariant="plain"
      maxWidthClassName="max-w-lg"
      contentClassName="cd-status-dialog-body"
      footerClassName="cd-status-dialog-footer"
      footer={
        <div className="cd-status-dialog-actions">
          <Button
            type="button"
            variant="ghost"
            className="h-10 px-4 text-sm"
            disabled={isPending}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="cd-status-dialog-confirm h-10 px-4 text-sm"
            disabled={isPending || reasonMissing || nextStatus === currentStatus}
            onClick={onConfirm}
          >
            {isPending ? (
              <LoadingButtonLabel label="Updating…" />
            ) : (
              <>
                <SnowflakeIcon className="h-4 w-4 shrink-0" />
                {copy.confirmLabel}
              </>
            )}
          </Button>
        </div>
      }
    >
      <div className="cd-status-dialog">
        <header className="cd-status-dialog-head">
          <span className="cd-status-dialog-icon" aria-hidden>
            <SnowflakeIcon className="h-5 w-5" />
          </span>
          <div className="cd-status-dialog-head-copy">
            <h2 className="cd-status-dialog-title">{copy.title}</h2>
            <p className="cd-status-dialog-subtitle">
              {walletTitle} holds{' '}
              <FormattedMoney currency={currency} value={balance} />.{' '}
              {copy.subtitleVerb} takes effect immediately.
            </p>
          </div>
          <button
            type="button"
            className="cd-status-dialog-close"
            onClick={onClose}
            aria-label="Close"
            disabled={isPending}
          >
            <CloseIcon />
          </button>
        </header>

        <div className="cd-status-target">
          <p className="cd-status-label">Status</p>
          <div className="cd-status-pills" role="group" aria-label="Choose status">
            {STATUS_OPTIONS.map((option) => {
              const selected = nextStatus === option.id
              return (
                <button
                  key={option.id}
                  type="button"
                  className={`cd-status-pill${selected ? ' cd-status-pill--active' : ''}`}
                  onClick={() => onNextStatusChange(option.id)}
                  disabled={isPending}
                >
                  {option.label}
                </button>
              )
            })}
          </div>
        </div>

        <ul className="cd-status-effects">
          {copy.effects.map((effect) => (
            <li key={effect.emphasis}>
              <span
                className={`cd-status-effect-icon cd-status-effect-icon--${effect.tone}`}
              >
                {effect.tone === 'ok' ? <CheckIcon /> : <WarnIcon />}
              </span>
              <span>
                {effect.before}
                <strong>{effect.emphasis}</strong>
                {effect.after}
              </span>
            </li>
          ))}
        </ul>

        <div className="cd-status-reason">
          <p className="cd-status-label">
            Reason
            {reasonRequired ? <span className="cd-status-required">*</span> : null}
          </p>
          <div className="cd-status-pills" role="group" aria-label="Reason presets">
            {REASON_PRESETS.map((preset) => {
              const selected = selectedPreset === preset
              return (
                <button
                  key={preset}
                  type="button"
                  className={`cd-status-pill${selected ? ' cd-status-pill--active' : ''}`}
                  onClick={() => {
                    setSelectedPreset(preset)
                    onStatusReasonChange(preset)
                  }}
                  disabled={isPending}
                >
                  {preset}
                </button>
              )
            })}
          </div>
          <Input
            placeholder="Or type your own reason."
            value={statusReason}
            onChange={(event) => {
              setSelectedPreset(null)
              onStatusReasonChange(event.target.value)
            }}
            disabled={isPending}
            className="cd-status-reason-input"
          />
        </div>

        <p className="cd-status-note">
          <ClockIcon />
          <span>
            Recorded in this customer’s activity log against your account, and
            visible to your whole team.
          </span>
        </p>

        {error ? (
          <p className="[font-family:var(--font-body)] text-sm text-rose-600">
            {error}
          </p>
        ) : null}
        {savedFlash ? (
          <p className="[font-family:var(--font-body)] text-sm text-(--dash-success)">
            Status updated.
          </p>
        ) : null}
      </div>
    </Dialog>
  )
}

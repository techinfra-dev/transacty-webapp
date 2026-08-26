import { FormattedMoney } from '../../../../components/ui/FormattedMoney.tsx'
import type { customerTransactionItemSchema } from '../../services/customersSchemas.ts'
import type { z } from 'zod'
import {
  formatDateTime,
  formatRelativeTime,
  toTitleCaseFromSnake,
} from './customerViewUtils.tsx'

type CustomerTx = z.infer<typeof customerTransactionItemSchema>

type CustomerDetailActivityListProps = {
  items: CustomerTx[]
  fallbackCurrency: string
  onOpenTransaction: (transactionId: string) => void
  emptyMessage?: string
}

function isCreditType(type: string | undefined) {
  const normalized = (type ?? '').trim().toLowerCase()
  return (
    normalized === 'transfer' ||
    normalized === 'refund' ||
    normalized === 'payin'
  )
}

function CreditIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4 fill-current" aria-hidden>
      <path d="M10 3.5a.75.75 0 0 1 .75.75v9.19l2.72-2.72a.75.75 0 1 1 1.06 1.06l-4 4a.75.75 0 0 1-1.06 0l-4-4a.75.75 0 0 1 1.06-1.06l2.72 2.72V4.25A.75.75 0 0 1 10 3.5Z" />
    </svg>
  )
}

function DebitIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4 fill-current" aria-hidden>
      <path d="M10 16.5a.75.75 0 0 1-.75-.75V6.56L6.53 9.28a.75.75 0 0 1-1.06-1.06l4-4a.75.75 0 0 1 1.06 0l4 4a.75.75 0 1 1-1.06 1.06L10.75 6.56v9.19a.75.75 0 0 1-.75.75Z" />
    </svg>
  )
}

function activityTitle(tx: CustomerTx) {
  const type = (tx.type ?? '').trim().toLowerCase()
  if (type === 'transfer') return 'Customer transfer'
  if (type === 'refund') return 'Customer refund'
  if (type === 'payin') return 'Customer payin'
  if (type === 'payout') return 'Customer payout'
  return toTitleCaseFromSnake(tx.type ?? 'Transaction')
}

function activityMeta(tx: CustomerTx) {
  const created = tx.createdAt ? formatDateTime(tx.createdAt) : null
  const datePart = created
    ? `${created.primary}${created.secondary ? `, ${created.secondary}` : ''}`
    : null
  const rail = tx.rail?.trim()
  const railLabel =
    rail && rail.toLowerCase() === 'internal'
      ? 'Internal rail'
      : rail
        ? toTitleCaseFromSnake(rail)
        : null
  const shortId = tx.id
    ? tx.id.length > 12
      ? `${tx.id.slice(0, 8)}…`
      : tx.id
    : null
  const bits = [datePart, railLabel || (shortId ? `Ref ${shortId}` : null)].filter(
    Boolean,
  )
  return bits.join(' · ') || '—'
}

export function CustomerDetailActivityList({
  items,
  fallbackCurrency,
  onOpenTransaction,
  emptyMessage = 'No activity yet.',
}: CustomerDetailActivityListProps) {
  if (items.length === 0) {
    return <p className="cd-empty">{emptyMessage}</p>
  }

  return (
    <ul className="cd-activity-list">
      {items.map((tx, index) => {
        const txId = tx.id?.trim()
        const credit = isCreditType(tx.type)
        const amount = Number(tx.amount)
        const safeAmount = Number.isFinite(amount) ? amount : 0
        const currency = (tx.currency ?? fallbackCurrency).trim().toUpperCase()
        const relative = tx.createdAt ? formatRelativeTime(tx.createdAt) : ''

        return (
          <li key={txId ?? `activity-${index}`}>
            <button
              type="button"
              className="cd-activity-row"
              disabled={!txId}
              onClick={() => {
                if (txId) {
                  onOpenTransaction(txId)
                }
              }}
            >
              <span
                className={`cd-activity-icon${credit ? ' cd-activity-icon--in' : ' cd-activity-icon--out'}`}
                aria-hidden
              >
                {credit ? <CreditIcon /> : <DebitIcon />}
              </span>
              <span className="cd-activity-copy">
                <span className="cd-activity-title">{activityTitle(tx)}</span>
                <span className="cd-activity-meta">{activityMeta(tx)}</span>
              </span>
              <span className="cd-activity-right">
                <span
                  className={`cd-activity-amount${credit ? ' cd-activity-amount--in' : ''}`}
                >
                  {credit ? '+' : '−'}
                  <FormattedMoney currency={currency} value={Math.abs(safeAmount)} />
                </span>
                {relative ? (
                  <span className="cd-activity-when">{relative}</span>
                ) : null}
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}

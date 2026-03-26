import { Link } from '@tanstack/react-router'
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner.tsx'
import { useTransactionsListQuery } from '../hooks/useTransactionsQueries.ts'
import type {
  TransactionItem,
  TransactionStatus,
  TransactionType,
} from '../services/transactionsSchemas.ts'

function statusClassName(status: TransactionStatus) {
  if (status === 'success') {
    return 'bg-[#9FBA9A] text-black'
  }
  if (status === 'pending') {
    return 'bg-amber-100 text-amber-700'
  }
  return 'bg-[#E39E9C] text-black'
}

function directionAccentClass(type: TransactionType) {
  return type === 'payin' || type === 'refund'
    ? 'bg-emerald-500/14 text-emerald-700'
    : 'bg-rose-500/14 text-rose-700'
}

function toTitleCaseFromSnake(value: string) {
  return value
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ')
}

function formatMoney(amountText: string) {
  const amountNumber = Number(amountText)
  const amount = Number.isFinite(amountNumber) ? amountNumber : 0
  return `BDT ${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

/** Keeps "01:05 PM" on one line (space before AM/PM is non-breaking). */
function withNoBreakBeforeAmPm(time: string) {
  return time.replace(/ ([AP]M)$/i, '\u00A0$1')
}

function formatDateTime(isoDate: string) {
  const date = new Date(isoDate)
  if (Number.isNaN(date.getTime())) {
    return { dateText: isoDate, timeText: '' }
  }
  return {
    dateText: date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
    timeText: withNoBreakBeforeAmPm(
      date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    ),
  }
}

export function DashboardActivityPanel() {
  const transactionsQuery = useTransactionsListQuery({
    limit: 10,
    offset: 0,
  })
  const displayedActivities = transactionsQuery.data?.items ?? []

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="[font-family:var(--font-display)] text-lg font-semibold text-[#0F0700] md:text-xl">
          Recent activity
        </h2>
        <Link
          to="/dashboard/transactions"
          className="[font-family:var(--font-body)] text-sm font-medium text-[#566167] underline-offset-2 hover:text-[#0F0700] hover:underline"
        >
          View all
        </Link>
      </div>

      <section className="overflow-hidden rounded-xl border border-[#E0DBD2] bg-white shadow-[0_1px_3px_rgba(15,7,0,0.06)]">
        <div className="hidden grid-cols-[132px_1.8fr_124px_108px_124px_108px_138px] gap-3 border-b border-[#E5E0D6] bg-[#F0EDE6] px-5 py-3 [font-family:var(--font-body)] text-[11px] font-semibold uppercase tracking-wide text-[#566167] lg:grid">
        <p>Transaction ID</p>
        <p>Customer</p>
        <p>Method</p>
        <p>Amount</p>
        <p>Fee</p>
        <p>Status</p>
        <p>Date</p>
      </div>

      <div className="max-h-[420px] overflow-y-auto bg-white">
        {transactionsQuery.isPending ? (
          <div className="flex min-h-[180px] items-center justify-center">
            <LoadingSpinner label="Loading activity..." />
          </div>
        ) : transactionsQuery.isError ? (
          <div className="px-5 py-8 text-center [font-family:var(--font-body)] text-sm text-rose-600">
            Unable to load activity right now.
          </div>
        ) : displayedActivities.length === 0 ? (
          <div className="px-5 py-8 text-center [font-family:var(--font-body)] text-sm text-[#566167]">
            No recent activity found.
          </div>
        ) : (
          displayedActivities.map((activity: TransactionItem) => {
            const { dateText, timeText } = formatDateTime(activity.createdAt)
            const isInflow = activity.type === 'payin' || activity.type === 'refund'
            const amountLabel = `${isInflow ? '+' : '-'}${formatMoney(activity.amount)}`

            return (
              <article
                key={activity.id}
                className="grid gap-2 border-b border-[#EDE8E0] bg-white px-5 py-3 transition-colors duration-150 ease-out last:border-b-0 hover:bg-[#F2EFE8] focus-within:bg-[#F2EFE8] lg:grid-cols-[132px_1.8fr_124px_108px_124px_108px_138px] lg:items-center lg:gap-3"
              >
            <div className="grid grid-cols-[auto_1fr_auto] gap-3 lg:hidden">
              <div
                className={`mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-full ${directionAccentClass(
                  activity.type,
                )}`}
              >
                <svg viewBox="0 0 20 20" className="h-3.5 w-3.5 fill-current" aria-hidden="true">
                  {isInflow ? (
                    <path d="M10 3.5a.75.75 0 0 1 .75.75v8.44l2.22-2.22a.75.75 0 1 1 1.06 1.06l-3.5 3.5a.75.75 0 0 1-1.06 0l-3.5-3.5a.75.75 0 0 1 1.06-1.06l2.22 2.22V4.25A.75.75 0 0 1 10 3.5Z" />
                  ) : (
                    <path d="M10 16.5a.75.75 0 0 1-.75-.75V7.31l-2.22 2.22a.75.75 0 1 1-1.06-1.06l3.5-3.5a.75.75 0 0 1 1.06 0l3.5 3.5a.75.75 0 1 1-1.06 1.06l-2.22-2.22v8.44A.75.75 0 0 1 10 16.5Z" />
                  )}
                </svg>
              </div>

              <div className="min-w-0">
                <p className="truncate [font-family:var(--font-display)] text-[0.98rem] font-semibold leading-tight text-(--color-foreground)">
                  {toTitleCaseFromSnake(activity.type)}
                </p>
                <p className="truncate [font-family:var(--font-body)] text-[11px] text-(--color-secondary)">
                  {activity.customerWalletId || 'General ledger'}
                </p>
                <p className="mt-0.5 whitespace-nowrap [font-family:var(--font-body)] text-[11px] text-(--color-secondary)">
                  {dateText}
                  {timeText ? `,\u00A0${timeText}` : ''}
                </p>

                <div className="mt-1 flex flex-wrap items-center gap-2.5 [font-family:var(--font-body)] text-[10px] text-(--color-secondary)">
                  <span>Paid: {formatMoney(activity.paidAmount || activity.amount)}</span>
                  <span>Status: {toTitleCaseFromSnake(activity.status)}</span>
                </div>
              </div>

              <div className="text-right">
                <p
                  className={`[font-family:var(--font-display)] text-[1.7rem] font-semibold leading-tight ${
                    isInflow
                      ? 'text-emerald-600'
                      : 'text-(--color-foreground)'
                  }`}
                >
                  {amountLabel}
                </p>
                <span
                  className={`mt-0.5 inline-flex rounded-full px-2 py-0.5 [font-family:var(--font-body)] text-[11px] font-semibold ${statusClassName(
                    activity.status,
                  )}`}
                >
                  {toTitleCaseFromSnake(activity.status)}
                </span>

                <div className="mt-1.5 flex items-center justify-end gap-1 text-(--color-secondary)">
                  <button
                    type="button"
                    className="inline-flex h-5.5 w-5.5 cursor-pointer items-center justify-center rounded-md border border-(--color-accent)/35"
                    aria-label={`Copy ${activity.id}`}
                  >
                    <svg viewBox="0 0 20 20" className="h-3 w-3 fill-current">
                      <path d="M6 4.75A1.75 1.75 0 0 1 7.75 3h6.5A1.75 1.75 0 0 1 16 4.75v8.5A1.75 1.75 0 0 1 14.25 15h-6.5A1.75 1.75 0 0 1 6 13.25v-8.5Zm-2 2A1.75 1.75 0 0 0 2.25 8.5v7A1.75 1.75 0 0 0 4 17.25h6a.75.75 0 0 0 0-1.5H4a.25.25 0 0 1-.25-.25v-7A.25.25 0 0 1 4 8.25h.75a.75.75 0 0 0 0-1.5H4Z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <p className="hidden max-w-[132px] truncate [font-family:var(--font-body)] text-sm font-medium text-[#0F0700] lg:block">
              {activity.id}
            </p>

            <div className="hidden min-w-0 lg:block">
              <p className="[font-family:var(--font-body)] text-sm text-(--color-foreground)">
                {activity.customerWalletId || 'General ledger'}
              </p>
            </div>

            <p
              className="hidden [font-family:var(--font-body)] text-sm text-(--color-foreground) lg:block"
            >
              {toTitleCaseFromSnake(activity.type)}
            </p>

            <p
              className={`hidden [font-family:var(--font-body)] text-sm lg:block ${
                isInflow
                  ? 'text-emerald-600'
                  : 'text-(--color-foreground)'
              }`}
            >
              {amountLabel}
            </p>

            <p className="hidden [font-family:var(--font-body)] text-sm text-(--color-secondary) lg:block">
              {formatMoney(activity.paidAmount || activity.amount)}
            </p>

            <div className="hidden lg:block">
              <span
                className={`inline-flex rounded-full px-2 py-0.5 [font-family:var(--font-body)] text-xs font-semibold ${statusClassName(
                  activity.status,
                )}`}
              >
                {toTitleCaseFromSnake(activity.status)}
              </span>
            </div>

            <p className="hidden whitespace-nowrap [font-family:var(--font-body)] text-xs text-(--color-secondary) lg:block">
              {dateText}
              {timeText ? `\u00A0${timeText}` : ''}
            </p>
          </article>
            )
          })
        )}
      </div>
      </section>
    </>
  )
}

import { Link } from '@tanstack/react-router'
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner.tsx'
import { useMoneyOverviewQuery } from '../hooks/usePortalDepthQueries.ts'
import type {
  MoneyRailOverviewItem,
  MoneyRailStatusCounts,
} from '../services/moneyOverviewSchemas.ts'

function CountLine({
  label,
  counts,
}: {
  label: string
  counts: MoneyRailStatusCounts
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 [font-family:var(--font-body)] text-xs">
      <span className="text-(--color-secondary)">{label}</span>
      <span className="text-(--color-primary)">
        <span className="tabular-nums">{counts.total}</span>
        <span className="text-(--color-secondary)">
          {' '}
          · {counts.success} ok · {counts.pending} pend · {counts.failed} fail
        </span>
      </span>
    </div>
  )
}

function RailCard({ rail }: { rail: MoneyRailOverviewItem }) {
  const settlement = rail.settlementCurrencies.join(', ') || '—'

  return (
    <article className="rounded-xl border border-(--color-accent)/30 bg-(--color-card) p-3.5 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-300">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="[font-family:var(--font-display)] text-sm font-semibold text-(--color-primary)">
            {rail.displayName}
          </h3>
          <p className="mt-0.5 [font-family:var(--font-body)] text-xs text-(--color-secondary)">
            Settles {settlement}
          </p>
        </div>
        {rail.ready ? (
          <span className="dashboard-pill dashboard-pill-succ">
            <i aria-hidden />
            Ready
          </span>
        ) : (
          <span className="dashboard-pill dashboard-pill-pend">
            <i aria-hidden />
            Locked
          </span>
        )}
      </div>

      <div className="mt-3 space-y-1.5 border-t border-(--color-accent)/25 pt-3">
        <CountLine label="Pay-in" counts={rail.counts.payin} />
        <CountLine label="Pay-out" counts={rail.counts.payout} />
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {rail.capabilities.canCreatePayin ? (
          <span className="dashboard-pill dashboard-pill-neutral">Pay-in</span>
        ) : null}
        {rail.capabilities.canCreatePayout ? (
          <span className="dashboard-pill dashboard-pill-neutral">Pay-out</span>
        ) : null}
        {!rail.capabilities.canCreatePayin &&
        !rail.capabilities.canCreatePayout ? (
          <span className="dashboard-pill dashboard-pill-neutral">
            View only
          </span>
        ) : null}
      </div>

      {rail.unlockReason ? (
        <p className="mt-2 [font-family:var(--font-body)] text-[11px] leading-snug text-amber-800">
          {rail.unlockReason}
        </p>
      ) : null}

      {rail.capabilities.integrationHint ? (
        <p className="mt-2 [font-family:var(--font-body)] text-[11px] leading-snug text-(--color-secondary)">
          {rail.capabilities.integrationHint}
        </p>
      ) : null}
    </article>
  )
}

export function MoneyOverviewBoard() {
  const overviewQuery = useMoneyOverviewQuery(true)
  const rails = overviewQuery.data?.rails ?? []

  return (
    <section className="dashboard-card app-page-enter p-4 sm:p-5">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="[font-family:var(--font-display)] text-base font-semibold text-(--color-primary)">
            Money by rail
          </h2>
          <p className="[font-family:var(--font-body)] text-xs text-(--color-secondary)">
            Counts and create paths for the current environment
            {overviewQuery.data?.globalKycStatus
              ? ` · KYC ${overviewQuery.data.globalKycStatus}`
              : ''}
            .
          </p>
        </div>
        <Link
          to="/dashboard/transactions"
          className="dash-btn-outline inline-flex items-center rounded-lg px-3 [font-family:var(--font-body)] text-xs"
        >
          View transactions
        </Link>
      </div>

      {overviewQuery.isPending ? (
        <div className="flex min-h-[100px] items-center justify-center">
          <LoadingSpinner label="Loading money overview…" />
        </div>
      ) : overviewQuery.isError ? (
        <p className="[font-family:var(--font-body)] text-sm text-rose-700">
          {overviewQuery.error instanceof Error
            ? overviewQuery.error.message
            : 'Unable to load money overview.'}
        </p>
      ) : rails.length === 0 ? (
        <p className="[font-family:var(--font-body)] text-sm text-(--color-secondary)">
          No rail overview data yet.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {rails.map((rail) => (
            <RailCard key={rail.market} rail={rail} />
          ))}
        </div>
      )}
    </section>
  )
}

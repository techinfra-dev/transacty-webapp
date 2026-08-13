import { Link } from '@tanstack/react-router'
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner.tsx'
import { useMoneyOverviewQuery } from '../hooks/usePortalDepthQueries.ts'
import { getMarketDisplayName } from '../utils/marketDisplayUtils.ts'
import type { MoneyRailOverviewItem } from '../services/moneyOverviewSchemas.ts'

function railTitle(item: MoneyRailOverviewItem) {
  if (item.displayName?.trim()) {
    return item.displayName.trim()
  }
  return getMarketDisplayName(String(item.rail))
}

export function MoneyOverviewBoard() {
  const overviewQuery = useMoneyOverviewQuery(true)
  const rails =
    overviewQuery.data?.rails ?? overviewQuery.data?.items ?? []

  return (
    <section className="dashboard-card app-page-enter p-4 sm:p-5">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="[font-family:var(--font-display)] text-base font-semibold text-(--color-primary)">
            Money by rail
          </h2>
          <p className="[font-family:var(--font-body)] text-xs text-(--color-secondary)">
            Per-rail counts and create paths for the current environment.
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
          {rails.map((rail, index) => (
            <article
              key={`${rail.rail}-${index}`}
              className="rounded-xl border border-(--color-accent)/30 bg-(--color-card) p-3.5"
            >
              <h3 className="[font-family:var(--font-display)] text-sm font-semibold text-(--color-primary)">
                {railTitle(rail)}
              </h3>
              <p className="mt-2 [font-family:var(--font-body)] text-xs text-(--color-secondary)">
                Pay-in {rail.payinCount ?? '—'} · Pay-out {rail.payoutCount ?? '—'}
                {typeof rail.pendingCount === 'number'
                  ? ` · Pending ${rail.pendingCount}`
                  : ''}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {rail.canCreatePayin ? (
                  <span className="dashboard-pill dashboard-pill-neutral">
                    Can create pay-in
                  </span>
                ) : null}
                {rail.canCreatePayout ? (
                  <span className="dashboard-pill dashboard-pill-neutral">
                    Can create pay-out
                  </span>
                ) : null}
              </div>
              {rail.integrationHint ? (
                <p className="mt-2 [font-family:var(--font-body)] text-[11px] leading-snug text-(--color-secondary)">
                  {rail.integrationHint}
                </p>
              ) : null}
              {rail.createPayinPath || rail.createPayoutPath ? (
                <p className="mt-2 [font-family:var(--font-body)] text-[11px] text-(--color-secondary)">
                  {[
                    rail.createPayinPath
                      ? `Pay-in: ${rail.createPayinPath}`
                      : null,
                    rail.createPayoutPath
                      ? `Pay-out: ${rail.createPayoutPath}`
                      : null,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

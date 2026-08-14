import { Link } from '@tanstack/react-router'
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner.tsx'
import { useMoneyOverviewQuery } from '../hooks/usePortalDepthQueries.ts'
import { RailCard } from './RailCard.tsx'

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

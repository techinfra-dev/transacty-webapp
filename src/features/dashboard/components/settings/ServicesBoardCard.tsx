import { LoadingSpinner } from '../../../../components/ui/LoadingSpinner.tsx'
import { useServicesQuery } from '../../hooks/useServicesQuery.ts'
import { getMarketDisplayName } from '../../utils/marketDisplayUtils.ts'
import { SettingsCard } from './SettingsCard.tsx'

export function ServicesBoardCard() {
  const servicesQuery = useServicesQuery(true)
  const items = servicesQuery.data?.items ?? []
  const markets = servicesQuery.data?.markets ?? []
  const isMarketSnapshot = markets.length > 0 && items.length === 0

  if (servicesQuery.isPending || isMarketSnapshot) {
    return null
  }

  return (
    <SettingsCard
      title="Services board"
      description="Per-environment service readiness for your merchant account."
    >
      {servicesQuery.isPending ? (
        <div className="flex min-h-[80px] items-center justify-center">
          <LoadingSpinner label="Loading services…" />
        </div>
      ) : servicesQuery.isError ? (
        <p className="settings-error settings-error--inline">
          {servicesQuery.error instanceof Error
            ? servicesQuery.error.message
            : 'Unable to load services.'}
        </p>
      ) : items.length === 0 ? (
        <p className="settings-hint">No services returned for this environment.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((service, index) => {
            const title =
              service.displayName ||
              service.name ||
              service.code ||
              service.id ||
              `Service ${index + 1}`
            const marketLabel = service.market
              ? getMarketDisplayName(String(service.market))
              : null
            const blockers = service.blockers ?? []
            return (
              <li
                key={`${service.id ?? service.code ?? title}-${index}`}
                className="rounded-lg border border-(--color-accent)/30 px-3 py-2.5"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="[font-family:var(--font-body)] text-sm font-semibold text-(--color-primary)">
                      {title}
                    </p>
                    <p className="mt-0.5 [font-family:var(--font-body)] text-xs text-(--color-secondary)">
                      {[
                        marketLabel,
                        service.rail,
                        service.status || service.activationStatus,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {service.ready ? (
                      <span className="dashboard-pill dashboard-pill-neutral">
                        Ready
                      </span>
                    ) : null}
                    {service.canRequest ? (
                      <span className="dashboard-pill dashboard-pill-neutral">
                        Can request
                      </span>
                    ) : null}
                    {service.walletsProvisioned ? (
                      <span className="dashboard-pill dashboard-pill-neutral">
                        Wallets provisioned
                      </span>
                    ) : null}
                  </div>
                </div>
                {service.unlockReason || blockers.length > 0 ? (
                  <p className="mt-2 [font-family:var(--font-body)] text-xs text-(--color-secondary)">
                    {blockers.length > 0
                      ? blockers.map((b) => b.message).join(' · ')
                      : service.unlockReason}
                  </p>
                ) : null}
              </li>
            )
          })}
        </ul>
      )}
    </SettingsCard>
  )
}

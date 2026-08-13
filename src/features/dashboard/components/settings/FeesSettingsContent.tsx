import { LoadingSpinner } from '../../../../components/ui/LoadingSpinner.tsx'
import { useMerchantFeesQuery } from '../../hooks/usePortalDepthQueries.ts'
import { SettingsCard } from './SettingsCard.tsx'

function formatBps(value: number | undefined) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return null
  }
  return `${(value / 100).toFixed(2)}%`
}

export function FeesSettingsContent() {
  const feesQuery = useMerchantFeesQuery(true)
  const schedules =
    feesQuery.data?.schedules ?? feesQuery.data?.items ?? []
  const legacy = feesQuery.data?.legacy

  if (feesQuery.isPending) {
    return (
      <div className="settings-loading">
        <LoadingSpinner label="Loading fees…" />
      </div>
    )
  }

  if (feesQuery.isError) {
    return (
      <p className="settings-error">
        {feesQuery.error instanceof Error
          ? feesQuery.error.message
          : 'Unable to load fee schedules.'}
      </p>
    )
  }

  return (
    <div className="settings-stack">
      <SettingsCard
        title="Active fee schedules"
        description="Merchant-facing fees for the current environment. Contact support to change pricing."
      >
        {schedules.length === 0 ? (
          <p className="settings-hint">
            No active fee schedules. Legacy BD rates may still apply.
          </p>
        ) : (
          <ul className="space-y-2">
            {schedules.map((item, index) => (
              <li
                key={item.id ?? `${item.rail}-${item.feeType}-${index}`}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-(--color-accent)/30 px-3 py-2"
              >
                <div>
                  <p className="[font-family:var(--font-body)] text-sm font-medium text-(--color-primary)">
                    {[item.rail || item.market, item.feeType]
                      .filter(Boolean)
                      .join(' · ') || 'Schedule'}
                  </p>
                  <p className="[font-family:var(--font-body)] text-xs text-(--color-secondary)">
                    {[
                      formatBps(item.percentBps),
                      item.flatAmount
                        ? `flat ${item.flatAmount}${item.currency ? ` ${item.currency}` : ''}`
                        : null,
                      item.status,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </SettingsCard>

      {legacy ? (
        <SettingsCard
          title="Legacy BD fallback"
          description="Used when no schedule matches the rail."
        >
          <dl className="grid gap-2 sm:grid-cols-2">
            <div>
              <dt className="settings-hint">Pay-in</dt>
              <dd className="[font-family:var(--font-body)] text-sm text-(--color-primary)">
                {[formatBps(legacy.payinPercentBps), legacy.payinFlat]
                  .filter(Boolean)
                  .join(' + ') || '—'}
              </dd>
            </div>
            <div>
              <dt className="settings-hint">Pay-out</dt>
              <dd className="[font-family:var(--font-body)] text-sm text-(--color-primary)">
                {[formatBps(legacy.payoutPercentBps), legacy.payoutFlat]
                  .filter(Boolean)
                  .join(' + ') || '—'}
              </dd>
            </div>
          </dl>
        </SettingsCard>
      ) : null}
    </div>
  )
}

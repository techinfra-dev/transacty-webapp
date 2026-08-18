import { LoadingSpinner } from '../../../../components/ui/LoadingSpinner.tsx'
import { useMerchantFeesQuery } from '../../hooks/usePortalDepthQueries.ts'
import { isBangladeshRailPausedForMarket } from '../../utils/bangladeshRailPause.ts'
import { getMarketDisplayName } from '../../utils/marketDisplayUtils.ts'
import type { FeeScheduleItem } from '../../services/feesSchemas.ts'
import { SettingsCard } from './SettingsCard.tsx'

function formatFeeType(value: string | undefined) {
  const key = (value ?? '').trim().toLowerCase()
  if (key === 'payin') return 'Pay-in'
  if (key === 'payout') return 'Pay-out'
  if (!key) return null
  return key.charAt(0).toUpperCase() + key.slice(1)
}

function formatStatus(value: string | undefined) {
  const key = (value ?? '').trim()
  if (!key) return null
  return key.charAt(0).toUpperCase() + key.slice(1)
}

function formatPercent(value: string | undefined) {
  if (!value) return null
  const n = Number(value)
  if (!Number.isFinite(n)) return null
  return `${n.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
  })}%`
}

function formatMoneyAmount(value: string | undefined, currency?: string) {
  if (!value) return null
  const n = Number(value)
  if (!Number.isFinite(n) || n === 0) return null
  return `${value}${currency ? ` ${currency}` : ''}`
}

function formatEffectiveFrom(iso: string | null | undefined) {
  if (!iso) return null
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return null
  return `From ${date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })}`
}

function feeRateCopy(item: FeeScheduleItem) {
  const currency = item.currency?.trim().toUpperCase()
  const percent = formatPercent(item.feePercentage)
  const flat = formatMoneyAmount(item.feeFlat ?? item.flatAmount, currency)
  const parts = [percent, flat ? `flat ${flat}` : null].filter(Boolean)
  if (parts.length > 0) {
    return parts.join(' + ')
  }
  if (typeof item.percentBps === 'number' && Number.isFinite(item.percentBps)) {
    return `${(item.percentBps / 100).toFixed(2)}%`
  }
  return '—'
}

export function FeesSettingsContent() {
  const feesQuery = useMerchantFeesQuery(true)
  const schedules = feesQuery.data?.items ?? feesQuery.data?.schedules ?? []
  const legacy = feesQuery.data?.legacy
  const note = feesQuery.data?.note

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
            {schedules.map((item, index) => {
              const railKey = item.rail || item.market || ''
              const isPaused = isBangladeshRailPausedForMarket(railKey)
              const title = [getMarketDisplayName(railKey), formatFeeType(item.feeType)]
                .filter(Boolean)
                .join(' · ')
              const meta = [
                feeRateCopy(item),
                item.currency?.trim().toUpperCase(),
                formatStatus(item.status),
                formatEffectiveFrom(item.effectiveFrom),
              ]
                .filter(Boolean)
                .join(' · ')

              return (
                <li
                  key={item.id ?? `${railKey}-${item.feeType}-${index}`}
                  className={`flex flex-wrap items-center justify-between gap-2 rounded-lg border border-(--color-accent)/30 px-3 py-2.5 ${isPaused ? 'opacity-55 grayscale' : ''}`}
                >
                  <div>
                    <p className="[font-family:var(--font-body)] text-sm font-medium text-(--color-primary)">
                      {title || 'Schedule'}
                    </p>
                    <p className="mt-0.5 [font-family:var(--font-body)] text-xs text-(--color-secondary)">
                      {isPaused ? `Temporarily down · ${meta}` : meta}
                    </p>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
        {note ? <p className="settings-hint mt-3">{note}</p> : null}
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
                {[
                  typeof legacy.payinPercentBps === 'number'
                    ? `${(legacy.payinPercentBps / 100).toFixed(2)}%`
                    : null,
                  legacy.payinFlat,
                ]
                  .filter(Boolean)
                  .join(' + ') || '—'}
              </dd>
            </div>
            <div>
              <dt className="settings-hint">Pay-out</dt>
              <dd className="[font-family:var(--font-body)] text-sm text-(--color-primary)">
                {[
                  typeof legacy.payoutPercentBps === 'number'
                    ? `${(legacy.payoutPercentBps / 100).toFixed(2)}%`
                    : null,
                  legacy.payoutFlat,
                ]
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

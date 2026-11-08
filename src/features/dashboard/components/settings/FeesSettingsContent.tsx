import { useMemo } from 'react'
import { CurrencyMarketAvatar } from '../../../../components/ui/CurrencyMarketAvatar.tsx'
import { LoadingSpinner } from '../../../../components/ui/LoadingSpinner.tsx'
import { useMerchantFeesQuery } from '../../hooks/usePortalDepthQueries.ts'
import { isBangladeshRailPausedForMarket } from '../../utils/bangladeshRailPause.ts'
import {
  getMarketDisplayName,
  uniqueInPreferredOrder,
} from '../../utils/marketDisplayUtils.ts'
import type { FeeScheduleItem } from '../../services/feesSchemas.ts'
import { SettingsCard } from './SettingsCard.tsx'

function formatFeeType(value: string | undefined) {
  const key = (value ?? '').trim().toLowerCase()
  if (key === 'payin') return 'Pay-in'
  if (key === 'payout') return 'Pay-out'
  if (!key) return '—'
  return key.charAt(0).toUpperCase() + key.slice(1)
}

function formatBillingMode(value: string | undefined) {
  const key = (value ?? '').trim()
  if (!key) return null
  return key
    .split(/[_-\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ')
}

function formatStatus(value: string | undefined) {
  const key = (value ?? '').trim().toLowerCase()
  if (!key) return '—'
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
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
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

function scheduleMarketKey(item: FeeScheduleItem) {
  return (item.rail || item.market || 'other').trim().toLowerCase() || 'other'
}

function statusPillClass(status: string | undefined) {
  const key = (status ?? '').trim().toLowerCase()
  if (key === 'active') return 'dashboard-pill dashboard-pill-success'
  if (key === 'inactive' || key === 'disabled' || key === 'expired') {
    return 'dashboard-pill dashboard-pill-neutral'
  }
  return 'dashboard-pill dashboard-pill-neutral'
}

function feeTypeSortRank(feeType: string | undefined) {
  const key = (feeType ?? '').trim().toLowerCase()
  if (key === 'payin') return 0
  if (key === 'payout') return 1
  return 2
}

type FeeMarketGroup = {
  market: string
  items: FeeScheduleItem[]
  isPaused: boolean
}

function groupSchedulesByMarket(schedules: FeeScheduleItem[]): FeeMarketGroup[] {
  const byMarket = new Map<string, FeeScheduleItem[]>()
  for (const item of schedules) {
    const key = scheduleMarketKey(item)
    const list = byMarket.get(key) ?? []
    list.push(item)
    byMarket.set(key, list)
  }

  return uniqueInPreferredOrder(byMarket.keys()).map((market) => {
    const items = [...(byMarket.get(market) ?? [])].sort((a, b) => {
      const typeDelta = feeTypeSortRank(a.feeType) - feeTypeSortRank(b.feeType)
      if (typeDelta !== 0) return typeDelta
      return feeRateCopy(a).localeCompare(feeRateCopy(b))
    })
    return {
      market,
      items,
      isPaused: isBangladeshRailPausedForMarket(market),
    }
  })
}

function formatLegacyRate(percentBps?: number, flat?: string) {
  return (
    [
      typeof percentBps === 'number' ? `${(percentBps / 100).toFixed(2)}%` : null,
      flat,
    ]
      .filter(Boolean)
      .join(' + ') || '—'
  )
}

export function FeesSettingsContent() {
  const feesQuery = useMerchantFeesQuery(true)
  const schedules = feesQuery.data?.items ?? feesQuery.data?.schedules ?? []
  const legacy = feesQuery.data?.legacy
  const note = feesQuery.data?.note

  const marketGroups = useMemo(
    () => groupSchedulesByMarket(schedules),
    [schedules],
  )

  if (feesQuery.isPending) {
    return (
      <div className="settings-loading">
        <LoadingSpinner label="Loading fees…" />
      </div>
    )
  }

  const errorMessage =
    feesQuery.error instanceof Error ? feesQuery.error.message : ''
  // Empty / unconfigured fee catalogs often come back as generic load errors.
  // Prefer the empty-state copy so merchants are not told the system failed.
  const looksLikeNoFees =
    feesQuery.isError &&
    /no fees? applicable|no fee|not configured|not found|no schedules?|unable to load fee schedules|payment_unavailable/i.test(
      errorMessage || 'unable to load fee schedules',
    )

  if (feesQuery.isError && !looksLikeNoFees) {
    return (
      <p className="settings-error">
        {errorMessage || 'Unable to load fee schedules.'}
      </p>
    )
  }

  const showEmpty = schedules.length === 0 || looksLikeNoFees

  return (
    <div className="settings-stack">
      <SettingsCard
        title="Active fee schedules"
        description="Rates for the current environment. Contact support to change pricing."
      >
        {showEmpty ? (
          <p className="settings-hint">No fees applicable.</p>
        ) : (
          <div className="settings-fees-groups">
            {marketGroups.map((group) => (
              <section
                key={group.market}
                className={`settings-fees-group${group.isPaused ? ' settings-fees-group--paused' : ''}`}
              >
                <header className="settings-fees-group-head">
                  <CurrencyMarketAvatar
                    market={group.market}
                    size="sm"
                  />
                  <div className="min-w-0">
                    <h4 className="settings-fees-group-title">
                      {getMarketDisplayName(group.market)}
                    </h4>
                    <p className="settings-fees-group-meta">
                      {group.isPaused
                        ? 'Temporarily down'
                        : `${group.items.length} schedule${group.items.length === 1 ? '' : 's'}`}
                    </p>
                  </div>
                </header>

                <div className="settings-fees-table-wrap">
                  <table className="settings-fees-table">
                    <thead>
                      <tr>
                        <th>Type</th>
                        <th>Rate</th>
                        <th>Currency</th>
                        <th>Status</th>
                        <th>Effective</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.items.map((item, index) => {
                        const billingMode = formatBillingMode(item.billingMode)
                        return (
                          <tr
                            key={
                              item.id ??
                              `${group.market}-${item.feeType}-${index}`
                            }
                          >
                            <td>
                              <div className="settings-fees-type">
                                <span>{formatFeeType(item.feeType)}</span>
                                {billingMode ? (
                                  <span className="settings-fees-type-sub">
                                    {billingMode}
                                  </span>
                                ) : null}
                              </div>
                            </td>
                            <td className="settings-fees-rate">
                              {feeRateCopy(item)}
                            </td>
                            <td className="settings-fees-muted">
                              {item.currency?.trim().toUpperCase() || '—'}
                            </td>
                            <td>
                              <span className={statusPillClass(item.status)}>
                                <i aria-hidden />
                                {formatStatus(item.status)}
                              </span>
                            </td>
                            <td className="settings-fees-muted">
                              {formatEffectiveFrom(item.effectiveFrom)}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            ))}
          </div>
        )}
        {note ? <p className="settings-hint mt-3">{note}</p> : null}
      </SettingsCard>

      {legacy ? (
        <SettingsCard
          title="Legacy BD fallback"
          description="Used when no schedule matches the rail."
        >
          <div className="settings-fees-legacy-grid">
            <div className="settings-fees-legacy-item">
              <p className="settings-fees-legacy-label">Pay-in</p>
              <p className="settings-fees-legacy-value">
                {formatLegacyRate(legacy.payinPercentBps, legacy.payinFlat)}
              </p>
            </div>
            <div className="settings-fees-legacy-item">
              <p className="settings-fees-legacy-label">Pay-out</p>
              <p className="settings-fees-legacy-value">
                {formatLegacyRate(legacy.payoutPercentBps, legacy.payoutFlat)}
              </p>
            </div>
          </div>
        </SettingsCard>
      ) : null}
    </div>
  )
}

import { useState } from 'react'
import { LoadingSpinner } from '../../../../components/ui/LoadingSpinner.tsx'
import { useKycDialogStore } from '../../../../store/kycDialogStore.ts'
import { useMarketsQuery } from '../../hooks/useMarketsQuery.ts'
import { useRequestMarketMutation } from '../../hooks/useRequestMarketMutation.ts'
import { getMarketWalletAction } from '../../utils/balanceWalletUtils.ts'
import {
  canRequestMarketAccess,
  formatEntitlementStatusLabel,
  formatKybStatusLabel,
  getMarketDisplayName,
  isMarketRequestPending,
} from '../../utils/marketDisplayUtils.ts'
import { useBalanceQuery } from '../../hooks/useBalanceQuery.ts'
import type { BalanceWalletItem } from '../../services/balanceSchemas.ts'
import type { PortalMarketRow } from '../../services/marketSchemas.ts'

function MarketSettingsRow({
  market,
  catalog,
}: {
  market: PortalMarketRow
  catalog: BalanceWalletItem[]
}) {
  const requestMutation = useRequestMarketMutation()
  const openKycDialog = useKycDialogStore((state) => state.openDialog)
  const [requested, setRequested] = useState(false)
  const action = getMarketWalletAction(market, catalog)

  const displayName = getMarketDisplayName(market.market)
  const currencies = market.settlementCurrencies.join(', ')

  return (
    <article className="settings-card">
      <div className="settings-card-body flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="settings-card-title">{displayName}</h3>
          <p className="settings-card-desc mt-1">
            Settlement: {currencies}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="dashboard-pill dashboard-pill-neutral">
              {formatEntitlementStatusLabel(market.entitlementStatus)}
            </span>
            <span className="dashboard-pill dashboard-pill-neutral">
              {formatKybStatusLabel(market.kybStatus)}
            </span>
          </div>
          {market.requestedAt ? (
            <p className="settings-card-desc mt-2">
              Requested{' '}
              {new Date(market.requestedAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
          ) : null}
        </div>

        <div className="shrink-0">
          {canRequestMarketAccess(market) && !requested ? (
            <button
              type="button"
              className="dash-btn-primary"
              disabled={requestMutation.isPending}
              onClick={() =>
                requestMutation.mutate(market.market, {
                  onSuccess: () => setRequested(true),
                })
              }
            >
              {requestMutation.isPending ? 'Requesting…' : 'Request access'}
            </button>
          ) : isMarketRequestPending(market) || requested ? (
            <span className="add-wallet-row-pill">Waiting on review</span>
          ) : action === 'complete_kyc' ? (
            <button
              type="button"
              className="dash-btn-outline"
              onClick={() => openKycDialog()}
            >
              Complete verification
            </button>
          ) : market.entitlementStatus === 'approved' ? (
            <span className="add-wallet-row-done">Active</span>
          ) : market.entitlementStatus === 'suspended' ? (
            <span className="add-wallet-row-pill">Contact support</span>
          ) : null}
        </div>
      </div>
      {requestMutation.isError ? (
        <p className="add-wallet-row-error px-4 pb-4">
          {requestMutation.error instanceof Error
            ? requestMutation.error.message
            : 'Unable to request market access.'}
        </p>
      ) : null}
    </article>
  )
}

export function MarketsSettingsContent() {
  const marketsQuery = useMarketsQuery(true)
  const balanceQuery = useBalanceQuery(true)
  const catalog = balanceQuery.data?.items ?? []

  if (marketsQuery.isPending) {
    return (
      <div className="flex min-h-[160px] items-center justify-center">
        <LoadingSpinner label="Loading markets…" />
      </div>
    )
  }

  if (marketsQuery.isError || !marketsQuery.data) {
    return (
      <article className="settings-card">
        <div className="settings-card-body">
          <p className="text-sm text-rose-700">
            Unable to load payment markets. Please try again.
          </p>
        </div>
      </article>
    )
  }

  return (
    <div className="space-y-3">
      <p className="settings-card-desc mb-2">
        Each market has separate KYB. API access for a region is enabled after
        approval.
      </p>
      {marketsQuery.data.map((market) => (
        <MarketSettingsRow key={market.market} market={market} catalog={catalog} />
      ))}
    </div>
  )
}

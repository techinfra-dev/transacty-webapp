import { useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Button } from '../../../components/ui/Button.tsx'
import { useUiPreferencesStore } from '../../../store/uiPreferencesStore.ts'
import { DashboardActivityPanel } from '../components/DashboardActivityPanel.tsx'
import { DashboardWalletDistributionChart } from '../components/DashboardWalletDistributionChart.tsx'
import { DashboardAddWalletCard } from '../components/DashboardAddWalletCard.tsx'
import { AddWalletDialog } from '../components/AddWalletDialog.tsx'
import { DashboardWalletCard } from '../components/DashboardWalletCard.tsx'
import { DashboardWalletsSkeleton } from '../components/DashboardWalletsSkeleton.tsx'
import { useBalanceQuery } from '../hooks/useBalanceQuery.ts'
import { useMarketsQuery } from '../hooks/useMarketsQuery.ts'
import { useProfileQuery } from '../hooks/useProfileQuery.ts'
import {
  getActivatedWallets,
  getAddWalletCatalogRows,
  getCatalogWallets,
} from '../utils/balanceWalletUtils.ts'

function MerchantKycBadge({
  kycStatus,
}: {
  kycStatus: 'pending' | 'verified' | 'rejected' | undefined
}) {
  const base =
    'inline-flex shrink-0 items-center rounded-full px-2 py-0.5 [font-family:var(--font-body)] text-[10.5px] font-semibold motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-left-2 motion-safe:duration-300'
  if (kycStatus === undefined) {
    return (
      <span
        className={`${base} bg-[#E8E4DE] text-[#566167]`}
        aria-hidden
      >
        …
      </span>
    )
  }
  if (kycStatus === 'verified') {
    return (
      <span className={`${base} bg-[#3D6B4F] text-white`}>
        Verified merchant
      </span>
    )
  }
  const label = kycStatus === 'pending' ? 'KYC pending' : 'KYC rejected'
  return <span className={`${base} bg-[#9D8F82] text-white`}>{label}</span>
}

export function DashboardPage() {
  const navigate = useNavigate()
  const areBalancesHidden = useUiPreferencesStore(
    (state) => state.areBalancesHidden,
  )
  const toggleBalancesVisibility = useUiPreferencesStore(
    (state) => state.toggleBalancesVisibility,
  )
  const walletsQuery = useBalanceQuery(true)
  const marketsQuery = useMarketsQuery(true)
  const profileQuery = useProfileQuery(true)
  const [isAddWalletOpen, setIsAddWalletOpen] = useState(false)

  const wallets = walletsQuery.data
    ? getActivatedWallets(walletsQuery.data)
    : null
  const catalog = getCatalogWallets(walletsQuery.data)
  const markets = marketsQuery.data ?? []
  const addableWallets = useMemo(() => {
    if (!marketsQuery.data) {
      return []
    }
    return getAddWalletCatalogRows(markets, catalog)
  }, [markets, catalog, marketsQuery.data])
  const canAddWallet = addableWallets.length > 0

  const outlineBtn = 'dash-btn-outline'

  return (
    <>
      <header className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="dash-page-title">Dashboard</h1>
            <MerchantKycBadge kycStatus={profileQuery.data?.kycStatus} />
          </div>
          <p className="dash-page-subtitle">
            Monitor transactions, customers, and payouts at a glance.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <Button
            variant="ghost"
            className={outlineBtn}
            onClick={() => walletsQuery.refetch()}
            disabled={walletsQuery.isRefetching}
          >
            {walletsQuery.isRefetching ? (
              <span className="inline-flex items-center gap-2">
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-(--dash-fg-muted)/35 border-t-(--dash-fg-muted)" />
                Refreshing...
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5">
                <svg
                  viewBox="0 0 24 24"
                  className="h-3.5 w-3.5 shrink-0 text-(--dash-fg-muted)"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh balances
              </span>
            )}
          </Button>
          <Button
            variant="ghost"
            className={outlineBtn}
            onClick={toggleBalancesVisibility}
          >
            {areBalancesHidden ? 'Show balances' : 'Hide balances'}
          </Button>

          <Button
            className="dash-btn-primary"
            onClick={() => navigate({ to: '/dashboard/payouts' })}
          >
            Request payout
          </Button>
        </div>
      </header>

      {walletsQuery.isPending ? (
        <DashboardWalletsSkeleton />
      ) : walletsQuery.isError || wallets === null ? (
        <section className="rounded-xl border border-rose-200 bg-rose-50 p-4">
          <p className="[font-family:var(--font-body)] text-sm text-rose-700">
            Unable to load merchant wallets right now.
          </p>
        </section>
      ) : (
        <section className="dashboard-wallets-grid">
          {wallets.map((wallet) => {
            const amount = Number(wallet.balance)
            const safeAmount = Number.isFinite(amount) ? amount : 0
            return (
              <DashboardWalletCard
                key={wallet.id}
                walletId={wallet.id}
                currency={wallet.currency}
                amount={safeAmount}
                areBalancesHidden={areBalancesHidden}
                statusLabel={wallet.status}
                displayLabel={wallet.displayLabel}
              />
            )
          })}
          {canAddWallet ? (
            <DashboardAddWalletCard onClick={() => setIsAddWalletOpen(true)} />
          ) : null}
        </section>
      )}

      <section className="mt-4 grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(240px,300px)] lg:items-start">
        <DashboardActivityPanel />
        <DashboardWalletDistributionChart />
      </section>

      <AddWalletDialog
        isOpen={isAddWalletOpen}
        onClose={() => setIsAddWalletOpen(false)}
        markets={markets}
        catalog={catalog}
      />
    </>
  )
}
